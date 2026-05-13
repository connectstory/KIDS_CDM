package kr.or.kids.domain.cm.upload.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.common.service.FileApiService;
import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import kr.or.kids.domain.cm.common.vo.UserVO;
import kr.or.kids.domain.cm.upload.dto.DisclosureCreateRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosureCreateResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosureDetailResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosureListResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosurePartnerRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosurePartnerResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosureSearchRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosureUpdateRequest;
import kr.or.kids.domain.cm.upload.service.DisclosurePartnerService;
import kr.or.kids.domain.cm.upload.service.DisclosureService;
import kr.or.kids.domain.cm.upload.service.support.DisclosureMemberResolver;
import kr.or.kids.domain.cm.upload.vo.DisclosureMemberVO;
import kr.or.kids.global.common.CustomUserDetails;
import kr.or.kids.global.type.PaginationUtils;
import lombok.RequiredArgsConstructor;

// 업로드 관련 API 요청을 처리한다.
// <pre>
// 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
// </pre>
@RestController
@RequestMapping("/disclosures")
@RequiredArgsConstructor
public class DisclosureController {

  private static final String MSG_LOGIN_REQUIRED = "로그인이 필요합니다.";
  private static final String MSG_NO_PBLNT_SN = "공시번호가 없습니다.";
  private static final String JSON_KEY_PBLNT_SN = "pblntSn";
  private static final String JSON_KEY_PBLNT_PRGRS_STTS_CD = "pblntPrgrsSttsCd";

  private final DisclosureService disclosureService;
  private final DisclosurePartnerService disclosurePartnerService;
  private final DisclosureMemberResolver disclosureMemberResolver;
  private final FileApiService fileApiService;

  private static Long parseLongQueryParam( String value ) {
    if (value == null || value.trim().isEmpty()) {
      return null;
    }
    try {
      return Long.parseLong( value.trim() );
    } catch (NumberFormatException e ) {
      return null;
    }
  }

  private static UserVO toUserVO( CustomUserDetails user ) {
    if (user == null) return null;
    UserVO vo = new UserVO();
    vo.setNi( user.getNi() );
    vo.setUserNo( user.getUserNo() );
    vo.setUserId( user.getMbrId() );
    vo.setUserNm( user.getUserNm() );
    vo.setUserTypeCd( user.getMbrTypeCd() );
    vo.setUserSeCd( user.getUserSeCd() );
    return vo;
  }

  private boolean isDisclosureFileAccessAllowed( DisclosureMemberVO member, CustomUserDetails user, Long pblntSn ) {
    return Boolean.TRUE.equals( member.getIsAdmin() )
        || member.getPartner() != null
        || disclosureMemberResolver.isAllowedToViewDisclosureDetail( user, pblntSn );
  }

  // 공시 등록
  @PostMapping
  public ResponseEntity<ApiResponse<DisclosureCreateResponse>> create(
      @AuthenticationPrincipal CustomUserDetails user,
      @RequestBody DisclosureCreateRequest request) {
    DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve(null, user);
    if (!Boolean.TRUE.equals(memberAndInst.getIsAdmin())) {
      return ApiResponse.error(HttpStatus.FORBIDDEN, "공시는 관리자만 생성할 수 있습니다.", null);
    }

    Long pblntSn = disclosureService.create(memberAndInst, request);
    DisclosureCreateResponse response = new DisclosureCreateResponse(pblntSn);
    return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공시가 성공적으로 생성되었습니다.", response);
  }

  // 공시 수정
  @PutMapping("/{pblntSn}")
  public ResponseEntity<ApiResponse<Void>> update(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long pblntSn,
      @RequestBody DisclosureUpdateRequest request) {
    DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve(pblntSn, user);
    if (!Boolean.TRUE.equals(memberAndInst.getIsAdmin())) {
      return ApiResponse.error(HttpStatus.FORBIDDEN, "공시는 관리자만 수정할 수 있습니다.", null);
    }

    disclosureService.update(memberAndInst, pblntSn, request);
    return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공시가 성공적으로 수정되었습니다.", null);
  }

  // 공시 삭제
  @DeleteMapping("/{pblntSn}")
  public ResponseEntity<ApiResponse<Void>> delete(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long pblntSn) {
    DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve(pblntSn, user);
    if (!Boolean.TRUE.equals(memberAndInst.getIsAdmin())) {
      return ApiResponse.error(HttpStatus.FORBIDDEN, "공시는 관리자만 삭제할 수 있습니다.", null);
    }

    disclosureService.delete(pblntSn);
    return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공시가 성공적으로 삭제되었습니다.", null);
  }

  // 공시 목록 조회
  @GetMapping
  public ResponseEntity<ApiResponse<List<DisclosureListResponse>>> list(DisclosureSearchRequest request,
      @AuthenticationPrincipal CustomUserDetails user) {
    if (user == null) {
      return ApiResponse.error(HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null);
    }
    int page = request.getPage() != null ? request.getPage() : 1;
    int length = PaginationUtils.normalizeSearchLength(request.getLength());
    int total = 0;
    List<DisclosureListResponse> data = Collections.emptyList();

    DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve(null, user);

    if (user.isAdmin()) {
      total = disclosureService.countAdminDisclosure(request, memberAndInst);
      data = disclosureService.searchAdminDisclosureList(request, memberAndInst);
    } else {
      total = disclosureService.countPartnerDisclosure(request, memberAndInst);
      data = disclosureService.searchPartnerDisclosureList(request, memberAndInst);
    }

    return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공시 목록 조회 성공", data, page, length, total);
  }

  // 공시 상세 조회
  @GetMapping("/{pblntSn}")
  public ResponseEntity<ApiResponse<DisclosureDetailResponse>> detail(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long pblntSn) {
    DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve(pblntSn, user);
    boolean allowed = Boolean.TRUE.equals(memberAndInst.getIsAdmin())
        || memberAndInst.getPartner() != null
        || disclosureMemberResolver.isAllowedToViewDisclosureDetail(user, pblntSn);
    if (!allowed) {
      return ApiResponse.error(HttpStatus.FORBIDDEN, "공시 상세 조회 권한이 없습니다.", null);
    }
    return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공시 상세 조회 성공", disclosureService.findById(pblntSn));
  }

  // 공시 상태 조회
  @GetMapping("/{pblntSn}/status")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getDisclosureStatus(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long pblntSn ) {
    if (user == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    if (pblntSn == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_NO_PBLNT_SN, null );
    }
    DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve( pblntSn, user );
    boolean allowed = Boolean.TRUE.equals( memberAndInst.getIsAdmin() )
        || memberAndInst.getPartner() != null
        || disclosureMemberResolver.isAllowedToViewDisclosureDetail( user, pblntSn );
    if ( !allowed ) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 공시에 대한 조회 권한이 없습니다.", null );
    }
    String pblntPrgrsSttsCd = disclosureService.getStatus( pblntSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "공시 상태 조회 성공",
        Map.of( JSON_KEY_PBLNT_SN, pblntSn, JSON_KEY_PBLNT_PRGRS_STTS_CD, pblntPrgrsSttsCd ) );
  }

  // 공시 상태 수정
  @PostMapping("/{pblntSn}/status")
  public ResponseEntity<ApiResponse<Void>> updateDisclosureStatus(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long pblntSn,
      @RequestBody Map<String, Object> request ) {
    if (user == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    UserVO u = toUserVO( user );
    if (u == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
    }

    if (pblntSn == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_NO_PBLNT_SN, null );
    }
    if ( !user.isAdmin() ) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "공시 상태는 관리자만 변경할 수 있습니다.", null );
    }

    Object statusObj = request != null ? request.get( JSON_KEY_PBLNT_PRGRS_STTS_CD ) : null;
    String pblntPrgrsSttsCd = statusObj != null ? String.valueOf( statusObj ).trim() : null;
    disclosureService.updateStatus( u, pblntSn, pblntPrgrsSttsCd );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "공시 상태가 변경되었습니다.", null );
  }

  // 참여기관 목록 조회
  @GetMapping("/{pblntSn}/partners")
  public ResponseEntity<ApiResponse<List<DisclosurePartnerResponse>>> getPartners(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long pblntSn) {
    DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve(pblntSn, user);
    List<DisclosurePartnerResponse> data = disclosurePartnerService.findByPblntSnForDisclosureMember(pblntSn,
        memberAndInst);
    return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "참여기관 목록 조회 성공", data);
  }

  // 참여기관 추가
  @PostMapping("/{pblntSn}/partners")
  public ResponseEntity<ApiResponse<Void>> addPartners(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long pblntSn,
      @RequestBody DisclosurePartnerRequest request ) {

    if (request == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "요청 데이터가 없습니다.", null );
    }

    if (request.getInstIds() == null) {
      request.setInstIds( Collections.emptyList() );
    }

    UserVO u = toUserVO( user );
    if (u == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }
    disclosurePartnerService.addPartners( u, pblntSn, request );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관이 성공적으로 동기화되었습니다.", null );
  }

  @GetMapping("/files/download")
  public ResponseEntity<?> downloadDisclosureFile(
      @RequestParam String atchFileSn,
      @RequestParam Long pblntSn,
      @AuthenticationPrincipal CustomUserDetails user ) {
    try {
      if (atchFileSn == null || atchFileSn.trim().isEmpty()) {
        return ApiResponse.error( HttpStatus.BAD_REQUEST, "첨부파일일련번호가 없습니다.", null );
      }
      DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve( pblntSn, user );
      if (!isDisclosureFileAccessAllowed( memberAndInst, user, pblntSn )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, "파일 다운로드 권한이 없습니다.", null );
      }
      TbCaEFileTrsmVo caFile = disclosureService.resolveDisclosureFileForDownload( memberAndInst, pblntSn, atchFileSn );
      if (caFile == null || caFile.getSrvrFileNm() == null || caFile.getSrvrFileNm().trim().isEmpty()) {
        return ApiResponse.error( HttpStatus.NOT_FOUND, "첨부파일을 찾을 수 없습니다.", null );
      }
      ResponseEntity<byte[]> apiResponse = fileApiService.downloadFile( caFile.getSrvrFileNm() );
      if (apiResponse.getBody() == null || !apiResponse.getStatusCode().is2xxSuccessful()) {
        return ApiResponse.error( HttpStatus.NOT_FOUND, "첨부파일을 찾을 수 없습니다.", null );
      }
      String downloadFileName = (caFile.getFileNm() != null && !caFile.getFileNm().trim().isEmpty())
          ? caFile.getFileNm()
          : caFile.getSrvrFileNm();

      return ResponseEntity.ok()
          .contentType( MediaType.APPLICATION_OCTET_STREAM )
          .header( HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadFileName + "\"" )
          .body( apiResponse.getBody() );
    } catch (IllegalArgumentException e) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage(), null );
    } catch (Exception e ) {
      return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "파일 다운로드에 실패했습니다.", null );
    }
  }

  @GetMapping("/{pblntSn}/files")
  public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDisclosureFiles(
      @PathVariable Long pblntSn,
      @RequestParam(required = false) Long ptcpInstSn,
      @RequestParam(required = false) String fileSeCd,
      @AuthenticationPrincipal CustomUserDetails user ) {
    DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve( pblntSn, user );
    if (!isDisclosureFileAccessAllowed( memberAndInst, user, pblntSn )) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "파일 목록 조회 권한이 없습니다.", null );
    }
    List<Map<String, Object>> files = disclosureService.findFilesByPblntSn( pblntSn, ptcpInstSn, fileSeCd );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "파일 목록 조회 성공", files );
  }

  @PostMapping(value = "/{pblntSn}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<List<String>>> uploadDisclosureFiles(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long pblntSn,
      @RequestPart(value = "files", required = false) List<MultipartFile> files,
      @RequestParam(value = "fileSeCd", required = false, defaultValue = "08") String fileSeCd,
      @RequestParam(value = "ptcpInstSn", required = false) String ptcpInstSn ) {
    try {
      if (user == null) {
        return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
      }
      DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve( pblntSn, user );
      if (!isDisclosureFileAccessAllowed( memberAndInst, user, pblntSn )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, "파일 업로드 권한이 없습니다.", null );
      }
      if (files == null || files.isEmpty()) {
        return ApiResponse.error( HttpStatus.BAD_REQUEST, "업로드할 파일이 없습니다.", null );
      }
      Long ptcpInstSnLong = parseLongQueryParam( ptcpInstSn );
      List<String> uploadedIds = disclosureService.uploadDisclosureFiles(
          memberAndInst,
          pblntSn,
          ptcpInstSnLong,
          fileSeCd,
          files );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "파일 업로드 성공", uploadedIds );
    } catch (IllegalArgumentException e) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage(), null );
    } catch (IllegalStateException e ) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "요청을 처리할 수 없습니다.", null );
    } catch (Exception e ) {
      return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다.", null );
    }
  }

  @DeleteMapping("/{pblntSn}/files/{atchFileId}")
  public ResponseEntity<ApiResponse<Void>> deleteDisclosureFile(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long pblntSn,
      @PathVariable String atchFileId ) {
    try {
      DisclosureMemberVO memberAndInst = disclosureMemberResolver.resolve( pblntSn, user );
      if (!isDisclosureFileAccessAllowed( memberAndInst, user, pblntSn )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, "파일 삭제 권한이 없습니다.", null );
      }
      if (pblntSn == null) {
        return ApiResponse.error( HttpStatus.BAD_REQUEST, "공시일련번호가 없습니다.", null );
      }
      if (atchFileId == null || atchFileId.trim().isEmpty()) {
        return ApiResponse.error( HttpStatus.BAD_REQUEST, "첨부파일ID가 없습니다.", null );
      }
      disclosureService.deleteDisclosureFile( memberAndInst, pblntSn, atchFileId );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "파일이 삭제되었습니다.", null );
    } catch (IllegalArgumentException e) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage(), null );
    } catch (Exception e ) {
      return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "파일 삭제 중 오류가 발생했습니다.", null );
    }
  }

  // // detail 처리를 수행한다.
  // @GetMapping("/{pblntSn}")
  // public ResponseEntity<ApiResponse<DisclosureDetailResponse>> detail( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long pblntSn ) {
  //   if (du == null) {
  //     return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
  //   }
  //   if (!disclosureMemberResolver.isAllowedToViewDisclosureDetail( du, pblntSn )) {
  //     return ApiResponse.error( HttpStatus.FORBIDDEN, "권한이 없습니다." );
  //   }

  //   return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "공시 상세 조회 성공", disclosureService.findById( pblntSn ) );
  // }

  // (상세 조회 PRST 매칭 권한은 DisclosureMemberResolver#isAllowedToViewDisclosureDetail 로 이동)


  // // saveUploadStats 처리를 수행한다.
  // @PostMapping("/{pblntSn}/upload-stats")
  // public ResponseEntity<ApiResponse<Void>> saveUploadStats( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long pblntSn, @RequestBody java.util.Map<String, Object> request ) {
  //   try {
  //     if (du == null) {
  //       return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
  //     }

  //     UserVO user = UploadAuthUtil.toUserVO(user);

  //     if (user == null) {
  //       return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
  //     }

  //     Long ptcpInstSn = parsePtcpInstSnFromStatsBody( request );

  //     uploadStatsService.saveUploadStats( user, pblntSn, ptcpInstSn );

  //     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드 통계가 저장되었습니다.", null );
  //   } catch (IllegalArgumentException e) {
  //     return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage(), null );
  //   } catch (IllegalStateException e) {

  //     return ApiResponse.error( HttpStatus.BAD_REQUEST, "요청을 처리할 수 없습니다.", null );
  //   } catch (Exception e) {

  //     return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "업로드 통계 저장 중 오류가 발생했습니다.", null );
  //   }
  // }

  // // 조회 결과를 반환한다.
  // @GetMapping("/partners/{ptcpInstSn}/upload-stats/history")
  // public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUploadStatsHistoryByPartner( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long ptcpInstSn, @RequestParam(required = false) Long pblntSn ) {
  //   try {
  //     if (du == null) {
  //       return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
  //     }

  //     if (ptcpInstSn == null) {
  //       return ApiResponse.error( HttpStatus.BAD_REQUEST, "참여기관일련번호는 필수입니다.", null );
  //     }
  //     if (!UploadAuthUtil.isAdmin(user)) {
  //       String userInstId = resolvePartnerInstIdForAccess(user);
  //       if (isBlank( userInstId )) {

  //         return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_PARTNER_OK, java.util.Collections.emptyList() );
  //       }
  //       String partnerInstId = disclosurePartnerMapper.findInstIdByPtcpInstSn( ptcpInstSn, pblntSn );
  //       if (partnerInstId == null || !isSameInst( userInstId, partnerInstId )) {

  //         return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_PARTNER_OK, java.util.Collections.emptyList() );
  //       }
  //     }
  //     if (pblntSn == null) {

  //       return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_PARTNER_OK, java.util.Collections.emptyList() );
  //     }
  //     List<Map<String, Object>> list = uploadStatsService.getUploadStatsHistoryByPartner( ptcpInstSn, pblntSn );
  //     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_PARTNER_OK, list );
  //   } catch (Exception e) {

  //     return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "기관별 업로드 통계 이력 조회 중 오류가 발생했습니다.", null );
  //   }
  // }

  // private static boolean isSameInst( String a, String b ) {
  //   if (a == null || b == null) return false;
  //   String na = (TEN_ZEROS + a.trim()).replaceFirst( "^0+(?!$)", "" );
  //   String nb = (TEN_ZEROS + b.trim()).replaceFirst( "^0+(?!$)", "" );
  //   return na.equals( nb ) || (TEN_ZEROS + a.trim()).substring( Math.max( 0, (TEN_ZEROS + a.trim()).length() - 10 ) ).equals( (TEN_ZEROS + b.trim()).substring( Math.max( 0, (TEN_ZEROS + b.trim()).length() - 10 ) ) );
  // }

  // // 조회 결과를 반환한다.
  // @GetMapping("/{pblntSn}/upload-stats/history")
  // public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUploadStatsHistory( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long pblntSn, @RequestParam(required = true) Long ptcpInstSn ) {
  //   try {
  //     if (du == null) {
  //       return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
  //     }

  //     if (pblntSn == null) {
  //       return ApiResponse.error( org.springframework.http.HttpStatus.BAD_REQUEST, "공시일련번호는 필수입니다.", null );
  //     }
  //     if (ptcpInstSn == null) {
  //       return ApiResponse.error( org.springframework.http.HttpStatus.BAD_REQUEST, "참여기관일련번호는 필수입니다. 자신의 기관 이력만 조회됩니다.", null );
  //     }
  //     if (!UploadAuthUtil.isAdmin(user)) {
  //       String userInstId = resolvePartnerInstIdForAccess(user);
  //       if (isBlank( userInstId )) {

  //         return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_OK, java.util.Collections.emptyList() );
  //       }
  //       String partnerInstId = disclosurePartnerMapper.findInstIdByPtcpInstSn( ptcpInstSn, pblntSn );
  //       if (partnerInstId == null || !isSameInst( userInstId, partnerInstId )) {

  //         return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_OK, java.util.Collections.emptyList() );
  //       }
  //     }
  //     List<Map<String, Object>> list = uploadStatsService.getUploadStatsHistory( pblntSn, ptcpInstSn );
  //     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_OK, list );
  //   } catch (Exception e) {

  //     return ApiResponse.error( org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "업로드 통계 이력 조회 중 오류가 발생했습니다.", null );
  //   }
  // }

  // // 조회 결과를 반환한다.
  // @GetMapping("/{pblntSn}/upload-stats")
  // public ResponseEntity<ApiResponse<Map<String, Object>>> getUploadStats( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long pblntSn, @RequestParam(required = false) Long ptcpInstSn ) {
  //   try {
  //     if (du == null) {
  //       return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
  //     }

  //     if (pblntSn == null) {

  //       return ApiResponse.error( HttpStatus.BAD_REQUEST, "공시일련번호는 필수입니다.", null );
  //     }

  //     Map<String, Object> stats = uploadStatsService.getUploadStats( pblntSn, ptcpInstSn );

  //     if (stats == null) {

  //       stats = new java.util.HashMap<>();
  //       stats.put( JSON_KEY_ULD_STATS_HIST, null );
  //       stats.put( JSON_KEY_TBL_ULD_STATS_HIST_LIST, new java.util.ArrayList<>() );
  //     }

  //     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드 통계 조회 성공", stats );
  //   } catch (Exception e) {

  //     return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "업로드 통계 조회 중 오류가 발생했습니다.", null );
  //   }
  // }

  // // 조회 결과를 반환한다.
  // @GetMapping( "/{pblntSn}/consistency-header-detail" )
  // public ResponseEntity<ApiResponse<Map<String, Object>>> getConsistencyHeaderDetail(
  //         @AuthenticationPrincipal CustomUserDetails user,
  //         @PathVariable Long pblntSn,
  //         @RequestParam( required = true ) Long ptcpInstSn,
  //         @RequestParam( required = true ) String errTblNm ) {
  //   try {
  //     if (du == null) {
  //       return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
  //     }
  //     if (pblntSn == null) {
  //       return ApiResponse.error( HttpStatus.BAD_REQUEST, "공시일련번호는 필수입니다.", null );
  //     }
  //     if (!UploadAuthUtil.isAdmin(user)) {
  //       if (ptcpInstSn == null) {
  //         return ApiResponse.error( HttpStatus.BAD_REQUEST, "참여기관일련번호는 필수입니다.", null );
  //       }
  //       String userInstId = resolvePartnerInstIdForAccess(user);
  //       if (isBlank( userInstId )) {
  //         return ApiResponse.error( HttpStatus.FORBIDDEN, "기관 정보를 확인할 수 없습니다.", null );
  //       }
  //       String partnerInstId = disclosurePartnerMapper.findInstIdByPtcpInstSn( ptcpInstSn, pblntSn );
  //       if (partnerInstId == null || !isSameInst( userInstId, partnerInstId )) {
  //         return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 참여기관의 업로드 정보에만 접근할 수 있습니다.", null );
  //       }
  //     }
  //     Map<String, Object> detail = consistencyHeaderDetailService.getHeaderDetail( pblntSn, ptcpInstSn, errTblNm );
  //     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "일관성 헤더 상세 조회 성공", detail );
  //   } catch (Exception e) {
  //     return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "일관성 헤더 상세 조회 중 오류가 발생했습니다.", null );
  //   }
  // }

  // // resetUploadData 처리를 수행한다.
  // @PostMapping("/{pblntSn}/reset-upload")
  // public ResponseEntity<ApiResponse<Void>> resetUploadData( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long pblntSn, @RequestParam Long ptcpInstSn ) {
  //   try {
  //     UserVO user = UploadAuthUtil.toUserVO(user);
  //     if (user == null) {
  //       return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
  //     }

  //     if (du == null) {
  //       return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
  //     }

  //     uploadStatsService.resetUploadData( user, pblntSn, ptcpInstSn );
  //     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드 내역이 초기화되었습니다.", null );
  //   } catch (IllegalArgumentException e) {
  //     return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage(), null );
  //   } catch (IllegalStateException e) {

  //     return ApiResponse.error( HttpStatus.BAD_REQUEST, "요청을 처리할 수 없습니다.", null );
  //   } catch (Exception e) {

  //     return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "업로드 초기화 중 오류가 발생했습니다.", null );
  //   }
  // }

  // // 조회 결과를 반환한다.
  // @GetMapping("/{pblntSn}/catalog")
  // public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCatalog( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long pblntSn, @RequestParam(required = false) Long ptcpInstSn, @RequestParam(required = false) String tblSeCd ) {
  //   try {
  //     if (du == null) {
  //       return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
  //     }

  //     List<Map<String, Object>> catalog = uploadStatsService.getCatalog( pblntSn, ptcpInstSn, tblSeCd );

  //     return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드 카탈로그 조회 성공", catalog );
  //   } catch (Exception e) {

  //     return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "업로드 카탈로그 조회 중 오류가 발생했습니다.", null );
  //   }
  // }

}
