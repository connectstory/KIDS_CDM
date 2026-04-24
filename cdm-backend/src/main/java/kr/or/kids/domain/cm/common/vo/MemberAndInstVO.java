package kr.or.kids.domain.cm.common.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/**
 * 회원정보와 기관정보를 담는 VO
 */
public class MemberAndInstVO {

  private String mbrNo; // 회원번호
  private String mbrId; // 회원아이디
  private String mbrEncptFlnm; // 회원암호화성명
  private String mbrEncptEmlNm; // 회원암호화이메일명
  private String mbrEncptTelno; // 회원암호화전화번호
  private String mbrTypeCd; // 회원유형코드
  private String mbrJoinSttsCd; // 회원가입상태코드
  private LocalDateTime mbrJoinDt; // 회원가입일시
  private String instBrno; // 기관사업자등록번호
  private String instNm; // 기관명
  private String instDelYn; // 기관삭제여부
  private String exprtHdofYn; // 전문가본부여부
  private String exprtAprvSttsCd; // 전문가승인상태코드

  public MemberAndInstVO() {
  }
}
