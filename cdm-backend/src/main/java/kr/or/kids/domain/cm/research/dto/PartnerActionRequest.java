package kr.or.kids.domain.cm.research.dto;

import lombok.Getter;

@Getter
public class PartnerActionRequest {

  private String action; // "approve" or "delete"
  private String asmtPtcpRtrcnRsn; // 과제참여철회사유 (delete 시 필수)

  public PartnerActionRequest() {
  }
}
