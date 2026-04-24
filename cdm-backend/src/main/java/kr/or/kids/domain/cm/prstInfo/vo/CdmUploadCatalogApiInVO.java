package kr.or.kids.domain.cm.prstInfo.vo;

import lombok.Getter;
import lombok.Setter;

/**
 * CDM 카탈로그 (tb_cm_m_uld_ctlg) API 입력 VO
 */
@Getter
@Setter
public class CdmUploadCatalogApiInVO {

    /** 업로드 목록 일련번호 */
    private Long uldListSn;

    /** 공시 일련번호 */
    private Long pblntSn;

    /** 참여기관 일련번호 */
    private Long ptcpInstSn;

    /** 테이블 구분 코드 */
    private String tblSeCd;
}