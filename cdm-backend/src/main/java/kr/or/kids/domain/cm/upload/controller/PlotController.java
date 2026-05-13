// package kr.or.kids.domain.cm.upload.controller;

// import kr.or.kids.domain.cm.common.dto.ApiResponse;
// import kr.or.kids.global.common.CustomUserDetails;
// import kr.or.kids.domain.cm.upload.service.PlotService;
// import kr.or.kids.domain.cm.upload.util.UploadAuthUtil;
// import lombok.RequiredArgsConstructor;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.core.annotation.AuthenticationPrincipal;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RequestParam;
// import org.springframework.web.bind.annotation.RestController;

// import java.util.Map;

// /**
//  * 업로드 관련 API 요청을 처리한다.
//  *
//  * <pre>
//  * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
//  * </pre>
//  */
// @RestController
// @RequiredArgsConstructor
// @RequestMapping("/plot")
// public class PlotController {

//     private final PlotService plotService;

    
//     /**
//      * 조회 결과를 반환한다.
//      *
//      * @param du du
//      * @param plotId plotId
//      * @param instTaskSn instTaskSn
//      * @param conceptId conceptId
//      * @param includeDescendant includeDescendant
//      * @param minLevels minLevels
//      * @return 처리 결과
//      */
//     @GetMapping
//     public ResponseEntity<ApiResponse<Map<String, Object>>> getPlotData(
//             @AuthenticationPrincipal CustomUserDetails du,
//             @RequestParam int plotId,
//             @RequestParam(required = false) Long instTaskSn,
//             @RequestParam(required = false) Integer conceptId,
//             @RequestParam(required = false, defaultValue = "false") boolean includeDescendant,
//             @RequestParam(required = false) Integer minLevels
//     ) {
//         if (du == null) {
//             return ApiResponse.error( HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.", null );
//         }
//         if (!UploadAuthUtil.isAdmin( du )) {
//             return ApiResponse.error( HttpStatus.FORBIDDEN, "공시는 관리자만 접근할 수 있습니다.", null );
//         }
//         Map<String, Object> result = plotService.getPlotData(plotId, instTaskSn, conceptId, includeDescendant, minLevels);
//         return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "Plot 조회 성공", result);
//     }

    
//     /**
//      * 조회 결과를 반환한다.
//      *
//      * @param du du
//      * @param conceptId conceptId
//      * @return 처리 결과
//      */
//     @GetMapping("/concept")
//     public ResponseEntity<ApiResponse<Map<String, Object>>> getConceptName(
//             @AuthenticationPrincipal CustomUserDetails du,
//             @RequestParam Integer conceptId
//     ) {
//         if (du == null) {
//             return ApiResponse.error( HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.", null );
//         }
//         if (!UploadAuthUtil.isAdmin( du )) {
//             return ApiResponse.error( HttpStatus.FORBIDDEN, "공시는 관리자만 접근할 수 있습니다.", null );
//         }
//         Map<String, Object> result = plotService.getConceptName(conceptId);
//         return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "Concept 조회 성공", result);
//     }
// }
