package kr.or.kids.domain.cm.upload.dto;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record CopyResult(
    boolean success,
    int rowsCopied,
    String skipReason,
    String errorMessage
) {
    /**
     * success 처리를 수행한다.
     *
     * @param rows rows
     * @return 처리 결과
     */
    public static CopyResult success(int rows) {
        return new CopyResult(true, rows, null, null);
    }
    /**
     * skip 처리를 수행한다.
     *
     * @param reason reason
     * @return 처리 결과
     */
    public static CopyResult skip(String reason) {
        return new CopyResult(false, -1, reason, null);
    }
    /**
     * failure 처리를 수행한다.
     *
     * @param message message
     * @return 처리 결과
     */
    public static CopyResult failure(String message) {
        return new CopyResult(false, -1, null, message);
    }
}
