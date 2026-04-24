package kr.or.kids.domain.cm.upload.config;

import kr.or.kids.domain.cm.upload.util.VocabularyTableUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 업로드 관련 설정을 구성한다.
 */
@Component
public class VocabularyConfig {

    @Value("${app.schema:kids_link_own}")
    private String appSchema;

    @Value("${app.vocabulary-schema:}")
    private String vocabularySchemaConfig;

    @Value("${app.vocabulary-table-prefix:}")
    private String vocabularyTablePrefixConfig;

    
    /**
     * 조회 결과를 반환한다.
     *
     * @return 처리 결과
     */
    public String getVocabularySchema() {
        if (vocabularySchemaConfig != null && !vocabularySchemaConfig.isBlank()) {
            return vocabularySchemaConfig.trim();
        }
        return appSchema;
    }

    
    /**
     * 조회 결과를 반환한다.
     *
     * @return 처리 결과
     */
    public String getVocabularyTablePrefix() {
        return vocabularyTablePrefixConfig != null ? vocabularyTablePrefixConfig.trim() : "";
    }

    
    /**
     * 조회 결과를 반환한다.
     *
     * @return 처리 결과
     */
    public String getQualifiedConceptTable() {
        return VocabularyTableUtils.qualifiedConceptTable(getVocabularySchema(), getVocabularyTablePrefix());
    }

    
    /**
     * 조회 결과를 반환한다.
     *
     * @return 처리 결과
     */
    public String getQualifiedConceptAncestorTable() {
        return VocabularyTableUtils.qualifiedConceptAncestorTable(getVocabularySchema(), getVocabularyTablePrefix());
    }

    /**
     * PlotMapper 전용: 스키마·테이블 식별자를 검증한 값.
     *
     * @return 검증된 vocabulary SQL 식별자
     */
    public PlotVocabularySql plotVocabularySql() {
        return PlotVocabularySql.create(getVocabularySchema(), getVocabularyTablePrefix());
    }
}
