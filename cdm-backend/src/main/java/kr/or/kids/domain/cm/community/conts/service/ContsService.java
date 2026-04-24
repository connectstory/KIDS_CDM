package kr.or.kids.domain.cm.community.conts.service;

import java.util.List;

import kr.or.kids.domain.cm.community.conts.vo.ContsApiInVO;
import kr.or.kids.domain.cm.community.conts.vo.TbCmMContsVO;

/**
 * <pre>
 * 공통 컨텐츠 서비스 인터페이스
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
public interface ContsService {

    /**
     * 공통 컨텐츠 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 및 페이징 처리가 포함된 컨텐츠 목록 조회
     * </pre>
     *
     * @param inVo 컨텐츠 목록 조회 조건 VO
     * @return 컨텐츠 목록
     */
    List<TbCmMContsVO> getContsList(ContsApiInVO inVo);

    /**
     * 전체 컨텐츠 건수를 조회한다.
     *
     * <pre>
     * - 페이징 처리를 위한 전체 데이터 개수 조회
     * </pre>
     *
     * @param inVo 컨텐츠 목록 조회 조건 VO
     * @return 전체 건수
     */
    int getContsListCount(ContsApiInVO inVo);

    /**
     * 공통 컨텐츠 상세 정보를 조회한다.
     *
     * <pre>
     * - 리비전 번호와 게시판 ID를 기준으로 특정 버전의 컨텐츠 상세 조회
     * </pre>
     *
     * @param rvsnNo 리비전 번호
     * @param bbsId 게시판 ID
     * @return 컨텐츠 상세 정보
     */
    TbCmMContsVO getContsDetail(String rvsnNo, String bbsId);

    /**
     * 리비전 히스토리를 조회한다. (관리자 전용)
     *
     * <pre>
     * - 특정 게시판(컨텐츠)의 모든 리비전 이력 목록 조회
     * </pre>
     *
     * @param bbsId 게시판 ID
     * @return 리비전 히스토리 목록
     */
    List<TbCmMContsVO> getRevisionHistory(String bbsId);

    /**
     * 현재 공개 중인 컨텐츠를 조회한다. (사용자용)
     *
     * <pre>
     * - 사용자 화면에 표시될 현재 활성화된(Published) 컨텐츠 조회
     * </pre>
     *
     * @param bbsId 게시판 ID
     * @return 현재 공개 컨텐츠 정보
     */
    TbCmMContsVO getPublishedConts(String bbsId);

    /**
     * 공통 컨텐츠를 등록한다. (임시저장)
     *
     * <pre>
     * - 새로운 리비전 번호를 생성하여 컨텐츠 등록
     * </pre>
     *
     * @param bbsId 게시판 ID
     * @param vo 컨텐츠 등록 정보 VO
     * @return 생성된 리비전 번호 (rvsnNo)
     */
    String insertConts(String bbsId, TbCmMContsVO vo);

    /**
     * 공통 컨텐츠 정보를 수정한다.
     *
     * @param vo 컨텐츠 수정 정보 VO
     * @return 수정 결과 건수
     */
    int updateConts(TbCmMContsVO vo);

    /**
     * 컨텐츠 공개 여부를 변경한다.
     *
     * <pre>
     * - 특정 리비전의 공개 상태 전환 처리
     * </pre>
     *
     * @param rvsnNo 리비전 번호
     * @param bbsId 게시판 ID
     * @return 처리 결과 건수
     */
    int publish(String rvsnNo, String bbsId);

    /**
     * 특정 리비전을 공개 처리한다.
     *
     * <pre>
     * - 기존 공개 컨텐츠를 내리고 선택한 리비전을 사용자에게 노출
     * </pre>
     *
     * @param rvsnNo 리비전 번호
     * @param bbsId 게시판 ID
     * @return 처리 결과 건수
     */
    int publishConts(String rvsnNo, String bbsId);

    /**
     * 공통 컨텐츠를 삭제한다.
     *
     * <pre>
     * - 리비전 단위의 논리 삭제 처리
     * </pre>
     *
     * @param rvsnNo 리비전 번호
     * @param bbsId 게시판 ID
     * @return 삭제 결과 건수
     */
    int deleteConts(String rvsnNo, String bbsId);
}