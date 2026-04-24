package kr.or.kids.domain.cm.upload.util;

public final class RuleTableNameUtils {

    private static final String CDM_PREFIX = "cdm_";
    
    public static final String TABLE_PREFIX = "tb_cm_i_tmpr_";

    
    public static final String VALIDATION_SCHEMA_DEFAULT = "kids_link_own";

    private RuleTableNameUtils() {}

    
    /**
     * 데이터를 변환한다.
     *
     * @param ruleTableName ruleTableName
     * @return 처리 결과
     */
    public static String toSlotKey(String ruleTableName) {
        if (ruleTableName == null || ruleTableName.isBlank()) {
            return ruleTableName;
        }
        String s = ruleTableName.trim();
        if (s.regionMatches(true, 0, CDM_PREFIX, 0, CDM_PREFIX.length())) {
            s = s.substring(CDM_PREFIX.length()).trim();
        }
        return s.toLowerCase();
    }

    
    /**
     * 데이터를 변환한다.
     *
     * @param ruleTableName ruleTableName
     * @return 처리 결과
     */
    public static String toPhysicalTableName(String ruleTableName) {
        if (ruleTableName == null || ruleTableName.isBlank()) {
            return ruleTableName;
        }
        String s = ruleTableName.trim();
        if (s.regionMatches(true, 0, CDM_PREFIX, 0, CDM_PREFIX.length())) {
            s = s.substring(CDM_PREFIX.length()).trim();
            return TABLE_PREFIX + s;
        }
        if (s.regionMatches(true, 0, TABLE_PREFIX, 0, TABLE_PREFIX.length())) {
            return s;
        }
        return TABLE_PREFIX + s;
    }

    
    /**
     * 데이터를 변환한다.
     *
     * @param schema schema
     * @param ruleTableName ruleTableName
     * @return 처리 결과
     */
    public static String toQualifiedValidationTableName(String schema, String ruleTableName) {
        if (ruleTableName == null || ruleTableName.isBlank()) {
            return ruleTableName;
        }
        String physical = toPhysicalTableName(ruleTableName);
        return (schema != null && !schema.isBlank()) ? schema + "." + physical : physical;
    }

    
    /**
     * ensureTmpTableName 처리를 수행한다.
     *
     * @param tableName tableName
     * @return 처리 결과
     */
    public static String ensureTmpTableName(String tableName) {
        if (tableName == null || tableName.isBlank()) return TABLE_PREFIX;
        String t = tableName.trim().toLowerCase();
        if (t.startsWith(TABLE_PREFIX)) return t;
        if (t.startsWith("tb_cm_i_")) t = t.substring(8);
        else if (t.startsWith("cdm_")) t = t.substring(4);
        return TABLE_PREFIX + t;
    }

    
    /**
     * shortTableName 처리를 수행한다.
     *
     * @param tableName tableName
     * @return 처리 결과
     */
    public static String shortTableName(String tableName) {
        if (tableName == null || tableName.isBlank()) return "tmp";
        String t = tableName.trim().toLowerCase();
        if (t.startsWith(TABLE_PREFIX)) return t.substring(TABLE_PREFIX.length());
        if (t.startsWith("tb_cm_i_")) return t.substring(8);
        if (t.startsWith("cdm_")) return t.substring(4);
        return t;
    }
}
