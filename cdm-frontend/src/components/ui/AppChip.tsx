import { Chip, type ChipProps } from "@mui/material";
import { styled } from "@mui/material/styles";

/**
 * 프로젝트 공통 Chip 래퍼.
 * - sx 금지: 상태 색상은 `utils/common`의 chipStyle 또는 theme 팔레트만 사용.
 */
export type AppChipProps = Omit<ChipProps, "sx"> & { sx?: never };

const WhiteChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
}));

export function AppChip(props: AppChipProps) {
  return <WhiteChip {...props} />;
}

