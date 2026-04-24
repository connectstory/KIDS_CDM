package kr.or.kids.domain.cm.community.faq.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * <pre>
 * FAQ 마스터 테이블(TB_CM_M_FAQ) VO
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
public class TbPpMFaqVo {

    /** FAQ 일련번호 (PK) */
    private Long faqSn;

    /** 업무 구분 코드 */
    private String taskSeCd;

    /** FAQ 분류명 */
    private String faqClsfNm;

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

    /** 조회수 */
    private Long pstInqCnt;

    /** 작성 부서명 */
    private String wrtrDeptNm;

    /** 수정 부서명 */
    private String mdfrDeptNm;

    /** 등록자 식별자 */
    private String rgtrId;

    /** 등록 일시 */
    private LocalDateTime regDt;

    /** 수정자 식별자 */
    private String mdfrId;

    /** 수정 일시 */
    private LocalDateTime mdfcnDt;

    /** FAQ 구분 코드 */
    private String faqSeCd;
}
