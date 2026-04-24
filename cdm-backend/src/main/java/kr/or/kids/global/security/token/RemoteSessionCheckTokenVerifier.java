package kr.or.kids.global.security.token;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import lombok.RequiredArgsConstructor;

/**
 * 토큰 검증을 외부(sessionCheck/isLoggedIn) API에 위임하는 방식.
 *
 * 기본값은 PP(adminSessionCheck)이며, 엔드포인트는 설정으로 교체 가능.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "jwt.verify-mode", havingValue = "remote")
public class RemoteSessionCheckTokenVerifier implements TokenVerifier {

  private final RestTemplate restTemplate;

  @Value("${jwt.remote.session-check-url:http://localhost:3000/api/pp/adminSessionCheck}")
  private String sessionCheckUrl;

  @Override
  public TokenVerificationResult verify( String token ) {
    // backward-compatible default: PP adminSessionCheck
    return verifyWithUrl( token, sessionCheckUrl, true, HttpMethod.GET );
  }

  /**
   * 원격 세션체크 호출 URL을 호출 시점에 결정할 수 있도록 확장 메서드 제공.
   *
   * @param token access token
   * @param url 원격 검증 URL
   * @param requireXRequestedWith true면 X-Requested-With: XMLHttpRequest 헤더를 강제(주로 PP)
   */
  public TokenVerificationResult verifyWithUrl( String token, String url, boolean requireXRequestedWith, HttpMethod method ) {
    if (token == null || token.isBlank()) {
      return TokenVerificationResult.fail( "Access token required" );
    }

    try {
      HttpHeaders headers = new HttpHeaders();
      headers.set( HttpHeaders.AUTHORIZATION, "Bearer " + token );
      if (requireXRequestedWith) {
        headers.set( "X-Requested-With", "XMLHttpRequest" );
      }

      @SuppressWarnings("unchecked")
      ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.exchange( url, method, new HttpEntity<>( headers ), Map.class );
      if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
        return TokenVerificationResult.fail( "Invalid or expired token" );
      }

      Map<?, ?> body = response.getBody();
      if (requireXRequestedWith) {
        // PP 기대 응답(예): { result: "success", data: { empNo, empNm, ... } }
        // 운영 환경별로 응답 포맷이 다를 수 있어 result/code/success를 모두 허용
        Object result = body.get( "result" );
        Object code = body.get( "code" );
        Object success = body.get( "success" );

        boolean ok = (result != null && "success".equalsIgnoreCase( String.valueOf( result ) )) || (code != null && "0".equals( String.valueOf( code ) )) || (success != null && "true".equalsIgnoreCase( String.valueOf( success ) ));

        if (!ok) {
          return TokenVerificationResult.fail( "Invalid or expired token" );
        }

        Object data = body.get( "data" );
        if (data instanceof Map<?, ?>) {
          Map<?, ?> raw = (Map<?, ?>) data;

          // data가 2단 구조(userInfo 등)인 경우도 대비
          Object userInfo = raw.get( "userInfo" );
          if (userInfo instanceof Map<?, ?>) {
            raw = (Map<?, ?>) userInfo;
          }

          return TokenVerificationResult.ok( raw.entrySet().stream().collect( java.util.stream.Collectors.toMap( e -> String.valueOf( e.getKey() ), Map.Entry::getValue ) ) );
        }

        return TokenVerificationResult.ok( Map.of() );
      }

      // CA 기대 응답(예): { code: "0", msg: "...", data: { userInfo: {...}, mbrId: "...", ... } }
      Object code = body.get( "code" );
      if (code == null || !"0".equals( String.valueOf( code ) )) {
        return TokenVerificationResult.fail( "Invalid or expired token" );
      }

      Object data = body.get( "data" );
      if (data instanceof Map<?, ?>) {
        Map<?, ?> dataMap = (Map<?, ?>) data;

        Object userInfo = dataMap.get( "userInfo" );
        Map<?, ?> userInfoMap = userInfo instanceof Map<?, ?> ? (Map<?, ?>) userInfo : null;

        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        Object mbrId = dataMap.get( "mbrId" );
        if (mbrId == null && userInfoMap != null) {
          mbrId = userInfoMap.get( "mbrId" );
        }
        if (mbrId != null) {
          claims.put( "mbrId", mbrId );
        }

        Object mbrNo = dataMap.get( "mbrNo" );
        if (mbrNo == null && userInfoMap != null) {
          mbrNo = userInfoMap.get( "mbrNo" );
        }
        if (mbrNo != null) {
          claims.put( "mbrNo", mbrNo );
        }

        // CA 응답 키명은 "sessLogSn", PP와의 호환을 위해 "sessionLogSn"도 함께 확인
        Object sessionLogSn = dataMap.get( "sessLogSn" );
        if (sessionLogSn == null) {
          sessionLogSn = dataMap.get( "sessionLogSn" );
        }
        if (sessionLogSn != null) {
          claims.put( "sessionLogSn", String.valueOf( sessionLogSn ) );
        }

        if (userInfoMap != null) {
          Object userNm = userInfoMap.get( "encptMbrFlnm" );
          if (userNm != null) {
            claims.put( "userNm", userNm );
          }
          Object mbrTypeCd = userInfoMap.get( "mbrTypeCd" );
          if (mbrTypeCd != null) {
            claims.put( "mbrTypeCd", mbrTypeCd );
          }
        }

        return TokenVerificationResult.ok( claims );
      }

      return TokenVerificationResult.ok( Map.of() );
    } catch (RestClientException e) {
      return TokenVerificationResult.fail( "Remote token verification failed" );
    }
  }
}
