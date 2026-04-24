package kr.or.kids.domain.cm.prstInfo.vo;

import lombok.Getter;
import lombok.Setter;

/**
 * CDM 현황정보 (tb_cm_m_uld_prst) API 입력 VO
 */
@Getter
@Setter
public class CdmUploadStatusApiInVO {

    /** 참여기관 일련번호 */
    private Long ptcpInstSn;

    /** 공시 일련번호 */
    private Long pblntSn;

    /** 기관 ID */
    private String instId;

    /** 업로드 기관 진행 상태 코드 */
    private String uldInstPrgrsSttsStcd;

    /** 페이지 번호 */
    private int page = 1;

    /** 페이지 크기 */
    private int pageSize = 10;
}