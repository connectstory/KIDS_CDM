package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

/* 과제댓글기본 */
public class TbCmMAsmtCmntVO {

  private Long asmtCmntSn;
  private Long asmtSn;
  private String instId;
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
  private String bbsId;
}
