package kr.or.kids.domain.cm.upload.service;

import kr.or.kids.domain.cm.upload.dto.AccuracyResult;
import kr.or.kids.domain.cm.upload.mapper.rule.RuleAccuracyMapper;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import kr.or.kids.domain.cm.upload.model.RuleAccuracyRow;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class AnalysisAccuracyService {

    private final RuleAccuracyMapper ruleAccuracyMapper;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.schema:kids_link_own}")
    private String dbSchema;

    private static final String KEY_FIELD = "field";
    private static final String KEY_REF_FIELD = "ref_field";
    private static final String KEY_REF_DATE = "ref_date";

    
    /**
     * 입력값을 검증한다.
     *
     * @param slotKey slotKey
     * @param physicalTable physicalTable
     * @param totalRowCount totalRowCount
     * @return 처리 결과
     */
    public AccuracyResult validate(String slotKey, String physicalTable, Long totalRowCount) {
        Double dateResult = dateAccuracy(slotKey, physicalTable, totalRowCount);
        Double ageResult = ageAccuracy(slotKey, physicalTable, totalRowCount);
        Double genderResult = genderAccuracy(slotKey, physicalTable, totalRowCount);
        Double measRangeResult = measRangeAccuracy(slotKey, physicalTable, totalRowCount);
        Double vitalRangeResult = vitalRangeAccuracy(slotKey, physicalTable, totalRowCount);

        AccuracyResult accuracyResult = new AccuracyResult();
        accuracyResult.status = false;
        accuracyResult.tableName = slotKey;
        accuracyResult.errors.put("date", dateResult);
        accuracyResult.errors.put("age", ageResult);
        accuracyResult.errors.put("gender", genderResult);
        accuracyResult.errors.put("meas", measRangeResult);
        accuracyResult.errors.put("vital", vitalRangeResult);
        accuracyResult.analysisRate = (dateResult + ageResult + genderResult + measRangeResult + vitalRangeResult) / 5;

        return accuracyResult;
    }

    private List<Map<String, String>> queryFieldAndRefField(String sql) {
        try {
            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, String> map = new HashMap<>();
                map.put(KEY_FIELD, rs.getString(KEY_FIELD));
                map.put(KEY_REF_FIELD, rs.getString(KEY_REF_FIELD));
                return map;
            });
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<Map<String, String>> queryRefDateAndRefField(String sql) {
        try {
            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, String> map = new HashMap<>();
                map.put(KEY_REF_DATE, rs.getString(KEY_REF_DATE));
                map.put(KEY_REF_FIELD, rs.getString(KEY_REF_FIELD));
                return map;
            });
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<Map<String, String>> queryRefFieldOnly(String sql) {
        try {
            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, String> map = new HashMap<>();
                map.put(KEY_REF_FIELD, rs.getString(KEY_REF_FIELD));
                return map;
            });
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<Map<String, String>> queryFieldOnly(String sql) {
        try {
            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, String> map = new HashMap<>();
                map.put(KEY_FIELD, rs.getString(KEY_FIELD));
                return map;
            });
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private static long countDateOrderErrors(List<Map<String, String>> results, RuleAccuracyRow rule) {
        long errorCount = 0L;
        for (Map<String, String> result : results) {
            if (result.get(KEY_FIELD) == null || result.get(KEY_REF_FIELD) == null) {
                continue;
            }
            LocalDate fieldDate = normalizeDate(result.get(KEY_FIELD));
            LocalDate refFieldDate = normalizeDate(result.get(KEY_REF_FIELD));
            if (rule.getRangeorder() != null && rule.getRangeorder().equals("H") && fieldDate.isAfter(refFieldDate)) {
                errorCount++;
            }
            if (rule.getRangeorder() != null && rule.getRangeorder().equals("L") && fieldDate.isBefore(refFieldDate)) {
                errorCount++;
            }
        }
        return errorCount;
    }

    private static double accuracyRatioOrZero(long errorCount, List<?> results, Long totalRowCount) {
        if (errorCount == 0 || results.isEmpty() || totalRowCount == null || totalRowCount == 0) {
            return 0.0;
        }
        return (double) errorCount / (double) totalRowCount;
    }

    private OptionalDouble evaluateDateRule(RuleAccuracyRow cdmRuleAccuracy, String physicalTable, Long totalRowCount) {
        if (cdmRuleAccuracy.getField() == null || cdmRuleAccuracy.getRefKey() == null
                || cdmRuleAccuracy.getRefField() == null || cdmRuleAccuracy.getSrcTable() == null
                || cdmRuleAccuracy.getRefTable() == null) {
            return OptionalDouble.empty();
        }
        String refFieldExpr = mysqlExprToPostgres(cdmRuleAccuracy.getRefField(), "B");
        String sqlTemplate1 = """
                    SELECT
                        A."@A" AS field,
                        A."@B" AS ref_key,
                        @C AS ref_field
                    FROM @S."@D" A
                    LEFT JOIN @S."@G" B
                    ON A."@B"::text = B."@B"::text
            """;
        sqlTemplate1 = sqlTemplate1
                .replace("@A", cdmRuleAccuracy.getField())
                .replace("@B", cdmRuleAccuracy.getRefKey())
                .replace("@C", refFieldExpr)
                .replace("@D", physicalTable)
                .replace("@G", cdmRuleAccuracy.getRefTable())
                .replace("@S", dbSchema);

        List<Map<String, String>> results = queryFieldAndRefField(sqlTemplate1);
        long errorCount = countDateOrderErrors(results, cdmRuleAccuracy);
        return OptionalDouble.of(accuracyRatioOrZero(errorCount, results, totalRowCount));
    }

    private Double dateAccuracy(String slotKey, String physicalTable, Long totalRowCount) {
        List<RuleAccuracyRow> rules = ruleAccuracyMapper.findByTableAndRule(dbSchema, slotKey, "date accuracy");
        double dateAccuracyRatio = 0.0;
        for (RuleAccuracyRow cdmRuleAccuracy : rules) {
            OptionalDouble od = evaluateDateRule(cdmRuleAccuracy, physicalTable, totalRowCount);
            if (od.isPresent()) {
                dateAccuracyRatio = od.getAsDouble();
            }
        }
        return dateAccuracyRatio;
    }

    private static String ageRefDateSqlFragment(int level) {
        if (level == 1) {
            return "EXTRACT(YEAR FROM T1.\"ADate\")::int";
        }
        if (level == 2) {
            return "EXTRACT(YEAR FROM T1.\"condition_start_date\")::int";
        }
        return "";
    }

    private static int countAgeThresholdErrors(List<Map<String, String>> results, RuleAccuracyRow rule, int threshold) {
        int errorCount = 0;
        for (Map<String, String> result : results) {
            int age = Integer.parseInt(result.get(KEY_REF_DATE)) - Integer.parseInt(result.get(KEY_REF_FIELD));
            if (rule.getRangeorder() != null && rule.getRangeorder().equals("H") && age > threshold) {
                errorCount++;
            }
            if (rule.getRangeorder() != null && rule.getRangeorder().equals("L") && age < threshold) {
                errorCount++;
            }
        }
        return errorCount;
    }

    private OptionalDouble ageRulePercentContribution(RuleAccuracyRow cdmRuleAccuracy, String physicalTable, Long totalRowCount) {
        if (totalRowCount == null) {
            return OptionalDouble.empty();
        }
        if (cdmRuleAccuracy.getField() == null || cdmRuleAccuracy.getRefKey() == null
                || cdmRuleAccuracy.getRefField() == null || cdmRuleAccuracy.getSrcTable() == null
                || cdmRuleAccuracy.getRefTable() == null || cdmRuleAccuracy.getFieldValue() == null) {
            return OptionalDouble.empty();
        }
        String refDate = ageRefDateSqlFragment(cdmRuleAccuracy.getLevel());
        if (refDate.isEmpty()) {
            return OptionalDouble.empty();
        }
        String sqlTemplate1 = """
                SELECT T1."@A" AS field,
                            T1."@B" AS ref_key,
                            @C       AS ref_date,
                            @D       AS ref_field
                 FROM
                            @E."@F" T1
                 LEFT JOIN
                            @E."@G" T2
                            ON T1."@B"::text = T2."@B"::text
                 WHERE
                            T1."@A"::text = @H::text
            """;
        String refFieldExprAge = mysqlExprToPostgres(cdmRuleAccuracy.getRefField(), "T2");
        sqlTemplate1 = sqlTemplate1
                .replace("@A", cdmRuleAccuracy.getField())
                .replace("@B", cdmRuleAccuracy.getRefKey())
                .replace("@C", refDate)
                .replace("@D", refFieldExprAge)
                .replace("@E", dbSchema)
                .replace("@F", physicalTable)
                .replace("@G", cdmRuleAccuracy.getRefTable())
                .replace("@H", cdmRuleAccuracy.getFieldValue());

        List<Map<String, String>> results = queryRefDateAndRefField(sqlTemplate1);
        int errorCount = countAgeThresholdErrors(results, cdmRuleAccuracy, Integer.parseInt(cdmRuleAccuracy.getThreashold()));
        if (errorCount == 0 || results.isEmpty() || totalRowCount == 0) {
            return OptionalDouble.empty();
        }
        return OptionalDouble.of(((double) errorCount / totalRowCount) * 100.0);
    }

    private Double ageAccuracy(String slotKey, String physicalTable, Long totalRowCount) {
        List<RuleAccuracyRow> rules = ruleAccuracyMapper.findByTableAndRule(dbSchema, slotKey, "age accuracy");
        double sumPercent = 0.0;
        for (RuleAccuracyRow cdmRuleAccuracy : rules) {
            OptionalDouble od = ageRulePercentContribution(cdmRuleAccuracy, physicalTable, totalRowCount);
            if (od.isPresent()) {
                sumPercent += od.getAsDouble();
            }
        }
        if (sumPercent == 0.0 || rules.isEmpty()) {
            return 0.0;
        }
        return sumPercent / rules.size();
    }

    private static long countGenderMatchErrors(List<Map<String, String>> results, RuleAccuracyRow rule, String refMale, String refFemale) {
        long errorCount = 0L;
        for (Map<String, String> result : results) {
            String refField = result.get(KEY_REF_FIELD);
            if (rule.getThreashold() != null && rule.getThreashold().equals("M") && refMale.equals(refField)) {
                errorCount++;
            }
            if (rule.getThreashold() != null && rule.getThreashold().equals("F") && refFemale.equals(refField)) {
                errorCount++;
            }
        }
        return errorCount;
    }

    private OptionalDouble evaluateGenderRule(RuleAccuracyRow cdmRuleAccuracy, String physicalTable, Long totalRowCount) {
        if (cdmRuleAccuracy.getField() == null || cdmRuleAccuracy.getRefKey() == null
                || cdmRuleAccuracy.getRefField() == null || cdmRuleAccuracy.getSrcTable() == null
                || cdmRuleAccuracy.getRefTable() == null || cdmRuleAccuracy.getFieldValue() == null) {
            return OptionalDouble.empty();
        }
        String refMale;
        String refFemale;
        if (cdmRuleAccuracy.getLevel() == 1) {
            refMale = "M";
            refFemale = "F";
        } else if (cdmRuleAccuracy.getLevel() == 2) {
            refMale = "8507";
            refFemale = "8532";
        } else {
            return OptionalDouble.empty();
        }
        String refFieldCol = stripAlias(cdmRuleAccuracy.getRefField());
        String sqlTemplate1 = """
                    SELECT
                          T1."@A" AS field,
                          T1."@B" AS ref_key,
                          T2."@C" AS ref_field
                    FROM @S."@E" T1
                    LEFT JOIN @S."@F" T2
                    ON T1."@B"::text = T2."@B"::text
                    WHERE T1."@A"::text = @G::text
            """;
        sqlTemplate1 = sqlTemplate1
                .replace("@A", cdmRuleAccuracy.getField())
                .replace("@B", cdmRuleAccuracy.getRefKey())
                .replace("@C", refFieldCol)
                .replace("@E", physicalTable)
                .replace("@F", cdmRuleAccuracy.getRefTable())
                .replace("@G", cdmRuleAccuracy.getFieldValue())
                .replace("@S", dbSchema);

        List<Map<String, String>> results = queryFieldAndRefField(sqlTemplate1);
        long errorCount = countGenderMatchErrors(results, cdmRuleAccuracy, refMale, refFemale);
        if (errorCount == 0 || results.isEmpty() || totalRowCount == null || totalRowCount == 0) {
            return OptionalDouble.of(0.0);
        }
        return OptionalDouble.of((double) errorCount / (double) totalRowCount);
    }

    private Double genderAccuracy(String slotKey, String physicalTable, Long totalRowCount) {
        List<RuleAccuracyRow> rules = ruleAccuracyMapper.findByTableAndRule(dbSchema, slotKey, "gender accuracy");
        double genderAccuracyRatio = 0.0;
        for (RuleAccuracyRow cdmRuleAccuracy : rules) {
            OptionalDouble od = evaluateGenderRule(cdmRuleAccuracy, physicalTable, totalRowCount);
            if (od.isPresent()) {
                genderAccuracyRatio = od.getAsDouble();
            }
        }
        return genderAccuracyRatio;
    }

    private static long countNumericCompareErrors(List<Map<String, String>> results, RuleAccuracyRow rule, BigDecimal threshold, String valueKey) {
        long errorCount = 0L;
        for (Map<String, String> result : results) {
            String raw = result.get(valueKey);
            if (raw == null || raw.isBlank()) {
                continue;
            }
            BigDecimal val = new BigDecimal(raw);
            if (rule.getRangeorder() != null && rule.getRangeorder().equals("H") && val.compareTo(threshold) > 0) {
                errorCount++;
            }
            if (rule.getRangeorder() != null && rule.getRangeorder().equals("L") && val.compareTo(threshold) < 0) {
                errorCount++;
            }
        }
        return errorCount;
    }

    private OptionalDouble evaluateMeasRule(RuleAccuracyRow cdmRuleAccuracy, String physicalTable, Long totalRowCount) {
        if (cdmRuleAccuracy.getField() == null || cdmRuleAccuracy.getRefKey() == null
                || cdmRuleAccuracy.getRefField() == null || cdmRuleAccuracy.getSrcTable() == null
                || cdmRuleAccuracy.getFieldValue() == null || cdmRuleAccuracy.getUnit() == null) {
            return OptionalDouble.empty();
        }
        String measRefFieldCol = stripAlias(cdmRuleAccuracy.getRefField());
        String sqlTemplate1 = """
                    SELECT
                          "@A" AS field,
                          "@B" AS unit,
                          "@C" AS ref_field
                    FROM @S."@E"
                    WHERE "@A"::text = @F::text
                    AND "@B"::text = @G::text
            """;
        sqlTemplate1 = sqlTemplate1
                .replace("@A", cdmRuleAccuracy.getField())
                .replace("@B", cdmRuleAccuracy.getRefKey())
                .replace("@C", measRefFieldCol)
                .replace("@E", physicalTable)
                .replace("@F", cdmRuleAccuracy.getFieldValue())
                .replace("@G", cdmRuleAccuracy.getUnit())
                .replace("@S", dbSchema);

        List<Map<String, String>> results = queryRefFieldOnly(sqlTemplate1);
        BigDecimal threshold = new BigDecimal(cdmRuleAccuracy.getThreashold());
        long errorCount = countNumericCompareErrors(results, cdmRuleAccuracy, threshold, KEY_REF_FIELD);
        return OptionalDouble.of(accuracyRatioOrZero(errorCount, results, totalRowCount));
    }

    private Double measRangeAccuracy(String slotKey, String physicalTable, Long totalRowCount) {
        List<RuleAccuracyRow> rules = ruleAccuracyMapper.findByTableAndRule(dbSchema, slotKey, "meas value range accuracy");
        double measAccuracyRatio = 0.0;
        for (RuleAccuracyRow cdmRuleAccuracy : rules) {
            OptionalDouble od = evaluateMeasRule(cdmRuleAccuracy, physicalTable, totalRowCount);
            if (od.isPresent()) {
                measAccuracyRatio = od.getAsDouble();
            }
        }
        return measAccuracyRatio;
    }

    private OptionalDouble evaluateVitalRule(RuleAccuracyRow cdmRuleAccuracy, String physicalTable, Long totalRowCount) {
        if (cdmRuleAccuracy.getField() == null || cdmRuleAccuracy.getSrcTable() == null) {
            return OptionalDouble.empty();
        }
        String sqlTemplate1 = """
                    SELECT
                           "@A" AS field
                    FROM @S."@C"
            """;
        sqlTemplate1 = sqlTemplate1
                .replace("@A", cdmRuleAccuracy.getField())
                .replace("@C", physicalTable)
                .replace("@S", dbSchema);

        List<Map<String, String>> results = queryFieldOnly(sqlTemplate1);
        BigDecimal threshold = new BigDecimal(cdmRuleAccuracy.getThreashold());
        long errorCount = countNumericCompareErrors(results, cdmRuleAccuracy, threshold, KEY_FIELD);
        return OptionalDouble.of(accuracyRatioOrZero(errorCount, results, totalRowCount));
    }

    private Double vitalRangeAccuracy(String slotKey, String physicalTable, Long totalRowCount) {
        List<RuleAccuracyRow> rules = ruleAccuracyMapper.findByTableAndRule(dbSchema, slotKey, "vital value range accuracy");
        double vitalAccuracyRatio = 0.0;
        for (RuleAccuracyRow cdmRuleAccuracy : rules) {
            OptionalDouble od = evaluateVitalRule(cdmRuleAccuracy, physicalTable, totalRowCount);
            if (od.isPresent()) {
                vitalAccuracyRatio = od.getAsDouble();
            }
        }
        return vitalAccuracyRatio;
    }

    
    
    private static String stripAlias(String col) {
        if (col == null) return null;
        String t = col.trim();
        int dot = t.lastIndexOf('.');
        return dot >= 0 ? t.substring(dot + 1) : t;
    }

    private static String mysqlExprToPostgres(String expr, String tableAlias) {
        if (expr == null) return "NULL";
        String trimmed = expr.trim();

        
        if (trimmed.contains(".")) {
            trimmed = trimmed.substring(trimmed.lastIndexOf('.') + 1);
        }

        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("(?i)(year|month|day)\\((.+)\\)").matcher(trimmed);
        if (m.matches()) {
            String func = m.group(1).toUpperCase();
            String col = m.group(2).trim();
            return "EXTRACT(" + func + " FROM " + tableAlias + ".\"" + col + "\")";
        }
        return tableAlias + ".\"" + trimmed + "\"";
    }

    
    /**
     * 값을 정규화한다.
     *
     * @param value value
     * @return 처리 결과
     */
    public static LocalDate normalizeDate(String value)  {
        LocalDate localDate = null;

        try {
            if (4 < value.length()) {
                value = value.substring(0, 10);
            }

            if (value.length() == 4) { 
                localDate = LocalDate.of(Integer.parseInt(value), 1, 1);
            } else { 
                localDate =  LocalDate.parse(value, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            }
        }
        catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }

        return localDate;
    }
}
