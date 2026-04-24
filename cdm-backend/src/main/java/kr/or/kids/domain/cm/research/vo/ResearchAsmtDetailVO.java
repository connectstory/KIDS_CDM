package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * 연구과제 단건 조회(findById) 결과: TB_CM_M_ASMT + 기관·등록자 조인 컬럼.
 */
@Getter
@Setter
public class ResearchAsmtDetailVO {

  private Long asmtSn;
  private String asmtId;
  private String asmtPrgrsSttsCd;
  private String asmtNm;
  private String asmtArtclDtlCn;
  private LocalDateTime flfmtBgngDt;
  private LocalDateTime flfmtEndDt;
  private String trgtDbCn;
  private String rschDesignCn;
  private String instId;
  private String anlsTblCn;
  private String asmtDdlnCn;
  private String asmtDdlnDt;
  private String delYn;
  private String rgtrId;
  private LocalDateTime regDt;
  private String mdfrId;
  private LocalDateTime mdfcnDt;
  private String instNm;
  private String mbrEncptFlnm;
  private String empNm;

  public TbCmMAsmtVO toTbCmMAsmtVO() {
    TbCmMAsmtVO vo = new TbCmMAsmtVO();
    vo.setAsmtSn( asmtSn );
    vo.setAsmtId( asmtId );
    vo.setAsmtPrgrsSttsCd( asmtPrgrsSttsCd );
    vo.setAsmtNm( asmtNm );
    vo.setAsmtArtclDtlCn( asmtArtclDtlCn );
    vo.setFlfmtBgngDt( flfmtBgngDt );
    vo.setFlfmtEndDt( flfmtEndDt );
    vo.setTrgtDbCn( trgtDbCn );
    vo.setRschDesignCn( rschDesignCn );
    vo.setInstId( instId );
    vo.setAnlsTblCn( anlsTblCn );
    vo.setAsmtClsCn( asmtDdlnCn );
    vo.setAsmtClsDt( asmtDdlnDt );
    vo.setDelYn( delYn );
    vo.setRgtrId( rgtrId );
    vo.setRegDt( regDt );
    vo.setMdfrId( mdfrId );
    vo.setMdfcnDt( mdfcnDt );
    return vo;
  }
}
