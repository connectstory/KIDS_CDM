package kr.or.kids.domain.cm.common.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import kr.or.kids.domain.cm.common.mapper.PartnerMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * <pre>
 * 공통 메일 발송 API 호출 서비스
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
public class MailApiService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final PartnerMapper partnerMapper;
    private final WebClient webClient;

    @Value("${mail.api-url}")
    private String mailApiUrl;

    @Value("${decrypt.api-url}")
    private String decryptApiUrl;

    @Value("${decrypt.path}")
    private String decryptPath;

    /**
     * HTML 메일 발송을 수행한다.
     *
     * <pre>
     * - brno(사업자번호)가 있으면 전문가 정보를 조회하여 발송
     * - empNo(사번)가 있으면 직원 정보를 조회하여 발송
     * - 두 식별자 모두 없을 경우 발송을 생략함
     * </pre>
     *
     * @param brno 사업자등록번호 (전문가 식별용)
     * @param empNo 사번 (직원 식별용)
     * @param emlTtl 메일 제목
     * @param emlCn 메일 내용 (HTML 형식)
     * @return 발송 성공 여부
     */
    public boolean sendHtmlMail(String brno, String empNo, String emlTtl, String emlCn) {
        if (brno != null && !brno.isBlank()) {
            return sendHtmlMailByBrno(brno.trim(), emlTtl, emlCn);
        }
        if (empNo != null && !empNo.isBlank()) {
            return sendHtmlMailByEmpNo(empNo.trim(), emlTtl, emlCn);
        }
        log.warn("[sendHtmlMail] brno/empNo 모두 없음 — 발송 생략");
        return false;
    }

    /**
     * 전문가 정보를 조회하여 메일을 발송한다. (내부 메서드)
     *
     * <pre>
     * - 사업자번호로 암호화된 이메일 및 성명을 조회
     * - 각 필드를 복호화한 후 실제 메일 전송 로직 호출
     * </pre>
     *
     * @param brno 사업자등록번호
     * @param emlTtl 메일 제목
     * @param emlCn 메일 내용
     * @return 발송 성공 여부
     */
    private boolean sendHtmlMailByBrno(String brno, String emlTtl, String emlCn) {
        Map<String, String> encrypted = partnerMapper.selectExpertEncryptedInfoByBrno(brno);
        if (encrypted == null) {
            log.warn("[sendHtmlMail] 전문가 정보 없음");
            return false;
        }

        String email = resolveField(encrypted.get("encptEmail"), "encptMbrEmlNm", "decptMbrEmlNm", "이메일", brno);
        if (email == null || email.isBlank()) {
            log.warn("[sendHtmlMail] 이메일 없음");
            return false;
        }

        String name = resolveField(encrypted.get("encptFlnm"), "encptMbrFlnm", "decptMbrFlnm", "성명", brno);
        if (name == null || name.isBlank()) {
            log.warn("[sendHtmlMail] 성명 없음");
            return false;
        }

        return doSendMail(brno, email, name, emlTtl, emlCn);
    }

    /**
     * 직원 정보를 조회하여 메일을 발송한다. (내부 메서드)
     *
     * <pre>
     * - 사번으로 직원 이메일을 조회 및 복호화
     * - 성명은 평문으로 처리하여 메일 전송 로직 호출
     * </pre>
     *
     * @param empNo 사번
     * @param emlTtl 메일 제목
     * @param emlCn 메일 내용
     * @return 발송 성공 여부
     */
    private boolean sendHtmlMailByEmpNo(String empNo, String emlTtl, String emlCn) {
        Map<String, String> empInfo = partnerMapper.selectEmpInfoByEmpNo(empNo);
        if (empInfo == null) {
            log.warn("[sendHtmlMail] 직원 정보 없음");
            return false;
        }

        String email = resolveField(empInfo.get("encptEmpEmlNm"), "encptEmpEmlNm", "decptEmpEmlNm", "이메일", empNo);
        if (email == null || email.isBlank()) {
            log.warn("[sendHtmlMail] 이메일 없음");
            return false;
        }

        String name = empInfo.get("empNm");

        return doSendMail(empNo, email, name, emlTtl, emlCn);
    }

    /**
     * 암호화된 필드를 복호화한다.
     *
     * <pre>
     * - 값이 평문 형식(이메일 패턴 등)일 경우 그대로 반환
     * - 암호화된 데이터일 경우 복호화 API(WebClient)를 호출하여 평문 획득
     * </pre>
     *
     * @param encptValue 암호화된 값
     * @param reqKey API 요청 키
     * @param resKey API 응답 키
     * @param fieldLabel 로그 기록용 필드 라벨
     * @param id 로그 기록용 식별자
     * @return 복호화된 평문 값
     */
    @SuppressWarnings({"rawtypes", "unchecked"})
    private String resolveField(String encptValue, String reqKey, String resKey, String fieldLabel, String id) {
        if (encptValue == null || encptValue.isBlank()) {
            return null;
        }

        if (!inEncryptedValue(encptValue)) {
            return encptValue;
        }

        HashMap<String, Object> req = new HashMap<>();
        req.put(reqKey, encptValue);

        try {
            Map res = webClient.post()
                    .uri(decryptApiUrl + decryptPath)
                    .bodyValue(req)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (res == null) {
                log.error("[MailApiService] {} 복호화 응답 없음", fieldLabel);
                return null;
            }

            Map<String, Object> data = (Map<String, Object>) res.get("data");
            String decrypted = data != null ? (String) data.get(resKey) : null;

            if (decrypted == null || decrypted.isBlank()) {
                log.error("[MailApiService] {} 복호화 실패 — 응답값 없음", fieldLabel);
            }

            return decrypted;

        } catch (WebClientResponseException e) {
            log.error("[MailApiService] {} 복호화 API HTTP 오류 ({})", fieldLabel, e.getStatusCode().value());
            return null;
        } catch (WebClientRequestException e) {
            log.error("[MailApiService] {} 복호화 API 요청 실패 ({})", fieldLabel, e.getClass().getSimpleName());
            return null;
        }
    }

    /**
     * 메일 발송 API를 호출한다. (최종 수행)
     *
     * <pre>
     * - RestTemplate을 사용하여 mail-be의 전송 API 호출
     * - JSON 형식으로 전송 대상 정보 구성
     * </pre>
     *
     * @param id 로그 식별자
     * @param email 수신자 이메일
     * @param name 수신자 성명
     * @param emlTtl 메일 제목
     * @param emlCn 메일 내용
     * @return 최종 API 호출 성공 여부
     */
    @SuppressWarnings("rawtypes")
    private boolean doSendMail(String id, String email, String name, String emlTtl, String emlCn) {
        try {
            Map<String, String> request = new HashMap<>();
            request.put("emlTtl", emlTtl);
            request.put("emlCn", emlCn);
            request.put("sndptyFlnm", "한국의약품안전관리원");
            request.put("sndptyEmlAddr", "kids@drugsafe.or.kr");
            request.put("rcvrFlnm", name != null ? name : "");
            request.put("rcvrEmlAddr", email);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    mailApiUrl + "/api/ca/mail/send", entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String code = String.valueOf(response.getBody().get("code"));
                return "1".equals(code);
            }

            return false;
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("[메일API 호출 실패] HTTP 오류 ({})", e.getStatusCode().value());
            return false;
        } catch (ResourceAccessException e) {
            log.error("[메일API 호출 실패] 연결 오류 ({})", e.getClass().getSimpleName());
            return false;
        }
    }

    /**
     * 입력값이 암호화된 상태인지 여부를 판별한다.
     *
     * <pre>
     * - 이메일 패턴이거나 일반적인 성명(한글/영문) 패턴일 경우 평문으로 간주
     * - 그 외의 불규칙한 데이터는 암호화된 값으로 판단
     * </pre>
     *
     * @param value 확인할 문자열
     * @return 암호화 여부 (true: 암호화됨, false: 평문)
     */
    private boolean inEncryptedValue(String value) {
        if (value == null || value.isBlank()) return false;
        // 이메일 형식 체크
        if (value.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9+_.-]+$")) return false;
        // 일반적인 이름 형식(한글, 영문, 공백) 체크
        return !value.matches("^[가-힣A-Za-z\\s]{1,20}$");
    }
}