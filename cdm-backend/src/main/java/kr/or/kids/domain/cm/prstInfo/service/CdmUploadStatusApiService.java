package kr.or.kids.domain.cm.prstInfo.service;

import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadCatalogApiInVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadCatalogApiOutVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadPeriodScaleApiInVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadPeriodScaleApiOutVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadStatusApiInVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadStatusApiOutVO;
import kr.or.kids.domain.cm.prstInfo.vo.TbCmMUldCtlgVO;
import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import kr.or.kids.domain.cm.upload.vo.TbCmDUldPrdSclVO;

import java.util.List;

public interface CdmUploadStatusApiService {

    /* =========================================================
     * CDM 현황정보 (tb_cm_m_uld_prst)
     * - 이전 목록 화면에서 클릭 진입: selectDetail + updateCdmCurrentInfo만 사용
     * ========================================================= */
    CdmUploadStatusApiOutVO getStatusDetail(CdmUploadStatusApiInVO inVo) throws Exception;

    /** 초안 저장: ver_info_nm, last_updt_ymd, updt_cycle_cnt */
    int updateCdmCurrentInfo(TbCmMUldPrstVO inVo) throws Exception;

    /** 전송(확정): 업로드유형·진행상태·완료 반영 */
    int confirmCdmCurrentInfo(TbCmMUldPrstVO inVo) throws Exception;

    /* =========================================================
     * CDM 테이블별 기간&규모 (tb_cm_d_uld_prd_scl)
     * ========================================================= */
    List<CdmUploadPeriodScaleApiOutVO> getPeriodScaleList(CdmUploadPeriodScaleApiInVO inVo) throws Exception;

    int insertCdmUploadPeriodScale(TbCmDUldPrdSclVO inVo) throws Exception;

    int updateCdmUploadPeriodScale(TbCmDUldPrdSclVO inVo) throws Exception;

    int deleteCdmUploadPeriodScale(TbCmDUldPrdSclVO inVo) throws Exception;

    /* =========================================================
     * CDM 카탈로그 (tb_cm_m_uld_ctlg)
     * ========================================================= */
    List<CdmUploadCatalogApiOutVO> getCatalogList(CdmUploadCatalogApiInVO inVo) throws Exception;

    int insertCdmUploadCatalog(TbCmMUldCtlgVO inVo) throws Exception;

    int updateCdmUploadCatalog(TbCmMUldCtlgVO inVo) throws Exception;

    int deleteCdmUploadCatalog(TbCmMUldCtlgVO inVo) throws Exception;

    int deleteCdmUploadCatalogByTblSeCd(TbCmMUldCtlgVO inVo) throws Exception;
}