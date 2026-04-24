package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * 기관 과제 관리 (TB_PP_M_INST_TASK)
 */
@Getter
@Setter
public class TbPpMInstTaskVO {

  /** 사업자 과제 관리 번호 (PK, BZMN_TASK_MNG_NO) */
  private String bzmnTaskMngNo;

  /** 사업자등록번호 (BRNO) */
  private String brno;

  /** 과제 구분 코드 (TASK_SE_CD) */
  private String taskSeCd;

  /** 담당 전문가 번호 (TKCG_EXPRT_NO) */
  private String tkcgExprtNo;

  /** 사용 여부 (USE_YN) */
  private String useYn;

  private String rgtrId;
  private LocalDateTime regDt;
  private String mdfrId;
  private LocalDateTime mdfcnDt;
}
