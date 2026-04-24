package kr.or.kids.global.config;

import java.security.Key;
import java.util.Base64;

import javax.annotation.PostConstruct;
import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtAuthProvier {

  @Value( "${jwt.secret-key}" )
  private String secretKey;
  private Key key;

  @PostConstruct
  protected void init() {
    byte[] keyBytes = Base64.getDecoder().decode( secretKey );
    key = Keys.hmacShaKeyFor( keyBytes );
  }

  public int validateToken( String token ) {
    try {
      Jwts.parserBuilder().setSigningKey( (SecretKey) key ).build().parseClaimsJws( token );
      return 0;
    } catch ( ExpiredJwtException e ) {
      log.warn( "JWT token is expired" );
      return -1;
    } catch ( UnsupportedJwtException e ) {
      log.warn( "JWT token is unsupported" );
      return -1;
    } catch ( MalformedJwtException e ) {
      log.warn( "JWT token is malformed" );
      return -1;
    } catch ( SignatureException e ) {
      log.warn( "JWT signature does not match" );
      return -1;
    } catch ( IllegalArgumentException e ) {
      log.warn( "JWT token is invalid" );
      return -1;
    }
  }

  public Claims getClaims( String token ) {
    return Jwts.parserBuilder().setSigningKey( (SecretKey) key ).build().parseClaimsJws( token ).getBody();
  }
}

