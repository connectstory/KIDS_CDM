package kr.or.kids.domain.cm.upload.service;

import java.util.Map;

import kr.or.kids.domain.cm.common.vo.UserVO;

/**
 * 업로드 도메인 서비스 계약을 정의한다.
 */
public interface UploadStatsService {
    
    /**
     * saveUploadStats 처리를 수행한다.
     *
     * @param user user
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     */
    void saveUploadStats( UserVO user, Long pblntSn, Long ptcpInstSn );

    
    /**
     * confirmUploadStats 처리를 수행한다.
     *
     * @param user user
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     */
    void confirmUploadStats( UserVO user, Long pblntSn, Long ptcpInstSn );

    
    /**
     * 조회 결과를 반환한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    Map<String, Object> getUploadStats( Long pblntSn, Long ptcpInstSn );

    
    /**
     * 조회 결과를 반환한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    java.util.List<java.util.Map<String, Object>> getUploadStatsHistory( Long pblntSn, Long ptcpInstSn );

    
    /**
     * 조회 결과를 반환한다.
     *
     * @param ptcpInstSn ptcpInstSn
     * @param pblntSn pblntSn
     * @return 처리 결과
     */
    java.util.List<java.util.Map<String, Object>> getUploadStatsHistoryByPartner( Long ptcpInstSn, Long pblntSn );

    
    /**
     * 조회 결과를 반환한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param tblSeCd tblSeCd
     * @return 처리 결과
     */
    java.util.List<java.util.Map<String, Object>> getCatalog( Long pblntSn, Long ptcpInstSn, String tblSeCd );

    
    /**
     * resetUploadData 처리를 수행한다.
     *
     * @param user user
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     */
    void resetUploadData( UserVO user, Long pblntSn, Long ptcpInstSn );
}
