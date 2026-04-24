package kr.or.kids.domain.cm.upload.dto;

import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
@Getter
@Setter
@NoArgsConstructor
public class DisclosurePartnerRequest {
  private List<String> instIds; 
}
