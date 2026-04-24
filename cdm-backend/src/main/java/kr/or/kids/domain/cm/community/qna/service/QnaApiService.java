package kr.or.kids.domain.cm.community.qna.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.community.qna.vo.QnaAnsApiOutVO;
import kr.or.kids.domain.cm.community.qna.vo.QnaApiInVO;
import kr.or.kids.domain.cm.community.qna.vo.QnaApiOutVO;
import kr.or.kids.domain.cm.community.qna.vo.TbPpMQnaAnsVo;
import kr.or.kids.domain.cm.community.qna.vo.TbPpMQnaVo;

/**
 * <pre>
 * Q&A 서비스 인터페이스
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.0
 *
 * <pre>
 * since         author             description
 * ==========   ============   =========================
 * 2026-01-20   kim min seok    최초 생성
 * </pre>
 */
public interface QnaApiService {

    /* ===================== 질문 (Question) ===================== */

    /**
     * Q&A 질문 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 및 페이징 처리가 포함된 질문 목록 조회
     * </pre>
     *
     * @param inVo Q&A 목록 조회 조건 VO
     * @return Q&A 질문 목록
     */
    List<QnaApiOutVO> selectQnaList(QnaApiInVO inVo);

    /**
     * 전체 Q&A 건수를 조회한다.
     *
     * <pre>
     * - 페이징 처리를 위한 전체 데이터 개수 조회
     * </pre>
     *
     * @param inVo Q&A 목록 조회 조건 VO
     * @return 전체 건수
     */
    int getListCount(QnaApiInVO inVo);

    /**
     * Q&A 질문 상세 정보를 조회한다.
     *
     * <pre>
     * - 질문 식별자 및 게시판 ID를 기준으로 상세 내용 조회
     * </pre>
     *
     * @param qstnSn 질문 식별자
     * @param bbsId 게시판 ID
     * @return Q&A 질문 상세 정보
     */
    QnaApiOutVO selectQnaDetail(long qstnSn, String bbsId);

    /**
     * 비밀번호 일치 여부를 확인한다.
     *
     * <pre>
     * - 비회원 또는 비밀글 수정을 위한 비밀번호 확인
     * </pre>
     *
     * @param inVo Q&A 정보 VO
     * @return 비밀번호 일치 여부 (true: 일치, false: 불일치)
     */
    boolean checkPassword(QnaApiInVO inVo);

    /**
     * Q&A 질문을 등록한다.
     *
     * <pre>
     * - 질문 기본 정보 및 첨부파일 등록 처리
     * </pre>
     *
     * @param inVo 질문 등록 정보 VO
     * @return 등록 결과 건수
     */
    int insertQna(TbPpMQnaVo inVo);

    /**
     * Q&A 질문 정보를 수정한다.
     *
     * <pre>
     * - 질문 내용 수정 및 파일 삭제/추가 업로드 처리
     * </pre>
     *
     * @param inVo 질문 수정 정보 VO
     * @param deleteFileIds 삭제 대상 파일 ID 목록
     * @param files 신규 추가 파일 목록
     * @return 수정 결과 건수
     */
    int updateQna(TbPpMQnaVo inVo, List<String> deleteFileIds, List<MultipartFile> files);

    /**
     * Q&A 질문을 삭제한다.
     *
     * <pre>
     * - 질문 식별자를 기준으로 논리 삭제 처리
     * </pre>
     *
     * @param inVo 삭제 정보 VO
     * @return 삭제 결과 건수
     */
    int deleteQna(TbPpMQnaAnsVo inVo);

    /* ===================== 답변 (Answer) ===================== */

    /**
     * Q&A 답변 정보를 조회한다.
     *
     * <pre>
     * - 질문 식별자(qstnSn)에 연결된 답변 단건 조회
     * </pre>
     *
     * @param qstnSn 질문 식별자
     * @return Q&A 답변 정보
     */
    QnaAnsApiOutVO selectQnaAnswer(long qstnSn);

    /**
     * Q&A 답변을 등록한다.
     *
     * <pre>
     * - 질문에 대한 답변 등록 및 원본 질문 상태 업데이트
     * </pre>
     *
     * @param inVo 답변 등록 정보 VO
     * @return 등록 결과 건수
     */
    int insertQnaAnswer(TbPpMQnaAnsVo inVo);

    /**
     * Q&A 답변 정보를 수정한다.
     *
     * <pre>
     * - 답변 내용 수정 및 관련 파일 업데이트 처리
     * </pre>
     *
     * @param inVo 답변 수정 정보 VO
     * @param deleteFileIds 삭제 대상 파일 ID 목록
     * @param files 신규 추가 파일 목록
     * @return 수정 결과 건수
     */
    int updateQnaAnswer(TbPpMQnaAnsVo inVo, List<String> deleteFileIds, List<MultipartFile> files);

    /**
     * Q&A 답변을 삭제한다.
     *
     * <pre>
     * - 답변 식별자를 기준으로 논리 삭제 처리
     * </pre>
     *
     * @param inVo 삭제 정보 VO
     * @return 삭제 결과 건수
     */
    int deleteQnaAnswer(TbPpMQnaAnsVo inVo);

    /**
     * Q&A 조회수를 증가시킨다.
     *
     * <pre>
     * - 상세 페이지 접근 시 조회수(pst_inq_cnt) 1 증가
     * </pre>
     *
     * @param qstnSn 질문 식별자
     * @return 수정 결과 건수
     */
    int increaseViewCount(long qstnSn);
}