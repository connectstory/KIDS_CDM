package kr.or.kids.domain.cm.common.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

/* 회원정보기본 */
public class TbPpMMbrInfoVO {
    private String mbrNo; // 회원번호
    private String mbrId; // 회원아이디
    private String mbrEncptFlnm; // 회원암호화성명
    private String mbrEncptEmlNm; // 회원암호화이메일명
    private String mbrEnpswd; // 회원암호비밀번호
    private String mbrEncptTelno; // 회원암호화전화번호
    private String mbrTypeCd; // 회원유형코드
    private String mbrJoinSttsCd; // 회원가입상태코드
    private LocalDateTime mbrJoinDt; // 회원가입일시
    private String mbrWhdwlRsn; // 회원탈퇴사유
    private LocalDateTime mbrWhdwlDt; // 회원탈퇴일시
    private String bfrEnpswd; // 이전암호비밀번호
    private LocalDateTime pswdChgDt; // 비밀번호변경일시
    private Integer pswdErrNmtm; // 비밀번호오류횟수
    private String linkInfoIdntfId; // 연계정보식별아이디
    private String certTokenVl; // 인증토큰값
    private String rgtrId; // 등록자아이디
    private LocalDateTime regDt; // 등록일자
    private String regPrgmId; // 등록프로그램아이디
    private String mdfrId; // 수정자아이디
    private LocalDateTime mdfcnDt; // 수정일자
    private String mdfcnPrgmId; // 수정프로그램아이디
}
