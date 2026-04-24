package kr.or.kids.domain.cm.research.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.research.dto.AnalysisDataDetailResponse;
import kr.or.kids.domain.cm.research.dto.AnalysisDataRequest;
import kr.or.kids.domain.cm.research.dto.AnalysisDataResponse;
import kr.or.kids.domain.cm.research.dto.AnalysisDataUpdateResponse;
import kr.or.kids.domain.cm.research.dto.InstitutionWithOpinionsResponse;
import kr.or.kids.domain.cm.research.dto.MetaAccessCheckResponse;
import kr.or.kids.domain.cm.research.dto.OpinionListResponse;
import kr.or.kids.domain.cm.research.dto.OpinionRequest;
import kr.or.kids.domain.cm.research.dto.OrgAnalysisDataResponse;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;

public interface ResearchAnalysisService {

  List<AnalysisDataResponse> searchAnalysisData( ResearchMemberVO memberAndInst, Long asmtSn, String rsltGroupStcd, String instId );

  List<OrgAnalysisDataResponse> searchNonCdmPartnersWithLatestAnalysis( Long asmtSn, String rsltGroupStcd );

  AnalysisDataDetailResponse findLatestAnalysisDataByAsmtSn( ResearchMemberVO memberAndInst, Long asmtSn, String rsltGroupStcd );

  AnalysisDataDetailResponse findAnalysisDataById( ResearchMemberVO memberAndInst, Long asmtMetaRsltSn, String rsltGroupStcd );

  AnalysisDataResponse createAnalysisData( ResearchMemberVO memberAndInst, Long asmtSn, AnalysisDataRequest request, List<MultipartFile> files, List<MultipartFile> datasetFiles, List<MultipartFile> vdiFiles );

  AnalysisDataUpdateResponse updateAnalysisData( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, AnalysisDataRequest request, List<String> deleteFileIds, List<String> deleteDatasetFileIds, List<String> deleteVdiFileIds, List<MultipartFile> files, List<MultipartFile> datasetFiles, List<MultipartFile> vdiFiles );

  AnalysisDataUpdateResponse updateAnalysisDataStatus( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, String asmtMetaRsltSttsCd );

  // 검토요청 전용: 상태를 REQUEST_REVIEW로 변경하고 알림/메일/참여기관 상태 동기화까지 수행
  AnalysisDataUpdateResponse sendReviewRequest( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn );

  // 검토요청 마감 전용: 검토완료(COMPLETED) 처리 + 의견 기반 상태 보정 + (META) 통합분석 동기화
  AnalysisDataUpdateResponse closeReview( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn );

  void createOpinion( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, String rsltGroupCd, OpinionRequest request );

  void updateOpinion( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, OpinionRequest request );

  List<InstitutionWithOpinionsResponse> searchOpinionList( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, String rsltGroupStcd, OpinionRequest request );

  boolean checkAllStatus( ResearchMemberVO memberAndInst, Long asmtSn );

  MetaAccessCheckResponse checkMetaAccess( ResearchMemberVO memberAndInst, Long asmtSn );

  List<OpinionListResponse> searchOpinionByExcluded( ResearchMemberVO memberAndInst, Long asmtSn, String instId );
}
