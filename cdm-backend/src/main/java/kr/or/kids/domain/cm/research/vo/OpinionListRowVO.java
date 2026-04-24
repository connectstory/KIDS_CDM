package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/** 의견 목록 조회(searchOpinionBy*) 행 → 서비스에서 OpinionListResponse로 조립 */
@Getter
@Setter
public class OpinionListRowVO {

  private Long asmtSn;
  private String instId;
  private String instNm;
  private Long opnnIntgRsltSn;
  private Long asmtMetaRsltSn;
  private String rsltGroupCd;
  private String opnnIntgDmndCn;
  private String utlzAgreSeCd;
  private String rgtrId;
  private LocalDateTime regDt;
  private String mdfrNm;
  private String mdfrId;
  private LocalDateTime mdfcnDt;
  private String uldInstPrgrsSttsCd;
  private String uldTypeCd;
  private String asmtOpnnSttsCd;
}
