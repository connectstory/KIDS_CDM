package kr.or.kids.domain.cm.common.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * 직원정보 VO (tb_pp_m_emp_info)
 */
@Getter
@Setter
public class TbPpMEmpInfoVO {

  private String empNo;
  private String empNm;
  private String deptNo;
  private String jbgdNm;
  private String encptEmpTelno;
  private String encptEmpEmlNm;
  private String rgtrId;
  private LocalDateTime regDt;
  private String mdfrId;
  private LocalDateTime mdfcnDt;
}
