import { Stack, type StackProps } from "@mui/material";

/**
 * 레이아웃용 Stack 래퍼.
 * - layout 목적의 sx는 허용합니다.
 */
export type AppStackProps = StackProps;

export function AppStack(props: AppStackProps) {
  return <Stack {...props} />;
}

