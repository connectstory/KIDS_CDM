package kr.or.kids.domain.cm.community.asmtprp.vo;

import java.util.List;

import kr.or.kids.domain.cm.common.dto.CaFileItem;

import lombok.Getter;
import lombok.Setter;

/**
 * <pre>
 * 과제 제안 상세/목록 출력 VO
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
public class AsmtPrpApiOutVO {

    /** 과제 제안 식별자 (PK) */
    private Long asmtPrpSn;

    /** 암호화된 게시글 비밀번호 */
    private String encptPstPswd;

    /** 공개 여부 (Y/N) */
    private String rlsYn;

    /** 제안자 성명 */
    private String asmtPrpsrNm;

    /** 제안자 이메일 주소 */
    private String asmtPrpsrEmlAddr;

    /** 제안자 전화번호 */
    private String asmtPrpsrTelno;

    /** 제안자 소속 기관명 */
    private String asmtPrpsrOgdpNm;

    /** 주제 제목 */
    private String tpcTtlNm;

    /** 과제 제안 내용 */
    private String asmtPrpCn;

    /** 과제 기대 효과 내용 */
    private String asmtExptEfctCn;

    /** 기타 설명 내용 */
    private String asmtEtcExplnCn;

    /** 주의 사항 내용 */
    private String asmtCutnMttrCn;

    /** 첨부파일 그룹 식별자 */
    private String atchFileId;

    /** 삭제 여부 (Y/N) */
    private String delYn;

    /** 등록자 ID */
    private String rgtrId;

    /** 등록 일시 (YYYY-MM-DD HH24:MI:SS) */
    private String regDt;

    /** 수정자 ID */
    private String mdfrId;

    /** 수정 일시 (YYYY-MM-DD HH24:MI:SS) */
    private String mdfcnDt;

    /** 게시물 조회수 */
    private Long pstInqCnt;

    /** 과제 제안 답변 상태 코드 */
    private String asmtPrpAnsSttsCd;

    /** 첨부파일 존재 여부 (Y/N) */
    private String hasFile;

    /** 첨부파일 목록 리스트 */
    private List<CaFileItem> fileList;

}