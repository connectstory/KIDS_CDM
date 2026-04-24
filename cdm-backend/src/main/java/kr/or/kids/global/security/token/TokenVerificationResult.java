package kr.or.kids.global.security.token;

import java.util.Collections;
import java.util.Map;

import lombok.Getter;

@Getter
public class TokenVerificationResult {
  private final boolean valid;
  private final Map<String, Object> claims;
  private final String errorMessage;

  private TokenVerificationResult( boolean valid, Map<String, Object> claims, String errorMessage ) {
    this.valid = valid;
    this.claims = claims == null ? Collections.emptyMap() : Collections.unmodifiableMap( claims );
    this.errorMessage = errorMessage;
  }

  public static TokenVerificationResult ok( Map<String, Object> claims ) {
    return new TokenVerificationResult( true, claims, null );
  }

  public static TokenVerificationResult fail( String errorMessage ) {
    return new TokenVerificationResult( false, null, errorMessage );
  }
}

