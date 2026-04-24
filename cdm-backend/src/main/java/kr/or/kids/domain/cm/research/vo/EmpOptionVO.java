package kr.or.kids.domain.cm.research.vo;

import lombok.Getter;
import lombok.Setter;

/** 담당자 드롭다운 직원 행(selectEmpInfoByDeptNos) */
@Getter
@Setter
public class EmpOptionVO {

  private String empNo;
  private String empNm;
  private String deptNo;
}
