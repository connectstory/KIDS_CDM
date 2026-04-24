package kr.or.kids.domain.cm.community.board.vo;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * <pre>
 * 게시글 마스터 테이블(TB_PP_M_PST) VO
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
public class TbPpMPstVo {

    /** 게시글 일련번호 (PK) */
    private Long pstSn;

    /** 게시판 식별자 */
    private String bbsId;

    /** 게시글 제목 */
    private String pstTtl;

    /** 게시글 내용 */
    private String pstCn;

    /** 조회수 */
    private Integer pstInqCnt;

    /** 공공누리 저작권 유형 코드 */
    private String pstKoglCprgtTypeCd;

    /** 첨부파일 그룹 식별자 */
    private String atchFileGroupId;

    /** 썸네일 식별자 */
    private String thmbId;

    /** 상단 고정 여부 (Y/N) */
    private String fixYn;

    /** 상단 고정 시작일 (YYYYMMDD) */
    private String fixBgngYmd;

    /** 상단 고정 종료일 (YYYYMMDD) */
    private String fixEndYmd;

    /** 영상 URL 주소 */
    private String vdoUrlAddr;

    /** 노출 여부 (Y/N) */
    private String expsrYn;

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

    /** 썸네일 설명 내용 */
    private String thmbExplnCn;

    /** 영상 설명 내용 */
    private String vdoExplnCn;

    /** 업로드 대상 파일 목록 (DB 컬럼 아님) */
    private List<MultipartFile> files;

    /** 사업자등록번호 (DB 컬럼 아님) */
    private String brno;
}
