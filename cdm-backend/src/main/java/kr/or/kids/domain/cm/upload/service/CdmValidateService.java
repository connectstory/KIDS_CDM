package kr.or.kids.domain.cm.upload.service;

import kr.or.kids.domain.cm.upload.dto.*;
import kr.or.kids.domain.cm.upload.mapper.DisclosureMapper;
import kr.or.kids.domain.cm.upload.util.CdmOmopPrimaryKeyColumns;
import kr.or.kids.domain.cm.upload.mapper.DisclosurePartnerMapper;
import kr.or.kids.domain.cm.upload.util.UploadCsvPathResolver;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import kr.or.kids.global.config.FileUploadProperties;
import kr.or.kids.global.security.SqlIdentifierGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class CdmValidateService {

    private static final String TABLE_PREFIX = "tb_cm_i_tmpr_";

    private static final String KEY_ERR_NOCS_CAMEL = "errNocs";
    private static final String KEY_ERR_NOCS_SNAKE = "err_nocs";
    private static final String COL_INST_TASK_SN = "inst_task_sn";
    private static final String DEFAULT_SYSTEM_USER_ID = "SYSTEM";
    private static final String SQL_DELETE_FROM = "DELETE FROM ";
    private static final String SQL_EXISTS_TABLE_IN_SCHEMA =
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?)";
    private static final String SQL_GUARD_TABLE = "table";

    
    private static final String[] CDM_TEMP_TABLES = {
        "tb_cm_i_tmpr_enrollment", "tb_cm_i_tmpr_demographic", "tb_cm_i_tmpr_encounter", "tb_cm_i_tmpr_diagnosis",
        "tb_cm_i_tmpr_observation_period", "tb_cm_i_tmpr_dispensing", "tb_cm_i_tmpr_vital_signs", "tb_cm_i_tmpr_procedure",
        "tb_cm_i_tmpr_laboratory_result", "tb_cm_i_tmpr_person", "tb_cm_i_tmpr_measurement", "tb_cm_i_tmpr_procedure_occurrence",
        "tb_cm_i_tmpr_drug_exposure", "tb_cm_i_tmpr_condition_occurrence", "tb_cm_i_tmpr_visit_occurrence", "tb_cm_i_tmpr_death",
        "tb_cm_i_tmpr_condition_era", "tb_cm_i_tmpr_drug_era", "tb_cm_i_tmpr_device_exposure", "tb_cm_i_tmpr_episode",
        "tb_cm_i_tmpr_note", "tb_cm_i_tmpr_observation"
    };

    
    private static final Set<String> SENTINEL_TMPR_TABLE_NAMES = Set.of(
            "tb_cm_i_tmpr_enrollment",
            "tb_cm_i_tmpr_demographic",
            "tb_cm_i_tmpr_encounter",
            "tb_cm_i_tmpr_diagnosis",
            "tb_cm_i_tmpr_dispensing",
            "tb_cm_i_tmpr_vital_signs",
            "tb_cm_i_tmpr_procedure",
            "tb_cm_i_tmpr_laboratory_result"
    );

    private final CsvImportService csvImportService;
    private final UploadRuleCheckService ruleCheckService;
    private final FileUploadProperties fileUploadProperties;
    private final DisclosureMapper disclosureMapper;
    private final UploadCsvPathResolver uploadCsvPathResolver;
    private final DisclosurePartnerMapper disclosurePartnerMapper;

    private final DisclosureService disclosureService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.stats-schema:kids_own}")
    private String statsSchema;

    @Value("${app.schema:kids_link_own}")
    private String dbSchema;

    private final Map<String, MutableProgress> taskMap = new ConcurrentHashMap<>();

    
    private final Map<String, Boolean> pgCastExistsCache = new ConcurrentHashMap<>();

    
    private volatile Integer pgTextTypeOidCached;

    
    private void clearUldPrgrsYnFlag( Long pblntSn, Long ptcpInstSn, String userId ) {
        if (pblntSn == null || ptcpInstSn == null) {
            return;
        }
        try {
            String uid = userId != null ? userId : DEFAULT_SYSTEM_USER_ID;
            disclosurePartnerMapper.updateUldPrgrsYn( pblntSn, ptcpInstSn, "N", uid );

        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
    }

    /**
     * startValidation 처리를 수행한다.
     *
     * @param request request
     * @param pblntSn pblntSn
     * @return 처리 결과
     */
    public String startValidation(CdmValidateRequest request, Long pblntSn) {
        String taskId = UUID.randomUUID().toString();
        int total = request.tables().size();

        MutableProgress progress = new MutableProgress();
        progress.taskId = taskId;
        progress.status = "RUNNING";
        progress.totalCount = total;
        progress.startTimeMs = System.currentTimeMillis();
        progress.results = new ArrayList<>();
        taskMap.put(taskId, progress);

        if (request.ptcpInstSn() != null) {
            try {
                String uid = request.userId() != null ? request.userId() : DEFAULT_SYSTEM_USER_ID;
                disclosurePartnerMapper.updateUldPrgrsYn( pblntSn, request.ptcpInstSn(), "Y", uid );

            } catch (Exception ex) {
                UploadNonFatal.discard( ex );
            }
        }

        try {
            CompletableFuture.runAsync( () -> {
                try {
                    runValidation( taskId, request, pblntSn );
                } catch (Throwable t) {

                    MutableProgress p = taskMap.get( taskId );
                    if (p != null) {
                        synchronized (p) {
                            p.status = "ERROR";
                            p.errorMessage = "CDM 검증 중 오류가 발생했습니다.";
                            p.elapsedMs = System.currentTimeMillis() - p.startTimeMs;
                        }
                    }
                } finally {
                    clearUldPrgrsYnFlag( pblntSn, request.ptcpInstSn(), request.userId() );
                }
            } );
        } catch (Throwable submitEx ) {

            clearUldPrgrsYnFlag( pblntSn, request.ptcpInstSn(), request.userId() );
            throw submitEx;
        }

        return taskId;
    }

    /**
     * 조회 결과를 반환한다.
     *
     * @param taskId taskId
     * @return 처리 결과
     */
    public CdmValidateProgress getProgress(String taskId) {
        MutableProgress p = taskMap.get(taskId);
        if (p == null) {
            return new CdmValidateProgress(taskId, "NOT_FOUND", null, 0, 0, 0, 0, 0, "Task not found", List.of());
        }
        synchronized (p) {
            return new CdmValidateProgress(
                p.taskId, p.status, p.currentTable,
                p.completedCount, p.totalCount,
                p.startTimeMs, p.elapsedMs, p.estimatedRemainingMs,
                p.errorMessage,
                p.results != null ? List.copyOf(p.results) : List.of()
            );
        }
    }

    private void runValidation(String taskId, CdmValidateRequest request, Long pblntSn) {
        MutableProgress progress = taskMap.get(taskId);
        List<Long> durations = new ArrayList<>();
        boolean hasFailure = false;
        String lastErrorMessage = null;
        Set<String> failedTableNames = new LinkedHashSet<>();

        List<String> requestedTableNames = request.tables().stream().map(CdmValidateRequest.TableFile::tableName).toList();

        flushPartnerTempAndSecondaryStats(request, pblntSn, requestedTableNames);

        Long uldVrfcGrpSn = nextUldVrfcGrpSn();

        for (int i = 0; i < request.tables().size(); i++) {
            String failMsg = processOneValidationTable(i, request, pblntSn, progress, durations, uldVrfcGrpSn);
            if (failMsg != null) {
                hasFailure = true;
                lastErrorMessage = failMsg;
                CdmValidateRequest.TableFile failed = request.tables().get( i );
                if (failed != null && failed.tableName() != null) {
                    failedTableNames.add( failed.tableName() );
                }
            }
        }

        clearFailedPartnerTempDataBeforePromote( request, pblntSn, failedTableNames );
        CdmValidateRequest promoteRequest = buildPromoteRequestExcludingFailedTables( request, pblntSn, failedTableNames );
        runPromoteAndCleanupFiles(promoteRequest, pblntSn);

        if (hasFailure) {
            markRunValidationFailed(progress, lastErrorMessage);
            return;
        }

        persistPrimaryUldStatsSummary(request, pblntSn, requestedTableNames);

        synchronized (progress) {
            progress.status = "DONE";
            progress.currentTable = null;
            progress.elapsedMs = System.currentTimeMillis() - progress.startTimeMs;
            progress.estimatedRemainingMs = 0;
        }

    }

    /** 검증 실패한 테이블은 본DB 이관 대상에서 제외한다. */
    private CdmValidateRequest buildPromoteRequestExcludingFailedTables( CdmValidateRequest request, Long pblntSn, Set<String> failedTableNames ) {
        if (request == null || request.tables() == null || request.tables().isEmpty()
                || failedTableNames == null || failedTableNames.isEmpty()) {
            return request;
        }
        Set<String> failedTmpr = failedTableNames.stream()
                .map( CdmValidateService::ensureTmprTableName )
                .filter( Objects::nonNull )
                .collect( Collectors.toCollection( LinkedHashSet::new ) );
        if (failedTmpr.isEmpty()) {
            return request;
        }
        List<CdmValidateRequest.TableFile> promoteTables = request.tables().stream()
                .filter( tf -> {
                    String tmpr = ensureTmprTableName( tf.tableName() );
                    return tmpr == null || !failedTmpr.contains( tmpr );
                } )
                .toList();
        return new CdmValidateRequest( request.ptcpInstSn(), request.userId(), promoteTables, request.totalUploadBytes() );
    }

    /** 검증 실패한 테이블의 tmpr 데이터는 이관 전에 제거한다. */
    private void clearFailedPartnerTempDataBeforePromote( CdmValidateRequest request, Long pblntSn, Set<String> failedTableNames ) {
        if (request == null || request.ptcpInstSn() == null
                || failedTableNames == null || failedTableNames.isEmpty()) {
            return;
        }
        List<String> failedTmpr = failedTableNames.stream()
                .map( CdmValidateService::ensureTmprTableName )
                .filter( Objects::nonNull )
                .distinct()
                .toList();
        if (failedTmpr.isEmpty()) {
            return;
        }
        try {
            clearPartnerTempDataForTables( request.ptcpInstSn(), pblntSn, failedTmpr );
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
    }

    
    private void flushPartnerTempAndSecondaryStats( CdmValidateRequest request, Long pblntSn, List<String> requestedTableNames ) {
        if (request.ptcpInstSn() == null) {
            return;
        }
        List<String> errTblNmList = request.tables().stream()
            .map(tf -> ensureTmprTableName(tf.tableName()))
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        clearPartnerTempDataForTables(request.ptcpInstSn(), pblntSn, errTblNmList);
        if (requestedTableNames.isEmpty()) {
            return;
        }
        try {

            disclosureMapper.softDeleteTblUldStatsHistByTableNames(pblntSn, request.ptcpInstSn(), requestedTableNames, request.userId());

        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
    }

    private record TableValidationStepOutcome( long totalRows, long errorCount, double errorRate, String failureMessage ) {
    }

    
    private String processOneValidationTable( int i, CdmValidateRequest request, Long pblntSn, MutableProgress progress, List<Long> durations, Long uldVrfcGrpSn ) {
        CdmValidateRequest.TableFile tf = request.tables().get(i);
        long stepStart = System.currentTimeMillis();

        synchronized (progress) {
            progress.currentTable = tf.tableName();
            progress.elapsedMs = stepStart - progress.startTimeMs;
        }

        TableValidationStepOutcome outcome = runImportAndAnalysisStep( tf, request, pblntSn, uldVrfcGrpSn );
        applyProgressAfterOneTable( i, tf, progress, durations, stepStart, outcome );
        return outcome.failureMessage();
    }

    private TableValidationStepOutcome runImportAndAnalysisStep( CdmValidateRequest.TableFile tf, CdmValidateRequest request, Long pblntSn, Long uldVrfcGrpSn ) {
        long totalRows = 0;
        long errorCount = 0;
        double errorRate = 0;
        try {
            Path csvPath = resolveCsvPath(tf.tableName(), tf.storedName());

            if (!Files.isRegularFile(csvPath)) {
                throw new IllegalStateException(
                    "CSV 파일이 존재하지 않습니다. table=" + tf.tableName()
                            + ", storedName=" + tf.storedName()
                            + ", resolvedPath=" + (csvPath != null ? csvPath.toAbsolutePath().normalize() : "null"));
            }

            long importedRows = csvImportService.importCsvAuto(csvPath, tf.tableName(), request.ptcpInstSn(), pblntSn);

            AnalysisRequest ar = new AnalysisRequest(
                    tf.tableName(), tf.storedName(), pblntSn, request.ptcpInstSn(), request.userId(), csvPath, uldVrfcGrpSn);
            Map<String, Map<String, UploadAnalysisResult>> result = ruleCheckService.validate(List.of(ar));

            if (result != null) {
                for (Map<String, UploadAnalysisResult> slotMap : result.values()) {
                    for (UploadAnalysisResult r : slotMap.values()) {
                        totalRows = Math.max(totalRows, r.totalRowCount);
                        errorCount += r.totalErrorCount;
                    }
                }
            }
            errorRate = totalRows > 0 ? Math.min((double) errorCount / totalRows * 100.0, 100.0) : 0;
            return new TableValidationStepOutcome( totalRows, errorCount, errorRate, null );
        } catch (Exception e) {
            String failureMessage = tf.tableName() + ": 검증 처리 중 오류가 발생했습니다.";
            return new TableValidationStepOutcome( 0, 0, 0, failureMessage );
        }
    }

    private void applyProgressAfterOneTable( int i, CdmValidateRequest.TableFile tf, MutableProgress progress, List<Long> durations,
            long stepStart, TableValidationStepOutcome outcome ) {
        long stepDuration = System.currentTimeMillis() - stepStart;
        durations.add(stepDuration);

        synchronized (progress) {
            progress.completedCount = i + 1;
            progress.elapsedMs = System.currentTimeMillis() - progress.startTimeMs;
            progress.results.add(new CdmValidateProgress.TableResult(
                    tf.tableName(), outcome.totalRows(), outcome.errorCount(), outcome.errorRate()));

            int remaining = progress.totalCount - progress.completedCount;
            if (!durations.isEmpty() && remaining > 0) {
                long avgMs = durations.stream().mapToLong(Long::longValue).sum() / durations.size();
                progress.estimatedRemainingMs = avgMs * remaining;
            } else {
                progress.estimatedRemainingMs = 0;
            }
        }

    }

    private void runPromoteAndCleanupFiles( CdmValidateRequest request, Long pblntSn ) {
        try {

            promoteTmprToBaseTables(request, pblntSn);
            flushPartnerTempTablesAfterPromote( request, pblntSn );
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }

        if (request != null && request.ptcpInstSn() != null) {
            try {
                disclosureService.deleteUploadedFilesAfterTransfer(pblntSn, request.ptcpInstSn());

            } catch (Exception ex) {
                UploadNonFatal.discard( ex );
            }
        }
    }

    /** 본DB 이관 완료 후, 대상 기관의 tmpr 데이터를 다시 정리한다. */
    private void flushPartnerTempTablesAfterPromote( CdmValidateRequest request, Long pblntSn ) {
        if (request == null || request.ptcpInstSn() == null || request.tables() == null || request.tables().isEmpty()) {
            return;
        }
        List<String> tmprTableNames = request.tables().stream()
                .map( CdmValidateRequest.TableFile::tableName )
                .map( CdmValidateService::ensureTmprTableName )
                .filter( Objects::nonNull )
                .distinct()
                .toList();
        if (tmprTableNames.isEmpty()) {
            return;
        }
        try {
            clearPartnerTempDataForTables( request.ptcpInstSn(), pblntSn, tmprTableNames );
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
    }

    private void markRunValidationFailed( MutableProgress progress, String lastErrorMessage ) {
        synchronized (progress) {
            progress.status = "ERROR";
            progress.currentTable = null;
            progress.elapsedMs = System.currentTimeMillis() - progress.startTimeMs;
            progress.estimatedRemainingMs = 0;
            progress.errorMessage = lastErrorMessage != null ? lastErrorMessage : "오류가 발생하여 업로드에 실패했습니다.";
        }

    }

    private record UldHistTotals( long totalUldNocs, long totalErrNocs, long totalFiveSum ) {
    }

    
    private void persistPrimaryUldStatsSummary( CdmValidateRequest request, Long pblntSn, List<String> requestedTableNames ) {
        try {
            String userId = request.userId() != null ? request.userId() : DEFAULT_SYSTEM_USER_ID;
            LocalDateTime now = LocalDateTime.now();

            List<Map<String, Object>> allTbl = disclosureMapper.findTblUldStatsHist(pblntSn, request.ptcpInstSn());
            Set<String> requestedSet = new HashSet<>(requestedTableNames);
            UldHistTotals totals = aggregateUldHistForRequestedTables( allTbl, requestedSet );
            BigDecimal errRt = totals.totalUldNocs() > 0
                    ? BigDecimal.valueOf(totals.totalFiveSum())
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(totals.totalUldNocs()).multiply(BigDecimal.valueOf(5)), 4, RoundingMode.HALF_UP)
                        .setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            Long uldCpctMb = request.totalUploadBytes() != null && request.totalUploadBytes() > 0
                    ? request.totalUploadBytes() / (1024L * 1024L)
                    : null;

            upsertPrimaryUldStats( request, pblntSn, userId, now, totals, errRt, uldCpctMb );

            double overallErrorRate = totals.totalUldNocs() > 0
                    ? (double) totals.totalFiveSum() / totals.totalUldNocs() / 5.0 * 100.0
                    : 0.0;

        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
    }

    private UldHistTotals aggregateUldHistForRequestedTables( List<Map<String, Object>> allTbl, Set<String> requestedSet ) {
        long totalUldNocs = 0;
        long totalErrNocs = 0;
        long totalFiveSum = 0;
        for (Map<String, Object> tbl : allTbl != null ? allTbl : List.<Map<String, Object>>of()) {
            if ( isTblUldStatsRuleDetailRow( tbl ) ) {
                continue;
            }
            Object errTblNm = tbl.get("errTblNm") != null ? tbl.get("errTblNm") : tbl.get("err_tbl_nm");
            if (errTblNm != null && !requestedSet.contains(errTblNm.toString().trim())) {
                continue;
            }
            Object u = tbl.get("uldNocs") != null ? tbl.get("uldNocs") : tbl.get("uld_nocs");
            Object e = tbl.get(KEY_ERR_NOCS_CAMEL) != null ? tbl.get(KEY_ERR_NOCS_CAMEL) : tbl.get(KEY_ERR_NOCS_SNAKE);
            totalUldNocs += toLong(u);
            totalErrNocs += toLong(e);
            totalFiveSum += sumFiveItemErrors(tbl);
        }
        return new UldHistTotals( totalUldNocs, totalErrNocs, totalFiveSum );
    }

    private void upsertPrimaryUldStats( CdmValidateRequest request, Long pblntSn, String userId, LocalDateTime now,
            UldHistTotals totals, BigDecimal errRt, Long uldCpctMb ) {
        Map<String, Object> existingUld = disclosureMapper.findUldStatsHist(pblntSn, request.ptcpInstSn());
        if (existingUld != null) {
            int updated = disclosureMapper.updateUldStatsHistTotals(pblntSn, request.ptcpInstSn(), totals.totalUldNocs(), uldCpctMb, totals.totalErrNocs(), errRt, userId, now);

        } else {
            Long uldStatsSn = System.currentTimeMillis() % 1000000000L;
            disclosureMapper.insertUldStatsHist(
                    uldStatsSn, pblntSn, request.ptcpInstSn(),
                    totals.totalUldNocs(), uldCpctMb, totals.totalErrNocs(), errRt,
                    userId, now);

        }
    }

    
    private void saveFailedTableStats(Long pblntSn, Long ptcpInstSn, String userId, String tableName) {
        try {
            String cdmTableName = tableName.startsWith(TABLE_PREFIX) ? tableName
                    : TABLE_PREFIX + tableName.replaceFirst("^cdm_", "").replaceFirst("^tb_cm_i_", "");
            Long sn = nextvalTblUldStatsSn();
            String rgtrId = userId != null ? userId : DEFAULT_SYSTEM_USER_ID;
            disclosureMapper.insertTblUldStatsHist(
                    statsSchema,
                    sn, pblntSn, ptcpInstSn,
                    "02",
                    cdmTableName,
                    0L,
                    0L,
                    0L, 0L, 0L, 0L,
                    BigDecimal.ZERO,
                    null,
                    null,
                    null,
                    null,
                    rgtrId,
                    LocalDateTime.now());

        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
    }

    private Long nextvalTblUldStatsSn() {
        try {
            String seqName = statsSchema + ".sq_cm_tbl_uld_stats_sn";
            Long v = jdbcTemplate.queryForObject("SELECT nextval(?::regclass)", Long.class, seqName);
            return v != null ? v : Math.abs(System.nanoTime() % 1_000_000_000L) + 1;
        } catch (Exception e) {
            return Math.abs(System.nanoTime() % 1_000_000_000L) + 1;
        }
    }

    
    private static boolean isTblUldStatsRuleDetailRow( Map<String, Object> tbl ) {
        if ( tbl == null ) {
            return false;
        }
        Object rid = tbl.get( "vrfcRuleId" );
        if ( rid == null ) {
            rid = tbl.get( "uld_rul_sn" );
        }
        if ( rid == null ) {
            rid = tbl.get( "vrfc_rul_sn" );
        }
        return rid != null;
    }

    private Long nextUldVrfcGrpSn() {
        try {
            String seq = statsSchema + ".sq_cm_uld_vrfc_sn";
            Long v = jdbcTemplate.queryForObject( "SELECT nextval('" + seq.replace( "'", "''" ) + "')", Long.class );
            return v != null ? v : Math.abs( System.nanoTime() % 1_000_000_000L ) + 1;
        } catch ( Exception e ) {
            return Math.abs( System.nanoTime() % 1_000_000_000L ) + 1;
        }
    }

    
    private Path resolveCsvPath(String tableName, String storedName) {
        return uploadCsvPathResolver.resolveCsvPath(tableName, storedName);
    }

    private boolean tableExistsInSchema( String tableName ) {
        Boolean b = jdbcTemplate.queryForObject( SQL_EXISTS_TABLE_IN_SCHEMA, Boolean.class, dbSchema, tableName );
        return Boolean.TRUE.equals( b );
    }

    
    /**
     * promoteTablesToBase 처리를 수행한다.
     *
     * @param tables tables
     * @param ptcpInstSn ptcpInstSn
     * @param pblntSn pblntSn
     */
    public void promoteTablesToBase(List<CdmValidateRequest.TableFile> tables, Long ptcpInstSn, Long pblntSn) {
        if (tables == null || tables.isEmpty()) return;
        promoteTmprToBaseTables(new CdmValidateRequest(ptcpInstSn, "TEST", tables, null), pblntSn);
    }

    
    private void promoteTmprToBaseTables(CdmValidateRequest request, Long pblntSn) {
        if (request == null) {
            return;
        }
        if (request.tables() == null) {
            return;
        }
        if (request.tables().isEmpty()) {
            return;
        }
        Long ptcpInstSn = request.ptcpInstSn();
        
        String instTaskSnFilter = resolveInstTaskSnFilterForPromote(ptcpInstSn, pblntSn );

        for (CdmValidateRequest.TableFile tf : request.tables()) {
            promoteOneTmprTableFile(tf, instTaskSnFilter);
        }
    }

    
    private String resolveInstTaskSnFilterForPromote(Long ptcpInstSn, Long pblntSn) {
        if (ptcpInstSn == null) {
            return null;
        }
        String brno = resolveBrnoForPromote(ptcpInstSn, pblntSn);
        if (brno != null && !brno.isBlank()) {
            return brno;
        }
        return String.valueOf(ptcpInstSn);
    }

    private void promoteOneTmprTableFile( CdmValidateRequest.TableFile tf, String brno ) {
        try {
            String tmprTable = ensureTmprTableName(tf.tableName());
            String shortName = tmprTable.startsWith(TABLE_PREFIX)
                    ? tmprTable.substring(TABLE_PREFIX.length())
                    : tmprTable;
            if (shortName == null || shortName.isBlank()) {
                return;
            }
            String baseTable = resolvePhysicalBaseTableNameForPromote(shortName);
            flushBaseBeforePromote(baseTable, tmprTable, brno);
            copyTmprToBase(tmprTable, baseTable, brno);
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
    }

    
    private String resolveBrnoForPromote(Long ptcpInstSn, Long pblntSn) {
        if (ptcpInstSn == null) return null;
        try {
            String b = disclosurePartnerMapper.findBrnoByPtcpInstSn(ptcpInstSn, pblntSn);
            
            return (b != null && !b.isBlank()) ? b : null;
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
            return null;
        }
    }

    private String safeSchema() {
        return SqlIdentifierGuard.requireValidIdentifier(dbSchema, "schema");
    }

    private String qualifySafeTable(String tableName) {
        String safeTable = SqlIdentifierGuard.requireValidIdentifier(tableName, SQL_GUARD_TABLE);
        return SqlIdentifierGuard.qualify(safeSchema(), safeTable);
    }

    

    private static String ensureTmprTableName(String tableName) {
        if (tableName == null) return null;
        String t = tableName.trim().toLowerCase();
        if (t.startsWith(TABLE_PREFIX)) return t;
        if (t.startsWith("tb_cm_i_")) t = t.substring(8);
        else if (t.startsWith("cdm_")) t = t.substring(4);
        return TABLE_PREFIX + t;
    }

    
    private String resolvePhysicalBaseTableNameForPromote(String slotBase) {
        if (slotBase == null || slotBase.isBlank()) {
            return null;
        }
        String prefixed = "tb_cm_i_" + slotBase;
        if (tableExistsInSchema(prefixed)) {
            return prefixed;
        }
        if (tableExistsInSchema(slotBase)) {
            return slotBase;
        }
        return slotBase;
    }

    
    private static String normalizeBrno(String brno) {
        if (brno == null || brno.isBlank()) return brno;
        String s = brno.replace("-", "").replace(" ", "").trim();
        s = s.replaceFirst("^0+", "");
        return s.isEmpty() ? "0" : s;
    }

    
    private static final String INST_TASK_SN_NORMALIZED_WHERE =
            
            COL_INST_TASK_SN + " = ?";

    
    private static String normalizedInstTaskSnExpr(String qualifiedColumn) {
        
        return qualifiedColumn;
    }

    
    private void flushBaseBeforePromote(String baseTable, String tmprTable, String brno) {
        if (brno == null || brno.isBlank()) {

            return;
        }
        try {
            List<String> baseCols = getColumnNames(dbSchema, baseTable);
            List<String> tmprCols = getColumnNames(dbSchema, tmprTable);
            if (baseCols == null || tmprCols == null) {

                return;
            }
            if (!tmprCols.contains(COL_INST_TASK_SN)) {

                return;
            }
            if (baseCols.contains(COL_INST_TASK_SN)) {
                flushBaseUsingInstTaskFallback( baseTable, baseCols, brno );
                return;
            }
            List<String> pkCols = CdmOmopPrimaryKeyColumns.primaryKeyColumns(baseTable);
            boolean pkUsable = pkCols != null && !pkCols.isEmpty()
                    && pkCols.stream().allMatch(c -> baseCols.contains(c) && tmprCols.contains(c));
            if (pkUsable) {
                flushBaseUsingPkJoin( baseTable, tmprTable, brno, pkCols );
            }
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
    }

    private void flushBaseUsingPkJoin( String baseTable, String tmprTable, String brno, List<String> pkCols ) {
        StringBuilder join = new StringBuilder();
        for (String pk : pkCols) {
            if (COL_INST_TASK_SN.equalsIgnoreCase(pk)) {
                join.append(" AND ")
                        .append(normalizedInstTaskSnExpr("b." + COL_INST_TASK_SN))
                        .append(" = ")
                        .append(normalizedInstTaskSnExpr("t." + COL_INST_TASK_SN));
            } else {
                String safePk = SqlIdentifierGuard.quoteIdentifier(SqlIdentifierGuard.requireValidIdentifier(pk, "column"));
                join.append(" AND b.").append(safePk).append(" = t.").append(safePk);
            }
        }
        String sql = SQL_DELETE_FROM + qualifySafeTable(baseTable) + " b USING " + qualifySafeTable(tmprTable) + " t WHERE "
                + normalizedInstTaskSnExpr("t." + COL_INST_TASK_SN) + " = ?" + join;
        int deleted = jdbcTemplate.update(sql, brno);

    }

    private void flushBaseUsingInstTaskFallback( String baseTable, List<String> baseCols, String brno ) {
        if (baseCols.contains(COL_INST_TASK_SN)) {
            String sql = SQL_DELETE_FROM + qualifySafeTable(baseTable) + " WHERE " + INST_TASK_SN_NORMALIZED_WHERE;
            int deleted = jdbcTemplate.update(sql, brno);

        } else {

        }
    }

    
    private CopyResult copyTmprToBase(String tmprTable, String baseTable, String brno) {
        try {
            if (!tableExistsInSchema( tmprTable )) {
                return CopyResult.skip("임시테이블 " + dbSchema + "." + tmprTable + " 없음");
            }

            if (!tableExistsInSchema( baseTable )) {
                return CopyResult.skip("본테이블 " + dbSchema + "." + baseTable + " 없음");
            }

            List<String> baseCols = getColumnNames(dbSchema, baseTable);
            List<String> tmprCols = getColumnNames(dbSchema, tmprTable);
            if (baseCols == null || tmprCols == null) {
                return CopyResult.skip("컬럼 정보 조회 실패");
            }

            List<String> common = new ArrayList<>(baseCols);
            common.retainAll(tmprCols);
            if (common.isEmpty()) {
                return CopyResult.skip("공통 컬럼 없음 (base=" + baseTable + ", tmpr=" + tmprTable + ")");
            }

            
            if (brno != null && !brno.isBlank() && !tmprCols.contains(COL_INST_TASK_SN)) {
                return CopyResult.skip("tmpr에 inst_task_sn 없음, 기관(brno) 필터 불가");
            }

            Map<String, PgColumnType> baseTypes = getPgColumnTypes(dbSchema, baseTable);
            Map<String, PgColumnType> tmprTypes = getPgColumnTypes(dbSchema, tmprTable);
            if (baseTypes.isEmpty() || tmprTypes.isEmpty()) {
                return CopyResult.skip("pg_catalog 컬럼 타입 조회 실패");
            }

            List<String> insertColNames = new ArrayList<>();
            List<String> selectExprs = new ArrayList<>();
            appendCopyColumnMappings( common, baseTypes, tmprTypes, baseTable, tmprTable, insertColNames, selectExprs );
            ensureInstTaskSnInCopyListsIfMissing( baseCols, tmprCols, baseTypes, tmprTypes, baseTable, tmprTable, insertColNames, selectExprs );
            supplementEncounterIdForVitalSignsPromote( baseTable, baseCols, tmprCols, insertColNames, selectExprs );
            applyVisitOccurrenceEndDateFallbackForPromote( baseTable, tmprCols, insertColNames, selectExprs );

            if (isSentinelPromotePair( baseTable, tmprTable )) {
                Set<String> baseNotNullCols = getNonNullableBaseColumnNames( dbSchema, baseTable );
                applySentinelNotNullWrapToSelectExprs( insertColNames, selectExprs, baseTypes, baseNotNullCols );
            }

            if (insertColNames.isEmpty()) {
                return CopyResult.skip("이관 가능 컬럼 없음 (타입 불일치로 전부 제외)");
            }

            return executeCopyInsertStatement( tmprTable, baseTable, brno, tmprCols, insertColNames, selectExprs );
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
            String msg = String.format("%s.%s ← %s.%s 실행 실패",
                    dbSchema, baseTable, dbSchema, tmprTable);

            return CopyResult.failure(msg);
        }
    }

    
    private static boolean isVitalSignsPromoteTarget( String baseTable ) {
        if (baseTable == null) {
            return false;
        }
        String b = baseTable.trim().toLowerCase( Locale.ROOT );
        return "vital_signs".equals( b ) || "tb_cm_i_vital_signs".equals( b );
    }

    private static boolean isTmprVitalSignsTable( String tmprTable ) {
        if (tmprTable == null) {
            return false;
        }
        return "tb_cm_i_tmpr_vital_signs".equals( tmprTable.trim().toLowerCase( Locale.ROOT ) );
    }

    
    private static String vitalSignsTmprToBaseSelectExpr( String col ) {
        if (col == null) {
            return null;
        }
        String c = col.toLowerCase( Locale.ROOT );
        String q = "\"" + col + "\"";
        return switch (c) {
            case "encounterid" -> "COALESCE(NULLIF(TRIM(" + q + "::text), ''), '')::character varying(20)";
            case "bp_type" -> "LEFT(TRIM(COALESCE(" + q + "::text, '')), 1)::character(1)";
            case "position" -> "LEFT(TRIM(COALESCE(" + q + "::text, '')), 1)::character(1)";
            case "tobacco", "tobacco_type" -> "CASE WHEN " + q + " IS NULL OR TRIM(" + q + "::text) = '' THEN NULL "
                    + "WHEN TRIM(" + q + "::text) ~ '^[0-9]+(\\.[0-9]+)?$' THEN TRIM(" + q + "::text)::numeric(3,0) "
                    + "ELSE NULL END";
            case "ht", "wt" -> "CASE WHEN " + q + " IS NULL THEN NULL ELSE ROUND(" + q + "::numeric, 2) END";
            default -> null;
        };
    }

    private static boolean insertColumnListContainsIgnoreCase( List<String> insertColNames, String col ) {
        for (String c : insertColNames) {
            if (c != null && c.equalsIgnoreCase( col )) {
                return true;
            }
        }
        return false;
    }

    
    private static void applyVisitOccurrenceEndDateFallbackForPromote(
            String baseTable,
            List<String> tmprCols,
            List<String> insertColNames,
            List<String> selectExprs ) {
        if ( baseTable == null || insertColNames == null || selectExprs == null
                || insertColNames.size() != selectExprs.size() ) {
            return;
        }
        String b = baseTable.trim().toLowerCase( Locale.ROOT );
        if ( ! "visit_occurrence".equals( b ) && ! "tb_cm_i_visit_occurrence".equals( b ) ) {
            return;
        }
        int endIdx = -1;
        int startIdx = -1;
        for ( int i = 0; i < insertColNames.size(); i++ ) {
            String c = insertColNames.get( i );
            if ( c == null ) {
                continue;
            }
            if ( "visit_end_date".equalsIgnoreCase( c ) ) {
                endIdx = i;
            }
            if ( "visit_start_date".equalsIgnoreCase( c ) ) {
                startIdx = i;
            }
        }
        if ( endIdx < 0 ) {
            return;
        }
        String endSel = selectExprs.get( endIdx );
        boolean tmprHasStart = tmprCols != null
                && tmprCols.stream().anyMatch( x -> "visit_start_date".equalsIgnoreCase( x ) );
        if ( tmprHasStart && startIdx >= 0 ) {
            String startSel = selectExprs.get( startIdx );
            selectExprs.set( endIdx,
                    "COALESCE((" + endSel + ")::date, (" + startSel + ")::date, DATE '1900-01-01')" );
        } else {
            selectExprs.set( endIdx, "COALESCE((" + endSel + ")::date, DATE '1900-01-01')" );
        }
    }

    private void supplementEncounterIdForVitalSignsPromote( String baseTable, List<String> baseCols, List<String> tmprCols,
            List<String> insertColNames, List<String> selectExprs ) {
        if (!isVitalSignsPromoteTarget( baseTable ) || !baseCols.contains( "encounterid" )) {
            return;
        }
        if (insertColumnListContainsIgnoreCase( insertColNames, "encounterid" )) {
            return;
        }
        insertColNames.add( "encounterid" );
        if (tmprCols.contains( "encounterid" )) {
            selectExprs.add( "COALESCE(\"encounterid\"::character varying, ''::character varying(20))" );
        } else {
            selectExprs.add( "''::character varying(20)" );
        }
    }

    private static boolean isSentinelTmprTableName( String tmprTable ) {
        if (tmprTable == null) {
            return false;
        }
        return SENTINEL_TMPR_TABLE_NAMES.contains( tmprTable.trim().toLowerCase( Locale.ROOT ) );
    }

    
    private static boolean isSentinelPromotePair( String baseTable, String tmprTable ) {
        if (!isSentinelTmprTableName( tmprTable )) {
            return false;
        }
        String slot = tmprTable.trim().toLowerCase( Locale.ROOT ).substring( TABLE_PREFIX.length() );
        String b = baseTable == null ? "" : baseTable.trim().toLowerCase( Locale.ROOT );
        return b.equals( slot ) || b.equals( "tb_cm_i_" + slot );
    }

    private Set<String> getNonNullableBaseColumnNames( String schema, String table ) {
        String sql = """
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = ? AND table_name = ? AND is_nullable = 'NO'
                """;
        List<String> rows = jdbcTemplate.queryForList( sql, String.class, schema, table );
        Set<String> out = new HashSet<>();
        if (rows != null) {
            for (String n : rows) {
                if (n != null) {
                    out.add( n.toLowerCase( Locale.ROOT ).trim() );
                }
            }
        }
        return out;
    }

    
    private void applySentinelNotNullWrapToSelectExprs(
            List<String> insertColNames,
            List<String> selectExprs,
            Map<String, PgColumnType> baseTypes,
            Set<String> baseNotNullCols ) {
        if (insertColNames == null || selectExprs == null || insertColNames.size() != selectExprs.size()) {
            return;
        }
        for (int i = 0; i < insertColNames.size(); i++) {
            String col = insertColNames.get( i );
            if (col == null || COL_INST_TASK_SN.equalsIgnoreCase( col )) {
                continue;
            }
            String colKey = col.toLowerCase( Locale.ROOT );
            if (!baseNotNullCols.contains( colKey )) {
                continue;
            }
            PgColumnType bt = baseTypes.get( colKey );
            if (bt == null) {
                continue;
            }
            String inner = selectExprs.get( i );
            selectExprs.set( i, wrapSentinelExprForBaseNotNull( bt, inner ) );
        }
    }

    private static String wrapSentinelExprForBaseNotNull( PgColumnType bt, String innerExpr ) {
        if (bt == null || innerExpr == null) {
            return innerExpr;
        }
        String ft = bt.formatType().trim();
        String fl = ft.toLowerCase( Locale.ROOT );
        String core = "(" + innerExpr + ")";
        if (fl.contains( "timestamp" )) {
            return "COALESCE(" + core + ", TIMESTAMP '1900-01-01 00:00:00')";
        }
        if (fl.equals( "date" )) {
            return "COALESCE(" + core + "::date, DATE '1900-01-01')";
        }
        if (fl.startsWith( "time" ) && !fl.contains( "timestamp" )) {
            return "COALESCE(" + core + "::time, TIME '00:00:00')";
        }
        if (fl.equals( "boolean" )) {
            return "COALESCE(" + core + ", false)";
        }
        if (fl.contains( "char" ) || fl.contains( "text" )) {
            return "COALESCE(NULLIF(TRIM(" + core + "::text), ''), '')::" + ft;
        }
        if (fl.contains( "numeric" ) || fl.contains( "decimal" ) || fl.equals( "real" ) || fl.contains( "double precision" )
                || fl.equals( "smallint" ) || fl.equals( "integer" ) || fl.equals( "bigint" ) ) {
            return "COALESCE(" + core + ", 0)::" + ft;
        }
        return innerExpr;
    }

    private void appendCopyColumnMappings( List<String> common, Map<String, PgColumnType> baseTypes, Map<String, PgColumnType> tmprTypes,
            String baseTable, String tmprTable, List<String> insertColNames, List<String> selectExprs ) {
        for (String c : common) {
            PgColumnType bt = baseTypes.get(c);
            PgColumnType tt = tmprTypes.get(c);
            if (bt == null || tt == null) {
                if (COL_INST_TASK_SN.equalsIgnoreCase(c)) {
                    insertColNames.add(c);
                    selectExprs.add("\"" + c + "\"");
                } else {

                }
                continue;
            }
            String expr = null;
            if (isVitalSignsPromoteTarget( baseTable ) && isTmprVitalSignsTable( tmprTable )) {
                expr = vitalSignsTmprToBaseSelectExpr( c );
            }
            if (expr == null) {
                expr = buildTmprSelectExpr(c, bt, tt);
            }
            if (expr != null) {
                insertColNames.add(c);
                selectExprs.add(expr);
                continue;
            }
            if (COL_INST_TASK_SN.equalsIgnoreCase(c)) {
                insertColNames.add(c);
                selectExprs.add("\"" + c + "\"");
                continue;
            }
        }
    }

    private void ensureInstTaskSnInCopyListsIfMissing( List<String> baseCols, List<String> tmprCols, Map<String, PgColumnType> baseTypes, Map<String, PgColumnType> tmprTypes,
            String baseTable, String tmprTable, List<String> insertColNames, List<String> selectExprs ) {
        if (!baseCols.contains(COL_INST_TASK_SN) || !tmprCols.contains(COL_INST_TASK_SN) || insertColNames.contains(COL_INST_TASK_SN)) {
            return;
        }
        PgColumnType bt = baseTypes.get(COL_INST_TASK_SN);
        PgColumnType tt = tmprTypes.get(COL_INST_TASK_SN);
        String expr = (bt != null && tt != null) ? buildTmprSelectExpr(COL_INST_TASK_SN, bt, tt) : null;
        if (expr == null) {
            expr = "\"" + COL_INST_TASK_SN + "\"";
        }
        insertColNames.add(COL_INST_TASK_SN);
        selectExprs.add(expr);
    }

    private CopyResult executeCopyInsertStatement( String tmprTable, String baseTable, String brno, List<String> tmprCols,
            List<String> insertColNames, List<String> selectExprs ) {
        String colsInsert = String.join(", ", insertColNames.stream().map(c -> "\"" + c + "\"").toList());
        String colsSelect = String.join(", ", selectExprs);
        String insertSql;
        Object[] queryArgs;

        if (brno != null && !brno.isBlank() && tmprCols.contains(COL_INST_TASK_SN)) {
            insertSql = String.format(
                    "INSERT INTO %s (%s) SELECT %s FROM %s WHERE %s",
                    qualifySafeTable(baseTable), colsInsert, colsSelect, qualifySafeTable(tmprTable), INST_TASK_SN_NORMALIZED_WHERE);
            queryArgs = new Object[]{brno};
        } else {
            insertSql = String.format(
                    "INSERT INTO %s (%s) SELECT %s FROM %s",
                    qualifySafeTable(baseTable), colsInsert, colsSelect, qualifySafeTable(tmprTable));
            queryArgs = new Object[0];
        }

        int rows = queryArgs.length > 0
                ? jdbcTemplate.update(insertSql, queryArgs)
                : jdbcTemplate.update(insertSql);

        return CopyResult.success(rows);
    }

    
    private void clearPartnerTempDataForTables(Long ptcpInstSn, Long pblntSn, List<String> tmprTableNames) {
        if (ptcpInstSn == null) return;

        String brno = resolveInstTaskSnFilterForPromote(ptcpInstSn, pblntSn);
        if (brno == null || brno.isBlank()) {

            return;
        }
        List<String> toClear = tmprTableNames != null && !tmprTableNames.isEmpty()
            ? tmprTableNames
            : Arrays.asList(CDM_TEMP_TABLES);

        for (String tableName : toClear) {
            try {

                if (!tableExistsInSchema( tableName )) continue;
                List<String> cols = getColumnNames(dbSchema, tableName);
                if (cols == null || !cols.contains(COL_INST_TASK_SN)) continue;
                String sql = SQL_DELETE_FROM + qualifySafeTable(tableName) + " WHERE " + INST_TASK_SN_NORMALIZED_WHERE;
                int deleted = jdbcTemplate.update(sql, brno);
                if (deleted > 0) {

                }
            } catch (Exception ex) {
                UploadNonFatal.discard( ex );
            }
        }

    }

    
    private static long sumFiveItemErrors(Map<String, Object> tbl) {
        return nz(tbl, KEY_ERR_NOCS_CAMEL, KEY_ERR_NOCS_SNAKE)
                + nz(tbl, "vrfcFnlErrNocs", "vrfc_fnl_err_nocs")
                + nz(tbl, "vrfcUnqErrNocs", "vrfc_unq_err_nocs")
                + nz(tbl, "vrfcVldErrNocs", "vrfc_vld_err_nocs")
                + nz(tbl, "vrfcNmlErrNocs", "vrfc_nml_err_nocs");
    }

    private static long nz(Map<String, Object> tbl, String camel, String snake) {
        Object o = tbl.get(camel);
        if (o == null) {
            o = tbl.get(snake);
        }
        return toLong(o);
    }

    private static long toLong(Object v) {
        if (v == null) return 0L;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString().trim()); } catch (Exception e) { return 0L; }
    }

    
    private record PgColumnType(int oid, String formatType) {}

    
    private Map<String, PgColumnType> getPgColumnTypes(String schema, String table) {
        String sql = """
            SELECT a.attname::text AS col_name,
                   a.atttypid::int AS typid,
                   pg_catalog.format_type(a.atttypid, a.atttypmod) AS fmt
            FROM pg_catalog.pg_attribute a
            JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
            JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = ? AND c.relname = ? AND a.attnum > 0 AND NOT a.attisdropped
            ORDER BY a.attnum
            """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, schema, table);
        Map<String, PgColumnType> out = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            Object cn = row.get("col_name");
            Object tid = row.get("typid");
            Object fmt = row.get("fmt");
            if (cn == null || tid == null || fmt == null) continue;
            String name = cn.toString().toLowerCase(Locale.ROOT).trim();
            int oid = ((Number) tid).intValue();
            out.put(name, new PgColumnType(oid, fmt.toString()));
        }
        return out;
    }

    
    private boolean pgCastExists(int srcOid, int tgtOid) {
        if (srcOid == tgtOid) {
            return true;
        }
        String key = srcOid + ":" + tgtOid;
        return pgCastExistsCache.computeIfAbsent(key, k -> {
            Boolean b = jdbcTemplate.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_cast WHERE castsource = ? AND casttarget = ?)",
                    Boolean.class, srcOid, tgtOid);
            return Boolean.TRUE.equals(b);
        });
    }

    private int getPgTextTypeOid() {
        Integer local = pgTextTypeOidCached;
        if (local != null) {
            return local;
        }
        synchronized (this) {
            if (pgTextTypeOidCached == null) {
                Integer o = jdbcTemplate.queryForObject(
                        "SELECT 'text'::regtype::oid::int",
                        Integer.class);
                pgTextTypeOidCached = (o != null && o > 0) ? o : 25;
            }
            return pgTextTypeOidCached;
        }
    }

    
    private String buildTmprSelectExpr(String col, PgColumnType bt, PgColumnType tt) {
        if (bt.oid() == tt.oid()) {
            return "\"" + col + "\"";
        }
        if (pgCastExists(tt.oid(), bt.oid())) {
            return "CAST(\"" + col + "\" AS " + bt.formatType() + ")";
        }
        int textOid = getPgTextTypeOid();
        if (pgCastExists(tt.oid(), textOid) && pgCastExists(textOid, bt.oid())) {
            return "CAST(CAST(\"" + col + "\" AS text) AS " + bt.formatType() + ")";
        }
        return null;
    }

    private List<String> getColumnNames(String schema, String table) {
        String sql = """
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = ? AND table_name = ?
            ORDER BY ordinal_position
            """;
        List<String> names = jdbcTemplate.queryForList(sql, String.class, schema, table);
        return names != null ? names.stream().map(n -> n.toLowerCase().trim()).toList() : List.of();
    }

    private static class MutableProgress {
        String taskId;
        String status;
        String currentTable;
        int completedCount;
        int totalCount;
        long startTimeMs;
        long elapsedMs;
        long estimatedRemainingMs;
        String errorMessage;
        List<CdmValidateProgress.TableResult> results;
    }
}
