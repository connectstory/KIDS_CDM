package kr.or.kids.domain.cm.community.asmtprp.controller;

import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.common.dto.CommonCodeItem;
import kr.or.kids.domain.cm.common.mapper.CommonCodeMapper;
import kr.or.kids.domain.cm.community.asmtprp.service.AsmtPrpApiService;
import kr.or.kids.domain.cm.community.asmtprp.vo.AsmtPrpAnsApiOutVO;
import kr.or.kids.domain.cm.community.asmtprp.vo.AsmtPrpApiInVO;
import kr.or.kids.domain.cm.community.asmtprp.vo.AsmtPrpApiOutVO;
import kr.or.kids.domain.cm.community.asmtprp.vo.TbPpMAsmtPrpAnsVo;
import kr.or.kids.domain.cm.community.asmtprp.vo.TbPpMAsmtPrpVo;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * <pre>
 * 과제 제안 컨트롤러
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
@RequestMapping("/community/asmtprp")
public class AsmtPrpApiController {

	private final AsmtPrpApiService service;
	private final CommonCodeMapper commonCodeMapper;

	/**
	 * 과제 제안 목록을 조회한다.
	 *
	 * <pre>
	 * - 과제 제안 목록 조회
	 * - 검색 조건 및 페이징 처리
	 * </pre>
	 *
	 * @param request HttpServletRequest
	 * @param inVo 과제 제안 목록 조회 조건 VO
	 * @return 과제 제안 목록, 전체 건수, 페이지 정보를 포함한 Map
	 * @throws RuntimeException 목록 조회 중 오류 발생 시
	 */
	@GetMapping("/selectList")
	public ResponseEntity<ApiResponse<List<AsmtPrpApiOutVO>>> selectList(HttpServletRequest request, @ModelAttribute AsmtPrpApiInVO inVo) {
		List<AsmtPrpApiOutVO> list = service.getList(inVo);
		int totalCount = service.getListCount(inVo);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "과제 제안 목록 조회 성공", list, inVo.getPage(), inVo.getPageSize(), totalCount);
	}

	/**
	 * 과제 제안 상세 정보를 조회한다.
	 *
	 * <pre>
	 * - 과제 제안 식별자(asmtPrpSn)를 기준으로 상세 정보 조회
	 * </pre>
	 *
	 * @param inVo 과제 제안 상세 조회 조건 VO
	 * @return 과제 제안 상세 정보
	 * @throws RuntimeException 상세 조회 중 오류 발생 시
	 */
	@GetMapping("/selectDetail")
	public ResponseEntity<ApiResponse<AsmtPrpApiOutVO>> selectDetail(@ModelAttribute AsmtPrpApiInVO inVo) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "과제 제안 상세 조회 성공", service.getDetail(inVo));
	}

	/**
	 * 비밀번호를 조회한다.
	 *
	 * <pre>
	 * - 비밀번호 확인 조회
	 * </pre>
	 *
	 * @param inVo 과제 제안 등록 정보 VO
	 * @return 비밀번호 일치 여부
	 * @throws RuntimeException 조회 중 오류 발생 시
	 */
	@PostMapping("/checkPassword")
	public ResponseEntity<ApiResponse<Boolean>> checkPassword(@ModelAttribute AsmtPrpApiInVO inVo) {
		boolean valid = service.checkPassword(inVo);
		if (!valid) {
			return ApiResponse.error(HttpStatus.UNAUTHORIZED, "FAIL");
		}
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "SUCCESS", true);
	}

	/**
	 * 과제 제안을 등록한다.
	 *
	 * <pre>
	 * - 과제 제안 기본 정보 등록
	 * </pre>
	 *
	 * @param inVo 과제 제안 등록 정보 VO
	 * @return 처리 결과 건수
	 * @throws RuntimeException 등록 중 오류 발생 시
	 */
	@PostMapping("/insertAsmtPrp")
	public ResponseEntity<ApiResponse<Integer>> insertAsmtPrp(@AuthenticationPrincipal CustomUserDetails user, @ModelAttribute TbPpMAsmtPrpVo inVo) {
		// 프론트에서 넘긴 rgtrId 우선, 없으면 세션 로그인(CustomUserDetails) 사용
		String sessionId = (user != null) ? user.getUserNo() : null;
		String mbrNo = (inVo.getRgtrId() != null && !inVo.getRgtrId().isBlank()) ? inVo.getRgtrId() : sessionId;

		inVo.setRgtrId(mbrNo);
		inVo.setMdfrId(mbrNo);

		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "과제 제안 등록 성공", service.insertAsmtPrp(inVo));
	}

	/**
	 * 과제 제안 정보를 수정한다.
	 *
	 * <pre>
	 * - 과제 제안 제목, 내용 등 수정
	 * </pre>
	 *
	 * @param inVo 과제 제안 수정 정보 VO
	 * @return 처리 결과 건수
	 * @throws RuntimeException 수정 중 오류 발생 시
	 */
	@PutMapping("/updateAsmtPrp")
	public ResponseEntity<ApiResponse<Integer>> updateAsmtPrp(HttpServletRequest request, @AuthenticationPrincipal CustomUserDetails user, @ModelAttribute TbPpMAsmtPrpVo inVo, @RequestParam(required = false) List<String> deleteFileIds, @RequestPart(required = false) List<MultipartFile> files) {
		String sessionId = (user != null) ? user.getUserNo() : null;
		String mbrNo = (inVo.getMdfrId() != null && !inVo.getMdfrId().isBlank()) ? inVo.getMdfrId() : sessionId;

		inVo.setMdfrId(mbrNo);
		int result = service.updateAsmtPrp(inVo, deleteFileIds, files);

		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "과제 제안 수정 성공", result);
	}

	/**
	 * 과제 제안을 삭제한다.
	 *
	 * <pre>
	 * - 과제 제안 논리 삭제 또는 물리 삭제 처리
	 * </pre>
	 *
	 * @param inVo 과제 제안 삭제 정보 VO
	 * @return 처리 결과 건수
	 * @throws RuntimeException 삭제 중 오류 발생 시
	 */
	@DeleteMapping("/deleteAsmtPrp")
	public ResponseEntity<ApiResponse<Integer>> deleteAsmtPrp(@ModelAttribute TbPpMAsmtPrpAnsVo inVo) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "과제 제안 삭제 성공", service.deleteAsmtPrp(inVo));
	}

	/**
	 * 과제 제안에 대한 답변 목록을 조회한다.
	 *
	 * <pre>
	 * - 과제 제안 식별자(asmtPrpSn)를 기준으로 답변 목록 조회
	 * </pre>
	 *
	 * @param asmtPrpSn 과제 제안 식별자
	 * @return 과제 제안 답변 목록
	 * @throws RuntimeException 답변 조회 중 오류 발생 시
	 */
	@GetMapping("/selectAnswer")
	public ResponseEntity<ApiResponse<List<AsmtPrpAnsApiOutVO>>> selectAnswer(@RequestParam long asmtPrpSn) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "과제 제안 답변 목록 조회 성공", service.getAnswerList(asmtPrpSn));
	}

	/**
	 * 과제 제안 답변을 등록한다.
	 *
	 * <pre>
	 * - 과제 제안에 대한 답변 등록
	 * </pre>
	 *
	 * @param inVo 과제 제안 답변 등록 정보 VO
	 * @return 처리 결과 건수
	 * @throws RuntimeException 등록 중 오류 발생 시
	 */
	@PostMapping("/insertAnswer")
	public ResponseEntity<ApiResponse<Integer>> insertAnswer(@AuthenticationPrincipal CustomUserDetails user, @ModelAttribute TbPpMAsmtPrpAnsVo inVo) {
		inVo.setRgtrId(user.getUserNo());
		inVo.setMdfrId(user.getUserNo());
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "과제 제안 답변 등록 성공", service.insertAsmtPrpAnswer(inVo));
	}

	/**
	 * 과제 제안 답변을 수정한다.
	 *
	 * <pre>
	 * - 과제 제안 답변 내용 수정
	 * </pre>
	 *
	 * @param inVo 과제 제안 답변 수정 정보 VO
	 * @return 처리 결과 건수
	 * @throws RuntimeException 수정 중 오류 발생 시
	 */
	@PutMapping("/updateAnswer")
	public ResponseEntity<ApiResponse<Integer>> updateAnswer(@AuthenticationPrincipal CustomUserDetails user, HttpServletRequest request, @ModelAttribute TbPpMAsmtPrpAnsVo inVo, @RequestParam(required = false) List<String> deleteFileIds, @RequestPart(required = false) List<MultipartFile> files) {
		inVo.setMdfrId(user.getUserNo());
		int result = service.updateAsmtPrpAnswer(inVo, deleteFileIds, files);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "과제 제안 답변 수정 성공", result);
	}

	/**
	 * 과제 제안 답변을 삭제한다.
	 *
	 * <pre>
	 * - 답변 식별자(ansSn)를 기준으로 답변 삭제
	 * </pre>
	 *
	 * @param ansSn 답변 식별자
	 * @return 처리 결과 건수
	 * @throws RuntimeException 삭제 중 오류 발생 시
	 */
	@DeleteMapping("/deleteAnswer")
	public ResponseEntity<ApiResponse<Integer>> deleteAnswer(@RequestParam long ansSn) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "과제 제안 답변 삭제 성공", service.deleteAsmtPrpAnswer(ansSn));
	}

	/**
	 * 과제 제안 조회수를 증가시킨다.
	 *
	 * <pre>
	 * - 과제 제안 상세 화면 진입 시 호출
	 * - 해당 과제 제안의 조회수(pst_inq_cnt)를 1 증가
	 * - 논리 삭제된 게시물은 증가 대상에서 제외
	 * </pre>
	 *
	 * @param asmtPrpSn 과제 제안 식별자
	 * @return 처리 결과 건수
	 * @throws RuntimeException 조회수 증가 중 오류 발생 시
	 */
	@PostMapping("/increaseViewCount")
	public ResponseEntity<ApiResponse<Integer>> increaseViewCount(@RequestParam long asmtPrpSn) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "조회수 증가 성공", service.increaseViewCount(asmtPrpSn));
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