package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDateTime;
import java.util.List;

import kr.or.kids.domain.cm.common.dto.CaFileItem;
import kr.or.kids.domain.cm.research.vo.ResearchPartnerVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtPrcpVO;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ResearchPartnerResponse {
  private Long asmtPtcpInstSn;
  private Long asmtSn;
  private String instId;
  private String ptcpPrgrsSttsCd;
  private String asmtRqstrId;
  private LocalDateTime asmtDmndDt;
  private String asmtPtcpAgreId;
  private LocalDateTime asmtPtcpAgreDt;
  private String asmtRsltRegId;
  private LocalDateTime asmtRsltRegDt;
  private String asmtPtcpRtrcnId;
  private String asmtPtcpRtrcnNm;
  private String asmtPtcpRtrcnMbrEncptFlnm;
  private String asmtPtcpRtrcnEmpNm;
  private String asmtPtcpRtrcnRsn;
  private LocalDateTime asmtPtcpRtrcnDt;
  private String delYn;
  private String rgtrId;
  private String rgtrNm;
  private String mbrEncptFlnm;
  private String empNm;
  private LocalDateTime regDt;
  private String mdfrId;
  private LocalDateTime mdfcnDt;
  private String uldInstPrgrsSttsStcd;
  private String uldTypeCd;
  private String instNm;
  private String brno; // 사업자등록번호 (inst_id와 동일할 수 있음)
  private String utlzAgreSeCd;
  private Integer uldFileCnt;
  private Integer opnnAgreCnt; // opnnIntgSeCd='02' AND utlzAgreSeCd='06' count
  /** rslt_group_cd='04' 메타 의견 중 asmt_opnn_stts_cd 일치 건수 (활용동의 상태) */
  private Integer opnnNotUseCnt;
  /** 해당 기관의 IRB 파일 목록 */
  private List<CaFileItem> irbFiles;

  public ResearchPartnerResponse(Long asmtPtcpInstSn, Long asmtSn, String instId, String ptcpPrgrsSttsCd, String asmtRqstrId, LocalDateTime asmtDmndDt, String asmtPtcpAgreId, LocalDateTime asmtPtcpAgreDt, String asmtRsltRegId, LocalDateTime asmtRsltRegDt, String asmtPtcpRtrcnId,
      String asmtPtcpRtrcnRsn, LocalDateTime asmtPtcpRtrcnDt, String delYn, String rgtrId, LocalDateTime regDt, String mdfrId, LocalDateTime mdfcnDt, String uldInstPrgrsSttsStcd, String uldTypeCd, String instNm, String brno, String utlzAgreSeCd, Integer uldFileCnt) {
    this.asmtPtcpInstSn = asmtPtcpInstSn;
    this.asmtSn = asmtSn;
    this.instId = instId;
    this.ptcpPrgrsSttsCd = ptcpPrgrsSttsCd;
    this.asmtRqstrId = asmtRqstrId;
    this.asmtDmndDt = asmtDmndDt;
    this.asmtPtcpAgreId = asmtPtcpAgreId;
    this.asmtPtcpAgreDt = asmtPtcpAgreDt;
    this.asmtRsltRegId = asmtRsltRegId;
    this.asmtRsltRegDt = asmtRsltRegDt;
    this.asmtPtcpRtrcnId = asmtPtcpRtrcnId;
    this.asmtPtcpRtrcnRsn = asmtPtcpRtrcnRsn;
    this.asmtPtcpRtrcnDt = asmtPtcpRtrcnDt;
    this.delYn = delYn;
    this.rgtrId = rgtrId;
    this.regDt = regDt;
    this.mdfrId = mdfrId;
    this.mdfcnDt = mdfcnDt;
    this.uldInstPrgrsSttsStcd = uldInstPrgrsSttsStcd;
    this.uldTypeCd = uldTypeCd;
    this.instNm = instNm;
    this.brno = brno;
    this.utlzAgreSeCd = utlzAgreSeCd;
    this.uldFileCnt = uldFileCnt;
  }

  public static ResearchPartnerResponse from( TbCmMAsmtPrcpVO vo, String uldInstPrgrsSttsStcd, String uldTypeCd, String instNm, String utlzAgreSeCd, Integer uldFileCnt ) {
    return new ResearchPartnerResponse( vo.getAsmtPtcpInstSn(), vo.getAsmtSn(), vo.getInstId(), vo.getPtcpPrgrsSttsCd(), vo.getAsmtRqstrId(), vo.getAsmtDmndDt(), vo.getAsmtPtcpAgreId(), vo.getAsmtPtcpAgreDt(), vo.getAsmtRsltRegId(), vo.getAsmtRsltRegDt(), vo.getAsmtPtcpRtrcnId(),
        vo.getAsmtPtcpRtrcnRsn(), vo.getAsmtPtcpRtrcnDt(), vo.getDelYn(), vo.getRgtrId(), vo.getRegDt(), vo.getMdfrId(), vo.getMdfcnDt(), uldInstPrgrsSttsStcd, uldTypeCd, instNm, vo.getInstId(), utlzAgreSeCd, uldFileCnt );
  }

  public static ResearchPartnerResponse from( ResearchPartnerVO v ) {
    if (v == null) {
      return null;
    }
    ResearchPartnerResponse r = new ResearchPartnerResponse();
    r.setAsmtPtcpInstSn( v.getAsmtPtcpInstSn() );
    r.setAsmtSn( v.getAsmtSn() );
    r.setInstId( v.getInstId() );
    r.setPtcpPrgrsSttsCd( v.getPtcpPrgrsSttsCd() );
    r.setAsmtRqstrId( v.getAsmtRqstrId() );
    r.setAsmtDmndDt( v.getAsmtDmndDt() );
    r.setAsmtPtcpAgreId( v.getAsmtPtcpAgreId() );
    r.setAsmtPtcpAgreDt( v.getAsmtPtcpAgreDt() );
    r.setAsmtRsltRegId( v.getAsmtRsltRegId() );
    r.setAsmtRsltRegDt( v.getAsmtRsltRegDt() );
    r.setAsmtPtcpRtrcnId( v.getAsmtPtcpRtrcnId() );
    r.setAsmtPtcpRtrcnMbrEncptFlnm( v.getAsmtPtcpRtrcnMbrEncptFlnm() );
    r.setAsmtPtcpRtrcnEmpNm( v.getAsmtPtcpRtrcnEmpNm() );
    r.setAsmtPtcpRtrcnRsn( v.getAsmtPtcpRtrcnRsn() );
    r.setAsmtPtcpRtrcnDt( v.getAsmtPtcpRtrcnDt() );
    r.setDelYn( v.getDelYn() );
    r.setRgtrId( v.getRgtrId() );
    r.setMbrEncptFlnm( v.getMbrEncptFlnm() );
    r.setEmpNm( v.getEmpNm() );
    r.setRegDt( v.getRegDt() );
    r.setMdfrId( v.getMdfrId() );
    r.setMdfcnDt( v.getMdfcnDt() );
    r.setUldInstPrgrsSttsStcd( v.getUldInstPrgrsSttsStcd() );
    r.setUldTypeCd( v.getUldTypeCd() );
    r.setInstNm( v.getInstNm() );
    r.setBrno( v.getBrno() );
    r.setUtlzAgreSeCd( v.getUtlzAgreSeCd() );
    r.setUldFileCnt( v.getUldFileCnt() );
    r.setOpnnAgreCnt( v.getOpnnAgreCnt() );
    r.setOpnnNotUseCnt( v.getOpnnNotUseCnt() );
    return r;
  }
}
