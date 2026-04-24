package kr.or.kids.domain.cm.research.dto;

import java.time.LocalDateTime;
import java.util.List;

import kr.or.kids.domain.cm.common.dto.CaFileItem;
import kr.or.kids.domain.cm.research.vo.TbCmEOpnnVO;

public record AnalysisDataDetailResponse( Long asmtMetaRsltSn, Long asmtSn, String asmtMetaRsltCn, String asmtMetaRsltSttsCd, String rsltGroupCd, String rgtrId, String instId, LocalDateTime regDt, String mdfrId, LocalDateTime mdfcnDt, String mbrEncptFlnm, TbCmEOpnnVO opinion,
                List<TbCmEOpnnVO> opinionList, LocalDateTime rsltNotiDt, List<CaFileItem> fileList,
                String asmtUserFlnm01, String asmtUserFlnm02, int totalVotePartnerCount ) {
}
