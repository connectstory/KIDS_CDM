package kr.or.kids.domain.cm.prstInfo.vo;

import lombok.Getter;
import lombok.Setter;

/**
 * CDM 테이블별 기간&규모 (tb_cm_d_uld_prd_scl) API 입력 VO
 */
@Getter
@Setter
public class CdmUploadPeriodScaleApiInVO {

    /** 업로드 기간 일련번호 */
    private Long uldPrdSn;

    /** 공시 일련번호 */
    private Long pblntSn;

    /** 참여기관 일련번호 */
    private Long ptcpInstSn;

    /** 전송 구분 코드 (Sentinel / OMOP 등) */
    private String trsfSeCd;

    /** 테이블 구분 코드 */
    private String tblSeCd;
}