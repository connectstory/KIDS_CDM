package kr.or.kids.global.common;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CustomUserDetails {

  private String userType; // ADMIN, PARTNER, EMPLOYEE
  private String userNo;
  private String userNm;

  /** 관리자 로그인 ID */
  private String empNo;

  /** 일반 로그인 ID */
  private String mbrId;

  /** RoleType code: A/P/E ... */
  private String mbrTypeCd;

  // 아래 필드는 기존 생성자 시그니처/확장 호환용(필요한 곳에서만 사용)
  private String ni;
  private String userSeCd;
  private String instId;
  private String instNm;
  private String deptNo;

  public CustomUserDetails(String userType, String userNo, String userNm, String empNo, String mbrId, String mbrTypeCd, String ni, String userSeCd, String instId, String instNm, String deptNo) {
    this.userType = userType;
    this.userNo = userNo;
    this.userNm = userNm;
    this.empNo = empNo;
    this.mbrId = mbrId;
    this.mbrTypeCd = mbrTypeCd;
    this.ni = ni;
    this.userSeCd = userSeCd;
    this.userNm = userNm;
    this.instId = instId;
    this.instNm = instNm;
    this.deptNo = deptNo;
  }

  /**
   * 하위 호환을 위해 "현재 로그인 ID"는 mbrId 우선, 없으면 empNo를 반환한다. 관리자: empNo에 저장되지만 기존 코드에서는 getMbrId()를 사용자 식별자로 사용 중
   */
  public String getMbrId() {
    return (mbrId != null && !mbrId.isBlank()) ? mbrId : empNo;
  }

  public boolean isAdmin() {
    return "A".equals( userType );
  }
}
