package kr.or.kids.domain.cm.upload.dto;

import java.util.List;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record CdmValidateRequest(
    Long ptcpInstSn,
    String userId,
    List<TableFile> tables,
    
    Long totalUploadBytes
) {
    /**
     * TableFile 처리를 수행한다.
     *
     * @param tableName tableName
     * @param storedName storedName
     * @return 처리 결과
     */
    public record TableFile(String tableName, String storedName) {}
}
