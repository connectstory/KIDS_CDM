package kr.or.kids.domain.cm.community.qna.vo;

import java.time.LocalDateTime;
import java.util.List;

import kr.or.kids.domain.cm.common.dto.CaFileItem;
import lombok.Data;

/**
 * <pre>
 * Q&A 답변 상세/목록 출력 VO
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
public class QnaAnsApiOutVO {

    /** 답변 일련번호 (PK) */
    private Long ansSn;

    /** 질문 일련번호 */
    private Long qstnSn;

    /** 답변 내용 */
    private String ansCn;

    /** 답변자 식별자 */
    private String ansId;

    /** 답변자 성명 (부서명 포함) */
    private String ansNm;

    /** 사용 여부 (Y/N) */
    private String useYn;

    /** 등록자 식별자 */
    private String rgtrId;

    /** 등록 일시 */
    private LocalDateTime regDt;

    /** 등록 프로그램 식별자 */
    private String regPrgmId;

    /** 수정자 식별자 */
    private String mdfrId;

    /** 수정 일시 */
    private LocalDateTime mdfcnDt;

    /** 수정 프로그램 식별자 */
    private String mdfcnPrgmId;

    /** 첨부파일 목록 */
    private List<CaFileItem> fileList;
}
