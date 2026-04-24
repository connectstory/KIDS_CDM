package kr.or.kids.domain.cm.common.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter

public class TbPpMAuthrtVO {
    private String authrtCd;
    private String upAuthrtCd;
    private String taskSeCd;
    private String authrtNm;
    private String authrtTypeCd;
    private String authrtExpln;
    private String useYn;
    private String wrtrDeptNm;
    private String mdfrDeptNm;
    private String rgtrId;
    private LocalDateTime regDt;
    private String mdfrId;
    private LocalDateTime mdfcnDt;
}
