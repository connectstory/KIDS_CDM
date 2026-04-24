package kr.or.kids.domain.cm.upload.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

import kr.or.kids.global.common.CustomUserDetails;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.common.mapper.CommonAuthrtMapper;
import kr.or.kids.domain.cm.common.vo.UserVO;
import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.common.service.CaFileUploadService;
import kr.or.kids.domain.cm.common.service.CommonFileService;
import kr.or.kids.domain.cm.common.service.FileApiService;
import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import kr.or.kids.domain.cm.upload.dto.DisclosureCreateRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosureCreateResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosureDetailResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosureListResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosureSearchRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosureUpdateRequest;
import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import kr.or.kids.domain.cm.upload.mapper.DisclosurePartnerMapper;
import kr.or.kids.domain.cm.upload.service.ConsistencyHeaderDetailService;
import kr.or.kids.domain.cm.upload.service.DisclosurePartnerService;
import kr.or.kids.domain.cm.upload.service.DisclosureService;
import kr.or.kids.domain.cm.upload.util.UploadAuthUtil;
import kr.or.kids.global.type.CmTaskCodeType;
import kr.or.kids.global.type.KidsTaskCodeType;

import lombok.RequiredArgsConstructor;

/**
 * 업로드 관련 API 요청을 처리한다.
 *
 * <pre>
 * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
 * </pre>
 */
@RestController
@RequestMapping("/disclosures")
@RequiredArgsConstructor
public class DisclosureController {

  private final DisclosureService disclosureService;
  private final DisclosurePartnerService disclosurePartnerService;
  private final DisclosurePartnerMapper disclosurePartnerMapper;
  private final kr.or.kids.domain.cm.upload.service.UploadStatsService uploadStatsService;
  private final ConsistencyHeaderDetailService consistencyHeaderDetailService;
  private final CaFileUploadService caFileUploadService;
  private final CommonFileService commonFileService;
  private final FileApiService fileApiService;
  private final CommonAuthrtMapper commonAuthrtMapper;

  
  private static final Set<String> PBLNT_REGISTER_EXTENSIONS = Set.of(
      "xlsx", "xls", "doc", "docx", "hwp", "hwpx", "pdf",
      "r", "rds", "csv", "py", "pkl", "jsm", "parquet", "txt");

  private static boolean isAllowedPblntRegisterAttachment(String originalFilename) {
    if (originalFilename == null || originalFilename.isBlank()) {
      return false;
    }
    String name = originalFilename.replace( "\\", "/" );
    int slash = name.lastIndexOf( '/' );
    if (slash >= 0) {
      name = name.substring( slash + 1 );
    }
    int dot = name.lastIndexOf( '.' );
    if (dot <= 0 || dot >= name.length() - 1) {
      return false;
    }
    return PBLNT_REGISTER_EXTENSIONS.contains( name.substring( dot + 1 ).toLowerCase().trim() );
  }

  private static final String LOG_SEPARATOR = "================================================";
  private static final String MSG_LOGIN_REQUIRED = "로그인이 필요합니다.";
  private static final String JSON_KEY_PTCP_INST_SN = "ptcpInstSn";
  private static final String JSON_KEY_ULD_STATS_HIST = "uldStatsHist";
  private static final String JSON_KEY_TBL_ULD_STATS_HIST_LIST = "tblUldStatsHistList";
  private static final String MSG_STATS_HIST_PARTNER_OK = "기관별 업로드 통계 이력 조회 성공";
  private static final String MSG_STATS_HIST_OK = "업로드 통계 이력 조회 성공";
  private static final String TEN_ZEROS = "0000000000";
  private static final String MSG_PBLNT_REGISTER_EXT =
      "첨부파일은 엑셀(.xlsx, .xls), 워드(.doc, .docx), 아래한글(.hwp, .hwpx), PDF(.pdf), R(.r, .rds), CSV(.csv), 파이썬(.py), PKL(.pkl), JSM(.jsm), Parquet(.parquet), 텍스트(.txt)만 등록할 수 있습니다.";

  private static Long parseLongQueryParam( String ptcpInstSn ) {
    if (ptcpInstSn == null || ptcpInstSn.trim().isEmpty()) {
      return null;
    }
    try {
      return Long.parseLong( ptcpInstSn.trim() );
    } catch (NumberFormatException e) {

      return null;
    }
  }

  private static Long parsePtcpInstSnFromStatsBody( java.util.Map<String, Object> request ) {
    if (request == null || !request.containsKey( JSON_KEY_PTCP_INST_SN )) {
      return null;
    }
    Object o = request.get( JSON_KEY_PTCP_INST_SN );
    if (o instanceof Number) {
      return ((Number) o).longValue();
    }
    if (o instanceof String) {
      try {
        return Long.parseLong( (String) o );
      } catch (NumberFormatException e) {
        return null;
      }
    }
    return null;
  }

  private void requireInProgressForPartnerUploadIfNeeded( CustomUserDetails du, Long ptcpInstSnLong, Long pblntSn ) {
    if (ptcpInstSnLong == null) {
      return;
    }
    boolean isAdminUpload = UploadAuthUtil.isAdmin( du );
    if (!isAdminUpload) {
      disclosureService.requireDisclosureInProgressForPartnerActions( pblntSn );
    }
  }

  private java.util.Optional<ResponseEntity<ApiResponse<List<String>>>> rejectIfPblntRegisterFilesInvalid(
      List<MultipartFile> files,
      String fileSeCd ) {
    String fsc = fileSeCd != null ? fileSeCd.trim() : "";
    if (!"06".equals( fsc )) {
      return java.util.Optional.empty();
    }
    for (MultipartFile f : files) {
      if (f == null || f.isEmpty()) {
        continue;
      }
      if (!isAllowedPblntRegisterAttachment( f.getOriginalFilename() )) {

        return java.util.Optional.of( ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_PBLNT_REGISTER_EXT ) );
      }
    }
    return java.util.Optional.empty();
  }

  
  private void applyPartnerInstFilterForList( DisclosureSearchRequest request, CustomUserDetails details ) {
    if ( "A".equals( details.getUserType() ) ) {
      return;
    }
    String instId = UploadAuthUtil.resolvePartnerInstIdForAccess( details, commonAuthrtMapper );

    if ( instId != null && !instId.isBlank() ) {
      request.setInstIdList( new ArrayList<>( List.of( instId ) ) );
    }
  }

  
  /**
   * list 처리를 수행한다.
   *
   * @param request request
   * @param du du
   * @return 처리 결과
   */
  @GetMapping
  public ResponseEntity<ApiResponse<List<DisclosureListResponse>>> list( DisclosureSearchRequest request, @AuthenticationPrincipal CustomUserDetails du ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }
    
    
    

    if (du != null) {
      applyPartnerInstFilterForList( request, du );
    }

    if (du != null && !UploadAuthUtil.isAdmin( du ) ) {
      String instId = UploadAuthUtil.resolvePartnerInstIdForAccess( du, commonAuthrtMapper );
      if (instId == null || instId.isBlank()) {

        int page = request.getPage() != null ? request.getPage() : 1;
        int length = request.getLength() != null ? request.getLength() : 10;
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "공시 목록 조회 성공", Collections.emptyList(), page, length, 0 );
      }
    }

    List<DisclosureListResponse> data = disclosureService.search( request );
    int total = disclosureService.count( request );
    int page = request.getPage() != null ? request.getPage() : 1;
    int length = request.getLength() != null ? request.getLength() : 10;

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "공시 목록 조회 성공", data, page, length, total );
  }

  

  private TbCaEFileTrsmVo resolveDisclosureFileForDownload( String atchFileSn ) {
    TbCaEFileTrsmVo caFile = commonFileService.selectFile( atchFileSn );
    if ( caFile == null || caFile.getSrvrFileNm() == null || caFile.getSrvrFileNm().trim().isEmpty() ) {
      TbCaEFileTrsmVo groupFile = commonFileService.selectFileByGroupId( atchFileSn );
      if ( groupFile != null ) {
        caFile = groupFile;
      }
    }
    return caFile;
  }

  
  /**
   * downloadDisclosureFile 처리를 수행한다.
   *
   * @param atchFileSn atchFileSn
   * @param du du
   * @return 처리 결과
   */
  @GetMapping("/files/download")
  public ResponseEntity downloadDisclosureFile( @RequestParam String atchFileSn, @AuthenticationPrincipal CustomUserDetails du ) {
    try {
      if (du == null) {
        return ResponseEntity.status( HttpStatus.UNAUTHORIZED ).build();
      }

      if (atchFileSn == null || atchFileSn.trim().isEmpty()) {

        return ResponseEntity.badRequest().build();
      }
      TbCaEFileTrsmVo caFile = resolveDisclosureFileForDownload( atchFileSn );
      if ( caFile == null || caFile.getSrvrFileNm() == null || caFile.getSrvrFileNm().trim().isEmpty() ) {

        return ResponseEntity.notFound().build();
      }
      ResponseEntity<byte[]> apiResponse = fileApiService.downloadFile( caFile.getSrvrFileNm() );
      if (apiResponse.getBody() == null || !apiResponse.getStatusCode().is2xxSuccessful()) {

        return ResponseEntity.notFound().build();
      }
      String downloadFileName = (caFile.getFileNm() != null && !caFile.getFileNm().trim().isEmpty())
          ? caFile.getFileNm()
          : caFile.getSrvrFileNm();

      return ResponseEntity.ok()
          .contentType( MediaType.APPLICATION_OCTET_STREAM )
          .header( HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadFileName + "\"" )
          .body( apiResponse.getBody() );
    } catch (Exception e) {

      return ResponseEntity.internalServerError().build();
    }
  }

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param du du
   * @return 처리 결과
   */
  @GetMapping("/{pblntSn}/files")
  public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDisclosureFiles(
      @PathVariable Long pblntSn,
      @RequestParam(required = false) Long ptcpInstSn,
      @AuthenticationPrincipal CustomUserDetails du ) {

    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }
    if (!UploadAuthUtil.isAdmin( du )) {

    }

    List<Map<String, Object>> files = disclosureService.findFilesByPblntSn( pblntSn, ptcpInstSn );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "파일 목록 조회 성공", files );
  }

  
  /**
   * uploadDisclosureFiles 처리를 수행한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param files files
   * @param fileSeCd fileSeCd
   * @param ptcpInstSn ptcpInstSn
   * @param httpRequest httpRequest
   * @return 처리 결과
   */
  @PostMapping("/{pblntSn}/files")
  public ResponseEntity<ApiResponse<List<String>>> uploadDisclosureFiles(
      @AuthenticationPrincipal CustomUserDetails du,
      @PathVariable Long pblntSn,
      @RequestParam("files") List<MultipartFile> files,
      @RequestParam(value = "fileSeCd", required = false, defaultValue = "08") String fileSeCd,
      @RequestParam(value = "ptcpInstSn", required = false) String ptcpInstSn,
      HttpServletRequest httpRequest ) {
    try {
      if (du == null) {
        return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
      }

      UserVO user = UploadAuthUtil.toUserVO( du );
      String userId = user != null && user.getNi() != null ? user.getNi() : (du != null ? du.getMbrId() : "SYSTEM");

      if (files == null || files.isEmpty()) {

        return ApiResponse.error( HttpStatus.BAD_REQUEST, "업로드할 파일이 없습니다." );
      }

      java.util.Optional<ResponseEntity<ApiResponse<List<String>>>> badType = rejectIfPblntRegisterFilesInvalid( files, fileSeCd );
      if (badType.isPresent()) {
        return badType.get();
      }

      Long ptcpInstSnLong = parseLongQueryParam( ptcpInstSn );
      requireInProgressForPartnerUploadIfNeeded( du, ptcpInstSnLong, pblntSn );

      String groupId = caFileUploadService.uploadWithCaAndUld(
          pblntSn,
          ptcpInstSnLong,
          files,
          userId,
          KidsTaskCodeType.CDM.code(),
          CmTaskCodeType.CDM_NOTI.code(),
          fileSeCd );

      List<TbCaEFileTrsmVo> list = commonFileService.selectFileListByGroup( groupId );
      List<String> uploadedIds = list == null || list.isEmpty()
          ? List.of( groupId )
          : list.stream().map( TbCaEFileTrsmVo::getAtchFileId ).collect( Collectors.toList() );

      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "파일 업로드 성공", uploadedIds );
    } catch (IllegalStateException e) {

      return ApiResponse.error( HttpStatus.BAD_REQUEST, "요청을 처리할 수 없습니다." );
    } catch (Exception e) {

      return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다." );
    }
  }

  
  /**
   * 데이터를 삭제한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param atchFileId atchFileId
   * @return 처리 결과
   */
  @DeleteMapping("/{pblntSn}/files/{atchFileId}")
  public ResponseEntity<ApiResponse<Void>> deleteDisclosureFile( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @PathVariable String atchFileId ) {
    try {
      if (du == null) {
        return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
      }

      if (pblntSn == null) {
        return ApiResponse.error( HttpStatus.BAD_REQUEST, "공시일련번호가 없습니다." );
      }
      if (atchFileId == null || atchFileId.trim().isEmpty()) {
        return ApiResponse.error( HttpStatus.BAD_REQUEST, "첨부파일ID가 없습니다." );
      }
      disclosureService.deleteFile( pblntSn, atchFileId );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "파일이 삭제되었습니다.", null );
    } catch (IllegalArgumentException e) {

      return ApiResponse.error( HttpStatus.BAD_REQUEST, "파일 삭제 중 오류가 발생했습니다." );
    } catch (Exception e) {

      return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "파일 삭제 중 오류가 발생했습니다." );
    }
  }

  
  /**
   * detail 처리를 수행한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  @GetMapping("/{pblntSn}")
  public ResponseEntity<ApiResponse<DisclosureDetailResponse>> detail( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn ) {
    if (du == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
    }

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "공시 상세 조회 성공", disclosureService.findById( pblntSn ) );
  }

  
  private boolean canViewDisclosureDetail( CustomUserDetails du, Long pblntSn ) {
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
   * 데이터를 등록한다.
   *
   * @param du du
   * @param request request
   * @return 처리 결과
   */
  @PostMapping
  public ResponseEntity<ApiResponse<DisclosureCreateResponse>> create( @AuthenticationPrincipal CustomUserDetails du, @RequestBody DisclosureCreateRequest request ) {
    UserVO user = UploadAuthUtil.toUserVO( du );

    if (user == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
    }

    String usercd = user.getUserTypeCd(); 
    
    
    if (!"A".equals( usercd )) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "공시는 관리자만 생성할 수 있습니다.", null );
    }

    Long pblntSn = disclosureService.create( user, request );
    DisclosureCreateResponse response = new DisclosureCreateResponse( pblntSn );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "공시가 성공적으로 생성되었습니다.", response );
  }

  
  /**
   * 데이터를 수정한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param request request
   * @return 처리 결과
   */
  @PutMapping("/{pblntSn}")
  public ResponseEntity<ApiResponse<Void>> update( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @RequestBody DisclosureUpdateRequest request ) {
    UserVO user = UploadAuthUtil.toUserVO( du );
    if (user == null) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
    }

    
    if (!UploadAuthUtil.isAdmin( du )) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "공시는 관리자만 수정할 수 있습니다.", null );
    }

    disclosureService.update( user, pblntSn, request );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "공시가 성공적으로 수정되었습니다.", null );
  }

  
  /**
   * 데이터를 삭제한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  @DeleteMapping("/{pblntSn}")
  public ResponseEntity<ApiResponse<Void>> delete( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn ) {
    if (du == null || !UploadAuthUtil.isAdmin( du )) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "공시는 관리자만 삭제할 수 있습니다.", null );
    }

    disclosureService.delete( pblntSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "공시가 성공적으로 삭제되었습니다.", null );
  }

  
  /**
   * saveUploadStats 처리를 수행한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param request request
   * @return 처리 결과
   */
  @PostMapping("/{pblntSn}/upload-stats")
  public ResponseEntity<ApiResponse<Void>> saveUploadStats( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @RequestBody java.util.Map<String, Object> request ) {
    try {
      if (du == null) {
        return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
      }

      UserVO user = UploadAuthUtil.toUserVO( du );

      if (user == null) {
        return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
      }

      Long ptcpInstSn = parsePtcpInstSnFromStatsBody( request );

      

      uploadStatsService.saveUploadStats( user, pblntSn, ptcpInstSn );

      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드 통계가 저장되었습니다.", null );
    } catch (IllegalStateException e) {

      return ApiResponse.error( HttpStatus.BAD_REQUEST, "요청을 처리할 수 없습니다.", null );
    } catch (Exception e) {

      return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "업로드 통계 저장 중 오류가 발생했습니다.", null );
    }
  }

  
  
  /**
   * 조회 결과를 반환한다.
   *
   * @param du du
   * @param ptcpInstSn ptcpInstSn
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  @GetMapping("/partners/{ptcpInstSn}/upload-stats/history")
  public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUploadStatsHistoryByPartner( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long ptcpInstSn, @RequestParam(required = false) Long pblntSn ) {
    try {
      if (du == null) {
        return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
      }

      if (ptcpInstSn == null) {
        return ApiResponse.error( HttpStatus.BAD_REQUEST, "참여기관일련번호는 필수입니다.", null );
      }
      if (du != null && !UploadAuthUtil.isAdmin( du )) {
        String userInstId = UploadAuthUtil.resolvePartnerInstIdForAccess( du, commonAuthrtMapper );
        if (userInstId == null || userInstId.isBlank()) {

          return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_PARTNER_OK, java.util.Collections.emptyList() );
        }
        String partnerInstId = disclosurePartnerMapper.findInstIdByPtcpInstSn( ptcpInstSn, pblntSn );
        if (partnerInstId == null || !isSameInst( userInstId, partnerInstId )) {

          return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_PARTNER_OK, java.util.Collections.emptyList() );
        }
      }
      if (pblntSn == null) {

        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_PARTNER_OK, java.util.Collections.emptyList() );
      }
      List<Map<String, Object>> list = uploadStatsService.getUploadStatsHistoryByPartner( ptcpInstSn, pblntSn );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_PARTNER_OK, list );
    } catch (Exception e) {

      return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "기관별 업로드 통계 이력 조회 중 오류가 발생했습니다.", null );
    }
  }

  private static boolean isSameInst( String a, String b ) {
    if (a == null || b == null) return false;
    String na = (TEN_ZEROS + a.trim()).replaceFirst( "^0+(?!$)", "" );
    String nb = (TEN_ZEROS + b.trim()).replaceFirst( "^0+(?!$)", "" );
    return na.equals( nb ) || (TEN_ZEROS + a.trim()).substring( Math.max( 0, (TEN_ZEROS + a.trim()).length() - 10 ) ).equals( (TEN_ZEROS + b.trim()).substring( Math.max( 0, (TEN_ZEROS + b.trim()).length() - 10 ) ) );
  }

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @GetMapping("/{pblntSn}/upload-stats/history")
  public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUploadStatsHistory( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @RequestParam(required = true) Long ptcpInstSn ) {
    try {
      if (du == null) {
        return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
      }

      if (pblntSn == null) {
        return ApiResponse.error( org.springframework.http.HttpStatus.BAD_REQUEST, "공시일련번호는 필수입니다.", null );
      }
      if (ptcpInstSn == null) {
        return ApiResponse.error( org.springframework.http.HttpStatus.BAD_REQUEST, "참여기관일련번호는 필수입니다. 자신의 기관 이력만 조회됩니다.", null );
      }
      if (du != null && !UploadAuthUtil.isAdmin( du )) {
        String userInstId = UploadAuthUtil.resolvePartnerInstIdForAccess( du, commonAuthrtMapper );
        if (userInstId == null || userInstId.isBlank()) {

          return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_OK, java.util.Collections.emptyList() );
        }
        String partnerInstId = disclosurePartnerMapper.findInstIdByPtcpInstSn( ptcpInstSn, pblntSn );
        if (partnerInstId == null || !isSameInst( userInstId, partnerInstId )) {

          return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_OK, java.util.Collections.emptyList() );
        }
      }
      List<Map<String, Object>> list = uploadStatsService.getUploadStatsHistory( pblntSn, ptcpInstSn );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, MSG_STATS_HIST_OK, list );
    } catch (Exception e) {

      return ApiResponse.error( org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "업로드 통계 이력 조회 중 오류가 발생했습니다.", null );
    }
  }

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @GetMapping("/{pblntSn}/upload-stats")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getUploadStats( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @RequestParam(required = false) Long ptcpInstSn ) {
    try {
      if (du == null) {
        return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
      }

      if (pblntSn == null) {

        return ApiResponse.error( HttpStatus.BAD_REQUEST, "공시일련번호는 필수입니다.", null );
      }

      Map<String, Object> stats = uploadStatsService.getUploadStats( pblntSn, ptcpInstSn );

      if (stats == null) {

        stats = new java.util.HashMap<>();
        stats.put( JSON_KEY_ULD_STATS_HIST, null );
        stats.put( JSON_KEY_TBL_ULD_STATS_HIST_LIST, new java.util.ArrayList<>() );
      }

      Object tblUldStatsHistListObj = stats.get( JSON_KEY_TBL_ULD_STATS_HIST_LIST );
      int tblUldStatsHistListSize = tblUldStatsHistListObj instanceof List<?> l ? l.size() : 0;

      
      Object uldStatsHistObj = stats.get( JSON_KEY_ULD_STATS_HIST );
      if (uldStatsHistObj instanceof Map<?, ?> uldStatsHist) {
      }

      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드 통계 조회 성공", stats );
    } catch (Exception e) {

      return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "업로드 통계 조회 중 오류가 발생했습니다.", null );
    }
  }

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param errTblNm errTblNm
   * @return 처리 결과
   */
  @GetMapping( "/{pblntSn}/consistency-header-detail" )
  public ResponseEntity<ApiResponse<Map<String, Object>>> getConsistencyHeaderDetail(
          @AuthenticationPrincipal CustomUserDetails du,
          @PathVariable Long pblntSn,
          @RequestParam( required = true ) Long ptcpInstSn,
          @RequestParam( required = true ) String errTblNm ) {
    try {
      if (du == null) {
        return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
      }
      if (pblntSn == null) {
        return ApiResponse.error( HttpStatus.BAD_REQUEST, "공시일련번호는 필수입니다.", null );
      }
      if (!UploadAuthUtil.isAdmin( du )) {
        if (ptcpInstSn == null) {
          return ApiResponse.error( HttpStatus.BAD_REQUEST, "참여기관일련번호는 필수입니다.", null );
        }
        String userInstId = UploadAuthUtil.resolvePartnerInstIdForAccess( du, commonAuthrtMapper );
        if (userInstId == null || userInstId.isBlank()) {
          return ApiResponse.error( HttpStatus.FORBIDDEN, "기관 정보를 확인할 수 없습니다.", null );
        }
        String partnerInstId = disclosurePartnerMapper.findInstIdByPtcpInstSn( ptcpInstSn, pblntSn );
        if (partnerInstId == null || !isSameInst( userInstId, partnerInstId )) {
          return ApiResponse.error( HttpStatus.FORBIDDEN, "해당 참여기관의 업로드 정보에만 접근할 수 있습니다.", null );
        }
      }
      Map<String, Object> detail = consistencyHeaderDetailService.getHeaderDetail( pblntSn, ptcpInstSn, errTblNm );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "일관성 헤더 상세 조회 성공", detail );
    } catch (Exception e) {
      return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "일관성 헤더 상세 조회 중 오류가 발생했습니다.", null );
    }
  }

  
  /**
   * resetUploadData 처리를 수행한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @PostMapping("/{pblntSn}/reset-upload")
  public ResponseEntity<ApiResponse<Void>> resetUploadData( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @RequestParam Long ptcpInstSn ) {
    try {
      UserVO user = UploadAuthUtil.toUserVO( du );
      if (user == null) {
        return ApiResponse.error( HttpStatus.BAD_REQUEST, MSG_LOGIN_REQUIRED, null );
      }

      if (du == null) {
        return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
      }

      uploadStatsService.resetUploadData( user, pblntSn, ptcpInstSn );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드 내역이 초기화되었습니다.", null );
    } catch (IllegalStateException e) {

      return ApiResponse.error( HttpStatus.BAD_REQUEST, "요청을 처리할 수 없습니다.", null );
    } catch (Exception e) {

      return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "업로드 초기화 중 오류가 발생했습니다.", null );
    }
  }

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param du du
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param tblSeCd tblSeCd
   * @return 처리 결과
   */
  @GetMapping("/{pblntSn}/catalog")
  public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCatalog( @AuthenticationPrincipal CustomUserDetails du, @PathVariable Long pblntSn, @RequestParam(required = false) Long ptcpInstSn, @RequestParam(required = false) String tblSeCd ) {
    try {
      if (du == null) {
        return ApiResponse.error( HttpStatus.UNAUTHORIZED, MSG_LOGIN_REQUIRED, null );
      }

      List<Map<String, Object>> catalog = uploadStatsService.getCatalog( pblntSn, ptcpInstSn, tblSeCd );

      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "업로드 카탈로그 조회 성공", catalog );
    } catch (Exception e) {

      return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "업로드 카탈로그 조회 중 오류가 발생했습니다.", null );
    }
  }

}
