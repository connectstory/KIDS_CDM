package kr.or.kids.domain.cm.common.service;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.awt.image.ImagingOpException;
import java.awt.image.RasterFormatException;
import java.io.IOException;

import javax.imageio.ImageIO;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import kr.or.kids.global.config.WatermarkProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class WatermarkService {

  private static final String WATERMARK_TEMPLATE_PATH = "templates/wartermark.png";
  private final WatermarkProperties watermarkProperties;

  /**
   * 설정값(watermark.*) 기준으로 워터마크 적용. 실패해도 원본(src)을 그대로 반환하도록 설계.
   */
  public BufferedImage apply( BufferedImage src ) {
    try {
      if (src == null)
        return null;
      if (src.getWidth() <= 0 || src.getHeight() <= 0) {
        log.warn( "Skipping watermark: invalid image dimensions {}x{}", src.getWidth(), src.getHeight() );
        return src;
      }
      if (!watermarkProperties.isEnabled())
        return src;
      BufferedImage template = loadTemplateImage();
      if (template != null) {
        return applyImageWatermark( src, template, watermarkProperties );
      }

      String text = watermarkProperties.getText();
      if (text == null || text.isBlank())
        return src;
      return applyTextWatermark( src, text.trim(), watermarkProperties );
    } catch (IllegalArgumentException | IllegalStateException | RasterFormatException | ImagingOpException
        | IndexOutOfBoundsException | ArithmeticException e) {
      log.warn( "Failed to apply watermark. Returning original image.", e );
      return src;
    }
  }

  private BufferedImage loadTemplateImage() {
    Resource resource = new ClassPathResource( WATERMARK_TEMPLATE_PATH );
    if (!resource.exists()) {
      log.warn( "Watermark template not found: {}", WATERMARK_TEMPLATE_PATH );
      return null;
    }

    try {
      BufferedImage img = ImageIO.read( resource.getInputStream() );
      if (img == null || img.getWidth() <= 0 || img.getHeight() <= 0) {
        log.warn( "Watermark template unreadable or empty dimensions: {}", WATERMARK_TEMPLATE_PATH );
        return null;
      }
      return img;
    } catch (IOException e) {
      log.warn( "Failed to load watermark template: {}", WATERMARK_TEMPLATE_PATH, e );
      return null;
    }
  }

  private BufferedImage applyImageWatermark( BufferedImage src, BufferedImage template, WatermarkProperties opts ) {
    if (template == null || template.getWidth() <= 0 || template.getHeight() <= 0) {
      return src;
    }
    int w = src.getWidth();
    int h = src.getHeight();

    BufferedImage out = new BufferedImage( w, h, BufferedImage.TYPE_INT_ARGB );
    Graphics2D g = out.createGraphics();
    try {
      g.setRenderingHint( RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON );
      g.setRenderingHint( RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR );
      g.setRenderingHint( RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY );

      g.drawImage( src, 0, 0, null );
      g.setComposite( AlphaComposite.getInstance( AlphaComposite.SRC_OVER, clamp01( opts.getAlpha() ) ) );

      int markW = Math.max( 80, Math.min( template.getWidth(), Math.max( 1, w / 3 ) ) );
      int markH = Math.max( 80, (int) (((double) markW / template.getWidth()) * template.getHeight()) );
      int gap = Math.max( 1, opts.getTileGap() );
      int stepX = Math.max( markW + 40, gap );
      int stepY = Math.max( markH + 40, gap );

      AffineTransform originalTx = g.getTransform();
      g.translate( w / 2.0, h / 2.0 );
      // 이미지 템플릿은 원본 각도(파일에 포함된 방향) 그대로 적용한다.
      // 회전 로직 제거로 인해 "이미지 각도 수정" 이슈를 방지한다.

      if (opts.isTiled()) {
        for (int y = -h; y <= h; y += stepY) {
          for (int x = -w; x <= w; x += stepX) {
            g.drawImage( template, x - (markW / 2), y - (markH / 2), markW, markH, null );
          }
        }
      } else {
        g.drawImage( template, -(markW / 2), -(markH / 2), markW, markH, null );
      }

      g.setTransform( originalTx );
      return out;
    } finally {
      g.dispose();
    }
  }

  private BufferedImage applyTextWatermark( BufferedImage src, String text, WatermarkProperties opts ) {
    if (text == null || text.isEmpty()) {
      return src;
    }
    int w = src.getWidth();
    int h = src.getHeight();
    if (w <= 0 || h <= 0) {
      return src;
    }

    // ARGB로 복사본 생성 (원본 불변)
    BufferedImage out = new BufferedImage( w, h, BufferedImage.TYPE_INT_ARGB );
    Graphics2D g = out.createGraphics();
    try {
      g.setRenderingHint( RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON );
      g.setRenderingHint( RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON );
      g.setRenderingHint( RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY );

      // 원본 이미지
      g.drawImage( src, 0, 0, null );

      float alpha = clamp01( opts.getAlpha() );
      g.setComposite( AlphaComposite.getInstance( AlphaComposite.SRC_OVER, alpha ) );

      int fontSize = Math.max( 12, opts.getFontSize() );
      // 너무 작은 이미지면 과도한 폰트 방지
      fontSize = Math.min( fontSize, Math.max( 12, Math.min( w, h ) ) );

      Font font = new Font( "SansSerif", Font.BOLD, fontSize );
      g.setFont( font );

      FontMetrics fm = g.getFontMetrics();
      int textWidth = fm.stringWidth( text );
      int ascent = fm.getAscent();

      // 회전/배치 기준점을 이미지 중앙으로
      AffineTransform originalTx = g.getTransform();
      g.translate( w / 2.0, h / 2.0 );
      g.rotate( Math.toRadians( opts.getRotateDegrees() ) );

      if (opts.isTiled()) {
        int gap = Math.max( 80, Math.max( 1, opts.getTileGap() ) );
        // 텍스트가 gap보다 크면 최소 간격을 텍스트 기준으로 확장
        gap = Math.max( gap, textWidth + 40 );

        for (int y = -h; y <= h; y += gap) {
          for (int x = -w; x <= w; x += gap) {
            drawTextWithShadowCentered( g, text, x, y, textWidth, ascent );
          }
        }
      } else {
        drawTextWithShadowCentered( g, text, 0, 0, textWidth, ascent );
      }

      g.setTransform( originalTx );
      return out;
    } finally {
      g.dispose();
    }
  }

  private void drawTextWithShadowCentered( Graphics2D g, String text, int cx, int cy, int textWidth, int ascent ) {
    if (g == null || text == null || text.isEmpty()) {
      return;
    }
    // baseline 기준 보정
    int x = cx - (textWidth / 2);
    int y = cy + (ascent / 2);

    // shadow
    g.setColor( new Color( 0, 0, 0, 200 ) );
    g.drawString( text, x + 2, y + 2 );

    // main
    g.setColor( new Color( 255, 255, 255, 230 ) );
    g.drawString( text, x, y );
  }

  private float clamp01( float v ) {
    if (Float.isNaN( v )) {
      return 0f;
    }
    if (Float.isInfinite( v )) {
      return v > 0f ? 1f : 0f;
    }
    if (v < 0f) {
      return 0f;
    }
    if (v > 1f) {
      return 1f;
    }
    return v;
  }
}
