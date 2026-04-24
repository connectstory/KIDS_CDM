package kr.or.kids.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "file")
public class FileProperties {

  /** 파일 저장 기본 경로 (file.storePath) */
  private String storePath;

  /** 파일 접근 URL prefix (file.url) */
  private String url;

  /** 업로드 관련 설정 (file.upload.*) */
  private Upload upload = new Upload();

  @Data
  public static class Upload {
    /** 업로드 경로 (file.upload.path) */
    private String path;
  }
}

