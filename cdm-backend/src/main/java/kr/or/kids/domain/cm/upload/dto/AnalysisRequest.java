package kr.or.kids.domain.cm.upload.dto;

import java.nio.file.Path;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record AnalysisRequest (
    String tableName,
    String storedName,
    Long pblntSn,
    Long ptcpInstSn,
    String userId,
    Path csvPath,
    
    Long uldVrfcGrpSn
) {
    /**
     * AnalysisRequest 처리를 수행한다.
     *
     * @param tableName tableName
     * @param storedName storedName
     */
    public AnalysisRequest(String tableName, String storedName) {
        this(tableName, storedName, null, null, null, null, null);
    }

    /**
     * AnalysisRequest 처리를 수행한다.
     *
     * @param tableName tableName
     * @param storedName storedName
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param userId userId
     */
    public AnalysisRequest(String tableName, String storedName, Long pblntSn, Long ptcpInstSn, String userId) {
        this(tableName, storedName, pblntSn, ptcpInstSn, userId, null, null);
    }

    /**
     * AnalysisRequest 처리를 수행한다.
     *
     * @param tableName tableName
     * @param storedName storedName
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param userId userId
     * @param csvPath csvPath
     */
    public AnalysisRequest(String tableName, String storedName, Long pblntSn, Long ptcpInstSn, String userId, Path csvPath) {
        this(tableName, storedName, pblntSn, ptcpInstSn, userId, csvPath, null);
    }

}
