package kr.or.kids.global.type;

/**
 * 공통 pagination 관련 상수.
 * 예) 목록 조회 시 length(페이지 크기) 값 검증에 사용.
 */
public final class PaginationConstants {
    public static final int DEFAULT_SEARCH_LENGTH = 10;
    public static final int[] ALLOWED_SEARCH_LENGTHS = { 10, 30, 50 };

    private PaginationConstants() {
        // static only
    }
}

