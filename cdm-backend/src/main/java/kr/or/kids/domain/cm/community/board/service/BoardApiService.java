package kr.or.kids.domain.cm.community.board.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.community.board.vo.BoardApiInVO;
import kr.or.kids.domain.cm.community.board.vo.BoardApiOutVO;
import kr.or.kids.domain.cm.community.board.vo.TbPpMPstVo;
import kr.or.kids.domain.cm.research.dto.CommentCreateRequest;
import kr.or.kids.domain.cm.research.dto.CommentResponse;
import kr.or.kids.domain.cm.research.dto.CommentUpdateRequest;

/**
 * <pre>
 * 일반 게시판 서비스 인터페이스
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
public interface BoardApiService {

    /**
     * 게시글 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 및 페이징 처리가 포함된 게시글 목록 조회
     * - 게시판 ID(bbsId)에 따른 작성자 정보 변환 처리 포함
     * </pre>
     *
     * @param inVo 게시글 목록 조회 조건 VO
     * @return 게시글 목록
     */
    List<BoardApiOutVO> getList(BoardApiInVO inVo);

    /**
     * 게시글 전체 건수를 조회한다.
     *
     * <pre>
     * - 페이징 처리를 위한 전체 데이터 개수 조회
     * </pre>
     *
     * @param inVo 게시글 목록 조회 조건 VO
     * @return 전체 건수
     */
    int getListCount(BoardApiInVO inVo);

    /**
     * 게시글 상세 정보를 조회한다.
     *
     * <pre>
     * - 게시글 단건 정보 및 연결된 첨부파일 목록 조회
     * </pre>
     *
     * @param inVo 게시글 상세 조회 조건 VO
     * @return 게시글 상세 정보
     */
    BoardApiOutVO getDetail(BoardApiInVO inVo);

    /**
     * 게시글을 등록한다.
     *
     * <pre>
     * - 게시글 기본 정보 및 첨부파일 등록 처리
     * </pre>
     *
     * @param inVo 게시글 등록 정보 VO (파일 리스트 포함)
     * @return 등록 결과 건수
     */
    int insertBoard(TbPpMPstVo inVo);

    /**
     * 게시글 정보를 수정한다.
     *
     * <pre>
     * - 게시글 내용 수정 및 기존 파일 삭제, 신규 파일 업로드 처리
     * </pre>
     *
     * @param inVo 게시글 수정 정보 VO
     * @param deleteFileIds 삭제 대상 파일 ID 목록
     * @param files 신규 추가 파일 목록
     * @return 수정 결과 건수
     */
    int updateBoard(TbPpMPstVo inVo, List<String> deleteFileIds, List<MultipartFile> files);

    /**
     * 게시글을 삭제한다.
     *
     * <pre>
     * - 게시글 정보 및 연관된 모든 첨부파일 그룹 삭제 처리
     * </pre>
     *
     * @param inVo 게시글 삭제 정보 VO (pstSn 포함)
     * @return 삭제 결과 건수
     */
    int deleteBoard(TbPpMPstVo inVo);

    /**
     * 게시판 조회수를 증가시킨다.
     *
     * <pre>
     * - 게시글 상세 조회 시 조회수(pst_inq_cnt) 1 증가
     * </pre>
     *
     * @param pstSn 게시글 식별자
     * @return 수정 결과 건수
     */
    int increaseViewCount(long pstSn);

    // ========================================================
    // 댓글 CRUD
    // ========================================================

    /**
     * 댓글 목록을 조회한다.
     *
     * <pre>
     * - 게시글 식별자 및 게시판 ID를 기준으로 댓글 리스트 조회 및 이름 복호화
     * </pre>
     *
     * @param pstSn 게시글 식별자
     * @param bbsId 게시판 ID
     * @return 댓글 목록 DTO 리스트
     */
    List<CommentResponse> searchComments(Long pstSn, String bbsId);

    /**
     * 댓글을 등록한다.
     *
     * <pre>
     * - 일반 댓글 또는 대댓글(계층형) 등록 처리
     * </pre>
     *
     * @param pstSn 게시글 식별자
     * @param bbsId 게시판 ID
     * @param userNo 등록자 사용자 번호
     * @param instId 등록자 기관 ID
     * @param request 댓글 등록 요청 정보 DTO
     * @return 생성된 댓글 정보 DTO
     */
    CommentResponse createComment(Long pstSn, String bbsId, String userNo, String instId, CommentCreateRequest request);

    /**
     * 댓글을 수정한다.
     *
     * <pre>
     * - 작성자 본인 확인 후 댓글 내용 수정
     * </pre>
     *
     * @param pstSn 게시글 식별자
     * @param bbsId 게시판 ID
     * @param asmtCmntSn 댓글 식별자
     * @param userNo 수정 시도자 사용자 번호
     * @param request 댓글 수정 요청 정보 DTO
     */
    void updateComment(Long pstSn, String bbsId, Long asmtCmntSn, String userNo, CommentUpdateRequest request);

    /**
     * 댓글을 삭제한다.
     *
     * <pre>
     * - 작성자 본인 확인 후 댓글 논리 삭제 처리
     * </pre>
     *
     * @param pstSn 게시글 식별자
     * @param bbsId 게시판 ID
     * @param asmtCmntSn 댓글 식별자
     * @param userNo 삭제 시도자 사용자 번호
     */
    void deleteComment(Long pstSn, String bbsId, Long asmtCmntSn, String userNo);
}