package kr.or.kids.domain.cm.upload.controller;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import kr.or.kids.global.common.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.or.kids.domain.cm.common.mapper.CommonAuthrtMapper;
import kr.or.kids.domain.cm.common.vo.UserVO;
import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import kr.or.kids.domain.cm.upload.dto.DisclosurePartnerRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosurePartnerResponse;
import kr.or.kids.domain.cm.upload.dto.PartnerStatusInfoHistoryRow;
import kr.or.kids.domain.cm.upload.mapper.DisclosurePartnerMapper;
import kr.or.kids.domain.cm.upload.service.DisclosurePartnerService;
import kr.or.kids.domain.cm.upload.service.DisclosureService;
import kr.or.kids.domain.cm.upload.util.UploadAuthUtil;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 업로드 관련 API 요청을 처리한다.
 *
 * <pre>
 * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
 * </pre>
 */
@Slf4j
@RestController
@RequestMapping("/disclosures")
@RequiredArgsConstructor
public class DisclosurePartnerController {

  private static final String MSG_LOGIN_REQUIRED = "로그인이 필요합니다.";
  private static final String JSON_KEY_PBLNT_SN = "pblntSn";
  private static final String JSON_KEY_PTCP_INST_SN = "ptcpInstSn";
  private static final String JSON_KEY_CANCEL_REASON = "cancelReason";
  private static final String JSON_KEY_STATUS = "status";
  private static final String JSON_KEY_REASON = "reason";
  private static final String MSG_STATUS_INFO_HIST_OK = "현황정보 입력 이력 조회 성공";
  private static final String TEN_ZEROS = "0000000000";

  private final DisclosurePartnerService disclosurePartnerService;
  private final DisclosurePartnerMapper disclosurePartnerMapper;
  private final DisclosureService disclosureService;
  private final CommonAuthrtMapper commonAuthrtMapper;

  private static Long parseLongFromRequestMap( Map<String, Object> request, String key ) {
    Object o = request != null ? request.get( key ) : null;
    if (o instanceof Number) {
      return ((Number) o).longValue();
    }
    if (o instanceof String) {
      return UploadNonFatal.tryParseLong( (String) o );
    }
    return null;
  }

  private static String parseParticipationRequestedStatus( Map<String, Object> request ) {
    if ( request == null ) {
      return "02";
    }
    Object statusObj = request.get( JSON_KEY_STATUS );
    if ( statusObj instanceof String status ) {
      String trimmed = status.trim();
      if ( !trimmed.isEmpty() ) {
        return trimmed;
      }
    }
    return "02";
  }

  private static String parseParticipationCancelReason( Map<String, Object> request ) {
    if ( request == null ) {
      return null;
    }
    Object reasonObj = request.get( JSON_KEY_REASON );
    if ( reasonObj instanceof String reason ) {
      String trimmed = reason.trim();
      if ( !trimmed.isEmpty() ) {
        return trimmed;
      }
    }
    return null;
  }

  private void logParticipationRequestHeaders( Long pblntSn, Long ptcpInstSn, String currentStatus, String requestedStatus, String cancelReason ) {

  }

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  @GetMapping("/{pblntSn}/partners")
  public ResponseEntity<ApiResponse<List<DisclosurePartnerResponse>>> getPartners(@AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    List<DisclosurePartnerResponse> data = disclosurePartnerService.findByPblntSn( pblntSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 목록 조회 성공", data );
  }

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  @GetMapping("/{pblntSn}/partners/busy-inst-ids")
  public ResponseEntity<ApiResponse<List<String>>> getBusyInstKeysForPartnerPicker(
      @AuthenticationPrincipal CustomUserDetails du,
      @PathVariable Long pblntSn ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    List<String> keys = disclosurePartnerService.findInstKeysBusyOnOtherInProgressDisclosures( pblntSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "조회 성공", keys );
  }

  
  /**
   * addPartners 처리를 수행한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param request request
   * @return 처리 결과
   */
  @PostMapping("/{pblntSn}/partners")
  public ResponseEntity<ApiResponse<Void>> addPartners(@AuthenticationPrincipal CustomUserDetails du,  @PathVariable Long pblntSn, @RequestBody DisclosurePartnerRequest request ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    if (request == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "요청 데이터가 없습니다.", null );
    }

    if (request.getInstIds() == null) {
      request.setInstIds( Collections.emptyList() );
    }

    UserVO user = UploadAuthUtil.toUserVO( du );
    if (user == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
    }

    disclosurePartnerService.addPartners( user, pblntSn, request );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관이 성공적으로 동기화되었습니다.", null );
  }

  
  /**
   * 데이터를 삭제한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @DeleteMapping("/{pblntSn}/partners/{ptcpInstSn}")
  public ResponseEntity<ApiResponse<Void>> deletePartner( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @PathVariable Long ptcpInstSn ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    disclosurePartnerService.deletePartner( ptcpInstSn, pblntSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관이 성공적으로 삭제되었습니다.", null );
  }

  
  /**
   * requestParticipation 처리를 수행한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param request request
   * @return 처리 결과
   */
  @PostMapping("/{pblntSn}/partners/request")
  public ResponseEntity<ApiResponse<Map<String, Object>>> requestParticipation(
      @AuthenticationPrincipal CustomUserDetails du,
      @PathVariable Long pblntSn,
      @RequestBody Map<String, Object> request ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    UserVO user = UploadAuthUtil.toUserVO( du );
    if (user == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
    }

    if (pblntSn == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "공시번호가 없습니다.", null );
    }
    Long bodyPblntSn = parseLongFromRequestMap( request, JSON_KEY_PBLNT_SN );
    if ( bodyPblntSn != null && !bodyPblntSn.equals( pblntSn ) ) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "요청 본문의 공시번호가 경로와 일치하지 않습니다.", null );
    }

    Long ptcpInstSn = parseLongFromRequestMap( request, JSON_KEY_PTCP_INST_SN );
    if (ptcpInstSn == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "참여기관번호가 없습니다.", null );
    }
    if ( !canAccessPartnerParticipation( du, pblntSn, ptcpInstSn ) ) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 참여기관에 대한 처리 권한이 없습니다.", null );
    }

    String requestedStatus = parseParticipationRequestedStatus( request );
    String cancelReason = parseParticipationCancelReason( request );

    String currentStatus = disclosurePartnerService.getStatus( pblntSn, ptcpInstSn );
    logParticipationRequestHeaders( pblntSn, ptcpInstSn, currentStatus, requestedStatus, cancelReason );

    boolean isAdminReq = UploadAuthUtil.isAdmin( du );
    String normalizedRequested = requestedStatus != null ? requestedStatus.trim() : "";
    if (normalizedRequested.length() == 1) {
      normalizedRequested = "0" + normalizedRequested;
    }
    if (!isAdminReq && !"04".equals( normalizedRequested )) {
      disclosureService.requireDisclosureInProgressForPartnerActions( pblntSn );
    }

    disclosurePartnerService.updateStatus( user, pblntSn, ptcpInstSn, requestedStatus, cancelReason );

    String updatedStatus = disclosurePartnerService.getStatus( pblntSn, ptcpInstSn );

    Map<String, Object> result = new HashMap<>();
    result.put( JSON_KEY_PBLNT_SN, pblntSn );
    result.put( JSON_KEY_PTCP_INST_SN, ptcpInstSn );
    result.put( "previousStatus", currentStatus );
    result.put( "currentStatus", updatedStatus );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "상태가 변경되었습니다.", result );
  }

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @GetMapping("/{pblntSn}/partners/status")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getParticipationStatus(
      @AuthenticationPrincipal CustomUserDetails du,
      @PathVariable Long pblntSn,
      @RequestParam Long ptcpInstSn ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    if (pblntSn == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "공시번호가 없습니다.", null );
    }
    if ( !canAccessPartnerParticipation( du, pblntSn, ptcpInstSn ) ) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 참여기관에 대한 조회 권한이 없습니다.", null );
    }
    String status = disclosurePartnerService.getStatus( pblntSn, ptcpInstSn );
    Map<String, Object> result = new HashMap<>();
    result.put( JSON_KEY_PBLNT_SN, pblntSn );
    result.put( JSON_KEY_PTCP_INST_SN, ptcpInstSn );
    result.put( JSON_KEY_STATUS, status );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 상태 조회 성공", result );
  }

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @GetMapping("/{pblntSn}/partners/{ptcpInstSn}/information")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getPartnerInformation(@AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @PathVariable Long ptcpInstSn ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    Map<String, Object> result = disclosurePartnerService.getPartnerInformation( pblntSn, ptcpInstSn );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 정보 조회 성공", result );
  }

  
  /**
   * savePartnerInformation 처리를 수행한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param request request
   * @return 처리 결과
   */
  @PostMapping("/{pblntSn}/partners/{ptcpInstSn}/information")
  public ResponseEntity<ApiResponse<Void>> savePartnerInformation( @AuthenticationPrincipal CustomUserDetails du,@PathVariable Long pblntSn, @PathVariable Long ptcpInstSn, @RequestBody Map<String, Object> request ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    UserVO user = UploadAuthUtil.toUserVO( du );
    if (user == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
    }

    disclosurePartnerService.savePartnerInformation( user, pblntSn, ptcpInstSn, request );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 정보가 저장되었습니다.", null );
  }

  
  
  /**
   * 조회 결과를 반환한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @GetMapping("/{pblntSn}/partners/{ptcpInstSn}/status-info-history")
  public ResponseEntity<ApiResponse<List<PartnerStatusInfoHistoryRow>>> getStatusInfoHistory( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @PathVariable Long ptcpInstSn ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    if (ptcpInstSn == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "참여기관일련번호는 필수입니다.", null );
    }

    List<PartnerStatusInfoHistoryRow> list = disclosurePartnerService.getStatusInfoHistory( pblntSn, ptcpInstSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATUS_INFO_HIST_OK, list );
  }

  private static boolean isSameInst( String a, String b ) {
    if (a == null || b == null) return false;
    String pa = (TEN_ZEROS + a.trim());
    String pb = (TEN_ZEROS + b.trim());
    return pa.substring( Math.max( 0, pa.length() - 10 ) ).equals( pb.substring( Math.max( 0, pb.length() - 10 ) ) );
  }

  /**
   * 관리자이거나, 해당 공시·참여기관 행의 기관(instId/brno)이 로그인 사용자 기관과 일치할 때만 허용한다.
   */
  private boolean canAccessPartnerParticipation( CustomUserDetails du, Long pblntSn, Long ptcpInstSn ) {
    if ( du == null || pblntSn == null || ptcpInstSn == null ) {
      return false;
    }
    if ( UploadAuthUtil.isAdmin( du ) ) {
      return true;
    }
    String userInstId = UploadAuthUtil.resolvePartnerInstIdForAccess( du, commonAuthrtMapper );
    if ( userInstId == null || userInstId.isBlank() ) {
      return false;
    }
    List<TbCmMUldPrstVO> partners = disclosurePartnerMapper.findByPblntSn( pblntSn );
    if ( partners == null || partners.isEmpty() ) {
      return false;
    }
    for ( TbCmMUldPrstVO row : partners ) {
      if ( row.getPtcpInstSn() == null || !row.getPtcpInstSn().equals( ptcpInstSn ) ) {
        continue;
      }
      String del = row.getDelYn();
      if ( del != null && "Y".equalsIgnoreCase( del.trim() ) ) {
        continue;
      }
      String iid = row.getInstId();
      if ( iid != null && !iid.isBlank() && isSameInst( userInstId, iid.trim() ) ) {
        return true;
      }
      String br = row.getBrno();
      if ( br != null && !br.isBlank() && isSameInst( userInstId, br.trim() ) ) {
        return true;
      }
    }
    return false;
  }

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @GetMapping("/{pblntSn}/partners/{ptcpInstSn}/cancel-reason")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getCancelReason( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @PathVariable Long ptcpInstSn ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    String cancelReason = disclosurePartnerService.getCancelReason( pblntSn, ptcpInstSn );

    Map<String, Object> result = new HashMap<>();
    result.put( JSON_KEY_PBLNT_SN, pblntSn );
    result.put( JSON_KEY_PTCP_INST_SN, ptcpInstSn );
    result.put( JSON_KEY_CANCEL_REASON, cancelReason != null ? cancelReason : "" );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여취소 사유 조회 성공", result );
  }

  
  /**
   * 데이터를 수정한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param request request
   * @return 처리 결과
   */
  @PostMapping("/{pblntSn}/partners/{ptcpInstSn}/cancel-reason/update")
  public ResponseEntity<ApiResponse<Map<String, Object>>> updateCancelReason( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @PathVariable Long ptcpInstSn, @RequestBody Map<String, Object> request ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    UserVO user = UploadAuthUtil.toUserVO( du );
    if (user == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
    }

    String cancelReason = null;
    Object reasonObj = request != null ? request.get( JSON_KEY_CANCEL_REASON ) : null;
    if (reasonObj instanceof String && !((String) reasonObj).trim().isEmpty()) {
      cancelReason = ((String) reasonObj).trim();
    }

    if (cancelReason == null || cancelReason.trim().isEmpty()) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "취소사유는 필수입니다.", null );
    }

    disclosurePartnerService.updateCancelReason( user, pblntSn, ptcpInstSn, cancelReason );

    Map<String, Object> result = new HashMap<>();
    result.put( JSON_KEY_PBLNT_SN, pblntSn );
    result.put( JSON_KEY_PTCP_INST_SN, ptcpInstSn );
    result.put( JSON_KEY_CANCEL_REASON, cancelReason );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "취소사유가 수정되었습니다.", result );
  }

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @GetMapping("/{pblntSn}/partners/{ptcpInstSn}/uld-prgrs-yn")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getUldPrgrsYn(
      @AuthenticationPrincipal CustomUserDetails du,
      @PathVariable Long pblntSn,
      @PathVariable Long ptcpInstSn ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }
    if ( !canAccessPartnerParticipation( du, pblntSn, ptcpInstSn ) ) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 참여기관에 대한 조회 권한이 없습니다.", null );
    }

    String yn = disclosurePartnerMapper.findUldPrgrsYn( pblntSn, ptcpInstSn );
    if (yn == null || yn.isBlank()) {
      yn = "N";
    }
    Map<String, Object> result = new HashMap<>();
    result.put( "uldPrgrsYn", yn.trim().toUpperCase().startsWith( "Y" ) ? "Y" : "N" );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드 진행 플래그 조회 성공", result );
  }

  
  /**
   * clearUldPrgrsYn 처리를 수행한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @PostMapping("/{pblntSn}/partners/{ptcpInstSn}/uld-prgrs-yn/clear")
  public ResponseEntity<ApiResponse<Map<String, Object>>> clearUldPrgrsYn(
      @AuthenticationPrincipal CustomUserDetails du,
      @PathVariable Long pblntSn,
      @PathVariable Long ptcpInstSn ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }
    if ( !canAccessPartnerParticipation( du, pblntSn, ptcpInstSn ) ) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 참여기관에 대한 처리 권한이 없습니다.", null );
    }

    UserVO user = UploadAuthUtil.toUserVO( du );
    String mdfrId = user != null && user.getNi() != null ? user.getNi() : (du != null ? du.getMbrId() : "SYSTEM");
    disclosurePartnerMapper.updateUldPrgrsYn( pblntSn, ptcpInstSn, "N", mdfrId );
    Map<String, Object> result = new HashMap<>();
    result.put( "uldPrgrsYn", "N" );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드 진행 플래그가 해제되었습니다.", result );
  }

}
