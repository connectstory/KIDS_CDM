import { createContext } from "react";
import type { AlertColor } from "@mui/material/Alert";

export type AlertAnchorOrigin = {
  vertical: "top" | "bottom";
  horizontal: "left" | "center" | "right";
};

export type AlertSeverity = AlertColor | "description";

export type ShowAlertOptions = {
  message: string;
  severity?: AlertSeverity; // "success" | "info" | "warning" | "error" | "description"
  /** ms. null이면 자동으로 안 사라짐(사용자 닫기 전까지 유지). 미지정 시 8000 */
  duration?: number | null;
  anchorOrigin?: AlertAnchorOrigin;
};

export type ClearAllAlertsOptions = {
  /** true면 showAlert 직후(~400ms) 라우트 변경 시 알림을 유지 (저장 후 이동 등) */
  skipIfRecent?: boolean;
};

export type AlertContextValue = {
  showAlert: (opts: ShowAlertOptions) => void;
  hideAlert: () => void;
  /** 표시 중인 알림과 대기 큐를 모두 제거 */
  clearAllAlerts: (options?: ClearAllAlertsOptions) => void;
};

export const AlertContext = createContext<AlertContextValue | null>(null);
