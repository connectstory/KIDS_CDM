package kr.or.kids.domain.cm.research.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.common.dto.CaFileItem;
import kr.or.kids.domain.cm.common.mapper.CommonAuthrtMapper;
import kr.or.kids.domain.cm.common.mapper.CommonFileMapper;
import kr.or.kids.domain.cm.common.service.CaFileUploadService;
import kr.or.kids.domain.cm.common.service.DecryptApiService;
import kr.or.kids.domain.cm.common.service.FileApiService;
import kr.or.kids.domain.cm.common.service.MailApiService;
import kr.or.kids.domain.cm.common.utils.EmailContentGenerator;
import kr.or.kids.domain.cm.common.vo.MemberAndInstVO;
import kr.or.kids.domain.cm.common.vo.TbCmMFileUldVO;
import kr.or.kids.domain.cm.common.vo.TbPpMEmpInfoVO;
import kr.or.kids.domain.cm.research.dto.AnalysisDataDetailResponse;
import kr.or.kids.domain.cm.research.dto.AnalysisDataRequest;
import kr.or.kids.domain.cm.research.dto.AnalysisDataResponse;
import kr.or.kids.domain.cm.research.dto.AnalysisDataUpdateResponse;
import kr.or.kids.domain.cm.research.dto.AsmtPersonResponse;
import kr.or.kids.domain.cm.research.dto.InstitutionWithOpinionsResponse;
import kr.or.kids.domain.cm.research.dto.MetaAccessCheckResponse;
import kr.or.kids.domain.cm.research.dto.OpinionItemResponse;
import kr.or.kids.domain.cm.research.dto.OpinionListResponse;
import kr.or.kids.domain.cm.research.dto.OpinionRequest;
import kr.or.kids.domain.cm.research.dto.OrgAnalysisDataResponse;
import kr.or.kids.domain.cm.research.dto.ResearchPartnerResponse;
import kr.or.kids.domain.cm.research.mapper.ResearchMapper;
import kr.or.kids.domain.cm.research.service.ResearchAnalysisService;
import kr.or.kids.domain.cm.research.type.AnalysisResultStatus;
import kr.or.kids.domain.cm.research.type.AnalysisTypeStatus;
import kr.or.kids.domain.cm.research.type.ResearchPartnerStatus;
import kr.or.kids.domain.cm.research.type.ResearchStatus;
import kr.or.kids.domain.cm.research.vo.OpinionListRowVO;
import kr.or.kids.domain.cm.research.vo.OrgPartnerLatestMetaVO;
import kr.or.kids.domain.cm.research.vo.ResearchAsmtDetailVO;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;
import kr.or.kids.domain.cm.research.vo.TbCmEAsmtMetaVO;
import kr.or.kids.domain.cm.research.vo.TbCmEOpnnVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtAccountVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtPrcpVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtVO;
import kr.or.kids.global.type.CdmUploadType;
import kr.or.kids.global.type.CmTaskCodeType;
import kr.or.kids.global.type.DeptCodeType;
import kr.or.kids.global.type.FileCodeType;
import kr.or.kids.global.type.KidsTaskCodeType;
import kr.or.kids.global.type.RoleType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResearchAnalysisServiceImpl implements ResearchAnalysisService {

  private final CommonAuthrtMapper commonAuthrtMapper;
  private final ResearchMapper researchMapper;
  private final CommonFileMapper commonFileMapper;
  private final FileApiService fileApiService;
  private final CaFileUploadService caFileUploadService;
  private final MailApiService mailApiService;
  private final EmailContentGenerator emailContentGenerator;
  private final DecryptApiService decryptApiService;

  private static final String DEPT_NO_REVIEW_DEPT1 = DeptCodeType.DRUG_ANALYSIS.code();
  private static final String DEPT_NO_REVIEW_DEPT2 = DeptCodeType.INFORMATION.code();

  /** 과제 계정 사용자 구분 (VDI/DB) */
  private static final String ASMT_USER_SE_VDI = "01";
  private static final String ASMT_USER_SE_DB = "02";

  /** 메타 접근 제한 코드 (API 응답) */
  private static final String META_ACCESS_CODE_EXCLUDED = "EXCLUDED";
  private static final String META_ACCESS_CODE_NOT_CONSENT = "NOT_CONSENT";

  /** 검증·예외 메시지 */
  private static final String MSG_ANALYSIS_DATA_NOT_FOUND = "분석 데이터를 찾을 수 없습니다.";
  private static final String MSG_ANALYSIS_DATA_NOT_FOUND_WITH_ID = "분석 데이터를 찾을 수 없습니다. id: ";
  private static final String MSG_ANALYSIS_NOT_FOUND_EN_ASMT_PREFIX = "Analysis data not found for asmtSn: ";
  private static final String MSG_NO_PERMISSION = "권한이 없습니다.";

  // 분석 데이터 목록 조회
  @Override
  public List<AnalysisDataResponse> searchAnalysisData( ResearchMemberVO memberAndInst, Long asmtSn, String rsltGroupStcd, String instId ) {
    // if (rsltGroupStcd.equals( AnalysisTypeStatus.ANALYSIS_ORG.code() )) {
    // instId = memberAndInst.getIsAdmin() ? null : memberAndInst.getPartner().getInstId();
    // }

    List<TbCmEAsmtMetaVO> vos = researchMapper.searchAnalysisData( asmtSn, rsltGroupStcd, instId );

    // SUBMITTED(01)인 경우 등록자 본인만 조회 가능 — 타인 등록 건은 목록에서 제외
    String currentMbrId = memberAndInst.getUserNo();
    if (vos == null) {
      return List.of();
    }

    return vos.stream().filter( vo -> !AnalysisResultStatus.SUBMITTED.code().equals( vo.getAsmtMetaRsltSttsCd() ) || Objects.equals( vo.getRgtrId(), currentMbrId ) ).map( vo -> {
      // 각 vo에 대한 의견 목록 조회
      List<TbCmEOpnnVO> opinionList = researchMapper.searchOpinionDetailList( vo.getAsmtSn(), vo.getAsmtMetaRsltSn(), null, rsltGroupStcd );
      return new AnalysisDataResponse( vo.getAsmtMetaRsltSn(), vo.getRsltGroupCd(), vo.getAsmtMetaRsltSttsCd(), vo.getRegDt(), opinionList, vo.getRsltNotiDt() );
    } ).collect( Collectors.toList() );
  }

  // 현황 기관 분석 데이터 목록 조회
  @Override
  public List<OrgAnalysisDataResponse> searchNonCdmPartnersWithLatestAnalysis( Long asmtSn, String rsltGroupStcd ) {
    List<OrgPartnerLatestMetaVO> rows = researchMapper.searchNonCdmPartnersWithLatestAnalysis( asmtSn, rsltGroupStcd );
    if (rows == null || rows.isEmpty()) {
      return List.of();
    }

    List<OrgAnalysisDataResponse> partners = new ArrayList<>( rows.size() );
    for (OrgPartnerLatestMetaVO row : rows) {
      OrgAnalysisDataResponse partner = OrgAnalysisDataResponse.fromPartnerRow( row );
      if (partner.getAsmtMetaRsltSn() != null) {
        List<TbCmEOpnnVO> opinionList = researchMapper.searchOpinionDetailList( asmtSn, partner.getAsmtMetaRsltSn(), null, rsltGroupStcd );
        partner.setOpinionList( opinionList );
      }
      partners.add( partner );
    }
    return partners;
  }

  // 최신 분석 데이터 상세 조회
  @Override
  public AnalysisDataDetailResponse findLatestAnalysisDataByAsmtSn( ResearchMemberVO memberAndInst, Long asmtSn, String rsltGroupStcd ) {
    if (AnalysisTypeStatus.ANALYSIS_CDM.code().equals( rsltGroupStcd )) {
      return findLatestAnalysisDataCdm( memberAndInst, asmtSn, rsltGroupStcd );
    } else if (AnalysisTypeStatus.ANALYSIS_ORG.code().equals( rsltGroupStcd )) {
      return findLatestAnalysisDataOrg( memberAndInst, asmtSn, rsltGroupStcd );
    } else if (AnalysisTypeStatus.ANALYSIS_META.code().equals( rsltGroupStcd )) {
      return findLatestAnalysisDataMeta( memberAndInst, asmtSn, rsltGroupStcd );
    }

    // CDM/ORG/META 외 타입(예: 분석 데이터셋)은 최신 상세 조회 미지원 — 필드 null·집계 0으로 빈 상세 반환
    return new AnalysisDataDetailResponse( null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0 );
  }

  // 분석 데이터 생성
  @Override
  public AnalysisDataResponse createAnalysisData( ResearchMemberVO memberAndInst, Long asmtSn, AnalysisDataRequest request, List<MultipartFile> files, List<MultipartFile> datasetFiles, List<MultipartFile> vdiFiles ) {
    // 결과그룹코드 검증
    String rsltGroupCd = request.getRsltGroupCd();
    if (rsltGroupCd == null || rsltGroupCd.trim().isEmpty()) {
      throw new IllegalArgumentException( "결과그룹코드는 필수입니다." );
    }

    TbCmEAsmtMetaVO vo = null;
    if (rsltGroupCd.equals( AnalysisTypeStatus.ANALYSIS_DATA.code() )) {
      vo = createAnalysisDataset( memberAndInst, request, asmtSn, datasetFiles, vdiFiles );
    } else if (rsltGroupCd.equals( AnalysisTypeStatus.ANALYSIS_CDM.code() )) {
      vo = createAnalysisCdm( memberAndInst, request, asmtSn, files );
    } else if (rsltGroupCd.equals( AnalysisTypeStatus.ANALYSIS_ORG.code() )) {
      vo = createAnalysisOrg( memberAndInst, request, asmtSn, files );
    } else if (rsltGroupCd.equals( AnalysisTypeStatus.ANALYSIS_META.code() )) {
      vo = createAnalysisMeta( memberAndInst, request, asmtSn, files );
    }
    if (vo == null) {
      throw new IllegalArgumentException( "분석 데이터 생성에 실패했습니다." );
    }

    Long asmtMetaRsltSn = vo.getAsmtMetaRsltSn();
    java.time.LocalDateTime regDt = vo.getRegDt();

    return new AnalysisDataResponse( asmtMetaRsltSn, rsltGroupCd, AnalysisResultStatus.SUBMITTED.code(), regDt, null, null );
  }

  // 분석 데이터 수정
  @Override
  public AnalysisDataUpdateResponse updateAnalysisData( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, AnalysisDataRequest request, List<String> deleteFileIds, List<String> deleteDatasetFileIds, List<String> deleteVdiFileIds, List<MultipartFile> files, List<MultipartFile> datasetFiles, List<MultipartFile> vdiFiles ) {
    String createBy = memberAndInst.getUserNo();

    TbCmEAsmtMetaVO vo = new TbCmEAsmtMetaVO();
    vo.setAsmtMetaRsltSn( asmtMetaRsltSn );
    vo.setAsmtSn( asmtSn );
    vo.setAsmtMetaRsltCn( request.getAsmtMetaRsltCn() );
    vo.setMdfrId( createBy );
    vo.setMdfcnDt( java.time.LocalDateTime.now() );
    researchMapper.updateAnalysisData( vo );

    String rsltGroupCd = request.getRsltGroupCd() != null ? request.getRsltGroupCd() : AnalysisTypeStatus.ANALYSIS_DATA.code();
    if (AnalysisTypeStatus.ANALYSIS_DATA.code().equals( rsltGroupCd )) {
      // 기존 파일 삭제 처리
      // - DATASET: 요구사항 예외로 전체 매핑을 soft delete (대체 업로드와 동일하게 처리)
      if (deleteDatasetFileIds != null && !deleteDatasetFileIds.isEmpty()) {
        softDeleteExistingUldMappings( asmtMetaRsltSn, FileCodeType.RESEARCH_ANALYSIS_DATASET.code(), createBy );
      }
      // - VDI: 삭제된 atchFileId만 soft delete (dataset처럼 전체 삭제 금지)
      if (deleteVdiFileIds != null && !deleteVdiFileIds.isEmpty()) {
        softDeleteUldMappingsByAtchFileIds( asmtMetaRsltSn, deleteVdiFileIds, createBy );
      }
      if (datasetFiles != null && !datasetFiles.isEmpty()) {
        softDeleteExistingUldMappings( asmtMetaRsltSn, FileCodeType.RESEARCH_ANALYSIS_DATASET.code(), createBy );
        for (MultipartFile file : datasetFiles) {
          caFileUploadService.uploadWithCaAndUld( asmtMetaRsltSn, null, List.of( file ), createBy, KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), FileCodeType.RESEARCH_ANALYSIS_DATASET.code() );
        }
      }
      if (vdiFiles != null && !vdiFiles.isEmpty()) {
        for (MultipartFile file : vdiFiles) {
          caFileUploadService.uploadWithCaAndUld( asmtMetaRsltSn, null, List.of( file ), createBy, KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), FileCodeType.RESEARCH_ANALYSIS_VDI.code() );
        }
      }
    } else {
      String fileCodeType = resolveAnalysisFileCodeType( rsltGroupCd );
      // 기존 파일 삭제 처리 (요구사항: softDeleteExistingUldMappings 사용 금지)
      if (fileCodeType != null && deleteFileIds != null && !deleteFileIds.isEmpty()) {
        softDeleteUldMappingsByAtchFileIds( asmtMetaRsltSn, deleteFileIds, createBy );
      }
      if (fileCodeType != null && files != null && !files.isEmpty()) {
        for (MultipartFile file : files) {
          caFileUploadService.uploadWithCaAndUld( asmtMetaRsltSn, null, List.of( file ), createBy, KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), fileCodeType );
        }
      }
    }

    return new AnalysisDataUpdateResponse( asmtMetaRsltSn );
  }

  // 분석 결과 파일을 "개별 삭제"할 때, 삭제된 atchFileId에 해당하는 업로드 매핑(tb_cm_m_file_uld)만 del_yn='Y'로 전환한다.
  private void softDeleteUldMappingsByAtchFileIds( Long pstSn, List<String> atchFileIds, String mdfrId ) {
    if (pstSn == null || atchFileIds == null || atchFileIds.isEmpty()) {
      return;
    }
    for (String atchFileId : atchFileIds) {
      if (atchFileId == null || atchFileId.isBlank()) {
        continue;
      }
      TbCmMFileUldVO delVo = new TbCmMFileUldVO();
      delVo.setPstSn( pstSn );
      delVo.setAtchFileId( atchFileId );
      delVo.setMdfrId( mdfrId );
      commonFileMapper.deleteFileUld( delVo );
    }
  }

  // 분석 데이터 상세 조회
  @Override
  public AnalysisDataDetailResponse findAnalysisDataById( ResearchMemberVO memberAndInst, Long asmtMetaRsltSn, String rsltGroupStcd ) {

    try {
      TbCmEAsmtMetaVO row = researchMapper.findAnalysisDataById( asmtMetaRsltSn, rsltGroupStcd );
      if (row == null) {
        throw new NoSuchElementException( MSG_ANALYSIS_DATA_NOT_FOUND_WITH_ID + asmtMetaRsltSn );
      }

      Long asmtMetaRsltSnValue = row.getAsmtMetaRsltSn();
      Long asmtSn = row.getAsmtSn();
      String asmtMetaRsltCn = row.getAsmtMetaRsltCn();
      String rsltGroupCdValue = row.getRsltGroupCd();
      String asmtMetaRsltSttsCd = row.getAsmtMetaRsltSttsCd();
      String rgtrId = row.getRgtrId();
      String instId = row.getInstBrno();
      LocalDateTime regDt = row.getRegDt();
      String mdfrId = row.getMdfrId();
      LocalDateTime mdfcnDt = row.getMdfcnDt();
      String mbrEncptFlnm = resolveDisplayName( row.getMbrEncptFlnm(), row.getEmpNm() );
      LocalDateTime rsltNotiDt = row.getRsltNotiDt();

      // 검토 요청 상태인 경우 진행중으로 변경
      if (AnalysisResultStatus.REQUEST_REVIEW.code().equals( asmtMetaRsltSttsCd )) {
        if (AnalysisTypeStatus.ANALYSIS_DATA.code().equals( rsltGroupCdValue )) {
          if (RoleType.ADMIN.code().equals( memberAndInst.getUserType() )) {
            asmtMetaRsltSttsCd = AnalysisResultStatus.INPROGRESS_REVIEW_DEPT1.code();
            updateAnalysisDataStatus( memberAndInst, asmtSn, asmtMetaRsltSnValue, asmtMetaRsltSttsCd );
          }
        } else if (AnalysisTypeStatus.ANALYSIS_CDM.code().equals( rsltGroupCdValue ) || AnalysisTypeStatus.ANALYSIS_META.code().equals( rsltGroupCdValue )) {
          if (memberAndInst.getPartner() != null) {
            asmtMetaRsltSttsCd = AnalysisResultStatus.INPROGRESS_REVIEW.code();
            updateAnalysisDataStatus( memberAndInst, asmtSn, asmtMetaRsltSnValue, asmtMetaRsltSttsCd );
          }
        } else if (AnalysisTypeStatus.ANALYSIS_ORG.code().equals( rsltGroupCdValue )) {
          if (memberAndInst.getPartner() == null) {
            asmtMetaRsltSttsCd = AnalysisResultStatus.INPROGRESS_REVIEW.code();
            updateAnalysisDataStatus( memberAndInst, asmtSn, asmtMetaRsltSnValue, asmtMetaRsltSttsCd );
          }
        }
      }

      // 파일 목록 조회
      List<CaFileItem> fileList;
      String asmtUserFlnm01 = null;
      String asmtUserFlnm02 = null;
      if (rsltGroupCdValue.equals( AnalysisTypeStatus.ANALYSIS_DATA.code() )) {
        fileList = new ArrayList<>();
        fileList.addAll( loadAnalysisFiles( asmtMetaRsltSnValue, FileCodeType.RESEARCH_ANALYSIS_DATASET.code() ) );
        fileList.addAll( loadAnalysisFiles( asmtMetaRsltSnValue, FileCodeType.RESEARCH_ANALYSIS_VDI.code() ) );

        TbCmMAsmtAccountVO vdiAccount = researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSn, ASMT_USER_SE_VDI );
        TbCmMAsmtAccountVO dbAccount = researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSn, ASMT_USER_SE_DB );
        asmtUserFlnm01 = vdiAccount != null ? vdiAccount.getAsmtUserFlnm() : null;
        asmtUserFlnm02 = dbAccount != null ? dbAccount.getAsmtUserFlnm() : null;
      } else {
        String fileCodeType = resolveAnalysisFileCodeType( rsltGroupCdValue );
        fileList = loadAnalysisFiles( asmtMetaRsltSnValue, fileCodeType );
      }

      // 의견 목록 조회
      List<TbCmEOpnnVO> opinionList = null;
      if (AnalysisTypeStatus.ANALYSIS_DATA.code().equals( rsltGroupCdValue )) {
        opinionList = researchMapper.searchOpinionDetailList( asmtSn, asmtMetaRsltSnValue, null, rsltGroupCdValue );
      } else {
        opinionList = new ArrayList<>();
        TbCmEOpnnVO opinionRow = researchMapper.findOpinionByAsmtMetaRsltSnAndInstId( asmtMetaRsltSnValue, memberAndInst.getInstBrno() );
        if (opinionRow != null) {
          enrichOpinionDisplayName( opinionRow );
          opinionList.add( opinionRow );
        }
      }

      // 검토할 전체 기관 개수
      int totalVotePartnerCount = 0;
      if (AnalysisTypeStatus.ANALYSIS_META.code().equals( rsltGroupCdValue )) {
        totalVotePartnerCount = computeTotalVotePartnerCountForMeta( asmtSn, asmtMetaRsltSnValue );
      } else if (AnalysisTypeStatus.ANALYSIS_CDM.code().equals( rsltGroupCdValue )) {
        totalVotePartnerCount = computeTotalVotePartnerCount( asmtSn, rsltGroupCdValue );
      }

      return new AnalysisDataDetailResponse( asmtMetaRsltSnValue, asmtSn, asmtMetaRsltCn, asmtMetaRsltSttsCd, rsltGroupCdValue, rgtrId, instId, regDt, mdfrId, mdfcnDt, mbrEncptFlnm, null, opinionList, rsltNotiDt, fileList, asmtUserFlnm01, asmtUserFlnm02, totalVotePartnerCount );

    } catch (NoSuchElementException e) {
      throw e;
    }
  }

  // 분석 데이터 상태 수정
  @Override
  public AnalysisDataUpdateResponse updateAnalysisDataStatus( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, String asmtMetaRsltSttsCd ) {

    TbCmEAsmtMetaVO analysisDataDetail = researchMapper.findAnalysisDataById( asmtMetaRsltSn, null );
    if (analysisDataDetail == null) {
      throw new IllegalArgumentException( MSG_ANALYSIS_DATA_NOT_FOUND );
    }

    String rsltGroupCd = analysisDataDetail.getRsltGroupCd();

    applyAnalysisDataStatusUpdate( memberAndInst, asmtSn, asmtMetaRsltSn, asmtMetaRsltSttsCd, rsltGroupCd );
    return new AnalysisDataUpdateResponse( asmtMetaRsltSn );
  }

  // 검토 요청 전용
  @Override
  public AnalysisDataUpdateResponse sendReviewRequest( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn ) {
    // 분석 데이터 존재 여부 확인
    TbCmEAsmtMetaVO analysisDataDetail = researchMapper.findAnalysisDataById( asmtMetaRsltSn, null );
    if (analysisDataDetail == null) {
      throw new IllegalArgumentException( MSG_ANALYSIS_DATA_NOT_FOUND );
    }

    String rsltGroupCd = analysisDataDetail.getRsltGroupCd();

    // 검토요청 상태로 변경 시 결과알림일자 설정
    TbCmEAsmtMetaVO vo = new TbCmEAsmtMetaVO();
    vo.setAsmtMetaRsltSn( asmtMetaRsltSn );
    vo.setAsmtSn( asmtSn );
    vo.setRsltNotiDt( LocalDateTime.now() );
    vo.setMdfrId( memberAndInst.getUserNo() );
    vo.setMdfcnDt( LocalDateTime.now() );
    researchMapper.updateAnalysisData( vo );

    String asmtMetaRsltSttsCd = AnalysisResultStatus.REQUEST_REVIEW.code();

    // 분석 데이터일 경우
    if (AnalysisTypeStatus.ANALYSIS_DATA.code().equals( rsltGroupCd )) {
      if (RoleType.ADMIN.code().equals( memberAndInst.getUserType() )) {
        requestReviewDataDept2( memberAndInst, asmtSn, asmtMetaRsltSn );
        asmtMetaRsltSttsCd = AnalysisResultStatus.INPROGRESS_REVIEW_DEPT2.code();
      } else {
        requestReviewData( memberAndInst, asmtSn, asmtMetaRsltSn );
      }
    }
    // 통합분석일 경우(CDM)
    else if (AnalysisTypeStatus.ANALYSIS_CDM.code().equals( rsltGroupCd )) {
      requestReviewCdm( memberAndInst, asmtSn, asmtMetaRsltSn );
    }
    // 기관분석일 경우
    else if (AnalysisTypeStatus.ANALYSIS_ORG.code().equals( rsltGroupCd )) {
      String orgInstId = analysisDataDetail.getInstBrno();
      requestReviewOrg( memberAndInst, asmtSn, asmtMetaRsltSn, orgInstId );
    }
    // 메타분석일 경우
    else if (AnalysisTypeStatus.ANALYSIS_META.code().equals( rsltGroupCd )) {
      requestReviewMeta( memberAndInst, asmtSn, asmtMetaRsltSn );
    }

    // updateAnalysisDataStatus 내부에서 rsltGroupCd는 분석 데이터 상세에서 조회하므로, 여기서는 상태코드만 지정합니다.
    return updateAnalysisDataStatus( memberAndInst, asmtSn, asmtMetaRsltSn, asmtMetaRsltSttsCd );
  }

  // 검토 요청 마감 전용 (CDM, 메타분석 경우)
  @Override
  public AnalysisDataUpdateResponse closeReview( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn ) {

    TbCmEAsmtMetaVO analysisDataDetail = researchMapper.findAnalysisDataById( asmtMetaRsltSn, null );
    if (analysisDataDetail == null) {
      throw new IllegalArgumentException( MSG_ANALYSIS_DATA_NOT_FOUND );
    }

    String rsltGroupCd = analysisDataDetail.getRsltGroupCd();

    List<TbCmEOpnnVO> opinions = Collections.emptyList();
    opinions = researchMapper.searchOpinionDetailList( asmtSn, asmtMetaRsltSn, null, rsltGroupCd );

    String finalStatus = resolveStatusByOpinions( AnalysisResultStatus.COMPLETED.code(), opinions );
    applyAnalysisDataStatusUpdate( memberAndInst, asmtSn, asmtMetaRsltSn, finalStatus, rsltGroupCd );

    if (AnalysisTypeStatus.ANALYSIS_CDM.code().equals( rsltGroupCd )) {
      applyAnalysisDataStatusUpdate( memberAndInst, asmtSn, asmtMetaRsltSn, finalStatus, rsltGroupCd );
    } else if (AnalysisTypeStatus.ANALYSIS_META.code().equals( rsltGroupCd )) {
      syncIntegratedAnalysisNotConsentIfMetaOpinionFromCdm( asmtSn, opinions, memberAndInst.getUserNo() );
    }

    return new AnalysisDataUpdateResponse( asmtMetaRsltSn );
  }

  // 의견 등록
  @Override
  @Transactional(rollbackFor = Exception.class)
  public void createOpinion( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, String rsltGroupCd, OpinionRequest request ) {
    String createBy = memberAndInst.getUserNo();
    String instBrno = memberAndInst.getInstBrno();

    // 의견 구분(rsltGroupCd) 확정 (파라미터 비어 있으면 meta 조회로 판별)
    String rsltGroupCdValue = rsltGroupCd;
    if (rsltGroupCd == null || rsltGroupCd.trim().isEmpty()) {
      TbCmEAsmtMetaVO analysisData = researchMapper.findAnalysisDataById( asmtMetaRsltSn, null );
      if (analysisData == null) {
        throw new IllegalArgumentException( MSG_ANALYSIS_DATA_NOT_FOUND );
      }
      rsltGroupCdValue = analysisData.getRsltGroupCd();
    }

    // 분석데이터셋 제외 나머지 의견 등록에서 중복 등록 체크
    // 중복 체크: asmtMetaRsltSn과 instBrno 이미 등록된 의견이 있는지 확인
    if (!AnalysisTypeStatus.ANALYSIS_DATA.code().equals( rsltGroupCdValue )) {
      int existingCount = researchMapper.countOpinionByAsmtMetaRsltSnAndInstId( asmtMetaRsltSn, instBrno );
      if (existingCount > 0) {
        throw new IllegalArgumentException( "이미 검토가 등록되었습니다." );
      }
    }

    // 의견 등록
    TbCmEOpnnVO vo = TbCmEOpnnVO.create( asmtSn, asmtMetaRsltSn, request.getOpnnIntgDmndCn(), request.getUtlzAgreSeCd(), instBrno, createBy );
    applyOpinionUtlzAndAsmtFromRequest( vo, request );
    researchMapper.insertOpinion( vo );

    if (AnalysisTypeStatus.ANALYSIS_DATA.code().equals( rsltGroupCdValue )) {
      applyCreateOpinionSideEffectsForDataset( memberAndInst, asmtSn, asmtMetaRsltSn, rsltGroupCdValue, request );
    } else if (AnalysisTypeStatus.ANALYSIS_CDM.code().equals( rsltGroupCdValue )) {
      applyCreateOpinionSideEffectsForCdm( asmtSn, null, instBrno, createBy );
    } else if (AnalysisTypeStatus.ANALYSIS_ORG.code().equals( rsltGroupCdValue )) {
      applyCreateOpinionSideEffectsForOrg( memberAndInst, asmtSn, asmtMetaRsltSn, rsltGroupCdValue, request );
    } else if (AnalysisTypeStatus.ANALYSIS_META.code().equals( rsltGroupCdValue )) {
      applyCreateOpinionSideEffectsForMeta( asmtSn, null, instBrno, createBy );
    } else {
      throw new IllegalArgumentException( "유효하지 않은 분석 데이터 유형입니다." );
    }

  }

  // 의견 수정
  @Override
  public void updateOpinion( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, OpinionRequest request ) {

    // 분석 데이터 존재 여부 확인
    TbCmEAsmtMetaVO analysisDataDetail = researchMapper.findAnalysisDataById( asmtMetaRsltSn, null );
    if (analysisDataDetail == null) {
      throw new IllegalArgumentException( MSG_ANALYSIS_DATA_NOT_FOUND );
    }

    // 기존 의견 조회
    String instId = memberAndInst.getInstBrno();
    TbCmEOpnnVO existingOpinion = researchMapper.findOpinionByAsmtMetaRsltSnAndInstId( asmtMetaRsltSn, instId );
    if (existingOpinion == null) {
      throw new IllegalArgumentException( "수정할 의견을 찾을 수 없습니다." );
    }

    Long opnnIntgRsltSn = existingOpinion.getOpnnIntgRsltSn();

    TbCmEOpnnVO vo = new TbCmEOpnnVO();
    vo.setOpnnIntgRsltSn( opnnIntgRsltSn );
    vo.setOpnnIntgDmndCn( request.getOpnnIntgDmndCn() );
    vo.setMdfrId( memberAndInst.getUserNo() );
    vo.setMdfcnDt( LocalDateTime.now() );
    applyOpinionUtlzAndAsmtFromRequest( vo, request );
    // 의견의 상태가 NOT_REGISTERED면 등록자(reg_id)도 수정
    if (Objects.equals( existingOpinion.getUtlzAgreSeCd(), AnalysisResultStatus.NOT_REGISTERED.code() )) {
      vo.setRgtrId( memberAndInst.getUserNo() );
    }

    researchMapper.updateOpinion( vo );

    String rsltGroupCdForUpdate = analysisDataDetail.getRsltGroupCd();
    String asmtMetaRsltSttsCd = analysisDataDetail.getAsmtMetaRsltSttsCd();

    if (AnalysisTypeStatus.ANALYSIS_DATA.code().equals( rsltGroupCdForUpdate )) {
      String deptNo = memberAndInst.getDeptNo();
      if (AnalysisResultStatus.INPROGRESS_REVIEW_DEPT1.code().equals( asmtMetaRsltSttsCd )) {
        if (!DEPT_NO_REVIEW_DEPT1.equals( deptNo )) {
          throw new IllegalArgumentException( MSG_NO_PERMISSION );
        }
        updateAnalysisDataStatus( memberAndInst, asmtSn, asmtMetaRsltSn, AnalysisResultStatus.INPROGRESS_REVIEW_DEPT2.code() );
      } else if (AnalysisResultStatus.INPROGRESS_REVIEW_DEPT2.code().equals( asmtMetaRsltSttsCd )) {
        if (!DEPT_NO_REVIEW_DEPT2.equals( deptNo )) {
          throw new IllegalArgumentException( MSG_NO_PERMISSION );
        }
        updateAnalysisDataStatus( memberAndInst, asmtSn, asmtMetaRsltSn, effectiveAnalysisResultStatusFromRequest( request ) );
      } else if (asmtMetaRsltSttsCd.equals( AnalysisResultStatus.REQUEST_REVIEW.code() ) || asmtMetaRsltSttsCd.equals( AnalysisResultStatus.INPROGRESS_REVIEW.code() )) {
        updateAnalysisDataStatus( memberAndInst, asmtSn, asmtMetaRsltSn, effectiveAnalysisResultStatusFromRequest( request ) );
      }
    } else if (AnalysisTypeStatus.ANALYSIS_ORG.code().equals( rsltGroupCdForUpdate )) {
      if (AnalysisResultStatus.REQUEST_REVIEW.code().equals( asmtMetaRsltSttsCd ) || AnalysisResultStatus.INPROGRESS_REVIEW.code().equals( asmtMetaRsltSttsCd )) {
        updateAnalysisDataStatus( memberAndInst, asmtSn, asmtMetaRsltSn, effectiveAnalysisResultStatusFromRequest( request ) );
      }
    } else if (AnalysisTypeStatus.ANALYSIS_CDM.code().equals( rsltGroupCdForUpdate )) {
      String partnerPrgrsStatusCd = null;
      if (AnalysisResultStatus.COMPLETED.code().equals( vo.getUtlzAgreSeCd() )) {
        partnerPrgrsStatusCd = ResearchPartnerStatus.INSTITUTION_ANALYSIS_REVIEW_COMPLETED.code();
      } else if (AnalysisResultStatus.REQUEST_MODIFY.code().equals( vo.getUtlzAgreSeCd() )) {
        partnerPrgrsStatusCd = ResearchPartnerStatus.INSTITUTION_ANALYSIS_MODIFY_REQUEST.code();
      }

      applyCreateOpinionSideEffectsForCdm( asmtSn, partnerPrgrsStatusCd, instId, memberAndInst.getUserNo() );
    } else if (AnalysisTypeStatus.ANALYSIS_META.code().equals( rsltGroupCdForUpdate )) {
      String partnerPrgrsStatusCd = null;
      if (AnalysisResultStatus.COMPLETED.code().equals( vo.getUtlzAgreSeCd() )) {
        partnerPrgrsStatusCd = ResearchPartnerStatus.RESEARCH_RESULT_REVIEW_COMPLETED.code();
      } else if (AnalysisResultStatus.REQUEST_MODIFY.code().equals( vo.getUtlzAgreSeCd() )) {
        partnerPrgrsStatusCd = ResearchPartnerStatus.RESEARCH_RESULT_MODIFY_REQUEST.code();
      }

      applyCreateOpinionSideEffectsForMeta( asmtSn, partnerPrgrsStatusCd, instId, memberAndInst.getUserNo() );
    }
  }

  // 의견 목록 조회
  @Override
  public List<InstitutionWithOpinionsResponse> searchOpinionList( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, String rsltGroupStcd, OpinionRequest request ) {
    if (rsltGroupStcd.equals( AnalysisTypeStatus.ANALYSIS_CDM.code() ) || rsltGroupStcd.equals( AnalysisTypeStatus.ANALYSIS_META.code() )) {
      return searchCdmMetaOpinionList( memberAndInst, asmtSn, asmtMetaRsltSn, rsltGroupStcd );
    } else {
      return searchOpinionList( memberAndInst, asmtSn, asmtMetaRsltSn );
    }
  }

  // 의견 목록 조회 (CDM, 메타)
  @Override
  public List<OpinionListResponse> searchOpinionByExcluded( ResearchMemberVO memberAndInst, Long asmtSn, String instId ) {
    List<OpinionListRowVO> rows = researchMapper.searchOpinionByUtlzAgreSeCd( asmtSn, instId, AnalysisResultStatus.EXCLUDED.code() );
    if (rows == null || rows.isEmpty()) {
      return List.of();
    }

    List<OpinionListResponse> out = new ArrayList<>( rows.size() );
    for (OpinionListRowVO r : rows) {
      String mdfrNm = r.getMdfrNm();
      if (mdfrNm != null && !mdfrNm.isBlank()) {
        mdfrNm = decryptApiService.decryptMbrFlnm( mdfrNm );
      }
      out.add( OpinionListResponse.fromRow( r, mdfrNm ) );
    }
    return out;
  }

  // 연구과제 진행 가능 여부 확인
  @Override
  public boolean checkAllStatus( ResearchMemberVO memberAndInst, Long asmtSn ) {
    // rsltGroupStcd='02'(CDM) 최신 1개 조회
    TbCmEAsmtMetaVO latestCDMAnalysis = researchMapper.findLatestMetaAnalysisForStatusCheck( asmtSn );

    // rsltGroupStcd='03'(기관) 참여기관별 최신 데이터 조회// 참여기관 조회
    List<ResearchPartnerResponse> partners = researchMapper.searchPartners( asmtSn, ResearchPartnerStatus.PARTICIPATING.code(), null ).stream().map( ResearchPartnerResponse::from ).collect( Collectors.toList() );
    // 미참여 제외
    partners = partners.stream().filter( partner -> !ResearchPartnerStatus.NOT_PARTICIPATING.code().equals( partner.getPtcpPrgrsSttsCd() ) ).collect( Collectors.toList() );
    List<ResearchPartnerResponse> cdmPartners = partners.stream().filter( partner -> CdmUploadType.CDM.code().equals( partner.getUldTypeCd() ) ).collect( Collectors.toList() );
    List<ResearchPartnerResponse> orgPartners = partners.stream().filter( partner -> !CdmUploadType.CDM.code().equals( partner.getUldTypeCd() ) ).collect( Collectors.toList() );
    List<TbCmEAsmtMetaVO> latestOrgAnalysisList = researchMapper.findLatestOrgAnalysisForStatusCheck( asmtSn );

    Boolean isCDMCompleted = false;
    Boolean isOrgCompleted = false;

    if (latestCDMAnalysis != null) {
      if (AnalysisResultStatus.COMPLETED.code().equals( latestCDMAnalysis.getAsmtMetaRsltSttsCd() )) {
        isCDMCompleted = true;
      }
    } else if (cdmPartners.size() == 0) {
      isCDMCompleted = true;
    }

    if (latestOrgAnalysisList != null) {
      int orgCompletedCount = 0;
      for (TbCmEAsmtMetaVO analysisData : latestOrgAnalysisList) {
        if (AnalysisResultStatus.COMPLETED.code().equals( analysisData.getAsmtMetaRsltSttsCd() )) {
          orgCompletedCount++;
        }
      }

      if (orgCompletedCount == orgPartners.size()) {
        isOrgCompleted = true;
      }
    }

    return (isCDMCompleted && isOrgCompleted);
  }

  // 메타분석 접근 가능 여부 체크
  @Override
  public MetaAccessCheckResponse checkMetaAccess( ResearchMemberVO memberAndInst, Long asmtSn ) {
    if (RoleType.ADMIN.code().equals( memberAndInst.getUserType() )) {
      return new MetaAccessCheckResponse( true, null );
    }

    String instId = memberAndInst.getInstBrno();
    if (instId == null || instId.isBlank()) {
      return new MetaAccessCheckResponse( true, null );
    }

    boolean isExcluded = !researchMapper.searchOpinionByUtlzAgreSeCd( asmtSn, instId, AnalysisResultStatus.EXCLUDED.code() ).isEmpty();
    if (isExcluded) {
      return new MetaAccessCheckResponse( false, META_ACCESS_CODE_EXCLUDED );
    }

    boolean isNotConsent = !researchMapper.searchOpinionByAsmtOpnnStatus( asmtSn, instId, AnalysisResultStatus.NOT_CONSENT.code() ).isEmpty();
    if (isNotConsent) {
      return new MetaAccessCheckResponse( false, META_ACCESS_CODE_NOT_CONSENT );
    }

    return new MetaAccessCheckResponse( true, null );
  }

  // Private ########################################################################################################

  // 이름 복호화
  private String resolveDisplayName( String mbrEncptFlnm, String empNm ) {
    if (mbrEncptFlnm != null && !mbrEncptFlnm.isBlank()) {
      return decryptApiService.decryptMbrFlnm( mbrEncptFlnm );
    }
    return empNm;
  }

  // 의견 이름 복호화
  private void enrichOpinionDisplayName( TbCmEOpnnVO opinion ) {
    if (opinion == null) {
      return;
    }
    opinion.setMbrEncptFlnm( resolveDisplayName( opinion.getMbrEncptFlnm(), opinion.getEmpNm() ) );
  }

  // 분석 파일 코드 타입 결정
  private String resolveAnalysisFileCodeType( String rsltGroupCd ) {
    if (AnalysisTypeStatus.ANALYSIS_DATA.code().equals( rsltGroupCd )) {
      return FileCodeType.RESEARCH_ANALYSIS_DATASET.code();
    }
    if (AnalysisTypeStatus.ANALYSIS_CDM.code().equals( rsltGroupCd )) {
      return FileCodeType.RESEARCH_ANALYSIS_CDM.code();
    }
    if (AnalysisTypeStatus.ANALYSIS_ORG.code().equals( rsltGroupCd )) {
      return FileCodeType.RESEARCH_ANALYSIS_ORG.code();
    }
    if (AnalysisTypeStatus.ANALYSIS_META.code().equals( rsltGroupCd )) {
      return FileCodeType.RESEARCH_ANALYSIS_META.code();
    }
    return null;
  }

  // 메타분석에서 제외할 기관(결과제외 + 활용미동의) 목록
  private Set<String> collectMetaExcludedInstIds( Long asmtSn ) {
    Set<String> excludedInstIds = researchMapper.searchOpinionByUtlzAgreSeCd( asmtSn, null, AnalysisResultStatus.EXCLUDED.code() ).stream().map( OpinionListRowVO::getInstId ).filter( Objects::nonNull ).collect( Collectors.toSet() );

    Set<String> notConsentInstIds = researchMapper.searchOpinionByAsmtOpnnStatus( asmtSn, null, AnalysisResultStatus.NOT_CONSENT.code() ).stream().map( OpinionListRowVO::getInstId ).filter( Objects::nonNull ).collect( Collectors.toSet() );

    excludedInstIds.addAll( notConsentInstIds );
    return excludedInstIds;
  }

  // VDI/DB 계정 중 아직 어떤 과제에도 매핑되지 않은 계정에서 vdi, db 타입별로 한 건씩 선택하여 현재 과제(asmtSn)에 매핑
  private boolean assignVdiAccountsForAsmt( Long asmtSn ) {
    TbCmMAsmtAccountVO existingVdi = researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSn, ASMT_USER_SE_VDI );
    TbCmMAsmtAccountVO existingDb = researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSn, ASMT_USER_SE_DB );
    if (existingVdi != null || existingDb != null) {
      return true;
    }

    List<TbCmMAsmtAccountVO> accounts = researchMapper.selectUnassignedAsmtAccountsForAssign();
    if (accounts == null || accounts.isEmpty()) {
      return false;
    }

    TbCmMAsmtAccountVO vdiAccount = null;
    TbCmMAsmtAccountVO dbAccount = null;
    for (TbCmMAsmtAccountVO account : accounts) {
      if (account.getAsmtSn() != null) {
        continue;
      }
      String typeCode = account.getUserSeCd();
      if (ASMT_USER_SE_VDI.equals( typeCode ) && vdiAccount == null) {
        vdiAccount = account;
      } else if (ASMT_USER_SE_DB.equals( typeCode ) && dbAccount == null) {
        dbAccount = account;
      }

      if (vdiAccount != null && dbAccount != null) {
        break;
      }
    }

    if (vdiAccount != null) {
      researchMapper.assignAsmtSnToAccount( vdiAccount.getAsmtUserInfoSn(), asmtSn );
    }
    if (dbAccount != null) {
      researchMapper.assignAsmtSnToAccount( dbAccount.getAsmtUserInfoSn(), asmtSn );
    }

    return true;
  }

  // CDM·메타 분석에서 검토 대상 참여기관 수 (그 외 유형은 0)
  private int computeTotalVotePartnerCount( Long asmtSn, String rsltGroupCd ) {
    List<TbCmMAsmtPrcpVO> partners = researchMapper.findActivePartnersByAsmtSn( asmtSn );
    partners = partners.stream().filter( p -> CdmUploadType.CDM.code().equals( p.getUldTypeCd() ) ).collect( Collectors.toList() );
    return partners.size();
  }

  // CDM·메타 분석에서 검토 대상 참여기관 수 (그 외 유형은 0)
  private int computeTotalVotePartnerCountForMeta( Long asmtSn, Long asmtMetaRsltSn ) {
    List<TbCmEOpnnVO> opinions = researchMapper.searchOpinionDetailList( asmtSn, asmtMetaRsltSn, null, AnalysisTypeStatus.ANALYSIS_META.code() );
    return opinions.size();
  }

  // 분석 파일 목록 조회
  private List<CaFileItem> loadAnalysisFiles( Long asmtMetaRsltSn, String fileCodeType ) {
    if (asmtMetaRsltSn == null || fileCodeType == null || fileCodeType.isBlank()) {
      return Collections.emptyList();
    }
    List<TbCmMFileUldVO> uldList = commonFileMapper.selectFileUldList( asmtMetaRsltSn, CmTaskCodeType.RESEARCH.code(), fileCodeType );
    return collectCaFileItems( uldList );
  }

  // 분석 결과 파일을 "대체 업로드"할 때, 기존 업로드 매핑(tb_cm_m_file_uld)을 del_yn='Y'로 전환한다. 실제 파일( CA ) 물리 삭제는 하지 않고, 조회에서 제외되도록 처리한다.
  private void softDeleteExistingUldMappings( Long pstSn, String fileSeCd, String mdfrId ) {
    if (pstSn == null || fileSeCd == null || fileSeCd.isBlank()) {
      return;
    }
    List<TbCmMFileUldVO> existing = commonFileMapper.selectFileUldList( pstSn, CmTaskCodeType.RESEARCH.code(), fileSeCd );
    if (existing == null || existing.isEmpty()) {
      return;
    }
    for (TbCmMFileUldVO uld : existing) {
      if (uld == null) {
        continue;
      }
      String atchFileId = uld.getAtchFileId();
      if (atchFileId == null || atchFileId.isBlank()) {
        continue;
      }
      TbCmMFileUldVO delVo = new TbCmMFileUldVO();
      delVo.setPstSn( pstSn );
      delVo.setAtchFileId( atchFileId );
      delVo.setMdfrId( mdfrId );
      commonFileMapper.deleteFileUld( delVo );
    }
  }

  // CaFileItem 목록 수집
  private List<CaFileItem> collectCaFileItems( List<TbCmMFileUldVO> uldList ) {
    if (uldList == null || uldList.isEmpty()) {
      return Collections.emptyList();
    }
    List<kr.or.kids.domain.cm.common.dto.CaFileItem> result = new ArrayList<>();
    for (TbCmMFileUldVO uld : uldList) {
      String groupId = uld.getAtchFileId();
      if (groupId == null || groupId.isBlank()) {
        continue;
      }
      result.addAll( FileApiService.toCaFileItemsFromCa( fileApiService, groupId ) );
    }
    return result;
  }

  // 결과제외는 {@code asmt_opnn_stts_cd = 08}, 검토완료는 {@code utlz_agre_se_cd = 06}로 정규화한다. 레거시 요청({@code utlz = 08}만 전달)도 동일하게
  // 맞춘다
  private void applyOpinionUtlzAndAsmtFromRequest( TbCmEOpnnVO vo, OpinionRequest request ) {
    String asmt = request.getAsmtOpnnSttsCd();
    String utlz = request.getUtlzAgreSeCd();
    boolean excludedByAsmt = asmt != null && !asmt.isBlank() && AnalysisResultStatus.EXCLUDED.code().equals( asmt );
    boolean legacyExcluded = !excludedByAsmt && (asmt == null || asmt.isBlank()) && AnalysisResultStatus.EXCLUDED.code().equals( utlz );
    if (excludedByAsmt || legacyExcluded) {
      vo.setUtlzAgreSeCd( AnalysisResultStatus.COMPLETED.code() );
      vo.setAsmtOpnnSttsCd( AnalysisResultStatus.EXCLUDED.code() );
      return;
    }
    vo.setUtlzAgreSeCd( utlz );
    if (asmt != null && !asmt.isBlank()) {
      vo.setAsmtOpnnSttsCd( asmt );
    }
  }

  // 분석 메타/기관 결과 상태·부가효과에 쓸 의견의 유효 결과 코드 (결과제외는 asmt 또는 레거시 utlz 기준).
  private String effectiveAnalysisResultStatusFromRequest( OpinionRequest request ) {
    String asmt = request.getAsmtOpnnSttsCd();
    if (asmt != null && !asmt.isBlank() && AnalysisResultStatus.EXCLUDED.code().equals( asmt )) {
      return AnalysisResultStatus.EXCLUDED.code();
    }
    if (AnalysisResultStatus.EXCLUDED.code().equals( request.getUtlzAgreSeCd() )) {
      return AnalysisResultStatus.EXCLUDED.code();
    }
    return request.getUtlzAgreSeCd();
  }

  // 검토의견 기반 상태 보정 (EXCLUDED 우선, 없으면 REQUEST_MODIFY, 그 외 기존 상태 유지)
  private String resolveStatusByOpinions( String currentStatus, List<TbCmEOpnnVO> opinions ) {
    if (currentStatus == null) {
      return null;
    }
    if (!AnalysisResultStatus.COMPLETED.code().equals( currentStatus ) || opinions == null || opinions.isEmpty()) {
      return currentStatus;
    }

    boolean hasRequestModify = false;
    for (TbCmEOpnnVO opinion : opinions) {
      String agreeCode = opinion.getUtlzAgreSeCd();
      String asmtOpnnSttsCd = opinion.getAsmtOpnnSttsCd();
      if (AnalysisResultStatus.NOT_CONSENT.code().equals( asmtOpnnSttsCd )) {
        return AnalysisResultStatus.NOT_CONSENT.code();
      }
      if (AnalysisResultStatus.EXCLUDED.code().equals( asmtOpnnSttsCd )) {
        return AnalysisResultStatus.EXCLUDED.code();
      }
      if (AnalysisResultStatus.EXCLUDED.code().equals( agreeCode )) {
        return AnalysisResultStatus.EXCLUDED.code();
      }
      if (AnalysisResultStatus.REQUEST_MODIFY.code().equals( agreeCode )) {
        hasRequestModify = true;
      }
    }

    return hasRequestModify ? AnalysisResultStatus.REQUEST_MODIFY.code() : currentStatus;
  }

  // 의견 활용 미동의 여부 확인
  private static boolean isOpinionUtilizationNonConsent( TbCmEOpnnVO opinion ) {
    if (opinion == null) {
      return false;
    }
    String asmtOpnnSttsCd = opinion.getAsmtOpnnSttsCd();
    return "02".equals( asmtOpnnSttsCd ) || AnalysisResultStatus.NOT_CONSENT.code().equals( asmtOpnnSttsCd );
  }

  // 분석 등록 ########################################################################################################

  private TbCmEAsmtMetaVO createAnalysisDataset( ResearchMemberVO memberAndInst, AnalysisDataRequest request, Long asmtSn, List<MultipartFile> datasetFiles, List<MultipartFile> vdiFiles ) {
    // 검토 상태(01, 02, 03)가 아닌 분석 데이터가 존재하는지 확인
    int notInReviewStatusCount = researchMapper.countAnalysisDataNotInReviewStatus( asmtSn, AnalysisTypeStatus.ANALYSIS_DATA.code(), null );
    if (notInReviewStatusCount > 0) {
      throw new IllegalArgumentException( "검토요청 중인 분석 데이터가 존재 합니다." );
    }

    String asmtMetaRsltSttsCd = AnalysisResultStatus.SUBMITTED.code();
    // if (RoleType.ADMIN.code().equals( memberAndInst.getUserType() )) {
    // asmtMetaRsltSttsCd = AnalysisResultStatus.INPROGRESS_REVIEW_DEPT2.code();
    // }

    TbCmEAsmtMetaVO vo = TbCmEAsmtMetaVO.create( asmtSn, request.getAsmtMetaRsltCn(), asmtMetaRsltSttsCd, AnalysisTypeStatus.ANALYSIS_DATA.code(), memberAndInst.getUserNo() );
    researchMapper.insertAnalysisData( vo );

    // if (RoleType.ADMIN.code().equals( memberAndInst.getUserType() )) {
    // createOpinion( memberAndInst, asmtSn, vo.getAsmtMetaRsltSn(), AnalysisTypeStatus.ANALYSIS_DATA.code(), new
    // OpinionRequest( "자동 검토완료로 등록된 분석 데이터입니다.", AnalysisResultStatus.COMPLETED.code() ) );

    // ResearchAsmtDetailVO researchRow = researchMapper.findById( asmtSn );
    // if (researchRow == null) {
    // throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
    // }
    // TbCmMAsmtVO researchVo = researchRow.toTbCmMAsmtVO();

    // // 관리자에게 이메일 발송
    // List<AsmtPersonResponse> asmtPersonList = researchMapper.selectAsmtPersonList().stream().map(
    // AsmtPersonResponse::from ).collect( Collectors.toList() );
    // for (AsmtPersonResponse person : asmtPersonList) {
    // if (person.getDeptNo().equals( DeptCodeType.DRUG_ANALYSIS.code() )) {
    // continue;
    // }

    // String subject = "[한국의약품안전관리원] 연구과제 분석 데이터셋 등록 안내";
    // Map<String, Object> vars = new HashMap<>();
    // vars.putAll( emailContentGenerator.commonVars() );
    // vars.put( "title", "분석 데이터 등록" );
    // vars.put( "description", "분석 데이터 등록이 완료되었습니다." );
    // vars.put( "contentLabel", "내용" );
    // vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 분석 데이터 등록이 완료되었습니다." );
    // String body = emailContentGenerator.render( "mail/common-notice.html", vars );
    // mailApiService.sendHtmlMail( null, person.getEmpNo(), subject, body );
    // }
    // }

    // 파일 업로드
    if (datasetFiles != null && !datasetFiles.isEmpty()) {
      for (MultipartFile file : datasetFiles) {
        caFileUploadService.uploadWithCaAndUld( vo.getAsmtMetaRsltSn(), memberAndInst.getPartner() != null ? memberAndInst.getPartner().getAsmtPtcpInstSn() : null, List.of( file ), memberAndInst.getUserNo(), KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(),
            FileCodeType.RESEARCH_ANALYSIS_DATASET.code() );
      }
    }
    if (vdiFiles != null && !vdiFiles.isEmpty()) {
      for (MultipartFile file : vdiFiles) {
        caFileUploadService.uploadWithCaAndUld( vo.getAsmtMetaRsltSn(), memberAndInst.getPartner() != null ? memberAndInst.getPartner().getAsmtPtcpInstSn() : null, List.of( file ), memberAndInst.getUserNo(), KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(),
            FileCodeType.RESEARCH_ANALYSIS_VDI.code() );
      }
    }

    return vo;
  }

  private TbCmEAsmtMetaVO createAnalysisCdm( ResearchMemberVO memberAndInst, AnalysisDataRequest request, Long asmtSn, List<MultipartFile> files ) {
    TbCmEAsmtMetaVO vo = TbCmEAsmtMetaVO.create( asmtSn, request.getAsmtMetaRsltCn(), AnalysisResultStatus.SUBMITTED.code(), AnalysisTypeStatus.ANALYSIS_CDM.code(), memberAndInst.getUserNo() );

    researchMapper.insertAnalysisData( vo );

    List<TbCmMAsmtPrcpVO> partners = researchMapper.findActivePartnersByAsmtSn( asmtSn );
    partners = partners.stream().filter( p -> CdmUploadType.CDM.code().equals( p.getUldTypeCd() ) ).collect( Collectors.toList() );
    partners.forEach( p -> {
      ResearchMemberVO opinionCreator = new ResearchMemberVO();
      opinionCreator.setUserNo( memberAndInst.getUserNo() );
      opinionCreator.setInstBrno( p.getInstId() );
      createOpinion( opinionCreator, asmtSn, vo.getAsmtMetaRsltSn(), AnalysisTypeStatus.ANALYSIS_CDM.code(), new OpinionRequest( "", AnalysisResultStatus.NOT_REGISTERED.code() ) );
    } );

    String fileCodeType = resolveAnalysisFileCodeType( AnalysisTypeStatus.ANALYSIS_CDM.code() );
    if (fileCodeType != null && files != null && !files.isEmpty()) {
      for (MultipartFile file : files) {
        caFileUploadService.uploadWithCaAndUld( vo.getAsmtMetaRsltSn(), memberAndInst.getPartner() != null ? memberAndInst.getPartner().getAsmtPtcpInstSn() : null, List.of( file ), memberAndInst.getUserNo(), KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), fileCodeType );
      }
    }

    return vo;
  }

  private TbCmEAsmtMetaVO createAnalysisOrg( ResearchMemberVO memberAndInst, AnalysisDataRequest request, Long asmtSn, List<MultipartFile> files ) {
    // 검토 상태(01, 02, 03)가 아닌 분석 데이터가 존재하는지 확인
    String countInstId = memberAndInst.getPartner() != null ? memberAndInst.getPartner().getInstId() : null;
    int notInReviewStatusCount = researchMapper.countAnalysisDataNotInReviewStatus( asmtSn, AnalysisTypeStatus.ANALYSIS_ORG.code(), countInstId );
    if (notInReviewStatusCount > 0) {
      throw new IllegalArgumentException( "검토요청 중인 분석 데이터가 존재 합니다." );
    }

    TbCmEAsmtMetaVO vo = TbCmEAsmtMetaVO.create( asmtSn, request.getAsmtMetaRsltCn(), AnalysisResultStatus.SUBMITTED.code(), AnalysisTypeStatus.ANALYSIS_ORG.code(), memberAndInst.getUserNo() );

    researchMapper.insertAnalysisData( vo );

    updatePartnerStatus( asmtSn, memberAndInst.getInstBrno(), ResearchPartnerStatus.INSTITUTION_ANALYSIS_REVIEW_REQUEST.code(), memberAndInst.getUserNo() );

    String fileCodeType = resolveAnalysisFileCodeType( AnalysisTypeStatus.ANALYSIS_ORG.code() );
    if (fileCodeType != null && files != null && !files.isEmpty()) {
      caFileUploadService.uploadWithCaAndUld( vo.getAsmtMetaRsltSn(), memberAndInst.getPartner() != null ? memberAndInst.getPartner().getAsmtPtcpInstSn() : null, files, memberAndInst.getUserNo(), KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), fileCodeType );
    }

    return vo;
  }

  private TbCmEAsmtMetaVO createAnalysisMeta( ResearchMemberVO memberAndInst, AnalysisDataRequest request, Long asmtSn, List<MultipartFile> files ) {

    if (!memberAndInst.getIsAdmin()) {
      throw new IllegalArgumentException( "연구과제 생성자가 아니면 메타분석 데이터를 생성할 수 없습니다." );
    }

    // 검토 상태(01, 02, 03)가 아닌 분석 데이터가 존재하는지 확인
    boolean allStatusCompleted = checkAllStatus( memberAndInst, asmtSn );
    if (!allStatusCompleted) {
      throw new IllegalArgumentException( "전체 상태가 검토완료가 아니면 메타분석 데이터를 생성할 수 없습니다." );
    }

    int notInReviewStatusCount = researchMapper.countAnalysisDataNotInReviewStatus( asmtSn, AnalysisTypeStatus.ANALYSIS_META.code(), null );
    if (notInReviewStatusCount > 0) {
      throw new IllegalArgumentException( "검토요청 중인 분석 데이터가 존재 합니다." );
    }

    TbCmEAsmtMetaVO vo = TbCmEAsmtMetaVO.create( asmtSn, request.getAsmtMetaRsltCn(), AnalysisResultStatus.SUBMITTED.code(), AnalysisTypeStatus.ANALYSIS_META.code(), memberAndInst.getUserNo() );

    researchMapper.insertAnalysisData( vo );

    List<TbCmMAsmtPrcpVO> partners = researchMapper.findActivePartnersByAsmtSn( asmtSn );
    Set<String> cdmExcludedInstIds = collectMetaExcludedInstIds( asmtSn );
    partners = partners.stream().filter( p -> !(cdmExcludedInstIds.contains( p.getInstId() )) ).collect( Collectors.toList() );
    partners.forEach( p -> {
      ResearchMemberVO opinionCreator = new ResearchMemberVO();
      opinionCreator.setUserNo( memberAndInst.getUserNo() );
      opinionCreator.setInstBrno( p.getInstId() );
      createOpinion( opinionCreator, asmtSn, vo.getAsmtMetaRsltSn(), AnalysisTypeStatus.ANALYSIS_META.code(), new OpinionRequest( "", AnalysisResultStatus.NOT_REGISTERED.code() ) );
    } );

    String fileCodeType = resolveAnalysisFileCodeType( AnalysisTypeStatus.ANALYSIS_META.code() );
    if (fileCodeType != null && files != null && !files.isEmpty()) {
      for (MultipartFile file : files) {
        caFileUploadService.uploadWithCaAndUld( vo.getAsmtMetaRsltSn(), memberAndInst.getPartner() != null ? memberAndInst.getPartner().getAsmtPtcpInstSn() : null, List.of( file ), memberAndInst.getUserNo(), KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), fileCodeType );
      }
    }

    return vo;
  }

  // 최신 분석 상세 조회 ####################################################################################################

  private AnalysisDataDetailResponse findLatestAnalysisDataCdm( ResearchMemberVO memberAndInst, Long asmtSn, String rsltGroupStcd ) {
    TbCmEAsmtMetaVO analysisData = researchMapper.findLatestAnalysisDataByAsmtSn( asmtSn, rsltGroupStcd );
    if (analysisData == null) {
      throw new java.util.NoSuchElementException( MSG_ANALYSIS_NOT_FOUND_EN_ASMT_PREFIX + asmtSn );
    }

    Long asmtMetaRsltSnValue = analysisData.getAsmtMetaRsltSn();
    Long asmtSnValue = analysisData.getAsmtSn();
    String asmtMetaRsltCn = analysisData.getAsmtMetaRsltCn();
    String asmtMetaRsltSttsCd = analysisData.getAsmtMetaRsltSttsCd();
    String rsltGroupCdValue = analysisData.getRsltGroupCd();
    String rgtrId = analysisData.getRgtrId();
    LocalDateTime regDt = analysisData.getRegDt();
    String mdfrId = analysisData.getMdfrId();
    LocalDateTime mdfcnDt = analysisData.getMdfcnDt();
    String mbrEncptFlnm = resolveDisplayName( analysisData.getMbrEncptFlnm(), analysisData.getEmpNm() );
    LocalDateTime rsltNotiDt = analysisData.getRsltNotiDt();

    String opinionInstId = memberAndInst.getIsAdmin() ? null : memberAndInst.getPartner().getInstId();

    // 본인이 등록한 의견 조회
    TbCmEOpnnVO opinion = null;
    if (asmtMetaRsltSnValue != null) {
      opinion = researchMapper.findOpinionByAsmtMetaRsltSnAndInstId( asmtMetaRsltSnValue, opinionInstId );
      if (opinion != null) {
        if (opinion.getBrno() != null && opinion.getBrno().equals( memberAndInst.getInstBrno() )) {
          enrichOpinionDisplayName( opinion );
        } else {
          opinion = null;
        }
      }
    }

    // 분석 데이터의 전체 의견 조회
    List<TbCmEOpnnVO> opinionList = null;
    if ((rsltGroupCdValue.equals( AnalysisTypeStatus.ANALYSIS_CDM.code() ) || rsltGroupCdValue.equals( AnalysisTypeStatus.ANALYSIS_META.code() ))) {
      opinionList = researchMapper.searchOpinionDetailList( asmtSn, asmtMetaRsltSnValue, opinionInstId, rsltGroupCdValue );
      if (opinionList != null) {
        for (TbCmEOpnnVO o : opinionList) {
          if (o.getMbrEncptFlnm() != null && !o.getMbrEncptFlnm().isBlank()) {
            enrichOpinionDisplayName( opinion );
          }
        }
      }
    }

    // 검토할 전체 기관 개수
    int totalVotePartnerCount = 0;
    if (AnalysisTypeStatus.ANALYSIS_META.code().equals( rsltGroupCdValue )) {
      totalVotePartnerCount = computeTotalVotePartnerCountForMeta( asmtSnValue, asmtMetaRsltSnValue );
    } else if (AnalysisTypeStatus.ANALYSIS_CDM.code().equals( rsltGroupCdValue )) {
      totalVotePartnerCount = computeTotalVotePartnerCount( asmtSnValue, rsltGroupCdValue );
    }

    // 파일 목록 조회
    List<CaFileItem> fileList;
    if (rsltGroupCdValue.equals( AnalysisTypeStatus.ANALYSIS_DATA.code() )) {
      fileList = new ArrayList<>();
      fileList.addAll( loadAnalysisFiles( asmtMetaRsltSnValue, FileCodeType.RESEARCH_ANALYSIS_DATASET.code() ) );
      fileList.addAll( loadAnalysisFiles( asmtMetaRsltSnValue, FileCodeType.RESEARCH_ANALYSIS_VDI.code() ) );
    } else {
      String fileCodeType = resolveAnalysisFileCodeType( rsltGroupCdValue );
      fileList = loadAnalysisFiles( asmtMetaRsltSnValue, fileCodeType );
    }

    String asmtUserFlnm01 = null;
    String asmtUserFlnm02 = null;
    if (asmtSnValue != null && AnalysisResultStatus.COMPLETED.code().equals( asmtMetaRsltSttsCd )) {
      TbCmMAsmtAccountVO vdiAccount = researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSnValue, ASMT_USER_SE_VDI );
      TbCmMAsmtAccountVO dbAccount = researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSnValue, ASMT_USER_SE_DB );
      asmtUserFlnm01 = vdiAccount != null ? vdiAccount.getAsmtUserFlnm() : null;
      asmtUserFlnm02 = dbAccount != null ? dbAccount.getAsmtUserFlnm() : null;
    }

    return new AnalysisDataDetailResponse( asmtMetaRsltSnValue, asmtSnValue, asmtMetaRsltCn, asmtMetaRsltSttsCd, rsltGroupCdValue, rgtrId, null, regDt, mdfrId, mdfcnDt, mbrEncptFlnm, opinion, opinionList, rsltNotiDt, fileList, asmtUserFlnm01, asmtUserFlnm02, totalVotePartnerCount );
  }

  private AnalysisDataDetailResponse findLatestAnalysisDataOrg( ResearchMemberVO memberAndInst, Long asmtSn, String rsltGroupStcd ) {
    TbCmEAsmtMetaVO analysisData = researchMapper.findLatestAnalysisDataByAsmtSn( asmtSn, rsltGroupStcd );
    if (analysisData == null) {
      throw new java.util.NoSuchElementException( MSG_ANALYSIS_NOT_FOUND_EN_ASMT_PREFIX + asmtSn );
    }

    Long asmtMetaRsltSnValue = analysisData.getAsmtMetaRsltSn();
    Long asmtSnValue = analysisData.getAsmtSn();
    String asmtMetaRsltCn = analysisData.getAsmtMetaRsltCn();
    String rsltGroupCdValue = analysisData.getRsltGroupCd();
    String rgtrId = analysisData.getRgtrId();
    LocalDateTime regDt = analysisData.getRegDt();
    String mdfrId = analysisData.getMdfrId();
    LocalDateTime mdfcnDt = analysisData.getMdfcnDt();
    String mbrEncptFlnm = resolveDisplayName( analysisData.getMbrEncptFlnm(), analysisData.getEmpNm() );
    LocalDateTime rsltNotiDt = analysisData.getRsltNotiDt();
    String asmtMetaRsltSttsCd = AnalysisResultStatus.NOT_REGISTERED.code();

    TbCmEOpnnVO opinion = null;
    if (asmtMetaRsltSnValue != null) {
      String opinionInstId = memberAndInst.getIsAdmin() ? null : memberAndInst.getPartner().getInstId();
      opinion = researchMapper.findOpinionByAsmtMetaRsltSnAndInstId( asmtMetaRsltSnValue, opinionInstId );
      if (opinion != null) {
        if (opinion.getBrno() != null && opinion.getBrno().equals( memberAndInst.getInstBrno() )) {
          enrichOpinionDisplayName( opinion );
          asmtMetaRsltSttsCd = opinion.getUtlzAgreSeCd();
        } else {
          opinion = null;
        }
      }
    }

    // 파일 목록 조회
    List<CaFileItem> fileList;
    if (rsltGroupCdValue.equals( AnalysisTypeStatus.ANALYSIS_DATA.code() )) {
      fileList = new ArrayList<>();
      fileList.addAll( loadAnalysisFiles( asmtMetaRsltSnValue, FileCodeType.RESEARCH_ANALYSIS_DATASET.code() ) );
      fileList.addAll( loadAnalysisFiles( asmtMetaRsltSnValue, FileCodeType.RESEARCH_ANALYSIS_VDI.code() ) );
    } else {
      String fileCodeType = resolveAnalysisFileCodeType( rsltGroupCdValue );
      fileList = loadAnalysisFiles( asmtMetaRsltSnValue, fileCodeType );
    }

    String asmtUserFlnm01 = null;
    String asmtUserFlnm02 = null;
    if (asmtSnValue != null && AnalysisResultStatus.COMPLETED.code().equals( asmtMetaRsltSttsCd )) {
      TbCmMAsmtAccountVO vdiAccount = researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSnValue, ASMT_USER_SE_VDI );
      TbCmMAsmtAccountVO dbAccount = researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSnValue, ASMT_USER_SE_DB );
      asmtUserFlnm01 = vdiAccount != null ? vdiAccount.getAsmtUserFlnm() : null;
      asmtUserFlnm02 = dbAccount != null ? dbAccount.getAsmtUserFlnm() : null;
    }

    return new AnalysisDataDetailResponse( asmtMetaRsltSnValue, asmtSnValue, asmtMetaRsltCn, asmtMetaRsltSttsCd, rsltGroupCdValue, rgtrId, null, regDt, mdfrId, mdfcnDt, mbrEncptFlnm, opinion, null, rsltNotiDt, fileList, asmtUserFlnm01, asmtUserFlnm02, 0 );
  }

  private AnalysisDataDetailResponse findLatestAnalysisDataMeta( ResearchMemberVO memberAndInst, Long asmtSn, String rsltGroupStcd ) {
    TbCmEAsmtMetaVO analysisData = researchMapper.findLatestAnalysisDataByAsmtSn( asmtSn, rsltGroupStcd );
    if (analysisData == null) {
      throw new java.util.NoSuchElementException( MSG_ANALYSIS_NOT_FOUND_EN_ASMT_PREFIX + asmtSn );
    }

    Long asmtMetaRsltSnValue = analysisData.getAsmtMetaRsltSn();
    Long asmtSnValue = analysisData.getAsmtSn();
    String asmtMetaRsltCn = analysisData.getAsmtMetaRsltCn();
    String asmtMetaRsltSttsCd = analysisData.getAsmtMetaRsltSttsCd();
    String rsltGroupCdValue = analysisData.getRsltGroupCd();
    String rgtrId = analysisData.getRgtrId();
    LocalDateTime regDt = analysisData.getRegDt();
    String mdfrId = analysisData.getMdfrId();
    LocalDateTime mdfcnDt = analysisData.getMdfcnDt();
    String mbrEncptFlnm = resolveDisplayName( analysisData.getMbrEncptFlnm(), analysisData.getEmpNm() );
    LocalDateTime rsltNotiDt = analysisData.getRsltNotiDt();

    TbCmEOpnnVO opinion = null;
    if (asmtMetaRsltSnValue != null) {
      opinion = researchMapper.findOpinionByAsmtMetaRsltSnAndInstId( asmtMetaRsltSnValue, memberAndInst.getInstBrno() );
      enrichOpinionDisplayName( opinion );
    }

    List<TbCmEOpnnVO> opinionList = null;
    if ((rsltGroupCdValue.equals( AnalysisTypeStatus.ANALYSIS_CDM.code() ) || rsltGroupCdValue.equals( AnalysisTypeStatus.ANALYSIS_META.code() ))) {
      opinionList = researchMapper.searchOpinionDetailList( asmtSn, asmtMetaRsltSnValue, null, rsltGroupCdValue );
      if (opinionList != null) {
        for (TbCmEOpnnVO o : opinionList) {
          if (o.getMbrEncptFlnm() != null && !o.getMbrEncptFlnm().isBlank()) {
            o.setMbrEncptFlnm( decryptApiService.decryptMbrFlnm( o.getMbrEncptFlnm() ) );
          }
        }
      }
    }

    // 검토할 전체 기관 개수
    int totalVotePartnerCount = 0;
    if (AnalysisTypeStatus.ANALYSIS_META.code().equals( rsltGroupCdValue )) {
      totalVotePartnerCount = computeTotalVotePartnerCountForMeta( asmtSnValue, asmtMetaRsltSnValue );
    } else if (AnalysisTypeStatus.ANALYSIS_CDM.code().equals( rsltGroupCdValue )) {
      totalVotePartnerCount = computeTotalVotePartnerCount( asmtSnValue, rsltGroupCdValue );
    }

    // 파일 목록 조회
    List<CaFileItem> fileList;
    if (rsltGroupCdValue.equals( AnalysisTypeStatus.ANALYSIS_DATA.code() )) {
      fileList = new ArrayList<>();
      fileList.addAll( loadAnalysisFiles( asmtMetaRsltSnValue, FileCodeType.RESEARCH_ANALYSIS_DATASET.code() ) );
      fileList.addAll( loadAnalysisFiles( asmtMetaRsltSnValue, FileCodeType.RESEARCH_ANALYSIS_VDI.code() ) );
    } else {
      String fileCodeType = resolveAnalysisFileCodeType( rsltGroupCdValue );
      fileList = loadAnalysisFiles( asmtMetaRsltSnValue, fileCodeType );
    }

    String asmtUserFlnm01 = null;
    String asmtUserFlnm02 = null;
    if (asmtSnValue != null && AnalysisResultStatus.COMPLETED.code().equals( asmtMetaRsltSttsCd )) {
      TbCmMAsmtAccountVO vdiAccount = researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSnValue, ASMT_USER_SE_VDI );
      TbCmMAsmtAccountVO dbAccount = researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSnValue, ASMT_USER_SE_DB );
      asmtUserFlnm01 = vdiAccount != null ? vdiAccount.getAsmtUserFlnm() : null;
      asmtUserFlnm02 = dbAccount != null ? dbAccount.getAsmtUserFlnm() : null;
    }

    return new AnalysisDataDetailResponse( asmtMetaRsltSnValue, asmtSnValue, asmtMetaRsltCn, asmtMetaRsltSttsCd, rsltGroupCdValue, rgtrId, null, regDt, mdfrId, mdfcnDt, mbrEncptFlnm, opinion, opinionList, rsltNotiDt, fileList, asmtUserFlnm01, asmtUserFlnm02, totalVotePartnerCount );
  }

  // 의견 등록 ########################################################################################################

  private void applyCreateOpinionSideEffectsForDataset( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, String rsltGroupCdValue, OpinionRequest request ) {
    if (memberAndInst.getDeptNo().equals( DEPT_NO_REVIEW_DEPT1 )) {
      String effective = effectiveAnalysisResultStatusFromRequest( request );
      String asmtMetaRsltSttsCd = effective;
      // 검토완료인 경우 2차 진행 상태로 변경
      if (AnalysisResultStatus.COMPLETED.code().equals( effective )) {
        asmtMetaRsltSttsCd = AnalysisResultStatus.INPROGRESS_REVIEW_DEPT2.code();
      }
      updateAnalysisDataStatus( memberAndInst, asmtSn, asmtMetaRsltSn, asmtMetaRsltSttsCd );
    } else if (memberAndInst.getDeptNo().equals( DEPT_NO_REVIEW_DEPT2 )) {
      boolean isAssigned = assignVdiAccountsForAsmt( asmtSn );
      if (!isAssigned) {
        throw new IllegalArgumentException( "사용 가능한 VDI/DB 계정이 없습니다." );
      }
      updateAnalysisDataStatus( memberAndInst, asmtSn, asmtMetaRsltSn, effectiveAnalysisResultStatusFromRequest( request ) );
    }
  }

  private void applyCreateOpinionSideEffectsForCdm( Long asmtSn, String asmtMetaRsltSttsCd, String instId, String createBy ) {
    updatePartnerStatus( asmtSn, instId, asmtMetaRsltSttsCd, createBy );
  }

  private void applyCreateOpinionSideEffectsForOrg( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, String rsltGroupCdValue, OpinionRequest request ) {
    TbCmEAsmtMetaVO analysisDataDetail = researchMapper.findAnalysisDataById( asmtMetaRsltSn, null );
    if (analysisDataDetail == null) {
      throw new IllegalArgumentException( MSG_ANALYSIS_DATA_NOT_FOUND );
    }

    String effective = effectiveAnalysisResultStatusFromRequest( request );
    String partnerPrgrsStatusCd = null;
    if (AnalysisResultStatus.COMPLETED.code().equals( effective )) {
      partnerPrgrsStatusCd = ResearchPartnerStatus.INSTITUTION_ANALYSIS_REVIEW_COMPLETED.code();
    } else if (AnalysisResultStatus.REQUEST_MODIFY.code().equals( effective )) {
      partnerPrgrsStatusCd = ResearchPartnerStatus.INSTITUTION_ANALYSIS_MODIFY_REQUEST.code();
    } else if (AnalysisResultStatus.EXCLUDED.code().equals( effective )) {
      partnerPrgrsStatusCd = ResearchPartnerStatus.INTEGRATED_ANALYSIS_RESULT_EXCLUDED.code();
    }
    updatePartnerStatus( asmtSn, analysisDataDetail.getInstBrno(), partnerPrgrsStatusCd, memberAndInst.getUserNo() );
    updateAnalysisDataStatus( memberAndInst, asmtSn, asmtMetaRsltSn, effective );
  }

  private void applyCreateOpinionSideEffectsForMeta( Long asmtSn, String partnerPrgrsStatusCd, String instId, String createBy ) {
    updatePartnerStatus( asmtSn, instId, partnerPrgrsStatusCd, createBy );
  }

  // 의견 조회 ########################################################################################################

  private List<InstitutionWithOpinionsResponse> searchCdmMetaOpinionList( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, String rsltGroupStcd ) {
    // CDM의 의견 목록
    List<TbCmEOpnnVO> opinions = researchMapper.searchOpinionDetailList( asmtSn, asmtMetaRsltSn, null, rsltGroupStcd );

    // 참여기관 목록
    Map<String, TbCmMAsmtPrcpVO> partnerByInstId = researchMapper.findActivePartnersByAsmtSn( asmtSn ).stream().filter( p -> p.getInstId() != null ).collect( Collectors.toMap( TbCmMAsmtPrcpVO::getInstId, p -> p, ( existing, replacement ) -> existing ) );

    // 의견을 등록한 참여기관의 정보를 찾기
    Map<String, List<TbCmEOpnnVO>> opinionsByInstId = opinions.stream().filter( o -> o.getInstId() != null ).collect( Collectors.groupingBy( TbCmEOpnnVO::getInstId, LinkedHashMap::new, Collectors.toList() ) );

    return opinionsByInstId.entrySet().stream().map( entry -> {
      String instId = entry.getKey();
      List<TbCmEOpnnVO> instOpinions = entry.getValue();
      TbCmEOpnnVO firstOpinion = instOpinions.get( 0 );
      TbCmMAsmtPrcpVO partner = partnerByInstId.get( instId );

      List<OpinionItemResponse> list = instOpinions.stream().map( o -> new OpinionItemResponse( o.getAsmtSn(), o.getOpnnIntgRsltSn(), o.getAsmtMetaRsltSn(), AnalysisTypeStatus.ANALYSIS_CDM.code(), o.getOpnnIntgDmndCn(), o.getUtlzAgreSeCd(), o.getAsmtOpnnSttsCd(), o.getRgtrId(), o.getRegDt(),
          resolveDisplayName( o.getMbrEncptFlnm(), "" ), o.getMdfrId(), o.getMdfcnDt() ) ).collect( Collectors.toList() );

      String instNm = firstOpinion.getInstNm() != null ? firstOpinion.getInstNm() : (partner != null ? partner.getInstNm() : null);
      String uldTypeCd = partner != null ? partner.getUldTypeCd() : null;
      return new InstitutionWithOpinionsResponse( instId, instNm, uldTypeCd, list );
    } ).collect( Collectors.toList() );

  }

  private List<InstitutionWithOpinionsResponse> searchOpinionList( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn ) {
    // 참여중인 기관 목록 (미참여 제외)
    List<TbCmMAsmtPrcpVO> partners = researchMapper.findActivePartnersByAsmtSn( asmtSn );
    Set<String> allowedInstIds = partners.stream().map( TbCmMAsmtPrcpVO::getInstId ).filter( Objects::nonNull ).collect( Collectors.toSet() );
    List<String> allowedInstIdList = new ArrayList<>( allowedInstIds );

    // 메타분석 의견 목록
    List<OpinionListRowVO> rows = researchMapper.searchOpinionListForMeta( asmtSn, asmtMetaRsltSn, allowedInstIdList, AnalysisTypeStatus.ANALYSIS_META.code() );
    Map<String, List<OpinionItemResponse>> opinionsByInstId = rows.stream().collect( Collectors.groupingBy( OpinionListRowVO::getInstId, Collectors.mapping( row -> new OpinionItemResponse( row.getAsmtSn(), row.getOpnnIntgRsltSn(), row.getAsmtMetaRsltSn(), row.getRsltGroupCd(),
        row.getOpnnIntgDmndCn(), row.getUtlzAgreSeCd(), row.getAsmtOpnnSttsCd(), row.getRgtrId(), row.getRegDt(), resolveDisplayName( row.getMdfrNm(), "" ), row.getMdfrId(), row.getMdfcnDt() ), Collectors.toList() ) ) );

    return partners.stream().map( p -> {
      String instId = p.getInstId();
      List<OpinionItemResponse> list = opinionsByInstId.getOrDefault( instId, Collections.emptyList() );
      List<OpinionItemResponse> opinions = list.isEmpty() ? Collections.emptyList() : Collections.singletonList( list.get( 0 ) );
      return new InstitutionWithOpinionsResponse( instId, p.getInstNm(), p.getUldTypeCd(), opinions );
    } ).collect( Collectors.toList() );
  }

  // 검토 요청, 마감 ###################################################################################################

  private void requestReviewData( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn ) {
    ResearchAsmtDetailVO researchRow = researchMapper.findById( asmtSn );
    if (researchRow == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
    }

    TbCmMAsmtVO researchVo = researchRow.toTbCmMAsmtVO();

    // 이메일을 발송할 대상 목록
    List<AsmtPersonResponse> asmtPersonList = researchMapper.selectAsmtPersonList().stream().map( AsmtPersonResponse::from ).collect( Collectors.toList() );

    applyAnalysisDataStatusUpdate( memberAndInst, asmtSn, asmtMetaRsltSn, AnalysisResultStatus.REQUEST_REVIEW.code(), AnalysisTypeStatus.ANALYSIS_DATA.code() );

    // 관리자에게 이메일 발송
    for (AsmtPersonResponse person : asmtPersonList) {
      if (person.getDeptNo().equals( DeptCodeType.INFORMATION.code() )) {
        continue;
      }

      String subject = "[한국의약품안전관리원] 연구과제 분석 데이터셋 등록 안내";
      Map<String, Object> vars = new HashMap<>();
      vars.putAll( emailContentGenerator.commonVars() );
      vars.put( "title", "분석 데이터 등록" );
      vars.put( "description", "분석 데이터 등록이 완료되었습니다." );
      vars.put( "contentLabel", "내용" );
      vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 분석 데이터 등록이 완료되었습니다. 검토를 진행해주세요." );
      String body = emailContentGenerator.render( "mail/common-notice.html", vars );
      mailApiService.sendHtmlMail( null, person.getEmpNo(), subject, body );
    }

  }

  private void requestReviewDataDept2( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn ) {
    ResearchAsmtDetailVO researchRow = researchMapper.findById( asmtSn );
    if (researchRow == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
    }

    TbCmMAsmtVO researchVo = researchRow.toTbCmMAsmtVO();

    // 이메일을 발송할 대상 목록
    List<AsmtPersonResponse> asmtPersonList = researchMapper.selectAsmtPersonList().stream().map( AsmtPersonResponse::from ).collect( Collectors.toList() );

    createOpinion( memberAndInst, asmtSn, asmtMetaRsltSn, AnalysisTypeStatus.ANALYSIS_DATA.code(), new OpinionRequest( "자동 검토완료로 등록된 분석 데이터입니다.", AnalysisResultStatus.COMPLETED.code() ) );
    applyAnalysisDataStatusUpdate( memberAndInst, asmtSn, asmtMetaRsltSn, AnalysisResultStatus.INPROGRESS_REVIEW_DEPT2.code(), AnalysisTypeStatus.ANALYSIS_DATA.code() );

    // 관리자에게 이메일 발송
    for (AsmtPersonResponse person : asmtPersonList) {
      if (person.getDeptNo().equals( DeptCodeType.DRUG_ANALYSIS.code() )) {
        continue;
      }

      String subject = "[한국의약품안전관리원] 연구과제 분석 데이터셋 등록 안내";
      Map<String, Object> vars = new HashMap<>();
      vars.putAll( emailContentGenerator.commonVars() );
      vars.put( "title", "분석 데이터 등록" );
      vars.put( "description", "분석 데이터 등록이 완료되었습니다." );
      vars.put( "contentLabel", "내용" );
      vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 분석 데이터 등록이 완료되었습니다. 검토를 진행해주세요." );
      String body = emailContentGenerator.render( "mail/common-notice.html", vars );
      mailApiService.sendHtmlMail( null, person.getEmpNo(), subject, body );
    }

  }

  private void requestReviewCdm( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn ) {
    List<ResearchPartnerResponse> partners = researchMapper.searchPartners( asmtSn, AnalysisResultStatus.COMPLETED.code(), null ).stream().map( ResearchPartnerResponse::from ).collect( Collectors.toList() );

    // 참여기관 중 데이터 현황이 CDM인 기관들 필터링 (미참여 제외)
    partners = partners.stream().filter( partner -> !ResearchPartnerStatus.NOT_PARTICIPATING.code().equals( partner.getPtcpPrgrsSttsCd() ) ).filter( partner -> CdmUploadType.CDM.code().equals( partner.getUldTypeCd() ) ).collect( Collectors.toList() );

    if (!partners.isEmpty()) {
      List<TbCmMAsmtPrcpVO> asmtPrcpVos = new ArrayList<>();
      for (ResearchPartnerResponse partner : partners) {
        TbCmMAsmtPrcpVO asmtPrcpVo = new TbCmMAsmtPrcpVO();
        asmtPrcpVo.setAsmtSn( asmtSn );
        asmtPrcpVo.setInstId( partner.getInstId() );
        asmtPrcpVo.setPtcpPrgrsSttsCd( ResearchPartnerStatus.INSTITUTION_ANALYSIS_REVIEW_REQUEST.code() );
        asmtPrcpVos.add( asmtPrcpVo );
      }
      researchMapper.updateAsmtPrcpRsltCnBatch( asmtPrcpVos );
    }

    ResearchAsmtDetailVO researchRow = researchMapper.findById( asmtSn );
    if (researchRow == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
    }
    TbCmMAsmtVO researchVo = researchRow.toTbCmMAsmtVO();

    // 참여기관에게 이메일 전송
    for (ResearchPartnerResponse partner : partners) {
      String subject = "[한국의약품안전관리원] 통합 데이터 분석결과 검토요청 안내";
      Map<String, Object> vars = new HashMap<>();
      vars.putAll( emailContentGenerator.commonVars() );
      vars.put( "title", "통합 데이터 분석결과 검토요청" );
      vars.put( "description", "통합 데이터 분석결과 검토 요청이 있습니다." );
      vars.put( "contentLabel", "내용" );
      vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 통합 데이터 분석결과의 검토 요청이 있습니다. 검토를 진행해주세요." );
      String body = emailContentGenerator.render( "mail/common-notice.html", vars );
      mailApiService.sendHtmlMail( partner.getInstId(), null, subject, body );
    }
  }

  private void requestReviewOrg( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, String instId ) {

    TbCmMAsmtPrcpVO asmtPrcpVo = new TbCmMAsmtPrcpVO();
    asmtPrcpVo.setAsmtSn( asmtSn );
    asmtPrcpVo.setInstId( instId );
    asmtPrcpVo.setPtcpPrgrsSttsCd( ResearchPartnerStatus.INSTITUTION_ANALYSIS_REVIEW_REQUEST.code() );
    asmtPrcpVo.setMdfrId( memberAndInst.getUserNo() );
    asmtPrcpVo.setMdfcnDt( LocalDateTime.now() );
    researchMapper.updateAsmtPrcpRsltCn( asmtPrcpVo );

    ResearchAsmtDetailVO researchRow = researchMapper.findById( asmtSn );
    if (researchRow == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
    }
    TbCmMAsmtVO researchVo = researchRow.toTbCmMAsmtVO();

    TbPpMEmpInfoVO empInfo = commonAuthrtMapper.selectEmpInfoByEmpNo( researchVo.getRgtrId() );
    MemberAndInstVO partnerInfo = commonAuthrtMapper.selectMemberAndInstByMbrId( researchVo.getRgtrId() );

    String empNo = empInfo != null ? empInfo.getEmpNo() : null;
    String mbrNo = partnerInfo != null ? partnerInfo.getMbrNo() : null;

    // 과제 생성자에게 이메일 전송
    {
      String subject = "[한국의약품안전관리원] 기관 분석결과 검토요청 안내";
      Map<String, Object> vars = new HashMap<>();
      vars.putAll( emailContentGenerator.commonVars() );
      vars.put( "title", "기관 분석결과 검토요청" );
      vars.put( "description", "기관 분석결과 검토 요청이 있습니다." );
      vars.put( "contentLabel", "내용" );
      vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 기관 분석결과의 검토 요청이 있습니다. 검토를 진행해주세요." );
      String body = emailContentGenerator.render( "mail/common-notice.html", vars );
      mailApiService.sendHtmlMail( mbrNo, empNo, subject, body );
    }
  }

  private void requestReviewMeta( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn ) {
    List<ResearchPartnerResponse> partners = researchMapper.searchPartners( asmtSn, AnalysisResultStatus.COMPLETED.code(), null ).stream().map( ResearchPartnerResponse::from ).collect( Collectors.toList() );

    Set<String> cdmExcludedInstIds = collectMetaExcludedInstIds( asmtSn );
    partners = partners.stream().filter( p -> !(CdmUploadType.CDM.code().equals( p.getUldTypeCd() ) && cdmExcludedInstIds.contains( p.getInstId() )) ).collect( Collectors.toList() );

    // 미참여 제외
    partners = partners.stream().filter( partner -> !ResearchPartnerStatus.NOT_PARTICIPATING.code().equals( partner.getPtcpPrgrsSttsCd() ) ).collect( Collectors.toList() );

    if (!partners.isEmpty()) {
      List<TbCmMAsmtPrcpVO> asmtPrcpVos = new ArrayList<>();
      for (ResearchPartnerResponse partner : partners) {
        TbCmMAsmtPrcpVO asmtPrcpVo = new TbCmMAsmtPrcpVO();
        asmtPrcpVo.setAsmtSn( asmtSn );
        asmtPrcpVo.setInstId( partner.getInstId() );
        asmtPrcpVo.setPtcpPrgrsSttsCd( ResearchPartnerStatus.RESEARCH_RESULT_REVIEW_REQUEST.code() );
        asmtPrcpVos.add( asmtPrcpVo );
      }
      researchMapper.updateAsmtPrcpRsltCnBatch( asmtPrcpVos );
    }

    ResearchAsmtDetailVO researchRow = researchMapper.findById( asmtSn );
    if (researchRow == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
    }
    TbCmMAsmtVO researchVo = researchRow.toTbCmMAsmtVO();

    // 참여기관에게 이메일 전송
    for (ResearchPartnerResponse partner : partners) {
      String subject = "[한국의약품안전관리원] 메타 분석결과 검토요청 안내";
      Map<String, Object> vars = new HashMap<>();
      vars.putAll( emailContentGenerator.commonVars() );
      vars.put( "title", "메타 분석결과 검토요청" );
      vars.put( "description", "메타 분석결과 검토 요청이 있습니다." );
      vars.put( "contentLabel", "내용" );
      vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 메타 분석결과의 검토 요청이 있습니다. 검토를 진행해주세요." );
      String body = emailContentGenerator.render( "mail/common-notice.html", vars );
      mailApiService.sendHtmlMail( partner.getInstId(), null, subject, body );
    }
  }

  // 분석 데이터 상태 업데이트 (일반적인 경우) #############################################################################
  private void applyAnalysisDataStatusUpdate( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtMetaRsltSn, String asmtMetaRsltSttsCd, String rsltGroupCd ) {

    TbCmEAsmtMetaVO vo = new TbCmEAsmtMetaVO();
    vo.setAsmtMetaRsltSn( asmtMetaRsltSn );
    vo.setAsmtSn( asmtSn );
    vo.setAsmtMetaRsltSttsCd( asmtMetaRsltSttsCd );
    vo.setMdfrId( memberAndInst.getUserNo() );
    vo.setMdfcnDt( LocalDateTime.now() );
    researchMapper.updateAnalysisData( vo );

    // 분석결과 전체 완료 여부 확인 후 연구과제 상태 변경
    boolean allStatusCompleted = checkAllStatus( memberAndInst, asmtSn );
    if (allStatusCompleted) {
      researchMapper.updateResearchStatus( asmtSn, ResearchStatus.IN_PROGRESS_META.code(), memberAndInst.getUserNo() );
    }
  }

  // 메타분석 데이터 상태 업데이트 (메타분석 경우) ##########################################################################
  private void syncIntegratedAnalysisNotConsentIfMetaOpinionFromCdm( Long asmtSn, List<TbCmEOpnnVO> opinions, String mdfrId ) {
    if (asmtSn == null || opinions == null || opinions.isEmpty()) {
      return;
    }

    List<ResearchPartnerResponse> partners = researchMapper.searchPartners( asmtSn, AnalysisResultStatus.COMPLETED.code(), null ).stream().map( ResearchPartnerResponse::from ).collect( Collectors.toList() );

    Map<String, String> instIdToUldTypeCd = new HashMap<>();
    if (partners != null) {
      for (ResearchPartnerResponse p : partners) {
        if (p.getInstId() != null) {
          instIdToUldTypeCd.put( p.getInstId(), p.getUldTypeCd() );
        }
      }
    }

    boolean cdmInstitutionNonConsent = false;
    for (TbCmEOpnnVO opinion : opinions) {
      if (!isOpinionUtilizationNonConsent( opinion )) {
        continue;
      }
      String instId = opinion.getInstId();
      if (instId == null) {
        continue;
      }
      if (CdmUploadType.CDM.code().equals( instIdToUldTypeCd.get( instId ) )) {
        cdmInstitutionNonConsent = true;
        break;
      }
    }

    if (!cdmInstitutionNonConsent) {
      return;
    }

    TbCmEAsmtMetaVO cdmLatest = researchMapper.findLatestMetaAnalysisByRsltGroupStcd( asmtSn, AnalysisTypeStatus.ANALYSIS_CDM.code() );
    if (cdmLatest == null) {
      return;
    }

    LocalDateTime now = LocalDateTime.now();
    TbCmEAsmtMetaVO cdmUpdate = new TbCmEAsmtMetaVO();
    cdmUpdate.setAsmtMetaRsltSn( cdmLatest.getAsmtMetaRsltSn() );
    cdmUpdate.setAsmtSn( asmtSn );
    cdmUpdate.setAsmtMetaRsltSttsCd( AnalysisResultStatus.NOT_CONSENT.code() );
    cdmUpdate.setMdfrId( mdfrId );
    cdmUpdate.setMdfcnDt( now );
    researchMapper.updateAnalysisData( cdmUpdate );
  }

  // 참여기관 상태 변경 ###############################################################################################
  private void updatePartnerStatus( Long asmtSn, String instId, String partnerPrgrsStatusCd, String modifyBy ) {
    TbCmMAsmtPrcpVO prcpVo = new TbCmMAsmtPrcpVO();
    prcpVo.setAsmtSn( asmtSn );
    prcpVo.setInstId( instId );
    if (partnerPrgrsStatusCd != null && !partnerPrgrsStatusCd.isEmpty()) {
      prcpVo.setPtcpPrgrsSttsCd( partnerPrgrsStatusCd );
    }
    prcpVo.setMdfrId( modifyBy );
    prcpVo.setMdfcnDt( LocalDateTime.now() );
    researchMapper.updateAsmtPrcpRsltCn( prcpVo );
  }
}
