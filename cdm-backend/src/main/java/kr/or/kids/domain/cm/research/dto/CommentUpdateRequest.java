package kr.or.kids.domain.cm.research.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 과제 댓글 수정 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
public class CommentUpdateRequest {

  /** 댓글 상세 내용 */
  private String cmntDtlCn;
}
