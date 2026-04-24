import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCmRoutes, useIsAdminCmShell } from "@/hooks/useCmRoutes";

/**
 * 공시 상세 Wrapper 컴포넌트
 * - 현재 포털(`/cm` vs `/ucm`)에 따라 관리자용/협력기관용 상세 페이지로 리다이렉트
 */
export default function DisclosureDetailWrapper(): React.ReactElement {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdminShell = useIsAdminCmShell();

  // 쿼리 파라미터 유지
  const queryString = searchParams.toString();
  const queryPart = queryString ? `?${queryString}` : "";

  useEffect(() => {
    // 관리자 포털은 관리자 상세, 협력기관 포털은 참여기관 상세
    if (isAdminShell) {
      navigate(`${routes.CDM.DISCLOSURE_DETAIL_ADMIN}${queryPart}`, { replace: true });
    } else {
      navigate(`${routes.CDM.DISCLOSURE_DETAIL_CUSTOMER}${queryPart}`, { replace: true });
    }
  }, [isAdminShell, navigate, queryPart, routes]);

  // 리다이렉트 중 로딩 표시
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
      <span>페이지 이동 중...</span>
    </div>
  );
}
