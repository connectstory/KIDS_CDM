import { useEffect, useRef, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { Outlet, useLocation, useMatches, useParams } from "react-router-dom";
import { BOARD_CONFIG } from "@/config/boardConfig";
import { getBreadcrumbs } from "@/utils/menuUtils";

interface RouteHandle {
  title?: string;
  titleKey?: string;
}

export default function AdminContentLayout() {
  const matches = useMatches() as Array<{ handle?: RouteHandle }>;
  const params = useParams();
  const location = useLocation();
  const contentWrapRef = useRef<HTMLDivElement>(null);
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const prevPathnameRef = useRef<string>(location.pathname);
  const loaderStartTimeRef = useRef<number | null>(null);
  const minDisplayTimeRef = useRef<number>(1000); // 최소 표시 시간 1초

  // React Query의 전역 fetching 상태 확인
  // 라우트 변경 시에만 감지하므로 모달에서 발생하는 쿼리는 자동으로 제외됨
  const isFetching = useIsFetching() > 0;

  // const appData = useSelector((s: RootState) => s.common);

  // 라우트 변경 감지 및 로딩 상태 관리
  useEffect(() => {
    // 라우트가 변경되었는지 확인
    if (prevPathnameRef.current !== location.pathname) {
      setIsRouteChanging(true);
      prevPathnameRef.current = location.pathname;

      // fetching이 없는 경우(캐시된 데이터)를 대비해 일정 시간 후 자동 해제
      const fallbackTimer = setTimeout(() => {
        setIsRouteChanging(false);
      }, 1000);

      return () => clearTimeout(fallbackTimer);
    }

    // window와 content_wrap 모두 스크롤을 상단으로 이동
    window.scrollTo(0, 0);
    if (contentWrapRef.current) {
      contentWrapRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // 로더 표시 상태 관리 (최소 1초 표시 보장)
  useEffect(() => {
    const shouldShowLoader = isRouteChanging || isFetching;

    if (shouldShowLoader && !isLoading) {
      // 로더 표시 시작
      setIsLoading(true);
      loaderStartTimeRef.current = Date.now();
    } else if (!shouldShowLoader && isLoading) {
      // 로더를 숨기기 전에 최소 표시 시간 확인
      const elapsedTime = loaderStartTimeRef.current ? Date.now() - loaderStartTimeRef.current : 0;
      const remainingTime = Math.max(0, minDisplayTimeRef.current - elapsedTime);

      const timer = setTimeout(() => {
        setIsLoading(false);
        loaderStartTimeRef.current = null;
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [isRouteChanging, isFetching, isLoading]);

  let title = "존재하지 않는 페이지";

  const current = [...matches].reverse().find((m) => m.handle);

  if (current?.handle?.titleKey === "Board") {
    const boardType = params.boardType as keyof typeof BOARD_CONFIG;
    title = BOARD_CONFIG[boardType]?.title ?? title;
  } else if (current?.handle?.title) {
    title = current.handle.title;
  }

  // 브레드크럼 생성 (Router.tsx의 라우트 구조를 이용)
  const breadcrumbs = getBreadcrumbs(matches, params, BOARD_CONFIG);

  return (
    <div className="content_wrap" ref={contentWrapRef}>
      <div className="location">
        <div className="page_path">
          <h2 className="tit">{title}</h2>
        </div>
        <div className="local">
          <span className="home">
            <span className="blind">홈</span>
          </span>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={index} className={isLast ? "current" : "route"}>
                {crumb.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="content" style={{ position: "relative" }}>
        {/* <Loader isLoading={isLoading} /> */}
        <Outlet />
      </div>
    </div>
  );
}
