import { Button, type ButtonProps } from "@mui/material";

/**
 * 프로젝트 공통 버튼 래퍼.
 * - 화면 코드에서 임의 색/스타일을 sx로 주입하는 것을 막기 위해 sx를 금지합니다.
 * - 변형은 theme.components(MuiButton) 또는 variant로만 합니다.
 */
export type AppButtonProps = Omit<ButtonProps, "sx"> & { sx?: never };

export function AppButton(props: AppButtonProps) {
  return <Button disableElevation {...props} />;
}

