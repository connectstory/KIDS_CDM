package kr.or.kids.domain.cm.upload.service;

import kr.or.kids.domain.cm.upload.dto.UniquenessResult;
import kr.or.kids.domain.cm.upload.mapper.DisclosurePartnerMapper;
import kr.or.kids.domain.cm.upload.mapper.rule.RuleUniquenessMapper;
import kr.or.kids.domain.cm.upload.model.RuleUniquenessRow;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class AnalysisUniquenessService {

    private final JdbcTemplate jdbcTemplate;
    private final RuleUniquenessMapper ruleUniquenessMapper;
    private final DisclosurePartnerMapper disclosurePartnerMapper;

    @Value("${app.schema:kids_link_own}")
    private String dbSchema;

    private String resolveInstTaskSn(Long ptcpInstSn, Long pblntSn) {
        if (ptcpInstSn == null) {
            return null;
        }
        String brno = disclosurePartnerMapper.findBrnoByPtcpInstSn(ptcpInstSn, pblntSn);
        
        return (brno != null && !brno.isBlank()) ? brno : String.valueOf(ptcpInstSn);
    }

    private static String qIdent(String name) {
        if (name == null) {
            return "\"\"";
        }
        return "\"" + name.replace("\"", "\"\"") + "\"";
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
    public UniquenessResult validate(String slotKey, String physicalTable, Long totalRowCount, Long ptcpInstSn, Long pblntSn) {

        List<RuleUniquenessRow> rules = ruleUniquenessMapper.findByTable(dbSchema, slotKey);

        UniquenessResult uniquenessResult = new UniquenessResult();
        uniquenessResult.status = false;
        uniquenessResult.tableName = slotKey;
        uniquenessResult.totalRowCount = totalRowCount;

        String instSn = resolveInstTaskSn(ptcpInstSn, pblntSn);
        boolean scopeByInst = instSn != null;

        for (RuleUniquenessRow rule : rules) {
            String ruleKind = rule.getRule() != null ? rule.getRule().toLowerCase() : "";
            if (ruleKind.contains("global")) {
                applyGlobalUniquenessRule(rule, uniquenessResult, physicalTable, totalRowCount, scopeByInst, instSn);
            } else if (ruleKind.contains("local")) {
                applyLocalUniquenessRule(rule, uniquenessResult, physicalTable, totalRowCount, scopeByInst, instSn);
            }
        }

        uniquenessResult.calculationRate();
        return uniquenessResult;
    }

    /**
     * 입력값을 검증한다.
     *
     * @param slotKey slotKey
     * @param physicalTable physicalTable
     * @param totalRowCount totalRowCount
     * @return 처리 결과
     */
    public UniquenessResult validate(String slotKey, String physicalTable, Long totalRowCount) {
        return validate(slotKey, physicalTable, totalRowCount, null, null);
    }

    
    /**
     * 입력값을 검증한다.
     *
     * @param slotKey slotKey
     * @param physicalTable physicalTable
     * @param totalRowCount totalRowCount
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    @Deprecated
    public UniquenessResult validate(String slotKey, String physicalTable, Long totalRowCount, Long ptcpInstSn) {
        return validate(slotKey, physicalTable, totalRowCount, ptcpInstSn, null);
    }

    private void applyGlobalUniquenessRule(RuleUniquenessRow rule, UniquenessResult uniquenessResult, String physicalTable, Long totalRowCount, boolean scopeByInst, String instSn) {
        String colA = qIdent(rule.getField());
        String sql;
        Long results;
        if (scopeByInst) {
            sql = """
                    SELECT COUNT(*) AS c FROM (
                      SELECT %s FROM %s.%s WHERE "inst_task_sn" = ?
                      GROUP BY %s HAVING COUNT(*) > 1
                    ) d
                    """.formatted(colA, dbSchema, physicalTable, colA);
            results = runCountQuery(sql, instSn);
        } else {
            sql = """
                    SELECT COUNT(*) AS c FROM (
                      SELECT %s FROM %s.%s GROUP BY %s HAVING COUNT(*) > 1
                    ) d
                    """.formatted(colA, dbSchema, physicalTable, colA);
            results = runCountQuery(sql);
        }
        uniquenessResult.totalErrorCount += results;
        Double rate = (totalRowCount != null && totalRowCount > 0)
                ? (double) results / (double) totalRowCount * 100 : 0.0;
        uniquenessResult.errors.put(rule.getField(), rate);
    }

    private void applyLocalUniquenessRule(RuleUniquenessRow rule, UniquenessResult uniquenessResult, String physicalTable, Long totalRowCount, boolean scopeByInst, String instSn) {
        String colA = qIdent(rule.getField());
        String colB = qIdent(rule.getRef());
        String sql;
        Long results;
        if (scopeByInst) {
            sql = """
                    SELECT COUNT(*) AS c FROM (
                      SELECT %s FROM %s.%s WHERE "inst_task_sn" = ?
                      GROUP BY %s HAVING COUNT(DISTINCT %s) > 1
                    ) d
                    """.formatted(colB, dbSchema, physicalTable, colB, colA);
            results = runCountQuery(sql, instSn);
        } else {
            sql = """
                    SELECT COUNT(*) AS c FROM (
                      SELECT %s FROM %s.%s
                      GROUP BY %s HAVING COUNT(DISTINCT %s) > 1
                    ) d
                    """.formatted(colB, dbSchema, physicalTable, colB, colA);
            results = runCountQuery(sql);
        }
        uniquenessResult.totalErrorCount += results;
        Double rate = (totalRowCount != null && totalRowCount > 0)
                ? (double) results / (double) totalRowCount * 100 : 0.0;
        uniquenessResult.errors.put(rule.getField() + "(local)", rate);
    }

    private Long runCountQuery(String sql, Object... args) {
        try {
            if (args == null || args.length == 0) {
                Long r = jdbcTemplate.queryForObject(sql, Long.class);
                return r != null ? r : 0L;
            }
            Long r = jdbcTemplate.queryForObject(sql, Long.class, args);
            return r != null ? r : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }
}
