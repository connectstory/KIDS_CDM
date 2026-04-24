package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 통합분석결과 제외 신청 이력 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExclusionHistoryResponse {
  private Long opnnIntgRsltSn; // 의견통합결과일련번호
  private Long asmtMetaRsltSn; // 과제메타결과일련번호
  private Long asmtSn; // 과제일련번호
  private String instId; // 기관아이디
  private String instNm; // 기관명
  private String opnnIntgDmndCn; // 의견통합요청내용 (제외 사유)
  private String rgtrId; // 등록자아이디
  private String rgtrNm; // 등록자명
  private LocalDateTime regDt; // 등록일시
}
