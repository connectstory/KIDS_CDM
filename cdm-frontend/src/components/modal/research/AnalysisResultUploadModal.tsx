import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { MSG } from "@/constants/string";
import { ModalNames } from "@/interfaces/modalInterface";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import BaseModal from "@/components/modal/BaseModal";

interface AnalysisResultModalData {
  title: string;
}

export default function AnalysisResultModal() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.AnalysisResultUpload]);

  const uploadAnalyticalRef = useRef<HTMLInputElement>(null);

  if (!modal?.open) return null;

  const modalData = modal.data as AnalysisResultModalData | undefined;

  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.AnalysisResultUpload, result);
    dispatch(closeModal(ModalNames.AnalysisResultUpload));
  };

  const labelCellSx = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
    minWidth: "10rem",
    maxWidth: "10rem",
    px: 2,
    py: 1.5,
    bgcolor: "grey.200",
    textAlign: "left",
  } as const;

  return (
    <BaseModal open={modal.open} onClose={() => handleClose(false)} title={modal.title}>
      <Box sx={{ height: 8 }} />

      <Box sx={{ pb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {modalData && modalData.title}
        </Typography>
      </Box>

      <Box sx={{ width: "100%", borderTop: 1, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", width: "100%", borderBottom: 1, borderColor: "divider" }}>
          <Box sx={labelCellSx}>
            <Typography component="p" sx={{ width: "100%", fontWeight: 600, m: 0 }}>
              분석결과 자료
              <Typography component="span" sx={{ px: 0.5, color: "error.main" }}>
                *
              </Typography>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", width: "100%", pl: 2, py: 1.5 }}>
            <Box
              onClick={() => uploadAnalyticalRef.current?.click()}
              sx={{
                width: "100%",
                bgcolor: "background.paper",
                borderRadius: 2,
                p: 2,
                border: "1px dashed",
                borderColor: "divider",
                cursor: "pointer",
                textAlign: "center",
                transition: (t) => t.transitions.create(["border-color", "background-color"]),
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                },
              }}
            >
              <input ref={uploadAnalyticalRef} style={{ display: "none" }} type="file" multiple name="uploadAnalytical" />
              <Box
                component="svg"
                sx={{ mx: "auto", height: 40, width: 40, color: "text.disabled", display: "block" }}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                파일을 드래그하거나 클릭하여 업로드
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PNG, JPG, PDF (최대 10MB)
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", width: "100%" }}>
          <Box sx={labelCellSx}>
            <Typography component="p" sx={{ width: "100%", fontWeight: 600, m: 0 }}>
              결과 설명
              <Typography component="span" sx={{ px: 0.5, color: "error.main" }}>
                *
              </Typography>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", width: "100%", pl: 2, py: 1.5 }}>
            <TextField
              fullWidth
              multiline
              minRows={4}
              placeholder={MSG.COMMENT_CONTENT_REQUIRED}
              // value={condition}
              // onChange={(e) => setCondition(e.target.value)}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ height: 20 }} />

      <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
        <Button variant="outlined" color="primary" onClick={() => handleClose(false)}>
          취소
        </Button>
        <Button variant="contained" color="primary" onClick={() => handleClose(true)}>
          확인
        </Button>
      </Stack>
    </BaseModal>
  );
}
