package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

/* 과제관리내역 */
public class TbCmEAsmtMngVO {

  private Long asmtAprvSn; // 과제승인일련번호
  private Long asmtPtcpRsltSn; // 과제참여결과일련번호
  private Long asmtSn; // 과제일련번호
  private Long ptcpInstSn; // 참여기관번호
  private String anlsRsltSttsCd; // 분석결과상태코드
  private String rdmndRsn; // 재요청사유
  private String dmndId; // 요청아이디
  private LocalDateTime dmndDt; // 요청일시
  private String aprvId; // 승인아이디
  private LocalDateTime aprvDt; // 승인일시
  private String delYn; // 삭제여부
  private String rgtrId; // 등록자아이디
  private LocalDateTime regDt; // 등록일자
  private String mdfrId; // 수정자아이디
  private LocalDateTime mdfcnDt; // 수정일자
}
