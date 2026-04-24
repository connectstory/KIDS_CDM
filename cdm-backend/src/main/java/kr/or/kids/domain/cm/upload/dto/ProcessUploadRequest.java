package kr.or.kids.domain.cm.upload.dto;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record ProcessUploadRequest(
        String storedName,
        String slot,
        Boolean append
) {
    /**
     * ProcessUploadRequest 처리를 수행한다.
     *
     * @param storedName storedName
     * @param slot slot
     */
    public ProcessUploadRequest(String storedName, String slot) {
        this(storedName, slot, false);
    }
}
