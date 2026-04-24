package kr.or.kids.domain.cm.upload.controller;

import javax.servlet.http.HttpServletRequest;

import kr.or.kids.global.common.CustomUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.upload.dto.CdmValidateProgress;
import kr.or.kids.domain.cm.upload.dto.CdmValidateRequest;
import kr.or.kids.domain.cm.upload.service.CdmValidateService;
import kr.or.kids.domain.cm.upload.service.DisclosureService;

import lombok.RequiredArgsConstructor;

import java.util.Map;

/**
 * 업로드 관련 API 요청을 처리한다.
 *
 * <pre>
 * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
 * </pre>
 */
@RestController
@RequestMapping("/disclosures")
@RequiredArgsConstructor
public class CdmValidateController {

    private final CdmValidateService cdmValidateService;
    private final DisclosureService disclosureService;

    /**
     * startValidation 처리를 수행한다.
     *
     * @param du du
     * @param pblntSn pblntSn
     * @param request request
     * @param httpRequest httpRequest
     * @return 처리 결과
     */
    @PostMapping("/{pblntSn}/cdm-validate")
    public ResponseEntity<ApiResponse<Map<String, String>>> startValidation(
            @AuthenticationPrincipal CustomUserDetails du,
            @PathVariable Long pblntSn,
            @RequestBody CdmValidateRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            if (du == null) {
                return ApiResponse.error( HttpStatus.UNAUTHORIZED,
                        "로그인이 필요합니다.", null );
            }

            if (request.ptcpInstSn() == null) {

                return ApiResponse.error(HttpStatus.BAD_REQUEST,
                        "참여기관일련번호(ptcpInstSn)는 필수입니다. 자신이 올린 데이터만 집계됩니다.", null);
            }

            String userId = du.getInstId();

            CdmValidateRequest effectiveRequest = new CdmValidateRequest(
                    request.ptcpInstSn(),
                    userId,
                    request.tables(),
                    request.totalUploadBytes()
            );

            String taskId = cdmValidateService.startValidation(effectiveRequest, pblntSn);

            return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "CDM 검증이 시작되었습니다.",
                    Map.of("taskId", taskId));
        } catch (IllegalStateException e) {

            return ApiResponse.error(HttpStatus.BAD_REQUEST, "요청을 처리할 수 없습니다.");
        } catch (Exception e) {

            return ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR,
                    "CDM 검증 시작에 실패했습니다.");
        }
    }

    /**
     * 조회 결과를 반환한다.
     *
     * @param du du
     * @param pblntSn pblntSn
     * @param taskId taskId
     * @return 처리 결과
     */
    @GetMapping("/{pblntSn}/cdm-validate/status")
    public ResponseEntity<ApiResponse<CdmValidateProgress>> getValidationStatus(
            @AuthenticationPrincipal CustomUserDetails du,
            @PathVariable Long pblntSn,
            @RequestParam String taskId
    ) {
        if (du == null) {
            return ApiResponse.error( HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.", null );
        }

        CdmValidateProgress progress = cdmValidateService.getProgress(taskId);
        return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "진행 상태 조회 성공", progress);
    }
}
