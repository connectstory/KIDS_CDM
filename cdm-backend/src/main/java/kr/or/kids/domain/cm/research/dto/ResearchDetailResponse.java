package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import kr.or.kids.domain.cm.common.dto.CaFileItem;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtPrcpVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtVO;

public record ResearchDetailResponse(Long asmtSn, String asmtId, String asmtPrgrsSttsCd, String asmtNm, String asmtArtclDtlCn, String asmtClsCn, LocalDateTime flfmtBgngDt, LocalDateTime flfmtEndDt, String instId, String instNm, String rgtrId, LocalDateTime regDt, String mdfrId, LocalDateTime mdfcnDt,
                                     String mbrEncptFlnm, String asmtMetaRsltSttsCd, TbCmMAsmtPrcpVO asmtPrcp, List<CaFileItem> fileList, List<CaFileItem> analysisFileList ) {

  public static ResearchDetailResponse from( TbCmMAsmtVO vo, String instNm, String mbrEncptFlnm, String asmtMetaRsltSttsCd, TbCmMAsmtPrcpVO asmtPrcp ) {
    return from( vo, instNm, mbrEncptFlnm, asmtMetaRsltSttsCd, asmtPrcp, null, null );
  }

  public static ResearchDetailResponse from(TbCmMAsmtVO vo, String instNm, String mbrEncptFlnm, String asmtMetaRsltSttsCd, TbCmMAsmtPrcpVO asmtPrcp, List<CaFileItem> fileList, List<CaFileItem> analysisFileList ) {
    return new ResearchDetailResponse( vo.getAsmtSn(),
        vo.getAsmtId(),
        vo.getAsmtPrgrsSttsCd().trim(),
        vo.getAsmtNm(),
        vo.getAsmtArtclDtlCn(),
        vo.getAsmtClsCn(),
        vo.getFlfmtBgngDt(),
        vo.getFlfmtEndDt(),
        vo.getInstId(),
        instNm,
        vo.getRgtrId(),
        vo.getRegDt(),
        vo.getMdfrId(),
        vo.getMdfcnDt(),
        mbrEncptFlnm,
        asmtMetaRsltSttsCd,
        asmtPrcp,
        fileList != null ? fileList : Collections.emptyList(),
        analysisFileList != null ? analysisFileList : Collections.emptyList()
    );
  }
}
