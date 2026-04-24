package kr.or.kids.domain.cm.research.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * CDM 현황정보 Entity VO (tb_cm_m_uld_prst)
 */
@Getter
@Setter
public class TbCmMUldPrstVO {

    private Long ptcpInstSn;                // 참여기관 일련번호 (PK)
    private Long pblntSn;                   // 공시 일련번호 (PK)
    private String instId;                  // 기관 ID
    private String brno;                    // 사업자 등록번호
    private String uldInstPrgrsSttsStcd;    // 업로드 기관 진행 상태 코드
    private LocalDateTime ptcpDmndDt;       // 참여 신청일시
    private LocalDateTime ptcpCfmtnDt;      // 참여 확정일시
    private LocalDateTime ptcpRtrcnDt;      // 참여 철회일시
    private LocalDateTime ptcpRegDt;        // 참여 등록일시
    private LocalDateTime ptcpCmptnDt;      // 참여 완료일시
    private LocalDateTime ptcpRdmndDt;      // 참여 재신청일시
    private String uldTypeCd;               // 업로드 유형 코드
    private LocalDateTime uldDt;            // 업로드 일시
    private String verInfoNm;               // 버전 정보명
    private String lastUpdtYmd;             // 최종 업데이트 일자
    private Long updtCycleCnt;              // 업데이트 주기 횟수
    private String delYn;                   // 삭제 여부
    private String rgtrId;                  // 등록자 ID
    private LocalDateTime regDt;            // 등록일시
    private String mdfrId;                  // 수정자 ID
    private LocalDateTime mdfcnDt;          // 수정일시

    /** 업로드/검증 백그라운드 진행중 Y, 아니면 N (TB_CM_M_ULD_PRST.uld_prgrs_yn) */
    private String uldPrgrsYn;

    private String instNm;                  // 기관명 (JOIN으로 가져옴)
    private Long updtCycle;                 // 갱신주기
    private LocalDateTime regYmd;           // 등록일자
    private LocalDateTime mdfcnYmd;         // 수정일자
}