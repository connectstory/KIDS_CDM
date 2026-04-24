package kr.or.kids.domain.cm.research.dto;

import kr.or.kids.domain.cm.common.dto.PageableRequest;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResearchSearchRequest extends PageableRequest {
  private String progressStatus; // 과제진행상태코드
  private String searchType; // 검색 타입: "title", "content", "both"
}
