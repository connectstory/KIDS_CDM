import { Chip, type ChipProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

/**
 * 상태 표현 전용 Chip.
 * - 화면에서 sx를 직접 넘기지 못하게 막고,
 * - `utils/common`에서 내려오는 chipStyle만 주입 가능하게 합니다.
 */
export type AppStatusChipProps = Omit<ChipProps, "sx" | "label"> & {
  label: ChipProps["label"];
  chipStyle?: SxProps<Theme>;
};

export function AppStatusChip({ chipStyle, ...props }: AppStatusChipProps) {
  return <Chip {...props} sx={chipStyle ?? {}} />;
}

