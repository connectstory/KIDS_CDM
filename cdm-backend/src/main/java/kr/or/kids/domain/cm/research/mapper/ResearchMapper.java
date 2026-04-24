package kr.or.kids.domain.cm.research.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.kids.domain.cm.common.vo.TbCmMAsmtPersonVO;
import kr.or.kids.domain.cm.common.vo.TbPpMEmpInfoVO;
import kr.or.kids.domain.cm.research.dto.ResearchSearchRequest;
import kr.or.kids.domain.cm.research.vo.AsmtPersonRowVO;
import kr.or.kids.domain.cm.research.vo.CohortRow;
import kr.or.kids.domain.cm.research.vo.CommentRowVO;
import kr.or.kids.domain.cm.research.vo.EmpOptionVO;
import kr.or.kids.domain.cm.research.vo.OpinionListRowVO;
import kr.or.kids.domain.cm.research.vo.OrgPartnerLatestMetaVO;
import kr.or.kids.domain.cm.research.vo.ResearchAsmtDetailVO;
import kr.or.kids.domain.cm.research.vo.ResearchListRowVO;
import kr.or.kids.domain.cm.research.vo.ResearchPartnerVO;
import kr.or.kids.domain.cm.research.vo.TbCmEAsmtMetaVO;
import kr.or.kids.domain.cm.research.vo.TbCmEOpnnVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtAccountVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtCmntVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtPrcpVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtVO;
import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import kr.or.kids.domain.cm.research.vo.TbPpMInstTaskVO;

@Mapper
public interface ResearchMapper {

  /* 연구과제 (목록/조회/등록/수정/상태/삭제) */
  /* 연구과제 목록 조회 (instId 기준) */
  List<ResearchListRowVO> searchResearchList( @Param("instId") String instId, @Param("request") ResearchSearchRequest request );

  /* 연구과제 목록 조회 (instBrno 기준) */
  List<ResearchListRowVO> searchResearchListByPartner( @Param("instBrno") String instBrno, @Param("request") ResearchSearchRequest request );

  /* 연구과제 목록 조회 (instId 기준) */
  int count( @Param("instId") String instId, @Param("request") ResearchSearchRequest request );

  /* 연구과제 목록 조회 (instBrno 기준) */
  int countByPartner( @Param("instBrno") String instBrno, @Param("request") ResearchSearchRequest request );

  /* 연구과제 단건 조회 (asmtSn 기준) */
  ResearchAsmtDetailVO findById( @Param("asmtSn") Long asmtSn );

  /* 연구과제 등록 */
  void insert( TbCmMAsmtVO vo );

  /* 연구과제 수정 */
  void updateResearch( TbCmMAsmtVO vo );

  /* 연구과제 상태 수정 */
  void updateResearchStatus( @Param("asmtSn") Long asmtSn, @Param("asmtPrgrsSttsCd") String asmtPrgrsSttsCd, @Param("mdfrId") String mdfrId );

  /* 연구과제 마감 */
  void closeResearch( @Param("asmtSn") Long asmtSn, @Param("asmtPrgrsSttsCd") String asmtPrgrsSttsCd, @Param("asmtClsCn") String asmtClsCn, @Param("mdfrId") String mdfrId );

  /* 연구과제 삭제 */
  void deleteResearch( Long id );

  /* 참여기관 (등록/목록/단건/수정) */
  /* 연구과제 참여기관 등록 */
  void insertPartners( List<TbCmMAsmtPrcpVO> vos );

  /* 연구과제 연도별 참여기관 개수 조회 (instId 기준) */
  int countByYearAndInstId( @Param("year") int year, @Param("instId") String instId );

  /** 기관 과제 관리 (TB_PP_M_INST_TASK): brno + task_se_cd='CM' 1건 */
  TbPpMInstTaskVO findInstTaskByBrnoAndTaskSeCm( @Param("brno") String brno );

  /** 기관 부서 정보 (TB_PP_M_DEPT_INFO): dept_nm 기준 dept_no 1건 */
  String findDeptNoByDeptNm( @Param("deptNm") String deptNm );

  /** 기관 부서 정보(TB_PP_M_DEPT_INFO): dept_no 기준 dept_nm 조회(=기관명) */
  String findInstNmByDeptNo( @Param("deptNo") String deptNo );

  /** 기관 정보(TB_PP_M_INST): brno/instId 기준 inst_nm 조회 */
  String findInstNmByInstId( @Param("instId") String instId );

  /* 연구과제 참여기관 목록 조회 (asmtSn 기준) */
  List<ResearchPartnerVO> searchPartners( @Param("asmtSn") Long asmtSn, @Param("utlzAgreSeCd") String utlzAgreSeCd, @Param("asmtOpnnSttsCd") String asmtOpnnSttsCd );

  /** 과제 참여기관 조회 (기관아이디 조건 추가) */
  List<ResearchPartnerVO> searchPartnersByAsmtSnAndInstId( @Param("asmtSn") Long asmtSn, @Param("instId") String instId, @Param("utlzAgreSeCd") String utlzAgreSeCd, @Param("asmtOpnnSttsCd") String asmtOpnnSttsCd );

  /* 연구과제 참여기관 단건 조회 (asmtSn + asmtPtcpInstSn) */
  ResearchPartnerVO findPartnerById( @Param("asmtSn") Long asmtSn, @Param("asmtPtcpInstSn") Long asmtPtcpInstSn );

  /* 참여기관 단건 조회 (asmtSn + instId) */
  TbCmMAsmtPrcpVO findPartnerByAsmtSnAndInstId( @Param("asmtSn") Long asmtSn, @Param("instId") String instId );

  /* 참여기관 단건 조회 (asmtSn + asmtPtcpInstSn) */
  TbCmMAsmtPrcpVO findPartnerByAsmtSnAndPtcpInstSn( @Param("asmtSn") Long asmtSn, @Param("asmtPtcpInstSn") Long asmtPtcpInstSn );

  /* 참여기관 목록 조회 (asmtSn, 참여요청/미참여 제외) */
  List<TbCmMAsmtPrcpVO> findActivePartnersByAsmtSn( Long asmtSn );

  /* 참여기관 정보 수정 (asmt_ptcp_inst_sn 기준) */
  void updatePartner( TbCmMAsmtPrcpVO vo );

  /** 과제참여결과내역(TB_CM_E_ASMT_PRCP) asmt_ptcp_rslt_cn 업데이트 */
  void updateAsmtPrcpRsltCn( TbCmMAsmtPrcpVO vo );

  /** 과제참여결과내역(TB_CM_E_ASMT_PRCP) asmt_ptcp_rslt_cn 복수 건 일괄 업데이트 (동일 asmtSn, asmtPtcpInstSn 목록) */
  void updateAsmtPrcpRsltCnBatch( @Param("vos") List<TbCmMAsmtPrcpVO> vos );

  /* 분석 데이터 (목록/조회/등록/수정/상태체크) */
  /* 연구과제 분석 데이터 목록 조회 */
  List<TbCmEAsmtMetaVO> searchAnalysisData( @Param("asmtSn") Long asmtSn, @Param("rsltGroupStcd") String rsltGroupStcd, @Param("instId") String instId );

  /* 연구과제 분석 데이터 단건 조회 */
  TbCmEAsmtMetaVO findAnalysisDataById( @Param("asmtMetaRsltSn") Long asmtMetaRsltSn, @Param("rsltGroupStcd") String rsltGroupStcd );

  /* 연구과제 최신 분석 데이터 조회 (asmtSn 기준) */
  TbCmEAsmtMetaVO findLatestAnalysisDataByAsmtSn( @Param("asmtSn") Long asmtSn, @Param("rsltGroupStcd") String rsltGroupStcd );

  /* 연구과제 분석 데이터 등록 */
  void insertAnalysisData( TbCmEAsmtMetaVO vo );

  /* 연구과제 분석 데이터 수정 */
  void updateAnalysisData( TbCmEAsmtMetaVO vo );

  int countAnalysisDataNotInReviewStatus( @Param("asmtSn") Long asmtSn, @Param("rsltGroupStcd") String rsltGroupStcd, @Param("instId") String instId );

  /* 비CDM 참여기관 최신 분석 데이터 조회 (asmtSn + rsltGroupStcd 기준) */
  List<OrgPartnerLatestMetaVO> searchNonCdmPartnersWithLatestAnalysis( @Param("asmtSn") Long asmtSn, @Param("rsltGroupStcd") String rsltGroupStcd );

  /* 최신 분석 데이터 조회 (asmtSn 기준) */
  TbCmEAsmtMetaVO findLatestMetaAnalysisForStatusCheck( Long asmtSn );

  /* 최신 분석 데이터 조회 (asmtSn + rsltGroupStcd 기준) */
  TbCmEAsmtMetaVO findLatestMetaAnalysisByRsltGroupStcd( @Param("asmtSn") Long asmtSn, @Param("rsltGroupStcd") String rsltGroupStcd );

  /* 최신 분석 데이터 조회 (asmtSn 기준) */
  List<TbCmEAsmtMetaVO> findLatestOrgAnalysisForStatusCheck( Long asmtSn );

  /** asmtSn 목록에 대해 rsltGroupStcd별 과제당 최신 1건 조회 (02, 04용) */
  List<TbCmEAsmtMetaVO> findLatestMetaByRsltGroupStcdBatch( @Param("asmtSns") List<Long> asmtSns, @Param("rsltGroupStcd") String rsltGroupStcd );

  /** asmtSn 목록에 대해 rsltGroupStcd='03' 기관별 최신 조회 */
  List<TbCmEAsmtMetaVO> findLatestOrgAnalysisForStatusCheckBatch( @Param("asmtSns") List<Long> asmtSns );

  /*
   * asmtSn 목록 중 rslt_group_cd='01' 이면서 asmt_meta_rslt_stts_cd IN ('04','05') 인 메타가 있는 과제일련번호 목록 (의견 asmt_meta_rslt_sn으로
   * 메타와 연결)
   */
  List<Long> findAsmtSnsWithReviewInProgressBatch( @Param("asmtSns") List<Long> asmtSns );

  /* 의견 (목록/조회/등록/수정) */
  /* 연구과제 의견 목록 조회 (asmtMetaRsltSn + instId 기준) */
  TbCmEOpnnVO findOpinionByAsmtMetaRsltSnAndInstId( @Param("asmtMetaRsltSn") Long asmtMetaRsltSn, @Param("instId") String instId );

  /* 연구과제 의견 수 조회 (asmtMetaRsltSn + instId 기준) */
  int countOpinionByAsmtMetaRsltSnAndInstId( @Param("asmtMetaRsltSn") Long asmtMetaRsltSn, @Param("instId") String instId );

  /* 연구과제 의견 등록 */
  void insertOpinion( TbCmEOpnnVO vo );

  /* 연구과제 의견 수정 */
  void updateOpinion( TbCmEOpnnVO vo );

  List<TbCmEOpnnVO> searchOpinionDetailList( @Param("asmtSn") Long asmtSn, @Param("asmtMetaRsltSn") Long asmtMetaRsltSn, @Param("instId") String instId, @Param("rsltGroupStcd") String rsltGroupStcd );

  /** utlz_agre_se_cd 매칭; asmtOpnnSttsCd 비어 있지 않으면 tb_cm_e_opnn.asmt_opnn_stts_cd 로 추가 필터 */
  List<OpinionListRowVO> searchOpinionByUtlzAgreSeCd( @Param("asmtSn") Long asmtSn, @Param("instId") String instId, @Param("utlzAgreSeCd") String utlzAgreSeCd );

  List<OpinionListRowVO> searchOpinionByAsmtOpnnStatus( @Param("asmtSn") Long asmtSn, @Param("instId") String instId, @Param("asmtOpnnSttsCd") String asmtOpnnSttsCd );

  /** 의견 목록 (asmt_meta_rslt_sn, instIds, utlz_agre_se_cd; ULD 컬럼은 null로 반환 후 서비스에서 보강) */
  List<OpinionListRowVO> searchOpinionListForMeta( @Param("asmtSn") Long asmtSn, @Param("asmtMetaRsltSn") Long asmtMetaRsltSn, @Param("instIds") List<String> instIds, @Param("utlzAgreSeCd") String utlzAgreSeCd );

  /* ULD (최신 1건 조회) */
  /** instId(brno) 기준 최신 ULD_PRST 1건 (DRB pblntSn 조회용) */
  TbCmMUldPrstVO findLatestUldPrstByInstId( @Param("instId") String instId );

  /* 댓글 (thread) */
  // 과제 댓글
  List<CommentRowVO> selectComments( Long asmtSn );

  /** 같은 스레드 내 다음 cmnt_ans_sn (root면 orgnlUpCmntAnsSn null, 답글이면 root의 asmt_cmnt_sn) */
  Long nextCmntAnsSn( @Param("asmtSn") Long asmtSn, @Param("orgnlUpCmntAnsSn") Long orgnlUpCmntAnsSn );

  /* 과제 댓글 단건 조회 (asmtCmntSn 기준) */
  TbCmMAsmtCmntVO findCommentByAsmtCmntSn( Long asmtCmntSn );

  /* 과제 댓글 등록 */
  void insertComment( TbCmMAsmtCmntVO vo );

  /* 과제 댓글 수정 */
  void updateComment( TbCmMAsmtCmntVO vo );

  /* 과제 댓글 삭제 */
  void deleteComment( @Param("asmtCmntSn") Long asmtCmntSn, @Param("mdfrId") String mdfrId );

  /* 과제별 VDI/DB 계정 (조회/등록/수정/할당) */
  /** 과제별 VDI/DB 계정 목록 조회 */
  List<TbCmMAsmtAccountVO> searchAsmtAccounts();

  /** 과제 사용자 단건 조회 (PK) */
  TbCmMAsmtAccountVO findAsmtAccountById( Long asmtUserInfoSn );

  /** 과제일련번호 + 사용자구분코드로 과제 사용자 1건 조회 (분석 스키마 등) */
  TbCmMAsmtAccountVO findAsmtAccountByAsmtSnAndUserSeCd( @Param("asmtSn") Long asmtSn, @Param("userSeCd") String userSeCd );

  /** 과제 계정 등록 */
  void insertAsmtAccount( TbCmMAsmtAccountVO vo );

  /** 과제 계정 수정 */
  void updateAsmtAccount( TbCmMAsmtAccountVO vo );

  /** 과제 사용자 삭제 */
  void deleteAsmtAccount( Long asmtUserInfoSn );

  /** VDI/DB 계정 중 아직 어떤 과제에도 매핑되지 않은 계정 조회 (vdi/db 타입만) */
  List<TbCmMAsmtAccountVO> selectUnassignedAsmtAccountsForAssign();

  /** 특정 과제 사용자에 과제일련번호 매핑 */
  void assignAsmtSnToAccount( @Param("asmtUserInfoSn") Long asmtUserInfoSn, @Param("asmtSn") Long asmtSn );

  /* 담당자 (직원/과제담당자) */
  /** 담당자 드롭다운용 직원 목록 (dept_no IN) */
  List<EmpOptionVO> selectEmpInfoByDeptNos( @Param("deptNos") List<String> deptNos );

  /** 이메일 발송용 직원 정보 조회 (emp_no IN) */
  List<TbPpMEmpInfoVO> selectEmpInfoByEmpNos( @Param("empNos") List<String> empNos );

  /** 담당자 목록 (tb_cm_m_asmt_person + emp_nm, dept_no 조인) */
  List<AsmtPersonRowVO> selectAsmtPersonList();

  /** 담당자 등록 */
  void insertAsmtPerson( TbCmMAsmtPersonVO vo );

  /** 담당자 삭제 */
  void deleteAsmtPerson( @Param("personSn") Long personSn );

  /** 연구과제 마감 시 과제 사용자 계정 비활성화 (asmt_sn 매핑 해제 + use_yn = 'N') */
  void deactivateAsmtAccountsByAsmtSn( @Param("asmtSn") Long asmtSn, @Param("mdfrId") String mdfrId );

  /* 분석 데이터셋 복사 (cohort) */
  /** 분석 데이터셋 복사: cohort 조회 (기간·성별·복수 inst_task_sn). 소스 스키마는 서비스 레이어에서 kids_link_own 으로 고정·검증된다. */
  List<CohortRow> selectCohortForAnalysisDatasetByInstList( @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate, @Param("genderConceptId") Integer genderConceptId, @Param("instTaskSnList") java.util.List<String> instTaskSnList );
}
