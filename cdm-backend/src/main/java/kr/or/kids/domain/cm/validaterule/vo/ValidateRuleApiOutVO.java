package kr.or.kids.domain.cm.validaterule.vo;

import lombok.Data;

/**
 * <pre>
 * 검증 규칙 상세/목록 출력 VO
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
public class ValidateRuleApiOutVO {

    /** 검증 규칙 일련번호 (PK) */
    private Long vrfcSn;

    /** 표준 구분 코드 (Sentinel / OMOP 등) */
    private String stdSeCd;

    /** 레벨 순번 */
    private Long levlSeq;

    /** 검증 테이블명 */
    private String vrfcTblNm;

    /** 검증 컬럼명 */
    private String vrfcColNm;

    /** 검증 규칙명 */
    private String vrfcRulNm;

    /** 참조명 */
    private String rfrncNm;

    /** 참조 상세명 */
    private String rfrncDtlNm;

    /** 필수 여부 (Y/N) */
    private String esntlYn;

    /** 참조 테이블명 */
    private String rfrncTblNm;

    /** 외래키명 */
    private String fkNm;

    /** 참조 컬럼명 */
    private String rfrncColNm;

    /** 표준 용어 식별자 */
    private String stdTrmId;

    /** 규칙 적용명 */
    private String rulAplcnNm;

    /** 단위명 */
    private String unitNm;

    /** 범위 순번명 */
    private String scpSeqNm;

    /** 허용 기준명 */
    private String prmCrtrNm;

    /** 변수 내용 */
    private String vrblCn;

    /** 변수 상세 내용 */
    private String vrblDtlCn;

    /** 변수 결과 내용 */
    private String vrblRsltCn;

    /** 등록자 식별자 */
    private String rgtrId;

    /** 등록 일시 (YYYY-MM-DD) */
    private String regDt;

    /** 수정자 식별자 */
    private String mdfrId;

    /** 수정 일시 (YYYY-MM-DD) */
    private String mdfcnDt;
}
