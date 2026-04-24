package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/** Non-CDM 참여기관 + 최신 분석 메타(searchNonCdmPartnersWithLatestAnalysis) 행 */
@Getter
@Setter
public class OrgPartnerLatestMetaVO {

  private Long asmtPtcpInstSn;
  private Long asmtSn;
  private String instId;
  private String instNm;
  private String uldTypeCd;
  private Long asmtMetaRsltSn;
  private String asmtMetaRsltCn;
  private String asmtMetaRsltSttsCd;
  private String rsltGroupCd;
  private LocalDateTime regDt;
}
