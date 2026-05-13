package kr.or.kids.domain.cm.upload.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import kr.or.kids.domain.cm.upload.vo.TbCmMUldPblntVO;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record DisclosureListResponse(
  Long pblntSn,
  @JsonProperty("pblntDvcd") String pblntSeCd,
  String ttlNm,
  String pblntBgngYmd,
  String pblntEndYmd,
  @JsonProperty("pblntStcd") String pblntPrgrsSttsCd,
  String rgtrId,
  String rgtrNm,
  LocalDateTime regYmd,
  Long completedPartnersCount,
  Long totalPartnersCount,
  /** 파트너 목록 전용 (TB_CM_M_ULD_PRST.uld_inst_prgrs_stts_cd) */
  String uldInstPrgrsSttsCd,
  /** 파트너 목록 전용 (TB_CM_M_ULD_PRST.uld_type_cd) */
  String uldTypeCd
) {
  /**
   * 데이터를 변환한다.
   *
   * @param vo vo
   * @param completedPartnersCount completedPartnersCount
   * @param totalPartnersCount totalPartnersCount
   * @return 처리 결과
   */
  public static DisclosureListResponse from( TbCmMUldPblntVO vo, Long completedPartnersCount, Long totalPartnersCount ) {
    String uldInstPrgrsStts = vo.getUldInstPrgrsSttsCd();
    if ( uldInstPrgrsStts != null && uldInstPrgrsStts.isBlank() ) {
      uldInstPrgrsStts = null;
    }
    String uldType = vo.getUldTypeCd();
    if ( uldType != null && uldType.isBlank() ) {
      uldType = null;
    }
    return new DisclosureListResponse(
      vo.getPblntSn(),
      vo.getPblntSeCd(),
      vo.getTtlNm(),
      vo.getPblntBgngYmd(),
      vo.getPblntEndYmd(),
      vo.getPblntPrgrsSttsCd(),
      vo.getRgtrId(),
      vo.getRgtrNm(),
      vo.getRegYmd(),
      completedPartnersCount != null ? completedPartnersCount : 0L,
      totalPartnersCount != null ? totalPartnersCount : 0L,
      uldInstPrgrsStts,
      uldType
    );
  }
}
