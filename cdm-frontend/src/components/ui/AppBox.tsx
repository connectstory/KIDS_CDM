import { Box, type BoxProps } from "@mui/material";

/**
 * 레이아웃용 Box 래퍼.
 * - layout 목적의 sx는 허용합니다.
 */
export type AppBoxProps = BoxProps;

export function AppBox(props: AppBoxProps) {
  return <Box {...props} />;
}

