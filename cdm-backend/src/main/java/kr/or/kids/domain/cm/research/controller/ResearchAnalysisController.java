package kr.or.kids.domain.cm.research.controller;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.research.service.support.ResearchMemberResolver;
import kr.or.kids.domain.cm.research.dto.AnalysisDataDetailResponse;
import kr.or.kids.domain.cm.research.dto.AnalysisDataRequest;
import kr.or.kids.domain.cm.research.dto.AnalysisDataResponse;
import kr.or.kids.domain.cm.research.dto.AnalysisDataUpdateResponse;
import kr.or.kids.domain.cm.research.dto.InstitutionWithOpinionsResponse;
import kr.or.kids.domain.cm.research.dto.MetaAccessCheckResponse;
import kr.or.kids.domain.cm.research.dto.OpinionListResponse;
import kr.or.kids.domain.cm.research.dto.OpinionRequest;
import kr.or.kids.domain.cm.research.dto.OrgAnalysisDataResponse;
import kr.or.kids.domain.cm.research.service.ResearchAnalysisService;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/researches")
@RequiredArgsConstructor
public class ResearchAnalysisController {

  private final ResearchAnalysisService analysisService;
  private final ResearchMemberResolver researchMemberResolver;

  // 분석 데이터 목록 조회
  @GetMapping("/{asmtSn}/analysis-data")
  public ResponseEntity<ApiResponse<List<AnalysisDataResponse>>> getAnalysisData( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestParam(required = true) String rsltGroupStcd, @RequestParam(required = false) String instId ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    List<AnalysisDataResponse> data = analysisService.searchAnalysisData( memberAndInst, asmtSn, rsltGroupStcd, instId );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "분석 데이터 목록 조회 성공", data );
  }

  // Non-CDM 기관 분석 데이터 목록 조회
  @GetMapping("/{asmtSn}/analysis-data/org-analysis-data")
  public ResponseEntity<ApiResponse<List<OrgAnalysisDataResponse>>> getOrgAnalysisData( @PathVariable Long asmtSn, @RequestParam(required = true) String rsltGroupStcd ) {
    List<OrgAnalysisDataResponse> data = analysisService.searchNonCdmPartnersWithLatestAnalysis( asmtSn, rsltGroupStcd );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "Non-CDM 기관 분석 데이터 목록 조회 성공", data );
  }

  // 최신 분석 데이터 상세 조회
  @GetMapping("/{asmtSn}/analysis-data/latest")
  public ResponseEntity<ApiResponse<AnalysisDataDetailResponse>> getLatestAnalysisDataDetail( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestParam(required = true) String rsltGroupStcd ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      AnalysisDataDetailResponse data = analysisService.findLatestAnalysisDataByAsmtSn( memberAndInst, asmtSn, rsltGroupStcd );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "최신 분석 데이터 상세 조회 성공", data );
    } catch (NoSuchElementException e) {
      return ApiResponse.ok( ApiResponse.STATUS_NOT_FOUND, "최신 분석 데이터를 찾을 수 없습니다.", null );
    }
  }

  // 분석 데이터 상세 조회
  @GetMapping("/{asmtSn}/analysis-data/{asmtMetaRsltSn}")
  public ResponseEntity<ApiResponse<AnalysisDataDetailResponse>> getAnalysisDataDetail( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable Long asmtMetaRsltSn, @RequestParam(required = false) String rsltGroupStcd ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      AnalysisDataDetailResponse data = analysisService.findAnalysisDataById( memberAndInst, asmtMetaRsltSn, rsltGroupStcd );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "분석 데이터 상세 조회 성공", data );
    } catch (NoSuchElementException e) {
      return ApiResponse.ok( ApiResponse.STATUS_NOT_FOUND, "분석 데이터를 찾을 수 없습니다.", null );
    }
  }

  // 분석 데이터 상태 수정
  @PutMapping("/{asmtSn}/analysis-data/{asmtMetaRsltSn}/status")
  public ResponseEntity<ApiResponse<AnalysisDataUpdateResponse>> updateAnalysisDataStatus( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable Long asmtMetaRsltSn, @RequestBody AnalysisDataRequest request ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );
    try {
      AnalysisDataUpdateResponse data = analysisService.updateAnalysisDataStatus( memberAndInst, asmtSn, asmtMetaRsltSn, request.getAsmtMetaRsltSttsCd() );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "분석 데이터 상태 변경 성공", data );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 검토 요청 전송
  @PostMapping("/{asmtSn}/analysis-data/{asmtMetaRsltSn}/review-request")
  public ResponseEntity<ApiResponse<AnalysisDataUpdateResponse>> sendReviewRequest( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable Long asmtMetaRsltSn ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );
    try {
      AnalysisDataUpdateResponse data = analysisService.sendReviewRequest( memberAndInst, asmtSn, asmtMetaRsltSn );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "검토 요청 전송 성공", data );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 검토 요청 마감
  @PostMapping("/{asmtSn}/analysis-data/{asmtMetaRsltSn}/review-close")
  public ResponseEntity<ApiResponse<AnalysisDataUpdateResponse>> closeReview( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable Long asmtMetaRsltSn ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );
    try {
      AnalysisDataUpdateResponse data = analysisService.closeReview( memberAndInst, asmtSn, asmtMetaRsltSn );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "검토 요청 마감 성공", data );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 의견 등록
  @PostMapping("/{asmtSn}/analysis-data/{asmtMetaRsltSn}/opinion")
  public ResponseEntity<ApiResponse<Void>> createOpinion( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable Long asmtMetaRsltSn, @RequestBody OpinionRequest request ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );
    try {
      analysisService.createOpinion( memberAndInst, asmtSn, asmtMetaRsltSn, null, request );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "의견이 성공적으로 등록되었습니다.", null );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 의견 수정
  @PutMapping("/{asmtSn}/analysis-data/{asmtMetaRsltSn}/opinion")
  public ResponseEntity<ApiResponse<Void>> updateOpinion( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable Long asmtMetaRsltSn, @RequestBody OpinionRequest request ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );
    try {
      analysisService.updateOpinion( memberAndInst, asmtSn, asmtMetaRsltSn, request );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "의견이 성공적으로 수정되었습니다.", null );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 의견 목록
  @GetMapping("/{asmtSn}/analysis-data/{asmtMetaRsltSn}/opinion")
  public ResponseEntity<ApiResponse<List<InstitutionWithOpinionsResponse>>> searchOpinionList( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable Long asmtMetaRsltSn, @RequestParam(required = true) String rsltGroupStcd ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      OpinionRequest request = new OpinionRequest();
      List<InstitutionWithOpinionsResponse> data = analysisService.searchOpinionList( memberAndInst, asmtSn, asmtMetaRsltSn, rsltGroupStcd, request );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "의견 목록 조회 성공", data );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 연구과제 진행 가능 여부 확인
  @GetMapping("/{asmtSn}/analysis-data/all-status-check")
  public ResponseEntity<ApiResponse<Boolean>> checkAllStatus( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );
    boolean isAllCompleted = analysisService.checkAllStatus( memberAndInst, asmtSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "의견 전체 상태 체크 성공", isAllCompleted );
  }

  // 메타분석 접근 가능 여부 체크 (결과제외/활용미동의가 존재하는 기관은 접근 불가)
  @GetMapping("/{asmtSn}/analysis-data/meta-access-check")
  public ResponseEntity<ApiResponse<MetaAccessCheckResponse>> getMetaAccessCheck( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );
    MetaAccessCheckResponse data = analysisService.checkMetaAccess( memberAndInst, asmtSn );
    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "메타분석 접근 가능 여부 조회 성공", data );
  }

  // 의견 목록(결과제외) 조회
  @GetMapping("/{asmtSn}/analysis-data/opinion")
  public ResponseEntity<ApiResponse<List<OpinionListResponse>>> searchOpinionByExcluded( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestParam(required = false) String instId ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      List<OpinionListResponse> data = analysisService.searchOpinionByExcluded( memberAndInst, asmtSn, instId );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "의견 목록(결과제외) 조회 성공", data );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }
}
