import { ROUTES } from "@/router/routes";
import axios, { AxiosError } from "axios";
import { MSG } from "@/constants/string";
import { type HTTP_ERROR_TYPE, HttpErrorType } from "@/constants/types";
import { SESSION_PP_AUTH_KEY, SESSION_TOKEN_KEY, clearSessionStorage } from "@/store/sessionSlice";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/cm",
  timeout: 60000,
  withCredentials: true,
});

function readBearerTokenFromSessionStorage(): string | undefined {
  // 1) new format: sessionStorage.auth = { acsTokenCn: "..." }
  try {
    const rawAuth = sessionStorage.getItem(SESSION_PP_AUTH_KEY);
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth) as { acsTokenCn?: string } | null;
      const token = parsed?.acsTokenCn;
      if (token) return token;
    }
  } catch {
    // ignore
  }

  // 2) legacy fallback
  const legacy = sessionStorage.getItem(SESSION_TOKEN_KEY);
  if (legacy) return legacy;
  return undefined;
}

// 앱 시작 시 저장된 토큰을 기본 헤더에 반영
const bootToken = readBearerTokenFromSessionStorage();
if (bootToken) {
  axiosInstance.defaults.headers.common.Authorization = `Bearer ${bootToken}`;
}

// =======================================
// 요청 인터셉터
// =======================================
axiosInstance.interceptors.request.use((config) => {
  const token = readBearerTokenFromSessionStorage();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // 백엔드가 cm/ucm에 따라 원격 세션체크 엔드포인트를 선택할 수 있도록 target 헤더를 항상 전송
  if (import.meta.env.VITE_APP_TARGET === "admin") {
    (config.headers as any)["X-App-Target"] = "cm";
  } else {
    (config.headers as any)["X-App-Target"] = "ucm";
  }

  // 접속이력 자동 적재 (요청 시점 기준)
  const method = (config.method ?? "").toUpperCase();
  const url = config.url ?? "";
  const shouldSkip = ACCESS_HISTORY_SKIP.some((p) => url.includes(p));
  const flfmtTaskCd = METHOD_TO_TASK_CD[method];

  if (!shouldSkip && flfmtTaskCd && activeMenuSn != null) {
    axiosInstance.post("/auth/access-history", { menuPath: url, flfmtTaskCd, menuSn: activeMenuSn }).catch(() => {});
  }

  return config;
});

// =======================================
// 응답 오류 처리 헬퍼 (S3776: Cognitive Complexity 분산)
// =======================================
function handleUnauthorizedRedirect(): boolean {
  const isLocal = import.meta.env.VITE_TARGET === "local";

  if (import.meta.env.VITE_APP_TARGET === "admin" && globalThis.location.pathname !== ROUTES.CM.AD.LOGIN) {
    globalThis.location.href = isLocal ? import.meta.env.VITE_CM_URL + ROUTES.CM.AD.LOGIN : import.meta.env.VITE_CM_URL;
    return true;
  }
  if (import.meta.env.VITE_APP_TARGET === "partner" && globalThis.location.pathname !== ROUTES.CM.MB.LOGIN) {
    globalThis.location.href = isLocal ? import.meta.env.VITE_UCM_URL + ROUTES.CM.MB.LOGIN : import.meta.env.VITE_UCM_URL;
    return true;
  }
  return false;
}

const STATUS_ERROR_MAP: Record<number, [HTTP_ERROR_TYPE, string]> = {
  400: [HttpErrorType.BAD_REQUEST, MSG.BAD_REQUEST],
  401: [HttpErrorType.UNAUTHORIZED, MSG.UNAUTHORIZED],
  403: [HttpErrorType.FORBIDDEN, MSG.FORBIDDEN],
  404: [HttpErrorType.NOT_FOUND, MSG.NOT_FOUND],
  500: [HttpErrorType.SERVER_ERROR, MSG.SERVER_ERROR],
};

function toHttpError(status: number | undefined, error: AxiosError): HttpError {
  const [type, message] = STATUS_ERROR_MAP[status ?? 0] ?? [HttpErrorType.UNKNOWN_ERROR, MSG.UNKNOWN_ERROR];
  return new HttpError(type, message, error);
}

// =======================================
// S6671: Promise.reject 이유는 Error 인스턴스여야 함
// =======================================
export class HttpError extends Error {
  type: HTTP_ERROR_TYPE;
  original: AxiosError;

  constructor(type: HTTP_ERROR_TYPE, message: string, original: AxiosError) {
    super(message);
    this.name = "HttpError";
    this.type = type;
    this.original = original;
  }
}

/** Axios error.response.data / HttpError.original.response.data 에서 서버 메시지 추출 */
function getAxiosErrorResponseData(error: unknown): unknown {
  if (!error || typeof error !== "object") return undefined;
  const e = error as { original?: AxiosError; response?: { data?: unknown } };
  if (e.original?.response?.data !== undefined) return e.original.response.data;
  if (e.response?.data !== undefined) return e.response.data;
  return undefined;
}

function parseMessageFromResponseData(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === "string") {
    const s = data.trim();
    if (s.startsWith("<") || s.length > 2000) return null;
    return s.length > 0 ? s : null;
  }
  if (typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const msg = o.message ?? o.error;
  if (typeof msg === "string" || typeof msg === "number" || typeof msg === "boolean") {
    const s = String(msg).trim();
    if (s.length > 0) return s;
  }
  return null;
}

/**
 * 백엔드 ApiResponse.message 등을 우선해 사용자에게 보여줄 문구를 만든다.
 * 응답 인터셉터가 HttpError로 감싼 뒤에도 original 에서 서버 메시지를 읽는다.
 */
export function extractApiErrorMessage(error: unknown, fallback = "요청 처리 중 오류가 발생했습니다."): string {
  const parsed = parseMessageFromResponseData(getAxiosErrorResponseData(error));
  if (parsed) return parsed;
  if (error instanceof HttpError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** 성공 응답 본문(전체)에서 ApiResponse.message 추출 */
export function extractMessageFromApiBody(body: unknown): string | null {
  return parseMessageFromResponseData(body);
}

// =======================================
// 현재 활성 menuSn 추적 (메뉴 클릭 시 설정 → 인터셉터에서 읽기)
// 새로고침 시에도 유지되도록 sessionStorage에 함께 저장
// =======================================
const ACTIVE_MENU_SN_KEY = "activeMenuSn";
const _storedSn = sessionStorage.getItem(ACTIVE_MENU_SN_KEY);
let activeMenuSn: number | undefined = _storedSn ? Number(_storedSn) : undefined;

export function setActiveMenuSn(menuSn: number | undefined): void {
  activeMenuSn = menuSn;
  if (menuSn == null) {
    sessionStorage.removeItem(ACTIVE_MENU_SN_KEY);
  } else {
    sessionStorage.setItem(ACTIVE_MENU_SN_KEY, String(menuSn));
  }
}
export function getActiveMenuSn(): number | undefined {
  return activeMenuSn;
}


// =======================================
// HTTP 메서드 → 수행업무코드(CA0003) 매핑
// 1:조회 2:생성 3:수정 4:삭제 5:인쇄 6:저장 7:다운로드
// =======================================
const METHOD_TO_TASK_CD: Record<string, string> = {
  GET: "1",
  POST: "2",
  PUT: "3",
  PATCH: "3",
  DELETE: "4",
};

// 접속이력 자동 적재 제외 URL 패턴 (루프·메타 요청 방지)
// /common/file/download/는 downloadFileViaProxy에서 flfmtTaskCd:"7"(다운로드)로 직접 등록
const ACCESS_HISTORY_SKIP = [
  "/auth/access-history",
  "/auth/me",
  "/auth/extend",
  "/auth/caExtend",
  "/auth/ppExtend",
  "/auth/logout",
  "/auth/caLogout",
  "/auth/ppLogout",
  "/common/file/download/",
  "/cdm-validate",
  "/uld-prgrs-yn",
];

// =======================================
// 응답 인터셉터 (오류 분류·401/403 시 로그아웃)
// 접속이력 적재는 request 인터셉터로 이동
// 인터셉터는 하나만 둠: 두 개로 나누면 401/403 처리 후에도 다음 인터셉터가
// 서버 메시지(예: "오류가 발생했습니다.")를 담아 reject 해 토스트가 뜰 수 있음.
// =======================================
axiosInstance.interceptors.response.use(
  (res) => {
    return res;
  },
  (error: AxiosError) => {
    const originalRequest = error.config as { _retry?: boolean } | undefined;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      clearSessionStorage();
      if (handleUnauthorizedRedirect()) return;
    }

    if (!error.response) {
      return Promise.reject(new HttpError(HttpErrorType.NETWORK_ERROR, MSG.NETWORK_ERROR, error));
    }

    return Promise.reject(toHttpError(status, error));
  }
);

export default axiosInstance;

/**
 * 500 응답일 때만 요청 재시도
 * withRetry(() => api함수())
 * @param fn 요청을 보낼 API
 * @param retryCount 재시도 횟수
 * @param delay 요청간 딜레이
 * @returns
 */
export async function withRetry<T>(fn: () => Promise<T>, retryCount = 2, delay = 500): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (retryCount <= 0) throw e;

    const status = e.response?.status;

    // 500일 때만 재시도
    if (status === 500) {
      await new Promise((r) => setTimeout(r, delay));
      return withRetry(fn, retryCount - 1, delay);
    }

    throw e;
  }
}
