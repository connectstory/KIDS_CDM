package kr.or.kids.domain.cm.common.controller;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import io.jsonwebtoken.Claims;
import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.common.mapper.CommonAuthrtMapper;
import kr.or.kids.domain.cm.common.service.AccessHistoryService;
import kr.or.kids.domain.cm.common.vo.AccessHistoryVO;
import kr.or.kids.domain.cm.common.vo.MemberAndInstVO;
import kr.or.kids.domain.cm.common.vo.TbPpMEmpInfoVO;
import kr.or.kids.global.common.AuthConstants;
import kr.or.kids.global.config.JwtAuthProvier;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  private final JwtAuthProvier jwtAuthProvier;
  private final CommonAuthrtMapper commonAuthrtMapper;
  private final RestTemplate restTemplate;
  private final AccessHistoryService accessHistoryService;

  @Value("${jwt.remote.pp-extend-url:${pp.api-url:http://localhost:3000}/api/pp/adminExtend}")
  private String ppExtendUrl;

  @Value("${jwt.remote.ca-extend-url:${ca.api-url:http://localhost:3000}/api/ca/auth/extend}")
  private String caExtendUrl;

  @Value("${jwt.remote.pp-logout-url:${pp.api-url:http://localhost:3000}/api/pp/adminLogout}")
  private String ppLogoutUrl;

  @Value("${jwt.remote.ca-logout-url:${ca.api-url:http://localhost:3000}/api/ca/auth/logout}")
  private String caLogoutUrl;

  @GetMapping("/me/admin")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getMeAdmin( HttpServletRequest request ) {
    String token = resolveToken( request );

    if (token == null || jwtAuthProvier.validateToken( token ) != 0) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증이 필요합니다." );
    }

    Claims claims = jwtAuthProvier.getClaims( token );
    String sub = claims.get( "sub", String.class );

    Map<String, Object> result = new HashMap<>();
    Long loginTime = claims.get( "loginTime", Long.class );
    if (loginTime == null) {
      loginTime = System.currentTimeMillis();
    }

    TbPpMEmpInfoVO empInfoVO = commonAuthrtMapper.selectEmpInfoByEmpNo( sub );
    if (empInfoVO == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "회원정보를 찾을 수 없습니다." );
    }

    String resolvedDeptNo = empInfoVO.getDeptNo();
    if (resolvedDeptNo == null && empInfoVO.getEmpNo() != null) {
      var exprtAuthrt = commonAuthrtMapper.selectOneExprtAuthrtByMbrNo( empInfoVO.getEmpNo() );
      if (exprtAuthrt != null && exprtAuthrt.getAuthrtCd() != null && !exprtAuthrt.getAuthrtCd().isBlank()) {
        var deptAuthrt = commonAuthrtMapper.selectOneDeptAuthrtByAuthrtCd( exprtAuthrt.getAuthrtCd() );
        if (deptAuthrt != null) {
          resolvedDeptNo = deptAuthrt.getDeptNo();
        }
      }
    }

    Object jwtClaimsAttr = request.getAttribute( "jwtClaims" );
    if (!(jwtClaimsAttr instanceof Map<?, ?> meClaims)) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "세션 정보를 사용할 수 없습니다." );
    }

    result.put( "userNo", empInfoVO.getEmpNo() );
    result.put( "userName", empInfoVO.getEmpNm() );
    result.put( "instId", AuthConstants.KIDS_INST_ID );
    result.put( "loginTime", loginTime );
    result.put( "userType", "A" );
    result.put( "deptNo", resolvedDeptNo );
    result.put( "menuAuthList", meClaims.get( "menuAuthList" ) );
    result.put( "menuAuthMap", meClaims.get( "menuAuthMap" ) );
    result.put( "accessTokenValidity", meClaims.get( "accessTokenValidity" ) );
    result.put( "remainedExpiryTime", meClaims.get( "remainedExpiryTime" ) );
    result.put( "sessionLogSn", meClaims.get( "sessionLogSn" ) );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "사용자 정보 조회 성공", result );
  }

  /**
   * CM(admin) 세션 연장: CDM → PP(adminExtend) 프록시
   */
  @PostMapping("/ppExtend")
  public ResponseEntity<ApiResponse<Map<String, Object>>> ppExtend( HttpServletRequest request ) {
    return proxyExtend( request, ppExtendUrl, true );
  }

  /**
   * UCM(partner) 세션 연장: CDM → CA(extend) 프록시
   */
  @PostMapping("/caExtend")
  public ResponseEntity<ApiResponse<Map<String, Object>>> caExtend( HttpServletRequest request ) {
    return proxyExtend( request, caExtendUrl, false );
  }

  /**
   * CM(admin) 로그아웃: CDM → PP(adminLogout) 프록시
   */
  @PostMapping("/ppLogout")
  public ResponseEntity<ApiResponse<Map<String, Object>>> ppLogout( HttpServletRequest request ) {
    return proxyLogout( request, ppLogoutUrl, true, null );
  }

  /**
   * UCM(partner) 로그아웃: CDM → CA(logout) 프록시 CA는 body로 mbrId/tokenSn 등을 요구할 수 있어 그대로 전달.
   */
  @PostMapping("/caLogout")
  public ResponseEntity<ApiResponse<Map<String, Object>>> caLogout( HttpServletRequest request, @RequestBody(required = false) Map<String, Object> body ) {
    return proxyLogout( request, caLogoutUrl, false, body );
  }

  @GetMapping("/me/partner")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getMePartner( HttpServletRequest request ) {
    String token = resolveToken( request );

    if (token == null || jwtAuthProvier.validateToken( token ) != 0) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증이 필요합니다." );
    }

    Claims claims = jwtAuthProvier.getClaims( token );
    String sub = claims.get( "sub", String.class );

    // 회원 + 기관정보 조회 (mbr_id 기준)
    MemberAndInstVO mbrInfoVo = commonAuthrtMapper.selectMemberAndInstByMbrId( sub );
    if (mbrInfoVo == null) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "회원정보를 찾을 수 없습니다." );
    }

    Map<String, Object> result = new HashMap<>();
    Long loginTime = claims.get( "loginTime", Long.class );
    if (loginTime == null) {
      loginTime = System.currentTimeMillis();
    }

    result.put( "userNo", mbrInfoVo.getMbrNo() );
    result.put( "userName", mbrInfoVo.getMbrEncptFlnm() );
    result.put( "mbrNo", mbrInfoVo.getMbrNo() );
    result.put( "mbrId", mbrInfoVo.getMbrId() );
    result.put( "instId", mbrInfoVo.getInstBrno() );
    result.put( "instNm", mbrInfoVo.getInstNm() );
    result.put( "loginTime", loginTime );
    result.put( "userType", "P" );
    result.put( "menuAuthList", commonAuthrtMapper.selectPartnerMenuAuthList() );

    Object jwtClaimsAttr = request.getAttribute( "jwtClaims" );
    if (!(jwtClaimsAttr instanceof Map<?, ?> meClaims)) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "세션 정보를 사용할 수 없습니다." );
    }

    result.put( "sessionLogSn", meClaims.get( "sessionLogSn" ) );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "사용자 정보 조회 성공", result );
  }

  /**
   * 메뉴 클릭 시 프론트에서 호출 — 접속이력 저장
   */
  @PostMapping("/access-history")
  public ResponseEntity<ApiResponse<Void>> recordMenuAccess( HttpServletRequest request, @RequestBody(required = false) Map<String, Object> body ) {
    Object jwtClaimsAttr = request.getAttribute( "jwtClaims" );
    if (!(jwtClaimsAttr instanceof Map<?, ?> claims)) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "세션 정보를 사용할 수 없습니다." );
    }

    Object sessionLogSn = claims.get( "sessionLogSn" );
    if (sessionLogSn == null) {
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "sessionLogSn 없음", null );
    }

    AccessHistoryVO inVo = new AccessHistoryVO();
    inVo.setSessLogSn( String.valueOf( sessionLogSn ) );
    if (body != null) {
      if (body.get( "menuPath" ) instanceof String menuPath) {
        try {
          URI uri = new URI(menuPath);
          inVo.setUrlAddr( uri.isAbsolute() ? uri.getPath() : menuPath );
        } catch (URISyntaxException e) {
          inVo.setUrlAddr( menuPath );
        }
      }
      Object menuSnObj = body.get( "menuSn" );
      if (menuSnObj != null) {
        inVo.setMenuSn( String.valueOf( menuSnObj ) );
      }
      Object flfmtTaskCdObj = body.get( "flfmtTaskCd" );
      if (flfmtTaskCdObj != null) {
        inVo.setFlfmtTaskCd( String.valueOf( flfmtTaskCdObj ) );
      }
    }
    accessHistoryService.saveAccessHistory( inVo );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "접속이력 저장 성공", null );
  }

  /**
   * 스프링 세션(JSESSIONID) 기반 인증이 남아있을 수 있어, 로그아웃 시 세션 무효화 + 쿠키 만료 처리. (노드 JWT 서버의 httpOnly accessToken 쿠키는 해당 서버 도메인에서 별도로
   * clear해야 함)
   */
  @PostMapping("/logout")
  public ResponseEntity<ApiResponse<Void>> logout( HttpServletRequest request, HttpServletResponse response ) {
    HttpSession session = request.getSession( false );
    if (session != null) {
      session.invalidate();
    }

    Cookie jsession = new Cookie( "JSESSIONID", "" );
    jsession.setPath( "/" );
    jsession.setMaxAge( 0 );
    response.addCookie( jsession );

    // 혹시 백엔드 도메인에 accessToken 쿠키가 존재하는 경우도 함께 만료
    Cookie accessToken = new Cookie( "accessToken", "" );
    accessToken.setPath( "/" );
    accessToken.setMaxAge( 0 );
    response.addCookie( accessToken );

    return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "로그아웃되었습니다.", null );
  }

  private ResponseEntity<ApiResponse<Map<String, Object>>> proxyExtend( HttpServletRequest request, String url, boolean requireXRequestedWith ) {
    String token = resolveToken( request );
    if (token == null || token.isBlank()) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증이 필요합니다." );
    }

    try {
      HttpHeaders headers = new HttpHeaders();
      headers.set( HttpHeaders.AUTHORIZATION, "Bearer " + token );
      if (requireXRequestedWith) {
        headers.set( "X-Requested-With", "XMLHttpRequest" );
      }

      @SuppressWarnings("unchecked")
      ResponseEntity<Map<String, Object>> resp = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.exchange( url, HttpMethod.POST, new HttpEntity<>( null, headers ), Map.class );

      if (resp.getStatusCode().is2xxSuccessful()) {
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "세션이 정상적으로 연장되었습니다.", resp.getBody() );
      }

      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증정보가 만료되었습니다." );
    } catch (RestClientException e) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증정보가 만료되었습니다." );
    }
  }

  private ResponseEntity<ApiResponse<Map<String, Object>>> proxyLogout( HttpServletRequest request, String url, boolean requireXRequestedWith, Map<String, Object> body ) {
    String token = resolveToken( request );
    if (token == null || token.isBlank()) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증이 필요합니다." );
    }

    try {
      HttpHeaders headers = new HttpHeaders();
      headers.set( HttpHeaders.AUTHORIZATION, "Bearer " + token );
      if (requireXRequestedWith) {
        headers.set( "X-Requested-With", "XMLHttpRequest" );
      }

      HttpEntity<?> entity;
      if (body == null) {
        entity = new HttpEntity<>( headers );
      } else {
        headers.setContentType( MediaType.APPLICATION_JSON );
        entity = new HttpEntity<>( body, headers );
      }

      @SuppressWarnings("unchecked")
      ResponseEntity<Map<String, Object>> resp = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.exchange( url, HttpMethod.POST, entity, Map.class );

      if (resp.getStatusCode().is2xxSuccessful()) {
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "로그아웃되었습니다.", resp.getBody() );
      }

      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증정보가 만료되었습니다." );
    } catch (RestClientException e) {
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증정보가 만료되었습니다." );
    }
  }

  private String resolveToken( HttpServletRequest request ) {
    String bearer = request.getHeader( "Authorization" );
    if (bearer != null && bearer.startsWith( "Bearer " )) {
      return bearer.substring( 7 );
    }

    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
      for (Cookie cookie : cookies) {
        if (cookie.getName().equals( "accessToken" )) {
          return cookie.getValue();
        }
      }
    }
    return null;
  }
}
