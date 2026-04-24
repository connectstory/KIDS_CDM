package kr.or.kids.domain.cm.community.board.controller;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.community.board.service.BoardApiService;
import kr.or.kids.domain.cm.community.board.vo.BoardApiInVO;
import kr.or.kids.domain.cm.community.board.vo.BoardApiOutVO;
import kr.or.kids.domain.cm.community.board.vo.TbPpMPstVo;
import kr.or.kids.domain.cm.research.dto.CommentCreateRequest;
import kr.or.kids.domain.cm.research.dto.CommentResponse;
import kr.or.kids.domain.cm.research.dto.CommentUpdateRequest;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * <pre>
 * 게시판 컨트롤러 (API Response 표준 적용)
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.2
 *
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/community/board")
public class BoardApiController {

	private final BoardApiService service;

	/**
	 * 게시판 게시글 목록을 조회한다.
	 *
	 * <pre>
	 * - 게시판 유형(bbsId)에 따른 게시글 목록 조회
	 * - 검색 조건(제목/내용/작성자) 처리
	 * - 페이징 처리(page, pageSize)
	 * - 응답은 ApiResponse 구조로 반환
	 * </pre>
	 *
	 * @param user CustomUserDetails
	 * @param inVo 게시글 목록 조회 조건 VO
	 * @return ApiResponse<List<BoardApiOutVO>>
	 */
	@GetMapping("/selectList")
	public ResponseEntity<ApiResponse<List<BoardApiOutVO>>> selectList( @AuthenticationPrincipal CustomUserDetails user, @ModelAttribute BoardApiInVO inVo ) {
		List<BoardApiOutVO> list = service.getList( inVo );
		int totalCount = service.getListCount( inVo );
		return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "게시글 목록 조회 성공", list, inVo.getPage(), inVo.getPageSize(), totalCount );
	}

	/**
	 * 게시판 게시글 상세 정보를 조회한다.
	 *
	 * <pre>
	 * - 게시글 식별자(pstSn)를 기준으로 상세 정보 조회
	 * - 조회수 증가 정책은 서비스 레이어에서 처리
	 * - 응답은 ApiResponse 구조로 반환
	 * </pre>
	 *
	 * @param user CustomUserDetails
	 * @param inVo 게시글 상세 조회 조건 VO
	 * @return ApiResponse<BoardApiOutVO>
	 */
	@GetMapping("/selectDetail")
	public ResponseEntity<ApiResponse<BoardApiOutVO>> selectDetail( @AuthenticationPrincipal CustomUserDetails user, @ModelAttribute BoardApiInVO inVo ) {
		BoardApiOutVO result = service.getDetail( inVo );
		return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "게시글 상세 조회 성공", result );
	}

	/**
	 * 게시판 게시글을 등록한다.
	 *
	 * <pre>
	 * - 게시글 기본 정보 저장
	 * - 첨부파일 정보 연계 처리
	 * - 게시 기간, 공개 여부 등 게시글 속성 반영
	 * - 등록자ID(rgtrId)를 로그인 사용자의 mbrId로 자동 설정
	 * - 응답은 ApiResponse 구조로 반환
	 * </pre>
	 *
	 * @param user CustomUserDetails
	 * @param inVo 게시글 등록 정보 VO
	 * @return ApiResponse<Integer> (처리 건수)
	 */
	@PostMapping("/insertBoard")
	public ResponseEntity<ApiResponse<Integer>> insertBoard( @AuthenticationPrincipal CustomUserDetails user, @ModelAttribute TbPpMPstVo inVo ) {
		inVo.setRgtrId( user.getUserNo() );
		inVo.setMdfrId( user.getUserNo() );

		int result = service.insertBoard( inVo );

		return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "게시글 등록 성공", result );
	}

	/**
	 * 게시판 게시글 정보를 수정한다.
	 *
	 * <pre>
	 * - 게시글 제목, 내용, 게시 기간 등 수정
	 * - 기존 첨부파일 유지 또는 변경 처리
	 * - 수정자ID(mdfrId)를 로그인 사용자의 mbrId로 자동 설정
	 * - 응답은 ApiResponse 구조로 반환
	 * </pre>
	 *
	 * @param user CustomUserDetails
	 * @param inVo 게시글 수정 정보 VO
	 * @return ApiResponse<Integer> (처리 건수)
	 */
	@PutMapping("/updateBoard")
	public ResponseEntity<ApiResponse<Integer>> updateBoard( @AuthenticationPrincipal CustomUserDetails user, @ModelAttribute TbPpMPstVo inVo, @RequestParam(required = false) List<String> deleteFileIds, @RequestPart(required = false) List<MultipartFile> files ) {
		inVo.setMdfrId( user.getUserNo() );

		int result = service.updateBoard( inVo, deleteFileIds, files );

		return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "게시글 수정 성공", result );
	}

	/**
	 * 게시판 게시글을 삭제한다.
	 *
	 * <pre>
	 * - 게시글 논리 삭제 또는 물리 삭제 처리
	 * - 삭제 정책은 서비스 레이어에서 결정
	 * - 수정자ID(mdfrId)를 로그인 사용자의 mbrId로 자동 설정
	 * - 응답은 ApiResponse 구조로 반환
	 * </pre>
	 *
	 * @param user CustomUserDetails
	 * @param inVo 게시글 삭제 정보 VO
	 * @return ApiResponse<Integer> (처리 건수)
	 */
	@DeleteMapping("/deleteBoard")
	public ResponseEntity<ApiResponse<Integer>> deleteBoard( @AuthenticationPrincipal CustomUserDetails user, @ModelAttribute TbPpMPstVo inVo ) {
		inVo.setMdfrId( user.getUserNo() );

		int result = service.deleteBoard( inVo );

		return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "게시글 삭제 성공", result );
	}

	/**
	 * 게시판 조회수 증가
	 *
	 * <pre>
	 * - 게시글 상세 페이지 진입 시 호출
	 * - 조회수(pst_inq_cnt) 1 증가
	 * - 응답은 ApiResponse 구조로 반환
	 * </pre>
	 *
	 * @param pstSn 게시글 일련번호
	 * @return ApiResponse<Integer> (처리 건수)
	 */
	@PostMapping("/increaseViewCount")
	public ResponseEntity<ApiResponse<Integer>> increaseViewCount( @RequestParam long pstSn ) {
		int result = service.increaseViewCount( pstSn );
		return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "조회수 증가 성공", result );
	}

	/**
	 * 게시판 댓글 목록 조회
	 *
	 * @param pstSn 게시글 일련번호
	 * @param bbsId 게시판 ID
	 */
	@GetMapping("/{pstSn}/comments")
	public ResponseEntity<ApiResponse<List<CommentResponse>>> searchComments( @PathVariable Long pstSn, @RequestParam String bbsId ) {
		List<CommentResponse> data = service.searchComments( pstSn, bbsId );
		return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "댓글 목록 조회 성공", data );
	}

	/**
	 * 게시판 댓글 등록
	 *
	 * @param user  로그인 사용자
	 * @param pstSn 게시글 일련번호
	 * @param bbsId 게시판 ID
	 */
	@PostMapping("/{pstSn}/comments")
	public ResponseEntity<ApiResponse<CommentResponse>> createComment( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long pstSn, @RequestParam String bbsId, @RequestBody CommentCreateRequest request ) {
		CommentResponse data = service.createComment( pstSn, bbsId, user.getUserNo(), user.getInstId(), request );
		return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "댓글이 등록되었습니다.", data );
	}

	/**
	 * 게시판 댓글 수정
	 *
	 * @param user       로그인 사용자
	 * @param pstSn      게시글 일련번호
	 * @param asmtCmntSn 댓글 일련번호
	 * @param bbsId      게시판 ID
	 */
	@PutMapping("/{pstSn}/comments/{asmtCmntSn}")
	public ResponseEntity<ApiResponse<Void>> updateComment( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long pstSn, @PathVariable Long asmtCmntSn, @RequestParam String bbsId, @RequestBody CommentUpdateRequest request ) {
		service.updateComment( pstSn, bbsId, asmtCmntSn, user.getUserNo(), request );
		return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "댓글이 수정되었습니다.", null );
	}

	/**
	 * 게시판 댓글 삭제
	 *
	 * @param user       로그인 사용자
	 * @param pstSn      게시글 일련번호
	 * @param asmtCmntSn 댓글 일련번호
	 * @param bbsId      게시판 ID
	 */
	@DeleteMapping("/{pstSn}/comments/{asmtCmntSn}")
	public ResponseEntity<ApiResponse<Void>> deleteComment( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long pstSn, @PathVariable Long asmtCmntSn, @RequestParam String bbsId ) {
		service.deleteComment( pstSn, bbsId, asmtCmntSn, user.getUserNo() );
		return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "댓글이 삭제되었습니다.", null );
	}
}
