package kr.or.kids.domain.cm.upload.config;

import kr.or.kids.domain.cm.upload.util.VocabularyTableUtils;
import kr.or.kids.global.security.SqlIdentifierGuard;

/**
 * PlotMapper에서 사용하는 vocabulary 스키마·테이블 식별자(검증 완료).
 * <p>
 * XML에 MyBatis {@code ${}} 를 쓰지 않고, 인터셉터에서 {@link kr.or.kids.global.security.SqlIdentifierGuard#qualify}
 * 로 조립한 안전한 qualified 이름으로 치환한다.
 */
public final class PlotVocabularySql {

    private final String schema;
    private final String conceptTable;
    private final String conceptAncestorTable;

    private PlotVocabularySql(String schema, String conceptTable, String conceptAncestorTable) {
        this.schema = schema;
        this.conceptTable = conceptTable;
        this.conceptAncestorTable = conceptAncestorTable;
    }

    /**
     * 설정값으로부터 검증된 vocabulary SQL 식별자 묶음을 만든다.
     *
     * @param vocabularySchema 스키마명
     * @param vocabularyTablePrefix 테이블 접두사(없으면 빈 문자열)
     * @return 검증된 값
     */
    public static PlotVocabularySql create(String vocabularySchema, String vocabularyTablePrefix) {
        String schema = SqlIdentifierGuard.requireValidIdentifier(
                vocabularySchema != null ? vocabularySchema.trim() : "",
                "vocabulary schema");
        String prefix = vocabularyTablePrefix != null ? vocabularyTablePrefix.trim() : "";
        if (!prefix.isEmpty()) {
            SqlIdentifierGuard.requireValidIdentifier(prefix, "vocabulary table prefix");
        }
        String conceptPhysical = prefix + VocabularyTableUtils.TABLE_CONCEPT;
        String ancestorPhysical = prefix + VocabularyTableUtils.TABLE_CONCEPT_ANCESTOR;
        SqlIdentifierGuard.requireValidIdentifier(conceptPhysical, "vocabulary concept table");
        SqlIdentifierGuard.requireValidIdentifier(ancestorPhysical, "vocabulary concept_ancestor table");
        return new PlotVocabularySql(schema, conceptPhysical, ancestorPhysical);
    }

    public String schema() {
        return schema;
    }

    public String conceptTable() {
        return conceptTable;
    }

    public String conceptAncestorTable() {
        return conceptAncestorTable;
    }

    /** {@link SqlIdentifierGuard#qualify(String, String)} 로 조립한 concept 테이블 참조. */
    public String qualifiedConcept() {
        return SqlIdentifierGuard.qualify(schema, conceptTable);
    }

    /** {@link SqlIdentifierGuard#qualify(String, String)} 로 조립한 concept_ancestor 테이블 참조. */
    public String qualifiedConceptAncestor() {
        return SqlIdentifierGuard.qualify(schema, conceptAncestorTable);
    }
}
