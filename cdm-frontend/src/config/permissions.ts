import type { AuthrtType } from "@/constants/types";

// ── 액션 타입 ─────────────────────────────────────────────────────────────────
export type ActionType = "create" | "read" | "update" | "delete" | "upload" | "approve";

// ── 권한 정책 타입 ─────────────────────────────────────────────────────────────
export type Policy = Partial<Record<ActionType, AuthrtType[]>>;

// ── 정책 미설정 시 기본 동작 ────────────────────────────────────────────────────
//   false → 정책 미설정 액션은 전체 차단
const DEFAULT_ALLOW = false;

// ── 권한 정책 테이블 ───────────────────────────────────────────────────────────
export const PERMISSIONS: Record<string, Policy> = {

  // ── 사업개요 ────────────────────────────────────────────────────────────────
  "board:background": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:objective": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:coordinationCenter": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:partnerInstitution": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },

  // ── CDM이란 ─────────────────────────────────────────────────────────────────
  "board:cdmDefinition": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:cdmStructure": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:cdmImplementation": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:informationSecurity": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },

  // ── 구축·분석 ────────────────────────────────────────────────────────────────
  "board:cdmOverview": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:buildInfo": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:analysisInfo": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:info": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },

  // ── 참여마당 ─────────────────────────────────────────────────────────────────
  "board:notice": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:pressRelease": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:faq": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:qna": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:meetingEventInfo": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:resourceCenter": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
  "board:researchProject": {
    create: ["M"],
    update: ["M"],
    delete: ["M"],
  },
};

// ── 권한 체크 순수 함수 ────────────────────────────────────────────────────────
export const checkPermission = (
  permissionKey: string,
  action: ActionType,
  authrtTypeCd: AuthrtType | null | undefined
): boolean => {
  if (!authrtTypeCd) return false;

  const policy = PERMISSIONS[permissionKey];
  if (!policy) return DEFAULT_ALLOW;

  const allowed = policy[action];
  if (!allowed) return DEFAULT_ALLOW;

  return allowed.includes(authrtTypeCd);
};