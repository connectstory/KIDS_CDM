package kr.or.kids.domain.cm.research.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 분석 데이터셋 복사 비동기 작업 응답 (202 Accepted 또는 상태 조회).
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisDatasetTaskResponse {

  private String taskId;
  /** RUNNING, SUCCESS, FAILED */
  private String status;
  private String message;
  /** 완료 시 테이블별 복사 건수 */
  private List<AnalysisDatasetCopyResult> copyResults;
}
