package kr.or.kids.domain.cm.common.utils;

import java.sql.Timestamp;
import java.time.LocalDateTime;

public final class LocalDateTimeUtils {

  private LocalDateTimeUtils() {
  }

  /**
   * DB 매퍼가 내려주는 값 타입을 LocalDateTime으로 통일한다.
   * - null: null 반환
   * - LocalDateTime: 그대로 반환
   * - Timestamp: toLocalDateTime() 반환
   * 그 외 타입: 예외(모호한 변환 방지)
   */
  public static LocalDateTime toLocalDateTime( Object value ) {
    if (value == null) {
      return null;
    }
    if (value instanceof LocalDateTime ldt) {
      return ldt;
    }
    if (value instanceof Timestamp ts) {
      return ts.toLocalDateTime();
    }
    throw new IllegalArgumentException( "Cannot convert " + value.getClass() + " to LocalDateTime" );
  }
}

