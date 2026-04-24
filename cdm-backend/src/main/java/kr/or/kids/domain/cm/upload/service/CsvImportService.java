package kr.or.kids.domain.cm.upload.service;

import com.opencsv.CSVParser;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.ICSVWriter;
import com.opencsv.CSVWriter;
import kr.or.kids.domain.cm.upload.mapper.DisclosurePartnerMapper;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import kr.or.kids.global.security.SqlIdentifierGuard;
import lombok.RequiredArgsConstructor;
import org.postgresql.PGConnection;
import org.postgresql.copy.CopyManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.io.*;
import java.nio.charset.CharsetDecoder;
import java.util.concurrent.atomic.AtomicReference;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class CsvImportService implements CsvImport {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    private final DisclosurePartnerMapper disclosurePartnerMapper;

    @Value("${app.schema:kids_link_own}")
    private String dbSchema;

    private static final String TABLE_PREFIX = "tb_cm_i_tmpr_";
    private static final String COL_INST_TASK_SN = "inst_task_sn";
    private static final String SQL_GUARD_TABLE = "table";
    private static final String PG_TYPE_NUMERIC = "numeric";
    private static final String PG_TYPE_DECIMAL = "decimal";
    private static final String PG_TYPE_FLOAT = "float";
    private static final String PG_TYPE_DOUBLE = "double";
    private static final String PG_TYPE_TIMESTAMP = "timestamp";

    private String ensureTablePrefix(String tableName) {
        if (tableName.startsWith(TABLE_PREFIX)) return tableName;
        if (tableName.startsWith("tb_cm_i_")) tableName = tableName.substring(8);
        if (tableName.startsWith("cdm_")) tableName = tableName.substring(4);
        return TABLE_PREFIX + tableName;
    }

    
    private static InputStream filterNullBytes(InputStream in) {
        return new FilterInputStream(in) {
            @Override
            public int read() throws IOException {
                int b;
                while ((b = super.read()) == 0) {  }
                return b;
            }
            @Override
            public int read(byte[] buf, int off, int len) throws IOException {
                int n = super.read(buf, off, len);
                if (n <= 0) return n;
                for (int i = off; i < off + n; i++) {
                    if (buf[i] == 0) buf[i] = ' '; 
                }
                return n;
            }
        };
    }

    
    private static BufferedReader newCsvReader(Path csvPath) throws IOException {
        CharsetDecoder decoder = StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPLACE)
                .onUnmappableCharacter(CodingErrorAction.REPLACE);
        InputStream raw = Files.newInputStream(csvPath);
        return new BufferedReader(new InputStreamReader(filterNullBytes(raw), decoder));
    }

    
    /**
     * detectDelimiter 처리를 수행한다.
     *
     * @param csvPath csvPath
     * @return 처리 결과
     */
    public char detectDelimiter(Path csvPath) throws Exception {
        try (BufferedReader br = newCsvReader(csvPath)) {
            String firstLine = br.readLine();
            if (firstLine == null) return ',';
            long tabCount = firstLine.chars().filter(c -> c == '\t').count();
            long commaCount = firstLine.chars().filter(c -> c == ',').count();
            return tabCount > commaCount ? '\t' : ',';
        }
    }

    
    private List<String> readHeaderColumns(Path csvPath, char delimiter) throws Exception {
        try (BufferedReader br = newCsvReader(csvPath)) {
            String firstLine = br.readLine();
            if (firstLine == null) throw new IllegalArgumentException("CSV 파일이 비어 있음: " + csvPath);
            if (firstLine.startsWith("\uFEFF")) firstLine = firstLine.substring(1);

            String[] cols = firstLine.split(delimiter == '\t' ? "\t" : ",");
            List<String> result = new ArrayList<>();
            for (String col : cols) {
                result.add(col.trim().replace("\"", "").toLowerCase());
            }
            return result;
        }
    }

    
    private static String normalizeCsvHeaderToDb(String csvCol) {
        if (csvCol == null || csvCol.isBlank()) return csvCol;
        return csvCol.trim().replaceAll("\\s+", "_").toLowerCase();
    }

    private String safeSchema() {
        return SqlIdentifierGuard.requireValidIdentifier(dbSchema, "schema");
    }

    private String safeTable(String tableName) {
        return SqlIdentifierGuard.requireValidIdentifier(ensureTablePrefix(tableName), SQL_GUARD_TABLE);
    }

    private String safeQualifiedTable(String tableName) {
        return SqlIdentifierGuard.qualify(safeSchema(), safeTable(tableName));
    }

    
    private static String normalizeBrno(String brno) {
        if (brno == null || brno.isBlank()) return brno;
        String s = brno.replace("-", "").replace(" ", "").trim();
        s = s.replaceFirst("^0+", "");
        return s.isEmpty() ? "0" : s;
    }

    
    /**
     * readHeaderFields 처리를 수행한다.
     *
     * @param csvPath csvPath
     * @param delimiter delimiter
     * @return 처리 결과
     */
    public String readHeaderFields(Path csvPath, char delimiter) throws Exception {
        return String.join(",", readHeaderColumns(csvPath, delimiter));
    }

    
    private static final class NullByteFilterInputStream extends FilterInputStream {
        NullByteFilterInputStream(InputStream in) { super(in); }
        @Override
        public int read() throws IOException {
            int b;
            do { b = super.read(); } while (b == 0);
            return b;
        }
        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            int n = super.read(b, off, len);
            if (n <= 0) return n;
            int j = off;
            for (int i = off; i < off + n; i++) {
                if (b[i] != 0) b[j++] = b[i];
            }
            return j - off;
        }
    }

    
    /**
     * importCsvAuto 처리를 수행한다.
     *
     * @param csvPath csvPath
     * @param tableName tableName
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    public long importCsvAuto(Path csvPath, String tableName, Long ptcpInstSn) throws Exception {
        return importCsvAuto(csvPath, tableName, ptcpInstSn, null);
    }

    private record CsvDbMatchPlan( List<String> matchCols, List<Integer> csvIndexPerMatchCol, List<String> droppedCols ) {}

    private CsvDbMatchPlan buildCsvDbColumnMatch( List<String> csvCols, Map<String, ColInfo> dbColTypes ) {
        List<String> matchCols = new ArrayList<>();
        List<Integer> csvIndexPerMatchCol = new ArrayList<>();
        for (int i = 0; i < csvCols.size(); i++) {
            String csvCol = csvCols.get( i );
            String dbCol = dbColTypes.containsKey( csvCol ) ? csvCol
                    : dbColTypes.containsKey( normalizeCsvHeaderToDb( csvCol ) ) ? normalizeCsvHeaderToDb( csvCol ) : null;
            if (dbCol != null && !matchCols.contains( dbCol )) {
                matchCols.add( dbCol );
                csvIndexPerMatchCol.add( i );
            }
        }
        List<String> droppedCols = csvCols.stream()
                .filter( c -> !dbColTypes.containsKey( c ) && !dbColTypes.containsKey( normalizeCsvHeaderToDb( c ) ) )
                .collect( Collectors.toList() );
        return new CsvDbMatchPlan( matchCols, csvIndexPerMatchCol, droppedCols );
    }

    private String injectInstTaskSnColumn(
            Long ptcpInstSn,
            Long pblntSn,
            Map<String, ColInfo> dbColTypes,
            List<String> matchCols,
            List<Integer> csvIndexPerMatchCol ) {
        if (ptcpInstSn == null || !dbColTypes.containsKey( COL_INST_TASK_SN )) {
            return null;
        }
        String brno = disclosurePartnerMapper.findBrnoByPtcpInstSn( ptcpInstSn, pblntSn );
        
        String instTaskSnValue = (brno != null && !brno.isBlank()) ? brno : String.valueOf( ptcpInstSn );
        ColInfo instTaskSnColInfo = dbColTypes.get( COL_INST_TASK_SN );
        String brnoDebug = brno == null ? "null" : ("[" + brno + "],len=" + brno.length());
        int idx = matchCols.indexOf( COL_INST_TASK_SN );
        if (idx >= 0) {
            matchCols.set( idx, COL_INST_TASK_SN );
        } else {
            matchCols.add( COL_INST_TASK_SN );
            csvIndexPerMatchCol.add( -1 );
        }

        return instTaskSnValue;
    }

    private void truncateStagingBeforeCopyIfNeeded(
            String tableName,
            List<String> pkColumns,
            Map<String, ColInfo> dbColTypes,
            String instTaskSnValue ) {
        boolean canFlushByInstTaskSn = instTaskSnValue != null && dbColTypes.containsKey( COL_INST_TASK_SN );
        if (pkColumns.isEmpty()) {

            truncateTable( tableName );
        } else if (!canFlushByInstTaskSn) {

            truncateTable( tableName );
        }
    }

    private Set<String> prependGeneratedPkColumns(
            List<String> pkColumns,
            Map<String, ColInfo> dbColTypes,
            List<String> matchCols,
            List<Integer> csvIndexPerMatchCol ) {
        Set<String> matchColsLower = matchCols.stream().map( String::toLowerCase ).collect( Collectors.toSet() );
        Set<String> generatedPkCols = new LinkedHashSet<>();
        for (String pkCol : pkColumns) {
            String pkLower = pkCol.toLowerCase();
            if (matchColsLower.contains( pkLower )) continue;
            ColInfo info = dbColTypes.get( pkLower );
            if (info == null || info.dataType == null) continue;
            String dt = info.dataType.toLowerCase();
            if (!dt.contains( "int" ) && !dt.contains( PG_TYPE_NUMERIC ) && !dt.contains( PG_TYPE_DECIMAL )) continue;
            generatedPkCols.add( pkLower );
        }
        for (String col : generatedPkCols) {
            matchCols.add( 0, col );
            csvIndexPerMatchCol.add( 0, -1 );
        }
        if (!generatedPkCols.isEmpty()) {

        }
        return generatedPkCols;
    }

    /**
     * importCsvAuto 처리를 수행한다.
     *
     * @param csvPath csvPath
     * @param tableName tableName
     * @param ptcpInstSn ptcpInstSn
     * @param pblntSn pblntSn
     * @return 처리 결과
     */
    public long importCsvAuto(Path csvPath, String tableName, Long ptcpInstSn, Long pblntSn) throws Exception {
        char delimiter = detectDelimiter(csvPath);
        List<String> csvCols = readHeaderColumns(csvPath, delimiter);
        String pureTable = ensureTablePrefix(tableName);

        Map<String, ColInfo> dbColTypes = getColumnTypes(pureTable);

        if (dbColTypes.isEmpty()) {

            return 0;
        }

        CsvDbMatchPlan plan = buildCsvDbColumnMatch( csvCols, dbColTypes );
        List<String> matchCols = new ArrayList<>( plan.matchCols() );
        List<Integer> csvIndexPerMatchCol = new ArrayList<>( plan.csvIndexPerMatchCol() );
        List<String> droppedCols = plan.droppedCols();

        if (!droppedCols.isEmpty()) {

        }
        if (matchCols.size() <= 1 && !droppedCols.isEmpty()) {
        }

        String instTaskSnValue = injectInstTaskSnColumn( ptcpInstSn, pblntSn, dbColTypes, matchCols, csvIndexPerMatchCol );

        if (matchCols.size() <= 1 && !droppedCols.isEmpty()) {
        }

        if (matchCols.isEmpty()) {

            return 0;
        }

        List<String> pkColumns = getPrimaryKeyColumns(dbSchema, pureTable);
        truncateStagingBeforeCopyIfNeeded( tableName, pkColumns, dbColTypes, instTaskSnValue );

        Set<String> generatedPkCols = prependGeneratedPkColumns( pkColumns, dbColTypes, matchCols, csvIndexPerMatchCol );

        String targetTable = SqlIdentifierGuard.qualify(safeSchema(), SqlIdentifierGuard.requireValidIdentifier(pureTable, SQL_GUARD_TABLE));
        String delimLiteral = delimiter == '\t' ? "E'\\t'" : "','";
        String copyColList = matchCols.stream().map(c -> '"' + c + '"').collect(Collectors.joining(", "));

        
        List<String> forceNullCols = matchCols.stream()
                .filter(c -> {
                    ColInfo info = dbColTypes.get(c.toLowerCase());
                    return info != null && isNumericOrDateType(info.dataType);
                })
                .map(c -> '"' + c + '"')
                .toList();
        String forceNullClause = forceNullCols.isEmpty() ? "" : ", FORCE_NULL (" + String.join(", ", forceNullCols) + ")";

        
        String copySql = String.format(
                "COPY %s (%s) FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER %s, QUOTE '\"', ESCAPE '\"'%s)",
                targetTable, copyColList, delimLiteral, forceNullClause);

        
        Set<String> outputColsLower = matchCols.stream().map(String::toLowerCase).collect(Collectors.toSet());
        List<String> pkInStagingForInsert = pkColumns.stream().filter(c -> outputColsLower.contains(c.toLowerCase())).toList();
        if (!pkInStagingForInsert.isEmpty()) {

        }

        
        List<String> tempDefaultCols = setTempDefaults(pureTable, String.join(",", matchCols));

        try {
            return runImportCopyPhase( csvPath, pureTable, targetTable, delimiter, matchCols, csvIndexPerMatchCol, dbColTypes, copySql,
                    instTaskSnValue, pkInStagingForInsert, generatedPkCols );
        } finally {
            dropTempDefaults( pureTable, tempDefaultCols );
        }
    }

    private void deleteByInstTaskSnNormalized(
            Connection conn,
            String pureTable,
            String instTaskSnValue,
            Map<String, ColInfo> dbColTypes ) throws SQLException {
        if (instTaskSnValue == null || !dbColTypes.containsKey( COL_INST_TASK_SN )) {
            return;
        }
        String targetFull = SqlIdentifierGuard.qualify( safeSchema(), SqlIdentifierGuard.requireValidIdentifier( pureTable, SQL_GUARD_TABLE ) );
        
        String normalizedWhere = "\"inst_task_sn\" = ?";
        int flushed;
        try (PreparedStatement ps = conn.prepareStatement( "DELETE FROM " + targetFull + " WHERE " + normalizedWhere )) {
            ps.setString( 1, instTaskSnValue );
            flushed = ps.executeUpdate();
        }

    }

    private static String compositePkKey( List<String> matchCols, List<String> pkInStagingForInsert, String[] outRow ) {
        return IntStream.range( 0, matchCols.size() )
                .filter( i -> pkInStagingForInsert.contains( matchCols.get( i ) ) )
                .mapToObj( i -> outRow[i] != null ? outRow[i] : "" )
                .collect( Collectors.joining( "\0" ) );
    }

    private String[] buildOneCopyOutputRow(
            int rowNum,
            List<String> matchCols,
            List<Integer> csvIndexPerMatchCol,
            Map<String, ColInfo> dbColTypes,
            String instTaskSnValue,
            Set<String> generatedPkColsLower,
            String[] row ) {
        String[] outRow = new String[matchCols.size()];
        for (int i = 0; i < matchCols.size(); i++) {
            String col = matchCols.get( i );
            if (COL_INST_TASK_SN.equals( col ) && instTaskSnValue != null) {
                outRow[i] = instTaskSnValue;
            } else if (generatedPkColsLower.contains( col.toLowerCase() )) {
                outRow[i] = String.valueOf( rowNum );
            } else {
                int idx = csvIndexPerMatchCol.get( i );
                String raw = (idx >= 0 && idx < row.length) ? (row[idx] != null ? row[idx].trim() : "") : "";
                ColInfo colInfo = dbColTypes.get( col.toLowerCase() );
                String val = normalizeScientificForInteger( raw, colInfo );
                outRow[i] = truncateToMaxLength( val, colInfo );
            }
        }
        return outRow;
    }

    private void writeTransformedCsvToPipe(
            PipedOutputStream pipeOut,
            AtomicReference<Throwable> writerError,
            Path csvPath,
            char delimiter,
            List<String> matchCols,
            List<Integer> csvIndexPerMatchCol,
            Map<String, ColInfo> dbColTypes,
            String instTaskSnValue,
            Set<String> generatedPkColsLower,
            List<String> pkInStagingForInsert ) {
        try (CSVWriter writerOut = new CSVWriter( new OutputStreamWriter( pipeOut, StandardCharsets.UTF_8 ),
                delimiter, ICSVWriter.DEFAULT_QUOTE_CHARACTER, ICSVWriter.DEFAULT_ESCAPE_CHARACTER, "\n" )) {
            CSVParser parser = new CSVParserBuilder().withSeparator( delimiter ).build();
            try (InputStream in = Files.newInputStream( csvPath );
                 Reader r = new InputStreamReader( filterNullBytes( in ), StandardCharsets.UTF_8 );
                 CSVReader reader = new CSVReaderBuilder( r ).withCSVParser( parser ).build()) {
                String[] hdr = reader.readNext();
                if (hdr == null) return;
                writerOut.writeNext( matchCols.toArray( new String[0] ) );

                Set<String> seenPk = pkInStagingForInsert.isEmpty() ? null : new HashSet<>();
                String[] row;
                int rowNum = 0;
                while ((row = reader.readNext()) != null) {
                    rowNum++;
                    String[] outRow = buildOneCopyOutputRow( rowNum, matchCols, csvIndexPerMatchCol, dbColTypes,
                            instTaskSnValue, generatedPkColsLower, row );
                    if (seenPk != null) {
                        String pkKey = compositePkKey( matchCols, pkInStagingForInsert, outRow );
                        if (!seenPk.add( pkKey )) continue;
                    }
                    writerOut.writeNext( outRow );
                }
            }
        } catch (Throwable t) {
            writerError.set( t );
        } finally {
            try { pipeOut.close(); } catch (IOException ex) {
                UploadNonFatal.discard( ex );
            }
        }
    }

    private long runImportCopyPhase(
            Path csvPath,
            String pureTable,
            String targetTable,
            char delimiter,
            List<String> matchCols,
            List<Integer> csvIndexPerMatchCol,
            Map<String, ColInfo> dbColTypes,
            String copySql,
            String instTaskSnValue,
            List<String> pkInStagingForInsert,
            Set<String> generatedPkCols
    ) throws Exception {
        final String instTaskSnValueFinal = instTaskSnValue;
        final Set<String> generatedPkColsFinal = generatedPkCols;
        Long insertedRows = jdbcTemplate.execute( (Connection conn) -> {

            try {
                deleteByInstTaskSnNormalized( conn, pureTable, instTaskSnValueFinal, dbColTypes );

                CopyManager cm = conn.unwrap( PGConnection.class ).getCopyAPI();

                AtomicReference<Throwable> writerError = new AtomicReference<>();
                PipedInputStream pipeIn = new PipedInputStream( 256 * 1024 );
                PipedOutputStream pipeOut = new PipedOutputStream();
                pipeIn.connect( pipeOut );

                Thread writer = new Thread( () -> writeTransformedCsvToPipe( pipeOut, writerError, csvPath, delimiter, matchCols,
                        csvIndexPerMatchCol, dbColTypes, instTaskSnValueFinal, generatedPkColsFinal, pkInStagingForInsert ),
                        "csv-copy-writer" );
                writer.start();

                long copyRows;
                try {
                    copyRows = cm.copyIn( copySql, pipeIn );
                } finally {
                    try { pipeIn.close(); } catch (IOException ex) {
                        UploadNonFatal.discard( ex );
                    }
                }
                try { writer.join( 300_000 ); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                if (writerError.get() != null) throw new SQLException( "CSV 변환 오류", writerError.get() );

                try {
                    jdbcTemplate.execute( "ANALYZE " + targetTable );

                } catch (Exception ex) {
                    UploadNonFatal.discard( ex );
                }
                return copyRows;
            } catch (IOException e) {
                throw new RuntimeException( e );
            }
        } );

        long result = insertedRows != null ? insertedRows : 0L;

        Long finalCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + targetTable, Long.class );

        if (finalCount != null && finalCount == 0 && result > 0) {

        }

        return result;
    }

    
    /**
     * importCsvAuto 처리를 수행한다.
     *
     * @param csvPath csvPath
     * @param tableName tableName
     * @return 처리 결과
     */
    public long importCsvAuto(Path csvPath, String tableName) throws Exception {
        return importCsvAuto(csvPath, tableName, null);
    }

    private record ColInfo(String dataType, Integer maxLength) {}

    
    private static String normalizeScientificForInteger(String raw, ColInfo info) {
        if (raw == null || raw.isEmpty()) return raw;
        if (info == null || info.dataType == null) return raw;
        String t = info.dataType.toLowerCase();
        // 정수 계열 컬럼에 대해서만 입력 문자열을 정수로 정규화한다.
        if (!t.contains("smallint") && !t.contains("integer") && !t.contains("bigint")
                && !t.equals("int2") && !t.equals("int4") && !t.equals("int8")) {
            return raw;
        }

        String v = raw.trim();
        if (v.isEmpty()) return raw;
        // 이미 정수 형태면 그대로 사용
        if (v.matches("^[+-]?\\d+$")) return v;
        // 과학표기(E/e) 또는 소수점(.)이 포함된 숫자만 정규화 대상
        if (!v.contains(".") && !v.contains("E") && !v.contains("e")) return raw;

        try {
            BigDecimal bd = new BigDecimal(v);
            return bd.setScale(0, RoundingMode.DOWN).toPlainString();
        } catch (NumberFormatException e) {
            return raw;
        }
    }

    
    private static boolean isNumericOrDateType(String dataType) {
        if (dataType == null) return false;
        String t = dataType.toLowerCase();
        return t.contains("int") || t.contains(PG_TYPE_NUMERIC) || t.contains(PG_TYPE_DECIMAL)
                || t.contains(PG_TYPE_FLOAT) || t.contains(PG_TYPE_DOUBLE) || t.contains("real")
                || t.equals("date") || t.contains(PG_TYPE_TIMESTAMP) || t.equals("time") || t.startsWith("time with");
    }

    
    private static String truncateToMaxLength(String value, ColInfo info) {
        if (value == null) return null;
        if (info == null || info.maxLength == null || info.maxLength <= 0) return value;
        return value.length() > info.maxLength ? value.substring(0, info.maxLength) : value;
    }

    
    private String buildCastExpr(String col, ColInfo info) {
        return buildCastExprQuotedRef("\"" + col + "\"", info);
    }

    
    private String buildCastExprQuotedRef(String quotedColRef, ColInfo info) {
        String nullif = "NULLIF(TRIM(" + quotedColRef + "), '')";
        if (info == null || info.dataType == null) return nullif;

        String t = info.dataType.toLowerCase();

        if (t.contains("int") || t.contains(PG_TYPE_NUMERIC) || t.contains(PG_TYPE_DECIMAL)) {
            return "(" + nullif + ")::numeric::" + info.dataType;
        }
        if (t.contains(PG_TYPE_FLOAT) || t.contains(PG_TYPE_DOUBLE) || t.contains("real")) {
            return "(" + nullif + ")::numeric::" + info.dataType;
        }
        if (t.equals("date")) {
            return "(NULLIF(TRIM(REPLACE(" + quotedColRef + ", '.', '-')), ''))::date";
        }
        if (t.contains(PG_TYPE_TIMESTAMP)) {
            return "(NULLIF(TRIM(REPLACE(" + quotedColRef + ", '.', '-')), ''))::" + PG_TYPE_TIMESTAMP;
        }
        if (t.equals("time")) {
            return nullif + "::time";
        }
        if (t.equals("timetz") || t.startsWith("time with")) {
            return nullif + "::timetz";
        }
        
        if (info.maxLength != null && info.maxLength > 0) {
            return "LEFT(" + nullif + ", " + info.maxLength + ")";
        }
        return nullif;
    }

    
    private List<String> getPrimaryKeyColumns(String schema, String pureTable) {
        String sql = """
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema = kcu.table_schema
             AND tc.table_name = kcu.table_name
            WHERE tc.table_schema = ? AND tc.table_name = ? AND tc.constraint_type = 'PRIMARY KEY'
            ORDER BY kcu.ordinal_position
            """;
        List<String> cols = jdbcTemplate.queryForList(sql, String.class, schema, pureTable);
        return cols != null ? cols.stream().map(s -> s.toLowerCase().trim()).toList() : List.of();
    }

    
    private Map<String, ColInfo> getColumnTypes(String pureTable) {
        String sql = """
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = ? AND table_name = ?
            ORDER BY ordinal_position
            """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, dbSchema, pureTable);
        Map<String, ColInfo> result = new LinkedHashMap<>();
        for (var row : rows) {
            String name = ((String) row.get("column_name")).toLowerCase().trim();
            String type = ((String) row.get("data_type")).toLowerCase().trim();
            Integer maxLen = row.get("character_maximum_length") != null
                    ? ((Number) row.get("character_maximum_length")).intValue() : null;
            result.put(name, new ColInfo(type, maxLen));
        }
        return result;
    }

    
    private List<String> setTempDefaults(String pureTable, String csvFields, Set<String> skipCols) {
        return setTempDefaults(pureTable, csvFields);
    }

    
    private static boolean isNumericLikeForTempDefault( String dataType ) {
        String t = dataType.toLowerCase();
        return t.contains( "int" ) || t.contains( PG_TYPE_NUMERIC ) || t.contains( PG_TYPE_DECIMAL )
                || t.contains( PG_TYPE_FLOAT ) || t.contains( PG_TYPE_DOUBLE ) || t.contains( "real" );
    }

    private static boolean isDateTimeLikeForTempDefault( String dataType ) {
        String t = dataType.toLowerCase();
        return t.contains( PG_TYPE_TIMESTAMP ) || t.contains( "date" );
    }

    private List<String> setTempDefaults(String pureTable, String csvFields) {
        Set<String> csvCols = Set.of(csvFields.toLowerCase().split(","))
                .stream().map(String::trim).collect(Collectors.toSet());

        String sql = """
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = ? AND table_name = ?
              AND is_nullable = 'NO'
              AND column_default IS NULL
            """;

        List<String> altered = new ArrayList<>();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, dbSchema, pureTable);

        for (var row : rows) {
            String col = ((String) row.get("column_name")).toLowerCase().trim();
            if (csvCols.contains(col)) continue;

            String dataType = ((String) row.get("data_type")).toLowerCase();
            String defaultVal;
            if (isNumericLikeForTempDefault( dataType )) {
                defaultVal = "123456";
            } else if (isDateTimeLikeForTempDefault( dataType )) {
                defaultVal = "CURRENT_TIMESTAMP";
            } else {
                defaultVal = "'N/A'";
            }

            String alterSql = "ALTER TABLE " + SqlIdentifierGuard.qualify(safeSchema(), SqlIdentifierGuard.requireValidIdentifier(pureTable, SQL_GUARD_TABLE))
                    + " ALTER COLUMN " + SqlIdentifierGuard.quoteIdentifier(SqlIdentifierGuard.requireValidIdentifier(col, "column"))
                    + " SET DEFAULT " + defaultVal;

            jdbcTemplate.execute(alterSql);
            altered.add(col);
        }
        return altered;
    }

    
    private void dropTempDefaults(String pureTable, List<String> columns) {
        for (String col : columns) {
            try {
                String sql = "ALTER TABLE " + SqlIdentifierGuard.qualify(safeSchema(), SqlIdentifierGuard.requireValidIdentifier(pureTable, SQL_GUARD_TABLE))
                        + " ALTER COLUMN " + SqlIdentifierGuard.quoteIdentifier(SqlIdentifierGuard.requireValidIdentifier(col, "column"))
                        + " DROP DEFAULT";
                jdbcTemplate.execute(sql);
            } catch (Exception ex) {
                UploadNonFatal.discard( ex );
            }
        }
    }

    /**
     * truncateTable 처리를 수행한다.
     *
     * @param tableName tableName
     */
    public void truncateTable(String tableName) {
        String finalTableName = safeQualifiedTable(tableName);

        try {
            jdbcTemplate.execute("SET lock_timeout = '10s'");
            jdbcTemplate.execute("TRUNCATE TABLE " + finalTableName);

        } catch (Exception e) {

            jdbcTemplate.execute("DELETE FROM " + finalTableName);
        } finally {
            try { jdbcTemplate.execute("SET lock_timeout = '0'"); } catch (Exception ex) {
                UploadNonFatal.discard( ex );
            }
        }
    }

    /**
     * importCsv 처리를 수행한다.
     *
     * @param csvPath csvPath
     * @param tableName tableName
     * @param field field
     * @return 처리 결과
     */
    @Override
    public long importCsv(Path csvPath, String tableName, String field) throws Exception {
        truncateTable(tableName);

        String finalTableName = safeQualifiedTable(tableName);

        String copySql = String.format(
            "COPY %s (%s) FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '\"', ESCAPE '\"')",
            finalTableName, field
        );

        try (Connection conn = dataSource.getConnection()) {
            CopyManager cm = conn.unwrap(PGConnection.class).getCopyAPI();
            long copyRows;
            try (InputStream is = Files.newInputStream(csvPath)) {
                copyRows = cm.copyIn(copySql, is);
            }

        }

        Long cnt = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + finalTableName, Long.class);
        long inserted = cnt != null ? cnt : 0L;

        return inserted;
    }
}
