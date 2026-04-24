import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCmRoutes, useIsAdminCmShell } from "@/hooks/useCmRoutes";

/**
 * 공시 목록 Wrapper 컴포넌트
 * - 현재 포털(`/cm` vs `/ucm`)에 따라 관리자용/협력기관용 목록 페이지로 리다이렉트
 */
export default function DisclosureListWrapper() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminShell = useIsAdminCmShell();

  useEffect(() => {
    // 관리자 포털은 관리자 목록, 협력기관 포털은 참여기관 목록 (쿼리 파라미터 유지)
    if (isAdminShell) {
      navigate(`${routes.CDM.DISCLOSURES_ADMIN}${location.search}`, { replace: true });
    } else {
      navigate(`${routes.CDM.DISCLOSURES_CUSTOMER}${location.search}`, { replace: true });
    }
  }, [isAdminShell, navigate, routes, location.search]);

  // 리다이렉트 중 로딩 표시
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
      <span>페이지 이동 중...</span>
    </div>
  );
}
