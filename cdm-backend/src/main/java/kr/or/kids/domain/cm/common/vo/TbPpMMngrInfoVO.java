package kr.or.kids.domain.cm.common.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * 관리자 정보 VO (kids_own.tb_pp_m_mngr_info)
 */
@Getter
@Setter
public class TbPpMMngrInfoVO {

  private String empNo;
  private String encptMngrPswd;
  private String tmprPswdYn;
  private Integer pswdErrNmtm;
  private String encptBfrPswd;
  private String rgtrId;
  private LocalDateTime regDt;
  private String mdfrId;
  private LocalDateTime mdfcnDt;
}
