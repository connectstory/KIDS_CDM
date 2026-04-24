package kr.or.kids.global.security.token;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import kr.or.kids.global.config.JwtAuthProvier;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty( name = "jwt.verify-mode", havingValue = "local", matchIfMissing = true )
public class LocalJwtTokenVerifier implements TokenVerifier {

  private final JwtAuthProvier jwtAuthProvier;

  @Override
  public TokenVerificationResult verify( String token ) {
    if (token == null || token.isBlank()) {
      return TokenVerificationResult.fail( "Access token required" );
    }

    if (jwtAuthProvier.validateToken( token ) != 0) {
      return TokenVerificationResult.fail( "Invalid or expired token" );
    }

    Claims claims = jwtAuthProvier.getClaims( token );
    return TokenVerificationResult.ok( claims );
  }
}

