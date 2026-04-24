import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/router/routes";
import { Box, Button, Stack } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { potalLogoKo } from "@/config/images";
import axios from "@/api/axios";
import { requestSessionExtend } from "@/api/session";
import type { AppDispatch } from "@/store";
import { logout } from "@/store/sessionSlice";
import SkipNavigation from "@/components/layouts/SkipNavigation";

const SESSION_SECONDS = 30 * 60;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const [remaining, setRemaining] = useState(SESSION_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(SESSION_SECONDS);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const onSessionExtended = () => startTimer();
    globalThis.addEventListener("sessionExtended", onSessionExtended);
    return () => globalThis.removeEventListener("sessionExtended", onSessionExtended);
  }, []);

  const handleExtend = async () => {
    const target = import.meta.env.VITE_APP_TARGET as "admin" | "partner" | undefined;
    try {
      if (target === "admin") {
        await requestSessionExtend("pp");
      } else {
        await requestSessionExtend("ca");
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    const target = import.meta.env.VITE_APP_TARGET as "admin" | "partner" | undefined;
    try {
      if (target === "admin") {
        await axios.post("/auth/ppLogout");
      } else if (target === "partner") {
        const mbrId = sessionStorage.getItem("mbrId") || "";
        const tokenSnRaw = sessionStorage.getItem("tokenSn");
        const tokenSn = tokenSnRaw ? Number(tokenSnRaw) : undefined;
        await axios.post("/auth/caLogout", { mbrId, tokenSn });
      }
    } catch (e) {
      console.warn("JWT logout failed:", e);
    }
    dispatch(logout());
    queryClient.clear();

    // VITE_TARGET이 local이면 + "/ucm/Login"으로 이동
    if (import.meta.env.VITE_TARGET === "local") {
      navigate(ROUTES.CM.MB.LOGIN);
    } else {
      window.location.href = import.meta.env.VITE_UCM_URL;
    }
  };
  return (
    <>
      <SkipNavigation />
      <Box component="header" className="header">
        {/* 상단 바 */}
        <Box className="header-topbar">
          <Box className="page-container">
            <Box className="top-link">
              <Box className="timer_box">
                <span className="time_text">{formatTime(remaining)}</span>
                <Button size="small" className="btn_extend" onClick={handleExtend}>
                  시간연장
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
        {/* 로고, 유틸메뉴 */}
        <Box className="header_menu">
          <Box className="page-container">
            <h1>
              <Box
                onClick={() => {
                  const targetUrl = import.meta.env.VITE_UCM_URL;
                  window.location.href = targetUrl;
                }}
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <img
                  src={potalLogoKo}
                  alt="KIDS"
                  style={{
                    height: "auto",
                    maxHeight: "40px",
                    cursor: "pointer",
                  }}
                />
              </Box>
            </h1>
            <Box className="util-menu">
              {/* {i18nInstance.language === "ko" && ( */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Button size="small" onClick={handleLogout} className="btn-util logout">
                  로그아웃
                </Button>
              </Stack>
              {/* )} */}
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
