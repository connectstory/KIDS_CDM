import { useCallback, useEffect, useMemo, useState } from "react";
import { matchPath, useLocation } from "react-router-dom";
import styles from "./TreeMenu.module.css";
import TreeNode, { type TreeItem } from "./TreeNode";

function normalizePath(s: string): string {
  return s.replace(/\/+$/, "") || "/";
}

function pathMatchesMenuForExpand(menuPath: string, pathname: string): boolean {
  const p = menuPath.trim();
  if (!p) return false;

  const mp = normalizePath(p);
  const lp = normalizePath(pathname);

  if (mp.includes(":")) {
    // 펼침은 현재 경로가 이 메뉴 아래에 있다고 보면 end=false까지 허용
    return matchPath({ path: mp, end: true }, lp) != null || matchPath({ path: mp, end: false }, lp) != null;
  }

  // 펼침은 정적 라우트도 prefix 포함
  return lp === mp || lp.startsWith(mp + "/");
}

/** 현재 URL과 맞는 가장 깊은 항목까지 부모·자신 id 체인 (자식 매칭을 부모 자체 매칭보다 우선) */
function findExpandedIdChain(
  items: TreeItem[],
  pathname: string,
  matches: (menuPath: string, pathname: string) => boolean,
  prefix: string[] = []
): string[] | null {
  for (const item of items) {
    const chain = [...prefix, item.id];
    if (item.children?.length) {
      const deeper = findExpandedIdChain(item.children, pathname, matches, chain);
      if (deeper) return deeper;
    }
    if (item.path && matches(item.path, pathname)) {
      return chain;
    }
  }
  return null;
}

function expandedIdsForPathname(data: TreeItem[], pathname: string): Set<string> {
  const chain = findExpandedIdChain(data, pathname, pathMatchesMenuForExpand);
  if (!chain?.length) return new Set();
  return new Set(chain);
}

function findItemById(items: TreeItem[], id: string): TreeItem | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children?.length) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

/** 접을 때 하위에 열린 노드 ID까지 제거 (1·2·3단계 동시 펼침 유지) */
function collectDescendantIds(item: TreeItem): string[] {
  if (!item.children?.length) return [];
  return item.children.flatMap((c) => [c.id, ...collectDescendantIds(c)]);
}

/** 같은 부모 아래 형제 목록(최상위면 `items` 전체) */
function findSiblingGroup(items: TreeItem[], id: string): TreeItem[] | null {
  if (items.some((x) => x.id === id)) return items;
  for (const item of items) {
    if (!item.children?.length) continue;
    if (item.children.some((c) => c.id === id)) return item.children;
    const deeper = findSiblingGroup(item.children, id);
    if (deeper) return deeper;
  }
  return null;
}

function removeBranchFromSet(set: Set<string>, root: TreeItem) {
  set.delete(root.id);
  for (const id of collectDescendantIds(root)) {
    set.delete(id);
  }
}

interface TreeMenuProps {
  data: TreeItem[];
  onSelect?: (item: TreeItem) => void;
}

function TreeMenu({ data, onSelect }: TreeMenuProps) {
  const location = useLocation();
  const routeExpanded = useMemo(() => expandedIdsForPathname(data, location.pathname), [data, location.pathname]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => routeExpanded);

  useEffect(() => {
    setExpandedIds(new Set(routeExpanded));
  }, [routeExpanded]);

  const handleExpand = useCallback(
    (nodeId: string, nodeLevel: number) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
          const node = findItemById(data, nodeId);
          if (node) {
            for (const id of collectDescendantIds(node)) {
              next.delete(id);
            }
          }
        } else {
          // 화면 2단(TreeNode level === 1): 같은 부모의 다른 형제는 접기
          if (nodeLevel === 1) {
            const siblings = findSiblingGroup(data, nodeId);
            if (siblings) {
              for (const s of siblings) {
                if (s.id === nodeId) continue;
                removeBranchFromSet(next, s);
              }
            }
          }
          next.add(nodeId);
        }
        return next;
      });
    },
    [data]
  );

  const handleSelect = useCallback(
    (item: TreeItem, level: number) => {
      if (level === 0) setExpandedIds(new Set());
      onSelect?.(item);
    },
    [onSelect]
  );

  return (
    <div id="lnb" className={styles.root}>
      <ul className={styles.lnbList}>
        {data.map((item) => (
          <TreeNode
            key={item.id}
            item={item}
            level={0}
            expandedIds={expandedIds}
            onExpand={handleExpand}
            onSelect={handleSelect}
          />
        ))}
      </ul>
    </div>
  );
}

export default TreeMenu;
