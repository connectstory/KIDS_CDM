export const STRINGS = {
  CONFIRM: "확인",
  CANCEL: "취소",
  WARNING: "경고",
  ERROR: "에러",
  START_DATE: "시작일",
  END_DATE: "종료일",
  RUN: "진행",
  COMPLETED: "마감",
  NO: "번호",
  REGISTERED_INSTITUTION: "등록기관",
  REGISTERED_DEPARTMENT: "등록부서",
  RESEARCH_ID: "과제ID",
  RESEARCH_NAME: "과제명",
  RESEARCH_PERIOD: "연구기간",
  RESEARCH_STATUS: "과제상태",
  RESEARCH_RESULT: "연구결과",
  REGISTERED: "등록",
  CHECK_INFO: "정보확인",
  NOT_REGISTERED: "미등록",
  ANALYSIS_DATA_MANAGEMENT: "분석 DATASET 관리",
  ANALYSIS_DATA_MANAGEMENT_WRITE: "분석 데이터 등록",
  ANALYSIS_DATA_MANAGEMENT_DETAIL: "분석 데이터 상세",
  ANALYSIS_DATA_MANAGEMENT_REVIEW: "분석결과 검토",
  REGISTERED_BY: "등록자",
  REGISTERED_AT: "등록일시",
  DATA_UPLOAD_STATUS: "데이터 업로드 상태",
  CONTACT: "연락처",
  PARTNER: "참여기관",
  CANCEL_INVITE: "참여취소",
  INFO: "정보",
  PARTNER_STATUS: "참여상태",
  JOIN_DATE: "참여일시",
  STATUS: "상태",
  CONTENT: "내용",
  IRB: "IRB",
  DRB: "DRB",
  REQUEST_INVITE: "참여요청",
  COMPLETED_REGISTER: "등록완료",
  CDM: "CDM",
  NOT_CDM: "현황",
} as const;

export type StringKey = keyof typeof STRINGS;

export const MSG = {
  // confirm / success
  CONFIRM_DELETE: "삭제하시겠습니까?",
  SAVE_SUCCESS: "저장되었습니다.",
  SAVE_FAILED: "저장에 실패했습니다.",
  UNSAVED_CONTENT_CONFIRM: ["작성 중인 내용이 저장되지 않습니다.", "이동하시겠습니까?"],
  CONFIRM_CANCEL_INVITE: "참여취소하시겠습니까?",

  // common error
  ERROR_OCCURRED: "에러가 발생했습니다.",
  NETWORK_ERROR: "네트워크 연결이 불안정합니다.",
  BAD_REQUEST: "잘못된 요청입니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  FORBIDDEN: "권한이 없습니다.",
  NOT_FOUND: "요청한 리소스를 찾을 수 없습니다.",
  SERVER_ERROR: "서버 오류가 발생했습니다.",
  UNKNOWN_ERROR: "알 수 없는 오류가 발생했습니다.",
  INVALID_ACCESS: "잘 못 된 접근 입니다.",

  // form warning
  CONTENT_REQUIRED: "내용을 입력해주세요.",

  // research
  STATUS_NOT_FOUND: "잘 못 된 과제 상태입니다.",
  RESEARCH_NOT_FOUND: "연구과제 정보를 찾을 수 없습니다.",
  ANALYSIS_DATA_NOT_REGISTERED: "분석 데이터를 등록해주세요.",
  COMMENT_CONTENT_REQUIRED: "내용을 입력해주세요.",
  ANALYSIS_REQUEST_REVIEW: "검토 요청을 보내주세요.",
  ANALYSIS_REVIEW: "검토 요청을 해주세요.",

  // tooltip (조건부 액션 툴팁)
  TOOLTIP_CDM_REGISTER: "통합분석결과를 등록해주세요.",
  TOOLTIP_CDM_REVIEW: "통합분석결과 검토요청을 해주세요.",
  TOOLTIP_ORG_REGISTER: "기관 데이터 분석결과를 등록해주세요.",
  TOOLTIP_ORG_REVIEW: "기관 데이터 분석결과 검토요청을 해주세요.",
  TOOLTIP_META_REGISTER: "메타분석 후 연구결과에 분석결과를 등록해주세요.",
  TOOLTIP_DATASET_REGISTER: "분석 DATASET 등록해주세요.",
  TOOLTIP_DATASET_REQUEST_REVIEW: "분석 데이터 생성 및 접근권한을 위해 관리자에게 검토를 요청해주세요.",
  TOOLTIP_REVIEW_REGISTER: "분석결과 확인 후 검토 등록해주세요.",
} as const;

export type MessageKey = keyof typeof MSG;
