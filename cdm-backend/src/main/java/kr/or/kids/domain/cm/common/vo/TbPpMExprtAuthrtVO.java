package kr.or.kids.domain.cm.common.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter

public class TbPpMExprtAuthrtVO {
    private String mbrNo;
    private Long exprtTaskSn;
    private String authrtCd;
    private String rgtrId;
    private LocalDateTime regDt;
    private String mdfrId;
    private LocalDateTime mdfcnDt;
}
