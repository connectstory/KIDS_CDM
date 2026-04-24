package kr.or.kids.domain.cm.prstInfo.vo;

import lombok.Getter;
import lombok.Setter;

/**
 * CDM 현황정보 (tb_cm_m_uld_prst) API 출력 VO
 */
@Getter
@Setter
public class CdmUploadStatusApiOutVO {

    /** 참여기관 일련번호 */
    private Long ptcpInstSn;

    /** 공시 일련번호 */
    private Long pblntSn;

    /** 기관 ID */
    private String instId;

    /** 사업자 등록번호 */
    private String brno;

    /** 업로드 기관 진행 상태 코드 */
    private String uldInstPrgrsSttsStcd;

    /** 참여 신청일시 */
    private String ptcpDmndDt;

    /** 참여 확정일시 */
    private String ptcpCfmtnDt;

    /** 참여 철회일시 */
    private String ptcpRtrcnDt;

    /** 참여 등록일시 */
    private String ptcpRegDt;

    /** 참여 완료일시 */
    private String ptcpCmptnDt;

    /** 참여 재신청일시 */
    private String ptcpRdmndDt;

    /** 업로드 유형 코드 */
    private String uldTypeCd;

    /** 업로드 일시 (CDM 버전) */
    private String uldDt;

    /** 버전 정보명 */
    private String verInfoNm;

    /** 최종 업데이트 일자 (last_updt_ymd) */
    private String lastUpdtYmd;

    /** 업데이트 주기 횟수 */
    private Long updtCycleCnt;

    /** 삭제 여부 */
    private String delYn;

    /** 등록자 ID */
    private String rgtrId;

    /** 등록일시 */
    private String regDt;

    /** 수정자 ID */
    private String mdfrId;

    /** 수정일시 */
    private String mdfcnDt;
}