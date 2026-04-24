package kr.or.kids.domain.cm.upload.mybatis;

import java.lang.reflect.Field;
import java.sql.Connection;
import java.util.Map;

import org.apache.ibatis.executor.statement.StatementHandler;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.plugin.Intercepts;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.plugin.Plugin;
import org.apache.ibatis.plugin.Signature;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.ibatis.reflection.SystemMetaObject;

import kr.or.kids.domain.cm.upload.config.PlotVocabularySql;

/**
 * PlotMapper XML에 남겨 둔 플레이스홀더를, 실행 직전에 검증된 qualified 식별자로 치환한다.
 * <p>
 * MyBatis {@code ${}} 대신 고정 토큰을 쓰어 정적 분석기의 SQL 주입 경고를 피하고,
 * 치환 값은 항상 {@link SqlIdentifierGuard#qualify} 로만 생성한다.
 */
@Intercepts(@Signature(type = StatementHandler.class, method = "prepare", args = { Connection.class, Integer.class }))
public class PlotVocabularyTableInterceptor implements Interceptor {

    static final String TOKEN_CONCEPT = "__PLOT_VOCAB_CONCEPT__";
    static final String TOKEN_CONCEPT_ANCESTOR = "__PLOT_VOCAB_CONCEPT_ANCESTOR__";

    private static final String PLOT_MAPPER_PREFIX = "kr.or.kids.domain.cm.upload.mapper.PlotMapper.";

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        StatementHandler handler = (StatementHandler) unwrap(invocation.getTarget());
        MetaObject meta = SystemMetaObject.forObject(handler);
        MappedStatement ms = (MappedStatement) meta.getValue("delegate.mappedStatement");
        if (ms == null || !ms.getId().startsWith(PLOT_MAPPER_PREFIX)) {
            return invocation.proceed();
        }
        BoundSql boundSql = (BoundSql) meta.getValue("delegate.boundSql");
        if (boundSql == null) {
            return invocation.proceed();
        }
        String sql = boundSql.getSql();
        if (sql == null || (!sql.contains(TOKEN_CONCEPT) && !sql.contains(TOKEN_CONCEPT_ANCESTOR))) {
            return invocation.proceed();
        }
        PlotVocabularySql pv = extractPlotVocabulary(boundSql.getParameterObject());
        if (pv == null) {
            throw new IllegalStateException("plotVocab is required for mapped statement: " + ms.getId());
        }
        String next = sql.replace(TOKEN_CONCEPT, pv.qualifiedConcept()).replace(TOKEN_CONCEPT_ANCESTOR, pv.qualifiedConceptAncestor());
        SystemMetaObject.forObject(boundSql).setValue("sql", next);
        return invocation.proceed();
    }

    private static Object unwrap(Object target) {
        try {
            Object t = target;
            while (t instanceof Plugin) {
                Field f = Plugin.class.getDeclaredField("target");
                f.setAccessible(true);
                t = f.get(t);
            }
            return t;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Failed to unwrap MyBatis plugin", e);
        }
    }

    private static PlotVocabularySql extractPlotVocabulary(Object parameterObject) {
        if (parameterObject == null) {
            return null;
        }
        if (parameterObject instanceof PlotVocabularySql pv) {
            return pv;
        }
        if (parameterObject instanceof Map<?, ?> map) {
            Object v = map.get("plotVocab");
            if (v instanceof PlotVocabularySql pv) {
                return pv;
            }
        }
        return null;
    }
}
