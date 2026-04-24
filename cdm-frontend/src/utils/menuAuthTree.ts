import type { MenuAuthItem } from "@/interfaces/menuAuthInterface";
import type { TreeItem } from "@/components/tree-menu/TreeNode";

export interface MenuAuthTreeOptions {
  mapPath?: (url: string) => string;
}

function resolveMenuPath(rawUrl: string, options?: MenuAuthTreeOptions): string | undefined {
  if (!rawUrl) return undefined;
  if (options?.mapPath) return options.mapPath(rawUrl);
  return rawUrl;
}

function isRootItem(item: MenuAuthItem): boolean {
  const u = item.upMenuSn;
  return u === "" || u === null || u === undefined;
}

function sortMenuItems(a: MenuAuthItem, b: MenuAuthItem): number {
  const sa = a.menuSeq ?? a.menuSn;
  const sb = b.menuSeq ?? b.menuSn;
  if (sa !== sb) return Number(sa) - Number(sb);
  return a.menuSn - b.menuSn;
}

/**
 * 평면 `menuAuthList`를 `taskSeCd + upMenuSn` 복합키 트리로 바꿔 TreeMenu용 `TreeItem[]`로 만든다.
 * upMenuSn이 같아도 taskSeCd가 다르면 별도 그룹으로 처리해 메뉴 혼용을 방지한다.
 */
export function menuAuthListToTreeItems(list: MenuAuthItem[] | undefined | null, options?: MenuAuthTreeOptions): TreeItem[] {
  if (!list?.length) return [];

  // 루트는 null 키, 나머지는 `${taskSeCd}:${upMenuSn}` 복합키
  const byParent = new Map<string | null, MenuAuthItem[]>();

  for (const item of list) {
    const tse = item.taskSeCd ?? "";
    const pk: string | null = isRootItem(item) ? null : `${tse}:${String(item.upMenuSn)}`;
    const arr = byParent.get(pk) ?? [];
    arr.push(item);
    byParent.set(pk, arr);
  }
  for (const arr of byParent.values()) {
    arr.sort(sortMenuItems);
  }

  const build = (taskSeCd: string, parentSn: string, idPrefix: string): TreeItem[] => {
    const key = `${taskSeCd}:${parentSn}`;
    const items = byParent.get(key) ?? [];
    return items.map((item, idx) => {
      const snStr = String(item.menuSn);
      const uniqueId = `${idPrefix}>${idx}:${snStr}`;
      const childTree = build(item.taskSeCd ?? "", snStr, uniqueId);
      const rawUrl = item.menuUrl?.trim() ?? "";
      const path = resolveMenuPath(rawUrl, options);
      return { id: uniqueId, label: item.menuNm, path, menuSn: item.menuSn, children: childTree.length ? childTree : undefined };
    });
  };

  const roots = byParent.get(null) ?? [];
  roots.sort(sortMenuItems);

  return roots.map((item, idx) => {
    const snStr = String(item.menuSn);
    const tse = item.taskSeCd ?? "";
    const rootId = `${idx}:${tse}:${snStr}`;
    const childTree = build(tse, snStr, rootId);
    const rawUrl = item.menuUrl?.trim() ?? "";
    const path = resolveMenuPath(rawUrl, options);
    return { id: rootId, label: item.menuNm, path, menuSn: item.menuSn, children: childTree.length ? childTree : undefined };
  });
}
