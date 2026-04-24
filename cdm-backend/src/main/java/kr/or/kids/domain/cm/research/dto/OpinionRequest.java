package kr.or.kids.domain.cm.research.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OpinionRequest {

  private String opnnIntgDmndCn; // 의견통합요청내용
  private String utlzAgreSeCd; // 의견상태구분코드
  /** 연구결과 활용동의 상태코드 (tb_cm_e_opnn.asmt_opnn_stts_cd) */
  private String asmtOpnnSttsCd;

  public OpinionRequest() {
  }

  public OpinionRequest(String opnnIntgDmndCn, String utlzAgreSeCd) {
    this.opnnIntgDmndCn = opnnIntgDmndCn;
    this.utlzAgreSeCd = utlzAgreSeCd;
  }
}
