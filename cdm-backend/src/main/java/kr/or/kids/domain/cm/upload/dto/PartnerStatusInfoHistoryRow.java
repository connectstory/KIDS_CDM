package kr.or.kids.domain.cm.upload.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
@Getter
@Setter
public class PartnerStatusInfoHistoryRow {

  private Long pblntSn;
  private String pblntTtlNm;
  private LocalDateTime regDt;
  private String rgtrId;
  private String rgtrNm;
  private String verInfoNm;
  private String lastUpdtYmd;
  private Long updtCycleCnt;
}
