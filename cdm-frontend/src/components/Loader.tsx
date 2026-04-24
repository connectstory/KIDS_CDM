import { Box, CircularProgress } from "@mui/material";

interface LoaderProps {
  isLoading: boolean;
}

export default function Loader({ isLoading }: LoaderProps) {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        opacity: isLoading ? 1 : 0,
        transition: isLoading ? "opacity 0s ease-in-out" : "opacity 1.5s ease-in-out",
        pointerEvents: isLoading ? "auto" : "none",
      }}
    >
      <CircularProgress color="success" />
    </Box>
  );
}
