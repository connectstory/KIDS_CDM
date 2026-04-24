package kr.or.kids.domain.cm.community.asmtprp.vo;

import lombok.Getter;
import lombok.Setter;

/**
 * <pre>
 * 과제 제안 목록 조회 조건 VO
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
@Getter
@Setter
public class AsmtPrpApiInVO {

    /** 과제 제안 식별자 */
    private Long asmtPrpSn;

    /** 검색 유형 (title, content, writer) */
    private String searchType;

    /** 검색 키워드 */
    private String searchKeyword;

    /** 작성자 검색 시 암호화된 키워드 (DB 비교용) */
    private String encryptedWriterKeyword;

    /** 과제 제안 답변 상태 코드 */
    private String asmtPrpAnsSttsCd;

    /** 암호화된 게시글 비밀번호 */
    private String encptPstPswd;

    /** 전체 조회 여부 (true: 전체 조회, false: 본인 글만 조회) */
    private boolean searchAll;

    /** 로그인 사용자 식별자 (필터링용) */
    private String loginId;

    /** 현재 페이지 번호 (1부터 시작) */
    private int page = 1;

    /** 페이지당 출력 데이터 건수 */
    private int pageSize = 10;

    /**
     * MyBatis OFFSET 값을 계산하여 반환한다.
     * * <pre>
     * - OFFSET = (현재 페이지 - 1) * 페이지 크기
     * </pre>
     * * @return 계산된 OFFSET 값
     */
    public int getOffset() {
        return (page - 1) * pageSize;
    }
}