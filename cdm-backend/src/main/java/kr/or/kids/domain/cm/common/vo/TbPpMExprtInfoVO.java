package kr.or.kids.domain.cm.common.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

/* 전문가정보기본 */
public class TbPpMExprtInfoVO {
    private String mbrNo; // 회원번호
    private String brno; // 사업자등록번호
    private String exprtInstEncptEmlNm; // 전문가기관암호화이메일명
    private String exprtHdofYn; // 전문가대표여부
    private String exprtAprvSttsYn; // 전문가승인상태여부
    private LocalDateTime aprvPrcsDt; // 승인처리일시
    private String rjctRsn; // 거절사유
    private String atchFileId; // 첨부파일아이디
    private String rgtrId; // 등록자아이디
    private LocalDateTime regDt; // 등록일자
    private String regPrgmId; // 등록프로그램아이디
    private String mdfrId; // 수정자아이디
    private LocalDateTime mdfcnDt; // 수정일자
    private String mdfcnPrgmId; // 수정프로그램아이디
}
