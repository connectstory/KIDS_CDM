package kr.or.kids.domain.cm.research.service.support;

import org.springframework.stereotype.Component;

import kr.or.kids.domain.cm.common.mapper.CommonAuthrtMapper;
import kr.or.kids.domain.cm.common.vo.MemberAndInstVO;
import kr.or.kids.domain.cm.common.vo.TbPpMEmpInfoVO;
import kr.or.kids.domain.cm.research.mapper.ResearchMapper;
import kr.or.kids.domain.cm.research.vo.ResearchAsmtDetailVO;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtPrcpVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtVO;
import kr.or.kids.global.common.CustomUserDetails;
import kr.or.kids.global.type.RoleType;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ResearchMemberResolver {

  private final CommonAuthrtMapper commonAuthrtMapper;
  private final ResearchMapper researchMapper;

  public ResearchMemberVO resolve( Long asmtSn, CustomUserDetails user ) {
    ResearchMemberVO researchMemberVO = new ResearchMemberVO();

    researchMemberVO.setUserType( user.getUserType() );
    researchMemberVO.setInstBrno( user.getInstId() );
    researchMemberVO.setInstNm( user.getInstNm() );

    if (RoleType.ADMIN.code().equals( user.getUserType() )) {
      TbPpMEmpInfoVO empInfo = commonAuthrtMapper.selectEmpInfoByEmpNo( user.getUserNo() );
      if (empInfo == null) {
        throw new IllegalArgumentException( "회원정보를 찾을 수 없습니다." );
      }

      researchMemberVO.setUserNo( empInfo.getEmpNo() );
      researchMemberVO.setUserNm( empInfo.getEmpNm() );
      researchMemberVO.setEmail( empInfo.getEncptEmpEmlNm() );
      researchMemberVO.setTel( empInfo.getEncptEmpTelno() );
      researchMemberVO.setDeptNo( empInfo.getDeptNo() );
      researchMemberVO.setMbrTypeCd( RoleType.ADMIN.code() );
    } else {
      MemberAndInstVO partnerInfo = commonAuthrtMapper.selectMemberAndInstByMbrId( user.getMbrId() );
      if (partnerInfo == null) {
        throw new IllegalArgumentException( "회원정보를 찾을 수 없습니다." );
      }

      researchMemberVO.setUserNo( partnerInfo.getMbrNo() );
      researchMemberVO.setUserNm( partnerInfo.getMbrEncptFlnm() );
      researchMemberVO.setEmail( partnerInfo.getMbrEncptEmlNm() );
      researchMemberVO.setTel( partnerInfo.getMbrEncptTelno() );
      researchMemberVO.setMbrNo( partnerInfo.getMbrNo() );
      researchMemberVO.setMbrId( partnerInfo.getMbrId() );
      researchMemberVO.setMbrEncptFlnm( partnerInfo.getMbrEncptFlnm() );
      researchMemberVO.setMbrEncptEmlNm( partnerInfo.getMbrEncptEmlNm() );
      researchMemberVO.setMbrEncptTelno( partnerInfo.getMbrEncptTelno() );
      researchMemberVO.setMbrTypeCd( partnerInfo.getMbrTypeCd() );
      researchMemberVO.setMbrJoinSttsCd( partnerInfo.getMbrJoinSttsCd() );
      researchMemberVO.setMbrJoinDt( partnerInfo.getMbrJoinDt() );
      researchMemberVO.setInstBrno( partnerInfo.getInstBrno() );
      researchMemberVO.setInstNm( partnerInfo.getInstNm() );
      researchMemberVO.setInstDelYn( partnerInfo.getInstDelYn() );
      researchMemberVO.setExprtHdofYn( partnerInfo.getExprtHdofYn() );
      researchMemberVO.setExprtAprvSttsCd( partnerInfo.getExprtAprvSttsCd() );
    }

    if (asmtSn != null) {
      ResearchAsmtDetailVO asmtRow = researchMapper.findById( asmtSn );
      if (asmtRow == null) {
        throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
      }

      TbCmMAsmtVO asmtVO = asmtRow.toTbCmMAsmtVO();
      researchMemberVO.setAsmt( asmtVO );
      researchMemberVO.setIsAdmin( true );

      TbCmMAsmtPrcpVO partner = researchMapper.findPartnerByAsmtSnAndInstId( asmtSn, researchMemberVO.getInstBrno() );
      researchMemberVO.setPartner( partner );

      if (asmtVO.getInstId().equals( researchMemberVO.getInstBrno() )) {
        researchMemberVO.setIsAdmin( true );
      } else {
        researchMemberVO.setIsAdmin( false );
      }

    }

    return researchMemberVO;
  }
}
