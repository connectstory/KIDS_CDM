package kr.or.kids.domain.cm.upload.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 참여취소(04) 최신 이력 행의 사유·등록자 (TB_CM_E_ULD_STTS_CHG).
 */
@Getter
@Setter
public class CancelReasonMetaRow {

  private String cancelReason;
  private String rgtrId;
  /** COALESCE(회원 encpt_mbr_flnm, KIDS직원 emp_nm, rgtr_id) */
  private String rgtrNm;
  /** TO_CHAR(reg_dt, 'YYYY.MM.DD HH24:MI') */
  private String regDt;
}
