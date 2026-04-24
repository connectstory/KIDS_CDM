package kr.or.kids.domain.cm.common.dto;

import java.time.LocalDateTime;

public record PartnerResponse( String brno, String instNm, String delYn, String rgtrId, LocalDateTime regDt, String regPrgmId, String mdfrId, LocalDateTime mdfcnDt, String mdfcnPrgmId ) {
}
