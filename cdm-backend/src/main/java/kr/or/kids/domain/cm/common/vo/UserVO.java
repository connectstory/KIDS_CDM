package kr.or.kids.domain.cm.common.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserVO {

  private String ni; // Any-ID 식별값
  private String ci; // CI (암호화/해시 권장)
  private String userNo; // 사용자 번호
  private String userId; // 사용자 아이디
  private String userNm; // 사용자 이름
  private String userTypeCd; // 사용자 유형 코드
  private String brdt; // 생년월일(yyyyMMdd)
  private String telno; // 전화번호
  private String userSeCd; // 사용자 구분 (01:개인, 02:법인)

  private String acrValues; // 인증 레벨
  private String certGroupCd; // 인증수단 그룹코드
}
