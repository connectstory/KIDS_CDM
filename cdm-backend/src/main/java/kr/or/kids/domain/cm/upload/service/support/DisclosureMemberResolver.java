package kr.or.kids.domain.cm.upload.service.support;

import java.util.List;
import java.util.Objects;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import kr.or.kids.domain.cm.common.service.MemberResolver;
import kr.or.kids.domain.cm.common.vo.ResolvedMemberVO;
import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import kr.or.kids.domain.cm.upload.mapper.DisclosureMapper;
import kr.or.kids.domain.cm.upload.mapper.DisclosurePartnerMapper;
import kr.or.kids.domain.cm.upload.vo.DisclosureMemberVO;
import kr.or.kids.domain.cm.upload.vo.TbCmMUldPblntVO;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DisclosureMemberResolver {

  private final MemberResolver memberResolver;
  private final DisclosureMapper disclosureMapper;
  private final DisclosurePartnerMapper disclosurePartnerMapper;

  public DisclosureMemberVO resolve( Long pblntSn, CustomUserDetails user ) {
    DisclosureMemberVO vo = new DisclosureMemberVO();
    ResolvedMemberVO base = memberResolver.resolveUser( user );
    BeanUtils.copyProperties( base, vo );
  
    if (pblntSn == null) {
      vo.setIsAdmin( user != null && user.isAdmin() );
      return vo;
    }

    TbCmMUldPblntVO pblnt = disclosureMapper.findById( pblntSn );
    if (pblnt == null) {
      throw new IllegalArgumentException( "공시를 찾을 수 없습니다." );
    }
    vo.setPblnt( pblnt );

    List<TbCmMUldPrstVO> partners = disclosurePartnerMapper.findByPblntSn( pblntSn );
    String userBrno = normalizeBrno( vo.getInstBrno() );
    TbCmMUldPrstVO partner = partners.stream()
        .filter( p -> p != null && !isDeleted( p.getDelYn() ) )
        .filter( p -> userBrno != null && userBrno.equals( normalizeBrno( p.getBrno() ) ) )
        .findFirst()
        .orElse( null );
    vo.setPartner( partner );

    boolean platformAdmin = user != null && user.isAdmin();
    boolean disclosureCreator = matchesRgtr( user, pblnt.getRgtrId() );
    vo.setIsAdmin( platformAdmin || disclosureCreator );

    return vo;
  }

  /**
   * 공시 상세 조회에 대한 참여 기관 매칭 여부.
   * 플랫폼 관리자이거나, 세션 기관 ID가 해당 공시 PRST의 기관 ID·사업자번호 중 하나와 같으면 true.
   */
  public boolean isAllowedToViewDisclosureDetail( CustomUserDetails user, Long pblntSn ) {
    if (user == null || user.isAdmin()) {
      return user != null && user.isAdmin();
    }
    String userInstId = resolvePartnerInstIdForAccess( user );
    if (isBlank( userInstId ) || pblntSn == null) {
      return false;
    }
    List<TbCmMUldPrstVO> partners = disclosurePartnerMapper.findByPblntSn( pblntSn );
    if (partners == null || partners.isEmpty()) {
      return false;
    }
    for ( TbCmMUldPrstVO row : partners ) {
      if (row == null) {
        continue;
      }
      String iid = row.getInstId();
      if ( iid != null && !iid.isBlank() && userInstId.equals( iid.trim() ) ) {
        return true;
      }
      String br = row.getBrno();
      if ( br != null && !br.isBlank() && userInstId.equals( br.trim() ) ) {
        return true;
      }
    }
    return false;
  }

  private static String resolvePartnerInstIdForAccess( CustomUserDetails user ) {
    if (user == null || user.getInstId() == null) {
      return null;
    }
    String id = user.getInstId().trim();
    return id.isEmpty() ? null : id;
  }

  private static boolean isBlank( String s ) {
    return s == null || s.trim().isEmpty();
  }

  private static boolean isDeleted( String delYn ) {
    if (delYn == null || delYn.isBlank()) {
      return false;
    }
    return "Y".equalsIgnoreCase( delYn.trim() );
  }

  private static String normalizeBrno( String brno ) {
    if (brno == null) {
      return null;
    }
    String t = brno.trim();
    if (t.isEmpty()) {
      return null;
    }
    try {
      return String.format( "%010d", Long.parseLong( t ) );
    } catch (NumberFormatException e ) {
      return t;
    }
  }

  private static boolean matchesRgtr( CustomUserDetails user, String rgtrId ) {
    if (user == null || rgtrId == null || rgtrId.isBlank()) {
      return false;
    }
    String r = rgtrId.trim();
    return Objects.equals( trimOrNull( user.getEmpNo() ), r )
        || Objects.equals( trimOrNull( user.getMbrId() ), r )
        || Objects.equals( trimOrNull( user.getUserNo() ), r );
  }

  private static String trimOrNull( String s ) {
    if (s == null) {
      return null;
    }
    String t = s.trim();
    return t.isEmpty() ? null : t;
  }
}
