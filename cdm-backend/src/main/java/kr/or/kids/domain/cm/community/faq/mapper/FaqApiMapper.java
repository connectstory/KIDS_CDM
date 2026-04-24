package kr.or.kids.domain.cm.community.faq.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.or.kids.domain.cm.community.faq.vo.FaqApiInVO;
import kr.or.kids.domain.cm.community.faq.vo.FaqApiOutVO;
import kr.or.kids.domain.cm.community.faq.vo.TbPpMFaqVo;

/**
 * <pre>
 * FAQ 매퍼 인터페이스
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
public interface FaqApiMapper {

    /**
     * FAQ 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 필터링 및 페이징 처리된 FAQ 목록 반환
     * </pre>
     *
     * @param inVo FAQ 목록 조회 조건 VO
     * @return FAQ 목록
     */
    List<FaqApiOutVO> selectFaqList(FaqApiInVO inVo);

    /**
     * FAQ 전체 건수를 조회한다.
     *
     * <pre>
     * - 페이징 계산을 위한 전체 데이터 개수 반환
     * </pre>
     *
     * @param inVo FAQ 목록 조회 조건 VO
     * @return 전체 건수
     */
    int selectFaqListCount(FaqApiInVO inVo);

    /**
     * FAQ 상세 정보를 조회한다.
     *
     * <pre>
     * - FAQ 식별자(faqSn)를 기준으로 단건 조회
     * </pre>
     *
     * @param faqSn FAQ 식별자
     * @return FAQ 상세 정보
     */
    FaqApiOutVO selectFaqDetail(long faqSn);

    /**
     * FAQ 정보를 등록한다.
     *
     * <pre>
     * - 새로운 FAQ 질문 및 답변 등록
     * </pre>
     *
     * @param inVo FAQ 등록 정보 VO
     * @return 등록된 행 수
     */
    int insertFaq(TbPpMFaqVo inVo);

    /**
     * FAQ 정보를 수정한다.
     *
     * <pre>
     * - FAQ 제목, 내용 등 업데이트
     * </pre>
     *
     * @param inVo FAQ 수정 정보 VO
     * @return 수정된 행 수
     */
    int updateFaq(TbPpMFaqVo inVo);

    /**
     * FAQ 정보를 삭제한다.
     *
     * <pre>
     * - FAQ 식별자를 기준으로 데이터 삭제
     * </pre>
     *
     * @param faqSn FAQ 식별자
     * @return 삭제된 행 수
     */
    int deleteFaq(Long faqSn);

    /**
     * FAQ 조회수를 증가시킨다.
     *
     * <pre>
     * - 상세 조회 시 호출되어 조회수(faq_inq_cnt) 1 증가
     * </pre>
     *
     * @param faqSn FAQ 식별자
     * @return 수정된 행 수
     */
    int updateFaqViewCount(Long faqSn);
}