package kr.or.kids.global.security;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import kr.or.kids.global.common.AuthConstants;
import kr.or.kids.global.common.CustomUserDetails;
import kr.or.kids.global.security.token.RemoteSessionCheckTokenVerifier;
import kr.or.kids.global.security.token.TokenResolveUtil;
import kr.or.kids.global.security.token.TokenVerificationResult;
import kr.or.kids.global.security.token.TokenVerifier;
import kr.or.kids.global.type.RoleType;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final String COMMON_TEMPLATE_PATH = "/common/template/";

  private final TokenVerifier tokenVerifier;
  private final String ppSessionCheckUrl;
  private final String caIsLoggedInUrl;
  private final Environment environment;

  /** 공개 정적 양식 파일: 원격 세션 검증 생략(응답 지연 방지) */
  @Override
  protected boolean shouldNotFilter( HttpServletRequest request ) {
    return request.getRequestURI().contains( COMMON_TEMPLATE_PATH );
  }

  @Override
  protected void doFilterInternal( HttpServletRequest request, HttpServletResponse response, FilterChain filterChain ) throws ServletException, IOException {

    // 이미 인증된 경우는 스킵
    if (SecurityContextHolder.getContext().getAuthentication() != null) {
      filterChain.doFilter( request, response );
      return;
    }

    String token = TokenResolveUtil.resolveAccessToken( request );
    if (token == null || token.isBlank()) {
      filterChain.doFilter( request, response );
      return;
    }

    TokenVerificationResult result = verifyToken( request, token );
    if (!result.isValid()) {
      filterChain.doFilter( request, response );
      return;
    }

    Map<String, Object> claims = result.getClaims();
    CustomUserDetails principal = buildPrincipal( claims );

    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken( principal, null, Collections.emptyList() );
    authentication.setDetails( new WebAuthenticationDetailsSource().buildDetails( request ) );

    // claims를 request attribute로도 넣어두면 Controller에서 필요 시 꺼내쓸 수 있음
    request.setAttribute( "jwtClaims", claims );

    SecurityContextHolder.getContext().setAuthentication( authentication );
    filterChain.doFilter( request, response );
  }

  private TokenVerificationResult verifyToken( HttpServletRequest request, String token ) {
    if (tokenVerifier instanceof RemoteSessionCheckTokenVerifier) {
      String target = request.getHeader( "X-App-Target" );
      boolean isUcm = target != null && "ucm".equalsIgnoreCase( target.trim() );
      String url = isUcm ? caIsLoggedInUrl : ppSessionCheckUrl;

      // application이 local일 경우
      boolean isLocal = environment.acceptsProfiles( Profiles.of( "local" ) );
      if (isLocal) {
        boolean requireXRequestedWith = !isUcm;
        return ((RemoteSessionCheckTokenVerifier) tokenVerifier).verifyWithUrl( token, url, requireXRequestedWith, HttpMethod.GET );
      } else {
        // PP는 X-Requested-With가 필수이며, CA는 필요 여부가 불명확하므로 기본 false로 둠
        boolean requireXRequestedWith = !isUcm;
        return ((RemoteSessionCheckTokenVerifier) tokenVerifier).verifyWithUrl( token, url, requireXRequestedWith, isUcm ? HttpMethod.POST : HttpMethod.GET );
      }
    }

    return tokenVerifier.verify( token );
  }

  private CustomUserDetails buildPrincipal( Map<String, Object> claims ) {
    if (claims == null) {
      return new CustomUserDetails( null, null, null, "anonymous", RoleType.EMPLOYEE.code(), null, null, null, null, null, null );
    }

    String userType = "";
    String userNo = "";
    String userNm = "";
    String mbrId = claims.get( "mbrId" ) == null ? null : String.valueOf( claims.get( "mbrId" ) );
    String mbrNo = claims.get( "mbrNo" ) == null ? null : String.valueOf( claims.get( "mbrNo" ) );
    String empNo = claims.get( "empNo" ) == null ? null : String.valueOf( claims.get( "empNo" ) );
    String mbrTypeCd = null;
    String instId = "";

    if (empNo != null) {
      userType = RoleType.ADMIN.code();
      instId = AuthConstants.KIDS_INST_ID;
      userNo = empNo;
      userNm = claims.get( "empNm" ) == null ? null : String.valueOf( claims.get( "empNm" ) );
      // 기존 cdm 도메인 로직은 mbrTypeCd를 기준으로 분기하므로 null이면 userType으로 보정
      mbrTypeCd = userType;
    } else if (mbrId != null) {
      userType = RoleType.PARTNER.code();
      mbrTypeCd = String.valueOf( claims.get( "mbrTypeCd" ) );
      instId = claims.get( "instId" ) == null ? null : String.valueOf( claims.get( "instId" ) );
      userNo = mbrNo;
      userNm = claims.get( "userNm" ) == null ? null : String.valueOf( claims.get( "userNm" ) );
    }

    String deptNo = claims.get( "deptNo" ) == null ? null : String.valueOf( claims.get( "deptNo" ) );
    String instNm = claims.get( "instNm" ) == null ? null : String.valueOf( claims.get( "instNm" ) );

    return new CustomUserDetails( userType, userNo, userNm, empNo, mbrId, mbrTypeCd, null, null, instId, instNm, deptNo );
  }
}
