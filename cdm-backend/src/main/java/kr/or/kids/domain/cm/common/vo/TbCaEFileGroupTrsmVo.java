package kr.or.kids.domain.cm.common.vo;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class TbCaEFileGroupTrsmVo {

    private String atchFileGroupId; // 첨부파일 그룹ID (PK)
    private String taskSeCd; // 업무구분코드
    private String taskSeTrgtId; // 업무대상ID
    private String useYn; // 사용여부
    private LocalDateTime regDt; // 등록일
    private String rgtrId; // 등록자
    private LocalDateTime mdfcnDt; // 수정일
    private String mdfrId; // 수정자
}
