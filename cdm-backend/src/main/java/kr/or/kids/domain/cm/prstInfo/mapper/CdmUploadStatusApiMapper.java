package kr.or.kids.domain.cm.prstInfo.mapper;

import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadCatalogApiInVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadCatalogApiOutVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadPeriodScaleApiInVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadPeriodScaleApiOutVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadStatusApiInVO;
import kr.or.kids.domain.cm.prstInfo.vo.CdmUploadStatusApiOutVO;
import kr.or.kids.domain.cm.prstInfo.vo.TbCmMUldCtlgVO;
import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import kr.or.kids.domain.cm.upload.vo.TbCmDUldPrdSclVO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CdmUploadStatusApiMapper {

    /* =========================================================
     * CDM 현황정보 (tb_cm_m_uld_prst)
     * - 이전 목록 화면에서 클릭 진입: selectDetail + updateCdmCurrentInfo만 사용
     * ========================================================= */
    CdmUploadStatusApiOutVO selectCdmUploadStatusDetail(CdmUploadStatusApiInVO inVo);

    /** 초안 저장: ver_info_nm, last_updt_ymd, updt_cycle_cnt 만 갱신 */
    int updateCdmCurrentInfo(TbCmMUldPrstVO inVo);

    /** 전송(확정): uld_type_cd·진행상태·참여완료일시 포함 갱신 */
    int confirmCdmCurrentInfo(TbCmMUldPrstVO inVo);

    /** 행이 없을 때 초안 INSERT (uld_type_cd=02 현황등록; 01은 파일/CDM 업로드 전용) */
    int insertCdmCurrentInfoDraftMinimal(TbCmMUldPrstVO inVo);

    /** 행이 없을 때 확정 INSERT (uld_type_cd=02) — confirm 전용 폴백 */
    int insertCdmCurrentInfoMinimal(TbCmMUldPrstVO inVo);

    /* =========================================================
     * CDM 테이블별 기간&규모 (tb_cm_d_uld_prd_scl)
     * ========================================================= */
    List<CdmUploadPeriodScaleApiOutVO> selectCdmUploadPeriodScaleList(CdmUploadPeriodScaleApiInVO inVo);

    int insertCdmUploadPeriodScale(TbCmDUldPrdSclVO inVo);

    int updateCdmUploadPeriodScale(TbCmDUldPrdSclVO inVo);

    int deleteCdmUploadPeriodScale(TbCmDUldPrdSclVO inVo);

    /* =========================================================
     * CDM 카탈로그 (tb_cm_m_uld_ctlg)
     * ========================================================= */
    List<CdmUploadCatalogApiOutVO> selectCdmUploadCatalogList(CdmUploadCatalogApiInVO inVo);

    int insertCdmUploadCatalog(TbCmMUldCtlgVO inVo);

    int updateCdmUploadCatalog(TbCmMUldCtlgVO inVo);

    int deleteCdmUploadCatalog(TbCmMUldCtlgVO inVo);

    int deleteCdmUploadCatalogByTblSeCd(TbCmMUldCtlgVO inVo);
}