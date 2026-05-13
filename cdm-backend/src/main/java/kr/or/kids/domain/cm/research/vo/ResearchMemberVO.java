package kr.or.kids.domain.cm.research.vo;

import kr.or.kids.domain.cm.common.vo.ResolvedMemberVO;
import lombok.Getter;
import lombok.Setter;

/**
 * 연구과제(asmt) 단위 요청 시 {@link ResolvedMemberVO} + 과제·참여기관·주관 여부.
 */
@Getter
@Setter
public class ResearchMemberVO extends ResolvedMemberVO {

  private TbCmMAsmtVO asmt; // 연구과제
  private TbCmMAsmtPrcpVO partner; // 참여기관
  private Boolean isAdmin; // 연구과제 주관 기관 여부

  public ResearchMemberVO() {
  }
}
