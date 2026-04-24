package kr.or.kids.global.security;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import kr.or.kids.global.security.token.TokenVerifier;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // ✅ @PreAuthorize("hasAuthority('권한코드')") 사용 가능
@RequiredArgsConstructor
public class SecurityConfig {

  private final Environment environment;
  private final TokenVerifier tokenVerifier;

  @Value("${jwt.remote.pp-session-check-url:${jwt.remote.session-check-url:http://localhost:3000/api/pp/adminSessionCheck}}")
  private String ppSessionCheckUrl;

  @Value("${jwt.remote.ca-is-logged-in-url:http://localhost:3000/api/ca/auth/isLoggedIn}")
  private String caIsLoggedInUrl;

  @Bean
  public BCryptPasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain filterChain( org.springframework.security.config.annotation.web.builders.HttpSecurity http ) throws Exception {
    http.csrf( csrf -> csrf.disable() ).cors( cors -> cors.configurationSource( corsConfigurationSource() ) ).sessionManagement( session -> session.sessionCreationPolicy( SessionCreationPolicy.STATELESS ) ).authorizeRequests( auth -> auth.antMatchers( "/", "/auth/**", "/community/**",
        "/swagger-ui/**", "/v3/api-docs/**", "/mock/**", "/common/file/download/**", "/common/template/**", "/common/file/preview/**", "/pp/ko/cdm/**", "/actuator/**", "/actuator/health", "/actuator/health/**" ).permitAll().anyRequest().authenticated() );

    http.addFilterBefore( new JwtAuthenticationFilter( tokenVerifier, ppSessionCheckUrl, caIsLoggedInUrl, environment ), UsernamePasswordAuthenticationFilter.class );

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();

    boolean isLocal = environment.acceptsProfiles( Profiles.of( "local" ) );

    if (isLocal) {
      // local 프로파일: 전체 Origin 허용 (withCredentials 사용 시 setAllowedOriginPatterns 필수)
      config.setAllowedOriginPatterns( List.of( "*" ) );
    } else {
      // dev / prod: 지정 Origin만 허용
      config.setAllowedOrigins( List.of( "https://drugsafe.or.kr", "https://drugsafe.or.kr", "http://stg.drugsafe.or.kr", "http://stg.drugsafe.or.kr:30004", "https://dev-adm.drugsafe.or.kr", "https://dev-adm.drugsafe.or.kr:30004", "http://localhost:5173", "http://192.168.2.148:30030",
          "http://192.168.2.149:30030", "http://192.168.2.148:30033", "http://192.168.2.149:30033", "http://192.168.2.148:30031", "http://192.168.2.149:30031", "https://drugsafe.or.kr", "https://adm.drugsafe.or.kr", "https://adm.drugsafe.or.kr:30004" ) );
    }

    config.setAllowCredentials( true ); // ✅ 세션 쿠키(JSESSIONID) 허용
    config.setAllowedMethods( List.of( "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS" ) );
    config.setAllowedHeaders( List.of( "*" ) );
    config.setExposedHeaders( List.of( "Authorization", "Set-Cookie" ) );

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration( "/**", config );
    return source;
  }
}
