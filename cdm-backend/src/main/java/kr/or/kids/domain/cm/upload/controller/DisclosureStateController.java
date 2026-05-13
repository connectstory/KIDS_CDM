package kr.or.kids.domain.cm.upload.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.common.vo.UserVO;
import kr.or.kids.domain.cm.upload.service.DisclosurePartnerService;
import kr.or.kids.domain.cm.upload.service.DisclosureService;
import kr.or.kids.domain.cm.upload.util.UploadAuthUtil;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import kr.or.kids.global.common.CustomUserDetails;
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
public class DisclosureStateController {

  private static final String MSG_NO_PBLNT_SN = "공시번호가 없습니다.";
  private static final String JSON_KEY_PBLNT_SN = "pblntSn";
  private static final String JSON_KEY_PTCP_INST_SN = "ptcpInstSn";
  private static final String JSON_KEY_PBLNT_PRGRS_STTS_CD = "pblntPrgrsSttsCd";

  private final DisclosureService disclosureService;
  private final DisclosureController disclosureController;
  private final kr.or.kids.domain.cm.upload.service.UploadStatsService uploadStatsService;
  private final DisclosurePartnerService disclosurePartnerService;
  private static final String CLOSE_CANCEL_REASON = "마감에 의한 취소";
  private static final String MSG_LOGIN_REQUIRED = "로그인이 필요합니다.";

  
  // 업로드 현황 확정
  @PostMapping("/{pblntSn}/upload-stats/confirm")
  public ResponseEntity<ApiResponse<Void>> confirmUploadStats( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @RequestBody Map<String, Object> request ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    UserVO user = UploadAuthUtil.toUserVO( du );
    if (user == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
    }

    Long ptcpInstSn = parsePtcpInstSnFromRequest( request );

    if (ptcpInstSn == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "참여기관일련번호가 필요합니다. 자신의 기관이 공시에 참여하지 않았거나 참여기관 정보를 찾을 수 없습니다.", null );
    }

    disclosureService.requireDisclosureInProgressForPartnerActions( pblntSn );

    uploadStatsService.confirmUploadStats( user, pblntSn, ptcpInstSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드가 확정되었습니다.", null );
  }
  // 구 클라이언트 호환: {@code GET /disclosures/status?pblntSn=}. 신규는 {@code GET /disclosures/{pblntSn}/status} 권장.
  @GetMapping( value = "/status", params = "pblntSn" )
  public ResponseEntity<ApiResponse<Map<String, Object>>> getDisclosureStatusLegacyQuery(
      @AuthenticationPrincipal CustomUserDetails du,
      @RequestParam( "pblntSn" ) Long pblntSn ) {
    return disclosureController.getDisclosureStatus( du, pblntSn );
  }

  // {@code pblntSn} 없이 {@code /disclosures/status}만 호출한 경우 안내 응답.
  @GetMapping( value = "/status", params = "!pblntSn" )
  public ResponseEntity<ApiResponse<Map<String, Object>>> getDisclosureStatusLegacyMissingPblntSn() {
    return ApiResponse.error(
        HttpStatus.BAD_REQUEST,
        "공시번호(pblntSn)가 필요합니다. 예: /disclosures/status?pblntSn=1 또는 /disclosures/1/status",
        null );
  }

  // 구 클라이언트 호환: {@code POST /disclosures/status?pblntSn=} 또는 본문에 {@code pblntSn}. 신규는 {@code POST /disclosures/{pblntSn}/status} 권장.
  @PostMapping( "/status" )
  public ResponseEntity<ApiResponse<Void>> updateDisclosureStatusLegacy(
      @AuthenticationPrincipal CustomUserDetails du,
      @RequestParam( value = "pblntSn", required = false ) Long pblntSnQuery,
      @RequestBody( required = false ) Map<String, Object> request ) {
    Long pblntSn = pblntSnQuery != null ? pblntSnQuery : parsePblntSnFromBody( request );
    if ( pblntSn == null ) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_NO_PBLNT_SN, null );
    }
    return disclosureController.updateDisclosureStatus( du, pblntSn, request != null ? request : new HashMap<>() );
  }

  
  // 공시 완료 체크
  @PostMapping("/{pblntSn}/check-and-complete")
  public ResponseEntity<ApiResponse<Map<String, Object>>> checkAndCompleteDisclosure( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    UserVO user = UploadAuthUtil.toUserVO( du );
    if (user == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
    }

    List<kr.or.kids.domain.cm.upload.dto.DisclosurePartnerResponse> partners = disclosurePartnerService.findByPblntSn( pblntSn );

    if (partners.isEmpty()) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "참여기관이 없습니다.", null );
    }

    boolean allCompleted = partners.stream().allMatch( partner -> {
      String status = partner.getUldInstPrgrsSttsStcd();
      boolean isSettled = "03".equals( status ) || "04".equals( status ) || "05".equals( status );

      return isSettled;
    } );

    Map<String, Object> result = new java.util.HashMap<>();
    result.put( JSON_KEY_PBLNT_SN, pblntSn );
    result.put( "totalPartners", partners.size() );
    result.put( "allCompleted", allCompleted );
    result.put( "statusUpdated", false );

    if (!allCompleted) {
      List<Map<String, Object>> incompletePartners = partners.stream().filter( partner -> {
        String s = partner.getUldInstPrgrsSttsStcd();
        return !"03".equals( s ) && !"04".equals( s ) && !"05".equals( s );
      } ).map( partner -> {
        Map<String, Object> partnerInfo = new java.util.HashMap<>();
        partnerInfo.put( "instId", partner.getInstId() );
        partnerInfo.put( "instNm", partner.getInstNm() );
        partnerInfo.put( "status", partner.getUldInstPrgrsSttsStcd() );
        return partnerInfo;
      } ).collect( java.util.stream.Collectors.toList() );
      result.put( "incompletePartners", incompletePartners );
    }

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, allCompleted ? "모든 참여기관이 완료 상태입니다." : "아직 완료되지 않은 참여기관이 있습니다.", result );
  }

  
  // 공시 마감 및 미등록 참여기관 취소
  @PostMapping("/{pblntSn}/close")
  public ResponseEntity<ApiResponse<Map<String, Object>>> closeDisclosureAndCancelUnregisteredPartners(
          @AuthenticationPrincipal CustomUserDetails du,
          @PathVariable Long pblntSn
  ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
    }

    UserVO user = UploadAuthUtil.toUserVO( du );
    if (pblntSn == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_NO_PBLNT_SN, null );
    }

    List<kr.or.kids.domain.cm.upload.dto.DisclosurePartnerResponse> partners = disclosurePartnerService.findByPblntSn( pblntSn );
    if (partners == null || partners.isEmpty()) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "참여기관이 없습니다.", null );
    }

    int cancelledCount = 0;
    for (kr.or.kids.domain.cm.upload.dto.DisclosurePartnerResponse partner : partners) {
      String status = partner.getUldInstPrgrsSttsStcd();
      String normalized = status != null ? status.trim() : "";
      if (normalized.length() == 1) normalized = "0" + normalized;

      if ("03".equals( normalized ) || "04".equals( normalized ) || "05".equals( normalized )) {
        continue;
      }

      disclosurePartnerService.updateStatus( user, pblntSn, partner.getPtcpInstSn(), "04", CLOSE_CANCEL_REASON );
      cancelledCount++;
    }

    boolean closed = disclosurePartnerService.tryCloseDisclosureIfAllSettled( user, pblntSn );

    Map<String, Object> result = new HashMap<>();
    result.put( JSON_KEY_PBLNT_SN, pblntSn );
    result.put( "cancelledCount", cancelledCount );
    result.put( "closed", closed );
    result.put( JSON_KEY_PBLNT_PRGRS_STTS_CD, disclosureService.getStatus( pblntSn ) );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "공시가 마감되었습니다.", result );
  }

  private static Long parsePblntSnFromBody( Map<String, Object> request ) {
    if ( request == null || !request.containsKey( JSON_KEY_PBLNT_SN ) ) {
      return null;
    }
    Object o = request.get( JSON_KEY_PBLNT_SN );
    if ( o == null ) {
      return null;
    }
    if ( o instanceof Number ) {
      return ( (Number) o ).longValue();
    }
    if ( o instanceof String ) {
      return UploadNonFatal.tryParseLong( (String) o );
    }
    return null;
  }

  private static Long parsePtcpInstSnFromRequest( Map<String, Object> request ) {
    if (request == null || !request.containsKey( JSON_KEY_PTCP_INST_SN )) {
      return null;
    }
    Object ptcpInstSnObj = request.get( JSON_KEY_PTCP_INST_SN );
    if (ptcpInstSnObj == null) {
      return null;
    }
    if (ptcpInstSnObj instanceof Number) {
      return ((Number) ptcpInstSnObj).longValue();
    }
    if (ptcpInstSnObj instanceof String) {
      return UploadNonFatal.tryParseLong( (String) ptcpInstSnObj );
    }
    return null;
  }
}
