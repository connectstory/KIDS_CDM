package kr.or.kids.domain.cm.research.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 분석 데이터셋 엑셀 Sheet2 한 행: domain(영문) + concept_id.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class DomainConceptDto {

  /** 영문 도메인 (Condition, Drug, Procedure, Measurement, Observation 등) */
  private String domain;
  private Integer conceptId;
}
