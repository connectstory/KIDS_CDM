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
  Long totalPartnersCount
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
      totalPartnersCount != null ? totalPartnersCount : 0L
    );
  }
}
