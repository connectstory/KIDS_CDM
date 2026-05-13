import type { Params } from "react-router-dom";
import type { TreeItem } from "@/components/tree-menu/TreeNode";

// Route match 타입 정의 (useMatches()의 반환 타입과 호환)
interface RouteMatch {
  handle?: {
    title?: string;
    titleKey?: string;
  };
}

/**
 * 경로를 정규화하여 매칭 시 대소문자, 슬래시 차이를 처리합니다.
 */
export function normalizePath(path: string): string {
  if (!path) return "";
  return path.toLowerCase().replace(/\/+/g, "/").replace(/\/$/, "");
}

/**
 * 두 경로가 일치하는지 확인합니다.
 * 대소문자를 무시하고 정규화된 경로를 비교합니다.
 */
export function pathsMatch(path1: string, path2: string): boolean {
  const normalized1 = normalizePath(path1);
  const normalized2 = normalizePath(path2);
  return normalized1 === normalized2;
}

/**
 * 경로가 다른 경로를 포함하는지 확인합니다.
 * 예: "/cm/cdm/disclosures"는 "/cm/cdm"을 포함합니다.
 */
export function pathIncludes(path: string, basePath: string): boolean {
  const normalizedPath = normalizePath(path);
  const normalizedBase = normalizePath(basePath);
  if (!normalizedBase) return false;
  return (
    normalizedPath.startsWith(normalizedBase + "/") || normalizedPath === normalizedBase
  );
}

/**
 * 재귀적으로 메뉴 구조를 탐색하여 현재 경로와 일치하는 메뉴 항목을 찾습니다.
 * 정확한 매칭을 우선 시도하고, 없으면 부분 매칭을 시도합니다.
 * @param menus 메뉴 배열
 * @param currentPath 현재 경로
 * @param parent 현재 탐색 중인 부모 메뉴 (내부 사용)
 * @returns 찾은 메뉴 항목과 부모 메뉴를 포함한 객체, 없으면 null
 */
function findMenuItemByPathRecursive(
  menus: TreeItem[],
  currentPath: string,
  parent: TreeItem | null = null
): { item: TreeItem; parent: TreeItem | null } | null {
  for (const menu of menus) {
    if (menu.path && pathsMatch(menu.path, currentPath)) {
      return { item: menu, parent };
    }

    if (menu.children && menu.children.length > 0) {
      const result = findMenuItemByPathRecursive(menu.children, currentPath, menu);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

/**
 * 부분 매칭을 시도하여 가장 긴 경로로 시작하는 메뉴 항목을 찾습니다.
 * 동적 라우트 파라미터가 있는 경우를 처리합니다.
 */
function findMenuItemByPartialPath(
  menus: TreeItem[],
  currentPath: string,
  parent: TreeItem | null = null
): { item: TreeItem; parent: TreeItem | null } | null {
  const normalizedCurrent = normalizePath(currentPath);
  let bestMatch: { item: TreeItem; parent: TreeItem | null } | null = null;
  let bestMatchLength = 0;

  for (const menu of menus) {
    if (menu.path) {
      const normalizedMenu = normalizePath(menu.path);
      // 현재 경로가 메뉴 경로로 시작하는지 확인
      if (
        normalizedCurrent.startsWith(normalizedMenu + "/") ||
        normalizedCurrent === normalizedMenu
      ) {
        if (normalizedMenu.length > bestMatchLength) {
          bestMatch = { item: menu, parent };
          bestMatchLength = normalizedMenu.length;
        }
      }
    }

    if (menu.children && menu.children.length > 0) {
      const result = findMenuItemByPartialPath(menu.children, currentPath, menu);
      if (result && result.item.path) {
        const resultPath = normalizePath(result.item.path);
        if (
          normalizedCurrent.startsWith(resultPath) &&
          resultPath.length > bestMatchLength
        ) {
          bestMatch = result;
          bestMatchLength = resultPath.length;
        }
      }
    }
  }

  return bestMatch;
}

/**
 * 재귀적으로 메뉴 구조를 탐색하여 현재 경로와 일치하는 메뉴 항목을 찾습니다.
 * 정확한 매칭을 우선 시도하고, 없으면 부분 매칭을 시도합니다.
 */
export function findMenuItemByPath(
  menus: TreeItem[],
  currentPath: string,
  parent: TreeItem | null = null
): { item: TreeItem; parent: TreeItem | null } | null {
  // 1단계: 정확한 경로 매칭 시도
  const exactMatch = findMenuItemByPathRecursive(menus, currentPath, parent);
  if (exactMatch) {
    return exactMatch;
  }

  // 2단계: 부분 매칭 시도 (동적 라우트 파라미터 처리)
  return findMenuItemByPartialPath(menus, currentPath, parent);
}

/**
 * 특정 메뉴 항목의 부모 메뉴를 찾습니다.
 * @param menus 메뉴 배열
 * @param targetItem 찾을 메뉴 항목
 * @returns 부모 메뉴, 없으면 null
 */
export function findParentMenu(menus: TreeItem[], targetItem: TreeItem): TreeItem | null {
  for (const menu of menus) {
    // 현재 메뉴의 자식 중에 targetItem이 있는지 확인 (path로 비교)
    if (
      menu.children &&
      menu.children.some(
        (child) =>
          child.path && targetItem.path && pathsMatch(child.path, targetItem.path)
      )
    ) {
      return menu;
    }

    // 자식 메뉴가 있으면 재귀적으로 탐색
    if (menu.children && menu.children.length > 0) {
      const parent = findParentMenu(menu.children, targetItem);
      if (parent) {
        return parent;
      }
    }
  }

  return null;
}

/**
 * Router.tsx의 라우트 구조를 이용하여 브레드크럼 배열을 생성합니다.
 * useMatches()로 가져온 매칭된 라우트 정보를 사용합니다.
 * @param matches useMatches()로 가져온 라우트 매칭 정보
 * @param params URL 파라미터 (titleKey: "Board"인 경우 사용)
 * @param boardConfig BOARD_CONFIG (titleKey: "Board"인 경우 사용)
 * @returns 브레드크럼 배열 [{ label: "최상위메뉴" }, { label: "부모메뉴" }, { label: "현재페이지" }]
 */
export function getBreadcrumbs(
  matches: RouteMatch[],
  params?: Params<string>,
  boardConfig?: Record<string, { title: string; parentTitle?: string }>
): Array<{ label: string }> {
  const breadcrumbs: Array<{ label: string }> = [];

  // 매칭된 라우트들을 순회하면서 handle.title이 있는 것만 브레드크럼에 추가
  matches.forEach((match) => {
    if (!match.handle) return;

    let label: string | undefined;

    // titleKey가 "Board"인 경우 boardConfig에서 제목을 가져옴
    if (match.handle.titleKey === "Board" && params?.boardType && boardConfig) {
      const boardType = params.boardType as keyof typeof boardConfig;
      const config = boardConfig[boardType];

      if (config) {
        // 🔹 부모 먼저 삽입
        if (
          config.parentTitle &&
          !breadcrumbs.some((b) => b.label === config.parentTitle)
        ) {
          breadcrumbs.push({ label: config.parentTitle });
        }

        label = config.title;
      }
    } else if (match.handle.title) {
      // 일반 title이 있는 경우
      label = match.handle.title;
    }

      // label이 있고, 이전에 추가한 것과 중복되지 않으면 추가
      if (
        label &&
        (breadcrumbs.length === 0 || breadcrumbs[breadcrumbs.length - 1].label !== label)
      ) {
      breadcrumbs.push({ label });
    }
  });

  return breadcrumbs;
}
