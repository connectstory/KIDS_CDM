package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * 참여기관 목록/단건 조회용 행 (Mapper). API 응답은 ResearchPartnerResponse로 변환.
 */
@Getter
@Setter
public class ResearchPartnerVO {

  private Long asmtPtcpInstSn;
  private Long asmtSn;
  private String instId;
  private String ptcpPrgrsSttsCd;
  private String asmtRqstrId;
  private LocalDateTime asmtDmndDt;
  private String asmtPtcpAgreId;
  private LocalDateTime asmtPtcpAgreDt;
  private String asmtRsltRegId;
  private LocalDateTime asmtRsltRegDt;
  private String asmtPtcpRtrcnId;
  private String asmtPtcpRtrcnMbrEncptFlnm;
  private String asmtPtcpRtrcnEmpNm;
  private String asmtPtcpRtrcnRsn;
  private LocalDateTime asmtPtcpRtrcnDt;
  private String delYn;
  private String rgtrId;
  private String mbrEncptFlnm;
  private String empNm;
  private LocalDateTime regDt;
  private String mdfrId;
  private LocalDateTime mdfcnDt;
  private String uldInstPrgrsSttsStcd;
  private String uldTypeCd;
  private String instNm;
  private String brno;
  private String utlzAgreSeCd;
  private Integer uldFileCnt;
  private Integer opnnAgreCnt;
  private Integer opnnNotUseCnt;
}
