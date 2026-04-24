package kr.or.kids.domain.cm.upload.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
@Getter
@Setter
public class PartnerPeriodScaleRow {

  private Long uldPrdSn;
  private String trsfSeCd;
  private String tblSeCd;
  private Long tnocs;
  private String bgngYmd;
  private String endYmd;
}
