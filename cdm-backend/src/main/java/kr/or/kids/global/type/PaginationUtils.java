package kr.or.kids.global.type;

/**
 * 공통 pagination 유틸.
 */
public final class PaginationUtils {
    private PaginationUtils() {
        // static only
    }

    /**
     * 검색 조건의 length 값 검증/정규화.
     * 허용 값: 10, 30, 50
     * 그 외/미입력: 10
     */
    public static int normalizeSearchLength(Integer length) {
        if (length == null) {
            return PaginationConstants.DEFAULT_SEARCH_LENGTH;
        }
        for (int allowed : PaginationConstants.ALLOWED_SEARCH_LENGTHS) {
            if (length == allowed) {
                return length;
            }
        }
        return PaginationConstants.DEFAULT_SEARCH_LENGTH;
    }
}

