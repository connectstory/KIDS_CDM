package kr.or.kids.domain.cm.research.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 과제 댓글 등록 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
public class CommentCreateRequest {

  /** 댓글 상세 내용 */
  private String cmntDtlCn;
  /** 상위 댓글 답변 일련번호 (대댓글인 경우) */
  private Long upCmntAnsSn;
}
