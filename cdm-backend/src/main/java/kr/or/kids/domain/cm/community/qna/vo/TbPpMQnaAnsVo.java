package kr.or.kids.domain.cm.community.qna.vo;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

/**
 * <pre>
 * Q&A 답변 테이블(TB_CM_M_QNA_ANS) VO
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
public class TbPpMQnaAnsVo {

    /** 답변 일련번호 (PK) */
    private Long ansSn;

    /** 질문 일련번호 */
    private Long qstnSn;

    /** 답변 내용 */
    private String ansCn;

    /** 답변자 식별자 */
    private String ansId;

    /** 답변자 성명 */
    private String ansNm;

    /** 사용 여부 (Y/N) */
    private String useYn;

    /** 등록자 식별자 */
    private String rgtrId;

    /** 등록 일시 */
    private LocalDateTime regDt;

    /** 수정자 식별자 */
    private String mdfrId;

    /** 수정 일시 */
    private LocalDateTime mdfcnDt;

    /** 첨부파일 그룹 식별자 (파일 매핑 및 업로드용) */
    private String atchFileGroupId;

    /** 업로드 대상 파일 목록 (DB 컬럼 아님) */
    private List<MultipartFile> files;
}
