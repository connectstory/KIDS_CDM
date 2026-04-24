package kr.or.kids.domain.cm.upload.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonAlias;

import kr.or.kids.domain.cm.upload.vo.TbCmMUldPblntVO;
import lombok.Getter;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
@Getter
public class DisclosureCreateRequest {

  @JsonAlias("pblntDvcd")
  private String pblntSeCd; 

  private String ttlNm; 
  private String pblntCn; 
  private String pblntBgngYmd; 
  private String pblntEndYmd; 

  @JsonAlias("pblntStcd")
  private String pblntPrgrsSttsCd; 

  private List<String> instIdList; 

  /**
   * 데이터를 변환한다.
   *
   * @param createBy createBy
   * @return 처리 결과
   */
  public TbCmMUldPblntVO toVO( String createBy ) {
    
    String status = pblntPrgrsSttsCd != null && !pblntPrgrsSttsCd.isEmpty() ? pblntPrgrsSttsCd : "01";
    return TbCmMUldPblntVO.create( pblntSeCd, ttlNm, pblntCn, pblntBgngYmd, pblntEndYmd, status, createBy );
  }
}
