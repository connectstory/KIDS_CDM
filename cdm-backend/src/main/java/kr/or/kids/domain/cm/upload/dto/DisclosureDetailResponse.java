package kr.or.kids.domain.cm.upload.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import kr.or.kids.domain.cm.upload.vo.TbCmMUldPblntVO;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record DisclosureDetailResponse(
  Long pblntSn,
  @JsonProperty("pblntDvcd") String pblntSeCd,
  String ttlNm,
  String pblntCn,
  String pblntBgngYmd,
  String pblntEndYmd,
  @JsonProperty("pblntStcd") String pblntPrgrsSttsCd,
  String rgtrId,
  String rgtrNm,
  LocalDateTime regYmd,
  String mdfrId,
  @JsonProperty("mdfcnYmd") LocalDateTime mdfcnDt
) {
  /**
   * 데이터를 변환한다.
   *
   * @param vo vo
   * @return 처리 결과
   */
  public static DisclosureDetailResponse from( TbCmMUldPblntVO vo ) {
    return new DisclosureDetailResponse(
      vo.getPblntSn(), vo.getPblntSeCd(), vo.getTtlNm(), vo.getPblntCn(),
      vo.getPblntBgngYmd(), vo.getPblntEndYmd(), vo.getPblntPrgrsSttsCd(),
      vo.getRgtrId(), vo.getRgtrNm(), vo.getRegYmd(), vo.getMdfrId(), vo.getMdfcnDt()
    );
  }
}
