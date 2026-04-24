package kr.or.kids.domain.cm.common.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import kr.or.kids.domain.cm.common.mapper.PartnerMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * <pre>
 * 복호화 API 호출 서비스
 * - 개인정보(성명 등) 암호화 값을 복호화 API를 통해 평문으로 변환
 * </pre>
 *
 * @author kim min seok
 * @since 2026-03-30
 * @version 1.0
 *
 *          <pre>
 *   since         author             description
 * ==========   ============   =========================
 * 2026-03-30   kim min seok    최초 생성
 *          </pre>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DecryptApiService {

	private final WebClient webClient;
	private final PartnerMapper partnerMapper;

	@Value("${decrypt.api-url}")
	private String decryptApiUrl;

	@Value("${decrypt.path}")
	private String decryptPath;

	/**
	 * 성명(encpt_mbr_flnm) 복호화 - 암호화된 값이 아닌 경우 원본 값 그대로 반환
	 *
	 * @param encptMbrFlnm 암호화된 성명
	 * @return 복호화된 성명, 실패 시 null
	 */
	public String decryptMbrFlnm( String encptMbrFlnm ) {
		return decryptField( encptMbrFlnm, "encptMbrFlnm", "decptMbrFlnm", "성명" );
	}

	/**
	 * 회원번호(mbrNo)로 기관명 + 복호화 성명 조회 - selectInstAndName 쿼리로 inst_nm, encpt_mbr_flnm 조회 - encpt_mbr_flnm 은 암호화 여부를 판단하여 복호화
	 * 처리
	 *
	 * @param mbrNo 회원번호
	 * @return {"instNm": "기관명", "mbrFlnm": "복호화된 성명"}, 조회 실패 시 빈 Map
	 */
	public Map<String, String> getInstAndDecryptedName( String mbrNo ) {
		Map<String, String> result = new HashMap<>();
		if (mbrNo == null || mbrNo.isBlank()) {
			return result;
		}

		Map<String, String> row = partnerMapper.selectInstAndName( mbrNo );
		if (row == null) {
			log.warn( "[DecryptApiService] mbrNo 조회 결과 없음" );
			return result;
		}

		result.put( "instNm", row.get( "inst_nm" ) );
		result.put( "mbrFlnm", decryptMbrFlnm( row.get( "encpt_mbr_flnm" ) ) );
		return result;
	}

	/**
	 * 복호화 API 공통 호출
	 *
	 * @param encptValue 암호화된 원본 값
	 * @param reqKey 복호화 요청 필드명
	 * @param resKey 복호화 응답 필드명
	 * @param fieldLabel 로그용 필드 레이블
	 * @return 복호화된 값, 실패 시 null
	 */
	@SuppressWarnings({ "rawtypes", "unchecked" })
	public String decryptField( String encptValue, String reqKey, String resKey, String fieldLabel ) {
		if (encptValue == null || encptValue.isBlank()) {
			return null;
		}

		if (!isEncryptedValue( encptValue )) {
			return encptValue;
		}

		HashMap<String, Object> req = new HashMap<>();
		req.put( reqKey, encptValue );

		try {
			Map res = webClient.post().uri( decryptApiUrl + decryptPath ).bodyValue( req ).retrieve().bodyToMono( Map.class ).block();

			if (res == null) {
				log.error( "[DecryptApiService] {} 복호화 응답 없음", fieldLabel );
				return null;
			}

			Map<String, Object> data = (Map<String, Object>) res.get( "data" );
			String decrypted = data != null ? (String) data.get( resKey ) : null;

			if (decrypted == null || decrypted.isBlank()) {
				log.error( "[DecryptApiService] {} 복호화 실패 — 응답값 없음", fieldLabel );
			}

			return decrypted;

		} catch (WebClientResponseException e) {
			log.error( "[DecryptApiService] {} 복호화 API HTTP 오류 ({})", fieldLabel, e.getStatusCode().value() );
			return null;
		} catch (WebClientRequestException e) {
			log.error( "[DecryptApiService] {} 복호화 API 요청 실패 ({})", fieldLabel, e.getClass().getSimpleName() );
			return null;
		}
	}

	/**
	 * 암호화된 값 여부 판단 - 이메일 형식이거나 한글/영문 이름 형식이면 평문으로 판단
	 *
	 * @param value 검사할 값
	 * @return 암호화된 값이면 true
	 */
	public boolean isEncryptedValue( String value ) {
		if (value == null || value.isBlank())
			return false;
		if (value.matches( "^[A-Za-z0-9+_.-]+@[A-Za-z0-9+_.-]+$" ))
			return false;
		return !value.matches( "^[가-힣A-Za-z\\s]{1,20}$" );
	}
}
