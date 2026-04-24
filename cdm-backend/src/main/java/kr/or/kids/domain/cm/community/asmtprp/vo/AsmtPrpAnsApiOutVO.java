package kr.or.kids.domain.cm.community.asmtprp.vo;

import java.util.List;

import kr.or.kids.domain.cm.common.dto.CaFileItem;

import lombok.Data;

/**
 * <pre>
 * 과제 제안 답변 상세/목록 출력 VO
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
public class AsmtPrpAnsApiOutVO {

    /** 답변 식별자 */
    private Long ansSn;

    /** 과제 제안 식별자 */
    private Long asmtPrpSn;

    /** 답변 내용 */
    private String ansCn;

    /** 답변자 ID */
    private String ansId;

    /** 답변자 성명 (부서명 포함) */
    private String ansNm;

    /** 사용 여부 (Y/N) */
    private String useYn;

    /** 등록자 ID (사번/회원번호) */
    private String rgtrId;

    /** 등록 일시 (YYYY-MM-DD HH24:MI:SS) */
    private String regDt;

    /** 수정자 ID */
    private String mdfrId;

    /** 수정 일시 (YYYY-MM-DD HH24:MI:SS) */
    private String mdfcnDt;

    /** 첨부파일 목록 */
    private List<CaFileItem> fileList;

}