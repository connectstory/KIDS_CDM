import { IconButton, type IconButtonProps } from "@mui/material";

/**
 * 프로젝트 공통 IconButton 래퍼.
 * - sx 금지: 스타일은 theme override로만.
 */
export type AppIconButtonProps = Omit<IconButtonProps, "sx"> & { sx?: never };

export function AppIconButton(props: AppIconButtonProps) {
  return <IconButton {...props} />;
}

