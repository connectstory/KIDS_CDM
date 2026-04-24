package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import kr.or.kids.global.type.YnFlagType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

/* 과제메타결과내역 */
public class TbCmEAsmtMetaVO {

  private Long asmtMetaRsltSn; // 과제메타결과일련번호
  private Long asmtSn; // 과제일련번호
  private String asmtMetaRsltCn; // 과제메타결과내용
  private String asmtMetaRsltSttsCd; // 과제메타결과상태코드
  private String rsltGroupCd; // 결과그룹코드
  private LocalDateTime rsltNotiDt; // 결과알림일자
  private String delYn; // 삭제여부
  private String rgtrId; // 등록자아이디
  private LocalDateTime regDt; // 등록일자
  private String mdfrId; // 수정자아이디
  private LocalDateTime mdfcnDt; // 수정일자
  private Integer opnnCount; // 의견 개수
  private String utlzAgreSeCd; // 활용동의구분코드

  /** 조인 조회용 (TB_CM_E_ASMT_META 본문 컬럼 아님) */
  private String mbrEncptFlnm;
  private String empNm;
  /** 등록자 소속 기관 brno (조인, 분석 상세 등) */
  private String instBrno;

  /**
   * 과제메타결과를 생성한다.
   *
   * @param asmtSn 과제일련번호
   * @param asmtMetaRsltCn 과제메타결과내용
   * @param rsltGroupCd 결과그룹코드
   * @param createBy 등록자아이디
   * @return 생성된 과제메타결과 객체
   */
  public static TbCmEAsmtMetaVO create( Long asmtSn, String asmtMetaRsltCn, String asmtMetaRsltSttsCd, String rsltGroupCd, String createBy ) {
    LocalDateTime now = LocalDateTime.now();
    TbCmEAsmtMetaVO vo = new TbCmEAsmtMetaVO();
    vo.setAsmtSn( asmtSn );
    vo.setAsmtMetaRsltCn( asmtMetaRsltCn );
    vo.setAsmtMetaRsltSttsCd( asmtMetaRsltSttsCd );
    vo.setRsltGroupCd( rsltGroupCd );
    vo.setDelYn( YnFlagType.N.code() );
    vo.setRgtrId( createBy );
    vo.setRegDt( now );
    vo.setMdfrId( createBy );
    vo.setMdfcnDt( now );
    return vo;
  }
}
