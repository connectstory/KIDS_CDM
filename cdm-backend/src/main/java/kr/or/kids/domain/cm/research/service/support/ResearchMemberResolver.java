package kr.or.kids.domain.cm.research.service.support;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import kr.or.kids.domain.cm.common.service.MemberResolver;
import kr.or.kids.domain.cm.common.vo.ResolvedMemberVO;
import kr.or.kids.domain.cm.research.mapper.ResearchMapper;
import kr.or.kids.domain.cm.research.vo.ResearchAsmtDetailVO;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtPrcpVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtVO;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ResearchMemberResolver {

  private final MemberResolver memberResolver;
  private final ResearchMapper researchMapper;

  public ResearchMemberVO resolve( Long asmtSn, CustomUserDetails user ) {
    ResearchMemberVO vo = new ResearchMemberVO();
    ResolvedMemberVO base = memberResolver.resolveUser( user );
    BeanUtils.copyProperties( base, vo );

    if (asmtSn == null) {
      return vo;
    }

    ResearchAsmtDetailVO asmtRow = researchMapper.findById( asmtSn );
    if (asmtRow == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
    }

    TbCmMAsmtVO asmtVO = asmtRow.toTbCmMAsmtVO();
    vo.setAsmt( asmtVO );

    TbCmMAsmtPrcpVO partner = researchMapper.findPartnerByAsmtSnAndInstId( asmtSn, vo.getInstBrno() );
    vo.setPartner( partner );

    String hostInstId = asmtVO.getInstId();
    boolean hostMatchesUserInst = hostInstId != null && hostInstId.equals( vo.getInstBrno() );
    vo.setIsAdmin( hostMatchesUserInst );

    return vo;
  }
}
