package kr.or.kids.domain.cm.upload.util;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

public final class CdmOmopPrimaryKeyColumns {

    private static final String TMP_PREFIX = "tb_cm_i_tmpr_";
    private static final String COL_INST_TASK_SN = "inst_task_sn";

    
    private static final Map<String, List<String>> TABLE_PK = Map.ofEntries(
            Map.entry("observation_period", List.of("observation_period_id")),
            Map.entry("person", List.of("person_id", COL_INST_TASK_SN)),
            Map.entry("drug_exposure", List.of("drug_exposure_id", COL_INST_TASK_SN)),
            Map.entry("visit_occurrence", List.of("visit_occurrence_id")),
            Map.entry("measurement", List.of("measurement_id", COL_INST_TASK_SN)),
            Map.entry("condition_occurrence", List.of("condition_occurrence_id", "visit_occurrence_id")),
            Map.entry("procedure_occurrence", List.of("procedure_occurrence_id")),
            Map.entry("observation", List.of("observation_id")),
            Map.entry("death", List.of("person_id", COL_INST_TASK_SN))
    );

    private CdmOmopPrimaryKeyColumns() {
        
    }

    
    /**
     * resolveLogicalTableName 처리를 수행한다.
     *
     * @param slotKey slotKey
     * @param physicalTable physicalTable
     * @return 처리 결과
     */
    public static String resolveLogicalTableName(String slotKey, String physicalTable) {
        String base = (physicalTable != null && !physicalTable.isBlank()) ? physicalTable.trim() : slotKey;
        String lower = base.toLowerCase(Locale.ROOT);
        if (lower.startsWith(TMP_PREFIX)) {
            return lower.substring(TMP_PREFIX.length());
        }
        return slotKey != null ? slotKey.toLowerCase(Locale.ROOT) : lower;
    }

    /**
     * primaryKeyColumns 처리를 수행한다.
     *
     * @param logicalTableName logicalTableName
     * @return 처리 결과
     */
    public static List<String> primaryKeyColumns(String logicalTableName) {
        if (logicalTableName == null) {
            return List.of();
        }
        List<String> cols = TABLE_PK.get(logicalTableName.toLowerCase(Locale.ROOT));
        return cols != null ? cols : List.of();
    }

    
    /**
     * rowKeyExpression 처리를 수행한다.
     *
     * @param tableAlias tableAlias
     * @param logicalTableName logicalTableName
     * @return 처리 결과
     */
    public static String rowKeyExpression(String tableAlias, String logicalTableName) {
        List<String> cols = primaryKeyColumns(logicalTableName);
        if (cols.isEmpty()) {
            return tableAlias + ".ctid::text";
        }
        return cols.stream()
                .map(c -> "COALESCE(" + tableAlias + "." + c + "::text, '')")
                .collect(Collectors.joining(" || '|' || "));
    }
}
