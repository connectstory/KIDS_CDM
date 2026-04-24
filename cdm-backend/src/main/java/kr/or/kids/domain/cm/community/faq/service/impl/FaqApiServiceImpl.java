package kr.or.kids.domain.cm.community.faq.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.kids.domain.cm.community.faq.mapper.FaqApiMapper;
import kr.or.kids.domain.cm.community.faq.service.FaqApiService;
import kr.or.kids.domain.cm.community.faq.vo.FaqApiInVO;
import kr.or.kids.domain.cm.community.faq.vo.FaqApiOutVO;
import kr.or.kids.domain.cm.community.faq.vo.TbPpMFaqVo;
import lombok.RequiredArgsConstructor;

/**
 * <pre>
 * FAQ 서비스 구현 클래스
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
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaqApiServiceImpl implements FaqApiService {

    private final FaqApiMapper mapper;

    /**
     * FAQ 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 및 페이징 기준에 따른 FAQ 목록 반환
     * </pre>
     *
     * @param inVo FAQ 목록 조회 조건 VO
     * @return FAQ 목록
     */
    @Override
    public List<FaqApiOutVO> getList(FaqApiInVO inVo) {
        return mapper.selectFaqList(inVo);
    }

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
    @Override
    public int getListCount(FaqApiInVO inVo) {
        return mapper.selectFaqListCount(inVo);
    }

    /**
     * FAQ 상세 정보를 조회한다.
     *
     * <pre>
     * - FAQ 일련번호(faqSn)를 기준으로 단건 상세 조회
     * </pre>
     *
     * @param inVo FAQ 상세 조회 조건 VO
     * @return FAQ 상세 정보
     */
    @Override
    public FaqApiOutVO getDetail(FaqApiInVO inVo) {
        long faqSn = inVo.getFaqSn();
        return mapper.selectFaqDetail(faqSn);
    }

    /**
     * FAQ를 등록한다.
     *
     * <pre>
     * - 신규 FAQ 질문 및 답변 정보 저장
     * </pre>
     *
     * @param inVo FAQ 등록 정보 VO
     * @return 등록 결과 건수
     */
    @Override
    @Transactional
    public int insertFaq(TbPpMFaqVo inVo) {
        return mapper.insertFaq(inVo);
    }

    /**
     * FAQ 정보를 수정한다.
     *
     * <pre>
     * - 기존 FAQ의 제목, 내용 등 정보 업데이트
     * </pre>
     *
     * @param inVo FAQ 수정 정보 VO
     * @return 수정 결과 건수
     */
    @Override
    @Transactional
    public int updateFaq(TbPpMFaqVo inVo) {
        return mapper.updateFaq(inVo);
    }

    /**
     * FAQ를 삭제한다.
     *
     * <pre>
     * - FAQ 일련번호를 기준으로 데이터 삭제 처리
     * </pre>
     *
     * @param inVo FAQ 삭제 정보 VO
     * @return 삭제 결과 건수
     */
    @Override
    @Transactional
    public int deleteFaq(TbPpMFaqVo inVo) {
        long faqSn = inVo.getFaqSn();
        return mapper.deleteFaq(faqSn);
    }

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
    @Override
    @Transactional
    public int increaseViewCount(Long faqSn) {
        if (faqSn == null) {
            return 0;
        }
        return mapper.updateFaqViewCount(faqSn);
    }
}