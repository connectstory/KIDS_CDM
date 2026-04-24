package kr.or.kids.domain.cm.upload.mapper;

import java.time.LocalDateTime;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import kr.or.kids.domain.cm.upload.dto.PartnerBasicInfoRow;
import kr.or.kids.domain.cm.upload.dto.PartnerCatalogRow;
import kr.or.kids.domain.cm.upload.dto.PartnerContactManagerRow;
import kr.or.kids.domain.cm.upload.dto.PartnerPeriodScaleRow;
import kr.or.kids.domain.cm.upload.dto.PartnerStatusInfoHistoryRow;

/**
 * 업로드 도메인 데이터 접근을 정의한다.
 */
@Mapper
public interface DisclosurePartnerMapper {

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  List<TbCmMUldPrstVO> findByPblntSn( @Param("pblntSn") Long pblntSn );

  
  /**
   * 데이터를 등록한다.
   *
   * @param vo vo
   */
  void insert( TbCmMUldPrstVO vo );

  
  /**
   * 데이터를 삭제한다.
   *
   * @param ptcpInstSn ptcpInstSn
   * @param pblntSn pblntSn
   */
  void delete( @Param("ptcpInstSn") Long ptcpInstSn, @Param("pblntSn") Long pblntSn );

  
  /**
   * 데이터를 삭제한다.
   *
   * @param pblntSn pblntSn
   */
  void deleteAllByPblntSn( @Param("pblntSn") Long pblntSn );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param ptcpInstSn ptcpInstSn
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  String findBrnoByPtcpInstSn( @Param("ptcpInstSn") Long ptcpInstSn, @Param("pblntSn") Long pblntSn );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param instId instId
   * @return 처리 결과
   */
  String findInstNmByInstId( @Param("instId") String instId );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  String findStatus( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

  
  /**
   * 데이터를 수정한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param uldInstPrgrsSttsStcd uldInstPrgrsSttsStcd
   * @param mdfrId mdfrId
   * @param mdfcnDt mdfcnDt
   */
  void updateStatus( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("uldInstPrgrsSttsStcd") String uldInstPrgrsSttsStcd, @Param("mdfrId") String mdfrId, @Param("mdfcnDt") java.time.LocalDateTime mdfcnDt );

  
  /**
   * 데이터를 수정한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param verInfoNm verInfoNm
   * @param lastUpdtYmd lastUpdtYmd
   * @param updtCycleCnt updtCycleCnt
   * @param mdfrId mdfrId
   * @param mdfcnDt mdfcnDt
   */
  void updatePartnerInfo( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("verInfoNm") String verInfoNm, @Param("lastUpdtYmd") String lastUpdtYmd, @Param("updtCycleCnt") Long updtCycleCnt, @Param("mdfrId") String mdfrId, @Param("mdfcnDt") java.time.LocalDateTime mdfcnDt );

  
  /**
   * 데이터를 삭제한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   */
  void deletePeriodScale( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

  
  /**
   * 데이터를 등록한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param trsfSeCd trsfSeCd
   * @param tblSeCd tblSeCd
   * @param tnocs tnocs
   * @param bgngYmd bgngYmd
   * @param endYmd endYmd
   * @param rgtrId rgtrId
   * @param regDt regDt
   */
  void insertPeriodScale( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("trsfSeCd") String trsfSeCd, @Param("tblSeCd") String tblSeCd, @Param("tnocs") Long tnocs, @Param("bgngYmd") String bgngYmd, @Param("endYmd") String endYmd, @Param("rgtrId") String rgtrId, @Param("regDt") java.time.LocalDateTime regDt );

  
  /**
   * 데이터를 삭제한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   */
  void deleteCatalog( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

  
  /**
   * clearPartnerCdmFieldsAfterCloseCancel 처리를 수행한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param mdfrId mdfrId
   * @param mdfcnDt mdfcnDt
   */
  void clearPartnerCdmFieldsAfterCloseCancel( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("mdfrId") String mdfrId, @Param("mdfcnDt") java.time.LocalDateTime mdfcnDt );

  
  /**
   * 데이터를 등록한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param tblSeCd tblSeCd
   * @param colNm colNm
   * @param dataTypeCd dataTypeCd
   * @param nullYn nullYn
   * @param pkYn pkYn
   * @param fkYn fkYn
   * @param rgtrId rgtrId
   * @param regDt regDt
   */
  void insertCatalog( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("tblSeCd") String tblSeCd, @Param("colNm") String colNm, @Param("dataTypeCd") String dataTypeCd, @Param("nullYn") String nullYn, @Param("pkYn") String pkYn, @Param("fkYn") String fkYn, @Param("rgtrId") String rgtrId, @Param("regDt") java.time.LocalDateTime regDt );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  PartnerBasicInfoRow findPartnerBasicInfo( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  List<PartnerPeriodScaleRow> findPeriodScaleList( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  List<PartnerCatalogRow> findCatalogList( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  String findCancelReason( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

  
  /**
   * 데이터를 수정한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param cancelReason cancelReason
   * @param mdfrId mdfrId
   * @param mdfcnDt mdfcnDt
   * @return 처리 결과
   */
  int updateCancelReason( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("cancelReason") String cancelReason, @Param("mdfrId") String mdfrId, @Param("mdfcnDt") java.time.LocalDateTime mdfcnDt );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  List<PartnerStatusInfoHistoryRow> findStatusInfoHistory( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param ptcpInstSn ptcpInstSn
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  String findInstIdByPtcpInstSn( @Param("ptcpInstSn") Long ptcpInstSn, @Param("pblntSn") Long pblntSn );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  PartnerContactManagerRow findPartnerInstContactAndManager( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  String findUldPrgrsYn( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn );

  
  /**
   * 데이터를 수정한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param uldPrgrsYn uldPrgrsYn
   * @param mdfrId mdfrId
   * @return 처리 결과
   */
  int updateUldPrgrsYn( @Param("pblntSn") Long pblntSn, @Param("ptcpInstSn") Long ptcpInstSn, @Param("uldPrgrsYn") String uldPrgrsYn, @Param("mdfrId") String mdfrId );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param excludePblntSn excludePblntSn
   * @return 처리 결과
   */
  List<String> findInstKeysOnOtherInProgressDisclosures( @Param("excludePblntSn") Long excludePblntSn );
}
