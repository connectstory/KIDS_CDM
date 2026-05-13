import type { AuthrtType, HttpErrorTypeValue } from "@/constants/types";
import type { MenuAuthItem } from "@/interfaces/menuAuthInterface";

export interface AppData {
  loadingCount: number;
  isSidebarExtend: boolean;
  lastError: ApiError | null;
}

export interface SessionData {
  userType: string | undefined;
  userNo: string | undefined;
  userName: string | undefined;
  isLoading: boolean;
  loginTime?: number | undefined;
  /** 일반사용자 정보 */
  mbrNo: string | undefined;
  mbrId: string | undefined;
  mbrTypeCd: string | undefined;
  instId: string | undefined;
  instNm: string | undefined;
  authrtTypeCd: AuthrtType | undefined; // ← string → AuthrtType ("M" | "E" | "U")
  authorities: string[];
  /** 직원 정보 (이메일 매칭 시 로그인 응답에서 설정) */
  empNo: string | undefined;
  empNm: string | undefined;
  deptNo: string | undefined;
  /** 관리자 메뉴 트리 (API `menuAuthList`) */
  menuAuthList: MenuAuthItem[];
  /** 메뉴 URL별 버튼 권한 등 (API `menuAuthMap`) */
  menuAuthMap: Record<string, string>;
}

export interface ApiResponse<T> {
  status: string; // 성공여부 (예: "success", "fail", "error")
  message: string; // 메시지
  data?: T; // 데이터
  page?: number; // 페이지 정보
  length?: number; // 길이 정보
  total?: number; // 전체 개수
}

//----------------------------------
// API 에러 인터페이스
//----------------------------------
export interface ApiError {
  type: HttpErrorTypeValue;
  message: string;
  original?: unknown;
}
