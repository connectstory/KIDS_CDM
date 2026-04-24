package kr.or.kids.domain.cm.upload.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
@Getter
@Setter
public class PartnerInformationRequest {

    
    private Long pblntSn;           
    private Long ptcpInstSn;        
    
    
    private String verInfoNm;       
    private String lastUpdtYmd;     
    private Long updtCycleCnt;      
    
    
    private List<PeriodScaleItem> periodScaleList;
    
    
    private String mdfrId;          
    
    
    @Getter
    @Setter
    public static class PeriodScaleItem {
        private Long uldPrdSn;      
        private String trsfSeCd;    
        private String tblSeCd;     
        private String tblNm;       
        private Long tnocs;         
        private String bgngYmd;     
        private String endYmd;      
    }
}
