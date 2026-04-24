package kr.or.kids.domain.cm.upload.dto;

import java.util.List;

import kr.or.kids.domain.cm.common.dto.PageableRequest;
import lombok.Getter;
import lombok.Setter;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
@Getter
@Setter
public class DisclosureSearchRequest extends PageableRequest {
  private String pblntSeCd; 
  private String pblntPrgrsSttsCd; 
  private String pblntBgngYmd; 
  private String pblntEndYmd; 
  private String searchType; 
  private List<String> instIdList; 
  private String uldPrgrSttsCd; 

  
  /**
   * setPblntDvcd 처리를 수행한다.
   *
   * @param pblntDvcd pblntDvcd
   */
  public void setPblntDvcd( String pblntDvcd ) {
    this.pblntSeCd = pblntDvcd;
  }

  
  /**
   * setPblntStcd 처리를 수행한다.
   *
   * @param pblntStcd pblntStcd
   */
  public void setPblntStcd( String pblntStcd ) {
    this.pblntPrgrsSttsCd = pblntStcd;
  }
}
