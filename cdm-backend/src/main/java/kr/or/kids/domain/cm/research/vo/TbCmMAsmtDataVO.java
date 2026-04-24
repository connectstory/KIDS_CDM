package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import kr.or.kids.global.type.YnFlagType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/* 과제데이터 */
public class TbCmMAsmtDataVO {

  private Long asmtDataSn; // 과제데이터일련번호
  private Long asmtSn; // 과제일련번호
  private String instId; // 기관아이디
  private String rschDesignCn; // 연구설계내용
  private String delYn; // 삭제여부
  private String rgtrId; // 등록자아이디
  private LocalDateTime regDt; // 등록일자
  private String regPrgmId; // 등록프로그램아이디
  private String mdfrId; // 수정자아이디
  private LocalDateTime mdfcnDt; // 수정일자
  private String mdfcnPrgmId; // 수정프로그램아이디

  public TbCmMAsmtDataVO() {
  }

  /**
   * 과제데이터를 생성한다.
   *
   * @param asmtSn 과제일련번호
   * @param instId 기관아이디
   * @param rschDesignCn 연구설계내용
   * @param createBy 등록자아이디
   * @return 생성된 과제데이터 객체
   */
  public static TbCmMAsmtDataVO create( Long asmtSn, String instId, String rschDesignCn, String createBy ) {
    LocalDateTime now = LocalDateTime.now();
    TbCmMAsmtDataVO vo = new TbCmMAsmtDataVO();
    vo.setAsmtSn( asmtSn );
    vo.setInstId( instId );
    vo.setRschDesignCn( rschDesignCn );
    vo.setDelYn( YnFlagType.N.code() );
    vo.setRgtrId( createBy );
    vo.setRegDt( now );
    vo.setRegPrgmId( createBy );
    vo.setMdfrId( createBy );
    vo.setMdfcnDt( now );
    vo.setMdfcnPrgmId( createBy );
    return vo;
  }
}
