package kr.or.kids.domain.cm.community.conts.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.kids.domain.cm.community.conts.mapper.ContsMapper;
import kr.or.kids.domain.cm.community.conts.service.ContsService;

import kr.or.kids.domain.cm.community.conts.vo.BoardTypeCodeVo;
import kr.or.kids.domain.cm.community.conts.vo.ContsApiInVO;
import kr.or.kids.domain.cm.community.conts.vo.TbCmMContsVO;

import lombok.RequiredArgsConstructor;

/**
 * <pre>
 * 공통 컨텐츠 서비스 구현 클래스
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
public class ContsServiceImpl implements ContsService {

    private final ContsMapper mapper;

    /**
     * 공통 컨텐츠 목록을 조회한다.
     *
     * @param inVo 컨텐츠 목록 조회 조건 VO
     * @return 컨텐츠 목록
     */
    @Override
    public List<TbCmMContsVO> getContsList(ContsApiInVO inVo) {
        return mapper.selectContsList(inVo);
    }

    /**
     * 전체 컨텐츠 건수를 조회한다.
     *
     * @param inVo 컨텐츠 목록 조회 조건 VO
     * @return 전체 건수
     */
    @Override
    public int getContsListCount(ContsApiInVO inVo) {
        return mapper.selectContsListCount(inVo);
    }

    /**
     * 공통 컨텐츠 상세 정보를 조회한다.
     *
     * @param rvsnNo 리비전 번호
     * @param bbsId 게시판 ID
     * @return 컨텐츠 상세 정보
     */
    @Override
    public TbCmMContsVO getContsDetail(String rvsnNo, String bbsId) {
        return mapper.selectContsDetail(rvsnNo, bbsId);
    }

    /**
     * 리비전 히스토리를 조회한다. (관리자용)
     *
     * @param bbsId 게시판 ID
     * @return 리비전 히스토리 목록
     */
    @Override
    public List<TbCmMContsVO> getRevisionHistory(String bbsId) {
        return mapper.selectRevisionHistory(bbsId);
    }

    /**
     * 현재 공개 중인 컨텐츠를 조회한다. (사용자용)
     *
     * @param bbsId 게시판 ID
     * @return 현재 공개 컨텐츠 정보
     */
    @Override
    public TbCmMContsVO getPublishedConts(String bbsId) {
        return mapper.selectPublishedConts(bbsId);
    }

    /**
     * 공통 컨텐츠를 등록한다. (임시저장)
     *
     * <pre>
     * - 게시판 ID별 접두사(Prefix)를 기반으로 신규 리비전 번호 생성
     * - 초기 등록 시 공개 여부는 'N'으로 설정
     * </pre>
     *
     * @param bbsId 게시판 ID
     * @param vo 컨텐츠 등록 정보 VO
     * @return 생성된 리비전 번호 (rvsnNo)
     */
    @Override
    @Transactional
    public String insertConts(String bbsId, TbCmMContsVO vo) {
        BoardTypeCodeVo type = BoardTypeCodeVo.from(bbsId);

        String prefix = type.getPrefix();
        String rvsnNo = mapper.selectNextRevision(prefix);

        vo.setRvsnNo(rvsnNo);
        vo.setBbsId(bbsId);
        vo.setRlsYn("N");

        mapper.insertConts(vo);

        return rvsnNo;
    }

    /**
     * 공통 컨텐츠 정보를 수정한다.
     *
     * @param vo 컨텐츠 수정 정보 VO
     * @return 수정 결과 건수
     */
    @Override
    @Transactional
    public int updateConts(TbCmMContsVO vo) {
        return mapper.updateConts(vo);
    }

    /**
     * 특정 리비전을 공개 처리한다.
     *
     * <pre>
     * - 해당 게시판의 기존 공개 컨텐츠를 모두 비공개 처리 후
     * - 요청된 리비전 번호를 공개 상태로 전환
     * </pre>
     *
     * @param rvsnNo 리비전 번호
     * @param bbsId 게시판 ID
     * @return 처리 결과 건수
     */
    @Override
    @Transactional
    public int publish(String rvsnNo, String bbsId) {
        mapper.clearPublished(bbsId);
        return mapper.setPublished(rvsnNo, bbsId);
    }

    /**
     * 특정 리비전을 공개 처리한다. (이력 관리 병행)
     *
     * @param rvsnNo 리비전 번호
     * @param bbsId 게시판 ID
     * @return 처리 결과 건수
     */
    @Override
    @Transactional
    public int publishConts(String rvsnNo, String bbsId) {
        mapper.clearPublished(bbsId);
        return mapper.publishConts(rvsnNo, bbsId);
    }

    /**
     * 공통 컨텐츠를 삭제한다.
     *
     * @param rvsnNo 리비전 번호
     * @param bbsId 게시판 ID
     * @return 삭제 결과 건수
     */
    @Override
    @Transactional
    public int deleteConts(String rvsnNo, String bbsId) {
        return mapper.deleteConts(rvsnNo, bbsId);
    }
}