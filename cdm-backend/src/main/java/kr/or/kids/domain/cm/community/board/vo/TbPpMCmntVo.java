package kr.or.kids.domain.cm.community.board.vo;

import lombok.Data;

/**
 * <pre>
 * 게시판 댓글 테이블(TB_PP_M_CMNT) VO
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
@Data
public class TbPpMCmntVo {

    /** 댓글 일련번호 */
    private String cmntSn;

    /** 게시글 일련번호 */
    private String pstSn;

    /** 댓글 내용 */
    private String cmntCn;

    /** 댓글 암호화 비밀번호 */
    private String cmntEnpswd;

    /** 사용 여부 (Y/N) */
    private String useYn;

    /** 등록자 식별자 */
    private String rgtrId;

    /** 등록일자 (YYYYMMDD) */
    private String regYmd;

    /** 등록 프로그램 식별자 */
    private String regPrgmId;

    /** 수정자 식별자 */
    private String mdfrId;

    /** 수정일자 (YYYYMMDD) */
    private String mdfcnYmd;

    /** 수정 프로그램 식별자 */
    private String mdfcnPrgmId;
}
