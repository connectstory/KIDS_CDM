package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * 과제 사용자 정보 VO (TB_CM_M_ASMT_USER_INFO)
 */
@Getter
@Setter
public class TbCmMAsmtAccountVO {

  /** 과제 사용자 정보 일련번호 (ASMT_USER_INFO_SN) */
  private Long asmtUserInfoSn;

  /** 과제 사용자 성명 (ASMT_USER_FLNM) */
  private String asmtUserFlnm;

  /** 암호화 비밀번호 (ENPSWD) */
  private String enpswd;

  /** 과제 사용자 IP 주소 (ASMT_USER_IP_ADDR) */
  private String asmtUserIpAddr;

  /** 과제 사용자 서비스번호/사번 (ASMT_USER_SRVC_NO) */
  private String asmtUserSrvcNo;

  /** 사용자 구분 코드 (USER_SE_CD) */
  private String userSeCd;

  /** 과제 일련번호 (ASMT_SN) */
  private Long asmtSn;

  /** 사용 여부 (USE_YN) */
  private String useYn;

  /** 등록자 ID (RGTR_ID) */
  private String rgtrId;

  /** 등록 일시 (REG_DT) */
  private LocalDateTime regDt;

  /** 수정자 ID (MDFR_ID) */
  private String mdfrId;

  /** 수정 일시 (MDFCN_DT) */
  private LocalDateTime mdfcnDt;

  /** 분석 스키마명 (ASMT_ANALYSIS_SCHEMA) */
  private String asmtAnalysisSchema;

  /** 연결 연구과제 아이디 (조인 결과: TB_CM_M_ASMT.asmt_id) */
  private String asmtId;
}
