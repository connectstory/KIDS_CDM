package kr.or.kids.domain.cm.research.dto;

import lombok.Getter;

@Getter
public class CloseResearchRequest {

  private String asmtClsCn; // 과제마감내용

  /** Jackson / BeanUtils 등 리플렉션용 기본 생성자 */
  public CloseResearchRequest() {
    /* intentionally empty — required for frameworks; fields set via setters or mapping */
  }
}
