package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/** 과제 댓글 목록(selectComments) 행 */
@Getter
@Setter
public class CommentRowVO {

  private Long asmtCmntSn;
  private Long asmtSn;
  private String instId;
  private String mbrNm;
  private String empNm;
  private String instNm;
  private String deptNm;
  private String cmntDtlCn;
  private Long orgnlUpCmntAnsSn;
  private Long upCmntAnsSn;
  private Long cmntAnsDepth;
  private Long cmntAnsSn;
  private String delIndctYn;
  private String delYn;
  private String rgtrId;
  private LocalDateTime regDt;
  private String mdfrId;
  private LocalDateTime mdfcnDt;
}
