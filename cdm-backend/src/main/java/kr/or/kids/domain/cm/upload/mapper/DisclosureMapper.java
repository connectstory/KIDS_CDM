package kr.or.kids.domain.cm.upload.mapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.kids.domain.cm.common.vo.TbCaEFileGroupTrsmVo;
import kr.or.kids.domain.cm.upload.dto.DisclosureSearchRequest;
import kr.or.kids.domain.cm.upload.vo.TbCmMUldPblntVO;

/**
 * 업로드 도메인 데이터 접근을 정의한다.
 */
@Mapper
public interface DisclosureMapper {

    /**
     * 조건에 맞는 데이터를 조회한다.
     *
     * @param request request
     * @return 처리 결과
     */
    List<TbCmMUldPblntVO> searchDisclosureList( DisclosureSearchRequest request );

    /**
     * 파트너(기관) 기준: 해당 기관이 참여중인 공시만 조회한다.
     *
     * @param instId instId(기관 식별값: brno/inst_id)
     * @param request request
     * @return 처리 결과
     */
    List<TbCmMUldPblntVO> searchDisclosureListByPartnerInst( @Param("instId") String instId, @Param("request") DisclosureSearchRequest request );

    /**
     * 대상 건수를 반환한다.
     *
     * @param request request
     * @return 처리 결과
     */
    int countDisclosureList( DisclosureSearchRequest request );

    /**
     * 파트너(기관) 기준: 해당 기관이 참여중인 공시만 카운트한다.
     *
     * @param instId instId(기관 식별값: brno/inst_id)
     * @param request request
     * @return 처리 결과
     */
    int countDisclosureListByPartnerInst( @Param("instId") String instId, @Param("request") DisclosureSearchRequest request );

    /**
     * 대상 데이터를 조회한다.
     *
     * @param pblntSn pblntSn
     * @return 처리 결과
     */
    TbCmMUldPblntVO findById( Long pblntSn );

    /**
     * 데이터를 등록한다.
     *
     * @param vo vo
     */
    void insert( TbCmMUldPblntVO vo );

    /**
     * 데이터를 수정한다.
     *
     * @param vo vo
     */
    void update( TbCmMUldPblntVO vo );

    /**
     * 데이터를 삭제한다.
     *
     * @param pblntSn pblntSn
     */
    void delete( Long pblntSn );

    
    /**
     * 대상 데이터를 조회한다.
     *
     * @param pblntSn pblntSn
     * @return 처리 결과
     */
    String findStatus( Long pblntSn );

    
    /**
     * 데이터를 수정한다.
     *
     * @param pblntSn pblntSn
     * @param pblntPrgrsSttsCd pblntPrgrsSttsCd
     * @param mdfrId mdfrId
     * @param mdfcnDt mdfcnDt
     */
    void updateStatus( @Param("pblntSn") Long pblntSn, @Param("pblntPrgrsSttsCd") String pblntPrgrsSttsCd, @Param("mdfrId") String mdfrId, @Param("mdfcnDt") java.time.LocalDateTime mdfcnDt );

    
    /**
     * 대상 데이터를 조회한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    List<java.util.Map<String, Object>> findFilesByPblntSn( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

    
    /**
     * 데이터를 등록한다.
     *
     * @param fileVo fileVo
     */
    void insertFile( kr.or.kids.domain.cm.common.vo.TbCmMFileUldVO fileVo );

    
    /**
     * 데이터를 등록한다.
     *
     * @param vo vo
     */
    void insertFileGroup( TbCaEFileGroupTrsmVo vo );

    
    /**
     * 데이터를 삭제한다.
     *
     * @param atchFileId atchFileId
     * @param mdfrId mdfrId
     * @return 처리 결과
     */
    int deleteFileById( @Param("atchFileId") String atchFileId, @Param("mdfrId") String mdfrId );

    
    /**
     * selectFileByAtchFileId 처리를 수행한다.
     *
     * @param atchFileId atchFileId
     * @return 처리 결과
     */
    java.util.Map<String, Object> selectFileByAtchFileId( String atchFileId );

    
    /**
     * 대상 건수를 반환한다.
     *
     * @param atchFileGroupId atchFileGroupId
     * @return 처리 결과
     */
    int countFilesInGroup( String atchFileGroupId );

    
    /**
     * 데이터를 수정한다.
     *
     * @param atchFileGroupId atchFileGroupId
     * @param mdfrId mdfrId
     * @return 처리 결과
     */
    int updateFileGroupUseYn( @Param("atchFileGroupId") String atchFileGroupId, @Param("mdfrId") String mdfrId );

    
    /**
     * 데이터를 수정한다.
     *
     * @param pblntSn pblntSn
     * @param atchFileSn atchFileSn
     * @return 처리 결과
     */
    int updateFileUldDelYn( @Param("pblntSn") Long pblntSn, @Param("atchFileSn") String atchFileSn );

    
    /**
     * 데이터를 삭제한다.
     *
     * @param pblntSn pblntSn
     * @param atchFileSn atchFileSn
     * @return 처리 결과
     */
    int deleteFile( Long pblntSn, String atchFileSn );

    
    /**
     * 데이터를 등록한다.
     *
     * @param uldStatsSn uldStatsSn
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param uldNocs uldNocs
     * @param uldCpct uldCpct
     * @param errNocs errNocs
     * @param errRt errRt
     * @param rgtrId rgtrId
     * @param regDt regDt
     */
    void insertUldStatsHist( @Param("uldStatsSn") Long uldStatsSn, @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("uldNocs") Long uldNocs, @Param("uldCpct") Long uldCpct, @Param("errNocs") Long errNocs, @Param("errRt") BigDecimal errRt, @Param("rgtrId") String rgtrId, @Param("regDt") LocalDateTime regDt );

    
    /**
     * 데이터를 등록한다.
     *
     * @param statsSchema statsSchema
     * @param tblUldStatsSn tblUldStatsSn
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param trsfSeCd trsfSeCd
     * @param errTblNm errTblNm
     * @param uldNocs uldNocs
     * @param errNocs errNocs
     * @param vrfcFnlErrNocs vrfcFnlErrNocs
     * @param vrfcUnqErrNocs vrfcUnqErrNocs
     * @param vrfcVldErrNocs vrfcVldErrNocs
     * @param vrfcNmlErrNocs vrfcNmlErrNocs
     * @param errRt errRt
     * @param uldVrfcGrpSn uldVrfcGrpSn
     * @param vrfcRuleId vrfcRuleId
     * @param vrfcRuleTpCd vrfcRuleTpCd
     * @param vrfcRuleErrNocs vrfcRuleErrNocs
     * @param rgtrId rgtrId
     * @param regDt regDt
     */
    void insertTblUldStatsHist(
            @Param("statsSchema") String statsSchema,
            @Param("tblUldStatsSn") Long tblUldStatsSn,
            @Param("pblntSn") Long pblntSn,
            @Param("ptcpInstSn") Long ptcpInstSn,
            @Param("trsfSeCd") String trsfSeCd,
            @Param("errTblNm") String errTblNm,
            @Param("uldNocs") Long uldNocs,
            @Param("errNocs") Long errNocs,
            @Param("vrfcFnlErrNocs") Long vrfcFnlErrNocs,
            @Param("vrfcUnqErrNocs") Long vrfcUnqErrNocs,
            @Param("vrfcVldErrNocs") Long vrfcVldErrNocs,
            @Param("vrfcNmlErrNocs") Long vrfcNmlErrNocs,
            @Param("errRt") BigDecimal errRt,
            @Param("uldVrfcGrpSn") Long uldVrfcGrpSn,
            @Param("vrfcRuleId") Integer vrfcRuleId,
            @Param("vrfcRuleTpCd") String vrfcRuleTpCd,
            @Param("vrfcRuleErrNocs") Long vrfcRuleErrNocs,
            @Param("rgtrId") String rgtrId,
            @Param("regDt") LocalDateTime regDt );

    
    /**
     * 데이터를 등록한다.
     *
     * @param uldSttsChgSn uldSttsChgSn
     * @param ptcpInstSn ptcpInstSn
     * @param pblntSn pblntSn
     * @param uldInstPrgrsSttsCd uldInstPrgrsSttsCd
     * @param ptcpCmptnDt ptcpCmptnDt
     * @param chgRsnInfoCn chgRsnInfoCn
     * @param rgtrId rgtrId
     * @param regDt regDt
     */
    void insertUldSttsChg( @Param("uldSttsChgSn") Long uldSttsChgSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("pblntSn") Long pblntSn, @Param("uldInstPrgrsSttsCd") String uldInstPrgrsSttsCd, @Param("ptcpCmptnDt") LocalDateTime ptcpCmptnDt, @Param("chgRsnInfoCn") String chgRsnInfoCn, @Param("rgtrId") String rgtrId, @Param("regDt") LocalDateTime regDt );

    
    /**
     * 데이터를 수정한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param mdfrId mdfrId
     * @param mdfcnDt mdfcnDt
     * @return 처리 결과
     */
    int updateUldStatsHist( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("mdfrId") String mdfrId, @Param("mdfcnDt") LocalDateTime mdfcnDt );

    
    /**
     * 대상 데이터를 조회한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    java.util.Map<String, Object> findUldStatsHist( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

    
    /**
     * 대상 데이터를 조회한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    java.util.List<java.util.Map<String, Object>> findUldStatsHistList( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

    
    /**
     * 대상 데이터를 조회한다.
     *
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    java.util.List<java.util.Map<String, Object>> findUldStatsHistListByPtcpInstSn( @Param("ptcpInstSn") Long ptcpInstSn );

    
    /**
     * 대상 데이터를 조회한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    List<java.util.Map<String, Object>> findTblUldStatsHist( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

    
    /**
     * 데이터를 수정한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param uldInstPrgrsSttsStcd uldInstPrgrsSttsStcd
     * @param uldTypeCd uldTypeCd
     * @param ptcpCmptnDt ptcpCmptnDt
     * @param uldDt uldDt
     * @param lastUpdtYmd lastUpdtYmd
     * @param updtCycleCnt updtCycleCnt
     * @param mdfrId mdfrId
     * @param mdfcnDt mdfcnDt
     * @return 처리 결과
     */
    int updateUldPrst( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("uldInstPrgrsSttsStcd") String uldInstPrgrsSttsStcd, @Param("uldTypeCd") String uldTypeCd, @Param("ptcpCmptnDt") LocalDateTime ptcpCmptnDt, @Param("uldDt") LocalDateTime uldDt, @Param("lastUpdtYmd") String lastUpdtYmd, @Param("updtCycleCnt") Long updtCycleCnt, @Param("mdfrId") String mdfrId, @Param("mdfcnDt") LocalDateTime mdfcnDt );

    
    /**
     * setUldTypeCdForDataUploadIfBlank 처리를 수행한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param mdfrId mdfrId
     * @return 처리 결과
     */
    int setUldTypeCdForDataUploadIfBlank( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("mdfrId") String mdfrId );

    
    /**
     * 데이터를 등록한다.
     *
     * @param atchFileId atchFileId
     * @param atchFileGroupId atchFileGroupId
     * @param fileSeq fileSeq
     * @param fileStrgPathDsctn fileStrgPathDsctn
     * @param prvcInclYn prvcInclYn
     * @param fileNm fileNm
     * @param fileExtnNm fileExtnNm
     * @param fileCn fileCn
     * @param fileSz fileSz
     * @param useYn useYn
     * @param rgtrId rgtrId
     */
    void insertFileTrsm(
        @Param("atchFileId") String atchFileId,
        @Param("atchFileGroupId") String atchFileGroupId,
        @Param("fileSeq") int fileSeq,
        @Param("fileStrgPathDsctn") String fileStrgPathDsctn,
        @Param("prvcInclYn") String prvcInclYn,
        @Param("fileNm") String fileNm,
        @Param("fileExtnNm") String fileExtnNm,
        @Param("fileCn") String fileCn,
        @Param("fileSz") String fileSz,
        @Param("useYn") String useYn,
        @Param("rgtrId") String rgtrId
    );

    
    /**
     * selectMaxFileTrsmDtlSn 처리를 수행한다.
     *
     * @param atchFileGroupId atchFileGroupId
     * @return 처리 결과
     */
    Integer selectMaxFileTrsmDtlSn( @Param("atchFileGroupId") String atchFileGroupId );

    
    /**
     * 대상 데이터를 조회한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param tblSeCd tblSeCd
     * @return 처리 결과
     */
    List<java.util.Map<String, Object>> findCatalog( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("tblSeCd") String tblSeCd );

    

    /**
     * softDeleteFileTrsmByPblntSn 처리를 수행한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    int softDeleteFileTrsmByPblntSn( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

    /**
     * softDeleteFileGroupByPblntSn 처리를 수행한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param mdfrId mdfrId
     * @return 처리 결과
     */
    int softDeleteFileGroupByPblntSn( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("mdfrId") String mdfrId );

    /**
     * softDeleteFileUldByPblntSn 처리를 수행한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param mdfrId mdfrId
     * @return 처리 결과
     */
    int softDeleteFileUldByPblntSn( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("mdfrId") String mdfrId );

    /**
     * softDeleteTblUldStatsHist 처리를 수행한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param mdfrId mdfrId
     * @return 처리 결과
     */
    int softDeleteTblUldStatsHist( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("mdfrId") String mdfrId );

    
    /**
     * softDeleteTblUldStatsHistByTableNames 처리를 수행한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param errTblNmList errTblNmList
     * @param mdfrId mdfrId
     * @return 처리 결과
     */
    int softDeleteTblUldStatsHistByTableNames( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("errTblNmList") List<String> errTblNmList, @Param("mdfrId") String mdfrId );

    
    /**
     * 데이터를 삭제한다.
     *
     * @param statsSchema statsSchema
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param errTblNm errTblNm
     * @return 처리 결과
     */
    int deleteTblUldStatsHistByPblntSnAndErrTblNm( @Param("statsSchema") String statsSchema, @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("errTblNm") String errTblNm );

    
    /**
     * 데이터를 수정한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param uldNocs uldNocs
     * @param uldCpct uldCpct
     * @param errNocs errNocs
     * @param errRt errRt
     * @param mdfrId mdfrId
     * @param mdfcnDt mdfcnDt
     * @return 처리 결과
     */
    int updateUldStatsHistTotals( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("uldNocs") Long uldNocs, @Param("uldCpct") Long uldCpct, @Param("errNocs") Long errNocs, @Param("errRt") java.math.BigDecimal errRt, @Param("mdfrId") String mdfrId, @Param("mdfcnDt") java.time.LocalDateTime mdfcnDt );

    /**
     * 데이터를 삭제한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    int deleteUldStatsHistByPblntSn( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );
}
