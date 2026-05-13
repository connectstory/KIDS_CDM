import { ROUTES } from "@/router/routes";
import { useLocation } from "react-router-dom";

/**
 * 현재 경로가 /cm/ad 이면 ROUTES.CM.AD, /cm/mb 이면 ROUTES.CM.MB 를 반환.
 * RESEARCH, CDM, COMMUNITY 등 하위 경로는 반환된 객체의 .RESEARCH, .CDM, .COMMUNITY 로 사용.
 */
export function useCmRoutes(): typeof ROUTES.CM.AD | typeof ROUTES.CM.MB {
  const location = useLocation();
  return location.pathname.startsWith(ROUTES.CM.AD.ROOT) ? ROUTES.CM.AD : ROUTES.CM.MB;
}

/**
 * 현재 URL이 관리자 포털(`/cm`)인지 여부.
 * `VITE_APP_TARGET`과 무관하게, 한 번의 빌드로 `/cm`·`/ucm`을 모두 쓸 때 올바른 화면 분기에 사용.
 */
export function useIsAdminCmShell(): boolean {
  const location = useLocation();
  return location.pathname.startsWith(ROUTES.CM.AD.ROOT);
}
