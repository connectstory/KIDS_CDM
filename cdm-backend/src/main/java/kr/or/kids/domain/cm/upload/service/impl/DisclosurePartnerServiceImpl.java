package kr.or.kids.domain.cm.upload.service.impl;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import kr.or.kids.domain.cm.upload.dto.CancelReasonMetaRow;
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
import kr.or.kids.domain.cm.upload.vo.DisclosureMemberVO;
import kr.or.kids.global.common.CustomUserDetails;
import kr.or.kids.global.type.DisclosurePartnerProgressStatus;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DisclosurePartnerServiceImpl implements DisclosurePartnerService {

  private final DisclosurePartnerCloseDataCleanupService closeDataCleanupService;

  private static final String MSG_INST_ALREADY_ON_IN_PROGRESS_DISCLOSURE = "이미 공시진행중입니다.";

  private static final String KEY_VER_INFO_NM = "verInfoNm";
  private static final String KEY_LAST_UPDT_YMD = "lastUpdtYmd";
  private static final String KEY_TBL_SE_CD = "tblSeCd";
  private static final String KEY_INST_MANAGER = "instManager";
  private static final String KEY_INST_CONTACT = "instContact";
  private static final String KEY_UPDT_CYCLE_CNT = "updtCycleCnt";
  private static final String KEY_TNOCS = "tnocs";
  private static final String KEY_PERIOD_SCALE_LIST = "periodScaleList";
  private static final String KEY_CATALOG_LIST = "catalogList";

  private static final String MSG_PARTNER_LIST_FORBIDDEN = "참여기관 목록 조회 권한이 없습니다.";

  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final DisclosurePartnerMapper disclosurePartnerMapper;
  private final DisclosureMapper disclosureMapper;

  private static Object mapGetCamelOrSnake( Map<String, Object> m, String camel, String snake ) {
    if (m == null) return null;
    Object v = m.get( camel );
    return v != null ? v : m.get( snake );
  }

  // 참여기관 목록 조회
  @Override
  @Transactional(readOnly = true)
  public List<DisclosurePartnerResponse> findByPblntSn( Long pblntSn ) {

    List<TbCmMUldPrstVO> vos = disclosurePartnerMapper.findByPblntSn( pblntSn );

    if (vos == null) {
      return List.of();
    }

    return vos.stream().map( vo -> {
      String instNm = vo.getInstNm();
      if (instNm == null || instNm.trim().isEmpty()) {
        instNm = vo.getInstId();
      }
      return new DisclosurePartnerResponse( vo.getPtcpInstSn(), vo.getPblntSn(), vo.getInstId(), instNm, vo.getUldInstPrgrsSttsStcd(), vo.getPtcpDmndDt(), vo.getPtcpCfmtnDt(), vo.getPtcpRtrcnDt(), vo.getPtcpRegDt(), vo.getPtcpCmptnDt(), vo.getPtcpRdmndDt(), vo.getUldTypeCd(), vo.getUldDt(),
          vo.getVerInfoNm(), vo.getLastUpdtYmd(), vo.getRegYmd(), vo.getUpdtCycle(), vo.getDelYn() );
    } ).collect( Collectors.toList() );
  }

  // 공시 멤버 권한별 참여기관 목록 조회
  @Override
  @Transactional(readOnly = true)
  public List<DisclosurePartnerResponse> findByPblntSnForDisclosureMember( Long pblntSn, DisclosureMemberVO memberAndInst ) {
    boolean admin = Boolean.TRUE.equals( memberAndInst.getIsAdmin() );
    boolean isPartner = memberAndInst.getPartner() != null;
    if (!admin && !isPartner) {
      throw new ResponseStatusException( HttpStatus.FORBIDDEN, MSG_PARTNER_LIST_FORBIDDEN );
    }
    List<DisclosurePartnerResponse> data = findByPblntSn( pblntSn );
    if (!admin && isPartner) {
      Long selfPtcpInstSn = memberAndInst.getPartner().getPtcpInstSn();
      return data.stream()
          .filter( row -> selfPtcpInstSn != null && selfPtcpInstSn.equals( row.getPtcpInstSn() ) )
          .collect( Collectors.toList() );
    }
    return data;
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
      vo.setUldInstPrgrsSttsStcd( DisclosurePartnerProgressStatus.INVITATION_REQUEST.code() );
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

  // 참여기관 추가
  @Override
  @Transactional
  public void addPartners( CustomUserDetails user, Long pblntSn, DisclosurePartnerRequest request ) {
    String createBy = user.getMbrId();
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

  // 진행중 다른 공시 사용 기관키 조회
  @Override
  @Transactional(readOnly = true)
  public List<String> findInstKeysBusyOnOtherInProgressDisclosures( Long pblntSn ) {
    if (pblntSn == null) {
      return List.of();
    }
    List<String> rows = disclosurePartnerMapper.findInstKeysOnOtherInProgressDisclosures( pblntSn );
    return rows != null ? rows : List.of();
  }

  // 참여기관 참여취소 처리
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

    if ( DisclosurePartnerProgressStatus.CANCELLED.equalsNormalized( uldInstPrgrsSttsStcd ) && cancelReason != null && !cancelReason.trim().isEmpty()) {
      Long uldSttsChgSn = generateUldSttsChgSn();
      String chgRsnInfoCn = cancelReason.trim();
      disclosureMapper.insertUldSttsChg( uldSttsChgSn, ptcpInstSn, pblntSn, DisclosurePartnerProgressStatus.CANCELLED.code(), updateTime, chgRsnInfoCn, updateBy, updateTime );
    }
  }

  // 참여기관 상태 조회
  @Override
  @Transactional(readOnly = true)
  public String getStatus( Long pblntSn, Long ptcpInstSn ) {
    return disclosurePartnerMapper.findStatus( pblntSn, ptcpInstSn );
  }

  // 참여기관 상태 변경
  @Override
  @Transactional
  public void updateParticipationProgress( CustomUserDetails user, Long pblntSn, Long ptcpInstSn, String uldInstPrgrsSttsStcd, String cancelReason ) {
    if (pblntSn == null || ptcpInstSn == null) {
      throw new IllegalArgumentException( "공시번호와 참여기관번호는 필수입니다." );
    }
    if (uldInstPrgrsSttsStcd == null || uldInstPrgrsSttsStcd.trim().isEmpty()) {
      throw new IllegalArgumentException( "진행상태코드는 필수입니다." );
    }
    String updateBy = user.getMbrId();
    LocalDateTime updateTime = LocalDateTime.now();

    disclosurePartnerMapper.updateStatus( pblntSn, ptcpInstSn, uldInstPrgrsSttsStcd, updateBy, updateTime );
    persistWithdrawCancelReasonIfApplicable( uldInstPrgrsSttsStcd, cancelReason, pblntSn, ptcpInstSn, updateBy, updateTime );

    if ( isParticipationCancelledStatus( uldInstPrgrsSttsStcd ) ) {
      closeDataCleanupService.purgeAfterCloseCancellation( pblntSn, ptcpInstSn, updateBy );
    }
  }

  private static boolean isParticipationCancelledStatus( String uldInstPrgrsSttsStcd ) {
    return DisclosurePartnerProgressStatus.CANCELLED.equalsNormalized( uldInstPrgrsSttsStcd );
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

  // 참여기관 정보 저장
  @Override
  @Transactional
  public void savePartnerInformation( CustomUserDetails user, Long pblntSn, Long ptcpInstSn, Map<String, Object> request ) {
    String updateBy = user.getMbrId();
    LocalDateTime now = LocalDateTime.now();

    applyCdmBasicInfoFromRequest( request, pblntSn, ptcpInstSn, updateBy, now );
    replacePeriodScaleFromRequest( request, pblntSn, ptcpInstSn, updateBy, now );
    replaceCatalogFromRequest( request, pblntSn, ptcpInstSn, updateBy, now );

  }

  // 참여기관 정보 조회
  @Override
  @Transactional(readOnly = true)
  public Map<String, Object> getPartnerInformation( Long pblntSn, Long ptcpInstSn ) {

    Map<String, Object> result = new HashMap<>();

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

  // 참여취소 사유 조회 (문자열)
  @Override
  public String getCancelReason( Long pblntSn, Long ptcpInstSn ) {
    if (pblntSn == null || ptcpInstSn == null) {
      return null;
    }
    return disclosurePartnerMapper.findCancelReason( pblntSn, ptcpInstSn );
  }

  // 참여취소 사유 조회
  @Override
  @Transactional(readOnly = true)
  public Map<String, Object> getCancelReasonView( Long pblntSn, Long ptcpInstSn, String editorUserType, String editorMbrId ) {
    Map<String, Object> out = new HashMap<>();
    if (pblntSn == null || ptcpInstSn == null) {
      out.put( "cancelReason", "" );
      out.put( "rgtrId", "" );
      out.put( "rgtrNm", "" );
      out.put( "regDt", "" );
      out.put( "canEdit", Boolean.TRUE );
      return out;
    }
    CancelReasonMetaRow meta = disclosurePartnerMapper.findCancelReasonMeta( pblntSn, ptcpInstSn );
    String cancelReason = "";
    String rgtrId = "";
    String rgtrNm = "";
    String regDt = "";
    if (meta != null) {
      cancelReason = meta.getCancelReason() != null ? meta.getCancelReason() : "";
      rgtrId = meta.getRgtrId() != null ? meta.getRgtrId().trim() : "";
      rgtrNm = meta.getRgtrNm() != null ? meta.getRgtrNm().trim() : "";
      regDt = meta.getRegDt() != null ? meta.getRegDt().trim() : "";
    }
    out.put( "cancelReason", cancelReason );
    out.put( "rgtrId", rgtrId );
    out.put( "rgtrNm", rgtrNm );
    out.put( "regDt", regDt );
    out.put( "canEdit", computeCanEditCancelReason( cancelReason, rgtrId, editorUserType, editorMbrId ) );
    return out;
  }

  // 관리자(A)는 사유가 있어도 수정 가능. 파트너(P)는 등록자(rgtr_id)와 로그인 mbrId가 같을 때만 수정 가능.
  private static boolean computeCanEditCancelReason( String cancelReasonText, String rgtrIdTrimmed, String editorUserType, String editorMbrId ) {
    String cr = cancelReasonText != null ? cancelReasonText.trim() : "";
    if (cr.isEmpty()) {
      return true;
    }
    if ("A".equals( editorUserType )) {
      return true;
    }
    String r = rgtrIdTrimmed != null ? rgtrIdTrimmed.trim() : "";
    String m = editorMbrId != null ? editorMbrId.trim() : "";
    if (r.isEmpty() || m.isEmpty()) {
      return false;
    }
    return r.equals( m );
  }

  // 참여취소 사유 수정
  @Override
  @Transactional
  public void updateCancelReason( CustomUserDetails user, Long pblntSn, Long ptcpInstSn, String cancelReason ) {
    if (pblntSn == null || ptcpInstSn == null) {
      throw new IllegalArgumentException( "공시번호와 참여기관번호는 필수입니다." );
    }
    if (cancelReason == null || cancelReason.trim().isEmpty()) {
      throw new IllegalArgumentException( "취소사유는 필수입니다." );
    }
    String updateBy = user.getMbrId();
    LocalDateTime updateTime = LocalDateTime.now();
    boolean isAdmin = user.isAdmin();
    String editorMbrId = updateBy != null ? updateBy.trim() : "";

    String existingReason = disclosurePartnerMapper.findCancelReason( pblntSn, ptcpInstSn );

    if (existingReason != null && !existingReason.trim().isEmpty()) {

      CancelReasonMetaRow meta = disclosurePartnerMapper.findCancelReasonMeta( pblntSn, ptcpInstSn );
      String rgtr = meta != null && meta.getRgtrId() != null ? meta.getRgtrId().trim() : "";
      if (!isAdmin) {
        if (rgtr.isEmpty() || !rgtr.equals( editorMbrId )) {
          throw new IllegalStateException( "취소사유는 최초 등록자만 수정할 수 있습니다." );
        }
      }

      boolean requireRgtrMatch = !isAdmin;
      String authorizedRgtrId = requireRgtrMatch ? editorMbrId : "";
      int updatedRows = disclosurePartnerMapper.updateCancelReason( pblntSn, ptcpInstSn, cancelReason.trim(), updateBy, updateTime, authorizedRgtrId, requireRgtrMatch );

      if (updatedRows == 0) {
        throw new IllegalStateException( "취소사유를 수정할 수 없습니다. 권한을 확인하세요." );
      }
    } else {
      Long uldSttsChgSn = generateUldSttsChgSn();
      String chgRsnInfoCn = cancelReason.trim();
      disclosureMapper.insertUldSttsChg( uldSttsChgSn, ptcpInstSn, pblntSn, DisclosurePartnerProgressStatus.CANCELLED.code(), updateTime, chgRsnInfoCn, updateBy, updateTime );
    }

  }

  // 현황정보 입력 이력 조회
  @Override
  @Transactional(readOnly = true)
  public List<PartnerStatusInfoHistoryRow> getStatusInfoHistory( Long pblntSn, Long ptcpInstSn ) {
    if (pblntSn == null || ptcpInstSn == null) {
      return List.of();
    }
    List<PartnerStatusInfoHistoryRow> list = disclosurePartnerMapper.findStatusInfoHistory( pblntSn, ptcpInstSn );
    return list != null ? list : List.of();
  }

  // 전체 정산 시 공시 마감
  @Override
  @Transactional
  public boolean tryCloseDisclosureIfAllSettled( CustomUserDetails user, Long pblntSn ) {
    if (pblntSn == null) return false;
    List<TbCmMUldPrstVO> partners = disclosurePartnerMapper.findByPblntSn( pblntSn );
    if (partners == null || partners.isEmpty()) return false;

    boolean allSettled = partners.stream().allMatch( p -> {
      String s = p.getUldInstPrgrsSttsStcd();
      return DisclosurePartnerProgressStatus.isSettledForClose( s );
    } );
    if (!allSettled) return false;
    String current = disclosureMapper.findStatus( pblntSn );
    if ("03".equals( current )) return false;
    String updateBy = user.getMbrId();
    LocalDateTime updateTime = LocalDateTime.now();
    disclosureMapper.updateStatus( pblntSn, "03", updateBy, updateTime );

    return true;
  }
}
