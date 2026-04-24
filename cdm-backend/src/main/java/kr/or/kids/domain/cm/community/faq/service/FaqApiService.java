package kr.or.kids.domain.cm.community.faq.service;

import java.util.List;

import kr.or.kids.domain.cm.community.faq.vo.FaqApiInVO;
import kr.or.kids.domain.cm.community.faq.vo.FaqApiOutVO;
import kr.or.kids.domain.cm.community.faq.vo.TbPpMFaqVo;

/**
 * <pre>
 * FAQ 서비스 인터페이스
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
public interface FaqApiService {

    /**
     * FAQ 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 및 페이징 처리가 포함된 FAQ 목록 조회
     * </pre>
     *
     * @param inVo FAQ 목록 조회 조건 VO
     * @return FAQ 목록
     */
    List<FaqApiOutVO> getList(FaqApiInVO inVo);

    /**
     * 전체 FAQ 건수를 조회한다.
     *
     * <pre>
     * - 페이징 처리를 위한 전체 데이터 개수 조회
     * </pre>
     *
     * @param inVo FAQ 목록 조회 조건 VO
     * @return 전체 건수
     */
    int getListCount(FaqApiInVO inVo);

    /**
     * FAQ 상세 정보를 조회한다.
     *
     * <pre>
     * - FAQ 식별자(faqSn)를 기준으로 단건 조회
     * </pre>
     *
     * @param inVo FAQ 상세 조회 조건 VO
     * @return FAQ 상세 정보
     */
    FaqApiOutVO getDetail(FaqApiInVO inVo);

    /**
     * FAQ를 등록한다.
     *
     * <pre>
     * - 새로운 FAQ 질문 및 답변 정보를 등록
     * </pre>
     *
     * @param inVo FAQ 등록 정보 VO
     * @return 등록 결과 건수
     */
    int insertFaq(TbPpMFaqVo inVo);

    /**
     * FAQ 정보를 수정한다.
     *
     * <pre>
     * - FAQ 제목, 내용 및 노출 여부 등 수정
     * </pre>
     *
     * @param inVo FAQ 수정 정보 VO
     * @return 수정 결과 건수
     */
    int updateFaq(TbPpMFaqVo inVo);

    /**
     * FAQ를 삭제한다.
     *
     * <pre>
     * - FAQ 식별자를 기준으로 데이터 삭제 처리
     * </pre>
     *
     * @param inVo FAQ 삭제 정보 VO
     * @return 삭제 결과 건수
     */
    int deleteFaq(TbPpMFaqVo inVo);

    /**
     * FAQ 조회수를 증가시킨다.
     *
     * <pre>
     * - 상세 페이지 접근 시 조회수(faq_inq_cnt) 1 증가
     * </pre>
     *
     * @param faqSn FAQ 식별자
     * @return 수정 결과 건수
     */
    int increaseViewCount(Long faqSn);
}