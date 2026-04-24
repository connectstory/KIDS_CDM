package kr.or.kids.domain.cm.research.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 분석 데이터셋 복사 결과: 테이블별 복사 건수.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisDatasetCopyResult {

  private String tableName;
  private long rowCount;
}
