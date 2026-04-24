package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDateTime;

import kr.or.kids.domain.cm.research.vo.OpinionListRowVO;

/**
 * 의견 목록 응답. 의견 구분(rsltGroupCd)은 tb_cm_e_asmt_meta 조인으로 조회한 meta.rslt_group_cd 사용.
 */
public record OpinionListResponse( Long asmtSn, // 과제일련번호
    String instId, // 기관아이디
    String instNm, // 기관명
    Long opnnIntgRsltSn, // 의견통합결과일련번호
    Long asmtMetaRsltSn, // 과제메타결과일련번호
    String rsltGroupCd, // 결과그룹코드 (meta.rslt_group_cd, 구 opnn_intg_se_cd 대체)
    String opnnIntgDmndCn, // 의견통합요청내용
    String utlzAgreSeCd, // 활용동의구분코드
    String rgtrId, // 등록자아이디
    LocalDateTime regDt, // 등록일자
    String mdfrNm, // 수정자명
    String mdfrId, // 수정자아이디
    LocalDateTime mdfcnDt, // 수정일자
    String uldInstPrgrsSttsStcd, // 데이터 업로드 상태코드
    String uldTypeCd, // 업로드유형코드
    String asmtOpnnSttsCd // 연구결과 활용동의 상태코드 (tb_cm_e_opnn.asmt_opnn_stts_cd)
) {
  public static OpinionListResponse fromRow( OpinionListRowVO row ) {
    return new OpinionListResponse( row.getAsmtSn(), row.getInstId(), row.getInstNm(), row.getOpnnIntgRsltSn(), row.getAsmtMetaRsltSn(), row.getRsltGroupCd(), row.getOpnnIntgDmndCn(), row.getUtlzAgreSeCd(), row.getRgtrId(), row.getRegDt(), row.getMdfrNm(), row.getMdfrId(), row.getMdfcnDt(), row.getUldInstPrgrsSttsCd(), row.getUldTypeCd(), row.getAsmtOpnnSttsCd() );
  }

  /** 수정자명만 바꿔서 재구성(복호화 등) */
  public static OpinionListResponse fromRow( OpinionListRowVO row, String mdfrNmForResponse ) {
    return new OpinionListResponse( row.getAsmtSn(), row.getInstId(), row.getInstNm(), row.getOpnnIntgRsltSn(), row.getAsmtMetaRsltSn(), row.getRsltGroupCd(), row.getOpnnIntgDmndCn(), row.getUtlzAgreSeCd(), row.getRgtrId(), row.getRegDt(), mdfrNmForResponse, row.getMdfrId(), row.getMdfcnDt(), row.getUldInstPrgrsSttsCd(), row.getUldTypeCd(), row.getAsmtOpnnSttsCd() );
  }

  public static OpinionListResponse from( Long asmtSn, String instId, String instNm, Long opnnIntgRsltSn, Long asmtMetaRsltSn, String rsltGroupCd, String opnnIntgDmndCn, String utlzAgreSeCd, String rgtrId, LocalDateTime regDt, String mdfrNm, String mdfrId, LocalDateTime mdfcnDt, String uldInstPrgrsSttsStcd, String uldTypeCd, String asmtOpnnSttsCd ) {
    return new OpinionListResponse( asmtSn, instId, instNm, opnnIntgRsltSn, asmtMetaRsltSn, rsltGroupCd, opnnIntgDmndCn, utlzAgreSeCd, rgtrId, regDt, mdfrNm, mdfrId, mdfcnDt, uldInstPrgrsSttsStcd, uldTypeCd, asmtOpnnSttsCd );
  }
}
