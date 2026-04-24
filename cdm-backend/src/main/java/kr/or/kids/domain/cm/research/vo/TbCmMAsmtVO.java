package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import kr.or.kids.global.type.YnFlagType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

/* 과제기본 */
public class TbCmMAsmtVO {

  private Long asmtSn; // 과제일련번호
  private String asmtId; // 과제아이디
  private String asmtPrgrsSttsCd; // 과제진행상태코드
  private String asmtNm; // 과제명
  private String asmtArtclDtlCn; // 과제항목상세내용
  private LocalDateTime flfmtBgngDt; // 수행시작일시
  private LocalDateTime flfmtEndDt; // 수행종료일시
  private String trgtDbCn; // 대상데이터베이스내용
  private String rschDesignCn; // 연구설계내용
  private String instId; // 기관아이디
  private String anlsTblCn; // 분석테이블내용
  private String asmtClsCn; // 과제마감내용
  private String asmtClsDt; // 과제마감일시 (bpchar(14), 예: yyyyMMddHHmmss)
  private String delYn; // 삭제여부
  private String rgtrId; // 등록자아이디
  private LocalDateTime regDt; // 등록일자
  private String mdfrId; // 수정자아이디
  private LocalDateTime mdfcnDt; // 수정일자

  public TbCmMAsmtVO() {
  }

  // 전체 필드 생성자
  public TbCmMAsmtVO(Long asmtSn, String asmtId, String asmtPrgrsSttsCd, String asmtNm, String asmtArtclDtlCn, LocalDateTime flfmtBgngDt, LocalDateTime flfmtEndDt, String trgtDbCn, String rschDesignCn, String instId, String anlsTblCn, String delYn, String rgtrId, LocalDateTime regDt, String mdfrId,
      LocalDateTime mdfcnDt) {
    this.asmtSn = asmtSn;
    this.asmtId = asmtId;
    this.asmtPrgrsSttsCd = asmtPrgrsSttsCd != null ? asmtPrgrsSttsCd.trim() : null;
    this.asmtNm = asmtNm;
    this.asmtArtclDtlCn = asmtArtclDtlCn;
    this.flfmtBgngDt = flfmtBgngDt;
    this.flfmtEndDt = flfmtEndDt;
    this.trgtDbCn = trgtDbCn;
    this.rschDesignCn = rschDesignCn;
    this.instId = instId;
    this.anlsTblCn = anlsTblCn;
    this.delYn = delYn;
    this.rgtrId = rgtrId;
    this.regDt = regDt;
    this.mdfrId = mdfrId;
    this.mdfcnDt = mdfcnDt;
  }

  // 필수 필드 생성자 (과제 생성용)
  public TbCmMAsmtVO(String asmtId, String asmtPrgrsSttsCd, String asmtNm, String asmtArtclDtlCn, LocalDateTime flfmtBgngDt, LocalDateTime flfmtEndDt, String instId, String delYn, String rgtrId, LocalDateTime regDt, String mdfrId, LocalDateTime mdfcnDt) {
    this.asmtId = asmtId;
    this.asmtPrgrsSttsCd = asmtPrgrsSttsCd;
    this.asmtNm = asmtNm;
    this.asmtArtclDtlCn = asmtArtclDtlCn;
    this.flfmtBgngDt = flfmtBgngDt;
    this.flfmtEndDt = flfmtEndDt;
    this.instId = instId;
    this.delYn = delYn;
    this.rgtrId = rgtrId;
    this.regDt = regDt;
    this.mdfrId = mdfrId;
    this.mdfcnDt = mdfcnDt;
  }

  /**
   * 연구과제를 생성한다.
   *
   * <p>
   * 트랜잭션: NONE (도메인 객체 생성) 사이드이펙트: 없음 (메모리 객체 생성만 수행)
   *
   * @param asmtId 과제아이디
   * @param asmtNm 과제명
   * @param asmtArtclDtlCn 과제항목상세내용
   * @param flfmtBgngDt 수행시작일시
   * @param flfmtEndDt 수행종료일시
   * @param instId 기관아이디
   * @param asmtPrgrsSttsCd 과제진행상태코드
   * @param createBy 등록자아이디
   * @return 생성된 연구과제 객체
   */
  public static TbCmMAsmtVO create( String asmtId, String asmtNm, String asmtArtclDtlCn, LocalDateTime flfmtBgngDt, LocalDateTime flfmtEndDt, String instId, String asmtPrgrsSttsCd, String createBy ) {
    LocalDateTime now = LocalDateTime.now();
    TbCmMAsmtVO vo = new TbCmMAsmtVO( asmtId, asmtPrgrsSttsCd, asmtNm, asmtArtclDtlCn, flfmtBgngDt, flfmtEndDt, instId, YnFlagType.N.code(), createBy, now, createBy, now );
    return vo;
  }

  /**
   * 연구과제를 수정한다.
   *
   * <p>
   * 트랜잭션: REQUIRED (쓰기) 사이드이펙트: DB update (research)
   *
   * @param asmtNm 과제명
   * @param asmtArtclDtlCn 과제항목상세내용
   * @param flfmtBgngDt 수행시작일시
   * @param flfmtEndDt 수행종료일시
   * @throws IllegalStateException 완료된 과제는 수정할 수 없을 때
   * @throws IllegalArgumentException 기간이 유효하지 않을 때
   */
  public void update( String asmtNm, String asmtArtclDtlCn, LocalDateTime flfmtBgngDt, LocalDateTime flfmtEndDt ) {
    // if (status == ResearchStatus.COMPLETED) {
    // throw new IllegalStateException("완료된 과제는 수정할 수 없습니다.");
    // }
    // this.asmtNm = asmtNm;
    // this.asmtArtclDtlCn = asmtArtclDtlCn;
    // this.flfmtBgngDt = flfmtBgngDt;
    // this.flfmtEndDt = flfmtEndDt;
    // validatePeriod();
  }

  /**
   * 연구과제를 시작한다.
   *
   * <p>
   * 트랜잭션: REQUIRED (쓰기) 사이드이펙트: DB update (research 상태 변경)
   *
   * @throws IllegalStateException 시작 불가 상태일 때
   */
  public void start() {
    // if (status != ResearchStatus.READY)
    // throw new IllegalStateException("시작 불가 상태");
    // this.status = ResearchStatus.IN_PROGRESS;
  }

  /**
   * 연구과제를 완료한다.
   *
   * <p>
   * 트랜잭션: REQUIRED (쓰기) 사이드이펙트: DB update (research 상태 변경)
   *
   * @throws IllegalStateException 완료 불가 상태일 때
   */
  public void complete() {
    // if (status != ResearchStatus.IN_PROGRESS)
    // throw new IllegalStateException("완료 불가 상태");
    // this.status = ResearchStatus.COMPLETED;
  }

  /**
   * 연구과제 기간을 검증한다.
   *
   * <p>
   * 트랜잭션: NONE 사이드이펙트: 없음
   *
   * @throws IllegalArgumentException 종료일이 시작일 이전일 때
   */
  private void validatePeriod() {
    // if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
    // throw new IllegalArgumentException("종료일은 시작일 이후여야 합니다.");
    // }
  }
}
