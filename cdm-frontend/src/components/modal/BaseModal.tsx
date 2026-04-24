import type React from "react";
import type { Breakpoint } from "@mui/material";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import BaseModalStyles from "./BaseModal.module.css";

export default function BaseModal({
  open,
  onClose,
  children,
  width = false,
  fullWidth = true,
  showHeader = true,
  showCloseButton = true,
  zIndex,
  title = "모달 제목을 설정해주세요.",
  footer,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: Breakpoint | false;
  fullWidth?: boolean;
  showHeader?: boolean;
  showCloseButton?: boolean;
  zIndex?: number;
  title?: string;
  footer?: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={width}
      fullWidth={fullWidth}
      sx={{
        ...(zIndex ? { zIndex } : null),
        "& .MuiDialog-container": {
          display: "flex",
          position: "fixed",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        },
        "& .MuiPaper-root": {
          overflow: "hidden",
          margin: "auto",
          borderRadius: "10px",
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            ...(zIndex ? { zIndex: zIndex - 1 } : null),
          },
        },
      }}
    >
      {showHeader && (
        <DialogTitle className={BaseModalStyles.modal_header}>
          <Typography variant="h4" component="span">
            {title}
          </Typography>

          {showCloseButton && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={() => ({
                position: "absolute",
                right: 16,
                top: 12,
                width: 32,
                height: 32,
              })}
            >
              <i className="text-2xl fa-solid fa-xmark" />
            </IconButton>
          )}
        </DialogTitle>
      )}

      <DialogContent className={BaseModalStyles.modal_content}>{children}</DialogContent>

      {footer && <Box className={BaseModalStyles.modal_footer}>{footer}</Box>}
    </Dialog>
  );
}
