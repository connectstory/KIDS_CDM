package kr.or.kids.domain.cm.common.vo;

import lombok.Getter;
import lombok.Setter;

/**
 * 연구과제 담당자 설정 VO (tb_cm_m_asmt_rsch_pic)
 */
@Getter
@Setter
public class TbCmMAsmtPersonVO {

  /** 담당자일련번호 (asmt_rsch_pic_sn) */
  private Long asmtUserPicSn;

  /** 담당자 사번 (tb_pp_m_emp_info.emp_no와 조인) */
  private String empNo;

  /** 등록자 ID */
  private String rgtrId;

  /** 수정자 ID */
  private String mdfrId;
}
