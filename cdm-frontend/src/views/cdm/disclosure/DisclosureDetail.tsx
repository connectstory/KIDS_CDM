import { ROUTES } from "@/router/routes";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { ROLE_TYPE } from "@/constants/types";
import type { RootState } from "@/store";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import Loader from "@/components/Loader";
import DisclosureDetailAdmin from "./DisclosureDetailAdmin";
import DisclosureDetailPartner from "./DisclosureDetailPartner";

/**
 * 공시 상세: 세션 `userType`에 따라 관리자(A) / 참여기관(P) 화면을 분기한다.
 * 라우트는 `disclosures/:pblntSn` 하나로 통일한다.
 */
export default function DisclosureDetail() {
  const { userType, isLoading } = useSelector((s: RootState) => s.session);
  const cm = useCmRoutes();
  const dashboardPath = cm === ROUTES.CM.AD ? ROUTES.CM.AD.DASHBOARD : ROUTES.CM.MB.PARTNER_DASHBOARD;

  if (userType === ROLE_TYPE.ADMIN) {
    return <DisclosureDetailAdmin />;
  }
  if (userType === ROLE_TYPE.PARTNER) {
    return <DisclosureDetailPartner />;
  }

  if (isLoading || userType === undefined) {
    return <Loader isLoading={isLoading} />;
  }

  return <Navigate to={dashboardPath} replace />;
}
