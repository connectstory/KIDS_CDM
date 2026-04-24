package kr.or.kids.domain.cm.common.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * <pre>
 * 암호화 API 호출 서비스
 * </pre>
 *
 * @author kim min seok
 * @since 2026-04-07
 * @version 1.0
 *
 * <pre>
 * since         author             description
 * ==========   ============   =========================
 * 2026-04-07   kim min seok    최초 생성
 * </pre>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EncryptApiService {

    private final WebClient webClient;

    @Value("${decrypt.api-url}")
    private String encryptApiUrl;

    @Value("${encrypt.path}")
    private String encryptPath;

    /**
     * 회원명(mbrFlnm)을 암호화한다.
     *
     * @param mbrFlnm 회원명 평문
     * @return 암호화된 값
     */
    public String encryptMbrFlnm(String mbrFlnm) {
        return encryptField(mbrFlnm, "mbrFlnm", "encptMbrFlnm", "회원명");
    }

    /**
     * 회원이메일(mbrEmlNm)을 암호화한다.
     *
     * @param mbrEmlNm 회원이메일 평문
     * @return 암호화된 값
     */
    public String encryptMbrEmlNm(String mbrEmlNm) {
        return encryptField(mbrEmlNm, "mbrEmlNm", "encptMbrEmlNm", "회원이메일");
    }

    /**
     * 회원비밀번호(mbrPswd)를 암호화한다.
     *
     * @param mbrPswd 회원비밀번호 평문
     * @return 암호화된 값
     */
    public String encryptMbrPswd(String mbrPswd) {
        return encryptField(mbrPswd, "mbrPswd", "encptMbrPswd", "회원비밀번호");
    }

    /**
     * 회원전화번호(mbrTelno)를 암호화한다.
     *
     * @param mbrTelno 회원전화번호 평문
     * @return 암호화된 값
     */
    public String encryptMbrTelno(String mbrTelno) {
        return encryptField(mbrTelno, "mbrTelno", "encptMbrTelno", "회원전화번호");
    }

    /**
     * 직원전화번호(empTelno)를 암호화한다.
     *
     * @param empTelno 직원전화번호 평문
     * @return 암호화된 값
     */
    public String encryptEmpTelno(String empTelno) {
        return encryptField(empTelno, "empTelno", "encptEmpTelno", "직원전화번호");
    }

    /**
     * 직원이메일명(empEmlNm)을 암호화한다.
     *
     * @param empEmlNm 직원이메일 평문
     * @return 암호화된 값
     */
    public String encryptEmpEmlNm(String empEmlNm) {
        return encryptField(empEmlNm, "empEmlNm", "encptEmpEmlNm", "직원이메일명");
    }

    /**
     * 관리자비밀번호(mngrPswd)를 암호화한다.
     *
     * @param mngrPswd 관리자비밀번호 평문
     * @return 암호화된 값
     */
    public String encryptMngrPswd(String mngrPswd) {
        return encryptField(mngrPswd, "mngrPswd", "encptMngrPswd", "관리자비밀번호");
    }

    /**
     * 자문위원 주민등록번호를 암호화한다.
     *
     * @param cnstnMbcmtRrno 주민등록번호 평문
     * @return 암호화된 값
     */
    public String encryptCnstnMbcmtRrno(String cnstnMbcmtRrno) {
        return encryptField(cnstnMbcmtRrno, "cnstnMbcmtRrno", "encptCnstnMbcmtRrno", "자문위원주민등록번호");
    }

    /**
     * 자문위원 계좌번호를 암호화한다.
     *
     * @param cnstnMbcmtActno 계좌번호 평문
     * @return 암호화된 값
     */
    public String encryptCnstnMbcmtActno(String cnstnMbcmtActno) {
        return encryptField(cnstnMbcmtActno, "cnstnMbcmtActno", "encptCnstnMbcmtActno", "자문위원계좌번호");
    }

    // ── 대국민포털 필요 항목 ──

    /**
     * 이전비밀번호(bfrPswd)를 암호화한다.
     *
     * @param bfrPswd 이전비밀번호 평문
     * @return 암호화된 값
     */
    public String encryptBfrPswd(String bfrPswd) {
        return encryptField(bfrPswd, "bfrPswd", "encptBfrPswd", "이전비밀번호");
    }

    /**
     * 댓글비밀번호(cmntPswd)를 암호화한다.
     *
     * @param cmntPswd 댓글비밀번호 평문
     * @return 암호화된 값
     */
    public String encryptCmntPswd(String cmntPswd) {
        return encryptField(cmntPswd, "cmntPswd", "encptCmntPswd", "댓글비밀번호");
    }

    /**
     * 담당자전화번호(picTelno)를 암호화한다.
     *
     * @param picTelno 담당자전화번호 평문
     * @return 암호화된 값
     */
    public String encryptPicTelno(String picTelno) {
        return encryptField(picTelno, "picTelno", "encptPicTelno", "담당자전화번호");
    }

    /**
     * 법정대리인전화번호(sttyAgtTelno)를 암호화한다.
     *
     * @param sttyAgtTelno 법정대리인전화번호 평문
     * @return 암호화된 값
     */
    public String encryptSttyAgtTelno(String sttyAgtTelno) {
        return encryptField(sttyAgtTelno, "sttyAgtTelno", "encptSttyAgtTelno", "법정대리인전화번호");
    }

    /**
     * 전문가성명(exprtFlnm)을 암호화한다.
     *
     * @param exprtFlnm 전문가성명 평문
     * @return 암호화된 값
     */
    public String encryptExprtFlnm(String exprtFlnm) {
        return encryptField(exprtFlnm, "exprtFlnm", "encptExprtFlnm", "전문가성명");
    }

    /**
     * 전문가기관이메일명(exprtInstEmlNm)을 암호화한다.
     *
     * @param exprtInstEmlNm 전문가기관이메일 평문
     * @return 암호화된 값
     */
    public String encryptExprtInstEmlNm(String exprtInstEmlNm) {
        return encryptField(exprtInstEmlNm, "exprtInstEmlNm", "encptExprtInstEmlNm", "전문가기관이메일명");
    }

    /**
     * 작성자성명(wrtrFlnm)을 암호화한다.
     *
     * @param wrtrFlnm 작성자성명 평문
     * @return 암호화된 값
     */
    public String encryptWrtrFlnm(String wrtrFlnm) {
        return encryptField(wrtrFlnm, "wrtrFlnm", "encptWrtrFlnm", "작성자성명");
    }

    /**
     * 작성자전화번호(wrtrTelno)를 암호화한다.
     *
     * @param wrtrTelno 작성자전화번호 평문
     * @return 암호화된 값
     */
    public String encryptWrtrTelno(String wrtrTelno) {
        return encryptField(wrtrTelno, "wrtrTelno", "encptWrtrTelno", "작성자전화번호");
    }

    /**
     * 암호화 API를 공통으로 호출한다.
     *
     * <pre>
     * - WebClient를 사용하여 비동기 방식(block 처리)으로 암호화 API 호출
     * - 전송 실패 또는 응답값 부재 시 에러 로그를 기록하고 null 반환
     * </pre>
     *
     * @param plainValue 평문 원본 값
     * @param reqKey 암호화 요청 필드명
     * @param resKey 암호화 응답 필드명
     * @param fieldLabel 로그용 필드 레이블
     * @return 암호화된 값 (실패 시 null)
     */
    @SuppressWarnings({"rawtypes", "unchecked"})
    public String encryptField(String plainValue, String reqKey, String resKey, String fieldLabel) {
        if (plainValue == null || plainValue.isBlank()) {
            return null;
        }

        HashMap<String, Object> req = new HashMap<>();
        req.put(reqKey, plainValue);

        try {
            Map res = webClient.post()
                    .uri(encryptApiUrl + encryptPath)
                    .bodyValue(req)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (res == null) {
                log.error("[EncryptApiService] {} 암호화 응답 없음", fieldLabel);
                return null;
            }

            Map<String, Object> data = (Map<String, Object>) res.get("data");
            String encrypted = data != null ? (String) data.get(resKey) : null;

            if (encrypted == null || encrypted.isBlank()) {
                log.error("[EncryptApiService] {} 암호화 실패 — 응답값 없음", fieldLabel);
            }

            return encrypted;

        } catch (WebClientResponseException e) {
            log.error("[EncryptApiService] {} 암호화 API HTTP 오류 ({})", fieldLabel, e.getStatusCode().value());
            return null;
        } catch (WebClientRequestException e) {
            log.error("[EncryptApiService] {} 암호화 API 요청 실패 ({})", fieldLabel, e.getClass().getSimpleName());
            return null;
        }
    }
}