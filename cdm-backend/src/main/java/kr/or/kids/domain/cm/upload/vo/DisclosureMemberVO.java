package kr.or.kids.domain.cm.upload.vo;

import kr.or.kids.domain.cm.common.vo.ResolvedMemberVO;
import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import lombok.Getter;
import lombok.Setter;

/**
 * 공시 단위 요청 시 회원 컨텍스트 + 공시 본문 + 해당 기관의 참여(PRST) 행.
 */
@Getter
@Setter
public class DisclosureMemberVO extends ResolvedMemberVO {

  private TbCmMUldPblntVO pblnt;
  /** 현재 로그인 기관에 해당하는 TB_CM_M_ULD_PRST 행 */
  private TbCmMUldPrstVO partner;
  /** 플랫폼 관리자이거나 공시 등록자(rgtr_id)와 일치하는 경우 등 */
  private Boolean isAdmin;

  public DisclosureMemberVO() {
  }
}
