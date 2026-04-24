import { type ReactNode, useEffect, useState } from "react";
import { ROUTES } from "@/router/routes";
import { Navigate } from "react-router-dom";
import { requestSessionExtend } from "@/api/session";
import { SESSION_PP_AUTH_KEY } from "@/store/sessionSlice";

const target = import.meta.env.VITE_APP_TARGET as "admin" | "partner" | undefined;

function getLoginPath(): string {
  return target === "partner" ? ROUTES.CM.MB.LOGIN : ROUTES.CM.AD.LOGIN;
}

/** 로그인 필요 가드: 미로그인 시 로그인 페이지로 이동 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const token = sessionStorage.getItem(SESSION_PP_AUTH_KEY);

  if (!token) {
    window.location.href = getLoginPath();
    return null;
  }

  return <>{children}</>;
}

/**
 * CM 관리자 셸 진입 전: `/api/pp/adminExtend`로 세션(쿠키) 검증.
 * 2xx가 아니면 로그인(로컬은 CM 로그인, 그 외는 UCM 로그인 URL)으로 이동.
 */
export function CmAuthRedirectGuard({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await requestSessionExtend("pp");
        if (!cancelled) setAllowed(true);
      } catch {
        if (cancelled) return;
        if (import.meta.env.VITE_TARGET === "local") {
          window.location.href = import.meta.env.VITE_CM_URL + ROUTES.CM.AD.LOGIN;
        } else {
          window.location.href = import.meta.env.VITE_CM_URL + import.meta.env.VITE_CM_LOGIN_URL;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!allowed) return null;

  return <>{children}</>;
}

/**
 * UCM(협력기관) 셸 진입 전: `/api/ca/auth/extend`로 세션 검증.
 * 2xx가 아니면 비프로덕션은 UCM 로그인 경로, 프로덕션은 UCM 베이스 URL로 이동.
 */
export function UcmAuthRedirectGuard({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await requestSessionExtend("ca");
        if (!cancelled) setAllowed(true);
      } catch {
        if (cancelled) return;
        if (import.meta.env.VITE_TARGET !== "production") {
          window.location.href = import.meta.env.VITE_UCM_URL + ROUTES.CM.MB.LOGIN;
        } else {
          window.location.href = import.meta.env.VITE_UCM_URL;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!allowed) return null;

  return <>{children}</>;
}

/** /cm 진입 시: 세션 없으면 로그인, 있으면 관리자 대시보드로 이동 */
export function CmAdIndexRedirect() {
  return <Navigate to={ROUTES.CM.AD.DASHBOARD} replace />;
}

/** /ucm 진입 시: 세션 없으면 로그인, 있으면 협력기관 대시보드로 이동 */
export function CmMbIndexRedirect() {
  return <Navigate to={ROUTES.CM.MB.PARTNER_DASHBOARD} replace />;
}
