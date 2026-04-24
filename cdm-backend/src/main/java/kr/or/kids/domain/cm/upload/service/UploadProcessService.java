package kr.or.kids.domain.cm.upload.service;

import kr.or.kids.domain.cm.upload.dto.*;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class UploadProcessService {

    private final UploadService uploadService;
    private final AnalysisService analysisService;
    private final CommitService commitService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.schema:kids_link_own}")
    private String schema;

    private static final String KEY_CONSISTENCY_FIELD = "consistencyFieldName";
    private static final String KEY_CONSISTENCY_TYPE = "consistencyFieldType";
    private static final String KEY_COMPLETENESS = "completeness";
    private static final String KEY_VALIDITY = "validity";
    private static final String KEY_ACCURACY = "accuracy";

    /**
     * process 처리를 수행한다.
     *
     * @param req req
     * @return 처리 결과
     */
    public ProcessUploadResponse process(ProcessUploadRequest req) {
        String storedName = req.storedName();
        if (storedName == null || storedName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "storedName is required");
        }

        String slot = (req.slot() != null && !req.slot().isBlank())
                ? req.slot().trim().toLowerCase()
                : inferSlotFromStoredName(storedName);
        if (slot == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Could not infer table from file name. Provide slot or use a file name containing the table (e.g. visit_occurrence.xlsx).");
        }

        AnalysisRequest analysisRequest = new AnalysisRequest(slot, storedName);
        List<AnalysisRequest> list = List.of(analysisRequest);

        
        Map<String, Map<String, UploadAnalysisResult>> analysis;
        try {
            analysis = analysisService.validate(list);
        } catch (Exception e) {
            return new ProcessUploadResponse(
                    false, slot, storedName, null, null, false, false,
                    "검증에 실패했습니다.");
        }

        Map<String, UploadAnalysisResult> slotResults = analysis.get(slot);
        if (slotResults == null) {
            slotResults = Map.of();
        }

        ProcessUploadResponse.ValidationSummary validationSummary = buildValidationSummary(slotResults);

        
        boolean validationStatsRecorded = false;
        try {
            insertValidationStats(slot, storedName, validationSummary);
            validationStatsRecorded = true;
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }

        
        boolean append = Boolean.TRUE.equals(req.append());
        CommitResponse commitResponse;
        try {
            commitResponse = commitService.commit(new CommitRequest(0.9, list, append));
        } catch (Exception e) {
            return new ProcessUploadResponse(
                    false, slot, storedName, validationSummary, null,
                    validationStatsRecorded, false,
                    "적재에 실패했습니다.");
        }

        String resultKey = slot + "|" + storedName;
        CommitTableResult commitResult = commitResponse.results().get(resultKey);
        if (commitResult == null) {
            return new ProcessUploadResponse(
                    true, slot, storedName, validationSummary, null,
                    validationStatsRecorded, false,
                    "Commit completed but result not found for key: " + resultKey);
        }

        ProcessUploadResponse.CommitSummary commitSummary = new ProcessUploadResponse.CommitSummary(
                commitResult.insertedRows(),
                commitResult.totalCsvRows(),
                commitResult.invalidValueCount(),
                commitResult.headerMatchRate()
        );

        
        boolean uploadStatsRecorded = false;
        try {
            insertUploadStats(slot, storedName, commitResult);
            uploadStatsRecorded = true;
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }

        return new ProcessUploadResponse(
                true, slot, storedName, validationSummary, commitSummary,
                validationStatsRecorded, uploadStatsRecorded,
                null);
    }

    private String inferSlotFromStoredName(String storedName) {
        String fileName = storedName.contains("_") ? storedName.substring(storedName.indexOf("_") + 1) : storedName;
        return uploadService.inferTableFromFileName(fileName);
    }

    private ProcessUploadResponse.ValidationSummary buildValidationSummary(Map<String, UploadAnalysisResult> slotResults) {
        long totalRowCount = resolveTotalRowCountForSummary(slotResults);
        int consistencyFieldErrors = intErrorCountOrZero(slotResults.get(KEY_CONSISTENCY_FIELD));
        int consistencyTypeErrors = intErrorCountOrZero(slotResults.get(KEY_CONSISTENCY_TYPE));
        long completenessErrors = longErrorCountOrZero(slotResults.get(KEY_COMPLETENESS));
        long validityErrors = longErrorCountOrZero(slotResults.get(KEY_VALIDITY));
        long accuracyErrors = longErrorCountOrZero(slotResults.get(KEY_ACCURACY));

        long overallErrorCount = (long) consistencyFieldErrors + consistencyTypeErrors + completenessErrors + validityErrors + accuracyErrors;
        double overallErrorRate = totalRowCount > 0 ? (double) overallErrorCount / totalRowCount : 0.0;

        return new ProcessUploadResponse.ValidationSummary(
                totalRowCount,
                consistencyFieldErrors,
                consistencyTypeErrors,
                completenessErrors,
                validityErrors,
                accuracyErrors,
                overallErrorCount,
                overallErrorRate
        );
    }

    
    private static long resolveTotalRowCountForSummary(Map<String, UploadAnalysisResult> slotResults) {
        long rows = 0L;
        UploadAnalysisResult cf = slotResults.get(KEY_CONSISTENCY_FIELD);
        if (cf != null && cf.totalRowCount != null) {
            rows = cf.totalRowCount;
        }
        UploadAnalysisResult comp = slotResults.get(KEY_COMPLETENESS);
        if (comp != null && comp.totalRowCount != null) {
            rows = comp.totalRowCount;
        }
        return rows;
    }

    private static int intErrorCountOrZero(UploadAnalysisResult r) {
        if (r == null || r.totalErrorCount == null) {
            return 0;
        }
        return r.totalErrorCount.intValue();
    }

    private static long longErrorCountOrZero(UploadAnalysisResult r) {
        return r != null && r.totalErrorCount != null ? r.totalErrorCount : 0L;
    }

    private void insertValidationStats(String tableName, String storedName, ProcessUploadResponse.ValidationSummary v) {
        jdbcTemplate.update(
                "INSERT INTO " + schema + ".validation_stats " +
                        "(table_name, stored_name, total_row_count, consistency_field_errors, consistency_type_errors, " +
                        "completeness_errors, validity_errors, accuracy_errors, overall_error_count, overall_error_rate) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                tableName, storedName,
                v.totalRowCount(), v.consistencyFieldErrors(), v.consistencyTypeErrors(),
                v.completenessErrors(), v.validityErrors(), v.accuracyErrors(),
                v.overallErrorCount(), v.overallErrorRate()
        );
    }

    private void insertUploadStats(String tableName, String storedName, CommitTableResult r) {
        jdbcTemplate.update(
                "INSERT INTO " + schema + ".upload_stats " +
                        "(table_name, stored_name, rows_inserted, rows_total, invalid_count, header_match_rate) " +
                        "VALUES (?, ?, ?, ?, ?, ?)",
                tableName, storedName,
                r.insertedRows(), r.totalCsvRows(), r.invalidValueCount(), r.headerMatchRate()
        );
    }
}
