package kr.or.kids.domain.cm.community.qna.controller;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.common.dto.CommonCodeItem;
import kr.or.kids.domain.cm.common.mapper.CommonCodeMapper;
import kr.or.kids.domain.cm.community.qna.service.QnaApiService;
import kr.or.kids.domain.cm.community.qna.vo.*;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * <pre>
 * Q&A 관리 컨트롤러
 * - 질문 등록, 수정, 삭제 및 답변(Answer) 관리 기능을 제공한다.
 * </pre>
 *
 * @author kim min seok
 * @version 1.0
 *
 *          <pre>
 *   since         author             description
 * ==========   ============   =========================
 * 2026-01-20   kim min seok    최초 생성
 *          </pre>
 * 
 * @since 2026-01-20
 * @version 1.1
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/community/qna")
public class QnaApiController {

    private final QnaApiService service;
    private final CommonCodeMapper commonCodeMapper;

    /* ===================== 질문 (Question) ===================== */

    /**
     * Q&A 목록을 조회한다.
     *
     * <pre>
     * - Q&A 목록 조회
     * - 검색 조건 및 페이징 처리
     * </pre>
     *
     * @param request HttpServletRequest
     * @param inVo Q&A 목록 조회 조건 VO
     * @return ApiResponse<List<QnaApiOutVO>> Q&A 목록 및 페이징 정보
     */
    @GetMapping("/selectList")
    public ResponseEntity<ApiResponse<List<QnaApiOutVO>>> selectList(HttpServletRequest request, @ModelAttribute QnaApiInVO inVo) {
        List<QnaApiOutVO> list = service.selectQnaList(inVo);
        int totalCount = service.getListCount(inVo);
        return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "Q&A 목록 조회 성공", list, inVo.getPage(), inVo.getPageSize(), totalCount);
    }

    /**
     * Q&A 상세 정보를 조회한다.
     *
     * @param qstnSn 질문 일련번호
     * @param bbsId 게시판 ID
     * @return ApiResponse<QnaApiOutVO> Q&A 상세 정보
     */
    @GetMapping("/selectDetail")
    public ResponseEntity<ApiResponse<QnaApiOutVO>> selectDetail(@RequestParam long qstnSn, @RequestParam String bbsId) {
        return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "Q&A 상세 조회 성공", service.selectQnaDetail(qstnSn, bbsId));
    }

    /**
     * Q&A 비밀번호 일치 여부를 확인한다.
     *
     * @param inVO 비밀번호 확인 조건 VO
     * @return ApiResponse<Boolean> 비밀번호 일치 여부
     */
    @PostMapping("/checkPassword")
    public ResponseEntity<ApiResponse<Boolean>> checkPassword(@ModelAttribute QnaApiInVO inVO) {
        boolean valid = service.checkPassword(inVO);
        return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "비밀번호 확인 완료", valid);
    }

    /**
     * Q&A 질문을 등록한다.
     *
     * @param user 로그인 사용자 정보
     * @param inVo 질문 등록 정보 VO
     * @return ApiResponse<Integer> 등록 처리 건수
     */
    @PostMapping("/insertQna")
    public ResponseEntity<ApiResponse<Integer>> insertQna(@AuthenticationPrincipal CustomUserDetails user, @ModelAttribute TbPpMQnaVo inVo) {
        String sessionId = (user != null) ? user.getUserNo() : null;
        String mbrNo = (inVo.getRgtrId() != null && !inVo.getRgtrId().isBlank()) ? inVo.getRgtrId() : sessionId;

        inVo.setRgtrId(mbrNo);
        inVo.setMdfrId(mbrNo);

        return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "Q&A 등록 성공", service.insertQna(inVo));
    }

    /**
     * Q&A 질문 정보를 수정한다.
     *
     * @param request HttpServletRequest
     * @param user 로그인 사용자 정보
     * @param inVo 질문 수정 정보 VO
     * @param deleteFileIds 삭제 대상 파일 ID 목록
     * @param files 신규 첨부 파일 목록
     * @return ApiResponse<Integer> 수정 처리 건수
     */
    @PutMapping("/updateQna")
    public ResponseEntity<ApiResponse<Integer>> updateQna(HttpServletRequest request, @AuthenticationPrincipal CustomUserDetails user, @ModelAttribute TbPpMQnaVo inVo, @RequestParam(required = false) List<String> deleteFileIds, @RequestPart(required = false) List<MultipartFile> files) {
        String sessionId = (user != null) ? user.getUserNo() : null;
        String mbrNo = (inVo.getMdfrId() != null && !inVo.getMdfrId().isBlank()) ? inVo.getMdfrId() : sessionId;

        inVo.setMdfrId(mbrNo);
        int result = service.updateQna(inVo, deleteFileIds, files);

        return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "Q&A 수정 성공", result);
    }

    /**
     * Q&A 질문을 삭제한다.
     *
     * @param inVo 질문 삭제 정보 VO
     * @return ApiResponse<Integer> 삭제 처리 건수
     */
    @DeleteMapping("/deleteQna")
    public ResponseEntity<ApiResponse<Integer>> deleteQna(@RequestBody TbPpMQnaAnsVo inVo) {
        return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "Q&A 삭제 성공", service.deleteQna(inVo));
    }

    /* ===================== 답변 (Answer) ===================== */

    /**
     * Q&A 답변 정보를 조회한다.
     *
     * @param qstnSn 질문 일련번호
     * @return ApiResponse<QnaAnsApiOutVO> Q&A 답변 정보
     */
    @GetMapping("/selectAnswer")
    public ResponseEntity<ApiResponse<QnaAnsApiOutVO>> selectAnswer(@RequestParam long qstnSn) {
        return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "Q&A 답변 조회 성공", service.selectQnaAnswer(qstnSn));
    }

    /**
     * Q&A 답변을 등록한다.
     *
     * @param user 로그인 사용자 정보
     * @param inVo 답변 등록 정보 VO
     * @return ApiResponse<Integer> 등록 처리 건수
     */
    @PostMapping("/insertAnswer")
    public ResponseEntity<ApiResponse<Integer>> insertAnswer(@AuthenticationPrincipal CustomUserDetails user, @ModelAttribute TbPpMQnaAnsVo inVo) {
        inVo.setRgtrId(user.getUserNo());
        inVo.setMdfrId(user.getUserNo());

        return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "Q&A 답변 등록 성공", service.insertQnaAnswer(inVo));
    }

    /**
     * Q&A 답변 정보를 수정한다.
     *
     * @param request HttpServletRequest
     * @param user 로그인 사용자 정보
     * @param inVo 답변 수정 정보 VO
     * @param deleteFileIds 삭제 대상 파일 ID 목록
     * @param files 신규 첨부 파일 목록
     * @return ApiResponse<Integer> 수정 처리 건수
     */
    @PutMapping("/updateAnswer")
    public ResponseEntity<ApiResponse<Integer>> updateAnswer(HttpServletRequest request, @AuthenticationPrincipal CustomUserDetails user, @ModelAttribute TbPpMQnaAnsVo inVo, @RequestParam(required = false) List<String> deleteFileIds, @RequestPart(required = false) List<MultipartFile> files) {
        inVo.setMdfrId(user.getUserNo());

        int result = service.updateQnaAnswer(inVo, deleteFileIds, files);
        return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "Q&A 답변 수정 성공", result);
    }

    /**
     * Q&A 답변을 삭제한다.
     *
     * @param inVo 답변 삭제 정보 VO
     * @return ApiResponse<Integer> 삭제 처리 건수
     */
    @DeleteMapping("/deleteAnswer")
    public ResponseEntity<ApiResponse<Integer>> deleteAnswer(@RequestBody TbPpMQnaAnsVo inVo) {
        return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "Q&A 답변 삭제 성공", service.deleteQnaAnswer(inVo));
    }

    /**
     * Q&A 질문 조회수를 증가시킨다.
     *
     * @param qstnSn 질문 일련번호
     * @return ApiResponse<Integer> 처리 건수
     */
    @PostMapping("/increaseViewCount")
    public ResponseEntity<ApiResponse<Integer>> increaseViewCount(@RequestParam long qstnSn) {
        return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "Q&A 조회수 증가 성공", service.increaseViewCount(qstnSn));
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