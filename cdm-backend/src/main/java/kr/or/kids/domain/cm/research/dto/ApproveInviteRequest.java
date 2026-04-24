package kr.or.kids.domain.cm.research.dto;

import lombok.Getter;

@Getter
public class ApproveInviteRequest {

  /** Jackson / 빈 요청 바디 대응용 기본 생성자 (필드 없음). */
  public ApproveInviteRequest() {
    /*
     * 역직렬화·프레임워크용 무인자 생성자. 별도 초기화 없음.
     */
  }
}
