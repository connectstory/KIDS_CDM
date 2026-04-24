package kr.or.kids.domain.cm.research.vo;

import lombok.Getter;
import lombok.Setter;

/** 연구과제 담당자 목록(selectAsmtPersonList) 행 */
@Getter
@Setter
public class AsmtPersonRowVO {

  private Long personSn;
  private String empNo;
  private String empNm;
  private String deptNo;
}
