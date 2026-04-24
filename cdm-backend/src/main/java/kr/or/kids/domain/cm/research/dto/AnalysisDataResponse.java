package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDateTime;
import java.util.List;

import kr.or.kids.domain.cm.research.vo.TbCmEOpnnVO;

public record AnalysisDataResponse( Long asmtMetaRsltSn, String rsltGroupCd, String asmtMetaRsltSttsCd, LocalDateTime regDt, List<TbCmEOpnnVO> opinionList, LocalDateTime rsltNotiDt ) {
}
