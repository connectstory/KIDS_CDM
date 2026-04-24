package kr.or.kids.domain.cm.research.service.impl;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.context.event.EventListener;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
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
import kr.or.kids.domain.cm.research.dto.AnalysisDatasetTaskResponse;
import kr.or.kids.domain.cm.research.dto.AsmtPersonResponse;
import kr.or.kids.domain.cm.research.dto.PartnerCreateRequest;
import kr.or.kids.domain.cm.research.dto.ResearchCreateRequest;
import kr.or.kids.domain.cm.research.dto.ResearchDetailResponse;
import kr.or.kids.domain.cm.research.dto.ResearchListResponse;
import kr.or.kids.domain.cm.research.dto.ResearchPartnerResponse;
import kr.or.kids.domain.cm.research.dto.ResearchSearchRequest;
import kr.or.kids.domain.cm.research.dto.ResearchUpdateRequest;
import kr.or.kids.domain.cm.research.event.AnalysisDatasetCopySuccessEvent;
import kr.or.kids.domain.cm.research.mapper.ResearchMapper;
import kr.or.kids.domain.cm.research.service.AnalysisDatasetCopyService;
import kr.or.kids.domain.cm.research.service.ResearchService;
import kr.or.kids.domain.cm.research.service.support.ResearchMemberResolver;
import kr.or.kids.domain.cm.research.type.AnalysisResultStatus;
import kr.or.kids.domain.cm.research.type.AnalysisTypeStatus;
import kr.or.kids.domain.cm.research.type.ParticipationStatus;
import kr.or.kids.domain.cm.research.type.ResearchPartnerStatus;
import kr.or.kids.domain.cm.research.type.ResearchStatus;
import kr.or.kids.domain.cm.research.vo.ResearchAsmtDetailVO;
import kr.or.kids.domain.cm.research.vo.ResearchListRowVO;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;
import kr.or.kids.domain.cm.research.vo.TbCmEAsmtMetaVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtAccountVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtPrcpVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtVO;
import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import kr.or.kids.domain.cm.research.vo.TbPpMInstTaskVO;
import kr.or.kids.global.common.CustomUserDetails;
import kr.or.kids.global.security.SqlIdentifierGuard;
import kr.or.kids.global.type.CdmUploadType;
import kr.or.kids.global.type.CmTaskCodeType;
import kr.or.kids.global.type.FileCodeType;
import kr.or.kids.global.type.KidsTaskCodeType;
import kr.or.kids.global.type.RoleType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResearchServiceImpl implements ResearchService {

  private final JdbcTemplate jdbcTemplate;
  private final CommonAuthrtMapper commonAuthrtMapper;
  private final ResearchMapper researchMapper;
  private final CommonFileMapper commonFileMapper;
  private final FileApiService fileApiService;
  private final CaFileUploadService caFileUploadService;
  private final AnalysisDatasetCopyService analysisDatasetCopyService;
  private final ResearchMemberResolver researchMemberResolver;
  private final MailApiService mailApiService;
  private final EmailContentGenerator emailContentGenerator;
  private final DecryptApiService decryptApiService;

  // 분석 스키마(=CDM)를 구성하는 대표 테이블들(복사용 truncate 순서와 동일)
  private static final List<String> CDM_TABLES_ORDER = List.of( "person", "observation_period", "visit_occurrence", "condition_occurrence", "drug_exposure", "procedure_occurrence", "measurement", "observation", "death" );
  private static final List<String> SENTINEL_TABLES_ORDER = List.of( "cause_of_death", "demographic", "diagnosis", "dispensing", "encounter", "enrollment", "laboratory_result", "procedure", "sentinel_death", "vital_signs" );
  private static final Set<String> ANALYSIS_ALLOWED_TABLES = Set.copyOf( java.util.stream.Stream.concat( CDM_TABLES_ORDER.stream(), SENTINEL_TABLES_ORDER.stream() ).collect( Collectors.toSet() ) );

  /** tb_cm_e_opnn.asmt_opnn_stts_cd — 메타(rslt_group 04) 활용 미동의 */
  private static final String ASMT_OPNN_STTS_NON_CONSENT = "02";

  // 연구과제 목록 조회 (관리자)
  @Override
  @Transactional(readOnly = true)
  public List<ResearchListResponse> searchResearchListByAdmin( ResearchMemberVO memberAndInst, ResearchSearchRequest request ) {
    // 회원 유형코드가 'A'이면 모든 연구과제 조회 (기관 필터링 제거)
    String instId = RoleType.ADMIN.code().equals( memberAndInst.getUserType() ) ? null : memberAndInst.getInstBrno();
    List<ResearchListRowVO> rows = researchMapper.searchResearchList( instId, request );
    if (CollectionUtils.isEmpty( rows )) {
      return List.of();
    }
    List<Long> asmtSns = rows.stream().map( ResearchListRowVO::getAsmtSn ).toList();
    Map<Long, TbCmEAsmtMetaVO> meta02ByAsmt = researchMapper.findLatestMetaByRsltGroupStcdBatch( asmtSns, AnalysisTypeStatus.ANALYSIS_CDM.code() ).stream().collect( Collectors.toMap( TbCmEAsmtMetaVO::getAsmtSn, v -> v, ( a, b ) -> a ) );
    Map<Long, TbCmEAsmtMetaVO> meta04ByAsmt = researchMapper.findLatestMetaByRsltGroupStcdBatch( asmtSns, AnalysisTypeStatus.ANALYSIS_META.code() ).stream().collect( Collectors.toMap( TbCmEAsmtMetaVO::getAsmtSn, v -> v, ( a, b ) -> a ) );
    Map<Long, List<TbCmEAsmtMetaVO>> meta03ByAsmt = researchMapper.findLatestOrgAnalysisForStatusCheckBatch( asmtSns ).stream().collect( Collectors.groupingBy( TbCmEAsmtMetaVO::getAsmtSn ) );
    Set<Long> asmtSnsWithReviewInProgress = new HashSet<>( researchMapper.findAsmtSnsWithReviewInProgressBatch( asmtSns ) );

    return rows.stream().map( r -> {
      Long sn = r.getAsmtSn();
      TbCmEAsmtMetaVO latestMeta02 = meta02ByAsmt.get( sn );
      TbCmEAsmtMetaVO latestMeta04 = meta04ByAsmt.get( sn );
      List<TbCmEAsmtMetaVO> latestMeta03ByOrg = meta03ByAsmt.getOrDefault( sn, Collections.emptyList() );
      boolean reviewInProgress = asmtSnsWithReviewInProgress.contains( sn );
      return ResearchListResponse.fromRow( r, latestMeta02, latestMeta04, latestMeta03ByOrg, reviewInProgress );
    } ).toList();
  }

  // 연구과제 목록 조회 (파트너)
  @Override
  @Transactional(readOnly = true)
  public List<ResearchListResponse> searchResearchListByPartner( ResearchMemberVO memberAndInst, ResearchSearchRequest request ) {
    String instBrno = memberAndInst.getInstBrno();
    return researchMapper.searchResearchListByPartner( instBrno, request ).stream().map( ResearchListResponse::fromRow ).toList();
  }

  // 연구과제 개수 조회 (관리자)
  @Override
  @Transactional(readOnly = true)
  public int countByAdmin( ResearchMemberVO memberAndInst, ResearchSearchRequest request ) {
    // 회원 유형코드가 'A'이면 모든 연구과제 조회 (기관 필터링 제거)
    String instId = RoleType.ADMIN.code().equals( memberAndInst.getUserType() ) ? null : memberAndInst.getInstBrno();
    return researchMapper.count( instId, request );
  }

  // 연구과제 개수 조회 (파트너)
  @Override
  @Transactional(readOnly = true)
  public int countByPartner( ResearchMemberVO memberAndInst, ResearchSearchRequest request ) {
    String instBrno = memberAndInst.getInstBrno();
    return researchMapper.countByPartner( instBrno, request );
  }

  // 연구과제 상세 조회
  @Override
  @Transactional
  public ResearchDetailResponse findResearchDetailById( ResearchMemberVO memberAndInst, Long id ) {
    ResearchAsmtDetailVO resultRow = researchMapper.findById( id );
    if (resultRow == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다. id: " + id );
    }

    TbCmMAsmtVO vo = resultRow.toTbCmMAsmtVO();
    String instNm = resultRow.getInstNm();
    instNm = researchMapper.findInstNmByDeptNo( vo.getInstId() );
    if (instNm == null) {
      instNm = researchMapper.findInstNmByInstId( vo.getInstId() );
    }

    String rgtrNm = resultRow.getEmpNm();
    if (rgtrNm == null || rgtrNm.isBlank()) {
      rgtrNm = decryptApiService.decryptMbrFlnm( resultRow.getMbrEncptFlnm() );
    }

    // 최신 TbCmEAsmtMetaVO 조회 (rsltGroupStcd='01' 데이터 분석)하여 asmtMetaRsltSttsCd 가져오기
    String asmtMetaRsltSttsCd = null;
    TbCmEAsmtMetaVO latestMetaRow = researchMapper.findLatestAnalysisDataByAsmtSn( id, AnalysisTypeStatus.ANALYSIS_DATA.code() );
    if (latestMetaRow != null) {
      asmtMetaRsltSttsCd = latestMetaRow.getAsmtMetaRsltSttsCd();
    }

    // 연구과제 생성자 상태 설정
    if (Objects.equals( memberAndInst.getInstBrno(), vo.getInstId() )) {
      List<Long> asmtSnList = List.of( id );
      TbCmEAsmtMetaVO latestMeta02 = researchMapper.findLatestMetaByRsltGroupStcdBatch( asmtSnList, AnalysisTypeStatus.ANALYSIS_CDM.code() ).stream().findFirst().orElse( null );
      TbCmEAsmtMetaVO latestMeta04 = researchMapper.findLatestMetaByRsltGroupStcdBatch( asmtSnList, AnalysisTypeStatus.ANALYSIS_META.code() ).stream().findFirst().orElse( null );
      List<TbCmEAsmtMetaVO> latestMeta03ByOrg = researchMapper.findLatestOrgAnalysisForStatusCheckBatch( asmtSnList );

      String prgrsRaw = vo.getAsmtPrgrsSttsCd();
      String asmtPrgrsSttsCd = prgrsRaw != null ? prgrsRaw.trim() : "";
      boolean isExcludedStatus = ResearchStatus.INVITATION_REQUEST.code().equals( asmtPrgrsSttsCd ) || ResearchStatus.COMPLETED.code().equals( asmtPrgrsSttsCd ) || ResearchStatus.CANCELLED.code().equals( asmtPrgrsSttsCd );

      if (!isExcludedStatus) {
        long meta03CompletedCount = latestMeta03ByOrg.stream().filter( m -> AnalysisResultStatus.COMPLETED.code().equals( m.getAsmtMetaRsltSttsCd() ) ).count();

        if (latestMeta02 == null || (!AnalysisResultStatus.COMPLETED.code().equals( latestMeta02.getAsmtMetaRsltSttsCd() ) && meta03CompletedCount == 0)) {
          asmtPrgrsSttsCd = ResearchStatus.IN_PROGRESS.code();
        }
        if (latestMeta04 != null && !AnalysisResultStatus.COMPLETED.code().equals( latestMeta04.getAsmtMetaRsltSttsCd() )) {
          asmtPrgrsSttsCd = ResearchStatus.IN_PROGRESS_META.code();
        }

        vo.setAsmtPrgrsSttsCd( asmtPrgrsSttsCd.trim() );
      }
    }
    // 연구과제 참여기관 상태 설정
    else {
      // 상태 설정 로직 추가
    }

    // ResearchMemberVO의 instBrno를 이용하여 TbCmMAsmtPrcpVO 조회
    TbCmMAsmtPrcpVO asmtPrcp = null;
    if (!memberAndInst.getUserType().equals( RoleType.ADMIN.code() )) {
      if (!vo.getInstId().equals( memberAndInst.getInstBrno() )) {
        if (memberAndInst != null && memberAndInst.getInstBrno() != null) {
          asmtPrcp = researchMapper.findPartnerByAsmtSnAndInstId( id, memberAndInst.getInstBrno() );

          if (asmtPrcp == null || ParticipationStatus.NOT_PARTICIPATING.code().equals( asmtPrcp.getPtcpPrgrsSttsCd() )) {
            throw new IllegalArgumentException( "권한이 없습니다." );
          }
        }
      }
    }

    // 첨부파일 목록 조회 (fileSeCd 14: RESEARCH_ATTACHED 첨부파일, 05: RESEARCH_QUERIES 분석질의)
    List<CaFileItem> fileList = new ArrayList<>();
    List<CaFileItem> analysisFileList = new ArrayList<>();
    List<TbCmMFileUldVO> uldList = commonFileMapper.selectFileUldList( id, CmTaskCodeType.RESEARCH.code(), null );
    for (TbCmMFileUldVO uld : uldList) {
      String groupId = uld.getAtchFileId();
      String fileSeCd = uld.getFileSeCd();
      if (groupId == null || groupId.isBlank() || fileSeCd == null) {
        continue;
      }
      List<CaFileItem> items = FileApiService.toCaFileItemsFromCa( fileApiService, groupId );
      for (CaFileItem item : items) {
        if (FileCodeType.RESEARCH_QUERIES.code().equals( fileSeCd )) {
          analysisFileList.add( item );
        } else if (FileCodeType.RESEARCH_ATTACHED.code().equals( fileSeCd )) {
          fileList.add( item );
        }
      }
    }

    return ResearchDetailResponse.from( vo, instNm, rgtrNm, asmtMetaRsltSttsCd, asmtPrcp, fileList, analysisFileList );
  }

  // 연구과제 등록
  @Override
  @Transactional
  public Long createResearch( ResearchMemberVO memberAndInst, ResearchCreateRequest request, List<MultipartFile> files, List<MultipartFile> analysisFiles ) {

    String middleId = null;
    String instId = null;
    TbPpMInstTaskVO instTask;

    if (RoleType.ADMIN.code().equals( memberAndInst.getUserType() )) {
      middleId = researchMapper.findDeptNoByDeptNm( "한국의약품안전관리원" );
      instId = middleId;
    } else {
      instTask = researchMapper.findInstTaskByBrnoAndTaskSeCm( memberAndInst.getInstBrno() );
      if (instTask == null || instTask.getBzmnTaskMngNo() == null || instTask.getBzmnTaskMngNo().isBlank()) {
        throw new IllegalArgumentException( "CDM빅데이터분석 권한을 찾을 수 없습니다." );
      }
      middleId = instTask.getBzmnTaskMngNo().trim();
      instId = instTask.getBrno();
    }

    int currentYear = Year.now().getValue();
    int count = researchMapper.countByYearAndInstId( currentYear, instId );
    int sequence = count + 1;
    String sequenceStr = String.format( "%03d", sequence );
    String asmtId = String.format( "%d-%s-%s", currentYear, middleId, sequenceStr );
    String createBy = memberAndInst.getUserNo();

    TbCmMAsmtVO researchVo = TbCmMAsmtVO.create( asmtId, request.getAsmtNm(), request.getAsmtArtclDtlCn(), request.getFlfmtBgngDt(), request.getFlfmtEndDt(), instId, ResearchStatus.INVITATION_REQUEST.code(), createBy );
    researchMapper.insert( researchVo );
    Long asmtSn = researchVo.getAsmtSn();

    if (!CollectionUtils.isEmpty( request.getAsmtPrcpInsttList() )) {
      List<TbCmMAsmtPrcpVO> partnerVOs = new ArrayList<>();
      String asmtRqstrId = researchVo.getRgtrId();
      for (String insttId : request.getAsmtPrcpInsttList()) {
        TbCmMAsmtPrcpVO partnerVO = TbCmMAsmtPrcpVO.create( asmtSn, insttId, asmtRqstrId, createBy );
        partnerVO.setBrno( insttId );
        TbCmMUldPrstVO latestUldPrst = researchMapper.findLatestUldPrstByInstId( insttId );
        if (latestUldPrst != null) {
          partnerVO.setUldTypeCd( latestUldPrst.getUldTypeCd() );
        }
        partnerVOs.add( partnerVO );
      }
      researchMapper.insertPartners( partnerVOs );

      // 참여기관에게 이메일 발송
      for (TbCmMAsmtPrcpVO partner : partnerVOs) {
        String subject = "[한국의약품안전관리원] " + researchVo.getAsmtNm() + " 연구과제 참여 요청";
        Map<String, Object> vars = new HashMap<>();
        vars.putAll( emailContentGenerator.commonVars() );
        vars.put( "asmtNm", researchVo.getAsmtNm() );
        String body = emailContentGenerator.render( "mail/partner-invite.html", vars );
        mailApiService.sendHtmlMail( partner.getInstId(), null, subject, body );
      }
    }

    if (files != null && !files.isEmpty()) {
      for (MultipartFile file : files) {
        caFileUploadService.uploadWithCaAndUld( asmtSn, null, List.of( file ), createBy, KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), FileCodeType.RESEARCH_ATTACHED.code() );
      }
    }
    if (analysisFiles != null && !analysisFiles.isEmpty()) {
      for (MultipartFile file : analysisFiles) {
        caFileUploadService.uploadWithCaAndUld( asmtSn, null, List.of( file ), createBy, KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), FileCodeType.RESEARCH_QUERIES.code() );
      }
    }

    return asmtSn;
  }

  // 연구과제 수정
  @Override
  @Transactional
  public void updateResearch( Long id, ResearchUpdateRequest request, List<String> deleteFileIds, List<MultipartFile> files, List<MultipartFile> analysisFiles, String mdfrId ) {
    TbCmMAsmtVO vo = request.toVO();
    vo.setAsmtSn( id );
    researchMapper.updateResearch( vo );

    long asmtSn = id;
    String mdfrIdToUse = mdfrId != null ? mdfrId : "system";

    if (deleteFileIds != null && !deleteFileIds.isEmpty()) {
      Map<String, String> fileIndex = buildFileIdToGroupIdIndex( asmtSn, FileCodeType.RESEARCH_ATTACHED.code() );
      for (String fileId : deleteFileIds) {
        String groupId = fileIndex.get( fileId );
        if (groupId != null) {
          fileApiService.deleteFileOne( fileId, groupId );
        }
      }
    }
    if (deleteFileIds != null && !deleteFileIds.isEmpty()) {
      Map<String, String> fileIndex = buildFileIdToGroupIdIndex( asmtSn, FileCodeType.RESEARCH_QUERIES.code() );
      for (String fileId : deleteFileIds) {
        String groupId = fileIndex.get( fileId );
        if (groupId != null) {
          fileApiService.deleteFileOne( fileId, groupId );
        }
      }
    }

    if (files != null && !files.isEmpty()) {
      for (MultipartFile file : files) {
        caFileUploadService.uploadWithCaAndUld( asmtSn, null, List.of( file ), mdfrIdToUse, KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), FileCodeType.RESEARCH_ATTACHED.code() );
      }
    }
    if (analysisFiles != null && !analysisFiles.isEmpty()) {
      for (MultipartFile file : analysisFiles) {
        caFileUploadService.uploadWithCaAndUld( asmtSn, null, List.of( file ), mdfrIdToUse, KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), FileCodeType.RESEARCH_QUERIES.code() );
      }
    }
  }

  // 연구과제 삭제
  @Override
  @Transactional
  public void deleteResearch( Long id ) {
    researchMapper.deleteResearch( id );
  }

  // 연구과제 마감
  @Override
  @Transactional
  public void closeResearch( ResearchMemberVO memberAndInst, Long asmtSn, String asmtClsCn ) {
    // 연구과제 존재 여부 확인
    ResearchAsmtDetailVO researchRow = researchMapper.findById( asmtSn );
    if (researchRow == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
    }
    TbCmMAsmtVO researchVo = researchRow.toTbCmMAsmtVO();

    // 연구결과(메타분석) 검토완료 상태 확인
    TbCmEAsmtMetaVO latestMeta = researchMapper.findLatestMetaAnalysisByRsltGroupStcd( asmtSn, AnalysisTypeStatus.ANALYSIS_META.code() );
    if (latestMeta == null || !AnalysisResultStatus.COMPLETED.code().equals( latestMeta.getAsmtMetaRsltSttsCd() )) {
      throw new IllegalArgumentException( "연구결과(메타분석)이 검토완료 상태가 아닙니다" );
    }

    String updateBy = memberAndInst.getUserNo();
    researchMapper.closeResearch( asmtSn, ResearchStatus.COMPLETED.code(), asmtClsCn, updateBy );

    // 참여기관 조회
    List<TbCmMAsmtPrcpVO> partners = researchMapper.findActivePartnersByAsmtSn( asmtSn );
    // 참여기관 전체 마감 처리
    if (!partners.isEmpty()) {
      List<TbCmMAsmtPrcpVO> asmtPrcpVos = new ArrayList<>();
      for (TbCmMAsmtPrcpVO partner : partners) {
        TbCmMAsmtPrcpVO asmtPrcpVo = new TbCmMAsmtPrcpVO();
        asmtPrcpVo.setAsmtSn( asmtSn );
        asmtPrcpVo.setInstId( partner.getInstId() );
        asmtPrcpVo.setPtcpPrgrsSttsCd( ResearchPartnerStatus.RESEARCH_COMPLETED.code() );
        asmtPrcpVo.setMdfrId( updateBy );
        // asmtPrcpVo.setMdfcnDt( LocalDateTime.now() );
        // asmtPrcpVo.setMdfcnPrgmId( updateBy );
        asmtPrcpVos.add( asmtPrcpVo );
      }
      researchMapper.updateAsmtPrcpRsltCnBatch( asmtPrcpVos );
    }
    // 관리자에게 이메일 발송
    List<AsmtPersonResponse> asmtPersonList = researchMapper.selectAsmtPersonList().stream().map( AsmtPersonResponse::from ).collect( Collectors.toList() );
    for (AsmtPersonResponse person : asmtPersonList) {
      String subject = "[한국의약품안전관리원] 연구과제 마감 안내";
      Map<String, Object> vars = new HashMap<>();
      vars.putAll( emailContentGenerator.commonVars() );
      vars.put( "title", "연구과제 마감" );
      vars.put( "description", "연구과제가 마감 처리되었습니다." );
      vars.put( "contentLabel", "내용" );
      vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 연구과제 마감처리 되었습니다." );
      String body = emailContentGenerator.render( "mail/common-notice.html", vars );
      mailApiService.sendHtmlMail( null, person.getEmpNo(), subject, body );
    }

    // user_se_cd='02'(DB) 계정에서 분석 스키마명을 조회 후, 마감 시점에 해당 스키마 데이터를 삭제
    // (deactivateAsmtAccountsByAsmtSn에서 asmt_sn 매핑을 해제하므로 조회는 deactivate 이전에 수행)
    TbCmMAsmtAccountVO dbAccount = researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSn, "02" );
    String targetSchema = dbAccount != null ? dbAccount.getAsmtAnalysisSchema() : null;
    if (targetSchema != null) {
      targetSchema = targetSchema.trim();
    }

    if (targetSchema != null && !targetSchema.isBlank()) {
      try {
        AnalysisDatasetCopyService.validateTargetSchema( targetSchema );
        truncateAllAnalysisSchemaTables( targetSchema );
      } catch (IllegalStateException | IllegalArgumentException e) {
        log.warn( "분석 데이터 스키마 삭제 실패: schema={},", targetSchema );
      }
    }

    // 과제 사용자 계정 비활성화 (asmt_sn 매핑 해제 + use_yn = 'N')
    researchMapper.deactivateAsmtAccountsByAsmtSn( asmtSn, updateBy );

    // 참여기관에게 이메일 발송
    for (TbCmMAsmtPrcpVO partner : partners) {
      String subject = "[한국의약품안전관리원] 연구과제 마감 안내";
      Map<String, Object> vars = new HashMap<>();
      vars.putAll( emailContentGenerator.commonVars() );
      vars.put( "title", "연구과제 마감" );
      vars.put( "description", "연구과제가 마감 처리되었습니다." );
      vars.put( "contentLabel", "내용" );
      vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 연구과제가 마감되었습니다." );
      String body = emailContentGenerator.render( "mail/common-notice.html", vars );
      mailApiService.sendHtmlMail( partner.getInstId(), null, subject, body );
    }
  }

  // 연구과제 취소
  @Override
  @Transactional
  public void cancelResearch( ResearchMemberVO memberAndInst, Long asmtSn, String asmtClsCn ) {
    ResearchAsmtDetailVO researchRow = researchMapper.findById( asmtSn );
    if (researchRow == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
    }

    TbCmMAsmtVO researchVo = researchRow.toTbCmMAsmtVO();

    String updateBy = memberAndInst.getUserNo();

    researchMapper.closeResearch( asmtSn, ResearchStatus.CANCELLED.code(), asmtClsCn, updateBy );

    // 참여기관 조회
    List<TbCmMAsmtPrcpVO> partners = researchMapper.findActivePartnersByAsmtSn( asmtSn );
    // 참여기관 전체 마감 처리
    if (!partners.isEmpty()) {
      List<TbCmMAsmtPrcpVO> asmtPrcpVos = new ArrayList<>();
      for (TbCmMAsmtPrcpVO partner : partners) {
        TbCmMAsmtPrcpVO asmtPrcpVo = new TbCmMAsmtPrcpVO();
        asmtPrcpVo.setAsmtSn( asmtSn );
        asmtPrcpVo.setInstId( partner.getInstId() );
        asmtPrcpVo.setPtcpPrgrsSttsCd( ResearchPartnerStatus.RESEARCH_CANCEL.code() );
        asmtPrcpVo.setMdfrId( updateBy );
        asmtPrcpVos.add( asmtPrcpVo );
      }
      researchMapper.updateAsmtPrcpRsltCnBatch( asmtPrcpVos );
    }

    // 관리자에게 이메일 발송
    List<AsmtPersonResponse> asmtPersonList = researchMapper.selectAsmtPersonList().stream().map( AsmtPersonResponse::from ).collect( Collectors.toList() );
    for (AsmtPersonResponse person : asmtPersonList) {
      String subject = "[한국의약품안전관리원] 연구과제 마감 안내";
      Map<String, Object> vars = new HashMap<>();
      vars.putAll( emailContentGenerator.commonVars() );
      vars.put( "title", "연구과제 마감" );
      vars.put( "description", "연구과제가 마감 처리되었습니다." );
      vars.put( "contentLabel", "내용" );
      vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 연구과제 마감처리 되었습니다." );
      String body = emailContentGenerator.render( "mail/common-notice.html", vars );
      mailApiService.sendHtmlMail( null, person.getEmpNo(), subject, body );
    }

    // user_se_cd='02'(DB) 계정에서 분석 스키마명을 조회 후, 마감 시점에 해당 스키마 데이터를 삭제
    // (deactivateAsmtAccountsByAsmtSn에서 asmt_sn 매핑을 해제하므로 조회는 deactivate 이전에 수행)
    TbCmMAsmtAccountVO dbAccount = researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSn, "02" );
    String targetSchema = dbAccount != null ? dbAccount.getAsmtAnalysisSchema() : null;
    if (targetSchema != null) {
      targetSchema = targetSchema.trim();
    }

    if (targetSchema != null && !targetSchema.isBlank()) {
      try {
        AnalysisDatasetCopyService.validateTargetSchema( targetSchema );
        truncateAllAnalysisSchemaTables( targetSchema );
      } catch (IllegalStateException | IllegalArgumentException e) {
        log.warn( "분석 데이터 스키마 삭제 실패: schema={}, exceptionType={}", targetSchema, e.getClass().getSimpleName() );
        log.debug( "분석 데이터 스키마 삭제 실패 상세", e );
      }
    }

    // 과제 사용자 계정 비활성화 (asmt_sn 매핑 해제 + use_yn = 'N')
    researchMapper.deactivateAsmtAccountsByAsmtSn( asmtSn, updateBy );

    // 참여기관에게 이메일 발송
    for (TbCmMAsmtPrcpVO partner : partners) {
      String subject = "[한국의약품안전관리원] 연구과제 취소 안내";
      Map<String, Object> vars = new HashMap<>();
      vars.putAll( emailContentGenerator.commonVars() );
      vars.put( "title", "연구과제 취소" );
      vars.put( "description", "연구과제가 취소 처리되었습니다." );
      vars.put( "contentLabel", "내용" );
      vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 연구과제 취소되었습니다." );
      String body = emailContentGenerator.render( "mail/common-notice.html", vars );
      mailApiService.sendHtmlMail( partner.getInstId(), null, subject, body );
    }

  }

  // 참여기관 목록 조회
  @Override
  @Transactional(readOnly = true)
  public List<ResearchPartnerResponse> searchPartners( ResearchMemberVO memberAndInst, Long asmtSn ) {
    List<ResearchPartnerResponse> partners;
    if (memberAndInst.getIsAdmin() || RoleType.ADMIN.code().equals( memberAndInst.getUserType() )) {
      partners = researchMapper.searchPartners( asmtSn, AnalysisResultStatus.EXCLUDED.code(), ASMT_OPNN_STTS_NON_CONSENT ).stream().map( ResearchPartnerResponse::from ).collect( Collectors.toList() );
    } else {
      partners = researchMapper.searchPartnersByAsmtSnAndInstId( asmtSn, memberAndInst.getInstBrno(), AnalysisResultStatus.EXCLUDED.code(), ASMT_OPNN_STTS_NON_CONSENT ).stream().map( ResearchPartnerResponse::from ).collect( Collectors.toList() );
    }
    for (ResearchPartnerResponse partner : partners) {
      // 등록자명: 직원명 우선, 없으면 회원명 복호화
      String rgtrNm = partner.getEmpNm();
      if (rgtrNm == null || rgtrNm.isBlank()) {
        rgtrNm = decryptApiService.decryptMbrFlnm( partner.getMbrEncptFlnm() );
      }
      partner.setRgtrNm( rgtrNm );

      // 철회자명: 직원명 우선, 없으면 회원명 복호화
      String rtrcnNm = partner.getAsmtPtcpRtrcnEmpNm();
      if (rtrcnNm == null || rtrcnNm.isBlank()) {
        rtrcnNm = decryptApiService.decryptMbrFlnm( partner.getAsmtPtcpRtrcnMbrEncptFlnm() );
      }
      partner.setAsmtPtcpRtrcnNm( rtrcnNm );
      partner.setIrbFiles( findIrbFilesByPtcpInstSn( asmtSn, partner.getAsmtPtcpInstSn(), partner.getInstId() ) );
    }
    return partners;
  }

  // 참여기관(asmtPtcpInstSn)별 IRB/DRB 파일 목록 조회
  private List<CaFileItem> findIrbFilesByPtcpInstSn( Long asmtSn, Long ptcpInstSn, String instId ) {
    List<CaFileItem> result = new ArrayList<>();

    // 1) IRB: 기존 방식 유지 (asmtSn + ptcpInstSn 기반)
    if (asmtSn != null && ptcpInstSn != null) {
      List<TbCmMFileUldVO> irbUldList = commonFileMapper.selectFileUldListByAsmtSnAndPtcpInstSn( asmtSn, ptcpInstSn );
      String irbCode = FileCodeType.RESEARCH_IRB.code();
      for (TbCmMFileUldVO uld : irbUldList) {
        if (!irbCode.equals( uld.getFileSeCd() )) {
          continue;
        }
        for (CaFileItem f : FileApiService.toCaFileItemsFromCa( fileApiService, uld.getAtchFileId() )) {
          result.add( f );
        }
      }
    }

    // 2) DRB: 해당 기관 최신 ULD_PRST 1건의 pblntSn으로 조회
    if (instId != null && !instId.isBlank()) {
      TbCmMUldPrstVO latestPrst = researchMapper.findLatestUldPrstByInstId( instId );
      Long pblntSn = latestPrst != null ? latestPrst.getPblntSn() : null;
      if (pblntSn != null) {
        List<TbCmMFileUldVO> drbUldList = commonFileMapper.selectFileUldListByPstSnAndTaskAndFileSeCdAndInstId( pblntSn, CmTaskCodeType.CDM_NOTI.code(), FileCodeType.CDM_DRB.code(), instId );
        for (TbCmMFileUldVO uld : drbUldList) {
          if (uld.getFileId() != null && uld.getFileNm() != null) {
            result.add( new CaFileItem( uld.getFileId(), uld.getAtchFileId(), uld.getFileNm(), uld.getFileExtnNm(), uld.getFileSz() ) );
            continue;
          }
          // fallback: 조인 데이터가 없으면 기존 방식으로 그룹 조회
          for (CaFileItem f : FileApiService.toCaFileItemsFromCa( fileApiService, uld.getAtchFileId() )) {
            result.add( f );
          }
        }
      }
    }

    return result;
  }

  // 참여기관 조회
  @Override
  @Transactional(readOnly = true)
  public ResearchPartnerResponse findPartnerById( Long asmtSn, String asmtPtcpInstSn ) {
    Long asmtPtcpInstSnLong = Long.parseLong( asmtPtcpInstSn );
    ResearchPartnerResponse partner = ResearchPartnerResponse.from( researchMapper.findPartnerById( asmtSn, asmtPtcpInstSnLong ) );
    if (partner == null) {
      throw new IllegalArgumentException( "참여기관을 찾을 수 없습니다." );
    }

    String rgtrNm = partner.getEmpNm();
    if (rgtrNm == null || rgtrNm.isBlank()) {
      rgtrNm = decryptApiService.decryptMbrFlnm( partner.getMbrEncptFlnm() );
    }
    partner.setRgtrNm( rgtrNm );

    String rtrcnNm = partner.getAsmtPtcpRtrcnEmpNm();
    if (rtrcnNm == null || rtrcnNm.isBlank()) {
      rtrcnNm = decryptApiService.decryptMbrFlnm( partner.getAsmtPtcpRtrcnMbrEncptFlnm() );
    }
    partner.setAsmtPtcpRtrcnNm( rtrcnNm );

    partner.setIrbFiles( findIrbFilesByPtcpInstSn( asmtSn, partner.getAsmtPtcpInstSn(), partner.getInstId() ) );
    return partner;
  }

  // 참여기관 정보 저장
  @Override
  @Transactional
  public void createPartners( ResearchMemberVO memberAndInst, Long asmtSn, PartnerCreateRequest request ) {
    // 등록자아이디 (sessionUser에서 가져오거나 기본값 사용)
    String createBy = memberAndInst.getUserNo();

    // 연구과제 정보 조회 (과제요청자아이디를 가져오기 위해)
    ResearchAsmtDetailVO resultRow = researchMapper.findById( asmtSn );
    if (resultRow == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
    }
    TbCmMAsmtVO researchVo = resultRow.toTbCmMAsmtVO();

    // 참여기관 정보 저장 (기존에 없는 insttId만 insert, 1회 조회로 중복 제거)
    if (!CollectionUtils.isEmpty( request.getAsmtPrcpInsttList() )) {
      Set<String> existingInstIds = researchMapper.searchPartners( asmtSn, AnalysisResultStatus.COMPLETED.code(), null ).stream().map( v -> v.getInstId() ).collect( Collectors.toSet() );

      List<TbCmMAsmtPrcpVO> partnerVOs = request.getAsmtPrcpInsttList().stream().filter( insttId -> !existingInstIds.contains( insttId ) ).map( insttId -> {
        TbCmMAsmtPrcpVO v = TbCmMAsmtPrcpVO.create( asmtSn, insttId, researchVo.getRgtrId(), createBy );
        v.setBrno( insttId );
        TbCmMUldPrstVO latestUldPrst = researchMapper.findLatestUldPrstByInstId( insttId );
        if (latestUldPrst != null) {
          v.setUldTypeCd( latestUldPrst.getUldTypeCd() );
        }
        return v;
      } ).collect( Collectors.toList() );

      if (!partnerVOs.isEmpty()) {
        researchMapper.insertPartners( partnerVOs );

        // 참여기관에게 이메일 발송
        for (TbCmMAsmtPrcpVO partner : partnerVOs) {
          String subject = "[한국의약품안전관리원] " + researchVo.getAsmtNm() + " 연구과제 참여 요청";
          Map<String, Object> vars = new HashMap<>();
          vars.putAll( emailContentGenerator.commonVars() );
          vars.put( "asmtNm", researchVo.getAsmtNm() );

          String body = emailContentGenerator.render( "mail/partner-invite.html", vars );
          mailApiService.sendHtmlMail( partner.getInstId(), null, subject, body );
        }
      }
    }
  }

  // 업로드 IRB 파일
  @Override
  @Transactional
  public void uploadIrbFiles( ResearchMemberVO memberAndInst, Long asmtSn, List<MultipartFile> files ) {
    if (files == null || files.isEmpty()) {
      return;
    }
    String rgtrId = memberAndInst.getUserNo();
    for (MultipartFile file : files) {
      caFileUploadService.uploadWithCaAndUld( asmtSn, memberAndInst.getPartner() != null ? memberAndInst.getPartner().getAsmtPtcpInstSn() : null, List.of( file ), rgtrId, KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), FileCodeType.RESEARCH_IRB.code() );
    }
  }

  // IRB 파일 삭제
  @Override
  @Transactional
  public void deleteIrbFile( ResearchMemberVO memberAndInst, Long asmtSn, String atchFileId ) {
    if (asmtSn == null || atchFileId == null || atchFileId.isBlank()) {
      throw new IllegalArgumentException( "잘못된 요청입니다." );
    }

    // IRB: 본인 업로드분만 조회되므로, 목록 포함 여부로 삭제 권한을 함께 검증
    List<CaFileItem> irbFiles = findFilesByTaskAndFileSeCd( memberAndInst, asmtSn, CmTaskCodeType.RESEARCH.code(), FileCodeType.RESEARCH_IRB.code(), null );
    boolean existsInIrb = irbFiles.stream().anyMatch( f -> atchFileId.equals( f.atchFileId() ) );
    if (!existsInIrb) {
      // DRB로 조회되는 파일이면 '삭제 불가'를 명확히 반환
      List<CaFileItem> drbFiles = findFilesByTaskAndFileSeCd( memberAndInst, asmtSn, CmTaskCodeType.RESEARCH.code(), FileCodeType.CDM_DRB.code(), null );
      boolean existsInDrb = drbFiles.stream().anyMatch( f -> atchFileId.equals( f.atchFileId() ) );
      if (existsInDrb) {
        throw new IllegalArgumentException( "DRB 파일은 삭제할 수 없습니다." );
      }
      throw new IllegalArgumentException( "파일을 찾을 수 없습니다." );
    }

    Map<String, String> index = buildFileIdToGroupIdIndex( asmtSn, FileCodeType.RESEARCH_IRB.code() );
    String groupId = index.get( atchFileId );
    if (groupId != null) {
      fileApiService.deleteFileOne( atchFileId, groupId );
    }
  }

  // 참여기관 파일 업로드
  @Override
  @Transactional
  public void uploadPartnerFiles( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtPtcpInstSn, List<MultipartFile> files ) {
    if (files == null || files.isEmpty()) {
      return;
    }
    if (asmtPtcpInstSn == null) {
      throw new IllegalArgumentException( "참여기관 일련번호(asmtPtcpInstSn)는 필수입니다." );
    }
    String rgtrId = memberAndInst.getUserNo();
    for (MultipartFile file : files) {
      caFileUploadService.uploadWithCaAndUld( asmtSn, asmtPtcpInstSn, List.of( file ), rgtrId, KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), FileCodeType.RESEARCH_PARTNER.code() );
    }
  }

  // 연구과제 등록자/관리자 첨부파일 업로드 (file_se_cd=19)
  @Override
  @Transactional
  public void uploadAdminFiles( ResearchMemberVO memberAndInst, Long asmtSn, List<MultipartFile> files ) {
    if (files == null || files.isEmpty()) {
      return;
    }
    boolean isAdminCreator = Boolean.TRUE.equals( memberAndInst.getIsAdmin() );
    if (!isAdminCreator) {
      throw new IllegalArgumentException( "권한이 없습니다." );
    }
    String rgtrId = memberAndInst.getUserNo();
    for (MultipartFile file : files) {
      caFileUploadService.uploadWithCaAndUld( asmtSn, null, List.of( file ), rgtrId, KidsTaskCodeType.CDM.code(), CmTaskCodeType.RESEARCH.code(), FileCodeType.RESEARCH_ADMIN_ATTACHED.code() );
    }
  }

  // 연구과제 등록자/관리자 첨부파일 삭제 (file_se_cd=19)
  @Override
  @Transactional
  public void deleteAdminFile( ResearchMemberVO memberAndInst, Long asmtSn, String atchFileId ) {
    if (asmtSn == null || atchFileId == null || atchFileId.isBlank()) {
      throw new IllegalArgumentException( "잘못된 요청입니다." );
    }

    boolean isAdminCreator = Boolean.TRUE.equals( memberAndInst.getIsAdmin() );
    if (!isAdminCreator) {
      throw new IllegalArgumentException( "권한이 없습니다." );
    }

    List<CaFileItem> files = findFilesByTaskAndFileSeCd( memberAndInst, asmtSn, CmTaskCodeType.RESEARCH.code(), FileCodeType.RESEARCH_ADMIN_ATTACHED.code(), null );
    boolean exists = files.stream().anyMatch( f -> atchFileId.equals( f.atchFileId() ) );
    if (!exists) {
      throw new IllegalArgumentException( "파일을 찾을 수 없습니다." );
    }

    Map<String, String> index = buildFileIdToGroupIdIndex( asmtSn, FileCodeType.RESEARCH_ADMIN_ATTACHED.code() );
    String groupId = index.get( atchFileId );
    if (groupId != null) {
      fileApiService.deleteFileOne( atchFileId, groupId );
    }
  }

  // 참여기관 파일 삭제
  @Override
  @Transactional
  public void deletePartnerFile( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtPtcpInstSn, String atchFileId ) {
    if (asmtSn == null || asmtPtcpInstSn == null || atchFileId == null || atchFileId.isBlank()) {
      throw new IllegalArgumentException( "잘못된 요청입니다." );
    }

    TbCmMAsmtPrcpVO partner = researchMapper.findPartnerByAsmtSnAndPtcpInstSn( asmtSn, asmtPtcpInstSn );
    if (partner == null) {
      throw new IllegalArgumentException( "참여기관을 찾을 수 없습니다." );
    }

    List<CaFileItem> files = findFilesByTaskAndFileSeCd( memberAndInst, asmtSn, CmTaskCodeType.RESEARCH.code(), FileCodeType.RESEARCH_PARTNER.code(), asmtPtcpInstSn );
    boolean exists = files.stream().anyMatch( f -> atchFileId.equals( f.atchFileId() ) );
    if (!exists) {
      throw new IllegalArgumentException( "파일을 찾을 수 없습니다." );
    }

    Map<String, String> index = buildFileIdToGroupIdIndex( asmtSn, FileCodeType.RESEARCH_PARTNER.code() );
    String groupId = index.get( atchFileId );
    if (groupId != null) {
      fileApiService.deleteFileOne( atchFileId, groupId );
    }
  }

  // 과제/파일구분/참여기관 기준 파일 목록 조회
  @Override
  @Transactional(readOnly = true)
  public List<CaFileItem> findFilesByTaskAndFileSeCd( ResearchMemberVO memberAndInst, Long asmtSn, String uldTaskSeCd, String fileSeCd, Long ptcpInstSn ) {
    List<CaFileItem> result = new ArrayList<>();
    String taskCd = uldTaskSeCd != null && !uldTaskSeCd.isEmpty() ? uldTaskSeCd : CmTaskCodeType.RESEARCH.code();
    String code = fileSeCd != null && !fileSeCd.isEmpty() ? fileSeCd : null;
    if (code == null) {
      return result;
    }

    // DRB는 최신 pblntSn 기반으로만 조회 (uld_task_se_cd=04, file_se_cd=07)
    if (FileCodeType.CDM_DRB.code().equals( code )) {
      String instId;
      if (ptcpInstSn != null) {
        TbCmMAsmtPrcpVO partner = researchMapper.findPartnerByAsmtSnAndPtcpInstSn( asmtSn, ptcpInstSn );
        instId = partner != null ? partner.getInstId() : null;
      } else {
        instId = memberAndInst.getInstBrno();
      }
      if (instId == null || instId.isBlank()) {
        return result;
      }
      TbCmMUldPrstVO latestPrst = researchMapper.findLatestUldPrstByInstId( instId );
      Long pblntSn = latestPrst != null ? latestPrst.getPblntSn() : null;
      if (pblntSn == null) {
        return result;
      }
      taskCd = CmTaskCodeType.CDM_NOTI.code();
      List<TbCmMFileUldVO> uldList = commonFileMapper.selectFileUldListByPstSnAndTaskAndFileSeCdAndInstId( pblntSn, taskCd, code, instId );
      for (TbCmMFileUldVO uld : uldList) {
        if (uld.getFileId() != null && uld.getFileNm() != null) {
          result.add( new CaFileItem( uld.getFileId(), uld.getAtchFileId(), uld.getFileNm(), uld.getFileExtnNm(), uld.getFileSz() ) );
          continue;
        }
        String groupId = uld.getAtchFileId();
        for (CaFileItem f : FileApiService.toCaFileItemsFromCa( fileApiService, groupId )) {
          result.add( f );
        }
      }
      return result;
    }

    List<TbCmMFileUldVO> uldList;
    if ((FileCodeType.RESEARCH_IRB.code().equals( code ) || FileCodeType.CDM_DRB.code().equals( code ) || FileCodeType.RESEARCH_PARTNER.code().equals( code )) && ptcpInstSn != null) {
      uldList = commonFileMapper.selectFileUldListByAsmtSnAndPtcpInstSn( asmtSn, ptcpInstSn );
    } else {
      uldList = commonFileMapper.selectFileUldList( asmtSn, CmTaskCodeType.RESEARCH.code(), code );
    }
    String mbrId = memberAndInst.getUserNo();
    for (TbCmMFileUldVO uld : uldList) {
      if (!taskCd.equals( uld.getUldTaskSeCd() ) || !code.equals( uld.getFileSeCd() )) {
        continue;
      }
      if (FileCodeType.RESEARCH_IRB.code().equals( code ) && ptcpInstSn == null && !mbrId.equals( uld.getRgtrId() )) {
        continue;
      }
      String groupId = uld.getAtchFileId();
      for (CaFileItem f : FileApiService.toCaFileItemsFromCa( fileApiService, groupId )) {
        result.add( f );
      }
    }
    return result;
  }

  // 참여기관 참여취소
  @Override
  @Transactional
  public void cancelInvitePartner( ResearchMemberVO memberAndInst, Long asmtSn, String asmtPtcpInstSn, String asmtPtcpRtrcnRsn ) {
    // 참여기관 조회
    Long asmtPtcpInstSnLong = Long.parseLong( asmtPtcpInstSn );
    TbCmMAsmtPrcpVO partner = researchMapper.findPartnerByAsmtSnAndPtcpInstSn( asmtSn, asmtPtcpInstSnLong );
    if (partner == null) {
      throw new IllegalArgumentException( "참여기관을 찾을 수 없습니다." );
    }

    String updateBy = memberAndInst.getUserNo();

    // 참여기관 취소 정보 업데이트
    partner.setPtcpPrgrsSttsCd( ParticipationStatus.NOT_PARTICIPATING.code() );
    partner.setAsmtPtcpRtrcnId( updateBy );
    partner.setAsmtPtcpRtrcnRsn( asmtPtcpRtrcnRsn );
    partner.setAsmtPtcpRtrcnDt( LocalDateTime.now() );
    partner.setMdfrId( updateBy );
    partner.setMdfcnDt( LocalDateTime.now() );

    // 업데이트 실행
    researchMapper.updatePartner( partner );

    ResearchAsmtDetailVO researchRow = researchMapper.findById( asmtSn );
    if (researchRow == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
    }
    TbCmMAsmtVO researchVo = researchRow.toTbCmMAsmtVO();

    // 참여기관에게 이메일 발송
    if (memberAndInst.getInstBrno() != partner.getBrno()) {
      String subject = "[한국의약품안전관리원] 연구과제 참여 취소 안내";
      Map<String, Object> vars = new HashMap<>();
      vars.putAll( emailContentGenerator.commonVars() );
      vars.put( "title", "연구과제 참여 취소" );
      vars.put( "description", "연구과제 참여가 취소 처리되었습니다." );
      vars.put( "contentLabel", "내용" );
      vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 연구과제 참여 취소처리 되었습니다. 취소 사유: " + asmtPtcpRtrcnRsn );
      String body = emailContentGenerator.render( "mail/common-notice.html", vars );
      mailApiService.sendHtmlMail( partner.getInstId(), null, subject, body );
    }
  }

  // 참여기관 참여승인
  @Override
  @Transactional
  public void approveInvitePartner( ResearchMemberVO memberAndInst, Long asmtSn, String asmtPtcpInstSn, String asmtPtcpRtrcnRsn ) {
    // 참여기관 조회
    Long asmtPtcpInstSnLong = Long.parseLong( asmtPtcpInstSn );
    TbCmMAsmtPrcpVO partner = researchMapper.findPartnerByAsmtSnAndPtcpInstSn( asmtSn, asmtPtcpInstSnLong );
    if (partner == null) {
      throw new IllegalArgumentException( "참여기관을 찾을 수 없습니다." );
    }

    String updateBy = memberAndInst.getUserNo();

    // 참여기관 승인 정보 업데이트
    partner.setPtcpPrgrsSttsCd( ParticipationStatus.APPROVED.code() );
    partner.setAsmtPtcpAgreId( updateBy );
    partner.setAsmtPtcpAgreDt( LocalDateTime.now() );
    partner.setMdfrId( updateBy );
    partner.setMdfcnDt( LocalDateTime.now() );

    // 업데이트 실행
    researchMapper.updatePartner( partner );
  }

  // 연구과제 상태 변경
  @Override
  @Transactional
  public void updateResearchStatus( ResearchMemberVO memberAndInst, Long asmtSn, String asmtPrgrsSttsCd ) {
    // 연구과제 존재 여부 확인
    ResearchAsmtDetailVO researchRow = researchMapper.findById( asmtSn );
    if (researchRow == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
    }

    String updateBy = memberAndInst.getUserNo();
    if (asmtPrgrsSttsCd == null || asmtPrgrsSttsCd.isBlank()) {
      throw new IllegalArgumentException( "연구과제 진행상태 코드를 지정해 주세요." );
    }
    researchMapper.updateResearchStatus( asmtSn, asmtPrgrsSttsCd, updateBy );

    // 연구과제 상태가 참여요청 -> 진행중으로 변경될때
    if (ResearchStatus.IN_PROGRESS.code().equals( asmtPrgrsSttsCd )) {
      // 참여기관 조회
      List<ResearchPartnerResponse> partners = researchMapper.searchPartners( asmtSn, ResearchPartnerStatus.PARTICIPATING.code(), null ).stream().map( ResearchPartnerResponse::from ).collect( Collectors.toList() );
      // 미참여 제외
      partners = partners.stream().filter( partner -> !ResearchPartnerStatus.NOT_PARTICIPATING.code().equals( partner.getPtcpPrgrsSttsCd() ) ).collect( Collectors.toList() );
      // 참여기관 중 데이터 현황이 '현황' 기관 검색
      List<ResearchPartnerResponse> orgPartners = partners.stream().filter( partner -> !CdmUploadType.CDM.code().equals( partner.getUldTypeCd() ) ).collect( Collectors.toList() );

      // 기관들의 과제참여결과내역을 기관분석진행중(04) 상태로 한 번에 업데이트
      if (!orgPartners.isEmpty()) {
        List<TbCmMAsmtPrcpVO> asmtPrcpVos = new ArrayList<>();
        for (ResearchPartnerResponse partner : orgPartners) {
          if (ResearchPartnerStatus.NOT_PARTICIPATING.code().equals( partner.getPtcpPrgrsSttsCd() )) {
            continue;
          }

          TbCmMAsmtPrcpVO asmtPrcpVo = new TbCmMAsmtPrcpVO();
          asmtPrcpVo.setAsmtSn( asmtSn );
          asmtPrcpVo.setInstId( partner.getInstId() );
          asmtPrcpVo.setPtcpPrgrsSttsCd( ResearchPartnerStatus.INSTITUTION_ANALYSIS_IN_PROGRESS.code() );
          asmtPrcpVo.setMdfrId( updateBy );
          asmtPrcpVo.setMdfcnDt( LocalDateTime.now() );
          asmtPrcpVos.add( asmtPrcpVo );
        }
        if (!asmtPrcpVos.isEmpty()) {
          researchMapper.updateAsmtPrcpRsltCnBatch( asmtPrcpVos );
        }
      }

      // 이메일 발송
      // for (ResearchPartnerResponse partner : partners) {
      // String subject = "[한국의약품안전관리원] 연구과제 진행중 변경 안내";
      // Map<String, Object> vars = new HashMap<>();
      // vars.putAll( emailContentGenerator.commonVars() );
      // vars.put( "title", "연구과제 진행중 변경" );
      // vars.put( "description", "연구과제가 진행중으로 변경되었습니다." );
      // vars.put( "contentLabel", "내용" );
      // vars.put( "contentValue", "[" + researchRow.getAsmtNm() + "] 연구과제가 진행중으로 변경되었습니다." );
      // String body = emailContentGenerator.render( "mail/common-notice.html", vars );
      // mailApiService.sendHtmlMail( partner.getInstId(), null, subject, body );
      // }
    }
  }

  // 분석 데이터셋 복사 작업 제출
  @Override
  public AnalysisDatasetTaskResponse submitAnalysisDatasetCopy( Long asmtSn, String mbrId ) {
    return analysisDatasetCopyService.submitAnalysisDatasetCopy( asmtSn, mbrId );
  }

  // 분석 데이터셋 복사 작업 상태 조회
  @Override
  public AnalysisDatasetTaskResponse getAnalysisDatasetTaskStatus( String taskId ) {
    return analysisDatasetCopyService.getTaskStatus( taskId );
  }

  // 분석 데이터셋 복사 완료 이벤트 수신: 과제를 진행 상태로 변경 (기존 과제 시작 흐름과 동일)
  @EventListener
  @Transactional
  public void onAnalysisDatasetCopySuccess( AnalysisDatasetCopySuccessEvent event ) {
    Long asmtSn = event.getAsmtSn();
    String userNo = event.getUserNo();

    String empNo = null;
    String mbrNo = null;
    TbPpMEmpInfoVO empInfo = commonAuthrtMapper.selectEmpInfoByEmpNo( userNo );
    String userType;
    if (empInfo != null) {
      // 관리자 사용자
      empNo = empInfo.getEmpNo();
      userType = RoleType.ADMIN.code();
    } else {
      // 파트너 사용자
      MemberAndInstVO partnerInfo = commonAuthrtMapper.selectMemberAndInstByMbrId( userNo );
      if (partnerInfo == null) {
        throw new IllegalArgumentException( "사용자를 찾을 수 없습니다." );
      }
      mbrNo = partnerInfo.getMbrNo();
      userType = RoleType.PARTNER.code();
    }

    // 완료 이메일 전송
    try {
      ResearchMemberVO memberAndInst = researchMemberResolver.resolve( asmtSn, new CustomUserDetails( userType, userNo, null, userNo, null, userType, null, null, null, null, null ) );
      updateResearchStatus( memberAndInst, asmtSn, ResearchStatus.IN_PROGRESS.code() );

      ResearchAsmtDetailVO researchRow = researchMapper.findById( asmtSn );
      if (researchRow == null) {
        throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다." );
      }

      TbCmMAsmtVO researchVo = researchRow.toTbCmMAsmtVO();

      // 연구과제 생성자에게 전송
      {
        String subject = "[한국의약품안전관리원] 연구과제 분석 데이터셋 생성 완료 안내";
        Map<String, Object> vars = new HashMap<>();
        vars.putAll( emailContentGenerator.commonVars() );
        vars.put( "title", "분석 데이터셋 생성 완료" );
        vars.put( "description", "연구과제 분석 데이터셋 생성이 완료되었습니다." );
        vars.put( "contentLabel", "내용" );
        vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 연구과제 분석 데이터셋 생성 완료" );
        String body = emailContentGenerator.render( "mail/common-notice.html", vars );
        mailApiService.sendHtmlMail( empNo, mbrNo, subject, body );
      }

      // 참여기관에게 전송
      List<TbCmMAsmtPrcpVO> partners = researchMapper.findActivePartnersByAsmtSn( asmtSn );

      // CDM 참여기관에게 전송
      for (TbCmMAsmtPrcpVO partner : partners) {
        if (CdmUploadType.CDM.code().equals( partner.getUldTypeCd() )) {
          String subject = "[한국의약품안전관리원] 연구과제 진행중 변경 안내";
          Map<String, Object> vars = new HashMap<>();
          vars.putAll( emailContentGenerator.commonVars() );
          vars.put( "title", "연구과제 진행중 변경" );
          vars.put( "description", "연구과제가 진행중으로 변경되었습니다." );
          vars.put( "contentLabel", "내용" );
          vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 통합분석결과가 등록되면 검토를 진행해주세요." );
          String body = emailContentGenerator.render( "mail/common-notice.html", vars );
          mailApiService.sendHtmlMail( partner.getInstId(), null, subject, body );
        } else {
          String subject = "[한국의약품안전관리원] 연구과제 진행중 변경 안내";
          Map<String, Object> vars = new HashMap<>();
          vars.putAll( emailContentGenerator.commonVars() );
          vars.put( "title", "연구과제 진행중 변경" );
          vars.put( "description", "연구과제가 진행중으로 변경되었습니다." );
          vars.put( "contentLabel", "내용" );
          vars.put( "contentValue", "[" + researchVo.getAsmtNm() + "] 기관분석결과를 자체 CDM 분석결과를 등록해주세요." );
          String body = emailContentGenerator.render( "mail/common-notice.html", vars );
          mailApiService.sendHtmlMail( partner.getInstId(), null, subject, body );
        }
      }

    } catch (IllegalArgumentException | IllegalStateException | DataAccessException e) {
      log.warn( "분석 데이터셋 복사 완료 후 처리 실패: asmtSn={}, userNo={}", asmtSn, userNo );
    }
  }

  // 파일 ID와 그룹 ID 인덱스 생성
  private Map<String, String> buildFileIdToGroupIdIndex( Long pstSn, String fileCodeType ) {
    List<TbCmMFileUldVO> ulds = commonFileMapper.selectFileUldList( pstSn, CmTaskCodeType.RESEARCH.code(), fileCodeType );
    Map<String, String> index = new HashMap<>();
    if (ulds == null) {
      return index;
    }
    for (TbCmMFileUldVO uld : ulds) {
      String groupId = uld.getAtchFileId();
      if (groupId == null || groupId.isBlank()) {
        continue;
      }
      for (CaFileItem item : FileApiService.toCaFileItemsFromCa( fileApiService, groupId )) {
        index.putIfAbsent( item.atchFileId(), groupId );
      }
    }
    return index;
  }

  // 과제 마감 시 분석 스키마 데이터 정리 (실패 시 예외로 롤백 유도)
  private void truncateAllAnalysisSchemaTables( String targetSchema ) {
    // TRUNCATE는 FK 제약이 걸려있을 수 있어, 복사 시 사용하던 테이블 순서대로 처리합니다.
    // (schema/table 식별자는 quoteIdentifier로 안전하게 감싸며, 존재하지 않는 테이블/스키마면 예외를 발생시켜 롤백합니다.)
    try {
      for (String tableName : CDM_TABLES_ORDER) {
        truncateTable( targetSchema, tableName );
      }
      for (String tableName : SENTINEL_TABLES_ORDER) {
        truncateTable( targetSchema, tableName );
      }
    } catch (DataAccessException | IllegalArgumentException ex) {
      throw new IllegalStateException( "분석 스키마 데이터 삭제 실패: schema=" + targetSchema, ex );
    }
  }

  /** 단일 테이블 TRUNCATE; 식별자는 SqlIdentifierGuard 로만 조합 (? 바인딩 불가 → java:S2077 예외). */
  private void truncateTable( String targetSchema, String tableName ) {
    String safeSchema = SqlIdentifierGuard.requireValidIdentifier( targetSchema, "targetSchema" );
    String safeTable = SqlIdentifierGuard.requireAllowedIdentifier( tableName, "table", ANALYSIS_ALLOWED_TABLES );
    String sql = "DELETE FROM " + SqlIdentifierGuard.qualify( safeSchema, safeTable );
    jdbcTemplate.execute( sql );
  }

}
