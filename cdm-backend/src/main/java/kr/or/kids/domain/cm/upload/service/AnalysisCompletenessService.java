package kr.or.kids.domain.cm.upload.service;

import kr.or.kids.domain.cm.upload.dto.CompletenessResult;
import kr.or.kids.domain.cm.upload.mapper.rule.RuleConsistencyMapper;
import kr.or.kids.domain.cm.upload.model.RuleConsistencyRow;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class AnalysisCompletenessService {

    private final JdbcTemplate jdbcTemplate;
    private final RuleConsistencyMapper ruleConsistencyMapper;

    @Value("${app.schema:kids_link_own}")
    private String dbSchema;

    
    /**
     * 입력값을 검증한다.
     *
     * @param slotKey slotKey
     * @param physicalTable physicalTable
     * @param tableRowCount tableRowCount
     * @return 처리 결과
     */
    public CompletenessResult validate(String slotKey, String physicalTable, Long tableRowCount) {
        List<RuleConsistencyRow> rules = ruleConsistencyMapper.findByTableAndRuleAndRequired(dbSchema, slotKey, "field type consistency", true);

        CompletenessResult analysisResult = new CompletenessResult();
        analysisResult.status = false;
        analysisResult.tableName = slotKey;
        analysisResult.totalRowCount = tableRowCount;

        Map<String, List<String>> ruleTableGroupeds = rules.stream()
                .collect(Collectors.groupingBy(
                        RuleConsistencyRow::getSrcTable,
                        Collectors.mapping(RuleConsistencyRow::getField, Collectors.toList())
                ));

        for (Map.Entry<String, List<String>> ruleEntry : ruleTableGroupeds.entrySet()) {
            applyCompletenessGroup(ruleEntry, slotKey, physicalTable, analysisResult);
        }

        analysisResult.calculationRate();
        return analysisResult;
    }

    private void applyCompletenessGroup(Map.Entry<String, List<String>> ruleEntry, String slotKey, String physicalTable,
            CompletenessResult analysisResult) {
        String srcTable = ruleEntry.getKey();
        String tableForSql = (srcTable != null && srcTable.equals(slotKey)) ? physicalTable : (srcTable != null ? srcTable : physicalTable);
        String qualifiedTable = tableForSql.contains(".") ? tableForSql : (dbSchema + "." + tableForSql);

        StringBuilder col = new StringBuilder();
        for (String field : ruleEntry.getValue()) {
            col.append("SUM(CASE WHEN ").append(field).append(" IS NULL THEN 1 ELSE 0 END) AS ").append(field).append(",");
        }
        col.deleteCharAt(col.length() - 1);

        String sql = """
                SELECT
                    @A
                FROM @T
            """.replace("@A", col.toString()).replace("@T", qualifiedTable);

        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql);
        if (results.isEmpty()) {
            return;
        }
        for (Map.Entry<String, Object> resultEntry : results.get(0).entrySet()) {
            Object val = resultEntry.getValue();
            if (val == null) {
                continue;
            }
            int count = Integer.parseInt(val.toString());
            if (count != 0) {
                analysisResult.errors.put(resultEntry.getKey(), count);
                analysisResult.totalErrorCount += count;
            }
        }
    }

    private static boolean isBlankLike(String s) {
        return s == null || s.isBlank() || "null".equalsIgnoreCase(s) || "NULL".equals(s);
    }
}
