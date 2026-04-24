package kr.or.kids.domain.cm.community.board.vo;

import kr.or.kids.domain.cm.common.dto.CaFileItem;
import lombok.Data;

import java.util.List;

/**
 * <pre>
 * 게시판 게시글 상세/목록 출력 VO
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
public class BoardApiOutVO {

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

    /** 등록 일시 (YYYY-MM-DD HH24:MI:SS) */
    private String regDt;

    /** 수정자 식별자 */
    private String mdfrId;

    /** 수정 일시 (YYYY-MM-DD HH24:MI:SS) */
    private String mdfcnDt;

    /** 첨부파일 존재 여부 (Y/N) */
    private String hasFile;

    /** 첨부파일 목록 */
    private List<CaFileItem> fileList;
}
