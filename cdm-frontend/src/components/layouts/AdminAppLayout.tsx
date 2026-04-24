import { useEffect, useMemo, useRef } from "react";
import { ROUTES } from "@/router/routes";
import { Button } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { adminLogo } from "@/config/images";
import { adminMenus } from "@/config/menus";
import cmAxios, { getActiveMenuSn, setActiveMenuSn } from "@/api/axios";
import { requestSessionExtend } from "@/api/session";
import type { AppDispatch, RootState } from "@/store";
import { setSidebarExtend } from "@/store/commonSlice";
import { SESSION_TOKEN_KEY, fetchAdminMe, logout } from "@/store/sessionSlice";
import { menuAuthListToTreeItems } from "@/utils/menuAuthTree";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import ModalHost from "@/components/modal";
import TreeMenu from "@/components/tree-menu/TreeMenu";
import type { TreeItem } from "@/components/tree-menu/TreeNode";

function findMenuSnByPathname(menuAuthList: Array<{ menuSn?: unknown; menuUrl?: unknown }>, pathname: string): number | undefined {
  let best: { menuSn: number; urlLen: number } | null = null;
  for (const item of menuAuthList) {
    const url = typeof item.menuUrl === "string" ? item.menuUrl : "";
    if (!url) continue;
    if (pathname === url || pathname.startsWith(url + "/")) {
      if (!best || url.length > best.urlLen) {
        const sn = Number(item.menuSn);
        if (!Number.isNaN(sn)) best = { menuSn: sn, urlLen: url.length };
      }
    }
  }
  return best?.menuSn;
}

export default function AdminAppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const appData = useSelector((s: RootState) => s.common);

  // ── Redux store에서 사용자 정보 꺼내기 (localStorage 제거) ────────────────
  const sessionData = useSelector((s: RootState) => s.session);

  const { clearAllAlerts } = useGlobalAlert();

  useEffect(() => {
    // 앱 시작 시 sessionStorage.auth.acsTokenCn → axios 기본 Authorization 반영
    if (import.meta.env.VITE_TARGET === "local") {
      try {
        const accessToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
        if (accessToken) {
          cmAxios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        }
      } catch {
        console.error("Failed to set axios Authorization header");
      }
    }
    dispatch(fetchAdminMe());
  }, []);

  const extendInFlightRef = useRef(false);
  const lastExtendAtRef = useRef(0);
  const EXTEND_COOLDOWN_MS = 60_000;

  useEffect(() => {
    const onGlobalClickCapture = async () => {
      const now = Date.now();
      if (extendInFlightRef.current) return;
      if (now - lastExtendAtRef.current < EXTEND_COOLDOWN_MS) return;

      extendInFlightRef.current = true;
      lastExtendAtRef.current = now;
      try {
        await requestSessionExtend("pp");
      } catch {
        // ignore: 백엔드/외부가 401이면 기존 401 핸들링/로그아웃 흐름이 처리
      } finally {
        extendInFlightRef.current = false;
      }
    };

    document.addEventListener("click", onGlobalClickCapture, true);
    return () => document.removeEventListener("click", onGlobalClickCapture, true);
  }, []);

  const adminTreeData = useMemo((): TreeItem[] => {
    if (sessionData.menuAuthList.length > 0) {
      return menuAuthListToTreeItems(sessionData.menuAuthList);
    }
    // 로그인 없이 로컬만 열 때: JWT/menu API가 없으면 menus.ts 폴백
    if (import.meta.env.DEV) {
      return adminMenus as TreeItem[];
    }
    return [];
  }, [sessionData.menuAuthList]);

  useEffect(() => {
    clearAllAlerts({ skipIfRecent: true });
  }, [location.pathname, clearAllAlerts]);

  useEffect(() => {
    const menuSn = findMenuSnByPathname(
      sessionData.menuAuthList as Array<{ menuSn?: unknown; menuUrl?: unknown }>,
      location.pathname
    );
    if (menuSn != null && menuSn !== getActiveMenuSn()) {
      setActiveMenuSn(menuSn);
    }
  }, [location.pathname, sessionData.menuAuthList]);

  const onSidebarExtend = () => {
    dispatch(setSidebarExtend(!appData.isSidebarExtend));
  };

  const handleLogout = async () => {
    try {
      // CDM 백엔드 프록시 로그아웃 → PP(adminLogout)
      await axios.post(import.meta.env.VITE_CM_URL + "/api/pp/adminLogout");
    } catch (e) {
      // 실패해도 프론트 세션은 정리
      console.warn("JWT logout failed:", e);
    }
    dispatch(logout());
    queryClient.clear();
    if (import.meta.env.VITE_TARGET === "local") {
      navigate(ROUTES.CM.AD.LOGIN);
    } else {
      globalThis.location.href = import.meta.env.VITE_CM_URL + import.meta.env.VITE_CM_LOGIN_URL;
    }
  };

  return (
    <div id="wrap">
      {/* S T A R T :: header */}
      <header id="header">
        <div className="inner">
          <h1 className={`logo ${appData.isSidebarExtend ? "" : "collapsed"}`}>
            <button type="button" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <img src={adminLogo} alt="한국의약품안전관리원" />
              <span className="logo_text">통합관리시스템</span>
            </button>
          </h1>

          <div className="sidebar_controller">
            <button type="button" onClick={onSidebarExtend}>
              <span className="blind">메뉴바</span>
            </button>
          </div>

          <div className="util_group">
            <div className="user_info">
              <div className="user_name">
                <div>
                  {sessionData.userNo && (
                    <p>
                      {sessionData.userName} ({sessionData.userNo})님
                    </p>
                  )}
                </div>
              </div>
              <p className="access mr-3">{new Date().toLocaleString()}</p>
              <Button className="btn_logout" size="small" variant="outlined" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* E N D :: header */}

      {/* S T A R T :: container */}
      <div id="container" className={`sub_container ${appData.isSidebarExtend ? "" : "collapsed"}`}>
        {/* S T A R T :: aside */}
        <aside className={`aside ${appData.isSidebarExtend ? "" : "collapsed"}`}>
          <div className="aside_inner">
            <TreeMenu data={adminTreeData} />
          </div>
        </aside>
        {/* E N D :: aside */}

        {/* S T A R T :: content */}
        <Outlet />
        {/* E N D :: content */}
      </div>
      {/* E N D :: container */}

      {/* 모달들 렌더링 */}
      <ModalHost />
    </div>
  );
}
