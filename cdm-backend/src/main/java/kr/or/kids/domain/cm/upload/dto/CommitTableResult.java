package kr.or.kids.domain.cm.upload.dto;

import java.util.List;
import java.util.Map;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record CommitTableResult(
        String tableName,
        String storedName,
        String csvPath,
        String targetTable,
        double threshold,
        double headerMatchRate,
        int expectedColumnCount,
        int presentColumnCount,
        int missingColumnCount,
        List<String> missingColumns,
        long totalCsvRows,
        long insertedRows,
        long invalidValueCount,
        Map<String, Long> invalidByColumn,
        List<Map<String, String>> sampleRows
) {}

