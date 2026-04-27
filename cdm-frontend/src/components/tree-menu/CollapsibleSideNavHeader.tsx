import { Menu as MenuIcon, MenuOpen as MenuOpenIcon } from "@mui/icons-material";
import styles from "@/components/tree-menu/CollapsibleSideNav.module.scss";

type Props = {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
};

export default function CollapsibleSideNavHeader({ title, collapsed, onToggle }: Props) {
  return (
    <div className={[styles.header, collapsed ? styles.headerCollapsed : ""].filter(Boolean).join(" ")}>
      {!collapsed && <div className={styles.title}>{title}</div>}
      <button type="button" className={styles.toggleBtn} aria-label="메뉴 접기·펼치기" onClick={onToggle}>
        {collapsed ? (
          <MenuIcon className={styles.headerMenuIcon} aria-hidden />
        ) : (
          <MenuOpenIcon className={styles.headerMenuIcon} aria-hidden />
        )}
      </button>
    </div>
  );
}
