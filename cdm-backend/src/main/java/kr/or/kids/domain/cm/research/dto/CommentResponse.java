package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDateTime;

import kr.or.kids.domain.cm.research.vo.CommentRowVO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 과제 댓글 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {

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

  public static CommentResponse from( CommentRowVO r ) {
    return new CommentResponse( r.getAsmtCmntSn(), r.getAsmtSn(), r.getInstId(), r.getMbrNm(), r.getEmpNm(), r.getInstNm(), r.getDeptNm(), r.getCmntDtlCn(), r.getOrgnlUpCmntAnsSn(), r.getUpCmntAnsSn(), r.getCmntAnsDepth(), r.getCmntAnsSn(), r.getDelIndctYn(), r.getDelYn(), r.getRgtrId(), r.getRegDt(), r.getMdfrId(), r.getMdfcnDt() );
  }
}
