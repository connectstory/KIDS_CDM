package kr.or.kids.global.security.token;

public interface TokenVerifier {
  TokenVerificationResult verify( String token );
}

