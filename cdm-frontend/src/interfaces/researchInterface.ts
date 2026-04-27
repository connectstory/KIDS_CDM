import type { ApiResponse } from "./commonInterface";

// =====================================
// Research Types
// =====================================

/**
 * 연구과제 참여기관 기본 정보 (TbCmMAsmtPrcpVO)
 */
export interface AsmtPrcp {
  asmtPtcpInstSn: number | null; // 참여기관번호
  asmtSn: number | null; // 과제일련번호
  instId: string | null; // 기관아이디
  ptcpPrgrsSttsCd: string | null; // 참여진행상태코드
  asmtRqstrId: string | null; // 과제요청자아이디
  asmtDmndDt: string | null; // 과제요청일시
  asmtPtcpAgreId: string | null; // 과제참여동의아이디
  asmtPtcpAgreDt: string | null; // 과제참여동의일시
  asmtRsltRegId: string | null; // 과제결과등록아이디
  asmtRsltRegDt: string | null; // 과제결과등록일시
  asmtPtcpRtrcnId: string | null; // 과제참여취소등록아이디
  asmtPtcpRtrcnRsn: string | null; // 과제참여취소사유
  asmtPtcpRtrcnDt: string | null; // 과제참여취소일시
  delYn: string | null; // 삭제여부
  rgtrId: string | null; // 등록자아이디
  regDt: string | null; // 등록일자
  regPrgmId: string | null; // 등록프로그램아이디
  mdfrId: string | null; // 수정자아이디
  mdfcnDt: string | null; // 수정일자
  mdfcnPrgmId: string | null; // 수정프로그램아이디
  uldTypeCd: string | null; // 업로드유형코드
}

/**
 * 연구과제 상세 응답의 첨부파일 항목
 */
export interface ResearchFileItem {
  atchFileId: string;
  atchFileGroupId: string;
  fileNm: string;
  fileExtNm?: string;
  fileSz?: number;
}

/**
 * 연구과제 상세 응답
 */
export interface ResearchDetailResponse {
  asmtSn: number; // 과제일련번호
  asmtId: string; // 과제아이디
  asmtNm: string; // 과제명
  asmtArtclDtlCn: string | null; // 과제내용상세
  flfmtBgngDt: string | null; // 수행기간시작일시
  flfmtEndDt: string | null; // 수행기간종료일시
  instId: string; // 기관아이디
  instNm: string | null; // 기관명
  rgtrId: string; // 등록자아이디
  regDt: string | null; // 등록일시
  mdfrId: string | null; // 수정자아이디
  mdfcnDt: string | null; // 수정일시
  mbrEncptFlnm: string | null; // 회원암호화성명
  asmtMetaRsltSttsCd: string | null; // 과제메타결과상태코드
  asmtPrgrsSttsCd: string; // 과제진행상태코드
  asmtClsCn?: string | null; // 취소사유(과제마감내용)
  asmtPrcp: AsmtPrcp | null; // 과제참여기관정보
  fileList?: ResearchFileItem[]; // 첨부파일 목록
  analysisFileList?: ResearchFileItem[]; // 분석질의 파일 목록
}

/**
 * 과제메타결과 (TbCmEAsmtMetaVO)
 */
export interface AsmtMetaResultVO {
  asmtMetaRsltSn: number;
  asmtSn: number;
  asmtMetaRsltCn: string | null;
  asmtMetaRsltSttsCd: string | null;
  rsltGroupCd: string | null;
  rsltNotiDt: string | null;
  delYn: string | null;
  rgtrId: string | null;
  regDt: string | null;
  regPrgmId: string | null;
  mdfrId: string | null;
  mdfcnDt: string | null;
  mdfcnPrgmId: string | null;
  opnnCount: number | null;
  utlzAgreSeCd: string | null;
}

/**
 * 연구과제 목록 응답
 */
export interface ResearchListResponse {
  asmtSn: number; // 과제일련번호
  asmtId: string; // 과제아이디
  asmtPrgrsSttsCd: string; // 과제진행상태코드
  asmtNm: string; // 과제명
  flfmtBgngDt: string | null; // 수행기간시작일시
  flfmtEndDt: string | null; // 수행기간종료일시
  instId: string; // 기관아이디
  instNm: string | null; // 기관명
  /** 등록 부서명 (TB_PP_M_DEPT_INFO.dept_nm, 목록 조회 시 조인으로 채워질 수 있음) */
  deptNm?: string | null;
  metaAnalysisCount: number | null; // 메타분석개수
  rgtrId: string; // 등록자아이디
  delYn: string; // 삭제여부
  regDt: string | null; // 등록일시
  mdfrId: string | null; // 수정자아이디
  mdfcnDt: string | null; // 수정일시
  /** rsltGroupStcd='02' 통합분석 최신 1건 */
  latestMeta02: AsmtMetaResultVO | null;
  /** rsltGroupStcd='04' 메타분석 최신 1건 */
  latestMeta04: AsmtMetaResultVO | null;
  /** rsltGroupStcd='03' 기관별 최신 목록 */
  latestMeta03ByOrg: AsmtMetaResultVO[];
  /** 참여진행상태코드 (참여기관 목록 조회 시에만 채워짐) */
  ptcpPrgrsSttsCd?: string | null;
  /** 업로드유형코드 (파트너 과제 목록에서만 채워짐, 01=CDM, 02=현황) */
  uldTypeCd?: string | null;
  /** rslt_group_cd='01' 검토진행(약물역학/정보화) 상태 존재 여부 (관리자 목록에서만 채워짐) */
  reviewInProgress?: boolean | null;
}

/**
 * 연구과제 참여기관 응답
 */
export interface ResearchPartnerResponse {
  asmtPtcpInstSn: number; // 참여기관일련번호
  asmtSn: number; // 과제일련번호
  instId: string; // 기관아이디
  ptcpPrgrsSttsCd: string; // 참여진행상태코드
  asmtRqstrId: string | null; // 과제요청자아이디
  asmtDmndDt: string | null; // 과제요청일시
  asmtPtcpAgreId: string | null; // 과제참여동의아이디
  asmtPtcpAgreDt: string | null; // 과제참여동의일시
  asmtRsltRegId: string | null; // 과제결과등록아이디
  asmtRsltRegDt: string | null; // 과제결과등록일시
  asmtPtcpRtrcnId: string | null; // 과제참여철회아이디
  asmtPtcpRtrcnNm?: string | null; // 과제참여취소 등록자명
  asmtPtcpRtrcnRsn: string | null; // 과제참여철회사유
  asmtPtcpRtrcnDt: string | null; // 과제참여철회일시
  delYn: string; // 삭제여부
  rgtrId: string; // 등록자아이디
  regDt: string | null; // 등록일시
  mdfrId: string | null; // 수정자아이디
  mdfcnDt: string | null; // 수정일시
  uldInstPrgrsSttsStcd: string | null; // 업로드기관진행상태코드
  uldTypeCd: string | null; // 업로드유형코드
  instNm: string | null; // 기관명
  brno?: string | null; // 사업자등록번호 (inst_id와 동일할 수 있음)
  utlzAgreSeCd: string | null; // 활용동의구분코드
  uldFileCnt: number | null; // 업로드파일개수
  opnnAgreCnt: number | null; // 의견동의개수
  /** rslt_group_cd=04 메타 의견 중 asmt_opnn_stts_cd 일치 건수 (API에서 전달한 코드 기준) */
  opnnNotUseCnt: number | null;
  /** 해당 기관의 IRB 파일 목록 */
  irbFiles?: ResearchFileItem[];
}

/**
 * 협력기관 응답
 */
export interface PartnerResponse {
  instId: string; // 기관아이디
  instNm: string; // 기관명
  brno: string; // 사업자등록번호
}

// =====================================
// Research Request Types
// =====================================

/**
 * 연구과제 검색 요청
 */
export interface ResearchSearchRequest {
  progressStatus?: string; // 과제진행상태코드
  searchType?: string; // 검색 타입: "title", "content", "both"
  searchKeyword?: string; // 검색어
  searchStartDate?: string; // 검색시작일시
  searchEndDate?: string; // 검색종료일시
  page?: number; // 페이지 번호
  length?: number; // 페이지 크기
}

/**
 * 연구과제 생성 요청
 */
export interface ResearchCreateRequest {
  asmtNm: string; // 과제명
  asmtArtclDtlCn: string; // 과제내용상세
  flfmtBgngDt: string; // 수행기간시작일시
  flfmtEndDt: string; // 수행기간종료일시
  asmtPrcpInsttList: string[]; // 기관아이디 목록
}

/**
 * 연구과제 수정 요청
 */
export interface ResearchUpdateRequest {
  asmtNm: string; // 과제명
  asmtArtclDtlCn: string; // 과제내용상세
  flfmtBgngDt: string; // 수행기간시작일시
  flfmtEndDt: string; // 수행기간종료일시
  asmtPrcpInsttList?: string[]; // 기관아이디 목록
}

/**
 * 연구과제 생성 응답
 */
export interface ResearchCreateResponse {
  asmtSn: number; // 과제일련번호
}

// =====================================
// Analysis Data Types
// =====================================

/**
 * 분석 데이터 요청
 */
export interface AnalysisDataRequest {
  asmtMetaRsltCn: string; // 과제메타결과내용
  asmtMetaRsltSttsCd?: string; // 과제메타결과상태코드 (수정/상태 변경 시)
  rsltGroupCd: string; // 결과그룹코드
}

/**
 * 분석 데이터 응답
 */
export interface AnalysisDataResponse {
  asmtMetaRsltSn: number; // 과제메타결과일련번호
  asmtMetaRsltSttsCd: string; // 과제메타결과상태코드
  regDt: string | null; // 등록일시
  opinionList: OpinionListResponse[]; // 의견목록
  rsltGroupCd: string; // 결과그룹코드
  rsltNotiDt: string | null; // 결과알림일시
}

/**
 * 분석 데이터 상세 응답
 */
export interface AnalysisDataDetailResponse {
  asmtMetaRsltSn: number; // 과제메타결과일련번호
  asmtSn: number; // 과제일련번호
  asmtMetaRsltCn: string; // 과제메타결과내용
  rsltGroupCd: string; // 결과그룹코드
  asmtMetaRsltSttsCd: string | null; // 과제메타결과상태코드
  instId: string | null; // 기관아이디
  rgtrId: string; // 등록자아이디
  regDt: string | null; // 등록일시
  mdfrId: string | null; // 수정자아이디
  mdfcnDt: string | null; // 수정일시
  mbrEncptFlnm: string | null; // 회원암호화성명
  opinion: OpinionListResponse; // 의견 목록
  opinionList: OpinionListResponse[]; // 의견 목록
  rsltNotiDt: string | null; // 결과알림일시
  fileList?: ResearchFileItem[]; // 첨부파일 목록
  asmtUserFlnm01: string | null;
  asmtUserFlnm02: string | null;
  /** CDM·메타 분석 검토 대상 참여기관 수 (그 외 0) */
  totalVotePartnerCount: number;
}

/**
 * 메타분석 접근 가능 여부 응답
 */
export interface MetaAccessCheckResponse {
  canAccessMetaResult: boolean;
  denyReasonCode: "EXCLUDED" | "NOT_CONSENT" | null;
}

/**
 * 의견 요청
 */
export interface OpinionRequest {
  opnnIntgDmndCn: string | null; // 의견통합요청내용
  utlzAgreSeCd: string; // 검토결과코드 (tb_cm_e_opnn.utlz_agre_se_cd; 예: 06/07/08)
  asmtOpnnSttsCd: string; // 활용동의코드 (tb_cm_e_opnn.asmt_opnn_stts_cd; 01=동의, 02=미동의)
}

/**
 * 의견 목록 응답 (평면 구조, 기타 API에서 사용)
 */
export interface OpinionListResponse {
  opnnIntgRsltSn: number; // 의견통합결과일련번호
  asmtMetaRsltSn: number; // 과제메타결과일련번호
  asmtSn: number; // 과제일련번호
  instId: string; // 기관아이디
  instNm: string; // 기관명
  rsltGroupCd: string; // 결과그룹코드 (구 opnn_intg_se_cd 대체)
  opnnIntgDmndCn: string; // 의견통합요청내용
  utlzAgreSeCd: string; // 검토결과코드 (tb_cm_e_opnn.utlz_agre_se_cd)
  asmtOpnnSttsCd?: string | null; // 활용동의코드 (tb_cm_e_opnn.asmt_opnn_stts_cd; 01/02)
  rgtrId: string; // 등록자아이디
  regDt: string; // 등록일자
  mdfrId: string | null; // 수정자아이디
  mdfrNm: string | null; // 수정자명
  mdfcnDt: string | null; // 수정일자
  uldInstPrgrsSttsStcd?: string | null; // 데이터 업로드 상태코드
  uldTypeCd?: string | null; // 업로드유형코드
  // TbCmEOpnnVO 중첩 시 선택 필드
  mbrId?: string | null;
  mbrEncptFlnm?: string | null;
  empNm?: string | null;
  brno?: string | null;
  exprtHdofYn?: string | null;
}

/**
 * 의견 한 건 (기관/ULD 제외, 기관별 목록 내부용)
 */
export interface OpinionItemResponse {
  asmtSn: number;
  opnnIntgRsltSn: number;
  asmtMetaRsltSn: number;
  rsltGroupCd: string | null;
  opnnIntgDmndCn: string | null;
  utlzAgreSeCd: string | null; // 검토결과코드 (tb_cm_e_opnn.utlz_agre_se_cd)
  asmtOpnnSttsCd?: string | null; // 활용동의코드 (tb_cm_e_opnn.asmt_opnn_stts_cd; 01/02)
  rgtrId: string | null;
  regDt: string | null;
  mdfrNm: string | null;
  mdfrId: string | null;
  mdfcnDt: string | null;
}

/**
 * 기관 정보 + 해당 기관의 의견 목록 (의견 목록 조회 API 응답)
 */
export interface InstitutionWithOpinionsResponse {
  instId: string;
  instNm: string | null;
  uldInstPrgrsSttsStcd: string | null;
  uldTypeCd: string | null;
  opinions: OpinionItemResponse[];
}

/**
 * Non-CDM 기관 분석 데이터 응답
 */
export interface OrgAnalysisDataResponse {
  asmtPtcpInstSn: number; // 참여기관일련번호
  asmtSn: number; // 과제일련번호
  instId: string; // 기관아이디
  instNm: string | null; // 기관명
  uldTypeCd: string | null; // 업로드유형코드
  asmtMetaRsltSn: number | null; // 과제메타결과일련번호
  asmtMetaRsltCn: string | null; // 과제메타결과내용
  asmtMetaRsltSttsCd: string | null; // 과제메타결과상태코드
  rsltGroupCd: string | null; // 결과그룹코드
  regDt: string | null; // 등록일자
  opinionList: OpinionListResponse[]; // 의견 목록
}

/**
 * 과제별 VDI/DB 계정 응답
 */
export interface AsmtAccountResponse {
  sqAsmtAccountSn: number; // 과제계정일련번호
  vdiType: "vdi" | "db"; // 계정 유형
  vdiName: string; // 계정 이름
  asmtId: string | null; // 연결 연구과제 아이디 (vdi_asmt_sn이 있을 때)
  vdiIp: string | null; // 접속 IP
  vdiPort: string | null; // 접속 포트
  vdiUse: string | null; // 사용 용도/비고
}

/**
 * VDI/DB 계정 등록·수정 요청 (수정 시 비밀번호 비우면 기존 값 유지)
 */
export interface AsmtAccountRequest {
  vdiType: "vdi" | "db";
  vdiName: string;
  vdiPw?: string;
  vdiIp?: string;
  vdiPort?: string;
  vdiUse?: string;
}

/**
 * 담당자 드롭다운용 직원 옵션 (tb_pp_m_emp_info)
 */
export interface EmpOption {
  empNo: string;
  empNm: string | null;
  deptNo: string | null;
}

/**
 * 연구과제 담당자 목록 응답 (emp_nm, dept_no 포함)
 */
export interface AsmtPersonResponse {
  personSn: number;
  empNo: string;
  empNm: string | null;
  deptNo: string | null;
}

/**
 * 연구과제 담당자 등록 요청
 */
export interface AsmtPersonCreateRequest {
  personEmpNo: string;
}

/**
 * 참여취소 요청 (deprecated - PartnerActionRequest 사용)
 */
export interface CancelInviteRequest {
  asmtPtcpRtrcnRsn: string; // 과제참여철회사유
}

/**
 * 연구과제 마감 요청
 */
export interface CloseResearchRequest {
  asmtClsCn: string; // 과제마감내용
}

/**
 * 연구과제 취소 요청 (asmt_cls_cn: 취소 사유, asmt_cls_dt: 서버에서 저장)
 */
export interface CancelResearchRequest {
  asmtClsCn: string; // 과제마감내용(취소 사유)
}

// =====================================
// Comment Types
// =====================================

export interface ResearchCommentDto {
  asmtCmntSn: number; // 과제댓글일련번호
  asmtSn: number; // 과제일련번호
  instId: string; // 기관아이디 (사업자등록번호)
  instNm: string | null; // 기관명
  deptNm: string | null; // 부서명
  mbrNm: string | null; // 직원명
  empNm: string | null; // 직원명
  cmntDtlCn: string; // 댓글상세내용
  orgnlUpCmntAnsSn: number | null; // 원본상위댓글답변일련번호
  upCmntAnsSn: number | null; // 상위댓글답변일련번호
  cmntAnsDepth: number | null; // 댓글답변깊이
  cmntAnsSn: number | null; // 댓글답변일련번호(정렬용)
  delIndctYn?: string | null; // 삭제표시여부
  delYn?: string | null; // 삭제여부
  rgtrId: string; // 등록자아이디
  regDt: string | null; // 등록일시
  mdfrId: string | null; // 수정자아이디
  mdfcnDt: string | null; // 수정일시
}

export interface ResearchCommentCreateRequest {
  cmntDtlCn: string;
  upCmntAnsSn?: number | null;
}

export interface ResearchCommentUpdateRequest {
  cmntDtlCn: string;
}

/**
 * 참여기관 액션 요청 (승인/삭제 통합)
 */
export interface PartnerActionRequest {
  action: "approve" | "delete"; // "approve" 또는 "delete"
  asmtPtcpRtrcnRsn?: string; // 과제참여철회사유 (delete 시 필수)
}

/**
 * 참여기관 생성 요청
 */
export interface PartnerCreateRequest {
  asmtPrcpInsttList: string[]; // 기관아이디 목록
}

// =====================================
// API Response Types
// =====================================

/**
 * 연구과제 목록 API 응답
 */
export type ResearchListApiResponse = ApiResponse<ResearchListResponse[]>;

/**
 * 연구과제 상세 API 응답
 */
export type ResearchDetailApiResponse = ApiResponse<ResearchDetailResponse>;

/**
 * 연구과제 생성 API 응답
 */
export type ResearchCreateApiResponse = ApiResponse<ResearchCreateResponse>;

/**
 * 연구과제 참여기관 목록 API 응답
 */
export type ResearchPartnerListApiResponse = ApiResponse<ResearchPartnerResponse[]>;

/**
 * 연구과제 참여기관 단건 API 응답
 */
export type ResearchPartnerApiResponse = ApiResponse<ResearchPartnerResponse>;

/**
 * 협력기관 목록 API 응답
 */
export type PartnerListApiResponse = ApiResponse<PartnerResponse[]>;

/**
 * 분석 데이터 목록 API 응답
 */
export type AnalysisDataApiResponse = ApiResponse<AnalysisDataResponse>;

/**
 * 분석 데이터 상세 API 응답
 */
export type AnalysisDataDetailApiResponse = ApiResponse<AnalysisDataDetailResponse>;

/**
 * 분석 데이터 수정 API 응답
 */
export type AnalysisDataUpdateApiResponse = ApiResponse<{ asmtMetaRsltSn: number }>;

/**
 * 의견 목록 API 응답 (기관 기준)
 */
export type OpinionListApiResponse = ApiResponse<InstitutionWithOpinionsResponse[]>;

/**
 * 결과제외 의견 목록 API 응답 (`GET .../analysis-data/opinion`, 평면 배열)
 */
export type ExcludedOpinionListApiResponse = ApiResponse<OpinionListResponse[]>;

/**
 * Non-CDM 기관 분석 데이터 목록 API 응답
 */
export type OrgAnalysisDataApiResponse = ApiResponse<OrgAnalysisDataResponse[]>;

export type ResearchCommentsApiResponse = ApiResponse<ResearchCommentDto[]>;

/**
 * 과제별 VDI/DB 계정 목록 API 응답
 */
export type AsmtAccountListApiResponse = ApiResponse<AsmtAccountResponse[]>;

/**
 * 담당자 드롭다운용 직원 목록 API 응답
 */
export type EmpOptionListApiResponse = ApiResponse<EmpOption[]>;

/**
 * 담당자 목록 API 응답
 */
export type AsmtPersonListApiResponse = ApiResponse<AsmtPersonResponse[]>;

/** 분석 데이터셋 복사 결과: 테이블별 건수 */
export interface AnalysisDatasetCopyResult {
  tableName: string;
  rowCount: number;
}

/** 분석 데이터셋 복사 비동기 작업 응답 (202 또는 상태 조회) */
export interface AnalysisDatasetTaskResponse {
  taskId: string;
  status: string;
  message: string | null;
  copyResults: AnalysisDatasetCopyResult[] | null;
}
