package kr.or.kids.domain.cm.common.utils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.web.util.HtmlUtils;

@Component
public class EmailContentGenerator {

  private static final Pattern PLACEHOLDER = Pattern.compile( "\\{([^{}]+)}" );

  private final ResourceLoader resourceLoader;
  private final String caExtUrl;

  private final ConcurrentHashMap<String, String> templateCache = new ConcurrentHashMap<>();

  public EmailContentGenerator(
      ResourceLoader resourceLoader,
      @Value( "${ca.ext-url:}" ) String caExtUrl
  ) {
    this.resourceLoader = resourceLoader;
    this.caExtUrl = caExtUrl != null ? caExtUrl.trim() : "";
  }

  /**
   * Render template from classpath resource path (e.g. {@code mail/research/partner-invite.html}).
   * Placeholders are resolved by key: {@code {key}} -> value from {@code vars}.
   * Missing keys are replaced with empty string, and values are HTML-escaped.
   */
  public String render( String templatePath, Map<String, ?> vars ) {
    if (templatePath == null || templatePath.isBlank()) {
      throw new IllegalArgumentException( "templatePath is required" );
    }

    Map<String, ?> safeVars = vars != null ? vars : Collections.emptyMap();
    String template = loadTemplateCached( templatePath.trim() );

    Matcher matcher = PLACEHOLDER.matcher( template );
    StringBuffer out = new StringBuffer();
    while (matcher.find()) {
      String key = matcher.group( 1 );
      Object value = key != null ? safeVars.get( key ) : null;
      String raw = value != null ? String.valueOf( value ) : "";
      String escaped = HtmlUtils.htmlEscape( raw == null ? "" : raw );
      matcher.appendReplacement( out, Matcher.quoteReplacement( escaped ) );
    }
    matcher.appendTail( out );
    return out.toString();
  }

  /**
   * Convenience vars for common template values (logo/login URL).
   */
  public Map<String, String> commonVars() {
    String base = caExtUrl;
    String logoUrl = base.isBlank() ? "" : base + "/img/logo.png";
    String loginUrl = base.isBlank() ? "" : base + "/pp/ko/auth/Login";

    return Map.of(
        "logoUrl", logoUrl,
        "buttonUrl", loginUrl,
        "buttonText", "로그인 바로가기"
    );
  }

  private String loadTemplateCached( String templatePath ) {
    return templateCache.computeIfAbsent( templatePath, this::loadTemplate );
  }

  private String loadTemplate( String templatePath ) {
    String location = templatePath.startsWith( "classpath:" ) ? templatePath : "classpath:" + templatePath;
    Resource resource = resourceLoader.getResource( location );
    if (!resource.exists()) {
      throw new IllegalArgumentException( "Template not found: " + templatePath );
    }
    try (InputStream in = resource.getInputStream()) {
      return StreamUtils.copyToString( in, StandardCharsets.UTF_8 );
    } catch (IOException e) {
      throw new IllegalStateException( "Failed to read template: " + templatePath, e );
    }
  }
}