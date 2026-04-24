import type { CollapsibleNavItem } from "@/components/tree-menu/collapsibleSideNav.types";

/** leaf 메뉴 key 중 현재 pathname과 일치·하위 경로인 가장 구체적인 key */
export function findSelectedMenuKey(pathname: string, items: CollapsibleNavItem[]): string {
  const pathKeys: string[] = [];

  const collectLeaves = (list: CollapsibleNavItem[]) => {
    for (const it of list) {
      if (it.children?.length) {
        collectLeaves(it.children);
      } else if (it.key.startsWith("/")) {
        pathKeys.push(it.key);
      }
    }
  };

  collectLeaves(items);
  pathKeys.sort((a, b) => b.length - a.length);

  return (
    pathKeys.find((key) => pathname === key || pathname.startsWith(`${key}/`)) ?? ""
  );
}

/** leaf `menuKey`가 속한 1뎁스·중첩 그룹의 key 목록 (서브메뉴 자동 펼침용) */
export function findAncestorKeysForLeafMenuKey(menuKey: string, items: CollapsibleNavItem[]): string[] {
  const result: string[] = [];

  const walk = (list: CollapsibleNavItem[], ancestors: string[]): boolean => {
    for (const it of list) {
      if (it.children?.length) {
        if (walk(it.children, [...ancestors, it.key])) return true;
      } else if (it.key === menuKey) {
        result.push(...ancestors);
        return true;
      }
    }
    return false;
  };

  walk(items, []);
  return result;
}
