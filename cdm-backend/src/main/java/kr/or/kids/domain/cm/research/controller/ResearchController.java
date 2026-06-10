package kr.or.kids.domain.cm.research.controller;

import java.util.List;

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
import kr.or.kids.domain.cm.common.dto.CaFileItem;
import kr.or.kids.domain.cm.research.dto.AnalysisDataRequest;
import kr.or.kids.domain.cm.research.dto.AnalysisDataResponse;
import kr.or.kids.domain.cm.research.dto.AnalysisDataUpdateResponse;
import kr.or.kids.domain.cm.research.dto.AnalysisDatasetTaskResponse;
import kr.or.kids.domain.cm.research.dto.CancelResearchRequest;
import kr.or.kids.domain.cm.research.dto.CloseResearchRequest;
import kr.or.kids.domain.cm.research.dto.PartnerActionRequest;
import kr.or.kids.domain.cm.research.dto.PartnerCreateRequest;
import kr.or.kids.domain.cm.research.dto.ResearchCreateRequest;
import kr.or.kids.domain.cm.research.dto.ResearchCreateResponse;
import kr.or.kids.domain.cm.research.dto.ResearchDetailResponse;
import kr.or.kids.domain.cm.research.dto.ResearchListResponse;
import kr.or.kids.domain.cm.research.dto.ResearchPartnerResponse;
import kr.or.kids.domain.cm.research.dto.ResearchSearchRequest;
import kr.or.kids.domain.cm.research.dto.ResearchUpdateRequest;
import kr.or.kids.domain.cm.research.service.ResearchAnalysisService;
import kr.or.kids.domain.cm.research.service.ResearchService;
import kr.or.kids.domain.cm.research.service.support.ResearchMemberResolver;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;
import kr.or.kids.global.common.CustomUserDetails;
import kr.or.kids.global.type.PaginationUtils;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/researches")
@RequiredArgsConstructor
public class ResearchController {

  private final ResearchService researchService;
  private final ResearchAnalysisService researchAnalysisService;
  private final ResearchMemberResolver researchMemberResolver;

  // 연구과제 목록 조회 (관리자)
  @GetMapping("/admin")
  public ResponseEntity<ApiResponse<List<ResearchListResponse>>> searchResearchListByAdmin( @AuthenticationPrincipal CustomUserDetails user, ResearchSearchRequest request ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( null, user );

    int length = PaginationUtils.normalizeSearchLength( request.getLength() );
    request.setLength( length );

    List<ResearchListResponse> data = researchService.searchResearchListByAdmin( memberAndInst, request );
    int total = researchService.countByAdmin( memberAndInst, request );
    int page = request.getPage() != null ? request.getPage() : 1;
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "연구과제 목록 조회 성공", data, page, length, total );
  }

  // 연구과제 목록 조회 (파트너)
  @GetMapping("/partner")
  public ResponseEntity<ApiResponse<List<ResearchListResponse>>> searchResearchListByPartner( @AuthenticationPrincipal CustomUserDetails user, ResearchSearchRequest request ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( null, user );

    int length = PaginationUtils.normalizeSearchLength( request.getLength() );
    request.setLength( length );

    List<ResearchListResponse> data = researchService.searchResearchListByPartner( memberAndInst, request );
    int total = researchService.countByPartner( memberAndInst, request );
    int page = request.getPage() != null ? request.getPage() : 1;
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "연구과제 목록 조회 성공", data, page, length, total );
  }

  // 연구과제 상세 조회
  @GetMapping("/{asmtSn}")
  public ResponseEntity<ApiResponse<ResearchDetailResponse>> detail( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "연구과제 상세 조회 성공", researchService.findResearchDetailById( memberAndInst, asmtSn ) );
    } catch (IllegalArgumentException e) {
      if ("권한이 없습니다.".equals( e.getMessage() )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, e.getMessage() );
      }
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // 연구과제 등록 (multipart: data 필수, files·analysisFiles 선택, 각각 별도 전송)
  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<ResearchCreateResponse>> create( @AuthenticationPrincipal CustomUserDetails user, @RequestPart("data") ResearchCreateRequest request, @RequestPart(value = "files", required = false) List<MultipartFile> files, @RequestPart(value = "analysisFiles", required = false) List<MultipartFile> analysisFiles ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( null, user );

    Long asmtSn = researchService.createResearch( memberAndInst, request, files, analysisFiles );
    ResearchCreateResponse response = new ResearchCreateResponse( asmtSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "연구과제가 성공적으로 생성되었습니다.", response );
  }

  // 연구과제 수정 (multipart: data 필수, files·analysisFiles·deleteFileIds 선택, 각각 별도 전송)
  @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public void update( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long id, @RequestPart("data") ResearchUpdateRequest request, @RequestParam(required = false) List<String> deleteFileIds, @RequestPart(value = "files", required = false) List<MultipartFile> files, @RequestPart(value = "analysisFiles", required = false) List<MultipartFile> analysisFiles ) {
    String mdfrId = user != null ? user.getMbrId() : null;
    researchService.updateResearch( id, request, deleteFileIds, files, analysisFiles, mdfrId );
  }

  // 연구과제 삭제
  @DeleteMapping("/{id}")
  public void delete( @PathVariable Long id ) {
    researchService.deleteResearch( id );
  }

  // 연구과제 참여기관 목록 조회
  @GetMapping("/{asmtSn}/partners")
  public ResponseEntity<ApiResponse<List<ResearchPartnerResponse>>> searchPartners( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    List<ResearchPartnerResponse> data = researchService.searchPartners( memberAndInst, asmtSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "연구과제 참여기관 목록 조회 성공", data );
  }

  // 참여기관 정보 저장
  @PostMapping("/{asmtSn}/partners")
  public ResponseEntity<ApiResponse<Void>> createPartners( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestBody PartnerCreateRequest request ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      researchService.createPartners( memberAndInst, asmtSn, request );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 정보 저장 성공", null );
    } catch (IllegalArgumentException e) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // 참여기관 참여승인/참여취소
  @PutMapping("/{asmtSn}/partners/{asmtPtcpInstSn}/invite")
  public ResponseEntity<ApiResponse<Void>> updatePartnerStatus( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable String asmtPtcpInstSn, @RequestBody PartnerActionRequest request ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      String action = request.getAction();
      if ("approve".equals( action )) {
        researchService.approveInvitePartner( memberAndInst, asmtSn, asmtPtcpInstSn, null );
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 참여승인 성공", null );
      } else if ("delete".equals( action )) {
        if (request.getAsmtPtcpRtrcnRsn() == null || request.getAsmtPtcpRtrcnRsn().trim().isEmpty()) {
          return ApiResponse.error( HttpStatus.BAD_REQUEST, "참여취소 사유는 필수입니다." );
        }
        researchService.cancelInvitePartner( memberAndInst, asmtSn, asmtPtcpInstSn, request.getAsmtPtcpRtrcnRsn() );
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 참여취소 성공", null );
      } else {
        return ApiResponse.error( HttpStatus.BAD_REQUEST, "잘못된 action입니다. 'approve' 또는 'delete'를 입력하세요." );
      }
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 참여기관 조회
  @GetMapping("/{asmtSn}/partners/{asmtPtcpInstSn}")
  public ResponseEntity<ApiResponse<ResearchPartnerResponse>> getPartner( @PathVariable Long asmtSn, @PathVariable String asmtPtcpInstSn ) {
    ResearchPartnerResponse data = researchService.findPartnerById( asmtSn, asmtPtcpInstSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 조회 성공", data );
  }

  // 연구과제 상태 변경
  @PutMapping("/{asmtSn}/status")
  public ResponseEntity<ApiResponse<Void>> updateResearchStatus( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestBody java.util.Map<String, String> request ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    String asmtPrgrsSttsCd = request.get( "asmtPrgrsSttsCd" );
    if (asmtPrgrsSttsCd == null || asmtPrgrsSttsCd.trim().isEmpty()) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "과제진행상태코드는 필수입니다." );
    }

    try {
      researchService.updateResearchStatus( memberAndInst, asmtSn, asmtPrgrsSttsCd );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "연구과제 상태 변경 성공", null );
    } catch (IllegalArgumentException e) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // 분석 데이터셋 조건 기반 복사 (비동기). asmtSn으로 과제·참여기관(CDM)·최신 메타·엑셀·스키마 조회 후 복사. 복사 완료 시 해당 과제가 진행 상태로 변경됨
  @PostMapping("/analysis-dataset")
  public ResponseEntity<ApiResponse<AnalysisDatasetTaskResponse>> submitAnalysisDatasetCopy( @AuthenticationPrincipal CustomUserDetails user, @RequestParam("asmtSn") Long asmtSn ) {
    researchMemberResolver.resolve( null, user );

    try {
      String mbrId = user.getMbrId();
      // CustomUserDetails를 넘기는게 좋을듯. 현재는 mbrId만 넘기고 있음.
      AnalysisDatasetTaskResponse data = researchService.submitAnalysisDatasetCopy( asmtSn, mbrId );
      return ResponseEntity.status( HttpStatus.ACCEPTED ).body( ApiResponse.<AnalysisDatasetTaskResponse> builder().status( ApiResponse.STATUS_SUCCESS ).message( "분석 데이터셋 복사가 시작되었습니다." ).data( data ).build() );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 분석 데이터셋 복사 작업 상태 조회
  @GetMapping("/analysis-dataset/tasks/{taskId}")
  public ResponseEntity<ApiResponse<AnalysisDatasetTaskResponse>> getAnalysisDatasetTaskStatus( @AuthenticationPrincipal CustomUserDetails user, @PathVariable String taskId ) {
    researchMemberResolver.resolve( null, user );
    AnalysisDatasetTaskResponse data = researchService.getAnalysisDatasetTaskStatus( taskId );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "조회 완료", data );
  }

  // 분석 데이터 생성 (multipart: data 필수, files 선택)
  @PostMapping(value = "/{asmtSn}/analysis-data", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<AnalysisDataResponse>> createAnalysisData( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestPart("data") AnalysisDataRequest request, @RequestPart(value = "files", required = false) List<MultipartFile> files, @RequestPart(value = "datasetFiles", required = false) List<MultipartFile> datasetFiles, @RequestPart(value = "vdiFiles", required = false) List<MultipartFile> vdiFiles ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      AnalysisDataResponse data = researchAnalysisService.createAnalysisData( memberAndInst, asmtSn, request, files != null ? files : List.of(), datasetFiles != null ? datasetFiles : List.of(), vdiFiles != null ? vdiFiles : List.of() );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "분석 데이터 생성 성공", data );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 분석 데이터 수정 (multipart: data 필수, files 선택)
  @PutMapping(value = "/{asmtSn}/analysis-data/{asmtMetaRsltSn}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<AnalysisDataUpdateResponse>> updateAnalysisData(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long asmtSn,
      @PathVariable Long asmtMetaRsltSn,
      @RequestPart("data") AnalysisDataRequest request,
      @RequestParam(required = false) List<String> deleteFileIds,
      @RequestParam(required = false) List<String> deleteDatasetFileIds,
      @RequestParam(required = false) List<String> deleteVdiFileIds,
      @RequestPart(value = "files", required = false) List<MultipartFile> files,
      @RequestPart(value = "datasetFiles", required = false) List<MultipartFile> datasetFiles,
      @RequestPart(value = "vdiFiles", required = false) List<MultipartFile> vdiFiles ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      AnalysisDataUpdateResponse data = researchAnalysisService.updateAnalysisData( memberAndInst, asmtSn, asmtMetaRsltSn, request, deleteFileIds != null ? deleteFileIds : List.of(), deleteDatasetFileIds != null ? deleteDatasetFileIds : List.of(), deleteVdiFileIds != null ? deleteVdiFileIds : List.of(), files != null ? files : List.of(), datasetFiles != null ? datasetFiles : List.of(), vdiFiles != null ? vdiFiles : List.of() );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "분석 데이터 수정 성공", data );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // IRB/DRB 파일 업로드 (file_se_cd=05)
  @PostMapping(value = "/{asmtSn}/irb-files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<Void>> uploadIrbFiles( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestPart(value = "files", required = false) List<MultipartFile> files ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );
    researchService.uploadIrbFiles( memberAndInst, asmtSn, files != null ? files : List.of() );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "IRB/DRB 파일 업로드 성공", null );
  }

  // IRB 파일 삭제 (본인 업로드분만, DRB는 삭제 불가)
  @DeleteMapping("/{asmtSn}/irb-files/{atchFileId}")
  public ResponseEntity<ApiResponse<Void>> deleteIrbFile( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable String atchFileId ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      researchService.deleteIrbFile( memberAndInst, asmtSn, atchFileId );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "IRB 파일 삭제 성공", null );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 참여기관 공유파일 업로드 (file_se_cd=17, pst_sn+ptcp_inst_sn 기준)
  @PostMapping(value = "/{asmtSn}/partner-files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<Void>> uploadPartnerFiles( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestParam("asmtPtcpInstSn") Long asmtPtcpInstSn, @RequestPart(value = "files", required = false) List<MultipartFile> files ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    researchService.uploadPartnerFiles( memberAndInst, asmtSn, asmtPtcpInstSn, files != null ? files : List.of() );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 공유파일 업로드 성공", null );
  }

  // 참여기관 공유파일 삭제 (file_se_cd=17, pst_sn+ptcp_inst_sn+atchFileId 기준)
  @DeleteMapping("/{asmtSn}/partner-files/{atchFileId}")
  public ResponseEntity<ApiResponse<Void>> deletePartnerFile( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable String atchFileId, @RequestParam("asmtPtcpInstSn") Long asmtPtcpInstSn ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      researchService.deletePartnerFile( memberAndInst, asmtSn, asmtPtcpInstSn, atchFileId );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "참여기관 공유파일 삭제 성공", null );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 연구과제 등록자/관리자 첨부파일 업로드 (file_se_cd=19)
  @PostMapping(value = "/{asmtSn}/admin-files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<Void>> uploadAdminFiles( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestPart(value = "files", required = false) List<MultipartFile> files ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    boolean isAdminCreator = Boolean.TRUE.equals( memberAndInst.getIsAdmin() );
    if (!isAdminCreator) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "권한이 없습니다." );
    }

    try {
      researchService.uploadAdminFiles( memberAndInst, asmtSn, files != null ? files : List.of() );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "첨부파일 업로드 성공", null );
    } catch (IllegalArgumentException e) {
      if ("권한이 없습니다.".equals( e.getMessage() )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, e.getMessage() );
      }
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // 연구과제 등록자/관리자 첨부파일 삭제 (file_se_cd=19)
  @DeleteMapping("/{asmtSn}/admin-files/{atchFileId}")
  public ResponseEntity<ApiResponse<Void>> deleteAdminFile( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable String atchFileId ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    boolean isAdminCreator = Boolean.TRUE.equals( memberAndInst.getIsAdmin() );
    if (!isAdminCreator) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "권한이 없습니다." );
    }

    try {
      researchService.deleteAdminFile( memberAndInst, asmtSn, atchFileId );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "첨부파일 삭제 성공", null );
    } catch (IllegalArgumentException e) {
      if ("권한이 없습니다.".equals( e.getMessage() )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, e.getMessage() );
      }
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // 연구과제 파일 목록 조회 (uldTaskSeCd=01, fileSeCd 필터)
  @GetMapping("/{asmtSn}/files")
  public ResponseEntity<ApiResponse<List<CaFileItem>>> getResearchFiles( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestParam(value = "uldTaskSeCd", required = false, defaultValue = "01") String uldTaskSeCd, @RequestParam(value = "fileSeCd", required = true) String fileSeCd, @RequestParam(value = "ptcpInstSn", required = false) Long ptcpInstSn ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    List<CaFileItem> data = researchService.findFilesByTaskAndFileSeCd( memberAndInst, asmtSn, uldTaskSeCd, fileSeCd, ptcpInstSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "파일 목록 조회 성공", data );
  }

  // 연구과제 마감
  @PutMapping("/{asmtSn}/close")
  public ResponseEntity<ApiResponse<Void>> closeResearch( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestBody CloseResearchRequest request ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    if (request.getAsmtClsCn() == null || request.getAsmtClsCn().trim().isEmpty()) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "마감내용은 필수입니다." );
    }

    try {
      researchService.closeResearch( memberAndInst, asmtSn, request.getAsmtClsCn() );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "연구과제 마감 성공", null );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 연구과제 취소 (asmt_cls_cn: 취소 사유, asmt_cls_dt: 서버 저장)
  @PutMapping("/{asmtSn}/cancel")
  public ResponseEntity<ApiResponse<Void>> cancelResearch( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestBody CancelResearchRequest request ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    if (request.getAsmtClsCn() == null || request.getAsmtClsCn().trim().isEmpty()) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, "취소 사유는 필수입니다." );
    }

    try {
      researchService.cancelResearch( memberAndInst, asmtSn, request.getAsmtClsCn() );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "연구과제 취소 성공", null );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

}
