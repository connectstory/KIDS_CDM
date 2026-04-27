package kr.or.kids.domain.cm.upload.service;

import com.opencsv.CSVParser;
import com.opencsv.CSVParserBuilder;
import kr.or.kids.domain.cm.upload.mapper.rule.RuleConsistencyMapper;
import kr.or.kids.domain.cm.upload.model.RuleConsistencyRow;
import kr.or.kids.domain.cm.upload.util.RuleTableNameUtils;
import kr.or.kids.domain.cm.upload.controller.CsvLoader;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import kr.or.kids.domain.cm.upload.dto.AnalysisRequest;
import kr.or.kids.domain.cm.upload.dto.CommitRequest;
import kr.or.kids.domain.cm.upload.dto.CommitResponse;
import kr.or.kids.domain.cm.upload.dto.CommitTableResult;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import kr.or.kids.global.security.SqlIdentifierGuard;
import lombok.RequiredArgsConstructor;
import org.apache.poi.util.RecordFormatException;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.BufferedReader;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class CommitService {

    private static final Set<String> SENTINEL_TMPR_TABLES = Set.of(
            "tb_cm_i_tmpr_enrollment",
            "tb_cm_i_tmpr_demographic",
            "tb_cm_i_tmpr_encounter",
            "tb_cm_i_tmpr_diagnosis",
            "tb_cm_i_tmpr_dispensing",
            "tb_cm_i_tmpr_vital_signs",
            "tb_cm_i_tmpr_procedure",
            "tb_cm_i_tmpr_laboratory_result"
    );
    
    private static final Map<String, String> CDM_PK_AUTO_FILL = Map.of(
            "tb_cm_i_tmpr_visit_occurrence", "visit_occurrence_id",
            "tb_cm_i_tmpr_drug_exposure", "drug_exposure_id",
            "tb_cm_i_tmpr_condition_occurrence", "condition_occurrence_id",
            "tb_cm_i_tmpr_procedure_occurrence", "procedure_occurrence_id",
            "tb_cm_i_tmpr_measurement", "measurement_id",
            "tb_cm_i_tmpr_observation_period", "observation_period_id"
    );
    
    private static final Map<String, List<String>> HEADER_TO_EXPECTED_ALIASES = Map.of(
            "visit_end_datetime", List.of("visit_end_date"),
            "measurement_date", List.of("measurement_datetime")
    );
    private static final String COL_INST_TASK_SN = "inst_task_sn";

    private final JdbcTemplate jdbcTemplate;
    private final CsvLoader csvUtil;
    private final RuleConsistencyMapper ruleConsistencyMapper;

    @Value("${app.upload.root:./storage/uploads}")
    private Path uploadRoot;

    @Value("${app.schema:kids_link_own}")
    private String dbSchema;

    /**
     * commit 처리를 수행한다.
     *
     * @param req req
     * @return 처리 결과
     */
    public CommitResponse commit(CommitRequest req) throws Exception {
        double threshold = (req == null) ? 0.9 : req.threshold();
        if (threshold <= 0 || threshold > 1.0) threshold = 0.9;

        if (req == null || req.tables() == null || req.tables().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tables is empty");
        }

        boolean append = Boolean.TRUE.equals(req.append());
        Map<String, CommitTableResult> results = new LinkedHashMap<>();
        for (AnalysisRequest t : req.tables()) {
            CommitTableResult r = commitOne(t, threshold, append);
            
            results.put(t.tableName() + "|" + t.storedName(), r);
        }
        return new CommitResponse(true, results);
    }

    private static final String TABLE_PREFIX = "tb_cm_i_tmpr_";

    
    private static String ensureTableName(String tableName) {
        if (tableName == null) return null;
        String t = tableName.trim().toLowerCase(Locale.ROOT);
        if (t.startsWith(TABLE_PREFIX)) return t;
        if (t.startsWith("tb_cm_i_")) t = t.substring(8);
        else if (t.startsWith("cdm_")) t = t.substring(4);
        return TABLE_PREFIX + t;
    }

    
    private static String toSlotName(String tableName) {
        if (tableName == null) return null;
        if (tableName.startsWith(TABLE_PREFIX)) return tableName.substring(TABLE_PREFIX.length());
        if (tableName.startsWith("cdm_")) return tableName.substring(4);
        return tableName;
    }

    private String safeSchema() {
        return SqlIdentifierGuard.requireValidIdentifier(dbSchema, "schema");
    }

    private String safeTable(String tableName) {
        return SqlIdentifierGuard.requireValidIdentifier(tableName, "table");
    }

    private String safeQualifiedTable(String tableName) {
        return SqlIdentifierGuard.qualify(safeSchema(), safeTable(tableName));
    }

    
    private String resolvePhysicalTableName(String tableName) {
        if (tableName == null || !tableName.endsWith("_death")) return tableName;
        try {
            Boolean exists = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?)",
                Boolean.class, dbSchema, tableName);
            if (Boolean.TRUE.equals(exists)) return tableName;
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
        return "death";
    }

    private CommitTableResult commitOne(AnalysisRequest t, double threshold, boolean append) throws Exception {
        String rawTableName = t.tableName().toLowerCase(Locale.ROOT).trim();
        String cdmTableName = ensureTableName(rawTableName);
        String physicalTable = resolvePhysicalTableName(cdmTableName);
        String slotName = toSlotName(cdmTableName);
        String storedName = t.storedName();

        if (SENTINEL_TMPR_TABLES.contains(cdmTableName)) {
            
            threshold = 1.0;
        }

        String vrfcLookupKey = RuleTableNameUtils.shortTableName(cdmTableName);
        List<RuleConsistencyRow> nameRules = ruleConsistencyMapper.findByTableAndRule(dbSchema, vrfcLookupKey, "field name consistency");
        if (nameRules.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "tb_cm_m_vrfc에 field name consistency 룰이 없습니다(테이블: " + vrfcLookupKey + ")");
        }
        List<String> expectedCols = nameRules.stream()
                .map(RuleConsistencyRow::getField)
                .filter(f -> f != null && !f.isBlank())
                .toList();
        if (expectedCols.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "field name consistency 룰에 기대 컬럼(vrfc_col_nm)이 없습니다: " + vrfcLookupKey);
        }

        Path csvPath = csvUtil.resolveCsvPath(uploadRoot, slotName, storedName);

        List<RuleConsistencyRow> typeRules = ruleConsistencyMapper.findByTableAndRule(dbSchema, vrfcLookupKey, "field type consistency");
        Map<String, String> typeByField = buildTypeMap(typeRules);
        Set<String> requiredFields = new HashSet<>();
        for (RuleConsistencyRow r : typeRules) {
            if (Boolean.TRUE.equals(r.getRequired()) && r.getField() != null) {
                requiredFields.add(r.getField());
            }
        }

        String fileName = csvPath.getFileName().toString().toLowerCase(Locale.ROOT);
        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            return commitExcel(physicalTable, storedName, csvPath, threshold, expectedCols, requiredFields, typeByField, append);
        }
        return commitCsv(physicalTable, storedName, csvPath, threshold, expectedCols, requiredFields, typeByField, append);
    }

    private CommitTableResult commitCsv(
            String tableName,
            String storedName,
            Path csvPath,
            double threshold,
            List<String> expectedCols,
            Set<String> requiredFields,
            Map<String, String> typeByField,
            boolean append
    ) throws Exception {
        try (BufferedReader br = Files.newBufferedReader(csvPath, StandardCharsets.UTF_8)) {
            
            boolean isTsv = csvPath.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".tsv");
            CSVParser parser = new CSVParserBuilder().withSeparator(isTsv ? '\t' : ',').build();
            try (CSVReader reader = new CSVReaderBuilder(br).withCSVParser(parser).build()) {

            String[] headerRaw = reader.readNext();
            if (headerRaw == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CSV header is empty: " + csvPath);
            }

            List<String> header = Arrays.stream(headerRaw).map(this::stripBom).map(String::trim).toList();
            Iterator<String[]> it = new Iterator<>() {
                String[] next;
                boolean loaded;
                @Override public boolean hasNext() {
                    if (!loaded) {
                        try { next = reader.readNext(); } catch (Exception e) { throw new RuntimeException(e); }
                        loaded = true;
                    }
                    return next != null;
                }
                @Override public String[] next() {
                    if (!hasNext()) throw new NoSuchElementException();
                    loaded = false;
                    return next;
                }
            };

            return commitTabular(tableName, storedName, csvPath, threshold, expectedCols, requiredFields, typeByField, header, it, append);
            }
        }
    }

    private static List<String> readExcelHeaderCells( Row headerRow, int lastCell, DataFormatter fmt, FormulaEvaluator eval ) {
        List<String> header = new ArrayList<>(lastCell);
        for (int i = 0; i < lastCell; i++) {
            Cell cell = headerRow.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            String v = (cell == null) ? "" : fmt.formatCellValue(cell, eval);
            header.add(v == null ? "" : v.trim());
        }
        return header;
    }

    
    private static final class ExcelDataRowIterator implements Iterator<String[]> {
        private final Sheet sheet;
        private final int lastCell;
        private final DataFormatter fmt;
        private final FormulaEvaluator eval;
        private int r;
        private final int lastRow;
        private String[] next;
        private boolean loaded;

        ExcelDataRowIterator( Sheet sheet, int headerRowNum, int lastCell, DataFormatter fmt, FormulaEvaluator eval ) {
            this.sheet = sheet;
            this.lastCell = lastCell;
            this.fmt = fmt;
            this.eval = eval;
            this.r = headerRowNum + 1;
            this.lastRow = sheet.getLastRowNum();
        }

        @Override public boolean hasNext() {
            if (!loaded) {
                next = findNextNonEmptyRow();
                loaded = true;
            }
            return next != null;
        }

        private String[] findNextNonEmptyRow() {
            while (r <= lastRow) {
                Row row = sheet.getRow( r++ );
                if (row == null) continue;
                String[] vals = readRowCellValues( row );
                if (vals != null) return vals;
            }
            return null;
        }

        
        private String[] readRowCellValues( Row row ) {
            String[] vals = new String[lastCell];
            boolean any = false;
            for (int c = 0; c < lastCell; c++) {
                Cell cell = row.getCell( c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL );
                String s = (cell == null) ? null : fmt.formatCellValue( cell, eval );
                if (s != null) s = s.trim();
                vals[c] = s;
                if (s != null && !s.isBlank()) any = true;
            }
            return any ? vals : null;
        }

        @Override public String[] next() {
            if (!hasNext()) throw new NoSuchElementException();
            loaded = false;
            return next;
        }
    }

    private static Iterator<String[]> createExcelDataRowIterator( Sheet sheet, int headerRowNum, int lastCell, DataFormatter fmt, FormulaEvaluator eval ) {
        return new ExcelDataRowIterator( sheet, headerRowNum, lastCell, fmt, eval );
    }

    private CommitTableResult commitExcel(
            String tableName,
            String storedName,
            Path path,
            double threshold,
            List<String> expectedCols,
            Set<String> requiredFields,
            Map<String, String> typeByField,
            boolean append
    ) throws Exception {
        try (InputStream in = Files.newInputStream(path);
             Workbook wb = WorkbookFactory.create(in)) {
            if (wb.getNumberOfSheets() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Excel has no sheets: " + path);
            }
            Sheet sheet = wb.getSheetAt(0);
            int headerRowNum = sheet.getFirstRowNum();
            Row headerRow = sheet.getRow(headerRowNum);
            if (headerRow == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Excel header row missing: " + path);
            }

            DataFormatter fmt = new DataFormatter();
            FormulaEvaluator eval = wb.getCreationHelper().createFormulaEvaluator();

            int lastCell = headerRow.getLastCellNum();
            if (lastCell <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Excel header row is empty: " + path);
            }
            List<String> header = readExcelHeaderCells( headerRow, lastCell, fmt, eval );
            Iterator<String[]> it = createExcelDataRowIterator( sheet, headerRowNum, lastCell, fmt, eval );

            return commitTabular(tableName, storedName, path, threshold, expectedCols, requiredFields, typeByField, header, it, append);
        } catch (RecordFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Excel 파일이 서버 메모리 제한을 초과합니다. CSV로 저장하거나 파일을 나누어 업로드해 주세요.");
        }
    }

    private Map<String, Integer> buildHeaderColumnIndex( List<String> header ) {
        Map<String, Integer> idx = new HashMap<>();
        for (int i = 0; i < header.size(); i++) {
            String key = normalizeName(header.get(i));
            if (key.isEmpty()) continue;
            idx.putIfAbsent(key, i);
            for (String alias : HEADER_TO_EXPECTED_ALIASES.getOrDefault(key, List.of())) {
                idx.putIfAbsent(alias, i);
            }
        }
        return idx;
    }

    private CommitTableResult commitTabularLowHeaderMatchResult(
            String tableName, String storedName, Path path, String targetTable, double threshold, double headerRate,
            int expectedCount, int headerSize, int missingCount, List<String> missing, Iterator<String[]> rows ) {
        long totalRows = 0L;
        while (rows.hasNext()) {
            rows.next();
            totalRows++;
        }
        return new CommitTableResult(
                tableName,
                storedName,
                path.toAbsolutePath().toString(),
                targetTable,
                threshold,
                headerRate,
                expectedCount,
                headerSize,
                missingCount,
                missing,
                totalRows,
                0L,
                0L,
                Map.of(),
                new ArrayList<>()
        );
    }

    private CommitTableResult commitTabular(
            String tableName,
            String storedName,
            Path path,
            double threshold,
            List<String> expectedCols,
            Set<String> requiredFields,
            Map<String, String> typeByField,
            List<String> header,
            Iterator<String[]> rows,
            boolean append
    ) {
        Map<String, Integer> idx = buildHeaderColumnIndex(header);

        List<String> missing = expectedCols.stream()
                .filter(c -> !COL_INST_TASK_SN.equalsIgnoreCase(normalizeName(c)))
                .filter(c -> !idx.containsKey(normalizeName(c))).toList();

        int expectedCount = expectedCols.size();
        int presentCount = expectedCount - missing.size();
        double headerRate = expectedCount == 0 ? 0.0 : ((double) presentCount / (double) expectedCount);

        String targetTable = safeQualifiedTable(tableName);
        List<Map<String, String>> sampleRows = new ArrayList<>();

        if (headerRate < threshold) {
            return commitTabularLowHeaderMatchResult( tableName, storedName, path, targetTable, threshold, headerRate,
                    expectedCount, header.size(), missing.size(), missing, rows );
        }

        return insertAllTabularRows( tableName, storedName, path, threshold, expectedCols, typeByField, header, rows, append,
                idx, missing, headerRate, expectedCount, targetTable, sampleRows );
    }

    private static String defaultCommitTypeForColumn( String col, Map<String, String> typeByField ) {
        return typeByField.getOrDefault( col,
                col != null && col.endsWith( "_datetime" ) ? "timestamp"
                        : col != null && col.endsWith( "_id" ) ? "integer"
                        : "varchar" );
    }

    private Object coerceOneTabularCell( String col, String raw, String normalizedType, long[] invalidValueCount, Map<String, Long> invalidByColumn ) {
        Object v;
        try {
            v = coerce( raw, normalizedType );
        } catch (Exception e) {
            v = null;
            invalidValueCount[0]++;
            invalidByColumn.put( col, invalidByColumn.getOrDefault( col, 0L ) + 1 );
        }
        if (v instanceof Long l && col != null && col.endsWith( "_id" )
                && (l > Integer.MAX_VALUE || l < Integer.MIN_VALUE)) {
            v = null;
            invalidValueCount[0]++;
            invalidByColumn.put( col, invalidByColumn.getOrDefault( col, 0L ) + 1 );
        }
        return v;
    }

    private static Object applyPkAndInstTaskDefaults( Object v, String col, int c, int pkIndex, long[] nextGeneratedId ) {
        if (pkIndex >= 0 && c == pkIndex && v == null) {
            v = ++nextGeneratedId[0];
        }
        if (COL_INST_TASK_SN.equals( col ) && v == null) {
            v = new BigDecimal( "12345" );
        }
        return v;
    }

    private record PkAppendState( int pkIndex, long initialNextPk ) {}

    private PkAppendState resolvePkAppendState( String tableName, String targetTable, List<String> expectedCols, boolean append ) {
        String pkCol = CDM_PK_AUTO_FILL.get( tableName );
        int pkIndex = (pkCol != null && expectedCols.contains( pkCol )) ? expectedCols.indexOf( pkCol ) : -1;
        long nextGeneratedId = 0L;
        if (append && pkIndex >= 0) {
            try {
                String safePkCol = SqlIdentifierGuard.quoteIdentifier( SqlIdentifierGuard.requireValidIdentifier( pkCol, "column" ) );
                Long maxVal = jdbcTemplate.queryForObject( "SELECT COALESCE(MAX(" + safePkCol + "), 0) FROM " + targetTable, Long.class );
                nextGeneratedId = maxVal != null ? maxVal : 0L;
            } catch (Exception ex) {
                UploadNonFatal.discard( ex );
            }
        }
        return new PkAppendState( pkIndex, nextGeneratedId );
    }

    private Object[] buildTabularRowParams(
            String[] row,
            List<String> expectedCols,
            Map<String, Integer> idx,
            Map<String, String> typeByField,
            int pkIndex,
            long[] nextPkHolder,
            long[] invalidValueCount,
            Map<String, Long> invalidByColumn,
            Map<String, String> sample ) {
        Object[] params = new Object[expectedCols.size()];
        for (int c = 0; c < expectedCols.size(); c++) {
            String col = expectedCols.get( c );
            Integer srcIndex = idx.get( normalizeName( col ) );
            String raw = (srcIndex == null || srcIndex >= row.length) ? null : row[srcIndex];
            String normalizedType = defaultCommitTypeForColumn( col, typeByField );
            Object v = coerceOneTabularCell( col, raw, normalizedType, invalidValueCount, invalidByColumn );
            v = applyPkAndInstTaskDefaults( v, col, c, pkIndex, nextPkHolder );
            params[c] = v;
            if (sample != null) sample.put( col, raw == null ? "" : raw );
        }
        return params;
    }

    private CommitTableResult insertAllTabularRows(
            String tableName,
            String storedName,
            Path path,
            double threshold,
            List<String> expectedCols,
            Map<String, String> typeByField,
            List<String> header,
            Iterator<String[]> rows,
            boolean append,
            Map<String, Integer> idx,
            List<String> missing,
            double headerRate,
            int expectedCount,
            String targetTable,
            List<Map<String, String>> sampleRows
    ) {
        if (!append) {
            // thexfiles 여러 기관에서 CSV 파일을 업로드하는 중에 동시에 동일 테이블에 대해 TRUNCATE를 수행하면 오류가 발생하므로 DELETE로 대체, 그러나 DELETE하면 전체 데이터가 삭제되므로 문제가 발생할 수 있음. 다른 기관의 데이터가 삭제될 수 있음.
            jdbcTemplate.execute("DELETE FROM " + targetTable);
        }
        String insertSql = buildInsertSql(targetTable, expectedCols);

        PkAppendState pkState = resolvePkAppendState( tableName, targetTable, expectedCols, append );
        int pkIndex = pkState.pkIndex();
        long[] nextPkHolder = new long[] { pkState.initialNextPk() };

        Map<String, Long> invalidByColumn = new LinkedHashMap<>();
        long[] invalidValueCount = new long[1];

        final int batchSize = 1000;
        List<Object[]> batch = new ArrayList<>(batchSize);
        long totalRows = 0L;

        while (rows.hasNext()) {
            String[] row = rows.next();
            totalRows++;

            Map<String, String> sample = (sampleRows.size() < 5) ? new LinkedHashMap<>() : null;
            Object[] params = buildTabularRowParams( row, expectedCols, idx, typeByField, pkIndex, nextPkHolder,
                    invalidValueCount, invalidByColumn, sample );

            if (sample != null) sampleRows.add(sample);

            batch.add(params);
            if (batch.size() >= batchSize) {
                batchInsert(insertSql, batch, expectedCols.size());
                batch.clear();
            }
        }
        long invalidValueCountLong = invalidValueCount[0];
        if (!batch.isEmpty()) {
            batchInsert(insertSql, batch, expectedCols.size());
            batch.clear();
        }

        return new CommitTableResult(
                tableName,
                storedName,
                path.toAbsolutePath().toString(),
                targetTable,
                threshold,
                headerRate,
                expectedCount,
                header.size(),
                missing.size(),
                missing,
                totalRows,
                totalRows,
                invalidValueCountLong,
                invalidByColumn,
                sampleRows
        );
    }

    private Map<String, String> buildTypeMap(List<RuleConsistencyRow> rules) {
        Map<String, String> m = new HashMap<>();
        for (RuleConsistencyRow r : rules) {
            if (r.getField() == null || r.getRefDetail() == null) continue;
            String ref = r.getRefDetail();
            String[] parts = ref.split(",");
            String base = parts[0].replaceAll("\\s*\\([^)]*\\)\\s*", "").trim().toLowerCase(Locale.ROOT);
            m.put(r.getField(), base);
        }
        return m;
    }

    private String buildInsertSql(String targetTable, List<String> cols) {
        String colList = cols.stream()
                .map(c -> SqlIdentifierGuard.quoteIdentifier(SqlIdentifierGuard.requireValidIdentifier(c, "column")))
                .collect(Collectors.joining(", "));
        String placeholders = String.join(", ", Collections.nCopies(cols.size(), "?"));
        return "INSERT INTO " + targetTable + " (" + colList + ") VALUES (" + placeholders + ")";
    }

    private void batchInsert(String sql, List<Object[]> batch, int colCount) {
        try {
            jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
                @Override
                public void setValues(PreparedStatement ps, int i) throws SQLException {
                    Object[] row = batch.get(i);
                    for (int c = 0; c < colCount; c++) {
                        ps.setObject(c + 1, row[c]);
                    }
                }

                @Override
                public int getBatchSize() {
                    return batch.size();
                }
            });
        } catch (DuplicateKeyException e) {

            for (int i = 0; i < batch.size(); i++) {
                try {
                    Object[] row = batch.get(i);
                    jdbcTemplate.update(sql, ps -> {
                        for (int c = 0; c < colCount; c++) {
                            ps.setObject(c + 1, row[c]);
                        }
                    });
                } catch (DuplicateKeyException ex) {
                    UploadNonFatal.discard( ex );
                }
            }
        }
    }

    private long countRemainingRows(CSVReader reader) throws Exception {
        long n = 0;
        while (reader.readNext() != null) n++;
        return n;
    }

    private Object coerce(String raw, String type) {
        if (raw == null) return null;
        String s = raw.trim();
        if (s.isEmpty()) return null;

        return switch (type) {
            case "integer" -> {
                long x = parseLong(s);
                if (x > Integer.MAX_VALUE || x < Integer.MIN_VALUE) throw new IllegalArgumentException("integer out of range");
                yield (int) x;
            }
            case "bigint" -> parseLong(s);
            case "float", "numeric" -> new BigDecimal(s);
            case "date" -> parseDate(s);
            case "time" -> parseTime(s);
            case "timestamp" -> parseTimestamp(s);
            case "char" -> (s.length() == 1) ? s : null;
            default -> s;
        };
    }

    
    private long parseLong(String s) {
        if (s == null || s.isBlank()) throw new IllegalArgumentException("empty");
        String t = s.trim().toUpperCase(Locale.ROOT);
        if (t.contains("E")) {
            return BigDecimal.valueOf(Double.parseDouble(s)).longValue();
        }
        return Long.parseLong(s);
    }

    
    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) throw new IllegalArgumentException("empty");
        s = s.trim();
        if (s.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return LocalDate.parse(s, DateTimeFormatter.ISO_LOCAL_DATE);
        }
        if (s.matches("\\d{1,2}/\\d{1,2}/\\d{2,4}")) {
            String[] parts = s.split("/");
            int month = Integer.parseInt(parts[0]);
            int day = Integer.parseInt(parts[1]);
            int year = Integer.parseInt(parts[2]);
            if (year < 100) year += (year >= 50 ? 1900 : 2000);
            return LocalDate.of(year, month, day);
        }
        return LocalDate.parse(s, DateTimeFormatter.ISO_LOCAL_DATE);
    }

    private LocalTime parseTime(String s) {
        if (s.length() == 5) return LocalTime.parse(s, DateTimeFormatter.ofPattern("HH:mm"));
        return LocalTime.parse(s, DateTimeFormatter.ofPattern("HH:mm:ss"));
    }

    
    private java.sql.Timestamp parseTimestamp(String s) {
        if (s == null || s.isBlank()) throw new IllegalArgumentException("empty");
        s = s.trim();
        if (s.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return java.sql.Timestamp.valueOf(LocalDate.parse(s, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay());
        }
        String n = s.replace('T', ' ');
        if (n.length() >= 19 && n.matches("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}.*")) {
            return java.sql.Timestamp.valueOf(LocalDateTime.parse(n.substring(0, 19), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
        if (n.length() >= 16 && n.matches("\\d{4}-\\d{2}-\\d{2} \\d{1,2}:\\d{2}.*")) {
            return java.sql.Timestamp.valueOf(LocalDateTime.parse(n.substring(0, 16), DateTimeFormatter.ofPattern("yyyy-MM-dd H:mm")));
        }
        if (s.matches("\\d{1,2}/\\d{1,2}/\\d{2,4}")) {
            String[] parts = s.split("/");
            int month = Integer.parseInt(parts[0]);
            int day = Integer.parseInt(parts[1]);
            int year = Integer.parseInt(parts[2]);
            if (year < 100) year += (year >= 50 ? 1900 : 2000);
            return java.sql.Timestamp.valueOf(LocalDate.of(year, month, day).atStartOfDay());
        }
        return java.sql.Timestamp.valueOf(LocalDate.parse(s.substring(0, 10), DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay());
    }

    private String stripBom(String s) {
        if (s == null || s.isEmpty()) return s;
        return (s.charAt(0) == '\uFEFF') ? s.substring(1) : s;
    }

    private String normalizeName(String raw) {
        if (raw == null) return "";
        String s = stripBom(raw).trim();
        if (s.isEmpty()) return "";
        if ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("'") && s.endsWith("'"))) {
            s = s.substring(1, s.length() - 1).trim();
        }
        s = s.replaceAll("\\s+", "_").toLowerCase(Locale.ROOT);
        return s;
    }
}

