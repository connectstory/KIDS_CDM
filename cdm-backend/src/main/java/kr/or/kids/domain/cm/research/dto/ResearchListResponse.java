package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import kr.or.kids.domain.cm.research.vo.ResearchListRowVO;
import kr.or.kids.domain.cm.research.vo.TbCmEAsmtMetaVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtVO;

public record ResearchListResponse( Long asmtSn, String asmtId, String asmtPrgrsSttsCd, String asmtNm, LocalDateTime flfmtBgngDt, LocalDateTime flfmtEndDt, String instId, String instNm, String deptNm, String rgtrId, String delYn, LocalDateTime regDt, String mdfrId, LocalDateTime mdfcnDt,
    Integer metaAnalysisCount, TbCmEAsmtMetaVO latestMeta02, TbCmEAsmtMetaVO latestMeta04, List<TbCmEAsmtMetaVO> latestMeta03ByOrg, String ptcpPrgrsSttsCd, String uldTypeCd, Boolean reviewInProgress ) {

  /** 관리자 목록: 행 VO + 배치 메타·검토 플래그 */
  public static ResearchListResponse fromRow( ResearchListRowVO row, TbCmEAsmtMetaVO latestMeta02, TbCmEAsmtMetaVO latestMeta04, List<TbCmEAsmtMetaVO> latestMeta03ByOrg, boolean reviewInProgress ) {
    String prgrs = row.getAsmtPrgrsSttsCd() != null ? row.getAsmtPrgrsSttsCd().trim() : null;
    List<TbCmEAsmtMetaVO> meta03 = latestMeta03ByOrg != null ? latestMeta03ByOrg : Collections.emptyList();
    return new ResearchListResponse( row.getAsmtSn(), row.getAsmtId(), prgrs, row.getAsmtNm(), row.getFlfmtBgngDt(), row.getFlfmtEndDt(), row.getInstId(), row.getInstNm(), row.getDeptNm(), row.getRgtrId(), row.getDelYn(), row.getRegDt(), row.getMdfrId(), row.getMdfcnDt(), row.getMetaAnalysisCount(), latestMeta02, latestMeta04, meta03, null, null, reviewInProgress );
  }

  /** 참여기관 목록: 행 VO만 */
  public static ResearchListResponse fromRow( ResearchListRowVO row ) {
    String prgrs = row.getAsmtPrgrsSttsCd() != null ? row.getAsmtPrgrsSttsCd().trim() : null;
    return new ResearchListResponse( row.getAsmtSn(), row.getAsmtId(), prgrs, row.getAsmtNm(), row.getFlfmtBgngDt(), row.getFlfmtEndDt(), row.getInstId(), row.getInstNm(), row.getDeptNm(), row.getRgtrId(), row.getDelYn(), row.getRegDt(), row.getMdfrId(), row.getMdfcnDt(), row.getMetaAnalysisCount(), null, null, null, row.getPtcpPrgrsSttsCd(), row.getUldTypeCd(), Boolean.FALSE );
  }

  public static ResearchListResponse from( TbCmMAsmtVO vo ) {
    return new ResearchListResponse( vo.getAsmtSn(), // asmtSn
        vo.getAsmtId(), // asmtId
        vo.getAsmtPrgrsSttsCd().trim(), // asmtPrgrsSttsCd
        vo.getAsmtNm(), // asmtNm
        vo.getFlfmtBgngDt(), // flfmtBgngDt
        vo.getFlfmtEndDt(), // flfmtEndDt
        vo.getInstId(), // instId
        null, // instNm (not available in TbCmMAsmtVO, populated from join in mapper)
        null, // deptNm (populated from join in mapper when present)
        vo.getRgtrId(), // rgtrId
        vo.getDelYn(), // delYn
        vo.getRegDt(), // regDt
        vo.getMdfrId(), // mdfrId
        vo.getMdfcnDt(), // mdfcnDt
        null, // metaAnalysisCount (populated from join in mapper)
        null, // latestMeta02 (populated in service)
        null, // latestMeta04 (populated in service)
        null, // latestMeta03ByOrg (populated in service)
        null, // ptcpPrgrsSttsCd (populated only in partner list)
        null, // uldTypeCd (populated only in partner list)
        null // reviewInProgress (populated in service for admin list)
    );
  }
}
