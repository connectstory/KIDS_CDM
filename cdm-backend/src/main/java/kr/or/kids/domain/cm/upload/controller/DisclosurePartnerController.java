package kr.or.kids.domain.cm.upload.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.common.mapper.CommonAuthrtMapper;
import kr.or.kids.domain.cm.upload.mapper.DisclosurePartnerMapper;
import kr.or.kids.domain.cm.upload.service.DisclosurePartnerService;
import kr.or.kids.domain.cm.upload.service.DisclosureService;
import kr.or.kids.domain.cm.upload.service.support.DisclosureMemberResolver;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import kr.or.kids.domain.cm.upload.vo.DisclosureMemberVO;
import kr.or.kids.global.common.CustomUserDetails;
import kr.or.kids.global.type.DisclosurePartnerProgressStatus;
import kr.or.kids.global.type.RoleType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/disclosures")
@RequiredArgsConstructor
public class DisclosurePartnerController {

  private static final String JSON_KEY_PBLNT_SN = "pblntSn";
  private static final String JSON_KEY_PTCP_INST_SN = "ptcpInstSn";
  private static final String JSON_KEY_CANCEL_REASON = "cancelReason";
  private static final String JSON_KEY_RGTR_ID = "rgtrId";
  private static final String JSON_KEY_RGTR_NM = "rgtrNm";
  private static final String JSON_KEY_REG_DT = "regDt";
  private static final String JSON_KEY_CAN_EDIT = "canEdit";
  private static final String JSON_KEY_STATUS = "status";
  private static final String JSON_KEY_REASON = "reason";
  private static final String MSG_STATUS_INFO_HIST_OK = "현황정보 입력 이력 조회 성공";
  private static final String TEN_ZEROS = "0000000000";

  private final DisclosurePartnerService disclosurePartnerService;
  private final DisclosurePartnerMapper disclosurePartnerMapper;
  private final DisclosureService disclosureService;
  private final CommonAuthrtMapper commonAuthrtMapper;
  private final DisclosureMemberResolver disclosureMemberResolver;

  private static boolean canAccessPartnerRow( DisclosureMemberVO member, Long ptcpInstSn ) {
    if (member == null || ptcpInstSn == null) {
      return false;
    }
    if ( Boolean.TRUE.equals( member.getIsAdmin() ) ) {
      return true;
    }
    if ( member.getPartner() != null && ptcpInstSn.equals( member.getPartner().getPtcpInstSn() ) ) {
      return true;
    }
    return false;
  }

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
      return DisclosurePartnerProgressStatus.IN_PROGRESS.code();
    }
    Object statusObj = request.get( JSON_KEY_STATUS );
    if ( statusObj instanceof String status ) {
      String normalized = DisclosurePartnerProgressStatus.normalizeCode( status );
      if ( !normalized.isEmpty() ) {
        return normalized;
      }
    }
    return DisclosurePartnerProgressStatus.IN_PROGRESS.code();
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

  private void logParticipationRequestHeaders(Long pblntSn, Long ptcpInstSn, String currentStatus,
      String requestedStatus, String cancelReason) {

  }
  



  // 참여취소 사유 조회
  @GetMapping("/{pblntSn}/partners/{ptcpInstSn}/cancel-reason")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getCancelReason(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long pblntSn,
      @PathVariable Long ptcpInstSn ) {
    DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve( pblntSn, user );
    if ( !canAccessPartnerRow( memberAndInst, ptcpInstSn ) ) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 참여기관에 대한 조회 권한이 없습니다.", null );
    }

    String editorUserType = user != null && user.getUserType() != null ? user.getUserType() : "";
    String editorMbrId = user != null && user.getMbrId() != null ? user.getMbrId() : "";
    Map<String, Object> view = disclosurePartnerService.getCancelReasonView( pblntSn, ptcpInstSn, editorUserType, editorMbrId );

    Map<String, Object> result = new HashMap<>();
    result.put( JSON_KEY_PBLNT_SN, pblntSn );
    result.put( JSON_KEY_PTCP_INST_SN, ptcpInstSn );
    result.put( JSON_KEY_CANCEL_REASON, view.get( "cancelReason" ) != null ? view.get( "cancelReason" ) : "" );
    result.put( JSON_KEY_RGTR_ID, view.get( "rgtrId" ) != null ? view.get( "rgtrId" ) : "" );
    result.put( JSON_KEY_RGTR_NM, view.get( "rgtrNm" ) != null ? view.get( "rgtrNm" ) : "" );
    result.put( JSON_KEY_REG_DT, view.get( "regDt" ) != null ? view.get( "regDt" ) : "" );
    result.put( JSON_KEY_CAN_EDIT, Boolean.TRUE.equals( view.get( "canEdit" ) ) );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여취소 사유 조회 성공", result );
  }

  // 참여취소 사유 수정
  @PostMapping("/{pblntSn}/partners/{ptcpInstSn}/cancel-reason/update")
  public ResponseEntity<ApiResponse<Map<String, Object>>> updateCancelReason(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long pblntSn,
      @PathVariable Long ptcpInstSn,
      @RequestBody Map<String, Object> request ) {
    DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve( pblntSn, user );
    if ( !canAccessPartnerRow( memberAndInst, ptcpInstSn ) ) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 참여기관에 대한 처리 권한이 없습니다.", null );
    }

    Object reasonObj = request != null ? request.get( JSON_KEY_CANCEL_REASON ) : null;
    String cancelReason = reasonObj != null ? String.valueOf( reasonObj ).trim() : null;
    if ( cancelReason == null || cancelReason.isEmpty() ) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "취소사유는 필수입니다.", null );
    }

    try {
      disclosurePartnerService.updateCancelReason( user, pblntSn, ptcpInstSn, cancelReason );
    } catch ( IllegalArgumentException e ) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage(), null );
    } catch ( IllegalStateException e ) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, e.getMessage(), null );
    }

    Map<String, Object> result = new HashMap<>();
    result.put( JSON_KEY_PBLNT_SN, pblntSn );
    result.put( JSON_KEY_PTCP_INST_SN, ptcpInstSn );
    result.put( JSON_KEY_CANCEL_REASON, cancelReason );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "취소사유가 수정되었습니다.", result );
  }

 
//   /**
//    * 조회 결과를 반환한다.
//    *
//    * @param du du
//    * @param pblntSn pblntSn
//    * @return 처리 결과
//    */
//   @GetMapping("/{pblntSn}/partners/busy-inst-ids")
//   public ResponseEntity<ApiResponse<List<String>>> getBusyInstKeysForPartnerPicker(
//       @AuthenticationPrincipal CustomUserDetails user,
//       @PathVariable Long pblntSn ) {

//     List<String> keys = disclosurePartnerService.findInstKeysBusyOnOtherInProgressDisclosures( pblntSn );
//     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "조회 성공", keys );
//   }


//   /**
//    * 데이터를 삭제한다.
//    *
//    * @param du du
//    * @param pblntSn pblntSn
//    * @param ptcpInstSn ptcpInstSn
//    * @return 처리 결과
//    */
//   @DeleteMapping("/{pblntSn}/partners/{ptcpInstSn}")
//   public ResponseEntity<ApiResponse<Void>> deletePartner( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long pblntSn, @PathVariable Long ptcpInstSn ) {

//     disclosurePartnerService.deletePartner( ptcpInstSn, pblntSn );
//     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관이 성공적으로 삭제되었습니다.", null );
//   }

  
  // 참여기관 상태 변경
  @PutMapping("/{pblntSn}/partners/{ptcpInstSn}/progress")
  public ResponseEntity<ApiResponse<Map<String, Object>>> requestParticipation(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long pblntSn,
      @PathVariable Long ptcpInstSn,
      @RequestBody Map<String, Object> request) 
  {
    DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve( pblntSn, user );
    if ( !canAccessPartnerRow( memberAndInst, ptcpInstSn ) ) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 공시에 대한 참여기관의 권한이 없습니다.", null );
    }

    String requestedStatus = parseParticipationRequestedStatus( request );
    String cancelReason = parseParticipationCancelReason( request );

    String currentStatus = disclosurePartnerService.getStatus( pblntSn, ptcpInstSn );
    logParticipationRequestHeaders( pblntSn, ptcpInstSn, currentStatus, requestedStatus, cancelReason );

    boolean isAdminReq = Boolean.TRUE.equals( memberAndInst.getIsAdmin() );
    if ( DisclosurePartnerProgressStatus.CANCELLED.code().equals( requestedStatus ) ) {
      String ut = memberAndInst.getUserType();
      if (RoleType.ADMIN.code().equals( ut )) {
        log.info( "participation progress: pblntSn={} ptcpInstSn={} 참여취소(관리자 userType=A)", pblntSn, ptcpInstSn );
      } else if (RoleType.PARTNER.code().equals( ut )) {
        log.info( "participation progress: pblntSn={} ptcpInstSn={} 참여거부(참여기관 userType=P)", pblntSn, ptcpInstSn );
      } else {
        log.warn( "participation progress: pblntSn={} ptcpInstSn={} status=04 userType={}", pblntSn, ptcpInstSn, ut );
      }
    }
    if (!isAdminReq && !DisclosurePartnerProgressStatus.CANCELLED.code().equals( requestedStatus )) {
      disclosureService.requireDisclosureInProgressForPartnerActions( pblntSn );
    }

    disclosurePartnerService.updateParticipationProgress( user, pblntSn, ptcpInstSn, requestedStatus, cancelReason );

    String updatedStatus = disclosurePartnerService.getStatus( pblntSn, ptcpInstSn );

    Map<String, Object> result = new HashMap<>();
    result.put( JSON_KEY_PBLNT_SN, pblntSn );
    result.put( JSON_KEY_PTCP_INST_SN, ptcpInstSn );
    result.put( "previousStatus", currentStatus );
    result.put( "currentStatus", updatedStatus );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "상태가 변경되었습니다.", result );
  }

  
//   /**
//    * 조회 결과를 반환한다.
//    *
//    * @param du du
//    * @param pblntSn pblntSn
//    * @param ptcpInstSn ptcpInstSn
//    * @return 처리 결과
//    */
//   @GetMapping("/{pblntSn}/partners/status")
//   public ResponseEntity<ApiResponse<Map<String, Object>>> getParticipationStatus(
//       @AuthenticationPrincipal CustomUserDetails user,
//       @PathVariable Long pblntSn,
//       @RequestParam Long ptcpInstSn ) {

//     if (pblntSn == null) {
//       return ApiResponse.error( HttpStatus.BAD_REQUEST, "공시번호가 없습니다.", null );
//     }
//     if ( !canAccessPartnerParticipation( du, pblntSn, ptcpInstSn ) ) {
//       return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 참여기관에 대한 조회 권한이 없습니다.", null );
//     }
//     String status = disclosurePartnerService.getStatus( pblntSn, ptcpInstSn );
//     Map<String, Object> result = new HashMap<>();
//     result.put( JSON_KEY_PBLNT_SN, pblntSn );
//     result.put( JSON_KEY_PTCP_INST_SN, ptcpInstSn );
//     result.put( JSON_KEY_STATUS, status );

//     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 상태 조회 성공", result );
//   }

  
//   /**
//    * 조회 결과를 반환한다.
//    *
//    * @param du du
//    * @param pblntSn pblntSn
//    * @param ptcpInstSn ptcpInstSn
//    * @return 처리 결과
//    */
//   @GetMapping("/{pblntSn}/partners/{ptcpInstSn}/information")
//   public ResponseEntity<ApiResponse<Map<String, Object>>> getPartnerInformation(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long pblntSn, @PathVariable Long ptcpInstSn ) {

    
//     Map<String, Object> result = disclosurePartnerService.getPartnerInformation( pblntSn, ptcpInstSn );

//     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 정보 조회 성공", result );
//   }

  
//   /**
//    * savePartnerInformation 처리를 수행한다.
//    *
//    * @param du du
//    * @param pblntSn pblntSn
//    * @param ptcpInstSn ptcpInstSn
//    * @param request request
//    * @return 처리 결과
//    */
//   @PostMapping("/{pblntSn}/partners/{ptcpInstSn}/information")
//   public ResponseEntity<ApiResponse<Void>> savePartnerInformation( @AuthenticationPrincipal CustomUserDetails user,@PathVariable Long pblntSn, @PathVariable Long ptcpInstSn, @RequestBody Map<String, Object> request ) {

//     disclosurePartnerService.savePartnerInformation( user, pblntSn, ptcpInstSn, request );

//     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 정보가 저장되었습니다.", null );
//   }

  
  
//   /**
//    * 조회 결과를 반환한다.
//    *
//    * @param du du
//    * @param pblntSn pblntSn
//    * @param ptcpInstSn ptcpInstSn
//    * @return 처리 결과
//    */
//   @GetMapping("/{pblntSn}/partners/{ptcpInstSn}/status-info-history")
//   public ResponseEntity<ApiResponse<List<PartnerStatusInfoHistoryRow>>> getStatusInfoHistory( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long pblntSn, @PathVariable Long ptcpInstSn ) {

//     List<PartnerStatusInfoHistoryRow> list = disclosurePartnerService.getStatusInfoHistory( pblntSn, ptcpInstSn );
//     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATUS_INFO_HIST_OK, list );
//   }

//   /**
//    * 관리자이거나, 해당 공시·참여기관 행의 기관(instId/brno)이 로그인 사용자 기관과 일치할 때만 허용한다.
//    */
//   private boolean canAccessPartnerParticipation( CustomUserDetails user, Long pblntSn, Long ptcpInstSn ) {
//     if ( du == null || pblntSn == null || ptcpInstSn == null ) {
//       return false;
//     }
//     if ( UploadAuthUtil.isAdmin( du ) ) {
//       return true;
//     }
//     String userInstId = UploadAuthUtil.resolvePartnerInstIdForAccess( du, commonAuthrtMapper );
//     if ( userInstId == null || userInstId.isBlank() ) {
//       return false;
//     }
//     List<TbCmMUldPrstVO> partners = disclosurePartnerMapper.findByPblntSn( pblntSn );
//     if ( partners == null || partners.isEmpty() ) {
//       return false;
//     }
//     for ( TbCmMUldPrstVO row : partners ) {
//       if ( row.getPtcpInstSn() == null || !row.getPtcpInstSn().equals( ptcpInstSn ) ) {
//         continue;
//       }
//       String del = row.getDelYn();
//       if ( del != null && "Y".equalsIgnoreCase( del.trim() ) ) {
//         continue;
//       }
//       String iid = row.getInstId();
//       if ( iid != null && !iid.isBlank() && isSameInst( userInstId, iid.trim() ) ) {
//         return true;
//       }
//       String br = row.getBrno();
//       if ( br != null && !br.isBlank() && isSameInst( userInstId, br.trim() ) ) {
//         return true;
//       }
//     }
//     return false;
//   }

  

  
//   /**
//    * 조회 결과를 반환한다.
//    *
//    * @param du du
//    * @param pblntSn pblntSn
//    * @param ptcpInstSn ptcpInstSn
//    * @return 처리 결과
//    */
//   @GetMapping("/{pblntSn}/partners/{ptcpInstSn}/uld-prgrs-yn")
//   public ResponseEntity<ApiResponse<Map<String, Object>>> getUldPrgrsYn(
//       @AuthenticationPrincipal CustomUserDetails user,
//       @PathVariable Long pblntSn,
//       @PathVariable Long ptcpInstSn ) {
//     if (du == null) {
//       return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
//     }
//     if ( !canAccessPartnerParticipation( du, pblntSn, ptcpInstSn ) ) {
//       return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 참여기관에 대한 조회 권한이 없습니다.", null );
//     }

//     String yn = disclosurePartnerMapper.findUldPrgrsYn( pblntSn, ptcpInstSn );
//     if (yn == null || yn.isBlank()) {
//       yn = "N";
//     }
//     Map<String, Object> result = new HashMap<>();
//     result.put( "uldPrgrsYn", yn.trim().toUpperCase().startsWith( "Y" ) ? "Y" : "N" );
//     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드 진행 플래그 조회 성공", result );
//   }

  
//   /**
//    * clearUldPrgrsYn 처리를 수행한다.
//    *
//    * @param du du
//    * @param pblntSn pblntSn
//    * @param ptcpInstSn ptcpInstSn
//    * @return 처리 결과
//    */
//   @PostMapping("/{pblntSn}/partners/{ptcpInstSn}/uld-prgrs-yn/clear")
//   public ResponseEntity<ApiResponse<Map<String, Object>>> clearUldPrgrsYn(
//       @AuthenticationPrincipal CustomUserDetails user,
//       @PathVariable Long pblntSn,
//       @PathVariable Long ptcpInstSn ) {
//     if (du == null) {
//       return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
//     }
//     if ( !canAccessPartnerParticipation( du, pblntSn, ptcpInstSn ) ) {
//       return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 참여기관에 대한 처리 권한이 없습니다.", null );
//     }

//     UserVO user = UploadAuthUtil.toUserVO( du );
//     String mdfrId = du != null ? du.getMbrId() : "SYSTEM";
//     disclosurePartnerMapper.updateUldPrgrsYn( pblntSn, ptcpInstSn, "N", mdfrId );
//     Map<String, Object> result = new HashMap<>();
//     result.put( "uldPrgrsYn", "N" );

//     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드 진행 플래그가 해제되었습니다.", result );
//   }

}
