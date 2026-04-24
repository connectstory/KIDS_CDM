package kr.or.kids.domain.cm.community.qna.vo;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * <pre>
 * Q&A 질문 마스터 테이블(TB_CM_M_QNA) VO
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
public class TbPpMQnaVo {

    /** 질문 일련번호 (PK) */
    private Long qstnSn;

    /** 게시판 식별자 */
    private String bbsId;

    /** 게시글 제목 */
    private String pstTtl;

    /** 질문자 성명 */
    private String qstnrNm;

    /** 공개 여부 (Y/N) */
    private String rlsYn;

    /** 암호화된 게시글 비밀번호 */
    private String enpswd;

    /** 게시글 내용 */
    private String pstCn;

    /** 조회수 */
    private Long pstInqCnt;

    /** 첨부파일 식별자 */
    private String atchFileId;

    /** 썸네일 식별자 */
    private String thmbId;

    /** 삭제 여부 (Y/N) */
    private String delYn;

    /** 등록자 식별자 */
    private String rgtrId;

    /** 등록 일시 */
    private String regDt;

    /** 등록 프로그램 식별자 */
    private String regPrgmId;

    /** 수정자 식별자 */
    private String mdfrId;

    /** 수정 일시 */
    private String mdfcnDt;

    /** 수정 프로그램 식별자 */
    private String mdfcnPrgmId;

    /** 질문 진행 상태 코드 (01: 대기, 02: 답변완료) */
    private String qstnPrgrsSttsCd;

    /** 첨부파일 그룹 식별자 (파일 매핑 및 업로드용) */
    private String atchFileGroupId;

    /** 업로드 대상 파일 목록 (DB 컬럼 아님) */
    private List<MultipartFile> files;
}
