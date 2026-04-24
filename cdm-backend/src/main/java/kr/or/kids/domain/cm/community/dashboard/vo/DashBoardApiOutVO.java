package kr.or.kids.domain.cm.community.dashboard.vo;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

/**
 * <pre>
 * 대시보드 통계 출력 VO
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
public class DashBoardApiOutVO {

    /** 업로드 건수 */
    private Long uldNocs;

    /** 오류 건수 */
    private Long errNocs;

    /** 오류율 */
    private BigDecimal errRt;

    /** 업로드 용량 */
    private BigDecimal uldCpct;

    /** 최근 업로드 일자 */
    private String lastUldDt;

    /** 전체 건수 */
    private Long totalCnt;

    /** 요청 건수 */
    private Long reqCnt;

    /** 진행 건수 */
    private Long progressCnt;

    /** 검토 건수 */
    private Long reviewCnt;

    /** 종료 건수 */
    private Long closeCnt;

    /** 기관 식별자 */
    private String instId;

    /** 기관명 */
    private String instName;

    /** 최근 갱신일자 (YYYYMMDD) */
    private String lastUpdtYmd;

    /** 결과 건수 */
    private Long rsltCnt;

    /** 재요청 건수 */
    private Long reReqCnt;

    /** 완료 건수 */
    private Long completeCnt;

    /** 취소 건수 */
    private Long cancelCnt;

    /** 등록 건수 (업로드 상태 코드 05) */
    private Long regCnt;

    /** 등록재요청 건수 (업로드 상태 코드 07) */
    private Long reRegCnt;

    /** 모델 유형 */
    private String modelType;

    /** 테이블명 */
    private String tableName;

    /** 테이블 유형 */
    private String tableType;

    /** 전체 데이터 건수 */
    private Long totalNocs;

    /** 최소 일자 */
    private String minDate;

    /** 최대 일자 */
    private String maxDate;

    /** CDM 버전 */
    private String cdmVersion;

    /** 갱신 주기 */
    private Integer updateCycle;

    /** 등록 일자 */
    private String regDt;

    /** 공시 일련번호 */
    private Long pblntSn;

    /** 공시 구분 코드 */
    private String pblntSeCd;

    /** 제목명 */
    private String ttlNm;

    /** 공시 내용 */
    private String pblntCn;

    /** 공시 시작일 (YYYYMMDD) */
    private String pblntBgngYmd;

    /** 공시 종료일 (YYYYMMDD) */
    private String pblntEndYmd;

    /** 공시 상태 코드 */
    private String pblntStcd;

    /** 참여 기관 수 */
    private Long partCnt;

    /** 기관 참여 일련번호 */
    private String ptcpInstSn;

    /** 기관 진행 건수 */
    private String instProgressCnt;

    /** 기관 검토 요청 건수 */
    private String instReviewReqCnt;

    /** 기관 검토 완료 건수 */
    private String instReviewCompleteCnt;

    /** 메타 검토 요청 건수 */
    private String metaReviewReqCnt;

    /** 메타 검토 완료 건수 */
    private String metaReviewCompleteCnt;
}
