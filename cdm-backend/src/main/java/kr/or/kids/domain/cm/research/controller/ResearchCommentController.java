package kr.or.kids.domain.cm.research.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.research.dto.CommentCreateRequest;
import kr.or.kids.domain.cm.research.dto.CommentResponse;
import kr.or.kids.domain.cm.research.dto.CommentUpdateRequest;
import kr.or.kids.domain.cm.research.service.ResearchCommentService;
import kr.or.kids.domain.cm.research.service.support.ResearchMemberResolver;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/researches/{asmtSn}/comments")
@RequiredArgsConstructor
public class ResearchCommentController {

  private final ResearchCommentService researchCommentService;
  private final ResearchMemberResolver researchMemberResolver;

  // 과제 댓글 목록 조회
  @GetMapping
  public ResponseEntity<ApiResponse<List<CommentResponse>>> searchComments( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      List<CommentResponse> data = researchCommentService.searchComments( memberAndInst, asmtSn );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "댓글 목록 조회 성공", data );
    } catch (IllegalArgumentException e) {
      if ("권한이 없습니다.".equals( e.getMessage() )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, e.getMessage() );
      }
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // 과제 댓글 등록
  @PostMapping
  public ResponseEntity<ApiResponse<CommentResponse>> createComment( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @RequestBody CommentCreateRequest request ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      CommentResponse data = researchCommentService.createComment( memberAndInst, asmtSn, request );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "댓글이 등록되었습니다.", data );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 과제 댓글 수정
  @PutMapping("/{asmtCmntSn}")
  public ResponseEntity<ApiResponse<Void>> updateComment( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable Long asmtCmntSn, @RequestBody CommentUpdateRequest request ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      researchCommentService.updateComment( memberAndInst, asmtSn, asmtCmntSn, request );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "댓글이 수정되었습니다.", null );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }

  // 과제 댓글 삭제 (논리 삭제)
  @DeleteMapping("/{asmtCmntSn}")
  public ResponseEntity<ApiResponse<Void>> deleteComment( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long asmtSn, @PathVariable Long asmtCmntSn ) {
    ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, user );

    try {
      researchCommentService.deleteComment( memberAndInst, asmtSn, asmtCmntSn );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "댓글이 삭제되었습니다.", null );
    } catch (IllegalArgumentException e) {
      return ApiResponse.ok( ApiResponse.STATUS_FAIL, e.getMessage(), null );
    }
  }
}
