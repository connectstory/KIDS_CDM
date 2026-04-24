import { useCallback, useState } from "react";

export function useCollapsibleNavOpenState() {
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});

  const toggleOpen = useCallback((key: string) => {
    setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isOpen = useCallback((key: string) => openKeys[key] ?? false, [openKeys]);

  return { toggleOpen, isOpen, setOpenKeys };
}
