package kr.or.kids.domain.cm.upload.service;

import kr.or.kids.domain.cm.upload.dto.RuleConsistencyResult;
import kr.or.kids.domain.cm.upload.mapper.rule.RuleConsistencyMapper;
import kr.or.kids.domain.cm.upload.model.RuleConsistencyRow;
import kr.or.kids.domain.cm.upload.controller.CsvLoader;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.sql.SQLException;
import java.nio.file.Path;
import java.text.Normalizer;
import java.util.*;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class AnalysisConsistencyService {

    private static final String SQL_SELECT_COUNT_FROM = "SELECT COUNT(*) AS count FROM ";
    private static final String SQL_WHERE = " WHERE ";
    private static final String SQL_IS_NOT_NULL_AND_OPEN = " IS NOT NULL AND (";

    private final JdbcTemplate jdbcTemplate;
    private final RuleConsistencyMapper ruleConsistencyMapper;
    private final CsvLoader csvUtil;

    @Value("${app.upload.root:./storage/uploads}")
    private Path uploadRoot;

    @Value("${app.schema:kids_link_own}")
    private String dbSchema;

    
    
    /**
     * 입력값을 검증한다.
     *
     * @param slotKey slotKey
     * @param storedName storedName
     * @return 처리 결과
     */
    public RuleConsistencyResult validateFieldName(String slotKey, String storedName) throws IOException {
        return validateFieldName(slotKey, storedName, null);
    }

    
    /**
     * 입력값을 검증한다.
     *
     * @param slotKey slotKey
     * @param storedName storedName
     * @param optionalCsvPath optionalCsvPath
     * @return 처리 결과
     */
    public RuleConsistencyResult validateFieldName(String slotKey, String storedName, java.nio.file.Path optionalCsvPath) throws IOException {
        String slotName = slotNameForCsvPath(slotKey);
        Path csvPath = optionalCsvPath != null && java.nio.file.Files.isRegularFile(optionalCsvPath)
                ? optionalCsvPath
                : csvUtil.resolveCsvPath(uploadRoot, slotName, storedName);
        List<String> csvTableFieldNames = csvUtil.readHeader(csvPath.normalize());
        Set<String> normalizedHeader = new HashSet<>();
        for (String h : csvTableFieldNames) {
            normalizedHeader.add(normalizeName(h));
        }

        List<RuleConsistencyRow> cdmTableFieldNames = ruleConsistencyMapper.findByTableAndRule(dbSchema, slotKey, "field name consistency");
        if (cdmTableFieldNames.isEmpty()) {
            RuleConsistencyResult emptyResult = new RuleConsistencyResult();
            emptyResult.tableName = slotKey;
            emptyResult.referenceFields = List.of();
            emptyResult.missingFields = List.of();
            emptyResult.matchedFields = new ArrayList<>();
            emptyResult.status = true;
            emptyResult.totalErrorCount = 0L;
            emptyResult.analysisRate = 1.0;
            return emptyResult;
        }

        List<String> missingFields = new ArrayList<>();
        List<String> matchedFields = new ArrayList<>();
        Map<Integer, Long> fieldNameRuleErrs = new LinkedHashMap<>();
        partitionCdmFieldsAgainstHeader(cdmTableFieldNames, normalizedHeader, missingFields, matchedFields, fieldNameRuleErrs);

        
        List<String> referenceFieldName = cdmTableFieldNames.stream()
                .map(RuleConsistencyRow::getField)
                .toList();

        RuleConsistencyResult consistencyResult = new RuleConsistencyResult();
        consistencyResult.status = missingFields.isEmpty();
        consistencyResult.tableName = slotKey;
        consistencyResult.missingFields = missingFields;
        consistencyResult.matchedFields = matchedFields;
        consistencyResult.referenceFields = referenceFieldName;
        consistencyResult.totalErrorCount = (long)missingFields.size();
        consistencyResult.analysisRate = (double)(consistencyResult.referenceFields.size()-consistencyResult.totalErrorCount) / (double)consistencyResult.referenceFields.size();
        consistencyResult.fieldNameRuleErrors = fieldNameRuleErrs;

        return consistencyResult;
    }

    private static String buildFieldTypeCheckSql(String qualifiedTable, RuleConsistencyRow rule) {
        String ruleField = rule.getField();
        String ruleType = rule.getRefDetail();
        String[] fieldTypeData = ruleType.split(",");
        String fieldType = fieldTypeData[0].replaceAll("\\s*\\([^)]*\\)\\s*", "").trim();
        String prefix = SQL_SELECT_COUNT_FROM + qualifiedTable + SQL_WHERE + ruleField;
        String tail = fieldTypeConstraintTail(fieldType, ruleField);
        if (tail == null) {
            return null;
        }
        if ("SELECT 0".equals(tail)) {
            return tail;
        }
        return prefix + SQL_IS_NOT_NULL_AND_OPEN + tail;
    }

    private static String fieldTypeConstraintTail(String fieldType, String ruleField) {
        return switch (fieldType) {
            case "integer", "bigint" -> ruleField + "::text !~ '^-?[0-9]+$')";
            case "float", "numeric" ->
                    ruleField + "::text !~ '^[+-]?[0-9]*\\.?[0-9]+([eE][+-]?[0-9]+)?$')";
            case "date" -> ruleField + "::text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')";
            case "time" -> ruleField + "::text !~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$')";
            case "char" -> "LENGTH(" + ruleField + "::text) != 1)";
            case "varchar" -> null;
            default -> "SELECT 0";
        };
    }

    private void runFieldTypeCountQuery(String sql, String ruleField, RuleConsistencyResult analysisResult) {
        try {
            List<Integer> results = jdbcTemplate.query(sql, (rs, rowNum) ->
                    Integer.parseInt(rs.getString("count")));

            if (!results.isEmpty() && results.get(0) != 0) {
                analysisResult.errors.put(ruleField, results.get(0));
                analysisResult.totalErrorCount += 1;
            }
        } catch (BadSqlGrammarException e) {
            if (shouldRethrowBadSqlGrammar(e)) {
                throw e;
            }
        }
    }

    
    private static boolean shouldRethrowBadSqlGrammar(BadSqlGrammarException e) {
        for (Throwable t = e.getCause(); t != null; t = t.getCause()) {
            if (t instanceof SQLException sqlEx) {
                String state = sqlEx.getSQLState();
                if ("42P01".equals(state) || "42703".equals(state)) {
                    return false;
                }
                return true;
            }
        }
        return true;
    }

    
    /**
     * 입력값을 검증한다.
     *
     * @param slotKey slotKey
     * @param physicalTable physicalTable
     * @param tableRowCount tableRowCount
     * @param fieldCount fieldCount
     * @return 처리 결과
     */
    public RuleConsistencyResult validateFieldType(String slotKey, String physicalTable, Long tableRowCount, int fieldCount) {
        List<RuleConsistencyRow> rules = ruleConsistencyMapper.findByTableAndRule(dbSchema, slotKey, "field type consistency");

        RuleConsistencyResult analysisResult = new RuleConsistencyResult();
        analysisResult.tableName = slotKey;
        analysisResult.totalRowCount = tableRowCount;
        if (rules.isEmpty() || fieldCount <= 0) {
            analysisResult.status = true;
            analysisResult.analysisRate = 1.0;
            return analysisResult;
        }
        analysisResult.status = false;

        
        String qualifiedTable = dbSchema + "." + physicalTable;

        for (RuleConsistencyRow rule : rules) {
            String sql = buildFieldTypeCheckSql(qualifiedTable, rule);
            if (sql != null) {
                runFieldTypeCountQuery(sql, rule.getField(), analysisResult);
            }
        }

        analysisResult.calculationFieldTypeRate(fieldCount);
        return analysisResult;
    }

    private void partitionCdmFieldsAgainstHeader(List<RuleConsistencyRow> cdmTableFieldNames, Set<String> normalizedHeader,
            List<String> missingFields, List<String> matchedFields, Map<Integer, Long> fieldNameRuleErrs) {
        for (RuleConsistencyRow cdmFieldName : cdmTableFieldNames) {
            String fld = cdmFieldName.getField();
            if (fld == null || fld.isBlank()) {
                continue;
            }
            if (!normalizedHeader.contains(normalizeName(fld))) {
                missingFields.add(fld);
                Integer rid = cdmFieldName.getRuleId();
                if (rid != null) {
                    fieldNameRuleErrs.merge(rid, 1L, Long::sum);
                }
            } else {
                matchedFields.add(fld);
            }
        }
    }

    private static String slotNameForCsvPath(String slotKey) {
        if (slotKey.startsWith("tb_cm_i_tmpr_")) {
            return slotKey.substring(13);
        }
        if (slotKey.startsWith("tb_cm_i_")) {
            return slotKey.substring(8);
        }
        return slotKey.replace("cdm_", "");
    }

    private String normalizeName(String raw) {
        if (raw == null) return "";
        String s = raw.trim();
        if (s.isEmpty()) return "";
        if ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("'") && s.endsWith("'"))) {
            s = s.substring(1, s.length() - 1).trim();
        }
        s = s.replaceAll("\\s+", "_").toLowerCase(Locale.ROOT);
        raw = Normalizer.normalize(s, Normalizer.Form.NFC);
        return raw
                .replace("\uFEFF","")
                .replace("\r","")
                .trim();
    }

}
