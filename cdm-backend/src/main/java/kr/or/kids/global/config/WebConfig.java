package kr.or.kids.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import lombok.RequiredArgsConstructor;

/** Web MVC 설정 클래스 LocalDateTime 컨버터를 등록하여 쿼리 파라미터 바인딩 시 사용할 수 있도록 함 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

  private final LocalDateTimeConverter localDateTimeConverter;
  private final FileUploadProperties fileUploadProperties;

  @Override
  public void addFormatters( FormatterRegistry registry ) {
    registry.addConverter( localDateTimeConverter );
  }

  @Override
  public void addResourceHandlers( ResourceHandlerRegistry registry ) {
    String uploadPath = fileUploadProperties.getUploadPath();
    registry.addResourceHandler( "/uploads/**" ).addResourceLocations( "file:" + uploadPath + "/" );
  }

  @Bean
  public WebClient webClient() {
    return WebClient.builder().build();
  }
}
