package kr.or.kids.domain.cm.community.board.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.kids.domain.cm.community.board.vo.BoardApiInVO;
import kr.or.kids.domain.cm.community.board.vo.BoardApiOutVO;
import kr.or.kids.domain.cm.community.board.vo.TbPpMPstVo;
import kr.or.kids.domain.cm.research.vo.CommentRowVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtCmntVO;

/**
 * <pre>
 * 일반 게시판 매퍼 인터페이스
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
public interface BoardApiMapper {

    /**
     * 게시글 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 필터링 및 페이징 처리된 목록 반환
     * </pre>
     *
     * @param inVo 조회 조건 VO
     * @return 게시글 목록
     */
    List<BoardApiOutVO> selectBoardList(BoardApiInVO inVo);

    /**
     * 게시글 전체 건수를 조회한다.
     *
     * <pre>
     * - 페이징 계산을 위한 필터링된 전체 행 수 반환
     * </pre>
     *
     * @param inVo 조회 조건 VO
     * @return 전체 건수
     */
    int selectBoardListCount(BoardApiInVO inVo);

    /**
     * 게시글 상세 정보를 조회한다.
     *
     * <pre>
     * - 게시글 식별자(pstSn)를 기준으로 단건 조회
     * </pre>
     *
     * @param pstSn 게시글 식별자
     * @return 게시글 상세 정보
     */
    BoardApiOutVO selectBoardDetail(long pstSn);

    /**
     * 게시글을 등록한다.
     *
     * @param inVo 등록 정보 VO
     * @return 등록된 행 수
     */
    int insertBoard(TbPpMPstVo inVo);

    /**
     * 게시글 정보를 수정한다.
     *
     * @param inVo 수정 정보 VO
     * @return 수정된 행 수
     */
    int updateBoard(TbPpMPstVo inVo);

    /**
     * 게시글을 삭제한다.
     *
     * @param pstSn 게시글 식별자
     * @return 삭제된 행 수
     */
    int deleteBoard(Long pstSn);

    /**
     * 게시판 조회수를 증가시킨다.
     *
     * <pre>
     * - 게시글 상세 조회 시 호출되어 조회수(pst_inq_cnt) 1 증가
     * </pre>
     *
     * @param pstSn 게시글 식별자
     * @return 수정된 행 수
     */
    int updateBoardViewCount(Long pstSn);

    // ========================================================
    // 게시판 댓글 CRUD
    // ========================================================

    /**
     * 댓글 목록을 조회한다.
     *
     * <pre>
     * - 게시글 식별자 및 게시판 ID를 기준으로 댓글 리스트 조회
     * </pre>
     *
     * @param pstSn 게시글 식별자
     * @param bbsId 게시판 ID
     * @return 댓글 목록
     */
    List<CommentRowVO> selectBoardComments(@Param("pstSn") Long pstSn, @Param("bbsId") String bbsId);

    /**
     * 댓글 단건 정보를 조회한다.
     *
     * <pre>
     * - 수정/삭제 전 권한 확인 및 데이터 검증용
     * </pre>
     *
     * @param asmtCmntSn 댓글 식별자
     * @param pstSn 게시글 식별자
     * @param bbsId 게시판 ID
     * @return 댓글 정보 VO
     */
    TbCmMAsmtCmntVO findBoardCommentById(@Param("asmtCmntSn") Long asmtCmntSn, @Param("pstSn") Long pstSn, @Param("bbsId") String bbsId);

    /**
     * 댓글을 등록한다.
     *
     * @param vo 댓글 등록 정보 VO
     */
    void insertBoardComment(TbCmMAsmtCmntVO vo);

    /**
     * 댓글 정보를 수정한다.
     *
     * @param vo 댓글 수정 정보 VO
     */
    void updateBoardComment(TbCmMAsmtCmntVO vo);

    /**
     * 댓글을 삭제 처리한다.
     *
     * <pre>
     * - 실제 삭제가 아닌 상태값 변경을 통한 논리 삭제 처리
     * </pre>
     *
     * @param asmtCmntSn 댓글 식별자
     * @param mdfrId 수정자(삭제자) ID
     */
    void deleteBoardComment(@Param("asmtCmntSn") Long asmtCmntSn, @Param("mdfrId") String mdfrId);

    /**
     * 동일 스레드 내 다음 댓글 순번을 조회한다.
     *
     * <pre>
     * - 계층형 댓글(답글) 구조를 위한 정렬 순서 계산
     * </pre>
     *
     * @param pstSn 게시글 식별자
     * @param bbsId 게시판 ID
     * @param orgnlUpCmntAnsSn 원본 상위 댓글 순번
     * @return 다음 댓글 순번
     */
    Long nextBoardCmntAnsSn(@Param("pstSn") Long pstSn, @Param("bbsId") String bbsId, @Param("orgnlUpCmntAnsSn") Long orgnlUpCmntAnsSn);
}