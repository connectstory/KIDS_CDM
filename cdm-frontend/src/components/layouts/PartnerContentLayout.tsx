import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import { Outlet, useLocation, useMatches, useNavigate, useParams } from "react-router-dom";
import { getActiveMenuSn, setActiveMenuSn } from "@/api/axios";
import { BOARD_CONFIG } from "@/config/boardConfig";
import { potalMenus } from "@/config/menus";
import type { RootState } from "@/store";
import { menuAuthListToTreeItems } from "@/utils/menuAuthTree";
import DepsLocation from "@/components/layouts/DepsLocation";
import type { CollapsibleNavItem } from "@/components/tree-menu/CollapsibleSideNav";
import CollapsibleSideNav from "@/components/tree-menu/CollapsibleSideNav";
import type { TreeItem } from "@/components/tree-menu/TreeNode";

interface RouteHandle {
  title?: string;
  titleKey?: string;
}

function findMenuSnByPathname(menuAuthList: Array<{ menuSn?: unknown; menuUrl?: unknown }>, pathname: string): number | undefined {
  let best: { menuSn: number; urlLen: number } | null = null;
  for (const item of menuAuthList) {
    const url = typeof item.menuUrl === "string" ? item.menuUrl : "";
    if (!url) continue;
    if (pathname === url || pathname.startsWith(url + "/")) {
      if (!best || url.length > best.urlLen) {
        const sn = Number(item.menuSn);
        if (!Number.isNaN(sn)) best = { menuSn: sn, urlLen: url.length };
      }
    }
  }
  return best?.menuSn;
}

function treeItemsToNavItems(items: TreeItem[]): CollapsibleNavItem[] {
  return items.map((item) => ({
    key: item.path ?? item.id,
    label: item.label,
    menuSn: item.menuSn,
    children: item.children ? treeItemsToNavItems(item.children) : undefined,
  }));
}

export default function PartnerContentLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const matches = useMatches() as Array<{ handle?: RouteHandle }>;
  const params = useParams();

  const sessionData = useSelector((s: RootState) => s.session);

  useEffect(() => {
    const menuSn = findMenuSnByPathname(
      sessionData.menuAuthList as Array<{ menuSn?: unknown; menuUrl?: unknown }>,
      location.pathname
    );
    if (menuSn != null && menuSn !== getActiveMenuSn()) {
      setActiveMenuSn(menuSn);
    }
  }, [location.pathname, sessionData.menuAuthList]);

  const partnerMenuItems = useMemo((): CollapsibleNavItem[] => {
    if (sessionData.menuAuthList.length > 0) {
      return treeItemsToNavItems(menuAuthListToTreeItems(sessionData.menuAuthList));
    }
    if (import.meta.env.DEV) {
      return potalMenus;
    }
    return [];
  }, [sessionData.menuAuthList]);

  let title = "페이지 제목";
  const current = [...matches].reverse().find((m) => m.handle);
  if (current?.handle?.titleKey === "Board") {
    const boardType = params.boardType as keyof typeof BOARD_CONFIG;
    title = BOARD_CONFIG[boardType]?.title ?? title;
  } else if (current?.handle?.title) {
    title = current.handle.title;
  }

  return (
    <Box className={`page-layout ${collapsed ? "is-collapsed" : ""}`}>
      <Box className="sub-container">
        <Box className="content-wrap">
          <Box className="side-nav">
            <CollapsibleSideNav
              title="통합분석시스템(CDM)"
              collapsed={collapsed}
              onToggle={() => setCollapsed((p) => !p)}
              items={partnerMenuItems}
              onSelect={(key) => key.startsWith("/") && navigate(key)}
            />
          </Box>

          {/* 서브 콘텐츠 영역 */}
          <Box className="sub-content">
            {/* 상단 현재 위치 정보 */}
            <DepsLocation title={title} />
            <Box className="content-view" id="content">
              <Box className="page-content">
                {/* --- 본문 시작 --- */}
                <Outlet />
                {/* --- 본문 끝 --- */}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
