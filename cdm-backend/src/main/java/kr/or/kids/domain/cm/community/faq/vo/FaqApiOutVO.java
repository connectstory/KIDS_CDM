package kr.or.kids.domain.cm.community.faq.vo;

import lombok.Data;

/**
 * <pre>
 * FAQ 상세/목록 출력 VO
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
public class FaqApiOutVO {

    /** 업무 구분 코드 */
    private String taskSeCd;

    /** FAQ 분류명 */
    private String faqClsfNm;

    /** FAQ 구분 라벨 (화면 표시용) */
    private String faqSeNm;

    /** FAQ 구분 코드 */
    private String faqSeCd;

    /** 검색 유형 (title / content) */
    private String searchType;

    /** 검색 키워드 */
    private String searchKeyword;

    /** FAQ 일련번호 (PK) */
    private Long faqSn;

    /** FAQ 질문 제목 */
    private String faqTtl;

    /** FAQ 정렬 순서 */
    private Integer faqSeq;

    /** 사용 여부 (Y/N) */
    private String useYn;

    /** 언어 구분 식별자 (ko, en 등) */
    private String langSeId;

    /** FAQ 답변 내용 */
    private String faqAnsCn;

    /** 첨부파일 식별자 */
    private String atchFileId;

    /** 작성 부서명 */
    private String wrtrDeptNm;

    /** 수정 부서명 */
    private String mdfrDeptNm;

    /** 등록자 식별자 */
    private String rgtrId;

    /** 등록 일시 (YYYY-MM-DD) */
    private String regDt;

    /** 수정자 식별자 */
    private String mdfrId;

    /** 수정 일시 (YYYY-MM-DD) */
    private String mdfcnDt;

    /** 조회수 */
    private Long pstInqCnt;
}
