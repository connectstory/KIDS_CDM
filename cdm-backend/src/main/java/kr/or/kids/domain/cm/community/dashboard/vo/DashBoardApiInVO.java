package kr.or.kids.domain.cm.community.dashboard.vo;

import lombok.Getter;
import lombok.Setter;

/**
 * <pre>
 * 대시보드 통계 조회 조건 VO
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
public class DashBoardApiInVO {

    /** 기관 식별자 (brno) — 로그인 세션 기반 조회용 */
    private String instId;

    /** 기관 참여 일련번호 (내부 조인용) */
    private Long ptcpInstSn;

    /** 과제 기관 참여 일련번호 (내부 조인용) */
    private Long asmtPtcpInstSn;

    /** 변환 구분 코드 (01: Sentinel, 02: OMOP) */
    private String trsfSeCd;

    /** 공시 일련번호 */
    private Long pblntSn;

    /** 조회 시작일 (YYYYMMDD) */
    private String fromDate;

    /** 조회 종료일 (YYYYMMDD) */
    private String toDate;
}
