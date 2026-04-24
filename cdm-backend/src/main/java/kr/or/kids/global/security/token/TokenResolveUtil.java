package kr.or.kids.global.security.token;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;

public final class TokenResolveUtil {

  private TokenResolveUtil() {
  }

  /**
   * 액세스 토큰을 요청에서 추출한다.
   * <p>
   * CWE-807(보안 결정에 대한 신뢰할 수 없는 입력 의존) 완화: {@code Authorization} Bearer 값과
   * {@code accessToken}/{@code token} 쿠키 값이 둘 다 있으면서 서로 다르면, 임의로 한쪽을 택하지 않고
   * {@code null}을 반환한다. 동일한 값이면 한 번만 사용한다.
   */
  public static String resolveAccessToken( HttpServletRequest request ) {
    String bearerToken = extractBearerToken( request );
    String cookieToken = extractCookieToken( request );

    if (bearerToken == null) {
      return cookieToken;
    }
    if (cookieToken == null) {
      return bearerToken;
    }
    if (bearerToken.equals( cookieToken )) {
      return bearerToken;
    }
    return null;
  }

  private static String extractBearerToken( HttpServletRequest request ) {
    String bearer = request.getHeader( "Authorization" );
    if (bearer == null || bearer.length() < 7 || !bearer.regionMatches( true, 0, "Bearer ", 0, 7 )) {
      return null;
    }
    String token = bearer.substring( 7 ).trim();
    return token.isEmpty() ? null : token;
  }

  /**
   * {@code accessToken} / {@code token} 쿠키에서 토큰을 읽는다. 서로 다른 값이 여러 개 있으면 {@code null}.
   */
  private static String extractCookieToken( HttpServletRequest request ) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return null;
    }
    String found = null;
    for (Cookie cookie : cookies) {
      if (!"accessToken".equals( cookie.getName() ) && !"token".equals( cookie.getName() )) {
        continue;
      }
      if (cookie.getValue() == null) {
        continue;
      }
      String value = cookie.getValue().trim();
      if (value.isEmpty()) {
        continue;
      }
      if (found == null) {
        found = value;
      } else if (!found.equals( value )) {
        return null;
      }
    }
    return found;
  }
}
