package kr.or.kids.domain.cm.community.faq.vo;

import lombok.Data;

/**
 * <pre>
 * FAQ 목록 조회 조건 VO
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.0
 *
 * <pre>
 * since         author             description
 * ==========   ============   =========================
 * 2026-01-20   kim min seok    최초 생성
 * </pre>
 */
@Data
public class FaqApiInVO {

    /** 업무 구분 코드 */
    private String taskSeCd;

    /** 언어 구분 식별자 (ko, en 등) */
    private String langSeId;

    /** 사용 여부 (Y/N) */
    private String useYn;

    /** 검색 유형 (title / content) */
    private String searchType;

    /** 검색 키워드 */
    private String searchKeyword;

    /** FAQ 일련번호 (상세 조회용) */
    private Long faqSn;

    /** FAQ 구분 코드 */
    private String faqSeCd;

    /** 현재 페이지 번호 (1부터 시작) */
    private int page = 1;

    /** 페이지당 출력 데이터 건수 */
    private int pageSize = 10;

    /**
     * MyBatis OFFSET 값을 계산하여 반환한다.
     *
     * @return 계산된 OFFSET 값
     */
    public int getOffset() {
        return (page - 1) * pageSize;
    }
}
