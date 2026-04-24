package kr.or.kids.domain.cm.upload.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
@Getter
@AllArgsConstructor
public class DisclosurePartnerResponse {
  private Long ptcpInstSn; 
  private Long pblntSn; 
  private String instId; 
  private String instNm; 
  private String uldInstPrgrsSttsStcd; 
  private LocalDateTime ptcpDmndDt; 
  private LocalDateTime ptcpCfmtnDt; 
  private LocalDateTime ptcpRtrcnDt; 
  private LocalDateTime ptcpRegDt; 
  private LocalDateTime ptcpCmptnDt; 
  private LocalDateTime ptcpRdmndDt; 
  private String uldTypeCd; 
  private LocalDateTime uldDt; 
  private String verInfoNm; 
  private String lastUpdtYmd; 
  private LocalDateTime regDt; 
  private Long updtCycleCnt; 
  
  private String delYn;
}
