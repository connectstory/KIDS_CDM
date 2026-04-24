package kr.or.kids.domain.cm.upload.service;

import kr.or.kids.domain.cm.upload.dto.ValidityResult;
import kr.or.kids.domain.cm.upload.mapper.DisclosurePartnerMapper;
import kr.or.kids.domain.cm.upload.mapper.rule.RuleValidityMapper;
import kr.or.kids.domain.cm.upload.model.RuleValidityRow;
import kr.or.kids.domain.cm.upload.util.CdmOmopPrimaryKeyColumns;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class AnalysisValidityService {

    private final JdbcTemplate jdbcTemplate;
    private final RuleValidityMapper ruleValidityMapper;
    private final DisclosurePartnerMapper disclosurePartnerMapper;

    @Value("${app.schema:kids_link_own}")
    private String dbSchema;

    @Value("${app.vocabulary-schema:}")
    private String vocabularySchemaConfig;

    @Value("${app.vocabulary-table-prefix:}")
    private String vocabularyTablePrefix;

    @SuppressWarnings("unused")
    private static final Set<String> ALLOWED_TABLES = Set.of("person");
    @SuppressWarnings("unused")
    private static final Set<String> ALLOWED_COLS = Set.of("gender_concept_id");

    private String resolveInstTaskParam(Long ptcpInstSn, Long pblntSn) {
        if (ptcpInstSn == null) {
            return null;
        }
        String brno = disclosurePartnerMapper.findBrnoByPtcpInstSn(ptcpInstSn, pblntSn);
        
        String instTaskSnValue = (brno != null && !brno.isBlank()) ? brno : String.valueOf(ptcpInstSn);
        return instTaskSnValue;
    }

    private static String normalizeBrno(String brno) {
        if (brno == null || brno.isBlank()) {
            return brno;
        }
        String s = brno.replace("-", "").replace(" ", "").trim();
        s = s.replaceFirst("^0+", "");
        return s.isEmpty() ? "0" : s;
    }

    private void appendUnionNotIn(
            List<String> unionParts,
            List<Object> unionArgs,
            String colA,
            String schemaB,
            String tableC,
            String whereE,
            String rowKeyExpr,
            String instParamOrNull
    ) {
        String joined = Arrays.stream(whereE.split("\\|"))
                .map(s -> "'" + s + "'")
                .collect(Collectors.joining(","));
        
        String instFilter = (instParamOrNull != null) ? " AND t.inst_task_sn = ?" : "";
        unionParts.add(
                "SELECT DISTINCT (%s) AS _k FROM %s.%s t WHERE t.%s::text NOT IN (%s)%s"
                        .formatted(rowKeyExpr, schemaB, tableC, colA, joined, instFilter));
        if (instParamOrNull != null) {
            unionArgs.add(instParamOrNull);
        }
    }

    private void appendUnionNotInConcept(
            List<String> unionParts,
            List<Object> unionArgs,
            String colA,
            String schemaB,
            String tableC,
            String whereE,
            String rowKeyExpr,
            String instTaskSnStrOrNull
    ) {
        String vocaSchema = (vocabularySchemaConfig != null && !vocabularySchemaConfig.isBlank())
                ? vocabularySchemaConfig.trim() : dbSchema;
        String vocaPrefix = (vocabularyTablePrefix != null) ? vocabularyTablePrefix.trim() : "";
        String conceptTable = vocaPrefix + "concept";
        String vocaQualified = (vocaSchema != null && !vocaSchema.isBlank()) ? vocaSchema + "." + conceptTable : conceptTable;
        String instFilter = (instTaskSnStrOrNull != null) ? " AND t.inst_task_sn = ?" : "";
        unionParts.add(
                """
                        SELECT DISTINCT (%s) AS _k FROM %s.%s t
                        WHERE NOT EXISTS (
                          SELECT 1 FROM %s c
                          WHERE c.concept_id::text = TRIM(COALESCE(t.%s::text, ''))
                          AND %s
                        )%s
                        """.formatted(rowKeyExpr, schemaB, tableC, vocaQualified, colA, whereE, instFilter));
        if (instTaskSnStrOrNull != null) {
            unionArgs.add(instTaskSnStrOrNull);
        }
    }

    private void appendOneValidityRuleUnion(
            String slotKey,
            RuleValidityRow cdmRuleValidity,
            List<String> unionParts,
            List<Object> unionArgs,
            String tableForSql,
            String rowKeyExpr,
            String instStr,
            String instTaskSnStrOrNull) {
        try {
            if (1 == cdmRuleValidity.getLevel()) {
                appendUnionNotIn(
                        unionParts, unionArgs,
                        cdmRuleValidity.getField(),
                        dbSchema,
                        tableForSql,
                        cdmRuleValidity.getRef(),
                        rowKeyExpr,
                        instStr);
            } else {
                appendUnionNotInConcept(
                        unionParts, unionArgs,
                        cdmRuleValidity.getField(),
                        dbSchema,
                        tableForSql,
                        cdmRuleValidity.getRef(),
                        rowKeyExpr,
                        instTaskSnStrOrNull);
            }
        } catch (Exception ex) {
            UploadNonFatal.discard( ex );
        }
    }

    private int countUnionDistinctRows(List<String> unionParts, List<Object> unionArgs) {
        if (unionParts.isEmpty()) {
            return 0;
        }
        String body = String.join("\nUNION\n", unionParts);
        String sql = "SELECT COUNT(*)::int FROM (\n" + body + "\n) _u";
        if (unionArgs.isEmpty()) {
            Integer r = jdbcTemplate.queryForObject(sql, Integer.class);
            return r == null ? 0 : r;
        }
        return jdbcTemplate.queryForObject(sql, Integer.class, unionArgs.toArray());
    }

    /**
     * 입력값을 검증한다.
     *
     * @param slotKey slotKey
     * @param physicalTable physicalTable
     * @param totalRowCount totalRowCount
     * @param ptcpInstSn ptcpInstSn
     * @param pblntSn pblntSn
     * @return 처리 결과
     */
    public ValidityResult validate(String slotKey, String physicalTable, Long totalRowCount, Long ptcpInstSn, Long pblntSn) {
        List<RuleValidityRow> cdmRuleValidityList = ruleValidityMapper.findByTable(dbSchema, slotKey);
        ValidityResult analysisResult = new ValidityResult();
        analysisResult.status = false;
        analysisResult.tableName = slotKey;
        analysisResult.totalRowCount = totalRowCount;

        String tableForSql = physicalTable != null && !physicalTable.isBlank()
                ? physicalTable
                : (cdmRuleValidityList.isEmpty() ? slotKey : cdmRuleValidityList.get(0).getSrcTable());
        String logicalName = CdmOmopPrimaryKeyColumns.resolveLogicalTableName(slotKey, tableForSql);
        String rowKeyExpr = CdmOmopPrimaryKeyColumns.rowKeyExpression("t", logicalName);
        if (CdmOmopPrimaryKeyColumns.primaryKeyColumns(logicalName).isEmpty()) {

        }

        final String instStr = (ptcpInstSn != null) ? resolveInstTaskParam(ptcpInstSn, pblntSn) : null;
        final String instLong = instStr;

        List<String> unionParts = new ArrayList<>();
        List<Object> unionArgs = new ArrayList<>();

        for (RuleValidityRow cdmRuleValidity : cdmRuleValidityList) {
            appendOneValidityRuleUnion(slotKey, cdmRuleValidity, unionParts, unionArgs, tableForSql, rowKeyExpr, instStr, instLong);
        }

        
        analysisResult.totalErrorCount = (long) countUnionDistinctRows(unionParts, unionArgs);
        
        for (RuleValidityRow cdmRuleValidity : cdmRuleValidityList) {
            List<String> onePart = new ArrayList<>();
            List<Object> oneArgs = new ArrayList<>();
            appendOneValidityRuleUnion(slotKey, cdmRuleValidity, onePart, oneArgs, tableForSql, rowKeyExpr, instStr, instLong);
            int cnt = countUnionDistinctRows(onePart, oneArgs);
            if (cdmRuleValidity.getRuleId() != null && cnt > 0) {
                analysisResult.errors.put(String.valueOf(cdmRuleValidity.getRuleId()), (long) cnt);
            }
        }
        analysisResult.status = analysisResult.totalErrorCount == 0;
        analysisResult.calculationRate();
        return analysisResult;
    }
}
