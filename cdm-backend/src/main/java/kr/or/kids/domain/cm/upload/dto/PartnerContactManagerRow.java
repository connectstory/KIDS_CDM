package kr.or.kids.domain.cm.upload.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
@Getter
@Setter
public class PartnerContactManagerRow {

  private String instContact;
  private String instManager;
}
