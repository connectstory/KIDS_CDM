package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDateTime;
import java.util.List;

import kr.or.kids.domain.cm.research.vo.TbCmMAsmtVO;
import lombok.Getter;

@Getter
public class ResearchUpdateRequest {

  private String asmtNm;
  private String asmtArtclDtlCn;
  private LocalDateTime flfmtBgngDt;
  private LocalDateTime flfmtEndDt;
  private List<String> asmtPrcpInsttList; // 기관아이디 목록

  public TbCmMAsmtVO toVO() {
    TbCmMAsmtVO vo = new TbCmMAsmtVO();
    vo.setAsmtNm( asmtNm ); // title -> asmtNm
    vo.setAsmtArtclDtlCn( asmtArtclDtlCn ); // content -> asmtArtclDtlCn
    vo.setFlfmtBgngDt( flfmtBgngDt ); // startTime -> flfmtBgngDt
    vo.setFlfmtEndDt( flfmtEndDt ); // endTime -> flfmtEndDt
    return vo;
  }
}
