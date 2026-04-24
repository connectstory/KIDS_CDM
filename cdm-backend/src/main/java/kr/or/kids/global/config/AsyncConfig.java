package kr.or.kids.global.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * 비동기 작업용 Executor (분석 데이터셋 복사 등).
 */
@Configuration
public class AsyncConfig {

  @Bean(name = "analysisDatasetCopyExecutor")
  public Executor analysisDatasetCopyExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize( 1 );
    executor.setMaxPoolSize( 2 );
    executor.setQueueCapacity( 10 );
    executor.setThreadNamePrefix( "analysis-dataset-copy-" );
    executor.initialize();
    return executor;
  }
}
