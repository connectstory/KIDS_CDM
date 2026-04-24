package kr.or.kids.domain.cm.upload.util;

import kr.or.kids.global.security.SqlIdentifierGuard;

public final class VocabularyTableUtils {

    private VocabularyTableUtils() {}

    
    public static final String TABLE_CONCEPT = "concept";
    public static final String TABLE_CONCEPT_ANCESTOR = "concept_ancestor";

    
    /**
     * 데이터를 변환한다.
     *
     * @param schema schema
     * @param tablePrefix tablePrefix
     * @param baseTableName baseTableName
     * @return 처리 결과
     */
    public static String toQualifiedTableName(String schema, String tablePrefix, String baseTableName) {
        if (baseTableName == null || baseTableName.isBlank()) {
            return baseTableName;
        }
        String prefix = (tablePrefix != null && !tablePrefix.isBlank()) ? tablePrefix.trim() : "";
        if (!prefix.isEmpty()) {
            SqlIdentifierGuard.requireValidIdentifier(prefix, "vocabulary table prefix");
        }
        String physical = prefix + baseTableName.trim();
        SqlIdentifierGuard.requireValidIdentifier(physical, "vocabulary table");
        if (schema != null && !schema.isBlank()) {
            String s = schema.trim();
            SqlIdentifierGuard.requireValidIdentifier(s, "vocabulary schema");
            // JDBC/기존 코드 호환: 점으로만 구분(따옴표 없음). 식별자는 위에서 검증됨.
            return s + "." + physical;
        }
        return physical;
    }

    
    /**
     * qualifiedConceptTable 처리를 수행한다.
     *
     * @param schema schema
     * @param tablePrefix tablePrefix
     * @return 처리 결과
     */
    public static String qualifiedConceptTable(String schema, String tablePrefix) {
        return toQualifiedTableName(schema, tablePrefix, TABLE_CONCEPT);
    }

    
    /**
     * qualifiedConceptAncestorTable 처리를 수행한다.
     *
     * @param schema schema
     * @param tablePrefix tablePrefix
     * @return 처리 결과
     */
    public static String qualifiedConceptAncestorTable(String schema, String tablePrefix) {
        return toQualifiedTableName(schema, tablePrefix, TABLE_CONCEPT_ANCESTOR);
    }
}
