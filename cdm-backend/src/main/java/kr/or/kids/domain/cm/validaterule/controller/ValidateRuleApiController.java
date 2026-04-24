package kr.or.kids.domain.cm.validaterule.controller;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.validaterule.service.ValidateRuleApiService;
import kr.or.kids.domain.cm.validaterule.vo.TbCmMVrfcVo;
import kr.or.kids.domain.cm.validaterule.vo.ValidateRuleApiInVO;
import kr.or.kids.domain.cm.validaterule.vo.ValidateRuleApiOutVO;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * <pre>
 * CDM 표준화 검증 규칙 관리 컨트롤러
 * - 검증 규칙 목록 조회, 상세 조회, 등록, 수정, 삭제 기능을 제공한다.
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.1
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/validate-rule")
public class ValidateRuleApiController {

	private final ValidateRuleApiService service;

	/**
	 * CDM 표준화 검증 규칙 목록을 조회한다.
	 *
	 * <pre>
	 * - 검색 조건에 따른 검증 규칙 목록 반환
	 * - 페이징 처리 포함
	 * </pre>
	 *
	 * @param user 로그인 사용자 정보
	 * @param inVo 검증 규칙 조회 조건 VO
	 * @return ApiResponse<List<ValidateRuleApiOutVO>> 검증 규칙 목록 및 페이징 정보
	 */
	@GetMapping("/selectList")
	public ResponseEntity<ApiResponse<List<ValidateRuleApiOutVO>>> selectList(@AuthenticationPrincipal CustomUserDetails user, @ModelAttribute ValidateRuleApiInVO inVo) {
		List<ValidateRuleApiOutVO> list = service.getList(inVo);
		int totalCount = service.getListCount(inVo);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "CDM 표준화 목록 조회 성공", list, inVo.getPage(), inVo.getPageSize(), totalCount);
	}

	/**
	 * CDM 표준화 검증 규칙 상세 정보를 조회한다.
	 *
	 * @param user 로그인 사용자 정보
	 * @param inVo 검증 규칙 상세 조회 조건 VO
	 * @return ApiResponse<ValidateRuleApiOutVO> 검증 규칙 상세 정보
	 */
	@GetMapping("/selectDetail")
	public ResponseEntity<ApiResponse<ValidateRuleApiOutVO>> selectDetail(@AuthenticationPrincipal CustomUserDetails user, @ModelAttribute ValidateRuleApiInVO inVo) {
		ValidateRuleApiOutVO result = service.getDetail(inVo);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "CDM 표준화 상세 조회 성공", result);
	}

	/**
	 * CDM 표준화 검증 규칙을 등록한다.
	 *
	 * <pre>
	 * - 작성자 및 수정자 ID를 로그인 사용자 정보로 자동 설정한다.
	 * </pre>
	 *
	 * @param user 로그인 사용자 정보
	 * @param inVo 검증 규칙 등록 정보 VO
	 * @return ApiResponse<Integer> 등록 처리 건수
	 */
	@PostMapping("/insertValidateRule")
	public ResponseEntity<ApiResponse<Integer>> insertValidateRule(@AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmMVrfcVo inVo) {
		inVo.setRgtrId(user.getUserNo());
		inVo.setMdfrId(user.getUserNo());
		int result = service.insertValidateRule(inVo);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "CDM 표준화 등록 성공", result);
	}

	/**
	 * CDM 표준화 검증 규칙 정보를 수정한다.
	 *
	 * @param user 로그인 사용자 정보
	 * @param inVo 검증 규칙 수정 정보 VO
	 * @return ApiResponse<Integer> 수정 처리 건수
	 */
	@PutMapping("/updateValidateRule")
	public ResponseEntity<ApiResponse<Integer>> updateValidateRule(@AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmMVrfcVo inVo) {
		inVo.setMdfrId(user.getUserNo());
		int result = service.updateValidateRule(inVo);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "CDM 표준화 수정 성공", result);
	}

	/**
	 * CDM 표준화 검증 규칙을 삭제한다.
	 *
	 * @param user 로그인 사용자 정보
	 * @param inVo 검증 규칙 삭제 정보 VO
	 * @return ApiResponse<Integer> 삭제 처리 건수
	 */
	@DeleteMapping("/deleteValidateRule")
	public ResponseEntity<ApiResponse<Integer>> deleteValidateRule(@AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmMVrfcVo inVo) {
		int result = service.deleteValidateRule(inVo);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "CDM 표준화 삭제 성공", result);
	}
}