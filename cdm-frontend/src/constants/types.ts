import type { SxProps, Theme } from "@mui/material/styles";

//----------------------------------
// 공통 진행상태 타입
//----------------------------------
export const ProgressStatusType = {
  // ----- 연구 진행 단계 (과제 단위) -----
  REQUEST_INVITE: "requestInvite", // 참여요청
  IN_PROGRESS_ANALYSIS: "inprogressAnalysis", // 진행중(통합/기관분석)
  IN_PROGRESS_META: "inprogressMeta", // 진행중(메타분석)
  COMPLETED: "completed", // 마감

  // ----- 작성·요청·대기 -----
  REGISTERED: "registered", // 작성됨
  RE_REQUEST_INVITE: "reRequestInvite", // 참여재요청
  REQUEST_REVIEW: "requestReview", // 검토요청
  REQUEST_MODIFY: "requestModify", // 보완요청
  REQUEST_RE_UPLOAD: "requestReUpload", // 등록재요청
  AWAITING_RESPONSE: "awaitingResponse", // 답변대기

  // ----- 분석·검토 (진행/요청) - ResearchCdmStatus / ResearchPartnerStatus -----
  INTEGRATED_ANALYSIS_REVIEW_REQUEST: "integratedAnalysisReviewRequest", // 통합분석검토요청
  INSTITUTION_ANALYSIS_IN_PROGRESS: "institutionAnalysisInProgress", // 기관분석진행
  INSTITUTION_ANALYSIS_REVIEW_REQUEST: "institutionAnalysisReviewRequest", // 기관분석검토요청
  RESEARCH_RESULT_REVIEW_REQUEST: "researchResultReviewRequest", // 연구결과검토요청
  // ----- 분석·검토 (완료) -----
  INTEGRATED_ANALYSIS_REVIEW_COMPLETED: "integratedAnalysisReviewCompleted", // 통합분석검토완료
  RESEARCH_RESULT_REVIEW_COMPLETED: "researchResultReviewCompleted", // 연구결과검토완료
  INSTITUTION_ANALYSIS_REVIEW_COMPLETED: "institutionAnalysisReviewCompleted", // 기관분석검토완료
  INSTITUTION_ANALYSIS_MODIFY_REQUEST: "institutionAnalysisModifyRequest", // 기관분석보완요청
  CDM_ANALYSIS_MODIFY_REQUEST: "cdmAnalysisModifyRequest", // 통합분석보완요청
  INTEGRATED_ANALYSIS_RESULT_EXCLUDED: "integratedAnalysisResultExcluded", // 통합분석결과제외
  RESEARCH_RESULT_MODIFY_REQUEST: "researchResultModifyRequest", // 연구결과보완요청

  // ----- 참여·진행 -----
  APPROVAL_INVITE: "approvalInvite", // 참여
  IN_PROGRESS_REVIEW: "inprogressReview", // 검토진행
  INPROGRESS_REVIEW_DEPT1: "inprogressReviewDept1", // 검토진행(약물역학)
  INPROGRESS_REVIEW_DEPT2: "inprogressReviewDept2", // 검토진행(정보화)
  IN_PROGRESS: "inprogress", // 진행중
  PERFORM: "perform", // 수행

  // ----- 완료·승인 -----
  SUBMITTED: "submitted", // 결과제출
  APPROVAL_REVIEW: "approvalReview", // 검토완료
  APPROVAL: "approval", // 승인
  UPLOADED: "uploaded", // 등록
  RESPONSE_PROVIDED: "responseProvided", // 답변완료

  // ----- 거부·제외 -----
  CANCEL_INVITE: "cancelInvite", // 미참여
  EXCLUDED: "excluded", // 결과제외
  NOT_CONSENT: "notConsent", // 활용미동의
  REFUSE: "refuse", // 거부

  // ----- 비활성·기타 -----
  NOT_REGISTERED: "notRegistered", // 미등록
  CANCELLED: "cancelled", // 취소
} as const;
export type PROGRESS_STATUS_TYPE = (typeof ProgressStatusType)[keyof typeof ProgressStatusType];

//----------------------------------
// 연구과제 진행상태 타입
//----------------------------------
export const ResearchProgressStatus = {
  REQUEST_INVITE: "01",
  IN_PROGRESS_ANALYSIS: "02",
  IN_PROGRESS_META: "03",
  COMPLETED: "04",
  CANCELLED: "05",
} as const;

//----------------------------------
// CDM 협력기관 업로드 타입
//----------------------------------
export const CdmUploadType = {
  CDM: "01", // CDM
  NOT_CDM: "02", // 현황
} as const;
export type CDM_UPLOAD_STATUS = (typeof CdmUploadType)[keyof typeof CdmUploadType];

//----------------------------------
// 상태 칩 설정
//----------------------------------
export type StatusChipConfig = {
  label: string;
  chipStyle: SxProps<Theme>;
};

//----------------------------------
// 경로 파라미터 타입
//----------------------------------
export type PathParams = Record<string, string | number | undefined | null>;

//----------------------------------
// 에러 타입
//----------------------------------
export const HttpErrorType = {
  NETWORK_ERROR: "NETWORK_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  SERVER_ERROR: "SERVER_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;
export type HTTP_ERROR_TYPE = (typeof HttpErrorType)[keyof typeof HttpErrorType];

//----------------------------------
// 콘텐츠 간격 타입
//----------------------------------
export const CONTENT_GAP = {
  /** Typography 사이 */
  X2SMALL: 0.15,
  /** description 사이 */
  XSMALL: 0.5,
  /* form_container 밑에 버튼 영역 사이 */
  SMALL: 1,
  /** subtitle과 form_container 사이 */
  MEDIUM: 2,
  /** mainTitle과 content 사이 */
  LARGE: 5,
  /** section 사이 */
  XLARGE: 8,
};
export type CONTENT_GAP_TYPE = (typeof CONTENT_GAP)[keyof typeof CONTENT_GAP];

export const PAGINATION = {
  PAGE_SIZE: 10,
};

/* ------------------------------
 * 연구과제 참여기관(CDM) 상태코드 (ResearchPartnerStatus와 동일)
 * ------------------------------ */
export const ParticipationStatus = {
  INVITATION_REQUEST: "01", // 참여요청
  NOT_PARTICIPATING: "02", // 미참여
  PARTICIPATING: "03", // 참여
  INSTITUTION_ANALYSIS_IN_PROGRESS: "04", // 기관분석진행중
  INSTITUTION_ANALYSIS_REVIEW_REQUEST: "05", // 기관분석검토요청
  INSTITUTION_ANALYSIS_REVIEW_COMPLETED: "06", // 기관분석검토완료
  INSTITUTION_ANALYSIS_MODIFY_REQUEST: "07", // 기관분석보완요청
  INTEGRATED_ANALYSIS_RESULT_EXCLUDED: "08", // 통합분석결과제외
  RESEARCH_RESULT_REVIEW_REQUEST: "09", // 연구결과검토요청
  RESEARCH_RESULT_REVIEW_COMPLETED: "10", // 연구결과검토완료
  RESEARCH_COMPLETED: "11", // 연구과제마감
  RESEARCH_CANCEL: "12", // 연구과제취소
  RESEARCH_RESULT_MODIFY_REQUEST: "13", // 연구결과보완요청
} as const;

// 기존 명칭 호환(레거시): 실제 값은 ParticipationStatus 하나를 공유
export const ParticipationCdmStatus = ParticipationStatus;
export type PARTICIPATION_STATUS = (typeof ParticipationStatus)[keyof typeof ParticipationStatus];
export type PARTICIPATION_CDM_STATUS = PARTICIPATION_STATUS;

/* ------------------------------
 * 연구과제 참여기관(현황) 상태코드
 * ------------------------------ */
export const ParticipationOrgStatus = ParticipationStatus;
export type PARTICIPATION_ORG_STATUS = PARTICIPATION_STATUS;

/* ------------------------------
 * 인증/권한 구분 타입 (M: 관리자, E: 직원, U: 일반사용자)
 * ------------------------------ */
export type AuthrtType = "M" | "E" | "U";

/* ------------------------------
 * 사용자 권한 타입
 * ------------------------------ */
export const RoleType = {
  ADMIN: "A",
  PARTNER: "P",
  EMPLOYEE: "E",
} as const;

export type ROLE_TYPE = (typeof RoleType)[keyof typeof RoleType];

/* ------------------------------
 * 연구결과 그룹 상태코드
 * ------------------------------ */
export const RsltGroupStcdType = {
  ANALYSIS_DATA: "01",
  ANALYSIS_CDM: "02",
  ANALYSIS_ORG: "03",
  ANALYSIS_META: "04",
} as const;

export type RSLT_GROUP_STCD_TYPE = (typeof RsltGroupStcdType)[keyof typeof RsltGroupStcdType];

/* ------------------------------
 * 연구결과 상태코드
 * ------------------------------ */
export const AnalysisResultStatus = {
  SUBMITTED: "01",
  REQUEST_REVIEW: "02",
  INPROGRESS_REVIEW: "03",
  INPROGRESS_REVIEW_DEPT1: "04",
  INPROGRESS_REVIEW_DEPT2: "05",
  COMPLETED: "06",
  REQUEST_MODIFY: "07",
  EXCLUDED: "08",
  NOT_REGISTERED: "09",
  NOT_CONSENT: "10",
} as const;
export type ANALYSIS_RESULT_STATUS = (typeof AnalysisResultStatus)[keyof typeof AnalysisResultStatus];

/** 분석결과상태 중 "검토진행" 계열 (검토요청 후 검토완료/보완요청/제외 전) */
export const ANALYSIS_RESULT_REVIEW_IN_PROGRESS_CODES: readonly ANALYSIS_RESULT_STATUS[] = [
  AnalysisResultStatus.INPROGRESS_REVIEW,
  AnalysisResultStatus.INPROGRESS_REVIEW_DEPT1,
  AnalysisResultStatus.INPROGRESS_REVIEW_DEPT2,
];

/* ------------------------------
 * CDM 표준구분코드 (stdSeCd)
 * 01: 정확성 / 02: 완전성 / 03: 유일성 / 04: 일관성 / 05: 유효성
 * ------------------------------ */
export const StdSeCdType = {
  ACCURACY: "01", // 정확성
  COMPLETENESS: "02", // 완전성
  UNIQUENESS: "03", // 유일성
  CONSISTENCY: "04", // 일관성
  VALIDITY: "05", // 유효성
} as const;
export type STD_SE_CD_TYPE = (typeof StdSeCdType)[keyof typeof StdSeCdType];

export const DeptCodeType = {
  DRUG_ANALYSIS: "0000080", // 약물역학
  INFORMATION: "0000004", // 정보화
} as const;
export type DEPT_CODE_TYPE = (typeof DeptCodeType)[keyof typeof DeptCodeType];
