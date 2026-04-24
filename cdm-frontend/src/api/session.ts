import axios from "axios";
import { SESSION_PP_AUTH_KEY, SESSION_TOKEN_KEY } from "@/store/sessionSlice";

type ExtendKind = "pp" | "ca";

export async function requestSessionExtend(kind: ExtendKind) {
  const rawAuth = sessionStorage.getItem(SESSION_PP_AUTH_KEY);
  const parsed = rawAuth ? (JSON.parse(rawAuth) as { acsTokenCn?: string } | null) : null;
  const token = parsed?.acsTokenCn ?? "";

  let config: Parameters<typeof axios.post>[2];

  if (kind === "pp") {
    // PP 연장은 HttpOnly 세션 쿠키 기준 — 브라우저가 쿠키를 실어내도록 함
    const headers: Record<string, string> = {};
    if (import.meta.env.VITE_TARGET === "local") {
      const legacy = sessionStorage.getItem(SESSION_TOKEN_KEY);
      if (legacy) headers.Authorization = `Bearer ${legacy}`;
    }
    config = {
      withCredentials: true,
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    };
  } else {
    // CA(UCM) 연장도 쿠키 세션을 쓰는 경우가 있어 동일하게 credentials 전송
    const headers: Record<string, string> = {};
    if (import.meta.env.VITE_TARGET === "local") {
      const legacy = sessionStorage.getItem(SESSION_TOKEN_KEY);
      if (legacy) headers.Authorization = `Bearer ${legacy}`;
    }
    if (!headers.Authorization && token) {
      headers.Authorization = `Bearer ${token}`;
    }
    config = {
      withCredentials: true,
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    };
  }

  const path =
    kind === "pp" ? import.meta.env.VITE_CM_URL + "/api/pp/adminExtend" : import.meta.env.VITE_UCM_URL + "/api/ca/auth/extend";
  const { data } = await axios.post(path, null, config);
  globalThis.dispatchEvent(new Event("sessionExtended"));
  return data;
}
