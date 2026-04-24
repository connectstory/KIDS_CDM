import { Typography } from "@mui/material";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { setActiveMenuSn } from "@/api/axios";
import styles from "./TreeMenu.module.css";

export interface TreeItem {
  id: string;
  label: string;
  path?: string;
  menuSn?: number;
  children?: TreeItem[];
}

interface TreeNodeProps {
  readonly item: TreeItem;
  readonly level: number;
  readonly expandedIds?: Set<string>;
  readonly onExpand?: (nodeId: string, level: number) => void;
  readonly onSelect?: (item: TreeItem, level: number) => void;
}

function TreeNode({ item, level, expandedIds = new Set(), onExpand, onSelect }: TreeNodeProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const expanded = expandedIds.has(item.id);

  const normalizePath = (s: string) => s.replace(/\/+$/, "") || "/";
  const menuPath = item.path?.trim();
  const menuActive =
    !!menuPath &&
    (menuPath.includes(":")
      ? matchPath({ path: normalizePath(menuPath), end: false }, normalizePath(pathname)) != null
      : (() => {
          const mp = normalizePath(menuPath);
          const lp = normalizePath(pathname);
          return lp === mp || lp.startsWith(mp + "/");
        })());

  const handleClick = () => {
    if (item.children?.length) {
      onExpand?.(item.id, level);
    } else {
      setActiveMenuSn(item.menuSn);
      onSelect?.(item, level);
      // 인터셉터에서 자동 등록되므로 수동 호출 불필요
      // axiosInstance.post("/auth/access-history", { menuPath: item.path, menuSn: item.menuSn, flfmtTaskCd: "1" }).catch(() => {});
      // item.path에 /cm/, /ucm/이 없다면 globalThis.location.href를 사용하여 이동
      if (item.path?.includes("/cm/") || item.path?.includes("/ucm/")) {
        navigate(item.path);
      } else if (item.path?.includes("http://") || item.path?.includes("https://")) {
        // 외부 URL: 프로토콜 포함
        globalThis.location.href = item.path;
      } else {
        // 외부 URL: 프로토콜 없음 → https 붙여서 이동
        globalThis.location.href = `${import.meta.env.VITE_CM_URL}${item.path}`;
      }
    }
  };

  const hasChildren = item.children && item.children.length > 0;
  let subTreeVariantClass = styles.subTreeDeep;
  if (level === 0) subTreeVariantClass = styles.subTreeTop;
  else if (level === 1) subTreeVariantClass = styles.subTreeNested;

  return (
    <li
      className={[hasChildren && styles.hasDepth, expanded && styles.on, level > 1 && styles.subItemDeep]
        .filter(Boolean)
        .join(" ")}
      data-tree-level={Math.min(level + 1, 3)}
    >
      <a
        onClick={handleClick}
        style={
          menuActive
            ? {
                background: "#ffffff60",
                borderRadius: 4,
              }
            : undefined
        }
      >
        <Typography
          variant={level === 0 ? "menuTitle" : "body2"}
          className={level > 1 ? styles.deepLabel : undefined}
          style={menuActive ? { fontWeight: 700 } : undefined}
        >
          {item.label}
        </Typography>
      </a>

      {hasChildren && (
        <ul
          className={[styles.subTreeGrid, expanded ? styles.subTreeGridExpanded : "", level === 0 ? styles.subTreeGridRoot : ""]
            .filter(Boolean)
            .join(" ")}
          aria-hidden={!expanded}
        >
          <li className={styles.subTreeGridHost}>
            <ul className={`${styles.subTreeInner} ${subTreeVariantClass}`}>
              {item.children!.map((child) => (
                <TreeNode
                  key={child.id}
                  item={child}
                  level={level + 1}
                  expandedIds={expandedIds}
                  onExpand={onExpand}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </li>
        </ul>
      )}
    </li>
  );
}

export default TreeNode;
