export type CollapsibleNavItem = {
  key: string;
  label: string;
  menuSn?: number;
  disabled?: boolean;
  isExternal?: boolean;
  children?: CollapsibleNavItem[];
};

export type CollapsibleSideNavProps = {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  items: CollapsibleNavItem[];
  selectedKey?: string;
  width?: number;
  collapsedWidth?: number;
  onSelect?: (key: string) => void;
};
