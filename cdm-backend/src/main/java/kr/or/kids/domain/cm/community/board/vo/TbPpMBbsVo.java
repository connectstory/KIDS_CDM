package kr.or.kids.domain.cm.community.board.vo;

import lombok.Data;

/**
 * <pre>
 * 게시판 마스터 테이블(TB_PP_M_BBS) VO
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
public class TbPpMBbsVo {

    /** 게시판 식별자 */
    private String bbsId;

    /** 게시판명 */
    private String bbsNm;

    /** 게시판 속성 */
    private String bbsAtrb;

    /** 게시판 설명 */
    private String bbsExpln;

    /** 게시판 요약 */
    private String bbsSmry;

    /** 댓글 사용 여부 (Y/N) */
    private String cmntUseYn;

    /** 파일 첨부 여부 (Y/N) */
    private String fileAtchYn;

    /** 첨부 가능 파일 수 */
    private String atchPsbltyFileCnt;

    /** 언어 구분 코드 */
    private String langSeCd;

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
