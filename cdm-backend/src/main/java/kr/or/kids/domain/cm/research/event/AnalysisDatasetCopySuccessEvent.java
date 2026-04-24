package kr.or.kids.domain.cm.research.event;

import org.springframework.context.ApplicationEvent;

/**
 * 분석 데이터셋 복사가 성공적으로 완료되었을 때 발행하는 이벤트. 리스너에서 과제를 진행 상태로 변경하는 등 후속 처리에 사용.
 */
public class AnalysisDatasetCopySuccessEvent extends ApplicationEvent {

  private final Long asmtSn;
  private final String userNo;

  public AnalysisDatasetCopySuccessEvent(Object source, Long asmtSn, String userNo) {
    super( source );
    this.asmtSn = asmtSn;
    this.userNo = userNo;
  }

  public Long getAsmtSn() {
    return asmtSn;
  }

  public String getUserNo() {
    return userNo;
  }
}
