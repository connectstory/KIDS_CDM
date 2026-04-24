import { createBrowserRouter } from "react-router-dom";
import AdminAppLayout from "@/components/layouts/AdminAppLayout";
import AdminContentLayout from "@/components/layouts/AdminContentLayout";
import PartnerAppLayout from "@/components/layouts/PartnerAppLayout";
import PartnerContentLayout from "@/components/layouts/PartnerContentLayout";
import NotFound from "@/views/error/NotFound";
import LoginAdmin from "@/views/login_admin";
import LoginPartner from "@/views/login_partner";
import { contentRoutes } from "./ContentRoutes";
import { CmAdIndexRedirect, CmMbIndexRedirect } from "./RouteGuard";
import { ROUTES } from "./routes";

/**
 * `/cm`(관리자)와 `/ucm`(협력기관) 트리를 항상 등록합니다.
 * `VITE_APP_TARGET`로 한쪽만 켜면 로컬에서 admin 모드로 띄운 뒤 파트너 로그인 시
 * `/ucm/partnerDashboard` 등이 라우트에 없어 404가 나는 문제가 생깁니다.
 */
const adminRoutes = [
  {
    path: ROUTES.CM.AD.ROOT,
    children: [
      { index: true, element: <CmAdIndexRedirect /> },
      {
        path: "login",
        element: <LoginAdmin />,
      },
      {
        element: (
          // <CmAuthRedirectGuard>
          <AdminAppLayout />
          // </CmAuthRedirectGuard>
        ),
        children: [
          {
            element: <AdminContentLayout />,
            children: contentRoutes,
          },
        ],
      },
    ],
  },
];

const partnerRoutes = [
  {
    path: ROUTES.CM.MB.ROOT,
    children: [
      { index: true, element: <CmMbIndexRedirect /> },
      {
        path: "login",
        element: <LoginPartner />,
      },
      {
        element: (
          // <UcmAuthRedirectGuard>
          <PartnerAppLayout />
          // </UcmAuthRedirectGuard>
        ),
        children: [
          {
            element: <PartnerContentLayout />,
            children: contentRoutes,
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter([...adminRoutes, ...partnerRoutes, { path: "*", element: <NotFound /> }]);
