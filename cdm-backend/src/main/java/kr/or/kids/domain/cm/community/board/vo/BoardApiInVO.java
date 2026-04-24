package kr.or.kids.domain.cm.community.board.vo;

import lombok.Data;

/**
 * <pre>
 * 게시판 게시글 목록 조회 조건 VO
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
public class BoardApiInVO {

    /** 게시판 식별자 */
    private String bbsId;

    /** 검색 유형 (title / writer / content) */
    private String searchType;

    /** 검색 키워드 */
    private String searchKeyword;

    /** 작성자 검색 시 암호화된 키워드 (협력기관 게시판 전용) */
    private String encryptedWriterKeyword;

    /** 게시글 일련번호 (상세 조회용) */
    private Long pstSn;

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
