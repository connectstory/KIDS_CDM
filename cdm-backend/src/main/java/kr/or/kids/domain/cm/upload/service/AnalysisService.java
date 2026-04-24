package kr.or.kids.domain.cm.upload.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import kr.or.kids.domain.cm.upload.controller.CsvLoader;
import kr.or.kids.domain.cm.upload.dto.AccuracyResult;
import kr.or.kids.domain.cm.upload.dto.AnalysisRequest;
import kr.or.kids.domain.cm.upload.dto.CompletenessResult;
import kr.or.kids.domain.cm.upload.dto.RuleConsistencyResult;
import kr.or.kids.domain.cm.upload.dto.UniquenessResult;
import kr.or.kids.domain.cm.upload.dto.UploadAnalysisResult;
import kr.or.kids.domain.cm.upload.dto.ValidityResult;
import kr.or.kids.domain.cm.upload.mapper.DisclosureMapper;
import kr.or.kids.domain.cm.upload.mapper.DisclosurePartnerMapper;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import lombok.RequiredArgsConstructor;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private static final String VRFC_TP_FIELD_NAME_CONSISTENCY = "FN";
    private final JdbcTemplate jdbcTemplate;
    private final CsvImportService csvImportService;
    private final CsvLoader csvUtil;

    private final AnalysisConsistencyService consistencyService;
    private final AnalysisCompletenessService completenessService;
    private final AnalysisValidityService validityService;
    private final AnalysisAccuracyService accuracyService;
    private final AnalysisUniquenessService uniquenessService;
    private final DisclosureMapper disclosureMapper;
    private final DisclosurePartnerMapper disclosurePartnerMapper;

    @Value("${app.upload.root:./storage/uploads}")
    private Path uploadRoot;

    @Value("${app.schema:kids_link_own}")
    private String dbSchema;

    @Value("${app.stats-schema:kids_own}")
    private String statsSchema;

    private static final String TABLE_PREFIX = "tb_cm_i_tmpr_";

    private static String ensureTableName( String tableName ) {
        if (tableName == null)
            return null;
        String t = tableName.trim().toLowerCase();
        if (t.startsWith( TABLE_PREFIX ))
            return t;
        if (t.startsWith( "tb_cm_i_" ))
            t = t.substring( 8 );
        else if (t.startsWith( "cdm_" ))
            t = t.substring( 4 );
        return TABLE_PREFIX + t;
    }

    private static String normalizeBrno( String brno ) {
        if (brno == null || brno.isBlank())
            return brno;
        String s = brno.replace( "-", "" ).replace( " ", "" ).trim();
        s = s.replaceFirst( "^0+", "" );
        return s.isEmpty() ? "0" : s;
    }

    private String resolvePhysicalTableName( String tableName ) {
        if (tableName == null || !tableName.endsWith( "_death" ))
            return tableName;
        try {
            Boolean exists = jdbcTemplate.queryForObject( "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?)", Boolean.class, dbSchema, tableName );
            if (Boolean.TRUE.equals( exists ))
                return tableName;
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
        return "death";
    }

    /**
     * 입력값을 검증한다.
     *
     * @param tableStoredList tableStoredList
     * @return 처리 결과
     */
    public Map<String, Map<String, UploadAnalysisResult>> validate( List<AnalysisRequest> tableStoredList ) throws Exception {

        Map<String, Map<String, UploadAnalysisResult>> analysis = new HashMap<>();
        List<TableValidationSummary> summaries = new ArrayList<>();

        Long batchGrpSn = null;
        for (AnalysisRequest r : tableStoredList) {
            if (r.uldVrfcGrpSn() != null) {
                batchGrpSn = r.uldVrfcGrpSn();
                break;
            }
        }
        if (batchGrpSn == null) {
            batchGrpSn = nextUldVrfcGrpSn();
        }
        final Long grpSn = batchGrpSn;

        for (AnalysisRequest tableStored : tableStoredList) {
            AnalysisRequest effective = new AnalysisRequest( tableStored.tableName(), tableStored.storedName(), tableStored.pblntSn(), tableStored.ptcpInstSn(), tableStored.userId(), tableStored.csvPath(), grpSn );
            validateOneTable( effective, analysis, summaries );
        }

        return analysis;
    }

    private long nextUldVrfcGrpSn() {
        try {
            String seq = statsSchema + ".sq_cm_uld_vrfc_sn";
            Long v = jdbcTemplate.queryForObject( "SELECT nextval('" + seq.replace( "'", "''" ) + "')", Long.class );
            return v != null ? v : fallbackTblUldStatsSn();
        } catch (Exception e) {
            return fallbackTblUldStatsSn();
        }
    }

    private void validateOneTable( AnalysisRequest tableStored, Map<String, Map<String, UploadAnalysisResult>> analysis, List<TableValidationSummary> summaries ) {
        String cdmTableName = ensureTableName( tableStored.tableName() );
        String slotKey = cdmTableName.startsWith( TABLE_PREFIX ) ? cdmTableName.substring( TABLE_PREFIX.length() ) : cdmTableName;
        String physicalTable = resolvePhysicalTableName( cdmTableName );

        Optional<Long> rowOpt = resolveTableRowCount( tableStored, cdmTableName, physicalTable, slotKey, analysis, summaries );
        if (rowOpt.isEmpty()) {
            return;
        }
        long tableRowCount = rowOpt.get();

        Map<String, UploadAnalysisResult> analysisResult = new HashMap<>();
        ConsistencyPhaseOutcome consistency = runConsistencyPhase( tableStored, slotKey, physicalTable, tableRowCount, cdmTableName, analysisResult );
        applyPartialConsistencyAnalysis( slotKey, analysis, analysisResult, consistency );

        QualityPhaseOutcome quality = runQualityPhases( tableStored, slotKey, physicalTable, tableRowCount, cdmTableName );
        finalizeTableValidation( tableStored, cdmTableName, slotKey, analysis, summaries, analysisResult, consistency, quality, tableRowCount );
    }

    private Optional<Long> resolveTableRowCount( AnalysisRequest tableStored, String cdmTableName, String physicalTable, String slotKey, Map<String, Map<String, UploadAnalysisResult>> analysis, List<TableValidationSummary> summaries ) {
        try {
            Long ptcpInstSn = tableStored.ptcpInstSn();
            Long pblntSn = tableStored.pblntSn();
            Long tableRowCount;
            if (ptcpInstSn != null) {
                String brno = disclosurePartnerMapper.findBrnoByPtcpInstSn( ptcpInstSn, pblntSn );

                String instTaskSnValue = (brno != null && !brno.isBlank()) ? brno : String.valueOf( ptcpInstSn );

                tableRowCount = jdbcTemplate.queryForObject( "SELECT COUNT(*) FROM " + dbSchema + "." + physicalTable + " WHERE \"inst_task_sn\" = ?", Long.class, instTaskSnValue );
            } else {
                tableRowCount = jdbcTemplate.queryForObject( "SELECT COUNT(*) FROM " + dbSchema + "." + physicalTable, Long.class );
            }

            return Optional.of( tableRowCount );
        } catch (Exception e) {
            Map<String, UploadAnalysisResult> analysisResult = new HashMap<>();
            UploadAnalysisResult err = new UploadAnalysisResult();
            err.tableName = cdmTableName;
            err.totalRowCount = 0L;
            err.totalErrorCount = 0L;
            err.analysisRate = 0.0;
            err.status = false;
            analysisResult.put( "error", err );
            analysis.put( slotKey, analysisResult );
            summaries.add( new TableValidationSummary( cdmTableName, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0.0 ) );
            return Optional.empty();
        }
    }

    private ConsistencyPhaseOutcome runConsistencyPhase( AnalysisRequest tableStored, String slotKey, String physicalTable, long tableRowCount, String cdmTableName, Map<String, UploadAnalysisResult> analysisResult ) {
        RuleConsistencyResult consistencyFieldNameResult;
        long csFieldRefCount = 0;
        long csFieldErrCount = 0;
        try {
            consistencyFieldNameResult = consistencyService.validateFieldName( slotKey, tableStored.storedName(), tableStored.csvPath() );
            csFieldRefCount = consistencyFieldNameResult.referenceFields != null ? consistencyFieldNameResult.referenceFields.size() : 0;
            csFieldErrCount = safe( consistencyFieldNameResult.totalErrorCount );

            if (consistencyFieldNameResult.missingFields != null && !consistencyFieldNameResult.missingFields.isEmpty()) {
                for (String missing : consistencyFieldNameResult.missingFields) {

                }
            }
        } catch (Exception e) {

            consistencyFieldNameResult = new RuleConsistencyResult();
            consistencyFieldNameResult.tableName = cdmTableName;
            consistencyFieldNameResult.status = true;
        }

        RuleConsistencyResult consistencyFieldTypeResult = consistencyService.validateFieldType( slotKey, physicalTable, tableRowCount, csFieldRefCount > 0 ? (int) csFieldRefCount : 0 );
        long csTypeErrCount = safe( consistencyFieldTypeResult.totalErrorCount );

        if (consistencyFieldTypeResult.errors != null && !consistencyFieldTypeResult.errors.isEmpty()) {
            for (Map.Entry<String, Integer> entry : consistencyFieldTypeResult.errors.entrySet()) {

            }
        }

        analysisResult.put( "consistencyFieldName", consistencyFieldNameResult );
        analysisResult.put( "consistencyFieldType", consistencyFieldTypeResult );
        return new ConsistencyPhaseOutcome( consistencyFieldNameResult, consistencyFieldTypeResult, csFieldRefCount, csFieldErrCount, csTypeErrCount );
    }

    private void applyPartialConsistencyAnalysis( String slotKey, Map<String, Map<String, UploadAnalysisResult>> analysis, Map<String, UploadAnalysisResult> analysisResult, ConsistencyPhaseOutcome c ) {
        if ((c.fieldName().missingFields != null && !c.fieldName().missingFields.isEmpty()) || (c.fieldType().errors != null && !c.fieldType().errors.isEmpty())) {
            analysis.put( slotKey, analysisResult );
        }
    }

    private QualityPhaseOutcome runQualityPhases( AnalysisRequest tableStored, String slotKey, String physicalTable, long tableRowCount, String cdmTableName ) {
        UploadAnalysisResult completenessResult = runSafely( "completeness", cdmTableName, () -> completenessService.validate( slotKey, physicalTable, tableRowCount ), new CompletenessResult(), tableRowCount );
        long complErrCount = safe( completenessResult.totalErrorCount );

        final Long ptcpInstSnForValidity = tableStored.ptcpInstSn();
        final Long pblntSnForValidity = tableStored.pblntSn();
        UploadAnalysisResult validityResult = runSafely( "validity", cdmTableName, () -> validityService.validate( slotKey, physicalTable, tableRowCount, ptcpInstSnForValidity, pblntSnForValidity ), new ValidityResult(), tableRowCount );
        long validErrCount = safe( validityResult.totalErrorCount );

        UploadAnalysisResult accuracyResult = runSafely( "accuracy", cdmTableName, () -> accuracyService.validate( slotKey, physicalTable, tableRowCount ), new AccuracyResult(), tableRowCount );
        long accErrCount = safe( accuracyResult.totalErrorCount );

        final Long ptcpInstSnForUniq = tableStored.ptcpInstSn();
        UploadAnalysisResult uniquenessResult = runSafely( "uniqueness", cdmTableName, () -> uniquenessService.validate( slotKey, physicalTable, tableRowCount, ptcpInstSnForUniq ), new UniquenessResult(), tableRowCount );
        long uniqErrCount = safe( uniquenessResult.totalErrorCount );

        return new QualityPhaseOutcome( completenessResult, validityResult, accuracyResult, uniquenessResult, complErrCount, validErrCount, accErrCount, uniqErrCount );
    }

    private void finalizeTableValidation( AnalysisRequest tableStored, String cdmTableName, String slotKey, Map<String, Map<String, UploadAnalysisResult>> analysis, List<TableValidationSummary> summaries, Map<String, UploadAnalysisResult> analysisResult, ConsistencyPhaseOutcome c, QualityPhaseOutcome q, long tableRowCount ) {
        analysisResult.put( "consistency", c.fieldName() );
        analysisResult.put( "completeness", q.completeness() );
        analysisResult.put( "validity", q.validity() );
        analysisResult.put( "accuracy", q.accuracy() );
        analysisResult.put( "uniqueness", q.uniqueness() );
        analysis.put( slotKey, analysisResult );

        long consistencyErrTotal = c.csFieldErrCount() + c.csTypeErrCount();

        int validityRuleCount = (q.validity() instanceof ValidityResult vr2 && vr2.errors != null) ? Math.max( vr2.errors.size(), 1 ) : 1;
        int completenessRuleCount = (q.completeness() instanceof CompletenessResult cr2 && cr2.errors != null) ? Math.max( cr2.errors.size(), 1 ) : 1;
        int accuracyRuleCount = (q.accuracy() instanceof AccuracyResult ar2 && ar2.errors != null) ? Math.max( ar2.errors.size(), 1 ) : 1;
        int uniquenessRuleCount = (q.uniqueness() instanceof UniquenessResult ur2 && ur2.errors != null) ? Math.max( ur2.errors.size(), 1 ) : 1;

        long totalCheckCount = tableRowCount * (validityRuleCount + completenessRuleCount + accuracyRuleCount + uniquenessRuleCount) + c.csFieldRefCount();
        long allErrTotal = consistencyErrTotal + q.complErr() + q.validErr() + q.accErr() + q.uniqErr();
        double errRateDouble = totalCheckCount > 0 ? Math.min( (double) allErrTotal / totalCheckCount * 100.0, 100.0 ) : 0.0;

        Map<Integer, Long> validityRuleErrs = new LinkedHashMap<>();
        if (q.validity() instanceof ValidityResult vr && vr.errors != null) {
            for (Map.Entry<String, Long> en : vr.errors.entrySet()) {
                Integer ruleKey = UploadNonFatal.tryParseInt( en.getKey() );
                if (ruleKey != null) {
                    validityRuleErrs.put( ruleKey, en.getValue() );
                }
            }
        }

        Map<Integer, Long> fieldNameRuleErrs = new LinkedHashMap<>();
        if (c.fieldName() != null && c.fieldName().fieldNameRuleErrors != null) {
            fieldNameRuleErrs.putAll( c.fieldName().fieldNameRuleErrors );
        }

        saveResultToDb( tableStored, cdmTableName, tableRowCount, consistencyErrTotal, q.complErr(), q.uniqErr(), q.validErr(), q.accErr(), errRateDouble, validityRuleErrs, fieldNameRuleErrs );

        summaries.add( new TableValidationSummary( cdmTableName, tableRowCount, c.csFieldRefCount(), c.csFieldErrCount(), c.csTypeErrCount(), q.complErr(), q.validErr(), q.accErr(), q.uniqErr(), errRateDouble ) );
    }

    private record ConsistencyPhaseOutcome( RuleConsistencyResult fieldName, RuleConsistencyResult fieldType, long csFieldRefCount, long csFieldErrCount, long csTypeErrCount ) {
    }

    private record QualityPhaseOutcome( UploadAnalysisResult completeness, UploadAnalysisResult validity, UploadAnalysisResult accuracy, UploadAnalysisResult uniqueness, long complErr, long validErr, long accErr, long uniqErr ) {
    }

    private void saveResultToDb( AnalysisRequest req, String cdmTableName, Long tableRowCount, long consistencyErr, long completenessErr, long uniquenessErr, long validityErr, long accuracyErr, double errRateDouble, Map<Integer, Long> validityRuleErrors, Map<Integer, Long> fieldNameRuleErrors ) {
        try {
            Long pblntSn = req.pblntSn() != null ? req.pblntSn() : 0L;
            Long ptcpInstSn = req.ptcpInstSn() != null ? req.ptcpInstSn() : 0L;

            disclosureMapper.deleteTblUldStatsHistByPblntSnAndErrTblNm( statsSchema, pblntSn, ptcpInstSn, cdmTableName );

            Long sn = nextvalTblUldStatsSn();
            String userId = req.userId() != null ? req.userId() : "SYSTEM";
            BigDecimal errRt = BigDecimal.valueOf( errRateDouble ).setScale( 2, RoundingMode.HALF_UP );
            Long grpSn = req.uldVrfcGrpSn();

            disclosureMapper.insertTblUldStatsHist( statsSchema, sn, pblntSn, ptcpInstSn, "02", cdmTableName, tableRowCount, consistencyErr, completenessErr, uniquenessErr, validityErr, accuracyErr, errRt, grpSn, null, null, null, userId, LocalDateTime.now() );

            if (validityRuleErrors != null) {
                for (Map.Entry<Integer, Long> e : validityRuleErrors.entrySet()) {
                    if (e.getKey() == null || e.getValue() == null || e.getValue() <= 0L) {
                        continue;
                    }
                    Long detailSn = nextvalTblUldStatsSn();
                    disclosureMapper.insertTblUldStatsHist( statsSchema, detailSn, pblntSn, ptcpInstSn, "02", cdmTableName, 0L, 0L, 0L, 0L, 0L, 0L, BigDecimal.ZERO, grpSn, e.getKey(), "VL", e.getValue(), userId, LocalDateTime.now() );
                }
            }

            if (fieldNameRuleErrors != null) {
                for (Map.Entry<Integer, Long> e : fieldNameRuleErrors.entrySet()) {
                    if (e.getKey() == null || e.getValue() == null || e.getValue() <= 0L) {
                        continue;
                    }
                    Long detailSn = nextvalTblUldStatsSn();
                    disclosureMapper.insertTblUldStatsHist( statsSchema, detailSn, pblntSn, ptcpInstSn, "02", cdmTableName, 0L, 0L, 0L, 0L, 0L, 0L, BigDecimal.ZERO, grpSn, e.getKey(), VRFC_TP_FIELD_NAME_CONSISTENCY, e.getValue(), userId, LocalDateTime.now() );
                }
            }

            if (pblntSn != null && pblntSn > 0L && ptcpInstSn != null && ptcpInstSn > 0L) {
                int prst = disclosureMapper.setUldTypeCdForDataUploadIfBlank( pblntSn, ptcpInstSn, userId );
                if (prst > 0) {

                }
            }
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
    }

    private Long nextvalTblUldStatsSn() {
        try {
            String seqName = statsSchema + ".sq_cm_tbl_uld_stats_sn";
            Long v = jdbcTemplate.queryForObject( "SELECT nextval('" + seqName.replace( "'", "''" ) + "')", Long.class );
            return v != null ? v : fallbackTblUldStatsSn();
        } catch (Exception e) {
            return fallbackTblUldStatsSn();
        }
    }

    private static long fallbackTblUldStatsSn() {
        return Math.abs( System.nanoTime() % 1_000_000_000L ) + 1;
    }

    private <T extends UploadAnalysisResult> T runSafely( String stepName, String tableName, java.util.function.Supplier<T> task, T fallback, Long totalRowCount ) {
        try {
            return task.get();
        } catch (Exception e) {
            UploadNonFatal.discard( e );
            fallback.tableName = tableName;
            fallback.totalRowCount = totalRowCount;
            return fallback;
        }
    }

    private static long safe( Long v ) {
        return v != null ? v : 0L;
    }

    private static String formatRate( long good, long total ) {
        if (total <= 0)
            return "100.0";
        return String.format( "%.1f", (double) good / total * 100.0 );
    }

    private record TableValidationSummary( String tableName, long totalRowCount, long csFieldRefCount, long csFieldErrCount, long csTypeErrCount, long completenessErr, long validityErr, long accuracyErr, long uniquenessErr, double errRate ) {
    }
}
