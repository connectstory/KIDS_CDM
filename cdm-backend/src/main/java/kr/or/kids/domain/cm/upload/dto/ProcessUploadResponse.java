package kr.or.kids.domain.cm.upload.dto;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record ProcessUploadResponse(
        boolean success,
        String slot,
        String storedName,
        ValidationSummary validation,
        CommitSummary commit,
        boolean validationStatsRecorded,
        boolean uploadStatsRecorded,
        String message
) {
    /**
     * ValidationSummary 처리를 수행한다.
     *
     * @param totalRowCount totalRowCount
     * @param consistencyFieldErrors consistencyFieldErrors
     * @param consistencyTypeErrors consistencyTypeErrors
     * @param completenessErrors completenessErrors
     * @param validityErrors validityErrors
     * @param accuracyErrors accuracyErrors
     * @param overallErrorCount overallErrorCount
     * @param overallErrorRate overallErrorRate
     * @return 처리 결과
     */
    public record ValidationSummary(
            long totalRowCount,
            long consistencyFieldErrors,
            long consistencyTypeErrors,
            long completenessErrors,
            long validityErrors,
            long accuracyErrors,
            long overallErrorCount,
            Double overallErrorRate
    ) {}

    /**
     * CommitSummary 처리를 수행한다.
     *
     * @param rowsInserted rowsInserted
     * @param rowsTotal rowsTotal
     * @param invalidCount invalidCount
     * @param headerMatchRate headerMatchRate
     * @return 처리 결과
     */
    public record CommitSummary(
            long rowsInserted,
            long rowsTotal,
            long invalidCount,
            double headerMatchRate
    ) {}
}
