package kr.or.kids.domain.cm.research.dto;

import lombok.Getter;

@Getter
public class CancelInviteRequest {

  private String asmtPtcpRtrcnRsn; // 과제참여철회사유

  public CancelInviteRequest() {
    /*
     * Jackson 등 역직렬화용 기본 생성자. 필드는 setter/바인딩으로 채움.
     */
  }
}
