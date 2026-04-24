import { Box, type StackProps } from "@mui/material";
import { CONTENT_GAP, type CONTENT_GAP_TYPE } from "@/constants/types";

type SpaceBoxProps = StackProps & {
  gap?: CONTENT_GAP_TYPE; // spacing 값 (MUI spacing scale)
};

export function SpaceBox({ gap = CONTENT_GAP.MEDIUM }: SpaceBoxProps) {
  return <Box sx={{ height: (theme) => theme.spacing(gap) }} />;
}
