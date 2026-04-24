package kr.or.kids.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Data
@Configuration
public class FileUploadProperties {

  /** 공시·과제 공통 업로드 경로 (file.upload.base-path, CommonFileServiceImpl과 동일) */
  @Value("${file.upload.base-path:./uploads}")
  private String uploadPath;

  @Value("${file.upload.max-size:10485760}")
  private Long maxSize; // 기본값: 10MB

  @Value("${file.temp.path:temp}")
  private String tempPath; // PDF 등 임시 파일 경로 (상대 경로)
}
