package kr.or.kids.domain.cm.common.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PageableRequest {
  /** 페이지 번호 (1부터 시작, 기본값: 1) */
  private Integer page = 1;

  /** 페이지당 항목 수 (기본값: 10) */
  private Integer length = 10;

  /** 검색 키워드 (쿼리 파라미터 searchKeyword로도 바인딩) */
  private String keyword;

  /** 프론트엔드 검색어 파라미터명(searchKeyword) 수신 시 keyword에 설정 */
  public void setSearchKeyword(String searchKeyword) {
    this.keyword = searchKeyword;
  }

  /** 검색 시작일시 */
  private LocalDateTime searchStartDate;

  /** 검색 종료일시 */
  private LocalDateTime searchEndDate;

  /** 페이징을 위한 limit (MyBatis에서 직접 접근) */
  private Integer limit;

  /** 페이징을 위한 offset (MyBatis에서 직접 접근) */
  private Integer offset;

  /**
   * 페이징을 위한 offset 계산
   *
   * @return (page - 1) * length
   */
  public int getOffset() {
    if (page == null || page < 1) {
      page = 1;
    }
    if (length == null || length < 1) {
      length = 10;
    }
    if (offset == null) {
      offset = (page - 1) * length;
    }
    return offset;
  }

  /**
   * 페이징을 위한 limit 반환
   *
   * @return length 값
   */
  public int getLimit() {
    if (length == null || length < 1) {
      length = 10;
    }
    if (limit == null) {
      limit = length;
    }
    return limit;
  }
}
