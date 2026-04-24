package kr.or.kids.domain.cm.prstInfo.service.impl;

import kr.or.kids.domain.cm.prstInfo.mapper.CdmUploadStatusApiMapper;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CdmUploadStatusApiServiceImpl implements CdmUploadStatusApiService {

    private final CdmUploadStatusApiMapper mapper;

    /* =========================================================
     * CDM 현황정보 (tb_cm_m_uld_prst)
     * - 이전 목록 화면에서 클릭 진입: selectDetail + updateCdmCurrentInfo만 사용
     * ========================================================= */
    @Override
    public CdmUploadStatusApiOutVO getStatusDetail(CdmUploadStatusApiInVO inVo) throws Exception {
        return mapper.selectCdmUploadStatusDetail(inVo);
    }

    @Override
    @Transactional
    public int updateCdmCurrentInfo(TbCmMUldPrstVO inVo) throws Exception {
        normalizeLastUpdtYmdForPrst(inVo);
        int updated = mapper.updateCdmCurrentInfo(inVo);
        if (updated == 0) {
            mapper.insertCdmCurrentInfoDraftMinimal(inVo);
            updated = mapper.updateCdmCurrentInfo(inVo);
        }
        return updated;
    }

    @Override
    @Transactional
    public int confirmCdmCurrentInfo(TbCmMUldPrstVO inVo) throws Exception {
        normalizeLastUpdtYmdForPrst(inVo);
        int updated = mapper.confirmCdmCurrentInfo(inVo);
        if (updated == 0) {
            mapper.insertCdmCurrentInfoMinimal(inVo);
            return 1;
        }
        return updated;
    }

    private void normalizeLastUpdtYmdForPrst(TbCmMUldPrstVO inVo) {
        String ymd = normalizeYmdTo8(inVo.getLastUpdtYmd());
        if (ymd == null || ymd.isEmpty()) {
            ymd = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        }
        inVo.setLastUpdtYmd(ymd);
    }

    /**
     * DB 컬럼 character(8)에 맞게 날짜 문자열을 YYYYMMDD 8자로 정규화.
     * "2021-10-01", "2021.10.01" 등은 "20211001"로 변환.
     */
    private static String normalizeYmdTo8(String ymd) {
        if (ymd == null || ymd.isEmpty()) return null;
        String digits = ymd.replaceAll("\\D", "");
        if (digits.length() < 8) return null;
        return digits.substring(0, 8);
    }

    /* =========================================================
     * CDM 테이블별 기간&규모 (tb_cm_d_uld_prd_scl)
     * ========================================================= */
    @Override
    public List<CdmUploadPeriodScaleApiOutVO> getPeriodScaleList(CdmUploadPeriodScaleApiInVO inVo) throws Exception {
        return mapper.selectCdmUploadPeriodScaleList(inVo);
    }

    @Override
    @Transactional
    public int insertCdmUploadPeriodScale(TbCmDUldPrdSclVO inVo) throws Exception {
        if (inVo.getBgngYmd() != null) inVo.setBgngYmd(normalizeYmdTo8(inVo.getBgngYmd()));
        if (inVo.getEndYmd() != null) inVo.setEndYmd(normalizeYmdTo8(inVo.getEndYmd()));
        return mapper.insertCdmUploadPeriodScale(inVo);
    }

    @Override
    @Transactional
    public int updateCdmUploadPeriodScale(TbCmDUldPrdSclVO inVo) throws Exception {
        if (inVo.getBgngYmd() != null) inVo.setBgngYmd(normalizeYmdTo8(inVo.getBgngYmd()));
        if (inVo.getEndYmd() != null) inVo.setEndYmd(normalizeYmdTo8(inVo.getEndYmd()));
        return mapper.updateCdmUploadPeriodScale(inVo);
    }

    @Override
    @Transactional
    public int deleteCdmUploadPeriodScale(TbCmDUldPrdSclVO inVo) throws Exception {
        return mapper.deleteCdmUploadPeriodScale(inVo);
    }

    /* =========================================================
     * CDM 카탈로그 (tb_cm_m_uld_ctlg)
     * ========================================================= */
    @Override
    public List<CdmUploadCatalogApiOutVO> getCatalogList(CdmUploadCatalogApiInVO inVo) throws Exception {
        return mapper.selectCdmUploadCatalogList(inVo);
    }

    @Override
    @Transactional
    public int insertCdmUploadCatalog(TbCmMUldCtlgVO inVo) throws Exception {
        return mapper.insertCdmUploadCatalog(inVo);
    }

    @Override
    @Transactional
    public int updateCdmUploadCatalog(TbCmMUldCtlgVO inVo) throws Exception {
        return mapper.updateCdmUploadCatalog(inVo);
    }

    @Override
    @Transactional
    public int deleteCdmUploadCatalog(TbCmMUldCtlgVO inVo) throws Exception {
        return mapper.deleteCdmUploadCatalog(inVo);
    }

    @Override
    @Transactional
    public int deleteCdmUploadCatalogByTblSeCd(TbCmMUldCtlgVO inVo) throws Exception {
        return mapper.deleteCdmUploadCatalogByTblSeCd(inVo);
    }
}