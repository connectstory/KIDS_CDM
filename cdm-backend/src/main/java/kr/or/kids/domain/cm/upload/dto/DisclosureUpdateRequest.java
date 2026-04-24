package kr.or.kids.domain.cm.upload.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import kr.or.kids.domain.cm.upload.vo.TbCmMUldPblntVO;
import lombok.Getter;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
@Getter
public class DisclosureUpdateRequest {

  @JsonAlias("pblntDvcd")
  private String pblntSeCd; 

  private String ttlNm; 
  private String pblntCn; 
  private String pblntBgngYmd; 
  private String pblntEndYmd; 

  @JsonAlias("pblntStcd")
  private String pblntPrgrsSttsCd; 

  /**
   * 데이터를 변환한다.
   *
   * @param pblntSn pblntSn
   * @param updateBy updateBy
   * @return 처리 결과
   */
  public TbCmMUldPblntVO toVO( Long pblntSn, String updateBy ) {
    TbCmMUldPblntVO vo = new TbCmMUldPblntVO();
    vo.setPblntSn( pblntSn );
    vo.setPblntSeCd( pblntSeCd );
    vo.setTtlNm( ttlNm );
    vo.setPblntCn( pblntCn );
    vo.setPblntBgngYmd( pblntBgngYmd );
    vo.setPblntEndYmd( pblntEndYmd );
    vo.setPblntPrgrsSttsCd( pblntPrgrsSttsCd );
    vo.setMdfrId( updateBy );
    vo.setMdfcnDt( java.time.LocalDateTime.now() );
    return vo;
  }
}
