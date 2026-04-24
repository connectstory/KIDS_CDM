import { STRINGS } from "@/constants/string";
import type { PROGRESS_STATUS_TYPE, PathParams, StatusChipConfig } from "@/constants/types";
import {
  AnalysisResultStatus,
  ParticipationCdmStatus,
  ParticipationOrgStatus,
  ProgressStatusType,
  StdSeCdType,
} from "@/constants/types";

/* ------------------------------
 * 상태 칩 공통 색상 (배경, 텍스트)
 * ------------------------------ */
export const CHIP_COLORS = {
  /* ------------------------------
   * 🟡 요청/대기 - 작성됨
   * ------------------------------ */
  yellowRegistered: { bg: "#F5F3FF", text: "#5B21B6" }, // { bg: "#FEF7E0", text: "#B26A00" }
  /* ------------------------------
   * 🟡 요청/대기 - 참여·검토·보완 등
   * ------------------------------ */
  yellowRequest: { bg: "#FEF7E0", text: "#B26A00" }, // { bg: "#F5F3FF", text: "#5B21B6" },
  /* ------------------------------
   * 🟠 수정 요청 (보완·재요청·답변대기)
   * ------------------------------ */
  yellowModifyRequest: { bg: "#FFF7ED", text: "#C2410C" },
  /* ------------------------------
   * 🔵 진행중
   * ------------------------------ */
  blueProgress: { bg: "#E8F0FE", text: "#1A73E8" },
  /* ------------------------------
   * 🟢 완료/승인
   * ------------------------------ */
  greenComplete: { bg: "#E6F4EA", text: "#1E7F43" },
  /* ------------------------------
   * 🔴 거부/취소/제외
   * ------------------------------ */
  redReject: { bg: "#FDECEA", text: "#D93025" },
  /* ------------------------------
   * ⚪ 비활성/마감
   * ------------------------------ */
  grayInactive: { bg: "#F1F3F4", text: "#454545" },
} as const;

/* ------------------------------
 * hex 배경색을 살짝 진하게 해서 hover용으로 사용
 * ------------------------------ */
function darkenBgHex(hex: string, amount = 0): string {
  const n = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function chipStyleWithHover(colors: { bg: string; text: string }) {
  return {
    bgcolor: colors.bg,
    color: colors.text,
    border: `1px solid transparent`,
    transition: "border 0.3s ease, background-color 0.2s ease",
    fontWeight: 500,
    "&:hover": {
      bgcolor: `${darkenBgHex(colors.bg)} !important`,
      border: `1px solid ${colors.text}`,
    },
  };
}

export const StatusMap: Record<PROGRESS_STATUS_TYPE, StatusChipConfig> = {
  // ----- 연구 진행 단계 (과제 단위) -----
  requestInvite: {
    label: "참여요청",
    chipStyle: chipStyleWithHover(CHIP_COLORS.yellowRequest),
  },
  inprogressAnalysis: {
    label: "진행중(통합/기관분석)",
    chipStyle: chipStyleWithHover(CHIP_COLORS.blueProgress),
  },
  inprogressMeta: {
    label: "진행중(메타분석)",
    chipStyle: chipStyleWithHover(CHIP_COLORS.blueProgress),
  },
  completed: {
    label: "마감",
    chipStyle: chipStyleWithHover(CHIP_COLORS.grayInactive),
  },

  // ----- 작성·요청·대기 -----
  registered: {
    label: "작성됨",
    chipStyle: chipStyleWithHover(CHIP_COLORS.yellowRegistered),
  },
  requestReview: {
    label: "검토요청",
    chipStyle: chipStyleWithHover(CHIP_COLORS.yellowRequest),
  },
  institutionAnalysisReviewRequest: {
    label: "기관분석검토요청",
    chipStyle: chipStyleWithHover(CHIP_COLORS.yellowRequest),
  },
  integratedAnalysisReviewRequest: {
    label: "통합분석검토요청",
    chipStyle: chipStyleWithHover(CHIP_COLORS.blueProgress),
  },
  researchResultReviewRequest: {
    label: "연구결과검토요청",
    chipStyle: chipStyleWithHover(CHIP_COLORS.yellowRequest),
  },

  // ----- 수정 요청 -----
  reRequestInvite: {
    label: "참여재요청",
    chipStyle: chipStyleWithHover(CHIP_COLORS.yellowModifyRequest),
  },
  requestModify: {
    label: "보완요청",
    chipStyle: chipStyleWithHover(CHIP_COLORS.yellowModifyRequest),
  },
  requestReUpload: {
    label: "등록재요청",
    chipStyle: chipStyleWithHover(CHIP_COLORS.yellowModifyRequest),
  },
  awaitingResponse: {
    label: "답변대기",
    chipStyle: chipStyleWithHover(CHIP_COLORS.yellowModifyRequest),
  },
  institutionAnalysisModifyRequest: {
    label: "기관분석보완요청",
    chipStyle: chipStyleWithHover(CHIP_COLORS.yellowModifyRequest),
  },
  cdmAnalysisModifyRequest: {
    label: "통합분석보완요청",
    chipStyle: chipStyleWithHover(CHIP_COLORS.yellowModifyRequest),
  },
  researchResultModifyRequest: {
    label: "연구결과보완요청",
    chipStyle: chipStyleWithHover(CHIP_COLORS.yellowModifyRequest),
  },

  // ----- 분석·검토 (진행/요청) - ResearchCdmStatus / ResearchPartnerStatus -----
  institutionAnalysisInProgress: {
    label: "기관분석진행중",
    chipStyle: chipStyleWithHover(CHIP_COLORS.blueProgress),
  },
  // ----- 분석·검토 (완료) -----
  integratedAnalysisReviewCompleted: {
    label: "통합분석검토완료",
    chipStyle: chipStyleWithHover(CHIP_COLORS.greenComplete),
  },
  researchResultReviewCompleted: {
    label: "연구결과검토완료",
    chipStyle: chipStyleWithHover(CHIP_COLORS.greenComplete),
  },
  institutionAnalysisReviewCompleted: {
    label: "기관분석검토완료",
    chipStyle: chipStyleWithHover(CHIP_COLORS.greenComplete),
  },

  // ----- 참여·진행 -----
  approvalInvite: {
    label: "참여",
    chipStyle: chipStyleWithHover(CHIP_COLORS.blueProgress),
  },
  inprogressReview: {
    label: "검토진행",
    chipStyle: chipStyleWithHover(CHIP_COLORS.blueProgress),
  },
  inprogressReviewDept1: {
    label: "검토진행(약물역학)",
    chipStyle: chipStyleWithHover(CHIP_COLORS.blueProgress),
  },
  inprogressReviewDept2: {
    label: "검토진행(정보화)",
    chipStyle: chipStyleWithHover(CHIP_COLORS.blueProgress),
  },
  inprogress: {
    label: "진행중",
    chipStyle: chipStyleWithHover(CHIP_COLORS.blueProgress),
  },
  perform: {
    label: "수행",
    chipStyle: chipStyleWithHover(CHIP_COLORS.blueProgress),
  },

  // ----- 완료·승인 -----
  submitted: {
    label: "결과제출",
    chipStyle: chipStyleWithHover(CHIP_COLORS.greenComplete),
  },
  approvalReview: {
    label: "검토완료",
    chipStyle: chipStyleWithHover(CHIP_COLORS.greenComplete),
  },
  approval: {
    label: "승인",
    chipStyle: chipStyleWithHover(CHIP_COLORS.greenComplete),
  },
  uploaded: {
    label: "등록",
    chipStyle: chipStyleWithHover(CHIP_COLORS.greenComplete),
  },
  responseProvided: {
    label: "답변완료",
    chipStyle: chipStyleWithHover(CHIP_COLORS.greenComplete),
  },

  // ----- 거부·제외 -----
  cancelInvite: {
    label: "미참여",
    chipStyle: chipStyleWithHover(CHIP_COLORS.redReject),
  },
  excluded: {
    label: "결과제외",
    chipStyle: chipStyleWithHover(CHIP_COLORS.redReject),
  },
  notConsent: {
    label: "활용미동의",
    chipStyle: chipStyleWithHover(CHIP_COLORS.redReject),
  },
  integratedAnalysisResultExcluded: {
    label: "통합분석결과제외",
    chipStyle: chipStyleWithHover(CHIP_COLORS.redReject),
  },
  refuse: {
    label: "거부",
    chipStyle: chipStyleWithHover(CHIP_COLORS.redReject),
  },

  // ----- 비활성·기타 -----
  notRegistered: {
    label: "미등록",
    chipStyle: chipStyleWithHover(CHIP_COLORS.grayInactive),
  },
  cancelled: {
    label: "취소",
    chipStyle: chipStyleWithHover(CHIP_COLORS.grayInactive),
  },
};

/* ------------------------------
 * 프론트 상태 키로 칩 설정 조회
 * ------------------------------ */
export function getStatusConfig(statusKey: PROGRESS_STATUS_TYPE): StatusChipConfig | undefined {
  return StatusMap[statusKey];
}

/* ------------------------------
 * 서버 코드를 프론트엔드 코드로 변환하는 매핑 | DisclosureStatus: uld_inst_prgrs_stts_stcd (공시진행상태코드)
 * ------------------------------ */

/*
01	참여요청
02	진행중
03	완료
04	참여취소
05	등록
06	참여재요청
07	등록재요청
*/

export const DisclosureStatusMap: Record<string, PROGRESS_STATUS_TYPE> = {
  "00": ProgressStatusType.REGISTERED, // 최초공시된 상태
  "01": ProgressStatusType.REQUEST_INVITE, // 참여요청
  "02": ProgressStatusType.IN_PROGRESS, // 진행중
  "03": ProgressStatusType.COMPLETED, // 완료
  "04": ProgressStatusType.CANCEL_INVITE, // 참여취소
  "05": ProgressStatusType.APPROVAL, // 등록
  "06": ProgressStatusType.RE_REQUEST_INVITE, // 참여재요청
  "07": ProgressStatusType.REQUEST_RE_UPLOAD, // 등록재요청
};

/* ------------------------------
 * 서버 코드를 프론트엔드 코드로 변환하는 매핑 | ResearchStatus: asmtPrgrsSttsCd (과제진행상태코드)
 * ------------------------------ */
const CdmStatusMap: Record<string, PROGRESS_STATUS_TYPE> = {
  "01": ProgressStatusType.REQUEST_INVITE, // 참여요청
  "02": ProgressStatusType.IN_PROGRESS, // 진행중
  "03": ProgressStatusType.COMPLETED, // 완료
};

/* ------------------------------
 * 서버의 ResearchStatus 코드("01", "02", "03")를 프론트엔드 코드로 변환
 * ------------------------------ */
export function convertCdmStatus(serverCode: string | null | undefined): PROGRESS_STATUS_TYPE {
  if (!serverCode) return ProgressStatusType.REQUEST_INVITE;
  return CdmStatusMap[serverCode.trim()] || (serverCode as PROGRESS_STATUS_TYPE);
}

/* ------------------------------
 * 서버 코드를 프론트엔드 코드로 변환하는 매핑 | ResearchStatus: asmtPrgrsSttsCd (과제진행상태코드)
 * ------------------------------ */
const ResearchStatusMap: Record<string, PROGRESS_STATUS_TYPE> = {
  "01": ProgressStatusType.REQUEST_INVITE, // 참여요청
  "02": ProgressStatusType.IN_PROGRESS_ANALYSIS, // 진행중(통합/기관분석)
  "03": ProgressStatusType.IN_PROGRESS_META, // 진행중(메타분석)
  "04": ProgressStatusType.COMPLETED, // 완료
  "05": ProgressStatusType.CANCELLED, // 취소
};

/* ------------------------------
 * 서버의 ResearchStatus 코드("01", "02", "03")를 프론트엔드 코드로 변환
 * ------------------------------ */
export function convertResearchStatus(serverCode: string | null | undefined): PROGRESS_STATUS_TYPE {
  if (!serverCode) return ProgressStatusType.REQUEST_INVITE;
  return ResearchStatusMap[serverCode.trim()] || (serverCode as PROGRESS_STATUS_TYPE);
}

/* ------------------------------
 * 연구과제 마감/취소 상태에서 CRUD 비활성화 여부
 * ------------------------------ */
export function isResearchCrudDisabled(status: string | null | undefined): boolean {
  return status === ProgressStatusType.CANCELLED || status === ProgressStatusType.COMPLETED;
}

/* ------------------------------
 * 서버 코드를 프론트엔드 코드로 변환하는 매핑 | ResearchStatus: asmtPrgrsSttsCd (과제진행상태코드)
 * ------------------------------ */
const ResearchAnalysisStatusMap: Record<string, PROGRESS_STATUS_TYPE> = {
  "01": ProgressStatusType.SUBMITTED, // 결과제출
  "02": ProgressStatusType.REQUEST_REVIEW, // 검토요청
  "03": ProgressStatusType.IN_PROGRESS_REVIEW, // 검토진행
  "04": ProgressStatusType.INPROGRESS_REVIEW_DEPT1, // 검토진행(약물역학)
  "05": ProgressStatusType.INPROGRESS_REVIEW_DEPT2, // 검토진행(정보화)
  "06": ProgressStatusType.APPROVAL_REVIEW, // 검토완료
  "07": ProgressStatusType.REQUEST_MODIFY, // 보완요청
  "08": ProgressStatusType.EXCLUDED, // 결과제외
  "09": ProgressStatusType.NOT_REGISTERED, // 미등록
  "10": ProgressStatusType.NOT_CONSENT, // 활용미동의
};

/* ------------------------------
 * 서버의 ResearchStatus 코드("01", "02", "03")를 프론트엔드 코드로 변환
 * ------------------------------ */
export function convertResearchAnalysisStatus(serverCode: string | null | undefined): PROGRESS_STATUS_TYPE {
  if (!serverCode) return ProgressStatusType.NOT_REGISTERED;
  return ResearchAnalysisStatusMap[serverCode.trim()] || (serverCode as PROGRESS_STATUS_TYPE);
}

/* ------------------------------
 * 서버 코드를 프론트엔드 코드로 변환하는 매핑 | CdmUploadStatus: uldInstPrgrsSttsStcd (데이터 업로드 상태코드)
 * ------------------------------ */
export const CdmUploadStatus: Record<string, string> = {
  "01": STRINGS.CDM, // CDM
  "02": STRINGS.NOT_CDM, // 현황
};

const QnaStatusMap: Record<string, PROGRESS_STATUS_TYPE> = {
  "01": ProgressStatusType.AWAITING_RESPONSE,
  "02": ProgressStatusType.RESPONSE_PROVIDED,
};

export function convertQnaStatus(serverCode: string | null | undefined): PROGRESS_STATUS_TYPE {
  if (!serverCode) return ProgressStatusType.AWAITING_RESPONSE;
  return QnaStatusMap[serverCode.trim()] || ProgressStatusType.AWAITING_RESPONSE;
}

const PblntPrgrsStatusMap: Record<string, PROGRESS_STATUS_TYPE> = {
  "01": ProgressStatusType.UPLOADED,
  "02": ProgressStatusType.IN_PROGRESS,
  "03": ProgressStatusType.COMPLETED,
};

export function convertPblntPrgrsStatus(serverCode: string | null | undefined): PROGRESS_STATUS_TYPE {
  if (!serverCode) return ProgressStatusType.UPLOADED;
  return PblntPrgrsStatusMap[serverCode.trim()] || ProgressStatusType.UPLOADED;
}

/* ------------------------------
 * 서버 코드를 프론트엔드 코드로 변환하는 매핑 | ResearchPartnerStatus (참여기관 CDM 상태코드)
 * ------------------------------ */
const ParticipationCdmStatusMap: Record<string, PROGRESS_STATUS_TYPE> = {
  [ParticipationCdmStatus.INVITATION_REQUEST]: ProgressStatusType.REQUEST_INVITE, // 참여요청
  [ParticipationCdmStatus.NOT_PARTICIPATING]: ProgressStatusType.CANCEL_INVITE, // 미참여
  [ParticipationCdmStatus.PARTICIPATING]: ProgressStatusType.APPROVAL_INVITE, // 참여
  [ParticipationCdmStatus.INSTITUTION_ANALYSIS_IN_PROGRESS]: ProgressStatusType.INSTITUTION_ANALYSIS_IN_PROGRESS, // 기관분석진행중
  [ParticipationCdmStatus.INSTITUTION_ANALYSIS_REVIEW_REQUEST]: ProgressStatusType.INTEGRATED_ANALYSIS_REVIEW_REQUEST, // 기관분석검토요청
  [ParticipationCdmStatus.INSTITUTION_ANALYSIS_REVIEW_COMPLETED]: ProgressStatusType.INTEGRATED_ANALYSIS_REVIEW_COMPLETED, // 기관분석검토완료
  [ParticipationCdmStatus.INSTITUTION_ANALYSIS_MODIFY_REQUEST]: ProgressStatusType.CDM_ANALYSIS_MODIFY_REQUEST, // 기관분석보완요청
  [ParticipationCdmStatus.INTEGRATED_ANALYSIS_RESULT_EXCLUDED]: ProgressStatusType.EXCLUDED, // 결과제외
  [ParticipationCdmStatus.RESEARCH_RESULT_REVIEW_REQUEST]: ProgressStatusType.RESEARCH_RESULT_REVIEW_REQUEST, // 연구결과검토요청
  [ParticipationCdmStatus.RESEARCH_RESULT_REVIEW_COMPLETED]: ProgressStatusType.RESEARCH_RESULT_REVIEW_COMPLETED, // 연구결과검토완료
  [ParticipationCdmStatus.RESEARCH_RESULT_MODIFY_REQUEST]: ProgressStatusType.RESEARCH_RESULT_MODIFY_REQUEST, // 연구결과보완요청
  [ParticipationCdmStatus.RESEARCH_COMPLETED]: ProgressStatusType.COMPLETED, // 연구과제마감
  [ParticipationCdmStatus.RESEARCH_CANCEL]: ProgressStatusType.CANCELLED, // 연구과제취소
};

/* ------------------------------
 * 서버의 ResearchCdmStatus 코드를 프론트엔드 코드로 변환
 * ------------------------------ */
export function convertCdmParticipationStatus(serverCode: string | null | undefined): PROGRESS_STATUS_TYPE {
  if (!serverCode) return ProgressStatusType.REQUEST_INVITE;
  return ParticipationCdmStatusMap[serverCode.trim()] || (serverCode as PROGRESS_STATUS_TYPE);
}

/* ------------------------------
 * 서버 코드를 프론트엔드 코드로 변환하는 매핑 | ResearchPartnerStatus (참여기관상태코드)
 * ------------------------------ */
const ParticipationOrgStatusMap: Record<string, PROGRESS_STATUS_TYPE> = {
  [ParticipationOrgStatus.INVITATION_REQUEST]: ProgressStatusType.REQUEST_INVITE, // 참여요청
  [ParticipationOrgStatus.NOT_PARTICIPATING]: ProgressStatusType.CANCEL_INVITE, // 미참여
  [ParticipationOrgStatus.PARTICIPATING]: ProgressStatusType.APPROVAL_INVITE, // 참여
  [ParticipationOrgStatus.INSTITUTION_ANALYSIS_IN_PROGRESS]: ProgressStatusType.INSTITUTION_ANALYSIS_IN_PROGRESS, // 기관분석진행중
  [ParticipationOrgStatus.INSTITUTION_ANALYSIS_REVIEW_REQUEST]: ProgressStatusType.INSTITUTION_ANALYSIS_REVIEW_REQUEST, // 기관분석검토요청
  [ParticipationOrgStatus.INSTITUTION_ANALYSIS_REVIEW_COMPLETED]: ProgressStatusType.INSTITUTION_ANALYSIS_REVIEW_COMPLETED, // 기관분석검토완료
  [ParticipationOrgStatus.INSTITUTION_ANALYSIS_MODIFY_REQUEST]: ProgressStatusType.INSTITUTION_ANALYSIS_MODIFY_REQUEST, // 기관분석보완요청
  [ParticipationOrgStatus.RESEARCH_RESULT_REVIEW_REQUEST]: ProgressStatusType.RESEARCH_RESULT_REVIEW_REQUEST, // 연구결과검토요청
  [ParticipationOrgStatus.RESEARCH_RESULT_REVIEW_COMPLETED]: ProgressStatusType.RESEARCH_RESULT_REVIEW_COMPLETED, // 연구결과검토완료
  [ParticipationOrgStatus.RESEARCH_RESULT_MODIFY_REQUEST]: ProgressStatusType.RESEARCH_RESULT_MODIFY_REQUEST, // 연구결과보완요청
  [ParticipationOrgStatus.RESEARCH_COMPLETED]: ProgressStatusType.COMPLETED, // 연구과제마감
  [ParticipationOrgStatus.RESEARCH_CANCEL]: ProgressStatusType.CANCELLED, // 연구과제취소
};

/* ------------------------------
 * 서버의 ResearchPartnerStatus 코드를 프론트엔드 코드로 변환
 * ------------------------------ */
export function convertOrgParticipationStatus(serverCode: string | null | undefined): PROGRESS_STATUS_TYPE {
  if (!serverCode) return ProgressStatusType.REQUEST_INVITE;
  return ParticipationOrgStatusMap[serverCode.trim()] || (serverCode as PROGRESS_STATUS_TYPE);
}

/* ------------------------------
 * 서버 코드 → 변환 → 칩 설정 한 번에 조회 (과제진행상태 asmtPrgrsSttsCd)
 * ------------------------------ */
export function getResearchStatusConfig(serverCode: string | null | undefined): StatusChipConfig | undefined {
  return getStatusConfig(convertResearchStatus(serverCode));
}

/* ------------------------------
 * 서버 코드 → 변환 → 칩 설정 한 번에 조회 (QnA 상태)
 * ------------------------------ */
export function getQnaStatusConfig(serverCode: string | null | undefined): StatusChipConfig | undefined {
  return getStatusConfig(convertQnaStatus(serverCode));
}

/* ------------------------------
 * 서버 코드 → 변환 → 칩 설정 한 번에 조회 (참여진행상태 ptcpPrgrsSttsCd)
 * ------------------------------ */
export function getPblntPrgrsStatusConfig(serverCode: string | null | undefined): StatusChipConfig | undefined {
  return getStatusConfig(convertPblntPrgrsStatus(serverCode));
}

/* ------------------------------
 * 서버 코드 → 변환 → 칩 설정 한 번에 조회 (분석/메타 결과 asmtMetaRsltSttsCd, utlzAgreSeCd 등)
 * ------------------------------ */
export function getResearchAnalysisStatusConfig(serverCode: string | null | undefined): StatusChipConfig | undefined {
  return getStatusConfig(convertResearchAnalysisStatus(serverCode));
}

/** 결과제외: 레거시 utlz=08 또는 신규 utlz=06 + asmt_opnn_stts_cd=08 */
export function isResearchOpinionExcludedResult(op: {
  utlzAgreSeCd?: string | null;
  asmtOpnnSttsCd?: string | null;
}): boolean {
  const u = op.utlzAgreSeCd;
  const a = op.asmtOpnnSttsCd;
  return (
    u === AnalysisResultStatus.EXCLUDED || (u === AnalysisResultStatus.COMPLETED && a === AnalysisResultStatus.EXCLUDED)
  );
}

/** 검토결과 칩·통계용 코드 (결과제외는 asmt 기준으로 복원) */
export function researchOpinionDisplayStatusCode(op: {
  utlzAgreSeCd?: string | null;
  asmtOpnnSttsCd?: string | null;
}): string | null | undefined {
  if (isResearchOpinionExcludedResult(op)) return AnalysisResultStatus.EXCLUDED;
  return op.utlzAgreSeCd;
}

/** tb_cm_e_opnn.asmt_opnn_stts_cd (01=동의, 02=미동의) */
export function formatResearchOpinionConsentLabel(code: string | null | undefined): string {
  if (code === "01") return "동의";
  if (code === "10") return "미동의";
  return "-";
}

/* ------------------------------
 * 서버 코드 → 변환 → 칩 설정 한 번에 조회 (참여기관 CDM 상태)
 * ------------------------------ */
export function getCdmParticipationStatusConfig(serverCode: string | null | undefined): StatusChipConfig | undefined {
  return getStatusConfig(convertCdmParticipationStatus(serverCode));
}

/* ------------------------------
 * 서버 코드 → 변환 → 칩 설정 한 번에 조회 (참여기관 기관 상태)
 * ------------------------------ */
export function getOrgParticipationStatusConfig(serverCode: string | null | undefined): StatusChipConfig | undefined {
  return getStatusConfig(convertOrgParticipationStatus(serverCode));
}

/* ------------------------------
 * CDM 표준구분코드 (stdSeCd) 서버 코드 → 라벨 변환 매핑
 * 01: 정확성 / 02: 완전성 / 03: 유일성 / 04: 일관성 / 05: 유효성
 * ------------------------------ */
const StdSeCdMap: Record<string, string> = {
  [StdSeCdType.ACCURACY]: "정확성",
  [StdSeCdType.COMPLETENESS]: "완전성",
  [StdSeCdType.UNIQUENESS]: "유일성",
  [StdSeCdType.CONSISTENCY]: "일관성",
  [StdSeCdType.VALIDITY]: "유효성",
};

/* ------------------------------
 * 서버 stdSeCd 코드 → 라벨 변환
 * ------------------------------ */
export function convertStdSeCd(serverCode: string | null | undefined): string {
  if (!serverCode) return "-";
  return StdSeCdMap[serverCode.trim()] ?? serverCode;
}

/* ------------------------------
 * SearchArea 카테고리 필터 옵션 (목록 검색용)
 * ------------------------------ */
export const STD_SE_CD_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: StdSeCdType.ACCURACY, label: "정확성" },
  { value: StdSeCdType.COMPLETENESS, label: "완전성" },
  { value: StdSeCdType.UNIQUENESS, label: "유일성" },
  { value: StdSeCdType.CONSISTENCY, label: "일관성" },
  { value: StdSeCdType.VALIDITY, label: "유효성" },
];

/* ------------------------------
 * 지정된 길이의 랜덤 숫자를 생성
 * ------------------------------ */
export function createRandom(length?: number): number {
  const len = length || 5;
  const min = Math.pow(10, len - 1);
  const max = Math.pow(10, len) - 1;
  const range = max - min + 1;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] % range);
}

/* ------------------------------
 * 경로 문자열의 파라미터를 실제 값으로 치환
 * ------------------------------ */
export function buildPath(path: string, params: PathParams): string {
  return path.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
    const value = params[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing path param: ${key}`);
    }
    return encodeURIComponent(String(value));
  });
}

/* ------------------------------
 * 파일 크기 포맷팅 함수
 * ------------------------------ */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

/* ------------------------------
 * 파일 확장자 추출 함수
 * ------------------------------ */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return "";
  return fileName.substring(lastDot + 1).toUpperCase();
}

/* ------------------------------
 * hex 색상을 그라데이션용으로 진하게 만듦. Hue·Saturation 유지, Lightness만 낮춰서 선명하게 보이게 함. (chip 파스텔 색 → 뚜렷한 색)
 * ------------------------------ */
export function vividColorForGradient(hex: string, targetLightness = 0.55): string {
  const parse = (h: string) => {
    const v = parseInt(h, 16);
    return h.length === 1 ? v / 15 : v / 255;
  };
  const hexNorm = hex.replace(/^#/, "");
  if (hexNorm.length !== 3 && hexNorm.length !== 6) return hex;
  const r = hexNorm.length === 6 ? parse(hexNorm.slice(0, 2)) : parse(hexNorm[0]);
  const g = hexNorm.length === 6 ? parse(hexNorm.slice(2, 4)) : parse(hexNorm[1]);
  const b = hexNorm.length === 6 ? parse(hexNorm.slice(4, 6)) : parse(hexNorm[2]);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hVal = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hVal = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hVal = ((b - r) / d + 2) / 6;
    else hVal = ((r - g) / d + 4) / 6;
  }
  const lNew = Math.max(0.2, Math.min(0.9, targetLightness));
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r2: number, g2: number, b2: number;
  if (s <= 0) {
    r2 = g2 = b2 = lNew;
  } else {
    const q = lNew < 0.5 ? lNew * (1 + s) : lNew + s - lNew * s;
    const p = 2 * lNew - q;
    r2 = hue2rgb(p, q, hVal + 1 / 3);
    g2 = hue2rgb(p, q, hVal);
    b2 = hue2rgb(p, q, hVal - 1 / 3);
  }
  const toHex = (x: number) => {
    const n = Math.round(Math.max(0, Math.min(1, x)) * 255);
    return n.toString(16).padStart(2, "0");
  };
  return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
}
