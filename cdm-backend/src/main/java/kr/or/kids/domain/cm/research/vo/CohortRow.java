package kr.or.kids.domain.cm.research.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Cohort 조회 결과: person_id, inst_task_sn, patid (Sentinel 복사용, person_source_value) */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CohortRow {

  private Long personId;
  private String instTaskSn;
  private String patid;
}
