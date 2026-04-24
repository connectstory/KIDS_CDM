package kr.or.kids.domain.cm.upload.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * 업로드 도메인 VO 데이터를 표현한다.
 */
@Getter
@Setter
public class TbCmDUldPrdSclVO {

    private Long uldPrdSn;          
    private Long pblntSn;           
    private Long ptcpInstSn;        
    private String trsfSeCd;        
    private String tblSeCd;         
    private String tblNm;           
    private Long tnocs;             
    private String bgngYmd;         
    private String endYmd;          
    private String delYn;           
    private String rgtrId;          
    private LocalDateTime regDt;    
    private String mdfrId;          
    private LocalDateTime mdfcnDt;  
}
