import { useCallback, useState } from "react";
import type { Breakpoint } from "@mui/material";
import { Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { ModalNames } from "@/interfaces/modalInterface";
import type { RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import Loader from "@/components/Loader";
import PdfPreviewViewer from "@/components/PdfPreviewViewer";
import BaseModal from "@/components/modal/BaseModal";

export interface PdfPreviewModalData {
  fileName?: string;
  /** 업로드된 파일 미리보기 시 preview URL (있으면 fileUrl 모드) */
  url?: string;
  /** 저장된 파일 ID (있으면 워터마크 적용 미리보기) */
  atchFileId?: string;
}

export default function PdfPreviewModal() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.PDF_PREVIEW]);
  const [loading, setLoading] = useState(true);

  const modalData = modal?.data as PdfPreviewModalData | undefined;
  const fileName = modalData?.fileName;
  const fileUrl = modalData?.url;
  const atchFileId = modalData?.atchFileId;

  const handleLoadingChange = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  if (!modal?.open) return null;

  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.PDF_PREVIEW, result);
    dispatch(closeModal(ModalNames.PDF_PREVIEW));
  };

  return (
    <BaseModal
      open={modal.open}
      onClose={() => handleClose(false)}
      title={modal.title ? modal.title : "미리보기"}
      width={modal.width ? (modal.width as Breakpoint) : "md"}
      fullWidth={modal.fullWidth ? modal.fullWidth : true}
    >
      <Box className="relative min-h-[400px]">
        <Loader isLoading={loading} />
        <PdfPreviewViewer
          fileName={fileName}
          fileUrl={fileUrl}
          displayFileName={fileName}
          atchFileId={atchFileId}
          minHeight={700}
          className="pdf-preview-in-modal max-h-[calc(100vh-160px)]"
          onLoadingChange={handleLoadingChange}
        />
      </Box>
    </BaseModal>
  );
}
