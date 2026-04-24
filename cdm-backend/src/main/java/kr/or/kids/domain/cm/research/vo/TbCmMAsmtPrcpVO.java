package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import kr.or.kids.domain.cm.research.type.ParticipationStatus;
import kr.or.kids.global.type.YnFlagType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

/**
 * 과제참여기관기본 VO
 *
 * @author CDM Team
 * @since 1.0
 */
public class TbCmMAsmtPrcpVO {

  /** 과제참여기관기본 */
  public TbCmMAsmtPrcpVO() {
  }

  private Long asmtPtcpInstSn; // 참여기관번호
  private Long asmtSn; // 과제일련번호
  private String instId; // 기관아이디
  private String instNm; // 기관명(명칭)
  private String brno; // 사업자등록번호
  private String ptcpPrgrsSttsCd; // 참여진행상태코드
  private String asmtRqstrId; // 과제요청자아이디 # 과제를 처음 생성할 때는 과제를 등록하는 사용자의 아이디 # 과제 등록 후 참여기관 추가 후 요청을 보낼 때는 해당
  // 요청하는 사용자의 아이디
  private LocalDateTime asmtDmndDt; // 과제요청일시
  private String asmtPtcpAgreId; // 과제참여동의아이디
  private LocalDateTime asmtPtcpAgreDt; // 과제참여동의일시
  private String asmtRsltRegId; // 과제결과등록아이디
  private LocalDateTime asmtRsltRegDt; // 과제결과등록일시
  private String asmtPtcpRtrcnId; // 과제참여취소등록아이디
  private String asmtPtcpRtrcnRsn; // 과제참여취소사유
  private LocalDateTime asmtPtcpRtrcnDt; // 과제참여취소일시
  private String delYn; // 삭제여부
  private String rgtrId; // 등록자아이디
  private LocalDateTime regDt; // 등록일자
  private String mdfrId; // 수정자아이디
  private LocalDateTime mdfcnDt; // 수정일자
  private String uldTypeCd; // 업로드유형코드 (TB_CM_M_ULD_PRST에서 최신값)

  public TbCmMAsmtPrcpVO(Long asmtPtcpInstSn, Long asmtSn, String instId, String ptcpPrgrsSttsCd, String asmtRqstrId, LocalDateTime asmtDmndDt, String deleteFlag, String createBy, LocalDateTime createdAt, String updateBy, LocalDateTime updatedAt) {
    this.asmtPtcpInstSn = asmtPtcpInstSn;
    this.asmtSn = asmtSn;
    this.instId = instId;
    this.ptcpPrgrsSttsCd = ptcpPrgrsSttsCd;
    this.asmtRqstrId = asmtRqstrId;
    this.asmtDmndDt = asmtDmndDt;
    this.delYn = deleteFlag;
    this.rgtrId = createBy;
    this.regDt = createdAt;
    this.mdfrId = updateBy;
    this.mdfcnDt = updatedAt;
  }

  /**
   * 참여기관을 생성한다.
   *
   * <p>
   * 트랜잭션: NONE (도메인 객체 생성) 사이드이펙트: 없음 (메모리 객체 생성만 수행)
   *
   * @param asmtSn 과제일련번호
   * @param instId 기관아이디
   * @param asmtRqstrId 과제요청자아이디
   * @param createBy 등록자아이디
   * @return 생성된 참여기관 객체
   */
  public static TbCmMAsmtPrcpVO create( Long asmtSn, String instId, String asmtRqstrId, String createBy ) {
    return new TbCmMAsmtPrcpVO( null, asmtSn, instId, ParticipationStatus.REQUEST.code(), asmtRqstrId, LocalDateTime.now(), YnFlagType.N.code(), createBy, LocalDateTime.now(), createBy, LocalDateTime.now() );
  }

  /**
   * 참여동의를 처리한다.
   *
   * <p>
   * 트랜잭션: REQUIRED (쓰기) 사이드이펙트: DB update (partner 상태 변경)
   *
   * @param asmtPtcpAgreId 과제참여동의아이디
   * @throws IllegalStateException 참여동의 불가 상태일 때
   */
  public void approve( String asmtPtcpAgreId ) {
    // if (ptcpPrgrsSttsCd != null && !ptcpPrgrsSttsCd.equals(ParticipationStatus.REQUEST.code())) {
    // throw new IllegalStateException("참여동의 불가 상태");
    // }
    // this.ptcpPrgrsSttsCd = ParticipationStatus.APPROVED.code();
    // this.asmtPtcpAgreId = asmtPtcpAgreId;
    // this.asmtPtcpAgreDt = LocalDateTime.now();
  }

  /**
   * 참여취소를 처리한다.
   *
   * <p>
   * 트랜잭션: REQUIRED (쓰기) 사이드이펙트: DB update (partner 상태 변경)
   *
   * @param reason 참여취소사유
   * @throws IllegalStateException 참여취소 불가 상태일 때
   */
  public void cancel( String reason ) {
    // if (ptcpPrgrsSttsCd != null &&
    // ptcpPrgrsSttsCd.equals(ParticipationStatus.NOT_PARTICIPATING.code())) {
    // throw new IllegalStateException("참여취소 불가 상태");
    // }
    // this.ptcpPrgrsSttsCd = ParticipationStatus.NOT_PARTICIPATING.code();
    // this.asmtPtcpRtrcnRsn = reason;
    // this.asmtPtcpRtrcnDt = LocalDateTime.now();
  }

  /**
   * 결과등록을 처리한다.
   *
   * <p>
   * 트랜잭션: REQUIRED (쓰기) 사이드이펙트: DB update (partner 결과등록)
   *
   * @param asmtRsltRegId 과제결과등록아이디
   */
  public void registerResult( String asmtRsltRegId ) {
    // this.asmtRsltRegId = asmtRsltRegId;
    // this.asmtRsltRegDt = LocalDateTime.now();
  }
}
