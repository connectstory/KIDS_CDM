package kr.or.kids.domain.cm.community.qna.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.kids.domain.cm.community.qna.vo.QnaAnsApiOutVO;
import kr.or.kids.domain.cm.community.qna.vo.QnaApiInVO;
import kr.or.kids.domain.cm.community.qna.vo.QnaApiOutVO;
import kr.or.kids.domain.cm.community.qna.vo.TbPpMQnaAnsVo;
import kr.or.kids.domain.cm.community.qna.vo.TbPpMQnaVo;

/**
 * <pre>
 * Q&A 매퍼 인터페이스
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
@Mapper
public interface QnaApiMapper {

    /**
     * Q&A 질문 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 필터링 및 페이징 처리된 목록 반환
     * </pre>
     *
     * @param inVo 조회 조건 VO
     * @return Q&A 질문 목록
     */
    List<QnaApiOutVO> selectQnaList(QnaApiInVO inVo);

    /**
     * Q&A 전체 건수를 조회한다.
     *
     * <pre>
     * - 페이징 계산을 위한 필터링된 전체 행 수 반환
     * </pre>
     *
     * @param inVo 조회 조건 VO
     * @return 전체 건수
     */
    int selectQnaListCount(QnaApiInVO inVo);

    /**
     * Q&A 질문 상세 정보를 조회한다.
     *
     * <pre>
     * - 질문 식별자(qstnSn)를 기준으로 상세 데이터 조회
     * </pre>
     *
     * @param inVo 상세 조회 조건 VO
     * @return Q&A 질문 상세 정보
     */
    QnaApiOutVO selectQnaDetail(QnaApiInVO inVo);

    /**
     * 비밀번호 일치 여부를 조회한다.
     *
     * <pre>
     * - 비회원 또는 비밀글 접근을 위한 비밀번호 확인
     * </pre>
     *
     * @param inVo 비밀번호 확인 정보 VO
     * @return 일치하는 행 수 (1: 일치, 0: 불일치)
     */
    int checkPassword(QnaApiInVO inVo);

    /**
     * Q&A 질문 정보를 등록한다.
     *
     * @param inVo 질문 등록 정보 VO
     * @return 등록된 행 수
     */
    int insertQna(TbPpMQnaVo inVo);

    /**
     * Q&A 질문 정보를 수정한다.
     *
     * @param inVo 질문 수정 정보 VO
     * @return 수정된 행 수
     */
    int updateQna(TbPpMQnaVo inVo);

    /**
     * Q&A 질문을 삭제한다.
     *
     * <pre>
     * - 질문 식별자를 기준으로 논리 삭제 처리
     * </pre>
     *
     * @param qstnSn 질문 식별자
     * @return 삭제된 행 수
     */
    int deleteQna(@Param("qstnSn") Long qstnSn);

    /**
     * Q&A 답변 정보를 조회한다.
     *
     * <pre>
     * - 질문 식별자에 연결된 답변 단건 조회
     * </pre>
     *
     * @param qstnSn 질문 식별자
     * @return Q&A 답변 정보
     */
    QnaAnsApiOutVO selectQnaAnswer(@Param("qstnSn") long qstnSn);

    /**
     * Q&A 답변 정보를 등록한다.
     *
     * @param inVo 답변 등록 정보 VO
     * @return 등록된 행 수
     */
    int insertQnaAnswer(TbPpMQnaAnsVo inVo);

    /**
     * Q&A 답변 정보를 수정한다.
     *
     * @param inVo 답변 수정 정보 VO
     * @return 수정된 행 수
     */
    int updateQnaAnswer(TbPpMQnaAnsVo inVo);

    /**
     * Q&A 답변 정보를 삭제한다.
     *
     * <pre>
     * - 답변 식별자를 기준으로 논리 삭제 처리
     * </pre>
     *
     * @param inVo 답변 삭제 정보 VO
     * @return 삭제된 행 수
     */
    int deleteQnaAnswer(TbPpMQnaAnsVo inVo);

    /**
     * 질문 상태를 '답변완료'로 변경한다.
     *
     * <pre>
     * - 답변 등록 시 호출되어 질문의 진행 상태 업데이트
     * </pre>
     *
     * @param qstnSn 질문 식별자
     * @return 수정된 행 수
     */
    int updateQnaStatusAnswered(@Param("qstnSn") long qstnSn);

    /**
     * 질문 상태를 '답변대기'로 변경한다.
     *
     * <pre>
     * - 답변 삭제 시 호출되어 질문의 진행 상태 복구
     * </pre>
     *
     * @param qstnSn 질문 식별자
     * @return 수정된 행 수
     */
    int updateQnaStatusWaiting(@Param("qstnSn") long qstnSn);

    /**
     * 질문에 연결된 답변을 일괄 논리 삭제한다.
     *
     * <pre>
     * - 질문 삭제 시 해당 질문의 모든 답변도 함께 삭제 처리
     * </pre>
     *
     * @param qstnSn 질문 식별자
     * @return 처리된 행 수
     */
    int deleteAnswerByQstnSn(Long qstnSn);

    /**
     * Q&A 조회수를 증가시킨다.
     *
     * <pre>
     * - 질문 상세 조회 시 호출되어 조회수(pst_inq_cnt) 1 증가
     * </pre>
     *
     * @param qstnSn 질문 식별자
     * @return 수정된 행 수
     */
    int updateQnaViewCount(Long qstnSn);
}