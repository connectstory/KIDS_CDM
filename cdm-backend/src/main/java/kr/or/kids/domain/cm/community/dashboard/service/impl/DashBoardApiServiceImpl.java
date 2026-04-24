package kr.or.kids.domain.cm.community.dashboard.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.kids.domain.cm.community.dashboard.mapper.DashBoardApiMapper;
import kr.or.kids.domain.cm.community.dashboard.service.DashBoardApiService;
import kr.or.kids.domain.cm.community.dashboard.vo.DashBoardApiInVO;
import kr.or.kids.domain.cm.community.dashboard.vo.DashBoardApiOutVO;
import lombok.RequiredArgsConstructor;

/**
 * <pre>
 * 대시보드 통계 서비스 구현 클래스
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
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashBoardApiServiceImpl implements DashBoardApiService {

    private final DashBoardApiMapper dashBoardApiMapper;

    /**
     * CDM 전체 데이터 통계 정보를 조회한다.
     *
     * @param inVO 대시보드 조회 조건 VO
     * @return CDM 데이터 통계 정보
     */
    @Override
    public DashBoardApiOutVO getCdmDataStats(DashBoardApiInVO inVO) {
        return dashBoardApiMapper.selectCdmDataStats(inVO);
    }

    /**
     * 공시 진행 현황 정보를 조회한다.
     *
     * @param inVO 대시보드 조회 조건 VO
     * @return 공시 진행 현황 통계
     */
    @Override
    public DashBoardApiOutVO getPblntPrgrStats(DashBoardApiInVO inVO) {
        return dashBoardApiMapper.selectPblntPrgrStats(inVO);
    }

    /**
     * 전체 연구과제 현황 통계를 조회한다.
     *
     * @param inVO 대시보드 조회 조건 VO
     * @return 연구과제 현황 통계
     */
    @Override
    public DashBoardApiOutVO getAsmtStatusStats(DashBoardApiInVO inVO) {
        return dashBoardApiMapper.selectAsmtStatusStats(inVO);
    }

    /**
     * 기관별 CDM 업로드 통계를 조회한다.
     *
     * @param inVO 대시보드 조회 조건 VO
     * @return 기관별 업로드 통계 목록
     */
    @Override
    public List<DashBoardApiOutVO> getInstUldStats(DashBoardApiInVO inVO) {
        return dashBoardApiMapper.selectInstUldStats(inVO);
    }

    /**
     * 기관별 CDM 업로드 건수를 조회한다.
     *
     * @param inVO 대시보드 조회 조건 VO
     * @return 기관별 업로드 건수 목록
     */
    @Override
    public List<DashBoardApiOutVO> getInstUldNocs(DashBoardApiInVO inVO) {
        return dashBoardApiMapper.selectInstUldNocs(inVO);
    }

    /**
     * 기관별 데이터 오류율을 조회한다.
     *
     * @param inVO 대시보드 조회 조건 VO
     * @return 기관별 오류율 목록
     */
    @Override
    public List<DashBoardApiOutVO> getInstErrRate(DashBoardApiInVO inVO) {
        return dashBoardApiMapper.selectInstErrRate(inVO);
    }

    /**
     * 기관별 과제 참여 현황 통계를 조회한다.
     *
     * @param inVO 대시보드 조회 조건 VO
     * @return 기관별 과제 참여 통계
     */
    @Override
    public DashBoardApiOutVO getInstAsmtPrtcpStats(DashBoardApiInVO inVO) {
        return dashBoardApiMapper.selectInstAsmtPrtcpStats(inVO);
    }

    /**
     * 기관별 연구과제 현황을 조회한다.
     *
     * @param inVO 대시보드 조회 조건 VO
     * @return 기관별 연구과제 정보
     */
    @Override
    public DashBoardApiOutVO getAsmtStatusStatsByInst(DashBoardApiInVO inVO) {
        return dashBoardApiMapper.selectTbCmMAsmtByInst(inVO);
    }

    /**
     * 테이블별 CDM 업로드 통계를 조회한다.
     *
     * @param inVO 대시보드 조회 조건 VO
     * @return 테이블별 업로드 통계 목록
     */
    @Override
    public List<DashBoardApiOutVO> getTblUldStats(DashBoardApiInVO inVO) {
        return dashBoardApiMapper.selectTblUldStats(inVO);
    }

    /**
     * 모델별 기관 테이블 업로드 건수를 조회한다.
     *
     * @param inVO 대시보드 조회 조건 VO
     * @return 모델별 업로드 건수 목록
     */
    @Override
    public List<DashBoardApiOutVO> getInstTblUldNocsByModel(DashBoardApiInVO inVO) {
        return dashBoardApiMapper.selectInstTblUldNocsByModel(inVO);
    }

    /**
     * 기관별 CDM 개요 정보를 조회한다.
     *
     * @param inVO 대시보드 조회 조건 VO
     * @return 기관별 CDM 개요 목록
     */
    @Override
    public List<DashBoardApiOutVO> getInstCdmOverview(DashBoardApiInVO inVO) {
        return dashBoardApiMapper.selectInstCdmOverview(inVO);
    }

    /**
     * 기관별 데이터 오류 요약 정보를 조회한다.
     *
     * @param inVo 대시보드 조회 조건 VO
     * @return 오류 요약 정보
     */
    @Override
    public DashBoardApiOutVO getInstErrorSummary(DashBoardApiInVO inVo) {
        return dashBoardApiMapper.selectInstErrorSummary(inVo);
    }

    /**
     * 대시보드용 기관 업로드 목록을 조회한다.
     *
     * @param inVo 대시보드 조회 조건 VO
     * @return 기관 업로드 목록
     */
    @Override
    public List<DashBoardApiOutVO> selectDashboardInstUploadList(DashBoardApiInVO inVo) {
        return dashBoardApiMapper.selectDashboardInstUploadList(inVo);
    }

    /**
     * 대시보드 CDM 업로드 공시 정보를 조회한다.
     *
     * @return 업로드 공시 정보 목록
     */
    @Override
    public List<DashBoardApiOutVO> getDashboardUploadNotice() {
        return dashBoardApiMapper.selectDashboardUploadNotice();
    }

    /**
     * 기관별 업로드 진행 현황 통계를 조회한다.
     *
     * @param inVO 대시보드 조회 조건 VO
     * @return 기관별 업로드 진행 통계
     */
    @Override
    public DashBoardApiOutVO getInstUldPrgrStats(DashBoardApiInVO inVO) {
        return dashBoardApiMapper.selectInstUldPrgrStats(inVO);
    }
}