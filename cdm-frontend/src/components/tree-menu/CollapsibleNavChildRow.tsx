import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { setActiveMenuSn } from "@/api/axios";
import styles from "@/components/tree-menu/CollapsibleSideNav.module.css";
import type { CollapsibleNavItem } from "@/components/tree-menu/collapsibleSideNav.types";

type Props = Readonly<{
  child: CollapsibleNavItem;
  collapsed: boolean;
  selected: boolean;
  onSelect?: (key: string) => void;
}>;

export default function CollapsibleNavChildRow({ child, collapsed, selected, onSelect }: Props) {
  return (
    <li>
      <button
        type="button"
        className={[
          styles.navButton,
          styles.childRow,
          collapsed ? styles.childRowCollapsed : "",
          collapsed ? styles.dimWhenCollapsed : "",
          selected ? styles.childRowSelected : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-current={selected ? "page" : undefined}
        onClick={() => {
          setActiveMenuSn(child.menuSn);
          // 인터셉터에서 자동 등록되므로 수동 호출 불필요
          // axios.post("/auth/access-history", { menuPath: child.key, menuSn: child.menuSn, flfmtTaskCd: "1" }).catch(() => {});
          if (child.isExternal) {
            window.open(child.key, "_blank");
          } else {
            onSelect?.(child.key);
          }
        }}
      >
        <span className={styles.childLabel}>{child.label}</span>
        {!collapsed && child.isExternal && <OpenInNewIcon className={styles.externalIcon} aria-hidden />}
      </button>
    </li>
  );
}
