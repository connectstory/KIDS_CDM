package kr.or.kids.domain.cm.upload.service.impl;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.kids.domain.cm.common.vo.UserVO;
import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import kr.or.kids.domain.cm.upload.dto.DisclosurePartnerRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosurePartnerResponse;
import kr.or.kids.domain.cm.upload.dto.PartnerBasicInfoRow;
import kr.or.kids.domain.cm.upload.dto.PartnerCatalogRow;
import kr.or.kids.domain.cm.upload.dto.PartnerContactManagerRow;
import kr.or.kids.domain.cm.upload.dto.PartnerPeriodScaleRow;
import kr.or.kids.domain.cm.upload.dto.PartnerStatusInfoHistoryRow;
import kr.or.kids.domain.cm.upload.mapper.DisclosureMapper;
import kr.or.kids.domain.cm.upload.mapper.DisclosurePartnerMapper;
import kr.or.kids.domain.cm.upload.service.DisclosurePartnerCloseDataCleanupService;
import kr.or.kids.domain.cm.upload.service.DisclosurePartnerService;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import lombok.RequiredArgsConstructor;

/**
 * 업로드 도메인 비즈니스 로직을 구현한다.
 *
 * <pre>
 * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
 * </pre>
 */
@Service
@RequiredArgsConstructor
public class DisclosurePartnerServiceImpl implements DisclosurePartnerService {

  private final DisclosurePartnerCloseDataCleanupService closeDataCleanupService;

  private static final String MSG_INST_ALREADY_ON_IN_PROGRESS_DISCLOSURE = "이미 공시진행중입니다.";

  private static final String DEFAULT_SYSTEM_USER = "SYSTEM";
  
  private static final String CLOSE_CANCEL_REASON = "마감에 의한 취소";
  private static final String LOG_SEPARATOR = "========================================";
  private static final String LOG_FMT_PBLNT_SN = "공시일련번호 (pblntSn): {}";
  private static final String LOG_FMT_PTCP_INST_SN = "참여기관번호 (ptcpInstSn): {}";
  private static final String KEY_VER_INFO_NM = "verInfoNm";
  private static final String KEY_LAST_UPDT_YMD = "lastUpdtYmd";
  private static final String KEY_TBL_SE_CD = "tblSeCd";
  private static final String KEY_INST_MANAGER = "instManager";
  private static final String KEY_INST_CONTACT = "instContact";
  private static final String KEY_UPDT_CYCLE_CNT = "updtCycleCnt";
  private static final String KEY_TNOCS = "tnocs";
  private static final String KEY_PERIOD_SCALE_LIST = "periodScaleList";
  private static final String KEY_CATALOG_LIST = "catalogList";

  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final DisclosurePartnerMapper disclosurePartnerMapper;
  private final DisclosureMapper disclosureMapper;

  private static Object mapGetCamelOrSnake( Map<String, Object> m, String camel, String snake ) {
    if (m == null) return null;
    Object v = m.get( camel );
    return v != null ? v : m.get( snake );
  }

  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  @Override
  @Transactional(readOnly = true)
  public List<DisclosurePartnerResponse> findByPblntSn( Long pblntSn ) {

    List<TbCmMUldPrstVO> vos = disclosurePartnerMapper.findByPblntSn( pblntSn );

    if (vos == null) {

      return List.of();
    }

    if (!vos.isEmpty()) {
      TbCmMUldPrstVO first = vos.get( 0 );

    } else {

    }

    return vos.stream().map( vo -> {
      
      String instNm = vo.getInstNm();
      if (instNm == null || instNm.trim().isEmpty()) {
        instNm = vo.getInstId();
      }

      

      DisclosurePartnerResponse response = new DisclosurePartnerResponse( vo.getPtcpInstSn(), vo.getPblntSn(), vo.getInstId(), instNm, vo.getUldInstPrgrsSttsStcd(), vo.getPtcpDmndDt(), vo.getPtcpCfmtnDt(), vo.getPtcpRtrcnDt(), vo.getPtcpRegDt(), vo.getPtcpCmptnDt(), vo.getPtcpRdmndDt(), vo.getUldTypeCd(), vo.getUldDt(),
          vo.getVerInfoNm(), vo.getLastUpdtYmd(), vo.getRegYmd(), vo.getUpdtCycle(), vo.getDelYn() );
      
      
      return response;
    } ).collect( Collectors.toList() );
  }

  private void removePartnersNotInRequest( Long pblntSn, List<TbCmMUldPrstVO> existingPartners, Set<String> requestedInstIds ) {
    for (TbCmMUldPrstVO existingPartner : existingPartners) {
      String existingInstId = existingPartner.getInstId() != null ? existingPartner.getInstId().trim() : null;
      if (existingInstId == null || existingInstId.isEmpty() || requestedInstIds.contains( existingInstId )) {
        continue;
      }
      disclosurePartnerMapper.delete( existingPartner.getPtcpInstSn(), pblntSn );

    }
  }

  private void insertNewPartnersForSync(
      Long pblntSn,
      Set<String> requestedInstIds,
      Set<String> existingInstIds,
      List<TbCmMUldPrstVO> existingPartners,
      String createBy,
      LocalDateTime now ) {
    for (String instId : requestedInstIds) {
      if (instId == null || instId.trim().isEmpty()) {
        continue;
      }
      String trimmedInstId = instId.trim();
      if (existingInstIds.contains( trimmedInstId )) {

        continue;
      }
      if (fingerprintMatchesExistingPartner( trimmedInstId, existingPartners )) {

        continue;
      }
      TbCmMUldPrstVO vo = new TbCmMUldPrstVO();
      vo.setPblntSn( pblntSn );
      vo.setInstId( trimmedInstId );
      vo.setBrno( trimmedInstId );
      vo.setUldInstPrgrsSttsStcd( "01" );
      vo.setPtcpDmndDt( now );
      vo.setDelYn( "N" );
      vo.setRgtrId( createBy );
      vo.setRegYmd( now );
      vo.setMdfrId( createBy );
      vo.setMdfcnYmd( now );
      disclosurePartnerMapper.insert( vo );

    }
  }

  
  private static Set<String> instMatchFingerprints( String raw ) {
    Set<String> out = new HashSet<>();
    if (raw == null) {
      return out;
    }
    String t = raw.trim();
    if (!t.isEmpty()) {
      out.add( t );
    }
    String digits = t.replaceAll( "\\D", "" );
    if (!digits.isEmpty()) {
      String last = digits.substring( Math.max( 0, digits.length() - 10 ) );
      StringBuilder sb = new StringBuilder();
      for (int i = last.length(); i < 10; i++) {
        sb.append( '0' );
      }
      sb.append( last );
      String norm = sb.toString();
      if (norm.length() > 10) {
        norm = norm.substring( norm.length() - 10 );
      }
      out.add( norm );
    }
    return out;
  }

  private static boolean conflictsWithBusyInstRows( String requestedInst, List<String> busyRawRows ) {
    if (busyRawRows == null || busyRawRows.isEmpty()) {
      return false;
    }
    Set<String> req = instMatchFingerprints( requestedInst );
    if (req.isEmpty()) {
      return false;
    }
    Set<String> busyAll = new HashSet<>();
    for (String b : busyRawRows) {
      if (b != null) {
        busyAll.addAll( instMatchFingerprints( b ) );
      }
    }
    for (String r : req) {
      if (busyAll.contains( r )) {
        return true;
      }
    }
    return false;
  }

  private static boolean fingerprintMatchesExistingPartner( String candidate, List<TbCmMUldPrstVO> existingPartners ) {
    if (existingPartners == null || existingPartners.isEmpty()) {
      return false;
    }
    Set<String> cand = instMatchFingerprints( candidate );
    if (cand.isEmpty()) {
      return false;
    }
    for (TbCmMUldPrstVO p : existingPartners) {
      Set<String> ex = new HashSet<>();
      if (p.getInstId() != null) {
        ex.addAll( instMatchFingerprints( p.getInstId() ) );
      }
      if (p.getBrno() != null) {
        ex.addAll( instMatchFingerprints( p.getBrno() ) );
      }
      for (String c : cand) {
        if (ex.contains( c )) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * addPartners 처리를 수행한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @param request request
   */
  @Override
  @Transactional
  public void addPartners( UserVO user, Long pblntSn, DisclosurePartnerRequest request ) {
    String createBy = user != null && user.getNi() != null ? user.getNi() : DEFAULT_SYSTEM_USER;
    LocalDateTime now = LocalDateTime.now();

    Set<String> requestedInstIds = request.getInstIds() != null ? request.getInstIds().stream().map( id -> id != null ? id.trim() : null ).filter( id -> id != null && !id.isEmpty() ).collect( Collectors.toSet() ) : Set.of();
    List<TbCmMUldPrstVO> existingPartners = disclosurePartnerMapper.findByPblntSn( pblntSn );
    Map<String, TbCmMUldPrstVO> existingPartnersMap = existingPartners.stream().filter( p -> p.getInstId() != null && !p.getInstId().trim().isEmpty() ).collect( Collectors.toMap( p -> p.getInstId().trim(), p -> p, ( p1, p2 ) -> p1 ) );
    Set<String> existingInstIds = existingPartnersMap.keySet();

    List<String> busyRawRows = disclosurePartnerMapper.findInstKeysOnOtherInProgressDisclosures( pblntSn );
    for (String inst : requestedInstIds) {
      if (existingInstIds.contains( inst )) {
        continue;
      }
      if (fingerprintMatchesExistingPartner( inst, existingPartners )) {
        continue;
      }
      if (conflictsWithBusyInstRows( inst, busyRawRows )) {
        throw new IllegalArgumentException( MSG_INST_ALREADY_ON_IN_PROGRESS_DISCLOSURE );
      }
    }

    removePartnersNotInRequest( pblntSn, existingPartners, requestedInstIds );
    insertNewPartnersForSync( pblntSn, requestedInstIds, existingInstIds, existingPartners, createBy, now );

  }

  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  @Override
  @Transactional(readOnly = true)
  public List<String> findInstKeysBusyOnOtherInProgressDisclosures( Long pblntSn ) {
    if (pblntSn == null) {
      return List.of();
    }
    List<String> rows = disclosurePartnerMapper.findInstKeysOnOtherInProgressDisclosures( pblntSn );
    return rows != null ? rows : List.of();
  }

  /**
   * 데이터를 삭제한다.
   *
   * @param ptcpInstSn ptcpInstSn
   * @param pblntSn pblntSn
   */
  @Override
  @Transactional
  public void deletePartner( Long ptcpInstSn, Long pblntSn ) {
    disclosurePartnerMapper.delete( ptcpInstSn, pblntSn );

  }

  private void persistWithdrawCancelReasonIfApplicable(
      String uldInstPrgrsSttsStcd,
      String cancelReason,
      Long pblntSn,
      Long ptcpInstSn,
      String updateBy,
      LocalDateTime updateTime ) {

    if ("04".equals( uldInstPrgrsSttsStcd ) && cancelReason != null && !cancelReason.trim().isEmpty()) {
      Long uldSttsChgSn = generateUldSttsChgSn();
      String chgRsnInfoCn = cancelReason.trim();

      try {
        disclosureMapper.insertUldSttsChg( uldSttsChgSn, ptcpInstSn, pblntSn, "04", updateTime, chgRsnInfoCn, updateBy, updateTime );

      } catch (Exception e) {

        throw e;
      }
    } else {

    }
  }

  private void logPartnerConfirmedDetailsIfApplicable( String uldInstPrgrsSttsStcd, Long pblntSn, Long ptcpInstSn ) {
    if (!"02".equals( uldInstPrgrsSttsStcd )) {
      return;
    }
    List<TbCmMUldPrstVO> updatedPartner = disclosurePartnerMapper.findByPblntSn( pblntSn );
    updatedPartner.stream().filter( p -> p.getPtcpInstSn().equals( ptcpInstSn ) ).findFirst().ifPresent( p -> {

    } );
  }

  /**
   * 조회 결과를 반환한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @Override
  @Transactional(readOnly = true)
  public String getStatus( Long pblntSn, Long ptcpInstSn ) {
    return disclosurePartnerMapper.findStatus( pblntSn, ptcpInstSn );
  }

  /**
   * 데이터를 수정한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param uldInstPrgrsSttsStcd uldInstPrgrsSttsStcd
   * @param cancelReason cancelReason
   */
  @Override
  @Transactional
  public void updateStatus( UserVO user, Long pblntSn, Long ptcpInstSn, String uldInstPrgrsSttsStcd, String cancelReason ) {
    if (pblntSn == null || ptcpInstSn == null) {
      throw new IllegalArgumentException( "공시번호와 참여기관번호는 필수입니다." );
    }
    if (uldInstPrgrsSttsStcd == null || uldInstPrgrsSttsStcd.trim().isEmpty()) {
      throw new IllegalArgumentException( "진행상태코드는 필수입니다." );
    }
    String updateBy = user != null && user.getNi() != null ? user.getNi() : DEFAULT_SYSTEM_USER;
    LocalDateTime updateTime = LocalDateTime.now();

    
    String currentStatus = disclosurePartnerMapper.findStatus( pblntSn, ptcpInstSn );

    disclosurePartnerMapper.updateStatus( pblntSn, ptcpInstSn, uldInstPrgrsSttsStcd, updateBy, updateTime );

    persistWithdrawCancelReasonIfApplicable( uldInstPrgrsSttsStcd, cancelReason, pblntSn, ptcpInstSn, updateBy, updateTime );

    String updatedStatus = disclosurePartnerMapper.findStatus( pblntSn, ptcpInstSn );

    logPartnerConfirmedDetailsIfApplicable( uldInstPrgrsSttsStcd, pblntSn, ptcpInstSn );

    if ( isParticipationCancelledStatus( uldInstPrgrsSttsStcd ) ) {
      closeDataCleanupService.purgeAfterCloseCancellation( pblntSn, ptcpInstSn, updateBy );
    }

  }

  
  private static boolean isParticipationCancelledStatus( String uldInstPrgrsSttsStcd ) {
    return "04".equals( normalizeTwoDigitUldCode( uldInstPrgrsSttsStcd ) );
  }

  private static String normalizeTwoDigitUldCode( String code ) {
    if (code == null) {
      return "";
    }
    String s = code.trim();
    if (s.length() == 1) {
      return "0" + s;
    }
    return s;
  }

  
  private Long generateUldSttsChgSn() {
    return System.currentTimeMillis() % 1000000000L + SECURE_RANDOM.nextInt( 10000 );
  }

  private void applyCdmBasicInfoFromRequest(
      Map<String, Object> request,
      Long pblntSn,
      Long ptcpInstSn,
      String updateBy,
      LocalDateTime now ) {
    String verInfoNm = request.get( KEY_VER_INFO_NM ) != null ? String.valueOf( request.get( KEY_VER_INFO_NM ) ) : null;
    String lastUpdtYmd = request.get( KEY_LAST_UPDT_YMD ) != null ? String.valueOf( request.get( KEY_LAST_UPDT_YMD ) ) : null;
    Long updtCycleCnt = null;
    if (request.get( KEY_UPDT_CYCLE_CNT ) != null) {
      updtCycleCnt = UploadNonFatal.tryParseLong( String.valueOf( request.get( KEY_UPDT_CYCLE_CNT ) ) );
    }
    if (verInfoNm == null && lastUpdtYmd == null && updtCycleCnt == null) {
      return;
    }
    disclosurePartnerMapper.updatePartnerInfo( pblntSn, ptcpInstSn, verInfoNm, lastUpdtYmd, updtCycleCnt, updateBy, now );

  }

  private void insertOnePeriodScaleRow(
      Map<String, Object> item,
      Long pblntSn,
      Long ptcpInstSn,
      String updateBy,
      LocalDateTime now ) {
    Object trsfRaw = mapGetCamelOrSnake( item, "trsfSeCd", "trsf_se_cd" );
    Object tblRaw = mapGetCamelOrSnake( item, KEY_TBL_SE_CD, "tbl_se_cd" );
    String trsfSeCd = trsfRaw != null ? String.valueOf( trsfRaw ) : null;
    String tblSeCd = tblRaw != null ? String.valueOf( tblRaw ) : null;
    Long tnocs = null;
    if (item.get( KEY_TNOCS ) != null) {
      tnocs = UploadNonFatal.tryParseLong( String.valueOf( item.get( KEY_TNOCS ) ) );
    }
    String bgngYmd = item.get( "bgngYmd" ) != null ? String.valueOf( item.get( "bgngYmd" ) ).replace( "-", "" ) : null;
    String endYmd = item.get( "endYmd" ) != null ? String.valueOf( item.get( "endYmd" ) ).replace( "-", "" ) : null;
    disclosurePartnerMapper.insertPeriodScale( pblntSn, ptcpInstSn, trsfSeCd, tblSeCd, tnocs, bgngYmd, endYmd, updateBy, now );

  }

  private void replacePeriodScaleFromRequest(
      Map<String, Object> request,
      Long pblntSn,
      Long ptcpInstSn,
      String updateBy,
      LocalDateTime now ) {
    @SuppressWarnings("unchecked")
    List<Map<String, Object>> periodScaleList = (List<Map<String, Object>>) request.get( KEY_PERIOD_SCALE_LIST );
    if (periodScaleList == null || periodScaleList.isEmpty()) {
      return;
    }
    disclosurePartnerMapper.deletePeriodScale( pblntSn, ptcpInstSn );

    for (Map<String, Object> item : periodScaleList) {
      insertOnePeriodScaleRow( item, pblntSn, ptcpInstSn, updateBy, now );
    }
  }

  private void insertOneCatalogRow(
      Map<String, Object> item,
      Long pblntSn,
      Long ptcpInstSn,
      String updateBy,
      LocalDateTime now ) {
    String tblSeCd = item.get( KEY_TBL_SE_CD ) != null ? String.valueOf( item.get( KEY_TBL_SE_CD ) ) : null;
    String colNm = item.get( "colNm" ) != null ? String.valueOf( item.get( "colNm" ) ) : null;
    String dataTypeCd = item.get( "dataTypeCd" ) != null ? String.valueOf( item.get( "dataTypeCd" ) ) : null;
    String nullYn = item.get( "nullYn" ) != null ? String.valueOf( item.get( "nullYn" ) ) : "N";
    String pkYn = item.get( "pkYn" ) != null ? String.valueOf( item.get( "pkYn" ) ) : "N";
    String fkYn = item.get( "fkYn" ) != null ? String.valueOf( item.get( "fkYn" ) ) : "N";
    disclosurePartnerMapper.insertCatalog( pblntSn, ptcpInstSn, tblSeCd, colNm, dataTypeCd, nullYn, pkYn, fkYn, updateBy, now );

  }

  private void replaceCatalogFromRequest(
      Map<String, Object> request,
      Long pblntSn,
      Long ptcpInstSn,
      String updateBy,
      LocalDateTime now ) {
    @SuppressWarnings("unchecked")
    List<Map<String, Object>> catalogList = (List<Map<String, Object>>) request.get( KEY_CATALOG_LIST );
    if (catalogList == null || catalogList.isEmpty()) {
      return;
    }
    disclosurePartnerMapper.deleteCatalog( pblntSn, ptcpInstSn );

    for (Map<String, Object> item : catalogList) {
      insertOneCatalogRow( item, pblntSn, ptcpInstSn, updateBy, now );
    }
  }

  /**
   * savePartnerInformation 처리를 수행한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param request request
   */
  @Override
  @Transactional
  public void savePartnerInformation( UserVO user, Long pblntSn, Long ptcpInstSn, Map<String, Object> request ) {
    String updateBy = user != null && user.getNi() != null ? user.getNi() : DEFAULT_SYSTEM_USER;
    LocalDateTime now = LocalDateTime.now();

    applyCdmBasicInfoFromRequest( request, pblntSn, ptcpInstSn, updateBy, now );
    replacePeriodScaleFromRequest( request, pblntSn, ptcpInstSn, updateBy, now );
    replaceCatalogFromRequest( request, pblntSn, ptcpInstSn, updateBy, now );

  }

  /**
   * 조회 결과를 반환한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @Override
  @Transactional(readOnly = true)
  public Map<String, Object> getPartnerInformation( Long pblntSn, Long ptcpInstSn ) {

    java.util.Map<String, Object> result = new java.util.HashMap<>();

    
    PartnerBasicInfoRow partnerBasicInfo = disclosurePartnerMapper.findPartnerBasicInfo( pblntSn, ptcpInstSn );
    if (partnerBasicInfo != null) {
      result.put( KEY_VER_INFO_NM, partnerBasicInfo.getVerInfoNm() );
      result.put( KEY_LAST_UPDT_YMD, partnerBasicInfo.getLastUpdtYmd() );
      result.put( KEY_UPDT_CYCLE_CNT, partnerBasicInfo.getUpdtCycleCnt() );

    }

    
    List<PartnerPeriodScaleRow> periodScaleList = disclosurePartnerMapper.findPeriodScaleList( pblntSn, ptcpInstSn );
    result.put( KEY_PERIOD_SCALE_LIST, periodScaleList );

    
    List<PartnerCatalogRow> catalogList = disclosurePartnerMapper.findCatalogList( pblntSn, ptcpInstSn );
    result.put( KEY_CATALOG_LIST, catalogList );

    
    PartnerContactManagerRow contactManager = disclosurePartnerMapper.findPartnerInstContactAndManager( pblntSn, ptcpInstSn );
    if (contactManager != null) {
      result.put( KEY_INST_CONTACT, contactManager.getInstContact() );
      result.put( KEY_INST_MANAGER, contactManager.getInstManager() );

    }

    return result;
  }

  /**
   * 조회 결과를 반환한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @Override
  public String getCancelReason( Long pblntSn, Long ptcpInstSn ) {
    if (pblntSn == null || ptcpInstSn == null) {
      return null;
    }
    return disclosurePartnerMapper.findCancelReason( pblntSn, ptcpInstSn );
  }

  /**
   * 데이터를 수정한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param cancelReason cancelReason
   */
  @Override
  @Transactional
  public void updateCancelReason( UserVO user, Long pblntSn, Long ptcpInstSn, String cancelReason ) {
    if (pblntSn == null || ptcpInstSn == null) {
      throw new IllegalArgumentException( "공시번호와 참여기관번호는 필수입니다." );
    }
    if (cancelReason == null || cancelReason.trim().isEmpty()) {
      throw new IllegalArgumentException( "취소사유는 필수입니다." );
    }
    String updateBy = user != null && user.getNi() != null ? user.getNi() : DEFAULT_SYSTEM_USER;
    LocalDateTime updateTime = LocalDateTime.now();

    
    String existingReason = disclosurePartnerMapper.findCancelReason( pblntSn, ptcpInstSn );

    if (existingReason != null && !existingReason.trim().isEmpty()) {
      

      int updatedRows = disclosurePartnerMapper.updateCancelReason( pblntSn, ptcpInstSn, cancelReason.trim(), updateBy, updateTime );

      if (updatedRows == 0) {

      }
    } else {
      

      Long uldSttsChgSn = generateUldSttsChgSn();
      String chgRsnInfoCn = cancelReason.trim();

      try {
        disclosureMapper.insertUldSttsChg( uldSttsChgSn, ptcpInstSn, pblntSn, "04", updateTime, chgRsnInfoCn, updateBy, updateTime );

      } catch (Exception e) {

        throw e;
      }
    }

  }

  /**
   * 조회 결과를 반환한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @Override
  @Transactional(readOnly = true)
  public List<PartnerStatusInfoHistoryRow> getStatusInfoHistory( Long pblntSn, Long ptcpInstSn ) {
    if (pblntSn == null || ptcpInstSn == null) {
      return java.util.Collections.emptyList();
    }
    List<PartnerStatusInfoHistoryRow> list = disclosurePartnerMapper.findStatusInfoHistory( pblntSn, ptcpInstSn );
    return list != null ? list : java.util.Collections.emptyList();
  }

  /**
   * tryCloseDisclosureIfAllSettled 처리를 수행한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  @Override
  @Transactional
  public boolean tryCloseDisclosureIfAllSettled( UserVO user, Long pblntSn ) {
    if (pblntSn == null) return false;
    List<TbCmMUldPrstVO> partners = disclosurePartnerMapper.findByPblntSn( pblntSn );
    if (partners == null || partners.isEmpty()) return false;
    
    boolean allSettled = partners.stream().allMatch( p -> {
      String s = p.getUldInstPrgrsSttsStcd();
      return "03".equals( s ) || "04".equals( s ) || "05".equals( s );
    } );
    if (!allSettled) return false;
    String current = disclosureMapper.findStatus( pblntSn );
    if ("03".equals( current )) return false;
    String updateBy = user != null && user.getNi() != null ? user.getNi() : DEFAULT_SYSTEM_USER;
    LocalDateTime updateTime = LocalDateTime.now();
    disclosureMapper.updateStatus( pblntSn, "03", updateBy, updateTime );

    return true;
  }
}
