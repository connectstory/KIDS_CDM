import { useEffect } from "react";
import CollapsibleNavParentSection from "@/components/tree-menu/CollapsibleNavParentSection";
import CollapsibleSideNavHeader from "@/components/tree-menu/CollapsibleSideNavHeader";
import styles from "@/components/tree-menu/CollapsibleSideNav.module.css";
import type { CollapsibleSideNavProps } from "@/components/tree-menu/collapsibleSideNav.types";
import { useCollapsibleNavOpenState } from "@/components/tree-menu/useCollapsibleNavOpenState";
import { findAncestorKeysForLeafMenuKey } from "@/utils/menuRouteMatch";

export type { CollapsibleNavItem, CollapsibleSideNavProps } from "@/components/tree-menu/collapsibleSideNav.types";

export default function CollapsibleSideNav({
  title,
  collapsed,
  onToggle,
  items,
  selectedKey,
  width = 280,
  collapsedWidth = 72,
  onSelect,
}: CollapsibleSideNavProps) {
  const drawerWidth = collapsed ? collapsedWidth : width;
  const selected = selectedKey ?? "";
  const { toggleOpen, isOpen, setOpenKeys } = useCollapsibleNavOpenState();

  useEffect(() => {
    if (!selected) return;
    const ancestors = findAncestorKeysForLeafMenuKey(selected, items);
    if (ancestors.length === 0) return;
    setOpenKeys((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const k of ancestors) {
        if (!next[k]) {
          next[k] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selected, items, setOpenKeys]);

  return (
    <nav className={styles.drawerRoot} aria-label="사이드 메뉴">
      <div className={styles.drawerPaper} style={{ width: drawerWidth }}>
        <CollapsibleSideNavHeader title={title} collapsed={collapsed} onToggle={onToggle} />
        <ul className={styles.navList}>
          {items.map((it) => (
            <CollapsibleNavParentSection
              key={it.key}
              item={it}
              collapsed={collapsed}
              selectedKey={selected}
              submenuOpen={isOpen(it.key)}
              onToggleSubmenu={() => toggleOpen(it.key)}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </div>
    </nav>
  );
}
