package kr.or.kids.domain.cm.community.faq.controller;

import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.common.dto.CommonCodeItem;
import kr.or.kids.domain.cm.common.mapper.CommonCodeMapper;
import kr.or.kids.domain.cm.community.faq.service.FaqApiService;
import kr.or.kids.domain.cm.community.faq.vo.FaqApiInVO;
import kr.or.kids.domain.cm.community.faq.vo.FaqApiOutVO;
import kr.or.kids.domain.cm.community.faq.vo.TbPpMFaqVo;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * <pre>
 * FAQ 관리 컨트롤러
 * - FAQ 목록 조회, 상세 정보 관리, 조회수 증가 기능을 제공한다.
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.0
 *
 *          <pre>
 *   since         author             description
 * ==========   ============   =========================
 * 2026-01-20   kim min seok    최초 생성
 *          </pre>
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/community/faq")
public class FaqApiController {

	private final FaqApiService service;
	private final CommonCodeMapper commonCodeMapper;

	/**
	 * FAQ 목록을 조회한다.
	 *
	 * <pre>
	 * - FAQ 목록 조회
	 * - 검색 조건 및 페이징 처리
	 * </pre>
	 *
	 * @param request HttpServletRequest
	 * @param inVo FAQ 목록 조회 조건 VO
	 * @return ApiResponse<List<FaqApiOutVO>> FAQ 목록 및 페이징 정보
	 */
	@GetMapping("/selectList")
	public ResponseEntity<ApiResponse<List<FaqApiOutVO>>> selectList(HttpServletRequest request, @ModelAttribute FaqApiInVO inVo) {
		List<FaqApiOutVO> list = service.getList(inVo);
		int totalCount = service.getListCount(inVo);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "FAQ 목록 조회 성공", list, inVo.getPage(), inVo.getPageSize(), totalCount);
	}

	/**
	 * FAQ 상세 정보를 조회한다.
	 *
	 * @param request HttpServletRequest
	 * @param inVo FAQ 상세 조회 조건 VO
	 * @return ApiResponse<FaqApiOutVO> FAQ 상세 정보
	 */
	@GetMapping("/selectDetail")
	public ResponseEntity<ApiResponse<FaqApiOutVO>> selectDetail(HttpServletRequest request, @ModelAttribute FaqApiInVO inVo) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "FAQ 상세 조회 성공", service.getDetail(inVo));
	}

	/**
	 * FAQ를 등록한다.
	 *
	 * <pre>
	 * - 작성자 및 수정자 ID를 로그인 사용자 정보로 자동 설정한다.
	 * </pre>
	 *
	 * @param request HttpServletRequest
	 * @param user 로그인 사용자 정보
	 * @param inVo FAQ 등록 정보 VO
	 * @return ApiResponse<Integer> 등록 처리 건수
	 */
	@PostMapping("/insertFaq")
	public ResponseEntity<ApiResponse<Integer>> insertFaq(HttpServletRequest request, @AuthenticationPrincipal CustomUserDetails user, @ModelAttribute TbPpMFaqVo inVo) {
		inVo.setRgtrId(user.getUserNo());
		inVo.setMdfrId(user.getUserNo());
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "FAQ 등록 성공", service.insertFaq(inVo));
	}

	/**
	 * FAQ 정보를 수정한다.
	 *
	 * @param request HttpServletRequest
	 * @param user 로그인 사용자 정보
	 * @param inVo FAQ 수정 정보 VO
	 * @return ApiResponse<Integer> 수정 처리 건수
	 */
	@PutMapping("/updateFaq")
	public ResponseEntity<ApiResponse<Integer>> updateFaq(HttpServletRequest request, @AuthenticationPrincipal CustomUserDetails user, @ModelAttribute TbPpMFaqVo inVo) {
		inVo.setMdfrId(user.getUserNo());
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "FAQ 수정 성공", service.updateFaq(inVo));
	}

	/**
	 * FAQ를 삭제한다.
	 *
	 * @param request HttpServletRequest
	 * @param inVo FAQ 삭제 정보 VO
	 * @return ApiResponse<Integer> 삭제 처리 건수
	 */
	@DeleteMapping("/deleteFaq")
	public ResponseEntity<ApiResponse<Integer>> deleteFaq(HttpServletRequest request, @ModelAttribute TbPpMFaqVo inVo) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "FAQ 삭제 성공", service.deleteFaq(inVo));
	}

	/**
	 * FAQ 조회수를 증가시킨다.
	 *
	 * @param faqSn FAQ 일련번호
	 * @return ApiResponse<Void> 응답 결과
	 */
	@PostMapping("/increaseViewCount")
	public ResponseEntity<ApiResponse<Void>> increaseViewCount(@RequestParam long faqSn) {
		service.increaseViewCount(faqSn);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "FAQ 조회수 증가 성공", null);
	}

	/**
	 * 공통코드 상세 목록을 조회한다. (/community/** 경로는 인증 없이 접근 가능)
	 *
	 * @param groupCode 공통코드 그룹코드
	 * @return ApiResponse<List<CommonCodeItem>> 공통코드 목록
	 */
	@GetMapping("/codes/{groupCode}")
	public ResponseEntity<ApiResponse<List<CommonCodeItem>>> getCommonCodes(@PathVariable String groupCode) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공통코드 조회 성공", commonCodeMapper.selectByGroupCode(groupCode));
	}
}