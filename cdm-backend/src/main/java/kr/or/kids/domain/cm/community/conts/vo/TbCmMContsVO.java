package kr.or.kids.domain.cm.community.conts.vo;

import java.time.LocalDateTime;

import lombok.Data;

/**
 * <pre>
 * 공통 컨텐츠 테이블(TB_CM_M_CONTS) VO
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
public class TbCmMContsVO {

    /** 리비전 번호 (PK) */
    private String rvsnNo;

    /** 게시판 식별자 */
    private String bbsId;

    /** 공개 여부 (Y: 공개, N: 비공개) */
    private String rlsYn;

    /** 컨텐츠 내용 */
    private String contsCn;

    /** 삭제 여부 (Y: 삭제, N: 사용중) */
    private String delYn;

    /** 등록자 식별자 */
    private String rgtrId;

    /** 등록 일시 */
    private LocalDateTime regDt;

    /** 등록 프로그램 식별자 */
    private String regPrgmId;

    /** 수정자 식별자 */
    private String mdfrId;

    /** 수정 일시 */
    private LocalDateTime mdfcnDt;

    /** 수정 프로그램 식별자 */
    private String mdfcnPrgmId;
}
