package kr.or.kids.domain.cm.community.dashboard.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.community.dashboard.service.DashBoardApiService;
import kr.or.kids.domain.cm.community.dashboard.vo.DashBoardApiInVO;
import kr.or.kids.domain.cm.community.dashboard.vo.DashBoardApiOutVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * <pre>
 * 대시보드 API 컨트롤러
 * - CDM 통계, 연구과제 현황, 기관별 업로드 및 오류 현황 등 대시보드 데이터를 제공한다.
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.0
 *
 *          <pre>
 *   since         author             description
 * ==========   ============   =========================
 * 2026-01-20   kim min seok    최초 생성
 *          </pre>
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/dashboard")
public class DashBoardApiController {

	private final DashBoardApiService dashBoardApiService;

	/**
	 * CDM 전체 데이터 통계를 조회한다.
	 *
	 * @return ApiResponse<DashBoardApiOutVO> CDM 데이터 통계 정보
	 */
	@GetMapping("/cdmStats")
	public ResponseEntity<ApiResponse<DashBoardApiOutVO>> getCdmDataStats() {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "CDM 전체 데이터 통계 조회 성공", dashBoardApiService.getCdmDataStats(new DashBoardApiInVO()));
	}

	/**
	 * 전체 연구과제 현황을 조회한다.
	 *
	 * @return ApiResponse<DashBoardApiOutVO> 연구과제 현황 통계 정보
	 */
	@GetMapping("/asmtStatusStats")
	public ResponseEntity<ApiResponse<DashBoardApiOutVO>> getAsmtStatusStats() {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "전체 연구과제 현황 조회 성공", dashBoardApiService.getAsmtStatusStats(new DashBoardApiInVO()));
	}

	/**
	 * 공시 진행 현황을 조회한다.
	 *
	 * @return ApiResponse<DashBoardApiOutVO> 공시 진행 현황 정보
	 */
	@GetMapping("/pblntPrgrStats")
	public ResponseEntity<ApiResponse<DashBoardApiOutVO>> getPblntPrgrStats() {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "공시진행현황 조회 성공", dashBoardApiService.getPblntPrgrStats(new DashBoardApiInVO()));
	}

	/**
	 * 기관별 CDM 보유 현황을 조회한다.
	 *
	 * @param ptcpInstSn 참여 기관 일련번호
	 * @return ApiResponse<List<DashBoardApiOutVO>> 기관별 보유 현황 목록
	 */
	@GetMapping("/instUldStats")
	public ResponseEntity<ApiResponse<List<DashBoardApiOutVO>>> getInstUldStats(@RequestParam Long ptcpInstSn) {
		DashBoardApiInVO inVO = new DashBoardApiInVO();
		inVO.setPtcpInstSn(ptcpInstSn);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "기관별 CDM 보유 현황 조회 성공", dashBoardApiService.getInstUldStats(inVO));
	}

	/**
	 * 기관별 CDM 데이터 건수를 조회한다.
	 *
	 * @param ptcpInstSn 참여 기관 일련번호
	 * @return ApiResponse<List<DashBoardApiOutVO>> 기관별 데이터 건수 목록
	 */
	@GetMapping("/instUldNocs")
	public ResponseEntity<ApiResponse<List<DashBoardApiOutVO>>> getInstUldNocs(@RequestParam Long ptcpInstSn) {
		DashBoardApiInVO inVO = new DashBoardApiInVO();
		inVO.setPtcpInstSn(ptcpInstSn);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "기관별 CDM 데이터 건수 조회 성공", dashBoardApiService.getInstUldNocs(inVO));
	}

	/**
	 * 기관별 CDM 오류율을 조회한다.
	 *
	 * @param ptcpInstSn 참여 기관 일련번호
	 * @return ApiResponse<List<DashBoardApiOutVO>> 기관별 오류율 목록
	 */
	@GetMapping("/instErrRate")
	public ResponseEntity<ApiResponse<List<DashBoardApiOutVO>>> getInstErrRate(@RequestParam Long ptcpInstSn) {
		DashBoardApiInVO inVO = new DashBoardApiInVO();
		inVO.setPtcpInstSn(ptcpInstSn);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "기관별 CDM 오류율 조회 성공", dashBoardApiService.getInstErrRate(inVO));
	}

	/**
	 * 기관별 연구과제 참여 현황을 조회한다.
	 *
	 * @param instId 기관 ID
	 * @return ApiResponse<DashBoardApiOutVO> 기관별 참여 현황 정보
	 */
	@GetMapping("/instAsmtPrtcpStats")
	public ResponseEntity<ApiResponse<DashBoardApiOutVO>> getInstAsmtPrtcpStats(@RequestParam String instId) {
		DashBoardApiInVO inVO = new DashBoardApiInVO();
		inVO.setInstId(instId);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "기관별 연구과제 참여 현황 조회 성공", dashBoardApiService.getInstAsmtPrtcpStats(inVO));
	}

	/**
	 * 기관별 생성 연구과제 현황을 조회한다.
	 *
	 * @param instId 기관 ID
	 * @return ApiResponse<DashBoardApiOutVO> 기관별 과제 생성 현황 정보
	 */
	@GetMapping("/instAsmtStatusStats")
	public ResponseEntity<ApiResponse<DashBoardApiOutVO>> getAsmtStatusStatsByInst(@RequestParam String instId) {
		DashBoardApiInVO inVO = new DashBoardApiInVO();
		inVO.setInstId(instId);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "기관별 생성 연구과제 현황 조회 성공", dashBoardApiService.getAsmtStatusStatsByInst(inVO));
	}

	/**
	 * 기관별 업로드 진행 현황을 조회한다.
	 *
	 * @param instId 기관 ID
	 * @return ApiResponse<DashBoardApiOutVO> 기관별 업로드 진행 정보
	 */
	@GetMapping("/instUldPrgrStats")
	public ResponseEntity<ApiResponse<DashBoardApiOutVO>> getInstUldPrgrStats(@RequestParam String instId) {
		DashBoardApiInVO inVO = new DashBoardApiInVO();
		inVO.setInstId(instId);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "기관별 업로드 진행 현황 조회 성공", dashBoardApiService.getInstUldPrgrStats(inVO));
	}

	/**
	 * 테이블별 CDM 보유 현황을 조회한다.
	 *
	 * @param instId 기관 ID
	 * @return ApiResponse<List<DashBoardApiOutVO>> 테이블별 보유 현황 목록
	 */
	@GetMapping("/tblUldStats")
	public ResponseEntity<ApiResponse<List<DashBoardApiOutVO>>> getTblUldStats(@RequestParam String instId) {
		DashBoardApiInVO inVO = new DashBoardApiInVO();
		inVO.setInstId(instId);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "테이블별 CDM 보유 현황 조회 성공", dashBoardApiService.getTblUldStats(inVO));
	}

	/**
	 * 모델별 테이블 보유량을 조회한다.
	 *
	 * @param ptcpInstSn 참여 기관 일련번호
	 * @param trsfSeCd 전송 구분 코드
	 * @return ApiResponse<List<DashBoardApiOutVO>> 모델별 보유량 목록
	 */
	@GetMapping("/instTblUld")
	public ResponseEntity<ApiResponse<List<DashBoardApiOutVO>>> getInstTblUldNocsByModel(@RequestParam Long ptcpInstSn, @RequestParam String trsfSeCd) {
		DashBoardApiInVO inVO = new DashBoardApiInVO();
		inVO.setPtcpInstSn(ptcpInstSn);
		inVO.setTrsfSeCd(trsfSeCd);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "모델별 테이블 보유량 조회 성공", dashBoardApiService.getInstTblUldNocsByModel(inVO));
	}

	/**
	 * 기관별 CDM 개요를 조회한다.
	 *
	 * @param ptcpInstSn 참여 기관 일련번호
	 * @return ApiResponse<List<DashBoardApiOutVO>> 기관별 CDM 개요 목록
	 */
	@GetMapping("/instCdmOverview")
	public ResponseEntity<ApiResponse<List<DashBoardApiOutVO>>> getInstCdmOverview(@RequestParam Long ptcpInstSn) {
		DashBoardApiInVO inVO = new DashBoardApiInVO();
		inVO.setPtcpInstSn(ptcpInstSn);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "기관별 CDM 개요 조회 성공", dashBoardApiService.getInstCdmOverview(inVO));
	}

	/**
	 * 기관별 CDM 오류 요약을 조회한다.
	 *
	 * @param instId 기관 ID
	 * @return ApiResponse<DashBoardApiOutVO> 오류 요약 정보
	 */
	@GetMapping("/errorSummary")
	public ResponseEntity<ApiResponse<DashBoardApiOutVO>> getInstErrorSummary(@RequestParam String instId) {
		DashBoardApiInVO inVo = new DashBoardApiInVO();
		inVo.setInstId(instId);
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "기관별 CDM 오류 요약 조회 성공", dashBoardApiService.getInstErrorSummary(inVo));
	}

	/**
	 * 기관별 업로드 이력을 조회한다.
	 *
	 * @param inVo 업로드 이력 조회 조건 VO
	 * @return ApiResponse<List<DashBoardApiOutVO>> 업로드 이력 목록
	 */
	@PostMapping("/instUploadList")
	public ResponseEntity<ApiResponse<List<DashBoardApiOutVO>>> getInstUploadList(@RequestBody DashBoardApiInVO inVo) {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "기관별 업로드 이력 조회 성공", dashBoardApiService.selectDashboardInstUploadList(inVo));
	}

	/**
	 * CDM 업로드 공시 정보를 조회한다.
	 *
	 * @return ApiResponse<List<DashBoardApiOutVO>> 업로드 공시 목록
	 */
	@GetMapping("/uploadNotice")
	public ResponseEntity<ApiResponse<List<DashBoardApiOutVO>>> getDashboardUploadNotice() {
		return ApiResponse.ok(ApiResponse.STATUS_SUCCESS, "CDM 업로드 공시 조회 성공", dashBoardApiService.getDashboardUploadNotice());
	}
}