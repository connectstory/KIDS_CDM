package kr.or.kids.global.config;

import javax.sql.DataSource;

import org.apache.ibatis.session.LocalCacheScope;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.type.JdbcType;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import kr.or.kids.domain.cm.upload.mybatis.PlotVocabularyTableInterceptor;

@Configuration
public class MyBatisConfig {

    @Bean(name = "sqlSession")
    public SqlSessionFactory sqlSessionFactory( DataSource dataSource ) throws Exception {
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
        sessionFactory.setDataSource( dataSource );
        sessionFactory.setMapperLocations( new PathMatchingResourcePatternResolver().getResources( "classpath*:mapper/**/*.xml" ) );
        sessionFactory.setTypeAliasesPackage( "kr.or.kids" );

        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setLogImpl( org.apache.ibatis.logging.stdout.StdOutImpl.class );
        // application-*.yml 의 mybatis.configuration 은 커스텀 SqlSessionFactory 사용 시 적용되지 않으므로 여기서 동일하게 맞춤
        configuration.setMapUnderscoreToCamelCase( true );
        configuration.setJdbcTypeForNull( JdbcType.NULL );
        configuration.setLocalCacheScope( LocalCacheScope.SESSION );
        configuration.addInterceptor( new PlotVocabularyTableInterceptor() );
        sessionFactory.setConfiguration( configuration );

        return sessionFactory.getObject();
    }
}
