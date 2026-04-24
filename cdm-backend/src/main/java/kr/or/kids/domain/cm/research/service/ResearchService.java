package kr.or.kids.domain.cm.research.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.common.dto.CaFileItem;
import kr.or.kids.domain.cm.research.dto.AnalysisDatasetTaskResponse;
import kr.or.kids.domain.cm.research.dto.PartnerCreateRequest;
import kr.or.kids.domain.cm.research.dto.ResearchCreateRequest;
import kr.or.kids.domain.cm.research.dto.ResearchDetailResponse;
import kr.or.kids.domain.cm.research.dto.ResearchListResponse;
import kr.or.kids.domain.cm.research.dto.ResearchPartnerResponse;
import kr.or.kids.domain.cm.research.dto.ResearchSearchRequest;
import kr.or.kids.domain.cm.research.dto.ResearchUpdateRequest;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;

public interface ResearchService {

  // 연구과제 목록 조회 (관리자)
  List<ResearchListResponse> searchResearchListByAdmin( ResearchMemberVO memberAndInst, ResearchSearchRequest request );

  // 연구과제 목록 조회 (파트너)
  List<ResearchListResponse> searchResearchListByPartner( ResearchMemberVO memberAndInst, ResearchSearchRequest request );

  // 연구과제 개수 조회 (관리자)
  int countByAdmin( ResearchMemberVO memberAndInst, ResearchSearchRequest request );

  // 연구과제 개수 조회 (파트너)
  int countByPartner( ResearchMemberVO memberAndInst, ResearchSearchRequest request );

  // 연구과제 상세 조회
  ResearchDetailResponse findResearchDetailById( ResearchMemberVO memberAndInst, Long id );

  // 연구과제 등록 (files: 첨부파일, analysisFiles: 분석질의, 각각 null 가능)
  Long createResearch( ResearchMemberVO memberAndInst, ResearchCreateRequest request, List<MultipartFile> files, List<MultipartFile> analysisFiles );

  // 연구과제 수정 (deleteFileIds, files, analysisFiles null 가능, mdfrId는 파일 처리 시 사용)
  void updateResearch( Long id, ResearchUpdateRequest request, List<String> deleteFileIds, List<MultipartFile> files, List<MultipartFile> analysisFiles, String mdfrId );

  // 연구과제 삭제
  void deleteResearch( Long id );

  // 참여기관 목록 조회
  List<ResearchPartnerResponse> searchPartners( ResearchMemberVO memberAndInst, Long asmtSn );

  // 참여기관 조회
  ResearchPartnerResponse findPartnerById( Long asmtSn, String asmtPtcpInstSn );

  // 참여기관 정보 저장
  void createPartners( ResearchMemberVO memberAndInst, Long asmtSn, PartnerCreateRequest request );

  // 참여기관 참여취소
  void cancelInvitePartner( ResearchMemberVO memberAndInst, Long asmtSn, String asmtPtcpInstSn, String asmtPtcpRtrcnRsn );

  // 참여기관 참여승인
  void approveInvitePartner( ResearchMemberVO memberAndInst, Long asmtSn, String asmtPtcpInstSn, String asmtPtcpRtrcnRsn );

  // 연구과제 상태 변경
  void updateResearchStatus( ResearchMemberVO memberAndInst, Long asmtSn, String asmtPrgrsSttsCd );

  // 연구과제 마감
  void closeResearch( ResearchMemberVO memberAndInst, Long asmtSn, String asmtClsCn );

  // 연구과제 취소
  void cancelResearch( ResearchMemberVO memberAndInst, Long asmtSn, String asmtClsCn );


  /** IRB/DRB 파일 업로드 (uld_task_se_cd=01, file_se_cd=05) */
  void uploadIrbFiles( ResearchMemberVO memberAndInst, Long asmtSn, List<MultipartFile> files );

  /** IRB 파일 삭제 (현재 사용자 업로드분만, DRB는 삭제 불가) */
  void deleteIrbFile( ResearchMemberVO memberAndInst, Long asmtSn, String atchFileId );

  /** 참여기관 공유파일 업로드 (uld_task_se_cd=01, file_se_cd=17, pst_sn+ptcp_inst_sn 기준) */
  void uploadPartnerFiles( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtPtcpInstSn, List<MultipartFile> files );

  /** 참여기관 공유파일 삭제 (file_se_cd=17, asmtSn + asmtPtcpInstSn + atchFileId 기준) */
  void deletePartnerFile( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtPtcpInstSn, String atchFileId );

  /** 연구과제 등록자/관리자 첨부파일 업로드 (file_se_cd=19) */
  void uploadAdminFiles( ResearchMemberVO memberAndInst, Long asmtSn, List<MultipartFile> files );

  /** 연구과제 등록자/관리자 첨부파일 삭제 (file_se_cd=19, asmtSn + atchFileId 기준) */
  void deleteAdminFile( ResearchMemberVO memberAndInst, Long asmtSn, String atchFileId );

  /** 연구과제 파일 목록 조회 (uldTaskSeCd=01, fileSeCd 필터). ptcpInstSn 있으면 해당 참여기관 IRB만, 없으면 현재 사용자 기준 */
  List<CaFileItem> findFilesByTaskAndFileSeCd( ResearchMemberVO memberAndInst, Long asmtSn, String uldTaskSeCd, String fileSeCd, Long ptcpInstSn );

  /** 분석 데이터셋 조건 기반 복사 비동기 제출 (202 + taskId). 복사 완료 시 asmtSn/mbrId로 과제 진행 상태 변경 */
  AnalysisDatasetTaskResponse submitAnalysisDatasetCopy( Long asmtSn, String mbrId );

  /** 분석 데이터셋 복사 작업 상태 조회 */
  AnalysisDatasetTaskResponse getAnalysisDatasetTaskStatus( String taskId );
}
