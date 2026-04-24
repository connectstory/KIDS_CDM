package kr.or.kids.domain.cm.community.conts.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.kids.domain.cm.community.conts.vo.ContsApiInVO;
import kr.or.kids.domain.cm.community.conts.vo.TbCmMContsVO;

/**
 * <pre>
 * 공통 컨텐츠 관리 매퍼 인터페이스
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
public interface ContsMapper {

    /**
     * 공통 컨텐츠 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 필터링 및 페이징 처리된 컨텐츠 목록 반환
     * </pre>
     *
     * @param inVo 조회 조건 VO
     * @return 컨텐츠 목록
     */
    List<TbCmMContsVO> selectContsList(ContsApiInVO inVo);

    /**
     * 공통 컨텐츠 전체 건수를 조회한다.
     *
     * <pre>
     * - 페이징 계산을 위한 필터링된 전체 데이터 개수 반환
     * </pre>
     *
     * @param inVo 조회 조건 VO
     * @return 전체 건수
     */
    int selectContsListCount(ContsApiInVO inVo);

    /**
     * 공통 컨텐츠 상세 정보를 조회한다.
     *
     * <pre>
     * - 리비전 번호와 게시판 ID를 기준으로 단건 상세 조회
     * </pre>
     *
     * @param rvsnNo 리비전 번호
     * @param bbsId 게시판 ID
     * @return 컨텐츠 상세 정보
     */
    TbCmMContsVO selectContsDetail(@Param("rvsnNo") String rvsnNo, @Param("bbsId") String bbsId);

    /**
     * 리비전 히스토리 목록을 조회한다.
     *
     * <pre>
     * - 관리자 화면용: 해당 게시판의 모든 버전 이력 조회
     * </pre>
     *
     * @param bbsId 게시판 ID
     * @return 리비전 이력 목록
     */
    List<TbCmMContsVO> selectRevisionHistory(@Param("bbsId") String bbsId);

    /**
     * 현재 공개 중인 컨텐츠를 조회한다.
     *
     * <pre>
     * - 사용자 화면용: 현재 활성화(Published)된 버전 단건 조회
     * </pre>
     *
     * @param bbsId 게시판 ID
     * @return 현재 공개 컨텐츠 정보
     */
    TbCmMContsVO selectPublishedConts(@Param("bbsId") String bbsId);

    /**
     * 공통 컨텐츠를 등록한다.
     *
     * <pre>
     * - 신규 리비전 생성 및 임시저장 상태로 등록
     * </pre>
     *
     * @param vo 컨텐츠 등록 정보 VO
     * @return 등록된 행 수
     */
    int insertConts(TbCmMContsVO vo);

    /**
     * 공통 컨텐츠 정보를 수정한다.
     *
     * @param vo 컨텐츠 수정 정보 VO
     * @return 수정된 행 수
     */
    int updateConts(TbCmMContsVO vo);

    /**
     * 기존 공개 컨텐츠를 비공개 처리한다.
     *
     * <pre>
     * - 새로운 버전 공개 전, 기존에 공개된 데이터를 비활성화
     * </pre>
     *
     * @param bbsId 게시판 ID
     * @return 처리된 행 수
     */
    int clearPublished(@Param("bbsId") String bbsId);

    /**
     * 특정 리비전을 공개 상태로 전환한다.
     *
     * <pre>
     * - 선택한 버전을 사용자 화면에 노출하도록 설정
     * </pre>
     *
     * @param rvsnNo 리비전 번호
     * @param bbsId 게시판 ID
     * @return 처리된 행 수
     */
    int setPublished(@Param("rvsnNo") String rvsnNo, @Param("bbsId") String bbsId);

    /**
     * 특정 리비전 공개를 처리한다. (이력 관리용)
     *
     * @param rvsnNo 리비전 번호
     * @param bbsId 게시판 ID
     * @return 처리된 행 수
     */
    int publishConts(@Param("rvsnNo") String rvsnNo, @Param("bbsId") String bbsId);

    /**
     * 공통 컨텐츠를 삭제한다.
     *
     * <pre>
     * - 리비전 식별자를 기준으로 데이터 논리 삭제 처리
     * </pre>
     *
     * @param rvsnNo 리비전 번호
     * @param bbsId 게시판 ID
     * @return 처리된 행 수
     */
    int deleteConts(@Param("rvsnNo") String rvsnNo, @Param("bbsId") String bbsId);

    /**
     * 다음 리비전 번호를 조회한다.
     *
     * <pre>
     * - 버전 관리를 위한 시퀀스 성격의 번호 생성
     * </pre>
     *
     * @param prefix 리비전 접두사
     * @return 신규 리비전 번호
     */
    String selectNextRevision(@Param("prefix") String prefix);
}