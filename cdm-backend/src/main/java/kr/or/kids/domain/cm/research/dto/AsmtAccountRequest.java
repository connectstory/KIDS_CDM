package kr.or.kids.domain.cm.research.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 연구과제 VDI/DB 계정 등록·수정 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AsmtAccountRequest {

  /** 계정 유형 (vdi / db) */
  private String vdiType;

  /** 계정 이름 */
  private String vdiName;

  /** 비밀번호 (수정 시 비워두면 기존 값 유지) */
  private String vdiPw;

  /** 접속 IP */
  private String vdiIp;

  /** 접속 포트 */
  private String vdiPort;

  /** 사용 용도/비고 */
  private String vdiUse;
}
