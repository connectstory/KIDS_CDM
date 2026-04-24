package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

/* 과제참여결과내역 */
public class TbCmEAsmtPrcpVO {
  private Long asmtPtcpRsltSn; // 과제참여결과일련번호
  private Long asmtSn; // 과제일련번호
  private Long ptcpInstSn; // 참여기관번호
  private String asmtPtcpRsltCn; // 과제참여결과내용
  private String rsltGroupId; // 결과그룹아이디
  private String delYn; // 삭제여부
  private String rgtrId; // 등록자아이디
  private LocalDateTime regDt; // 등록일자
  private String mdfrId; // 수정자아이디
  private LocalDateTime mdfcnDt; // 수정일자
}
