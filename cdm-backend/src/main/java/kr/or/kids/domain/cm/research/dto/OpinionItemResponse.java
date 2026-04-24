package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDateTime;

/** 의견 한 건 (기관/ULD 제외, 기관별 목록 내부용) */
public record OpinionItemResponse(
    Long asmtSn,
    Long opnnIntgRsltSn,
    Long asmtMetaRsltSn,
    String rsltGroupCd,
    String opnnIntgDmndCn,
    String utlzAgreSeCd,
    String asmtOpnnSttsCd,
    String rgtrId,
    LocalDateTime regDt,
    String mdfrNm,
    String mdfrId,
    LocalDateTime mdfcnDt
) {}
