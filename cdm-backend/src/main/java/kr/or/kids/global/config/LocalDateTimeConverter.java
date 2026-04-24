package kr.or.kids.global.config;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * ISO 8601 형식의 날짜 문자열(타임존 포함)을 LocalDateTime으로 변환하는 컨버터 예: "2026-02-10T14:59:59.999Z" -> LocalDateTime
 */
@Component
public class LocalDateTimeConverter implements Converter<String, LocalDateTime> {

  private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;

  @Override
  public LocalDateTime convert( String source ) {
    if (source == null || source.trim().isEmpty()) {
      return null;
    }

    String trimmed = source.trim();

    // Check if the string has timezone
    boolean hasTimezone = trimmed.endsWith( "Z" ) || trimmed.matches( ".*[+-]\\d{2}:?\\d{2}$" ) // Matches +09:00, -05:00, +0900, etc.
        || trimmed.matches( ".*[+-]\\d{4}$" ); // Matches +0900, -0500

    if (hasTimezone) {
      // Parse as Instant first (handles timezone), then convert to LocalDateTime
      try {
        Instant instant = Instant.parse( trimmed );
        return LocalDateTime.ofInstant( instant, ZoneId.systemDefault() );
      } catch (DateTimeParseException e) {
        throw new IllegalArgumentException( "Failed to parse " + trimmed + ". Expected ISO 8601 format (e.g., 2026-02-10T14:59:59.999Z)", e );
      }
    } else {
      // Try parsing as LocalDateTime directly (without timezone)
      try {
        return LocalDateTime.parse( trimmed, ISO_FORMATTER );
      } catch (DateTimeParseException e) {
        // Fallback: try parsing as Instant (might work for some edge cases)
        try {
          Instant instant = Instant.parse( trimmed );
          return LocalDateTime.ofInstant( instant, ZoneId.systemDefault() );
        } catch (DateTimeParseException e2) {
          throw new IllegalArgumentException( "Failed to parse " + trimmed + ". Supported formats: ISO 8601 (e.g., 2026-02-10T14:59:59.999Z or 2026-02-10T14:59:59)", e2 );
        }
      }
    }
  }
}
