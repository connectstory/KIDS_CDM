import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import axiosInstance, { getActiveMenuSn } from "@/api/axios";

/**
 * 페이지 마운트 시 접속이력(flfmtTaskCd: "1" = 조회)을 등록하는 훅.
 *
 * TanStack Query 캐시 등으로 인해 API 호출이 발생하지 않아
 * axios 인터셉터가 동작하지 않는 페이지(대시보드 등)에서 사용.
 */
export function usePageAccessHistory(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    axiosInstance
      .post("/auth/access-history", {
        menuPath: pathname,
        flfmtTaskCd: "1",
        menuSn: getActiveMenuSn(),
      })
      .catch(() => {});
    // pathname이 바뀔 때마다 재실행 (같은 훅을 여러 경로에서 재사용 가능)
  }, [pathname]);
}
