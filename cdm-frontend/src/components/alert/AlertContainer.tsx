import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import type { ClearAllAlertsOptions } from "./AlertContext";
import { AlertContext, type ShowAlertOptions } from "./AlertContext";

interface AlertQueueItem extends ShowAlertOptions {
  id: string;
}

const RECENT_ALERT_MS = 400;

export function AlertContainer({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<AlertQueueItem[]>([]);
  const [currentAlert, setCurrentAlert] = useState<AlertQueueItem | null>(null);
  const [open, setOpen] = useState(false);
  const lastShowAlertTimeRef = useRef(0);

  const processNextAlert = useCallback(() => {
    setOpen(false);
    // 애니메이션 시간을 고려하여 다음 알림 표시
    setTimeout(() => {
      setQueue((prev) => prev.slice(1));
      setCurrentAlert(null);
    }, 300);
  }, []);

  const hideAlert = useCallback(() => {
    processNextAlert();
  }, [processNextAlert]);

  const clearAllAlerts = useCallback((options?: ClearAllAlertsOptions) => {
    if (options?.skipIfRecent && Date.now() - lastShowAlertTimeRef.current < RECENT_ALERT_MS) {
      return;
    }
    setOpen(false);
    setQueue([]);
    setCurrentAlert(null);
  }, []);

  const showAlert = useCallback((opts: ShowAlertOptions) => {
    lastShowAlertTimeRef.current = Date.now();
    const duration = opts.duration === undefined ? 3000 : opts.duration;
    const alertItem: AlertQueueItem = {
      id: `${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`,
      message: opts.message,
      severity: opts.severity ?? "info",
      duration,
      anchorOrigin: opts.anchorOrigin,
    };

    setQueue((prev) => [...prev, alertItem]);
  }, []);

  // 큐에서 다음 알림 처리
  useEffect(() => {
    if (queue.length > 0 && !currentAlert && !open) {
      setCurrentAlert(queue[0]);
      setOpen(true);
    }
  }, [queue, currentAlert, open]);

  // 자동 닫기 처리 (duration이 null이거나 0이면 타이머 없음)
  useEffect(() => {
    if (open && currentAlert && currentAlert.duration != null && currentAlert.duration > 0) {
      const timer = setTimeout(() => {
        processNextAlert();
      }, currentAlert.duration);

      return () => clearTimeout(timer);
    }
  }, [open, currentAlert, processNextAlert]);

  const value = useMemo(() => ({ showAlert, hideAlert, clearAllAlerts }), [showAlert, hideAlert, clearAllAlerts]);

  return (
    <AlertContext.Provider value={value}>
      {children}

      {currentAlert && (
        <Snackbar
          open={open}
          autoHideDuration={currentAlert.duration ?? null}
          onClose={(_, reason) => {
            if (reason === "clickaway") return;
            hideAlert();
          }}
          anchorOrigin={currentAlert.anchorOrigin ?? { vertical: "top", horizontal: "center" }}
          sx={{
            ...(currentAlert.anchorOrigin?.vertical === "bottom"
              ? {
                  "& .MuiSnackbar-root": {
                    bottom: "24px !important",
                  },
                }
              : {
                  "& .MuiSnackbar-root": {
                    top: "24px !important",
                  },
                }),
          }}
        >
          <Alert
            onClose={hideAlert}
            severity={currentAlert.severity === "description" ? "info" : currentAlert.severity}
            variant="filled"
            sx={{
              width: "100%",
              minWidth: "300px",
              maxWidth: "600px",
              fontWeight: 500,
              fontSize: "0.9375rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              ...(currentAlert.severity === "description"
                ? {
                    backgroundColor: "#000",
                    color: "#fff",
                    "& .MuiAlert-icon": {
                      color: "#fff",
                    },
                  }
                : {}),
              "& .MuiAlert-icon": {
                fontSize: "1.25rem",
              },
              "& .MuiAlert-message": {
                display: "flex",
                alignItems: "center",
                padding: "4px 0",
                whiteSpace: "pre-line",
              },
            }}
          >
            {currentAlert.message}
          </Alert>
        </Snackbar>
      )}
    </AlertContext.Provider>
  );
}
