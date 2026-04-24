package kr.or.kids.domain.cm.research.dto;

import lombok.Getter;

@Getter
public class CancelResearchRequest {

  private String asmtClsCn; // 과제마감내용(취소 사유)

  public CancelResearchRequest() {
    /*
     * Jackson 등 역직렬화용 기본 생성자. 필드는 setter/바인딩으로 채움.
     */
  }
}
