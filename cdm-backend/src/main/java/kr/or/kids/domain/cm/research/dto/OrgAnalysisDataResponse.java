package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDateTime;
import java.util.List;

import kr.or.kids.domain.cm.research.vo.OrgPartnerLatestMetaVO;
import kr.or.kids.domain.cm.research.vo.TbCmEOpnnVO;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Non-CDM 참여기관 + 최신 분석 데이터 응답 DTO 기관 정보와 해당 기관의 최신 분석 데이터(rsltGroupCd="03")를 함께 담는 DTO
 */
@Getter
@Setter
@NoArgsConstructor
public class OrgAnalysisDataResponse {

  // 참여기관 정보
  private Long asmtPtcpInstSn; // 참여기관일련번호
  private Long asmtSn; // 과제일련번호
  private String instId; // 기관아이디
  private String instNm; // 기관명
  private String uldTypeCd; // 업로드유형코드

  // 최신 분석 데이터 정보
  private Long asmtMetaRsltSn; // 과제메타결과일련번호
  private String asmtMetaRsltCn; // 과제메타결과내용
  private String asmtMetaRsltSttsCd; // 과제메타결과상태코드
  private String rsltGroupCd; // 결과그룹코드
  private LocalDateTime regDt; // 등록일자

  // 의견 목록
  private List<TbCmEOpnnVO> opinionList;

  public static OrgAnalysisDataResponse fromPartnerRow( OrgPartnerLatestMetaVO v ) {
    return new OrgAnalysisDataResponse( v.getAsmtPtcpInstSn(), v.getAsmtSn(), v.getInstId(), v.getInstNm(), v.getUldTypeCd(), v.getAsmtMetaRsltSn(), v.getAsmtMetaRsltCn(), v.getAsmtMetaRsltSttsCd(), v.getRsltGroupCd(), v.getRegDt(), null );
  }

  public OrgAnalysisDataResponse(Long asmtPtcpInstSn, Long asmtSn, String instId, String instNm, String uldTypeCd, Long asmtMetaRsltSn, String asmtMetaRsltCn, String asmtMetaRsltSttsCd, String rsltGroupCd, LocalDateTime regDt, List<TbCmEOpnnVO> opinionList) {
    this.asmtPtcpInstSn = asmtPtcpInstSn;
    this.asmtSn = asmtSn;
    this.instId = instId;
    this.instNm = instNm;
    this.uldTypeCd = uldTypeCd;
    this.asmtMetaRsltSn = asmtMetaRsltSn;
    this.asmtMetaRsltCn = asmtMetaRsltCn;
    this.asmtMetaRsltSttsCd = asmtMetaRsltSttsCd;
    this.rsltGroupCd = rsltGroupCd;
    this.regDt = regDt;
    this.opinionList = opinionList;
  }
}
