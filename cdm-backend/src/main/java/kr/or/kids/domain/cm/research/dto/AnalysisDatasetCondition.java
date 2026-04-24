package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 분석 데이터셋 엑셀 Sheet1 파싱 결과 (분석 시작/종료일자, 분석 성별 concept_id).
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisDatasetCondition {

  private LocalDate analysisStartDate;
  private LocalDate analysisEndDate;
  /** OMOP gender concept_id (e.g. 8507 Male, 8532 Female) */
  private Integer genderConceptId;
}
