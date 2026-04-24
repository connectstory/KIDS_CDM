package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * 과제 목록 조회(searchResearchList / searchResearchListByPartner) 행. 서비스에서 ResearchListResponse로 조립.
 */
@Getter
@Setter
public class ResearchListRowVO {

  private Long asmtSn;
  private String asmtId;
  private String asmtPrgrsSttsCd;
  private String asmtNm;
  private LocalDateTime flfmtBgngDt;
  private LocalDateTime flfmtEndDt;
  private String instId;
  private String instNm;
  private String deptNm;
  private String rgtrId;
  private String delYn;
  private LocalDateTime regDt;
  private String mdfrId;
  private LocalDateTime mdfcnDt;
  private Integer metaAnalysisCount;
  /** 참여기관 목록에서만 채움 */
  private String ptcpPrgrsSttsCd;
  /** 참여기관 목록에서만 채움 */
  private String uldTypeCd;
}
