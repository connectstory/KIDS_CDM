package kr.or.kids.domain.cm.upload.util;

import kr.or.kids.domain.cm.common.mapper.CommonAuthrtMapper;
import kr.or.kids.domain.cm.common.vo.MemberAndInstVO;
import kr.or.kids.domain.cm.common.vo.UserVO;
import kr.or.kids.global.common.CustomUserDetails;

public final class UploadAuthUtil {
  private UploadAuthUtil() {}

  /**
   * 조건 충족 여부를 확인한다.
   *
   * @param du du
   * @return 처리 결과
   */
  public static boolean isAdmin(CustomUserDetails du) {
    return du != null && "A".equals( du.getUserType() );
  }

  /**
   * 데이터를 변환한다.
   *
   * @param du du
   * @return 처리 결과
   */
  public static UserVO toUserVO(CustomUserDetails du) {
    if (du == null) return null;
    UserVO user = new UserVO();
    
    String ni = du.getNi();
    if (ni == null || ni.isBlank()) {
      ni = du.getUserNo();
    }
    if (ni == null || ni.isBlank()) {
      ni = du.getMbrId();
    }
    user.setNi( ni );
    user.setUserNo( du.getUserNo() );
    user.setUserId( du.getMbrId() );
    user.setUserNm( du.getUserNm() );
    user.setUserTypeCd( du.getMbrTypeCd() );
    user.setUserSeCd( du.getUserSeCd() );
    return user;
  }

  
  /**
   * resolvePartnerInstIdForAccess 처리를 수행한다.
   *
   * @param du du
   * @param commonAuthrtMapper commonAuthrtMapper
   * @return 처리 결과
   */
  public static String resolvePartnerInstIdForAccess( CustomUserDetails du, CommonAuthrtMapper commonAuthrtMapper ) {
    if (du == null) {
      return null;
    }
    String jwtInst = du.getInstId();
    if (jwtInst != null && !jwtInst.isBlank()) {
      return jwtInst.trim();
    }
    if (commonAuthrtMapper == null) {
      return null;
    }
    String mbrId = du.getMbrId();
    if (mbrId == null || mbrId.isBlank()) {
      return null;
    }
    try {
      MemberAndInstVO m = commonAuthrtMapper.selectMemberAndInstByMbrId( mbrId.trim() );
      if (m == null || m.getInstBrno() == null || m.getInstBrno().isBlank()) {
        return null;
      }
      return m.getInstBrno().trim();
    } catch (Exception e ) {

      return null;
    }
  }
}

