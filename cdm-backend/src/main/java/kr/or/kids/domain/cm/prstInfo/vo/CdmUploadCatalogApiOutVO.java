package kr.or.kids.domain.cm.prstInfo.vo;

import lombok.Getter;
import lombok.Setter;

/**
 * CDM 카탈로그 (tb_cm_m_uld_ctlg) API 출력 VO
 */
@Getter
@Setter
public class CdmUploadCatalogApiOutVO {

    /** 업로드 목록 일련번호 */
    private Long uldListSn;

    /** 공시 일련번호 */
    private Long pblntSn;

    /** 참여기관 일련번호 */
    private Long ptcpInstSn;

    /** 테이블 구분 코드 */
    private String tblSeCd;

    /** 컬럼명 */
    private String colNm;

    /** 데이터 타입명 */
    private String dataTypeNm;

    /** Null 여부 */
    private String nulYn;

    /** PK 여부 */
    private String pkYn;

    /** FK 여부 */
    private String fkYn;

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