package kr.or.kids.domain.cm.research.dto;

import lombok.Getter;

@Getter
public class AnalysisDataRequest {

  private String asmtMetaRsltCn; // 과제메타결과내용
  private String asmtMetaRsltSttsCd; // 과제메타결과상태코드
  private String rsltGroupCd; // 결과그룹코드

  public AnalysisDataRequest() {
  }

  public AnalysisDataRequest(String asmtMetaRsltCn, String asmtMetaRsltSttsCd, String rsltGroupCd) {
    this.asmtMetaRsltCn = asmtMetaRsltCn;
    this.asmtMetaRsltSttsCd = asmtMetaRsltSttsCd;
    this.rsltGroupCd = rsltGroupCd;
  }
}
