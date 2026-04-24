import type { ResearchSearchRequest } from "@/interfaces/researchInterface";

/*----------------------------------
 * 연구(research) 도메인의 TanStack Query 키 관리
 ----------------------------------*/

const RESEARCH_ROOT = ["research"] as const;
const ANALYSIS_DATA_ROOT = ["analysisData"] as const;
const OPINION_ROOT = ["opinion"] as const;
const ORG_ANALYSIS_DATA_ROOT = ["orgAnalysisData"] as const;
const RESEARCH_COMMENT_ROOT = ["researchComments"] as const;

export const researchKeys = {
  all: RESEARCH_ROOT,

  detail: (asmtSn: number | null | undefined) => [...RESEARCH_ROOT, "detail", asmtSn] as const,

  listBase: [...RESEARCH_ROOT, "list"] as const,
  listAdmin: (params?: ResearchSearchRequest) => [...RESEARCH_ROOT, "list", "admin", params] as const,
  listPartner: (params?: ResearchSearchRequest) => [...RESEARCH_ROOT, "list", "partner", params] as const,

  researchPartners: (asmtSn: number | null | undefined) => [...RESEARCH_ROOT, "researchPartners", asmtSn] as const,

  asmtAccounts: (asmtSn?: number) => [...RESEARCH_ROOT, "accounts", asmtSn] as const,
  /** VDI/DB 계정 전체 목록 조회 (searchAsmtAccounts) */
  searchAsmtAccounts: () => [...RESEARCH_ROOT, "searchAsmtAccounts"] as const,

  partner: (asmtSn: number | null | undefined, ptcpInstSn: string | number | null | undefined) =>
    [...RESEARCH_ROOT, "partner", asmtSn, ptcpInstSn] as const,

  /** 멘션 팝업용: 과제 생성자 + 참여기관 (detail + researchPartners 조합) */
  mentionTargets: (asmtSn: number | null | undefined) => [...RESEARCH_ROOT, "mentionTargets", asmtSn] as const,

  /** 메타/원천데이터 분석 최신 데이터 모두 검토완료 여부 */
  checkAllStatusCompleted: (asmtSn: number | null | undefined) => [...RESEARCH_ROOT, "checkAllStatusCompleted", asmtSn] as const,

  /** 메타분석 접근 가능 여부 */
  checkMetaAccess: (asmtSn: number | null | undefined) => [...RESEARCH_ROOT, "checkMetaAccess", asmtSn] as const,

  /** 연구과제 파일 목록 (uldTaskSeCd, fileSeCd, ptcpInstSn 필터) */
  files: (asmtSn: number | null | undefined, fileSeCd: string, uldTaskSeCd?: string, ptcpInstSn?: number | null) =>
    [...RESEARCH_ROOT, "files", asmtSn, fileSeCd, uldTaskSeCd ?? "01", ptcpInstSn ?? null] as const,

  /** 담당자 목록 (asmt-persons) */
  asmtPersonList: () => [...RESEARCH_ROOT, "asmtPersons"] as const,

  /** 담당자 드롭다운용 직원 목록 (deptNos) */
  asmtPersonEmpOptions: (deptNos: string[]) => [...RESEARCH_ROOT, "asmtPersonEmpOptions", deptNos] as const,
};

export const researchCommentKeys = {
  all: RESEARCH_COMMENT_ROOT,

  list: (asmtSn: number | null | undefined) => [...RESEARCH_COMMENT_ROOT, "list", asmtSn] as const,
};

export const analysisDataKeys = {
  all: ANALYSIS_DATA_ROOT,

  list: (asmtSn: number | null | undefined, rsltGroupStcd?: string, instId?: string) =>
    [...ANALYSIS_DATA_ROOT, "list", asmtSn, rsltGroupStcd, instId] as const,

  listPrefix: (asmtSn: number | null | undefined, rsltGroupStcd?: string) =>
    [...ANALYSIS_DATA_ROOT, "list", asmtSn, rsltGroupStcd] as const,

  detail: (asmtSn: number | null | undefined, asmtMetaRsltSn: number | null | undefined, rsltGroupStcd: string) =>
    [...ANALYSIS_DATA_ROOT, "detail", asmtSn, asmtMetaRsltSn, rsltGroupStcd] as const,

  latest: (asmtSn: number | null | undefined, rsltGroupStcd: string) =>
    [...ANALYSIS_DATA_ROOT, "latest", asmtSn, rsltGroupStcd] as const,
};

export const opinionKeys = {
  all: OPINION_ROOT,

  list: (asmtSn: number | null | undefined, asmtMetaRsltSn: number | null | undefined, rsltGroupStcd: string) =>
    [...OPINION_ROOT, "list", asmtSn, asmtMetaRsltSn, rsltGroupStcd] as const,

  condition: (asmtSn: number | null | undefined, instId?: string) => [...OPINION_ROOT, "condition", asmtSn, instId] as const,
};

export const orgAnalysisDataKeys = {
  all: ORG_ANALYSIS_DATA_ROOT,

  list: (asmtSn: number | null | undefined, rsltGroupStcd: string) =>
    [...ORG_ANALYSIS_DATA_ROOT, "list", asmtSn, rsltGroupStcd] as const,
};
