package kr.or.kids.domain.cm.research.service.impl;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.kids.domain.cm.common.dto.CaFileItem;
import kr.or.kids.domain.cm.common.service.CommonFileService;
import kr.or.kids.domain.cm.common.service.FileApiService;
import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import kr.or.kids.domain.cm.common.vo.TbCmMFileUldVO;
import kr.or.kids.domain.cm.research.dto.AnalysisDatasetCondition;
import kr.or.kids.domain.cm.research.dto.AnalysisDatasetCopyResult;
import kr.or.kids.domain.cm.research.dto.AnalysisDatasetTaskResponse;
import kr.or.kids.domain.cm.research.dto.DomainConceptDto;
import kr.or.kids.domain.cm.research.dto.ResearchPartnerResponse;
import kr.or.kids.domain.cm.research.event.AnalysisDatasetCopySuccessEvent;
import kr.or.kids.domain.cm.research.mapper.ResearchMapper;
import kr.or.kids.domain.cm.research.service.AnalysisDatasetCopyService;
import kr.or.kids.domain.cm.research.service.AnalysisDatasetExcelParser;
import kr.or.kids.domain.cm.research.type.AccountTypeStatus;
import kr.or.kids.domain.cm.research.type.AnalysisResultStatus;
import kr.or.kids.domain.cm.research.type.AnalysisTypeStatus;
import kr.or.kids.domain.cm.research.vo.CohortRow;
import kr.or.kids.domain.cm.research.vo.ResearchAsmtDetailVO;
import kr.or.kids.domain.cm.research.vo.TbCmEAsmtMetaVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtAccountVO;
import kr.or.kids.domain.cm.upload.config.VocabularyConfig;
import kr.or.kids.global.security.SqlIdentifierGuard;
import kr.or.kids.global.type.CdmUploadType;
import kr.or.kids.global.type.FileCodeType;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AnalysisDatasetCopyServiceImpl implements AnalysisDatasetCopyService {

  // 이 구현체: 분석 데이터셋 CDM·Sentinel 테이블 복사 및 비동기 작업(taskMap) 상태 관리
  private final ResearchMapper researchMapper;
  private final JdbcTemplate jdbcTemplate;
  private final AnalysisDatasetExcelParser excelParser;
  private final VocabularyConfig vocabularyConfig;
  private final Executor taskExecutor;
  private final ApplicationEventPublisher applicationEventPublisher;
  private final CommonFileService commonFileService;
  private final FileApiService fileApiService;
  private final AnalysisDatasetCopyServiceImpl self;

  private static final String STATUS_SUCCESS = "SUCCESS";
  private static final String STATUS_RUNNING = "RUNNING";
  private static final String STATUS_NOT_FOUND = "NOT_FOUND";
  private static final String STATUS_FAILED = "FAILED";
  private static final String MSG_COPY_COMPLETED = "복사 작업이 완료되었습니다.";
  private static final String MSG_COPY_FAILED_GENERIC = "데이터셋 복사 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.";

  private static final String CTX_TARGET_SCHEMA = "targetSchema";
  private static final String CTX_SOURCE_SCHEMA = "sourceSchema";
  private static final String CTX_TABLE = "table";
  private static final String CTX_CONCEPT_COLUMN = "conceptColumn";

  // 의존성 주입(비동기 실행은 @Lazy self 프록시로 트랜잭션 경계 유지)
  public AnalysisDatasetCopyServiceImpl(ResearchMapper researchMapper, JdbcTemplate jdbcTemplate, AnalysisDatasetExcelParser excelParser, VocabularyConfig vocabularyConfig, @Qualifier("analysisDatasetCopyExecutor") Executor taskExecutor, ApplicationEventPublisher applicationEventPublisher,
      CommonFileService commonFileService, FileApiService fileApiService, @Lazy AnalysisDatasetCopyServiceImpl self) {
    this.researchMapper = researchMapper;
    this.jdbcTemplate = jdbcTemplate;
    this.excelParser = excelParser;
    this.vocabularyConfig = vocabularyConfig;
    this.taskExecutor = taskExecutor;
    this.applicationEventPublisher = applicationEventPublisher;
    this.commonFileService = commonFileService;
    this.fileApiService = fileApiService;
    this.self = self;
  }

  private static final String TBL_PERSON = "person";
  private static final String TBL_OBSERVATION_PERIOD = "observation_period";
  private static final String TBL_VISIT_OCCURRENCE = "visit_occurrence";
  private static final String TBL_CONDITION_OCCURRENCE = "condition_occurrence";
  private static final String TBL_DRUG_EXPOSURE = "drug_exposure";
  private static final String TBL_PROCEDURE_OCCURRENCE = "procedure_occurrence";
  private static final String TBL_MEASUREMENT = "measurement";
  private static final String TBL_OBSERVATION = "observation";
  private static final String TBL_DEATH = "death";

  // CDM 테이블 복사 순서 (person_id 있는 테이블만. FK: person → observation_period → visit_occurrence → ...)
  private static final List<String> CDM_TABLES_ORDER = List.of( TBL_PERSON, TBL_OBSERVATION_PERIOD, TBL_VISIT_OCCURRENCE, TBL_CONDITION_OCCURRENCE, TBL_DRUG_EXPOSURE, TBL_PROCEDURE_OCCURRENCE, TBL_MEASUREMENT, TBL_OBSERVATION, TBL_DEATH );

  // 테이블명 → concept 컬럼명 (concept 필터 있는 테이블만)
  private static final Map<String, String> TABLE_TO_CONCEPT_COLUMN = Map.of( TBL_CONDITION_OCCURRENCE, "condition_concept_id", TBL_DRUG_EXPOSURE, "drug_concept_id", TBL_PROCEDURE_OCCURRENCE, "procedure_concept_id", TBL_MEASUREMENT, "measurement_concept_id", TBL_OBSERVATION,
      "observation_concept_id" );

  // 도메인(영문) → 테이블명. Sheet2 domain 컬럼값으로 조회
  private static final Map<String, String> DOMAIN_TO_TABLE = Map.of( "Condition", TBL_CONDITION_OCCURRENCE, "Drug", TBL_DRUG_EXPOSURE, "Procedure", TBL_PROCEDURE_OCCURRENCE, "Measurement", TBL_MEASUREMENT, "Observation", TBL_OBSERVATION );

  // Sentinel 테이블 (inst_task_sn, patid) 기준 복사. procedure는 SQL 예약어라 식별자 따옴표 필요
  private static final List<String> SENTINEL_TABLES_ORDER = List.of( "cause_of_death", "demographic", "diagnosis", "dispensing", "encounter", "enrollment", "laboratory_result", "procedure", "sentinel_death", "vital_signs" );
  private static final Set<String> ALLOWED_TABLES = Set.copyOf( java.util.stream.Stream.concat( CDM_TABLES_ORDER.stream(), SENTINEL_TABLES_ORDER.stream() ).collect( Collectors.toSet() ) );
  // private static final Set<String> ALLOWED_TABLES = new HashSet<>(CDM_TABLES_ORDER);

  private final Map<String, TaskState> taskMap = new ConcurrentHashMap<>();

  // 분석 데이터셋 복사 요청: 검증·엑셀 해석 후 비동기 복사 시작 또는 즉시 성공(생략) 응답
  @Override
  public AnalysisDatasetTaskResponse submitAnalysisDatasetCopy( Long asmtSn, String mbrId ) {

    if (asmtSn == null) {
      throw new IllegalArgumentException( "과제 일련번호를 지정해 주세요." );
    }
    var asmtRow = researchMapper.findById( asmtSn );
    if (asmtRow == null) {
      log.warn( "과제를 찾을 수 없습니다. asmtSn={}", asmtSn );
      throw new IllegalArgumentException( "과제를 찾을 수 없습니다." );
    }

    List<ResearchPartnerResponse> cdmPartners = listCdmPartners( asmtSn );
    AnalysisDatasetTaskResponse early = earlySuccessIfNoCdmPartners( asmtSn, mbrId, cdmPartners );
    if (early != null) {
      return early;
    }

    List<String> instTaskSnList = buildInstTaskSnList( cdmPartners, asmtRow );

    String srvrFileNm = resolveDatasetExcelSrvrFileName( asmtSn );
    TbCmMAsmtAccountVO account = accountForDatasetCopy( asmtSn );
    AnalysisDatasetTaskResponse noSchema = earlySuccessIfNoAnalysisSchema( asmtSn, mbrId, account );
    if (noSchema != null) {
      return noSchema;
    }
    String targetSchema = account.getAsmtAnalysisSchema().trim();
    AnalysisDatasetCopyService.validateTargetSchema( targetSchema );
    String sourceSchema = SOURCE_SCHEMA_DEFAULT;

    ParsedDatasetExcel parsed = downloadAndParseDatasetExcel( srvrFileNm );

    return startAsyncDatasetCopy( asmtSn, mbrId, targetSchema, sourceSchema, instTaskSnList, parsed.condition, parsed.domainConcepts );
  }

  // 과제 CDM 업로드 타입 참여기관 목록 조회
  private List<ResearchPartnerResponse> listCdmPartners( Long asmtSn ) {
    var rows = researchMapper.searchPartners( asmtSn, AnalysisResultStatus.EXCLUDED.code(), null );
    if (rows == null) {
      return List.of();
    }
    return rows.stream().map( ResearchPartnerResponse::from ).filter( p -> CdmUploadType.CDM.code().equals( p.getUldTypeCd() ) ).toList();
  }

  // CDM 참여기관이 없으면 복사 생략·성공 이벤트 후 즉시 성공 응답
  private AnalysisDatasetTaskResponse earlySuccessIfNoCdmPartners( Long asmtSn, String mbrId, List<ResearchPartnerResponse> cdmPartners ) {
    if (!cdmPartners.isEmpty()) {
      return null;
    }
    String taskId = UUID.randomUUID().toString();
    publishCopySuccessEventIfMbrPresent( asmtSn, mbrId );
    taskMap.put( taskId, new TaskState( STATUS_SUCCESS, "CDM 참여기관이 없어 복사 작업을 생략하고 성공 처리했습니다.", List.of() ) );
    return AnalysisDatasetTaskResponse.builder().taskId( taskId ).status( STATUS_SUCCESS ).message( MSG_COPY_COMPLETED ).copyResults( List.of() ).build();
  }

  // 회원 ID가 있을 때만 복사 성공 이벤트 발행
  private void publishCopySuccessEventIfMbrPresent( Long asmtSn, String mbrId ) {
    if (asmtSn != null && mbrId != null && !mbrId.isBlank()) {
      applicationEventPublisher.publishEvent( new AnalysisDatasetCopySuccessEvent( this, asmtSn, mbrId ) );
    }
  }

  // 참여기관 inst_id 목록에 주관기관 inst_id를 포함한 inst_task_sn 후보 리스트 구성
  private List<String> buildInstTaskSnList( List<ResearchPartnerResponse> cdmPartners, ResearchAsmtDetailVO asmtRow ) {
    List<String> instTaskSnList = new ArrayList<>( cdmPartners.stream().map( ResearchPartnerResponse::getInstId ).filter( id -> id != null && !id.isBlank() ).distinct().toList() );
    if (instTaskSnList.isEmpty()) {
      throw new IllegalArgumentException( "참여기관의 업무 일련번호를 확인할 수 없습니다." );
    }
    String leadInstIdStr = asmtRow != null && asmtRow.getInstId() != null ? asmtRow.getInstId().trim() : "";
    if (leadInstIdStr.isEmpty()) {
      throw new IllegalArgumentException( "과제 주관기관 식별자(inst_id)를 확인할 수 없습니다." );
    }
    instTaskSnList.add( leadInstIdStr );
    return instTaskSnList;
  }

  // 최신 분석 데이터 메타·첨부에서 데이터셋 엑셀의 서버 파일명(srvr_file_nm) 조회
  private String resolveDatasetExcelSrvrFileName( Long asmtSn ) {
    TbCmEAsmtMetaVO latestMeta = researchMapper.findLatestMetaAnalysisByRsltGroupStcd( asmtSn, AnalysisTypeStatus.ANALYSIS_DATA.code() );
    if (latestMeta == null) {
      throw new IllegalArgumentException( "등록된 분석 데이터가 없습니다." );
    }
    Long asmtMetaRsltSn = latestMeta.getAsmtMetaRsltSn();
    List<TbCmMFileUldVO> uldList = commonFileService.selectFileUldList( asmtMetaRsltSn );
    if (uldList == null) {
      uldList = List.of();
    }
    List<TbCmMFileUldVO> datasetUlds = uldList.stream().filter( uld -> FileCodeType.RESEARCH_ANALYSIS_DATASET.code().equals( uld.getFileSeCd() ) ).toList();
    if (datasetUlds.isEmpty()) {
      throw new IllegalArgumentException( "분석 데이터셋 엑셀 파일이 없습니다." );
    }
    String atchFileGroupId = datasetUlds.get( 0 ).getAtchFileId();
    if (atchFileGroupId == null || atchFileGroupId.isBlank()) {
      throw new IllegalArgumentException( "분석 데이터셋 첨부파일 ID가 없습니다." );
    }
    List<CaFileItem> fileItems = new ArrayList<>();
    for (CaFileItem f : FileApiService.toCaFileItemsFromCa( fileApiService, atchFileGroupId )) {
      fileItems.add( f );
    }
    if (fileItems.isEmpty()) {
      throw new IllegalArgumentException( "분석 데이터셋 엑셀 파일을 찾을 수 없습니다." );
    }
    TbCaEFileTrsmVo file = commonFileService.selectFile( fileItems.get( 0 ).atchFileId() );
    if (file == null) {
      throw new IllegalArgumentException( "분석 데이터셋 엑셀 파일을 찾을 수 없습니다." );
    }
    String srvrFileNm = file.getSrvrFileNm();
    if (srvrFileNm == null || srvrFileNm.isBlank()) {
      throw new IllegalArgumentException( "분석 데이터셋 엑셀 서버 파일명이 없습니다." );
    }
    return srvrFileNm;
  }

  // DB 계정(분석 스키마) 정보 조회
  private TbCmMAsmtAccountVO accountForDatasetCopy( Long asmtSn ) {
    return researchMapper.findAsmtAccountByAsmtSnAndUserSeCd( asmtSn, AccountTypeStatus.DB.code() );
  }

  // 분석 스키마 미설정이면 복사 생략·성공 이벤트 후 즉시 성공 응답
  private AnalysisDatasetTaskResponse earlySuccessIfNoAnalysisSchema( Long asmtSn, String mbrId, TbCmMAsmtAccountVO account ) {
    if (account != null && account.getAsmtAnalysisSchema() != null && !account.getAsmtAnalysisSchema().isBlank()) {
      return null;
    }
    String taskId = UUID.randomUUID().toString();
    publishCopySuccessEventIfMbrPresent( asmtSn, mbrId );
    taskMap.put( taskId, new TaskState( STATUS_SUCCESS, "분석 스키마 미설정으로 복사 작업을 생략하고 성공 처리했습니다.", List.of() ) );
    return AnalysisDatasetTaskResponse.builder().taskId( taskId ).status( STATUS_SUCCESS ).message( MSG_COPY_COMPLETED ).copyResults( List.of() ).build();
  }

  // CA에서 엑셀 다운로드 후 파서로 조건·도메인 concept 목록 추출
  private ParsedDatasetExcel downloadAndParseDatasetExcel( String srvrFileNm ) {
    try {
      ResponseEntity<byte[]> caResponse = fileApiService.downloadFile( srvrFileNm );
      if (caResponse == null || !caResponse.getStatusCode().is2xxSuccessful() || caResponse.getBody() == null) {
        log.warn( "분석 데이터셋 엑셀 다운로드 실패: status={}, srvrFileNm={}", caResponse != null ? caResponse.getStatusCode() : null, srvrFileNm );
        throw new IllegalArgumentException( "분석 데이터셋 엑셀을 다운로드할 수 없습니다. 잠시 후 다시 시도해 주세요." );
      }
      try (InputStream is = new ByteArrayInputStream( caResponse.getBody() )) {
        AnalysisDatasetExcelParser.ParsedAnalysisDataset parsed = excelParser.parse( is );
        return new ParsedDatasetExcel( parsed.condition, parsed.domainConcepts );
      }
    } catch (IllegalArgumentException e) {
      throw e;
    } catch (Exception e) {
      log.error( "분석 데이터셋 엑셀 파싱 실패: srvrFileNm={}", srvrFileNm, e );
      throw new IllegalArgumentException( "엑셀 파일을 읽을 수 없습니다. 올바른 양식인지 확인해 주세요." );
    }
  }

  // taskId 등록 후 Executor에서 실제 복사(self) 실행; PG 스키마/테이블 부재만 생략·성공, 그 외 예외는 FAILED
  private AnalysisDatasetTaskResponse startAsyncDatasetCopy( Long asmtSn, String mbrId, String targetSchema, String sourceSchema, List<String> instTaskSnList, AnalysisDatasetCondition condition, List<DomainConceptDto> domainConcepts ) {
    String taskId = UUID.randomUUID().toString();
    taskMap.put( taskId, new TaskState( STATUS_RUNNING, "복사 진행 중", null ) );
    Long asmtSnRef = asmtSn;
    String mbrIdRef = mbrId;
    AnalysisDatasetCondition conditionRef = condition;
    List<DomainConceptDto> domainConceptsRef = domainConcepts;
    taskExecutor.execute( () -> {
      try {
        self.runAnalysisDatasetCopy( taskId, targetSchema, instTaskSnList, sourceSchema, asmtSnRef, mbrIdRef, conditionRef, domainConceptsRef );
      } catch (Exception e) {
        if (isPostgresMissingSchemaOrRelation( e )) {
          log.info( "분석 데이터셋 복사 중 스키마/테이블 부재로 생략 후 성공 처리합니다. taskId={}", taskId, e );
          if (asmtSnRef != null && mbrIdRef != null && !mbrIdRef.isBlank()) {
            applicationEventPublisher.publishEvent( new AnalysisDatasetCopySuccessEvent( this, asmtSnRef, mbrIdRef ) );
          }
          taskMap.put( taskId, new TaskState( STATUS_SUCCESS, "스키마 또는 테이블이 존재하지 않아 복사 작업을 생략하고 성공 처리했습니다.", List.of() ) );
        } else {
          log.error( "분석 데이터셋 복사 실패: taskId={}", taskId, e );
          taskMap.put( taskId, new TaskState( STATUS_FAILED, MSG_COPY_FAILED_GENERIC, List.of() ) );
        }
      }
    } );
    return AnalysisDatasetTaskResponse.builder().taskId( taskId ).status( STATUS_RUNNING ).message( "복사 작업이 시작되었습니다." ).copyResults( null ).build();
  }

  // 엑셀 파싱 결과: cohort 조건 + 시트2 도메인 concept
  private record ParsedDatasetExcel( AnalysisDatasetCondition condition, List<DomainConceptDto> domainConcepts ) {
  }

  // 비동기 작업 taskId의 상태·메시지·테이블별 복사 건수 조회
  @Override
  public AnalysisDatasetTaskResponse getTaskStatus( String taskId ) {
    if (taskId == null || taskId.isBlank()) {
      return AnalysisDatasetTaskResponse.builder().taskId( taskId ).status( STATUS_NOT_FOUND ).message( "작업을 찾을 수 없습니다." ).copyResults( null ).build();
    }
    TaskState state = taskMap.get( taskId );
    if (state == null) {
      return AnalysisDatasetTaskResponse.builder().taskId( taskId ).status( STATUS_NOT_FOUND ).message( "작업을 찾을 수 없습니다." ).copyResults( null ).build();
    }
    synchronized (state) {
      return AnalysisDatasetTaskResponse.builder().taskId( taskId ).status( state.status ).message( state.message ).copyResults( state.copyResults ).build();
    }
  }

  // 트랜잭션 내 cohort 조회·CDM/Sentinel 테이블 truncate·insert 복사 및 taskMap 완료 반영
  @Transactional(rollbackFor = Exception.class)
  public void runAnalysisDatasetCopy( String taskId, String targetSchema, List<String> instTaskSnList, String sourceSchema, Long asmtSn, String mbrId, AnalysisDatasetCondition condition, List<DomainConceptDto> domainConcepts ) {
    TaskState state = taskMap.get( taskId );
    if (state == null)
      return;
    if (taskId == null || taskId.isBlank() || targetSchema == null || targetSchema.isBlank() || sourceSchema == null || sourceSchema.isBlank() || instTaskSnList == null || instTaskSnList.isEmpty() || condition == null) {
      log.warn( "분석 데이터셋 복사 인자가 올바르지 않아 작업을 종료합니다. taskId={}", taskId );
      if (taskId != null && !taskId.isBlank()) {
        taskMap.put( taskId, new TaskState( STATUS_SUCCESS, "복사 조건이 올바르지 않아 작업을 생략했습니다.", List.of() ) );
      }
      if (asmtSn != null && mbrId != null && !mbrId.isBlank()) {
        applicationEventPublisher.publishEvent( new AnalysisDatasetCopySuccessEvent( this, asmtSn, mbrId ) );
      }
      return;
    }

    List<CohortRow> cohortRowsRaw = researchMapper.selectCohortForAnalysisDatasetByInstList( condition.getAnalysisStartDate(), condition.getAnalysisEndDate(), condition.getGenderConceptId(), instTaskSnList );
    List<CohortRow> cohortRows = cohortRowsRaw == null ? List.of() : cohortRowsRaw;
    List<CohortRow> cdmCohortRows = cohortRows.stream().filter( r -> r.getInstTaskSn() != null && !r.getInstTaskSn().isBlank() && r.getPersonId() != null ).toList();
    List<CohortRow> sentinelCohortRows = cohortRows.stream().filter( r -> r.getInstTaskSn() != null && !r.getInstTaskSn().isBlank() && r.getPatid() != null && !r.getPatid().isBlank() ).toList();
    if (cdmCohortRows.isEmpty() && sentinelCohortRows.isEmpty()) {
      applicationEventPublisher.publishEvent( new AnalysisDatasetCopySuccessEvent( this, asmtSn, mbrId ) );
      taskMap.put( taskId, new TaskState( STATUS_SUCCESS, "조건에 맞는 cohort가 없어 복사할 데이터가 없습니다.", List.of() ) );
      return;
    }

    String vocabularyConceptAncestorTable = vocabularyConfig.getQualifiedConceptAncestorTable();
    Map<String, Set<Integer>> domainConceptIds = buildDomainConceptIds( vocabularyConceptAncestorTable, domainConcepts );

    List<AnalysisDatasetCopyResult> copyResults = new ArrayList<>();

    try {
      if (!cdmCohortRows.isEmpty()) {
        for (String tableName : CDM_TABLES_ORDER) {
          truncateTable( targetSchema, tableName );
          long rows = cdmCohortRows.isEmpty() ? 0L : copyTable( sourceSchema, targetSchema, tableName, cdmCohortRows, domainConceptIds );
          copyResults.add( new AnalysisDatasetCopyResult( tableName, rows ) );
        }
      }

      // if (!sentinelCohortRows.isEmpty()) {
      // for (String tableName : SENTINEL_TABLES_ORDER) {
      // truncateTable( targetSchema, tableName );
      // long rows = copySentinelTable( sourceSchema, targetSchema, tableName, sentinelCohortRows );
      // copyResults.add( new AnalysisDatasetCopyResult( tableName, rows ) );
      // }
      // }
    } catch (DataAccessException e) {
      if (!isPostgresMissingSchemaOrRelation( e )) {
        throw e;
      }
      log.info( "분석 데이터셋 복사 중 스키마/테이블 오류로 작업을 생략하고 성공 처리합니다. taskId={}, targetSchema={}", taskId, targetSchema, e );
      if (asmtSn != null && mbrId != null && !mbrId.isBlank()) {
        applicationEventPublisher.publishEvent( new AnalysisDatasetCopySuccessEvent( this, asmtSn, mbrId ) );
      }
      taskMap.put( taskId, new TaskState( STATUS_SUCCESS, "스키마 또는 테이블이 존재하지 않아 복사 작업을 생략하고 성공 처리했습니다.", List.of() ) );
      return;
    }

    // 복사 성공 후 이벤트 발행 (리스너에서 과제 진행 상태로 변경 등 후속 처리)
    if (asmtSn != null && mbrId != null && !mbrId.isBlank()) {
      applicationEventPublisher.publishEvent( new AnalysisDatasetCopySuccessEvent( this, asmtSn, mbrId ) );
    }

    taskMap.put( taskId, new TaskState( STATUS_SUCCESS, "복사 완료", copyResults ) );
  }

  // PostgreSQL SQLSTATE 3F000·42P01: 스키마/테이블 부재만 생략·성공 처리(광범위 예외 가정 방지).
  private static boolean isPostgresMissingSchemaOrRelation( Throwable throwable ) {
    for (Throwable t = throwable; t != null; t = t.getCause()) {
      if (t instanceof SQLException sqlEx) {
        String state = sqlEx.getSQLState();
        if ("3F000".equals( state ) || "42P01".equals( state )) {
          return true;
        }
      }
    }
    return false;
  }

  // 도메인 문자열을 DOMAIN_TO_TABLE 키 형식으로 정규화(대소문자 무시, 예: drug → Drug)
  private static String normalizeDomainKey( String domain ) {
    if (domain == null || domain.isBlank())
      return domain;
    String t = domain.trim();
    return t.length() == 1 ? t.toUpperCase() : t.substring( 0, 1 ).toUpperCase() + t.substring( 1 ).toLowerCase();
  }

  // 도메인별 허용 concept_id 집합(조상 테이블에서 하위 concept + 본인 포함)
  private Map<String, Set<Integer>> buildDomainConceptIds( String vocabularyConceptAncestorTable, List<DomainConceptDto> domainConcepts ) {
    Map<String, Set<Integer>> map = new HashMap<>();
    if (domainConcepts == null)
      return map;
    for (DomainConceptDto dto : domainConcepts) {
      String domain = dto.getDomain();
      if (domain == null || dto.getConceptId() == null)
        continue;
      String domainKey = normalizeDomainKey( domain );
      Set<Integer> set = map.computeIfAbsent( domainKey, k -> new HashSet<>() );
      List<Integer> descendants = selectDescendantConceptIds( vocabularyConceptAncestorTable, dto.getConceptId() );
      if (descendants != null)
        set.addAll( descendants );
      set.add( dto.getConceptId() );
    }
    return map;
  }

  // 대상 스키마 테이블 TRUNCATE(식별자 SqlIdentifierGuard 검증; TRUNCATE는 ? 바인딩 불가로 S2077 억제)
  @SuppressWarnings("java:S2077")
  private void truncateTable( String targetSchema, String tableName ) {
    AnalysisDatasetCopyService.validateSourceSchema( SOURCE_SCHEMA_DEFAULT );
    AnalysisDatasetCopyService.validateTargetSchema( targetSchema );
    String safeSchema = SqlIdentifierGuard.requireValidIdentifier( targetSchema.trim(), CTX_TARGET_SCHEMA );
    String safeTable = SqlIdentifierGuard.requireAllowedIdentifier( tableName, CTX_TABLE, ALLOWED_TABLES );
    String sql = "DELETE FROM " + SqlIdentifierGuard.qualify( safeSchema, safeTable );

    log.info( sql.toString() );

    jdbcTemplate.execute( sql );
  }

  // (inst_task_sn, person_id) 쌍 배치 크기
  private static final int COHORT_PAIR_BATCH = 500;

  // 용어 concept_ancestor에서 ancestor 기준 하위·자기 자신 descendant_concept_id 조회(? 바인딩)
  private List<Integer> selectDescendantConceptIds( String vocabularyConceptAncestorTable, Integer conceptId ) {
    if (vocabularyConceptAncestorTable == null || vocabularyConceptAncestorTable.isBlank() || conceptId == null) {
      return List.of();
    }
    String[] parts = vocabularyConceptAncestorTable.split( "\\." );
    if (parts.length != 2) {
      log.warn( "vocabularyConceptAncestorTable 형식이 올바르지 않습니다. value={}", vocabularyConceptAncestorTable );
      throw new IllegalArgumentException( "용어 테이블 설정이 올바르지 않습니다. 관리자에게 문의해 주세요." );
    }
    String schema = SqlIdentifierGuard.requireValidIdentifier( parts[0].trim(), "vocabularySchema" );
    String table = SqlIdentifierGuard.requireValidIdentifier( parts[1].trim(), "vocabularyTable" );

    String sql = "SELECT ca.descendant_concept_id " + "FROM " + SqlIdentifierGuard.qualify( schema, table ) + " ca " + "WHERE ca.ancestor_concept_id = ? " + "UNION SELECT ?";

    return jdbcTemplate.query( sql, ps -> {
      ps.setInt( 1, conceptId );
      ps.setInt( 2, conceptId );
    }, ( rs, rowNum ) -> rs.getInt( 1 ) );
  }

  // CDM 테이블: (inst_task_sn, person_id) 배치 INSERT…SELECT, 도메인별 concept 컬럼 필터 선택 적용
  private long copyTable( String sourceSchema, String targetSchema, String tableName, List<CohortRow> cohortRows, Map<String, Set<Integer>> domainConceptIds ) {
    AnalysisDatasetCopyService.validateSourceSchema( sourceSchema );
    AnalysisDatasetCopyService.validateTargetSchema( targetSchema );
    String safeSourceSchema = SqlIdentifierGuard.requireValidIdentifier( sourceSchema.trim(), CTX_SOURCE_SCHEMA );
    String safeTargetSchema = SqlIdentifierGuard.requireValidIdentifier( targetSchema.trim(), CTX_TARGET_SCHEMA );
    String safeTable = SqlIdentifierGuard.requireAllowedIdentifier( tableName, CTX_TABLE, ALLOWED_TABLES );
    String conceptColumn = TABLE_TO_CONCEPT_COLUMN.get( tableName );
    String domainForTable = DOMAIN_TO_TABLE.entrySet().stream().filter( e -> e.getValue().equals( tableName ) ).map( Map.Entry::getKey ).findFirst().orElse( null );
    boolean hasConceptFilter = conceptColumn != null && domainForTable != null && domainConceptIds != null && domainConceptIds.containsKey( domainForTable );
    Set<Integer> conceptIds = (domainConceptIds != null && hasConceptFilter) ? domainConceptIds.get( domainForTable ) : null;

    long totalInserted = 0;
    for (int offset = 0; offset < cohortRows.size(); offset += COHORT_PAIR_BATCH) {
      int to = Math.min( offset + COHORT_PAIR_BATCH, cohortRows.size() );
      List<CohortRow> batch = cohortRows.subList( offset, to );
      String pairPlaceholders = batch.stream().map( r -> "(?,?)" ).collect( Collectors.joining( "," ) );
      StringBuilder sql = new StringBuilder();
      sql.append( "INSERT INTO " ).append( SqlIdentifierGuard.qualify( safeTargetSchema, safeTable ) );
      sql.append( " SELECT * FROM " ).append( SqlIdentifierGuard.qualify( safeSourceSchema, safeTable ) );
      sql.append( " WHERE (inst_task_sn::text, person_id) IN (" ).append( pairPlaceholders ).append( ")" );
      List<Object> args = new ArrayList<>();
      for (CohortRow row : batch) {
        args.add( row.getInstTaskSn() );
        args.add( row.getPersonId() );
      }
      if (hasConceptFilter && conceptIds != null && !conceptIds.isEmpty()) {
        sql.append( " AND " ).append( SqlIdentifierGuard.quoteIdentifier( SqlIdentifierGuard.requireValidIdentifier( conceptColumn, CTX_CONCEPT_COLUMN ) ) ).append( " IN (" );
        sql.append( String.join( ",", Collections.nCopies( conceptIds.size(), "?" ) ) ).append( ")" );
        args.addAll( conceptIds );
      }
      int inserted = jdbcTemplate.update( sql.toString(), args.toArray() );
      totalInserted += inserted;
    }

    return totalInserted;
  }

  // Sentinel 테이블: (inst_task_sn, patid) 배치 INSERT…SELECT(식별자 qualify로 procedure 등 예약어 처리)
  private long copySentinelTable( String sourceSchema, String targetSchema, String tableName, List<CohortRow> sentinelCohortRows ) {
    AnalysisDatasetCopyService.validateSourceSchema( sourceSchema );
    AnalysisDatasetCopyService.validateTargetSchema( targetSchema );
    String safeSourceSchema = SqlIdentifierGuard.requireValidIdentifier( sourceSchema.trim(), CTX_SOURCE_SCHEMA );
    String safeTargetSchema = SqlIdentifierGuard.requireValidIdentifier( targetSchema.trim(), CTX_TARGET_SCHEMA );
    String safeTable = SqlIdentifierGuard.requireAllowedIdentifier( tableName, CTX_TABLE, ALLOWED_TABLES );
    long totalInserted = 0;
    for (int offset = 0; offset < sentinelCohortRows.size(); offset += COHORT_PAIR_BATCH) {
      int to = Math.min( offset + COHORT_PAIR_BATCH, sentinelCohortRows.size() );
      List<CohortRow> batch = sentinelCohortRows.subList( offset, to );
      String pairPlaceholders = batch.stream().map( r -> "(?,?)" ).collect( Collectors.joining( "," ) );
      StringBuilder sql = new StringBuilder();
      sql.append( "INSERT INTO " ).append( SqlIdentifierGuard.qualify( safeTargetSchema, safeTable ) );
      sql.append( " SELECT * FROM " ).append( SqlIdentifierGuard.qualify( safeSourceSchema, safeTable ) );
      sql.append( " WHERE (inst_task_sn::text, patid) IN (" ).append( pairPlaceholders ).append( ")" );
      List<Object> args = new ArrayList<>();
      for (CohortRow row : batch) {
        args.add( row.getInstTaskSn() );
        args.add( row.getPatid() );
      }
      int inserted = jdbcTemplate.update( sql.toString(), args.toArray() );
      totalInserted += inserted;
    }
    return totalInserted;
  }

  private static final class TaskState {
    String status;
    String message;
    List<AnalysisDatasetCopyResult> copyResults;

    // 비동기 복사 작업의 상태·메시지·테이블별 결과 보관
    TaskState(String status, String message, List<AnalysisDatasetCopyResult> copyResults) {
      this.status = status;
      this.message = message;
      this.copyResults = copyResults;
    }
  }
}
