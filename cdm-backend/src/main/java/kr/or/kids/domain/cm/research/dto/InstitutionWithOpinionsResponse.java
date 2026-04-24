package kr.or.kids.domain.cm.research.dto;

import java.util.List;

/** 기관 정보 + 해당 기관의 의견 목록 (의견 목록 조회 시 기관 기준 응답) */
public record InstitutionWithOpinionsResponse( String instId, String instNm, String uldTypeCd, List<OpinionItemResponse> opinions ) {
}
