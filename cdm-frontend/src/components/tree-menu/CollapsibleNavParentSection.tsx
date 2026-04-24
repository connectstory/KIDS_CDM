import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { setActiveMenuSn } from "@/api/axios";
import type { CollapsibleNavItem } from "@/components/tree-menu/collapsibleSideNav.types";
import CollapsibleNavChildRow from "@/components/tree-menu/CollapsibleNavChildRow";
import styles from "@/components/tree-menu/CollapsibleSideNav.module.css";

type Props = Readonly<{
  item: CollapsibleNavItem;
  collapsed: boolean;
  selectedKey: string;
  submenuOpen: boolean;
  onToggleSubmenu: () => void;
  onSelect?: (key: string) => void;
}>;

export default function CollapsibleNavParentSection({
  item,
  collapsed,
  selectedKey,
  submenuOpen,
  onToggleSubmenu,
  onSelect,
}: Props) {
  const hasChildren = !!(item.children && item.children.length > 0);
  const parentSelected = selectedKey === item.key;
  const submenuExpanded = submenuOpen && !collapsed;

  return (
    <li className={styles.navRow}>
      <button
        type="button"
        className={[
          styles.navButton,
          styles.parentItem,
          collapsed ? styles.dimWhenCollapsed : "",
          parentSelected ? styles.parentItemSelected : "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={!!item.disabled}
        aria-current={!hasChildren && parentSelected ? "page" : undefined}
        aria-expanded={hasChildren ? submenuExpanded : undefined}
        onClick={() => {
          if (hasChildren) {
            onToggleSubmenu();
          } else if (item.isExternal) {
            window.open(item.key, "_blank");
          } else {
            setActiveMenuSn(item.menuSn);
            // 인터셉터에서 자동 등록되므로 수동 호출 불필요
            // axios.post("/auth/access-history", { menuPath: item.key, menuSn: item.menuSn, flfmtTaskCd: "1" }).catch(() => {});
            onSelect?.(item.key);
          }
        }}
      >
        <span className={styles.parentLabel}>{item.label}</span>
        {!collapsed && hasChildren && (
          <span className={styles.expandIcon} aria-hidden>
            {submenuOpen ? <ExpandLess /> : <ExpandMore />}
          </span>
        )}
      </button>

      {hasChildren && (
        <div
          className={[styles.submenuShell, submenuExpanded ? styles.submenuShellOpen : ""].filter(Boolean).join(" ")}
        >
          <div className={styles.submenuInner}>
            <ul className={styles.childList}>
              {item.children?.map((child) => (
                <CollapsibleNavChildRow
                  key={child.key}
                  child={child}
                  collapsed={collapsed}
                  selected={selectedKey === child.key}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}
