import { TextField, type TextFieldProps } from "@mui/material";

/**
 * 프로젝트 공통 TextField 래퍼.
 * - sx 금지: 스타일은 theme override로만.
 */
export type AppTextFieldProps = Omit<TextFieldProps, "sx"> & { sx?: never };

export function AppTextField(props: AppTextFieldProps) {
  return <TextField {...props} />;
}

