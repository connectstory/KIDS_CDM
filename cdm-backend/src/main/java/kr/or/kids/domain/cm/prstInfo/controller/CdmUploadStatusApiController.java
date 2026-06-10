package kr.or.kids.domain.cm.prstInfo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.prstInfo.service.CdmUploadStatusApiService;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadCatalogApiInVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadCatalogApiOutVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadPeriodScaleApiInVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadPeriodScaleApiOutVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadStatusApiInVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadStatusApiOutVO;
import kr.or.kids.domain.cm.prstInfo.vo.TbCmMUldCtlgVO;
import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import kr.or.kids.domain.cm.upload.vo.TbCmDUldPrdSclVO;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/cdm/upload-status")
public class CdmUploadStatusApiController {

    private final CdmUploadStatusApiService service;

    /*
     * ========================================================= CDM 현황정보 (tb_cm_m_uld_prst) - 이전 목록 화면에서 클릭 진입:
     * selectDetail + updateCdmCurrentInfo만 사용 =========================================================
     */
    @GetMapping("/selectStatusDetail")
    public ResponseEntity<ApiResponse<CdmUploadStatusApiOutVO>> selectStatusDetail( @ModelAttribute CdmUploadStatusApiInVO inVo ) {
        try {
            CdmUploadStatusApiOutVO result = service.getStatusDetail( inVo );
            return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CDM 현황정보 상세 조회 성공", result );
        } catch (Exception e) {
            //e.printStackTrace();
            return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "상세 조회 중 오류 발생" );
        }
    }

    /** CDM 현황정보 초안 저장: ver_info_nm, last_updt_ymd, updt_cycle_cnt (uld_type_cd·완료상태 변경 없음) */
    @PutMapping("/updateCdmCurrentInfo")
    public ResponseEntity<ApiResponse<Integer>> updateCdmCurrentInfo( @AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmMUldPrstVO inVo ) {
        try {
            inVo.setMdfrId( user.getUserNo() );
            int result = service.updateCdmCurrentInfo( inVo );
            return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CDM 현황정보 저장 성공", result );
        } catch (Exception e) {
            //e.printStackTrace();
            return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "저장 중 오류 발생" );
        }
    }

    /** CDM 현황정보 전송(확정): 업로드유형·진행상태·참여완료 반영 */
    @PutMapping("/confirmCdmCurrentInfo")
    public ResponseEntity<ApiResponse<Integer>> confirmCdmCurrentInfo( @AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmMUldPrstVO inVo ) {
        try {
            inVo.setMdfrId( user.getUserNo() );
            int result = service.confirmCdmCurrentInfo( inVo );
            return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CDM 현황정보 전송(확정) 성공", result );
        } catch (Exception e) {
            return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "전송(확정) 중 오류 발생" );
        }
    }

    /*
     * ========================================================= CDM 테이블별 기간&규모 (tb_cm_d_uld_prd_scl)
     * =========================================================
     */
    @GetMapping("/selectPeriodScaleList")
    public ResponseEntity<ApiResponse<List<CdmUploadPeriodScaleApiOutVO>>> selectPeriodScaleList( @ModelAttribute CdmUploadPeriodScaleApiInVO inVo ) {
        try {
            List<CdmUploadPeriodScaleApiOutVO> list = service.getPeriodScaleList( inVo );
            return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CDM 테이블별 기간&규모 목록 조회 성공", list );
        } catch (Exception e) {
            //e.printStackTrace();
            return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "목록 조회 중 오류 발생" );
        }
    }

    @PostMapping("/insertCdmUploadPeriodScale")
    public ResponseEntity<ApiResponse<Integer>> insertCdmUploadPeriodScale( @AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmDUldPrdSclVO inVo ) {
        try {
            inVo.setRgtrId( user.getUserNo() );
            inVo.setMdfrId( user.getUserNo() );
            int result = service.insertCdmUploadPeriodScale( inVo );
            return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CDM 테이블별 기간&규모 등록 성공", result );
        } catch (Exception e) {
            //e.printStackTrace();
            return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "등록 중 오류 발생" );
        }
    }

    @PutMapping("/updateCdmUploadPeriodScale")
    public ResponseEntity<ApiResponse<Integer>> updateCdmUploadPeriodScale( @AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmDUldPrdSclVO inVo ) {
        try {
            inVo.setMdfrId( user.getUserNo() );
            int result = service.updateCdmUploadPeriodScale( inVo );
            return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CDM 테이블별 기간&규모 수정 성공", result );
        } catch (Exception e) {
            //e.printStackTrace();
            return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "수정 중 오류 발생" );
        }
    }

    @DeleteMapping("/deleteCdmUploadPeriodScale")
    public ResponseEntity<ApiResponse<Integer>> deleteCdmUploadPeriodScale( @AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmDUldPrdSclVO inVo ) {
        try {
            inVo.setMdfrId( user.getUserNo() );
            int result = service.deleteCdmUploadPeriodScale( inVo );
            return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CDM 테이블별 기간&규모 삭제 성공", result );
        } catch (Exception e) {
            //e.printStackTrace();
            return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "삭제 중 오류 발생" );
        }
    }

    /*
     * ========================================================= CDM 카탈로그 (tb_cm_m_uld_ctlg)
     * =========================================================
     */
    @GetMapping("/selectCatalogList")
    public ResponseEntity<ApiResponse<List<CdmUploadCatalogApiOutVO>>> selectCatalogList( @ModelAttribute CdmUploadCatalogApiInVO inVo ) {
        try {
            List<CdmUploadCatalogApiOutVO> list = service.getCatalogList( inVo );
            return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CDM 카탈로그 목록 조회 성공", list );
        } catch (Exception e) {
            //e.printStackTrace();
            return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "목록 조회 중 오류 발생" );
        }
    }

    @PostMapping("/insertCdmUploadCatalog")
    public ResponseEntity<ApiResponse<Integer>> insertCdmUploadCatalog( @AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmMUldCtlgVO inVo ) {
        try {
            inVo.setRgtrId( user.getUserNo() );
            inVo.setMdfrId( user.getUserNo() );
            int result = service.insertCdmUploadCatalog( inVo );
            return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CDM 카탈로그 등록 성공", result );
        } catch (Exception e) {
            //e.printStackTrace();
            return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "등록 중 오류 발생" );
        }
    }

    @PutMapping("/updateCdmUploadCatalog")
    public ResponseEntity<ApiResponse<Integer>> updateCdmUploadCatalog( @AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmMUldCtlgVO inVo ) {
        try {
            inVo.setMdfrId( user.getUserNo() );
            int result = service.updateCdmUploadCatalog( inVo );
            return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CDM 카탈로그 수정 성공", result );
        } catch (Exception e) {
            //e.printStackTrace();
            return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "수정 중 오류 발생" );
        }
    }

    @DeleteMapping("/deleteCdmUploadCatalog")
    public ResponseEntity<ApiResponse<Integer>> deleteCdmUploadCatalog( @AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmMUldCtlgVO inVo ) {
        try {
            inVo.setMdfrId( user.getUserNo() );
            int result = service.deleteCdmUploadCatalog( inVo );
            return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CDM 카탈로그 삭제 성공", result );
        } catch (Exception e) {
            //e.printStackTrace();
            return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "삭제 중 오류 발생" );
        }
    }

    @DeleteMapping("/deleteCdmUploadCatalogByTblSeCd")
    public ResponseEntity<ApiResponse<Integer>> deleteCdmUploadCatalogByTblSeCd( @AuthenticationPrincipal CustomUserDetails user, @RequestBody TbCmMUldCtlgVO inVo ) {
        try {
            inVo.setMdfrId( user.getUserNo() );
            int result = service.deleteCdmUploadCatalogByTblSeCd( inVo );
            return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CDM 카탈로그 일괄 삭제 성공", result );
        } catch (Exception e) {
            //e.printStackTrace();
            return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, "일괄 삭제 중 오류 발생" );
        }
    }
}
