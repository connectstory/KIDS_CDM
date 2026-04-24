package kr.or.kids.domain.cm.upload.dto;

import lombok.Data;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
@Data
public class PartnerPblntPtcpKey {

  private Long pblntSn;
  private Long ptcpInstSn;
}
