package kr.or.kids.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "watermark")
public class WatermarkProperties {

  /** 워터마크 기능 활성화 여부 */
  private boolean enabled = true;

  /** 워터마크 텍스트 */
  private String text = "한국의약품안전원";

  /** 0.0 ~ 1.0 */
  private float alpha = 0.1f;

  /** 기본 폰트 크기(px) */
  private int fontSize = 48;

  /** 회전 각도 */
  private int rotateDegrees = -30;

  /** true면 타일 반복, false면 중앙 1회 */
  private boolean tiled = true;

  /** 타일 간격(px) */
  private int tileGap = 180;
}
