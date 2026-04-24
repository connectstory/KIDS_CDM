package kr.or.kids.domain.cm.upload.dto;

import java.util.List;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record CdmValidateProgress(
    String taskId,
    String status,
    String currentTable,
    int completedCount,
    int totalCount,
    long startTimeMs,
    long elapsedMs,
    long estimatedRemainingMs,
    String errorMessage,
    List<TableResult> results
) {
    /**
     * TableResult 처리를 수행한다.
     *
     * @param tableName tableName
     * @param totalRows totalRows
     * @param errorCount errorCount
     * @param errorRate errorRate
     * @return 처리 결과
     */
    public record TableResult(String tableName, long totalRows, long errorCount, double errorRate) {}
}
