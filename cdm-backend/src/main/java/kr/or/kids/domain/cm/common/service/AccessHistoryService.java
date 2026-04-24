package kr.or.kids.domain.cm.common.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import kr.or.kids.domain.cm.common.mapper.PartnerMapper;
import kr.or.kids.domain.cm.common.vo.AccessHistoryVO;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.web.client.RestClientException;

/**
 * <pre>
 * 접속이력 등록 서비스
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.0
 *
 * <pre>
 * since         author             description
 * ==========   ============   =========================
 * 2026-01-20   kim min seok    최초 생성
 * </pre>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccessHistoryService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final DecryptApiService decryptApiService;
    private final PartnerMapper partnerMapper;

    @Value("${decrypt.api-url}")
    private String accessHistoryApiUrl;

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern( "yyyy-MM-dd'T'HH:mm:ss" );

    /**
     * 현재 로그인 사용자 ID를 반환한다.
     *
     * <pre>
     * - SecurityContextHolder 에서 CustomUserDetails 를 조회하여 사용자 ID 반환
     * </pre>
     *
     * @return 사용자 ID, 조회 실패 시 빈 문자열
     */
    private String resolveUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
                return userDetails.getMbrId();
            }
        } catch (IllegalStateException e) {
            log.warn("[AccessHistoryService] resolveUserId failed - security context unavailable");
        }
        return "";
    }

    /**
     * 현재 로그인 사용자 이름을 반환한다.
     *
     * <pre>
     * - 내부직원(empNo 존재): PartnerMapper 를 통해 empNm 조회
     * - 협력기관 회원(empNo 없음): DecryptApiService 를 통해 mbrFlnm 복호화 조회
     * </pre>
     *
     * @return 사용자 이름, 조회 실패 시 빈 문자열
     */
    private String resolveUserName() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (!(auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails)) {
                return "";
            }
            String empNo = userDetails.getEmpNo();
            if (empNo != null && !empNo.isBlank()) {
                Map<String, String> info = partnerMapper.selectEmpInfoByEmpNo(empNo);
                return info != null ? info.getOrDefault("empNm", "") : "";
            }
            String userNo = userDetails.getUserNo();
            if (userNo != null && !userNo.isBlank()) {
                Map<String, String> info = decryptApiService.getInstAndDecryptedName(userNo);
                return info != null ? info.getOrDefault("mbrFlnm", "") : "";
            }
        } catch (IllegalStateException e) {
            log.warn("[AccessHistoryService] resolveUserName failed - security context unavailable");
        } catch (DataAccessException e) {
            log.warn("[AccessHistoryService] resolveUserName failed - database error");
        } catch (RestClientException e) {
            log.warn("[AccessHistoryService] resolveUserName failed - decrypt API error");
        }
        return "";
    }

    /**
     * 현재 요청의 URL 을 반환한다.
     *
     * <pre>
     * - RequestContextHolder 에서 HttpServletRequest 를 조회하여 요청 경로 반환
     * - 쿼리 파라미터가 존재하는 경우 path?query 형식으로 반환
     * </pre>
     *
     * @return 요청 URL, 조회 실패 시 빈 문자열
     */
    private String resolveUrlAddr() {
        try {
            Object attrs = RequestContextHolder.getRequestAttributes();
            if (!(attrs instanceof ServletRequestAttributes servletAttrs)) {
                return "";
            }
            HttpServletRequest req = servletAttrs.getRequest();
            String path = req.getRequestURI().replaceFirst("^/api", "");
            String query = req.getQueryString();
            return (query != null) ? path + "?" + query : path;
        } catch (IllegalStateException e) {
            log.warn("[AccessHistoryService] resolveUrlAddr failed - request context unavailable");
            return "";
        }
    }

    /**
     * 접속이력을 등록한다.
     *
     * <pre>
     * - 공통 접속이력 API 를 호출하여 메뉴 접근 이력 저장
     * - 사용자 ID 및 이름은 SecurityContextHolder 에서 자동 조회
     * - URL 은 vo 에 값이 없을 경우 현재 요청 URL 로 대체
     * </pre>
     *
     * @param vo 접속이력 정보 VO (sessLogSn, urlAddr 포함)
     * @return 등록 성공 여부 (true: 성공, false: 실패)
     */
    public boolean saveAccessHistory( AccessHistoryVO vo ) {
        if (vo == null || vo.getMenuSn() == null || vo.getMenuSn().isBlank()) {
            return false;
        }
        try {
            String now = LocalDateTime.now().format( DT_FMT );

            Map<String, String> request = new HashMap<>();
            String urlAddr = vo.getUrlAddr() != null ? vo.getUrlAddr() : resolveUrlAddr();

            request.put( "menuUtztnSn", "" );
            request.put( "sessLogSn", vo.getSessLogSn() );
            request.put( "inptDt", now );
            request.put( "menuId", vo.getMenuSn() != null ? vo.getMenuSn() : "" );
            request.put( "urlAddr", urlAddr );
            request.put( "taskSeCdNo", "CM" );
            request.put( "cntnDt", now );
            request.put( "acsrNm", resolveUserName() );
            request.put( "rqstrId", resolveUserId() );
            request.put( "flfmtTaskCd", vo.getFlfmtTaskCd() != null ? vo.getFlfmtTaskCd() : "" );
            request.put( "etcMemoCn", "" );
            request.put( "prvcInclYn", "N" );
            request.put( "regDt", now );
            request.put( "mdfcnDt", now );
            request.put( "rgtrId", resolveUserId() );
            request.put( "mdfrId", resolveUserId() );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType( MediaType.APPLICATION_JSON );
            HttpEntity<Map<String, String>> entity = new HttpEntity<>( request, headers );

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                accessHistoryApiUrl + "/api/ca/auth/workAccessLog/insert",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {} );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String code = String.valueOf( response.getBody().get( "code" ) );
                return "1".equals( code );
            }
            return false;
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("[AccessHistoryService] saveAccessHistory failed - HTTP error");
            return false;
        } catch (ResourceAccessException e) {
            log.error("[AccessHistoryService] saveAccessHistory failed - connection error");
            return false;
        }
    }
}
