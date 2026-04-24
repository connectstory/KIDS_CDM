package kr.or.kids.domain.cm.upload.service;

import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class TsvLoadService {

    private static final Pattern SAFE_COLUMN = Pattern.compile("^[a-zA-Z0-9_]+$");

    private final JdbcTemplate jdbcTemplate;
    private final UploadService uploadService;

    @Value("${app.upload.root:.data/uploads}")
    private Path uploadRoot;

    @Value("${app.schema:kids_link_own}")
    private String schema;

    
    /**
     * loadTsv 처리를 수행한다.
     *
     * @param storedName storedName
     * @return 처리 결과
     */
    public TsvLoadResult loadTsv(String storedName) {
        requireStoredName(storedName);
        String slot = resolveSlot(storedName);
        Path path = resolveExistingTsvPath(slot, storedName);

        List<String> lines = readUtf8LinesOrThrow(path);
        if (lines.isEmpty()) {
            return new TsvLoadResult(slot, 0);
        }

        List<String> columns = parseValidHeaderColumnsOrThrow(lines.get(0));
        String qualifiedTable = qualifiedTempTable(slot);

        String insertSql = buildInsertSql(qualifiedTable, columns);
        int inserted = insertTsvDataRows(lines, insertSql, columns.size());

        return new TsvLoadResult(slot, inserted);
    }

    private void requireStoredName(String storedName) {
        if (storedName == null || storedName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "storedName is required");
        }
    }

    private String resolveSlot(String storedName) {
        String slot = uploadService.inferTableFromFileName(storedName);
        if (slot == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Could not infer table from file name. Use a name containing the table (e.g. measurement_2025.tsv).");
        }
        return slot;
    }

    private Path resolveExistingTsvPath(String slot, String storedName) {
        Path path = uploadRoot.resolve(slot).resolve(storedName.trim());
        if (!Files.isRegularFile(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "TSV file not found: " + path);
        }
        return path;
    }

    private List<String> readUtf8LinesOrThrow(Path path) {
        try {
            return Files.readAllLines(path, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "TSV 파일을 읽을 수 없습니다.");
        }
    }

    
    private List<String> parseValidHeaderColumnsOrThrow(String headerLine) {
        List<String> headerColumns = parseTsvLine(headerLine);
        if (headerColumns.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TSV header is empty.");
        }
        List<String> valid = new ArrayList<>();
        for (String col : headerColumns) {
            String trimmed = col.trim();
            if (!trimmed.isEmpty() && SAFE_COLUMN.matcher(trimmed).matches()) {
                valid.add(trimmed);
            }
        }
        if (valid.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No valid column names in header.");
        }
        return valid;
    }

    private String qualifiedTempTable(String slot) {
        return schema + ".tb_cm_i_tmpr_" + slot;
    }

    private static String buildInsertSql(String qualifiedTable, List<String> columns) {
        String columnList = String.join(", ", columns);
        String placeholders = columns.stream().map(c -> "?").collect(Collectors.joining(", "));
        return "INSERT INTO " + qualifiedTable + " (" + columnList + ") VALUES (" + placeholders + ")";
    }

    
    private int insertTsvDataRows(List<String> lines, String insertSql, int columnCount) {
        int inserted = 0;
        for (int i = 1; i < lines.size(); i++) {
            List<String> raw = parseTsvLine(lines.get(i));
            List<Object> params = rowParamsAlignedToColumns(raw, columnCount);
            try {
                jdbcTemplate.update(insertSql, params.toArray());
                inserted++;
            } catch (Exception ex) {
                UploadNonFatal.discard( ex );
            }
        }
        return inserted;
    }

    private static List<Object> rowParamsAlignedToColumns(List<String> rawCells, int columnCount) {
        List<Object> params = new ArrayList<>(columnCount);
        for (int c = 0; c < columnCount; c++) {
            params.add(c < rawCells.size() ? rawCells.get(c) : null);
        }
        return params;
    }

    /**
     * TsvLoadResult 처리를 수행한다.
     *
     * @param table table
     * @param rowsInserted rowsInserted
     * @return 처리 결과
     */
    public record TsvLoadResult(String table, int rowsInserted) {}

    private static List<String> parseTsvLine(String line) {
        if (line == null) return List.of();
        List<String> out = new ArrayList<>();
        for (String s : line.split("\t", -1)) {
            String v = s.trim();
            out.add(v.isEmpty() ? null : v);
        }
        return out;
    }
}
