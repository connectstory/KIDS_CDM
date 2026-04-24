package kr.or.kids.domain.cm.research.dto;

import kr.or.kids.domain.cm.research.vo.AsmtPersonRowVO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 연구과제 담당자 목록 응답 DTO (tb_cm_m_asmt_person + emp_nm, dept_no 조인)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AsmtPersonResponse {

  private Long personSn;
  private String empNo;
  private String empNm;
  private String deptNo;

  public static AsmtPersonResponse from( AsmtPersonRowVO r ) {
    return new AsmtPersonResponse( r.getPersonSn(), r.getEmpNo(), r.getEmpNm(), r.getDeptNo() );
  }
}
