package kr.or.kids.domain.cm.community.dashboard.service;

import java.util.List;

import kr.or.kids.domain.cm.community.dashboard.vo.DashBoardApiInVO;
import kr.or.kids.domain.cm.community.dashboard.vo.DashBoardApiOutVO;

/**
 * <pre>
 * 대시보드 통계 서비스 인터페이스
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
public interface DashBoardApiService {

   /**
    * CDM 전체 데이터 통계 정보를 조회한다.
    *
    * @param inVO 대시보드 조회 조건 VO
    * @return CDM 데이터 통계 정보
    */
   DashBoardApiOutVO getCdmDataStats(DashBoardApiInVO inVO);

   /**
    * 공시 진행 현황 정보를 조회한다.
    *
    * @param inVO 대시보드 조회 조건 VO
    * @return 공시 진행 현황 통계
    */
   DashBoardApiOutVO getPblntPrgrStats(DashBoardApiInVO inVO);

   /**
    * 전체 연구과제 현황 통계를 조회한다.
    *
    * @param inVO 대시보드 조회 조건 VO
    * @return 연구과제 현황 통계
    */
   DashBoardApiOutVO getAsmtStatusStats(DashBoardApiInVO inVO);

   /**
    * 기관별 CDM 업로드 통계를 조회한다.
    *
    * @param inVO 대시보드 조회 조건 VO
    * @return 기관별 업로드 통계 목록
    */
   List<DashBoardApiOutVO> getInstUldStats(DashBoardApiInVO inVO);

   /**
    * 기관별 CDM 업로드 건수를 조회한다.
    *
    * @param inVO 대시보드 조회 조건 VO
    * @return 기관별 업로드 건수 목록
    */
   List<DashBoardApiOutVO> getInstUldNocs(DashBoardApiInVO inVO);

   /**
    * 기관별 데이터 오류율을 조회한다.
    *
    * @param inVO 대시보드 조회 조건 VO
    * @return 기관별 오류율 목록
    */
   List<DashBoardApiOutVO> getInstErrRate(DashBoardApiInVO inVO);

   /**
    * 기관별 과제 참여 현황 통계를 조회한다.
    *
    * @param inVO 대시보드 조회 조건 VO
    * @return 기관별 과제 참여 통계
    */
   DashBoardApiOutVO getInstAsmtPrtcpStats(DashBoardApiInVO inVO);

   /**
    * 기관별 연구과제 현황을 조회한다.
    *
    * @param inVO 대시보드 조회 조건 VO
    * @return 기관별 연구과제 정보
    */
   DashBoardApiOutVO getAsmtStatusStatsByInst(DashBoardApiInVO inVO);

   /**
    * 테이블별 CDM 업로드 통계를 조회한다.
    *
    * @param inVO 대시보드 조회 조건 VO
    * @return 테이블별 업로드 통계 목록
    */
   List<DashBoardApiOutVO> getTblUldStats(DashBoardApiInVO inVO);

   /**
    * 모델별 기관 테이블 업로드 건수를 조회한다.
    *
    * @param inVO 대시보드 조회 조건 VO
    * @return 모델별 업로드 건수 목록
    */
   List<DashBoardApiOutVO> getInstTblUldNocsByModel(DashBoardApiInVO inVO);

   /**
    * 기관별 CDM 개요 정보를 조회한다.
    *
    * @param inVO 대시보드 조회 조건 VO
    * @return 기관별 CDM 개요 목록
    */
   List<DashBoardApiOutVO> getInstCdmOverview(DashBoardApiInVO inVO);

   /**
    * 기관별 데이터 오류 요약 정보를 조회한다.
    *
    * @param inVo 대시보드 조회 조건 VO
    * @return 오류 요약 정보
    */
   DashBoardApiOutVO getInstErrorSummary(DashBoardApiInVO inVo);

   /**
    * 대시보드용 기관 업로드 목록을 조회한다.
    *
    * @param inVo 대시보드 조회 조건 VO
    * @return 기관 업로드 목록
    */
   List<DashBoardApiOutVO> selectDashboardInstUploadList(DashBoardApiInVO inVo);

   /**
    * 대시보드 CDM 업로드 공시 정보를 조회한다.
    *
    * @return 업로드 공시 정보 목록
    */
   List<DashBoardApiOutVO> getDashboardUploadNotice();

   /**
    * 기관별 업로드 진행 현황 통계를 조회한다.
    *
    * @param inVO 대시보드 조회 조건 VO
    * @return 기관별 업로드 진행 통계
    */
   DashBoardApiOutVO getInstUldPrgrStats(DashBoardApiInVO inVO);
}