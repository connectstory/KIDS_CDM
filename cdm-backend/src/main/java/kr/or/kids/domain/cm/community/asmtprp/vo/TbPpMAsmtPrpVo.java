package kr.or.kids.domain.cm.community.asmtprp.vo;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Getter;
import lombok.Setter;

/**
 * <pre>
 * 과제 제안 마스터 테이블(TB_PP_M_ASMT_PRP) VO
 * </pre>
 *
 * @author kim min seok
 * @since 2026-04-16
 * @version 1.0
 *
 * <pre>
 * since         author             description
 * ==========   ============   =========================
 * 2026-04-16   kim min seok    최초 생성
 * </pre>
 */
@Getter
@Setter
public class TbPpMAsmtPrpVo {

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

    /** 등록자 식별자 */
    private String rgtrId;

    /** 수정자 식별자 */
    private String mdfrId;

    /** 게시물 조회수 */
    private Long pstInqCnt;

    /** 과제 제안 답변 상태 코드 (01: 접수, 02: 답변완료 등) */
    private String asmtPrpAnsSttsCd;

    /** 첨부파일 그룹 식별자 (파일 매핑 및 업로드용) */
    private String atchFileGroupId;

    /** 업로드 대상 파일 목록 */
    private List<MultipartFile> files;

}