package kr.or.kids.domain.cm.research.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 연구과제 VDI/DB 계정 현황 응답 DTO
 */
@Getter
@AllArgsConstructor
public class AsmtAccountResponse {

  /** 과제계정일련번호 */
  private Long sqAsmtAccountSn;

  /** 계정 유형(vdi / db 등) */
  private String vdiType;

  /** 계정 이름 */
  private String vdiName;

  /** 연결 연구과제 아이디 (asmt_id) */
  private String asmtId;

  /** 접속 IP */
  private String vdiIp;

  /** 접속 포트 */
  private String vdiPort;

  /** 사용 용도/비고 */
  private String vdiUse;
}

