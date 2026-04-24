package kr.or.kids.domain.cm.community.asmtprp.vo;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

/**
 * <pre>
 * 과제 제안 답변 테이블(TB_PP_M_ASMT_PRP_ANS) VO
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
public class TbPpMAsmtPrpAnsVo {

    /** 답변 식별자 */
    private Long ansSn;

    /** 과제 제안 식별자 */
    private Long asmtPrpSn;

    /** 답변 내용 */
    private String ansCn;

    /** 답변자 식별자 (사번/ID) */
    private String ansId;

    /** 답변자 성명 */
    private String ansNm;

    /** 사용 여부 (Y/N) */
    private String useYn;

    /** 등록자 식별자 */
    private String rgtrId;

    /** 등록 일시 */
    private String regDt;

    /** 수정자 식별자 */
    private String mdfrId;

    /** 수정 일시 */
    private String mdfcnDt;

    /** 첨부파일 그룹 식별자 (파일 매핑용) */
    private String atchFileGroupId;

    /** 업로드 대상 파일 목록 */
    private List<MultipartFile> files;

}