package kr.or.kids.domain.cm.upload.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

/**
 * 업로드 도메인 VO 데이터를 표현한다.
 */
public class TbCmMUldPblntVO {

  private Long pblntSn; 
  private String pblntSeCd; 
  private String ttlNm; 
  private String pblntCn; 
  private String pblntBgngYmd; 
  private String pblntEndYmd; 
  private String pblntPrgrsSttsCd; 
  private String delYn; 
  private String rgtrId; 
  private String rgtrNm; 
  /** 파트너 목록 조회 시에만 채움 (TB_CM_M_ULD_PRST.uld_inst_prgrs_stts_cd) */
  private String uldInstPrgrsSttsCd;
  /** 파트너 목록 조회 시에만 채움 (TB_CM_M_ULD_PRST.uld_type_cd) */
  private String uldTypeCd;
  private LocalDateTime regYmd; 
  private String mdfrId; 
  private LocalDateTime mdfcnDt; 

  /**
   * TbCmMUldPblntVO 처리를 수행한다.
   */
  public TbCmMUldPblntVO() {
  }

  
  /**
   * 데이터를 등록한다.
   *
   * @param pblntSeCd pblntSeCd
   * @param ttlNm ttlNm
   * @param pblntCn pblntCn
   * @param pblntBgngYmd pblntBgngYmd
   * @param pblntEndYmd pblntEndYmd
   * @param pblntPrgrsSttsCd pblntPrgrsSttsCd
   * @param createBy createBy
   * @return 처리 결과
   */
  public static TbCmMUldPblntVO create( String pblntSeCd, String ttlNm, String pblntCn, String pblntBgngYmd, String pblntEndYmd, String pblntPrgrsSttsCd, String createBy ) {
    LocalDateTime now = LocalDateTime.now();
    TbCmMUldPblntVO vo = new TbCmMUldPblntVO();
    vo.setPblntSeCd( pblntSeCd );
    vo.setTtlNm( ttlNm );
    vo.setPblntCn( pblntCn );
    vo.setPblntBgngYmd( pblntBgngYmd );
    vo.setPblntEndYmd( pblntEndYmd );
    vo.setPblntPrgrsSttsCd( pblntPrgrsSttsCd );
    vo.setDelYn( "N" );
    vo.setRgtrId( createBy );
    vo.setRegYmd( now );
    vo.setMdfrId( createBy );
    vo.setMdfcnDt( now );
    return vo;
  }
}
