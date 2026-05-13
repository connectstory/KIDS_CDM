package kr.or.kids.domain.cm.common.service;

import org.springframework.stereotype.Component;

import kr.or.kids.domain.cm.common.mapper.CommonAuthrtMapper;
import kr.or.kids.domain.cm.common.vo.MemberAndInstVO;
import kr.or.kids.domain.cm.common.vo.ResolvedMemberVO;
import kr.or.kids.domain.cm.common.vo.TbPpMEmpInfoVO;
import kr.or.kids.global.common.CustomUserDetails;
import kr.or.kids.global.type.RoleType;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class MemberResolver {

  private final CommonAuthrtMapper commonAuthrtMapper;

  public ResolvedMemberVO resolveUser( CustomUserDetails user ) {
    ResolvedMemberVO vo = new ResolvedMemberVO();

    vo.setUserType( user.getUserType() );
    vo.setInstBrno( user.getInstId() );
    vo.setInstNm( user.getInstNm() );

    if (RoleType.ADMIN.code().equals( user.getUserType() )) {
      TbPpMEmpInfoVO empInfo = commonAuthrtMapper.selectEmpInfoByEmpNo( user.getUserNo() );
      if (empInfo == null) {
        throw new IllegalArgumentException( "회원정보를 찾을 수 없습니다." );
      }

      vo.setUserNo( empInfo.getEmpNo() );
      vo.setUserNm( empInfo.getEmpNm() );
      vo.setEmail( empInfo.getEncptEmpEmlNm() );
      vo.setTel( empInfo.getEncptEmpTelno() );
      vo.setDeptNo( empInfo.getDeptNo() );
      vo.setMbrTypeCd( RoleType.ADMIN.code() );
    } else {
      MemberAndInstVO partnerInfo = commonAuthrtMapper.selectMemberAndInstByMbrId( user.getMbrId() );
      if (partnerInfo == null) {
        throw new IllegalArgumentException( "회원정보를 찾을 수 없습니다." );
      }

      vo.setUserNo( partnerInfo.getMbrNo() );
      vo.setUserNm( partnerInfo.getMbrEncptFlnm() );
      vo.setEmail( partnerInfo.getMbrEncptEmlNm() );
      vo.setTel( partnerInfo.getMbrEncptTelno() );
      vo.setMbrNo( partnerInfo.getMbrNo() );
      vo.setMbrId( partnerInfo.getMbrId() );
      vo.setMbrEncptFlnm( partnerInfo.getMbrEncptFlnm() );
      vo.setMbrEncptEmlNm( partnerInfo.getMbrEncptEmlNm() );
      vo.setMbrEncptTelno( partnerInfo.getMbrEncptTelno() );
      vo.setMbrTypeCd( partnerInfo.getMbrTypeCd() );
      vo.setMbrJoinSttsCd( partnerInfo.getMbrJoinSttsCd() );
      vo.setMbrJoinDt( partnerInfo.getMbrJoinDt() );
      vo.setInstBrno( partnerInfo.getInstBrno() );
      vo.setInstNm( partnerInfo.getInstNm() );
      vo.setInstDelYn( partnerInfo.getInstDelYn() );
      vo.setExprtHdofYn( partnerInfo.getExprtHdofYn() );
      vo.setExprtAprvSttsCd( partnerInfo.getExprtAprvSttsCd() );
    }

    return vo;
  }
}
