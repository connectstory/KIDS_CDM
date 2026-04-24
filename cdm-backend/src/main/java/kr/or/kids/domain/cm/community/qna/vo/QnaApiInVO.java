package kr.or.kids.domain.cm.community.qna.vo;

import lombok.Data;

/**
 * <pre>
 * Q&A 질문 목록 조회 조건 VO
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
public class QnaApiInVO {

    /** 게시판 식별자 */
    private String bbsId;

    /** 검색 유형 (title / content / writer) */
    private String searchType;

    /** 검색 키워드 */
    private String searchKeyword;

    /** 작성자 검색 시 암호화된 키워드 (DB 비교용) */
    private String encryptedWriterKeyword;

    /** 질문 진행 상태 코드 */
    private String qstnPrgrsSttsCd;

    /** 질문 일련번호 (상세 조회용) */
    private Long qstnSn;

    /** 암호화된 게시글 비밀번호 */
    private String enpswd;

    /** 전체 조회 여부 (true: 전체, false: 본인 글만) */
    private boolean searchAll;

    /** 로그인 사용자 식별자 (본인 필터링용) */
    private String loginId;

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
