package kr.or.kids.domain.cm.research.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 연구과제 담당자 등록 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AsmtPersonCreateRequest {

  private String personEmpNo;
}
