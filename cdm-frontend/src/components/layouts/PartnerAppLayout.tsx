import { useEffect, useRef } from "react";
import { Box, CssBaseline } from "@mui/material";
import { useDispatch } from "react-redux";
import { Outlet, useLocation } from "react-router-dom";
import axios from "@/api/axios";
import { requestSessionExtend } from "@/api/session";
import type { AppDispatch } from "@/store";
import { SESSION_CM_AUTH_KEY, fetchPartnerMe } from "@/store/sessionSlice";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import Footer from "@/components/layouts/Footer";
import Header from "@/components/layouts/Header";
import ModalHost from "@/components/modal";

export default function PartnerAppLayout() {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { clearAllAlerts } = useGlobalAlert();

  useEffect(() => {
    // 앱 시작 시 sessionStorage.cmAuth → axios 기본 Authorization 반영
    try {
      const rawAuth = sessionStorage.getItem(SESSION_CM_AUTH_KEY);
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth) as { acsTokenCn?: string } | null;
        const token = parsed?.acsTokenCn;
        if (token) {
          axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      console.error("Failed to set axios Authorization header");
    }
    dispatch(fetchPartnerMe());
  }, [dispatch]);

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
        // const rawAuth = sessionStorage.getItem(SESSION_CM_AUTH_KEY);
        // const parsed = rawAuth ? (JSON.parse(rawAuth) as { acsTokenCn?: string } | null) : null;
        // const token = parsed?.acsTokenCn ?? "";
        await requestSessionExtend("ca");
      } catch {
        // ignore
      } finally {
        extendInFlightRef.current = false;
      }
    };

    document.addEventListener("click", onGlobalClickCapture, true);
    return () => document.removeEventListener("click", onGlobalClickCapture, true);
  }, []);

  useEffect(() => {
    clearAllAlerts({ skipIfRecent: true });
  }, [location.pathname, clearAllAlerts]);

  return (
    <div id="partnerWrap">
      <CssBaseline />
      <Box className="layout-full">
        <Header />
        <Box className="app-main">
          <Outlet />
        </Box>
        <Footer />
      </Box>

      {/* 모달들 렌더링 */}
      <ModalHost />
    </div>
  );
}
