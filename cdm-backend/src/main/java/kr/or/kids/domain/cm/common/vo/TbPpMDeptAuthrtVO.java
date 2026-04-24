package kr.or.kids.domain.cm.common.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TbPpMDeptAuthrtVO {
    private String deptNo;
    private String authrtCd;
    private String deptAuthrtRmrkCn;
    private String rgtrId;
    private LocalDateTime regDt;
    private String mdfrId;
    private LocalDateTime mdfcnDt;
}
