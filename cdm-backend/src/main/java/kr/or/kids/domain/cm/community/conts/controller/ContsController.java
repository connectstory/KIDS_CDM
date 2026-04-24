package kr.or.kids.domain.cm.community.conts.controller;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.community.conts.service.ContsService;
import kr.or.kids.domain.cm.community.conts.vo.ContsApiInVO;
import kr.or.kids.domain.cm.community.conts.vo.TbCmMContsVO;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * <pre>
 * 공통 컨텐츠 관리 컨트롤러
 * - 컨텐츠 목록 조회, 상세 정보 관리, 리비전 이력 및 게시(Publish) 기능을 제공한다.
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.1
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/community/conts")
public class ContsController {

	private final ContsService contsService;

	/**
	 * 공통 컨텐츠 목록을 조회한다.
	 *
	 * <pre>
	 * - 검색 조건에 따른 컨텐츠 목록 반환
	 * - 페이징 처리 포함
	 * </pre>
	 *
	 * @param request HttpServletRequest
	 * @param inVo 컨텐츠 조회 조건 VO
	 * @return ApiResponse<List<TbCmMContsVO>> 컨텐츠 목록 및 페이징 정보
	 */
	@GetMapping("/selectList")
	public ResponseEntity<ApiResponse<List<TbCmMContsVO>>> selectList(HttpServletRequest request, @ModelAttribute ContsApiInVO inVo) {
		List<TbCmMContsVO> list = contsService.getContsList(inVo);
		int totalCount = contsService.getContsListCount(inVo);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공통 컨텐츠 목록 조회 성공", list, inVo.getPage(), inVo.getPageSize(), totalCount);
	}

	/**
	 * 특정 리비전의 컨텐츠 상세 정보를 조회한다.
	 *
	 * @param rvsnNo 리비전 번호
	 * @param bbsId 게시판 ID
	 * @return ApiResponse<TbCmMContsVO> 컨텐츠 상세 정보
	 */
	@GetMapping("/selectDetail")
	public ResponseEntity<ApiResponse<TbCmMContsVO>> selectDetail(@RequestParam String rvsnNo, @RequestParam String bbsId) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공통 컨텐츠 상세 조회 성공", contsService.getContsDetail(rvsnNo, bbsId));
	}

	/**
	 * 게시판별 컨텐츠 리비전 이력 목록을 조회한다.
	 *
	 * @param bbsId 게시판 ID
	 * @return ApiResponse<List<TbCmMContsVO>> 리비전 이력 목록
	 */
	@GetMapping("/revisionList")
	public ResponseEntity<ApiResponse<List<TbCmMContsVO>>> revisionList(@RequestParam String bbsId) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공통 컨텐츠 리비전 조회 성공", contsService.getRevisionHistory(bbsId));
	}

	/**
	 * 현재 공개(Published) 상태인 컨텐츠를 조회한다.
	 *
	 * @param boardType 게시판 유형
	 * @return ApiResponse<TbCmMContsVO> 공개된 컨텐츠 정보
	 */
	@GetMapping("/published")
	public ResponseEntity<ApiResponse<TbCmMContsVO>> getPublished(@RequestParam String boardType) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공개 컨텐츠 조회 성공", contsService.getPublishedConts(boardType));
	}

	/**
	 * 컨텐츠를 임시 저장(Draft)한다.
	 *
	 * <pre>
	 * - 새로운 리비전으로 저장된다.
	 * - 작성자 및 수정자 정보를 로그인 사용자 정보로 설정한다.
	 * </pre>
	 *
	 * @param bbsId 게시판 ID
	 * @param user 로그인 사용자 정보
	 * @param vo 컨텐츠 데이터 VO
	 * @return ApiResponse<String> 생성된 리비전 번호
	 */
	@PostMapping("/draft")
	public ResponseEntity<ApiResponse<String>> draft(@RequestParam String bbsId, @AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmMContsVO vo) {
		vo.setRgtrId(user.getUserNo());
		vo.setMdfrId(user.getUserNo());
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공통 컨텐츠 임시 저장 성공", contsService.insertConts(bbsId, vo));
	}

	/**
	 * 컨텐츠 정보를 수정한다.
	 *
	 * @param user 로그인 사용자 정보
	 * @param vo 수정할 컨텐츠 데이터 VO
	 * @return ApiResponse<Integer> 수정 처리 건수
	 */
	@PutMapping("/updateConts")
	public ResponseEntity<ApiResponse<Integer>> updateConts(@AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmMContsVO vo) {
		vo.setMdfrId(user.getUserNo());
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공통 컨텐츠 수정 성공", contsService.updateConts(vo));
	}

	/**
	 * 특정 리비전의 컨텐츠를 공개(Publish) 상태로 변경한다.
	 *
	 * @param rvsnNo 리비전 번호
	 * @param bbsId 게시판 ID
	 * @return ApiResponse<Integer> 처리 건수
	 */
	@PostMapping("/publish")
	public ResponseEntity<ApiResponse<Integer>> publish(@RequestParam String rvsnNo, @RequestParam String bbsId) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공통 컨텐츠 공개 처리 성공", contsService.publish(rvsnNo, bbsId));
	}

	/**
	 * 컨텐츠를 삭제한다.
	 *
	 * @param boardType 게시판 유형
	 * @param rvsnNo 리비전 번호
	 * @return ApiResponse<Integer> 삭제 처리 건수
	 */
	@DeleteMapping("/deleteConts")
	public ResponseEntity<ApiResponse<Integer>> deleteConts(@RequestParam String boardType, @RequestParam String rvsnNo) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공통 컨텐츠 삭제 성공", contsService.deleteConts(boardType, rvsnNo));
	}

	/**
	 * 컨텐츠 작성 시 이미지를 업로드한다.
	 *
	 * <pre>
	 * - UUID 기반의 유니크한 파일명 생성
	 * - 서버 내 지정된 경로(uploads)에 저장
	 * </pre>
	 *
	 * @param file 업로드 대상 이미지 파일
	 * @return ApiResponse<Map<String, String>> 업로드된 이미지 URL 정보
	 * @throws Exception 파일 저장 중 발생하는 입출력 오류
	 */
	@PostMapping("/upload")
	public ResponseEntity<ApiResponse<Map<String, String>>> upload(@RequestParam MultipartFile file) throws Exception {
		String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
		Path path = Paths.get("uploads", filename);

		Files.createDirectories(path.getParent());
		Files.write(path, file.getBytes());

		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "이미지 업로드 성공", Map.of("url", "/uploads/" + filename));
	}
}