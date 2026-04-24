package kr.or.kids.domain.cm.research.dto;

import kr.or.kids.domain.cm.research.vo.EmpOptionVO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 담당자 드롭다운용 직원 옵션 DTO (tb_pp_m_emp_info)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmpOptionResponse {

  private String empNo;
  private String empNm;
  private String deptNo;

  public static EmpOptionResponse from( EmpOptionVO v ) {
    return new EmpOptionResponse( v.getEmpNo(), v.getEmpNm(), v.getDeptNo() );
  }
}
