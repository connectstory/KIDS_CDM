package kr.or.kids.domain.cm.research.dto;

import java.util.List;

import lombok.Getter;

@Getter
public class PartnerCreateRequest {

  private List<String> asmtPrcpInsttList; // 기관아이디 목록 (사업자등록번호)
}
