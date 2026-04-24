package kr.or.kids.domain.cm.upload.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
@Getter
@Setter
public class PartnerCatalogRow {

  private Long uldListSn;
  private String tblSeCd;
  private String colNm;
  private String dataTypeNm;
  private String nullYn;
  private String pkYn;
  private String fkYn;
}
