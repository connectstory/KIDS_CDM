package kr.or.kids.domain.cm.upload.util;

import java.io.InterruptedIOException;
import java.util.Objects;

/**
 * 비치명(non-fatal) 경로에서 예외를 로그 없이 처리할 때 사용한다.
 * {@link InterruptedException} / {@link InterruptedIOException} 는 인터럽트 상태를 복원한다.
 */
public final class UploadNonFatal {

    private UploadNonFatal() {
    }

    /**
     * 예외를 삼키지 않고(빈 catch 금지) 처리 사실만 남긴다. 로그는 출력하지 않는다.
     */
    public static void discard( Throwable throwable ) {
        Objects.requireNonNull( throwable, "throwable" );
        for ( Throwable t = throwable; t != null; t = t.getCause() ) {
            if ( t instanceof InterruptedException ) {
                Thread.currentThread().interrupt();
                return;
            }
            if ( t instanceof InterruptedIOException ) {
                Thread.currentThread().interrupt();
                return;
            }
        }
    }

    /**
     * 숫자 문자열을 Long 으로 변환한다. 실패 시 null.
     */
    public static Long tryParseLong( String s ) {
        if ( s == null ) {
            return null;
        }
        String t = s.trim();
        if ( t.isEmpty() ) {
            return null;
        }
        try {
            return Long.parseLong( t );
        } catch ( NumberFormatException ex ) {
            return null;
        }
    }

    /**
     * 숫자 문자열을 Integer 로 변환한다. 실패 시 null.
     */
    public static Integer tryParseInt( String s ) {
        if ( s == null ) {
            return null;
        }
        String t = s.trim();
        if ( t.isEmpty() ) {
            return null;
        }
        try {
            return Integer.parseInt( t );
        } catch ( NumberFormatException ex ) {
            return null;
        }
    }
}
