import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { CONTENT_GAP } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { downloadFileViaProxy } from "@/api/commonApi";
import { ResearchAPI } from "@/api/researchApi";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { formatFileSize, getFileExtension } from "@/utils/common";
import { resolveModal } from "@/utils/modalPromise";
import { researchKeys } from "@/hooks/research/researchQueryKeys";
import { useResearchFiles } from "@/hooks/research/useResearchQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import FileContainer, { type FileData } from "@/components/FileContainer";
import FileDropZone from "@/components/FileDropzone";
import { SpaceBox } from "@/components/SpaceBox";
import BaseModal from "@/components/modal/BaseModal";

interface IrbUploadModalData {
  asmtSn?: number;
}

export default function IrbUploadModal() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.IrbUpload]);
  const confirmModal = useModal(ModalNames.CONFIRM);
  const { showAlert } = useGlobalAlert();
  const [files, setFiles] = useState<FileData[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const asmtSn = (modal?.data as IrbUploadModalData | undefined)?.asmtSn;
  const enabled = !!asmtSn && !!modal?.open;
  const { data: irbFiles = [], refetch: refetchIrbFiles } = useResearchFiles(asmtSn, "01", "01", enabled);

  if (!modal?.open) return null;

  const existingIrbFiles: FileData[] = irbFiles
    .filter((f) => !!f?.atchFileId)
    .map((f) => ({
      name: f.fileNm,
      ext: f.fileExtNm ?? getFileExtension(f.fileNm),
      size: formatFileSize(f.fileSz ?? 0),
      atchFileId: f.atchFileId,
      atchFileGroupId: f.atchFileGroupId,
      showDeleteButton: true,
    }));

  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.IrbUpload, result);
    dispatch(closeModal(ModalNames.IrbUpload));
    setFiles([]);
    setUploadFiles([]);
  };

  const handleFileDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      setFiles((prev) => [...prev, { name: file.name, ext: getFileExtension(file.name), size: formatFileSize(file.size) }]);
      setUploadFiles((prev) => [...prev, file]);
    });
  };

  const handleFileDelete = (fileToDelete: FileData) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileToDelete.name));
    setUploadFiles((prev) => prev.filter((f) => f.name !== fileToDelete.name));
  };

  const handleExistingFileDelete = async (file: FileData) => {
    if (!asmtSn || !file.atchFileId) return;
    const ok = await confirmModal.open({
      title: "확인",
      message: ["선택한 IRB 파일을 삭제하시겠습니까?"],
      data: {},
    });
    if (!ok) return;

    setSubmitting(true);
    try {
      await ResearchAPI.deleteIrbFile(asmtSn, file.atchFileId);
      await refetchIrbFiles();
      await queryClient.invalidateQueries({ queryKey: researchKeys.researchPartners(asmtSn) });
      showAlert({ message: "IRB 파일이 삭제되었습니다.", severity: "success" });
    } catch {
      showAlert({ message: "IRB 파일 삭제에 실패했습니다.", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (asmtSn == null || asmtSn === undefined) {
      showAlert({ message: "연구과제 정보가 없습니다.", severity: "error" });
      return;
    }
    if (uploadFiles.length === 0) {
      handleClose(true);
      return;
    }
    setSubmitting(true);
    try {
      await ResearchAPI.uploadIrbFiles(asmtSn, uploadFiles);
      setFiles([]);
      setUploadFiles([]);
      await refetchIrbFiles();
      await queryClient.invalidateQueries({ queryKey: researchKeys.researchPartners(asmtSn) });
      showAlert({ message: "IRB/DRB 파일이 업로드되었습니다.", severity: "success" });
      handleClose(true);
    } catch {
      showAlert({ message: "IRB/DRB 파일 업로드에 실패했습니다.", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      open={modal.open}
      onClose={() => handleClose(false)}
      title="IRB/DRB"
      width="md"
      fullWidth={true}
      footer={
        <Button variant="contained" onClick={() => handleConfirm()} disabled={submitting}>
          {submitting ? "업로드 중..." : "확인"}
        </Button>
      }
    >
      <Box position="relative">
        <Stack direction="column" spacing={CONTENT_GAP.LARGE}>
          <Box>
            <Box className="sub_path">
              <Typography className="tit" variant="h5">
                IRB/DRB 첨부
              </Typography>
            </Box>
            <SpaceBox gap={CONTENT_GAP.MEDIUM} />

            {/* 기존 업로드된 IRB 파일 리스트 */}
            {existingIrbFiles.length > 0 && (
              <>
                <FileContainer
                  files={existingIrbFiles}
                  showDeleteButton={true}
                  onClick={(file) => {
                    if (!file.atchFileId) return;
                    // window.open(getFileDownloadUrl(file.atchFileId), "_blank");
                    downloadFileViaProxy(file.atchFileId, file.name);
                  }}
                  onDelete={handleExistingFileDelete}
                />
                <SpaceBox gap={CONTENT_GAP.XSMALL} />
              </>
            )}

            {/* 업로드 대기 파일 리스트 */}
            {files.length > 0 && (
              <FileContainer files={files} showDeleteButton={true} onDelete={handleFileDelete}></FileContainer>
            )}
            <SpaceBox gap={CONTENT_GAP.SMALL} />
            {/* 파일 업로드 영역 */}
            <FileDropZone
              onDrop={handleFileDrop}
              acceptExtensions={[".jpg", ".jpeg", ".png", ".webp", ".bmp", ".pdf", "doc", "docx", "ppt", "pptx", "hwp", "hwpx"]}
            ></FileDropZone>
            <Typography variant="description">IRB/DRB 관련 파일을 첨부해주세요.</Typography>

            <SpaceBox gap={CONTENT_GAP.SMALL} />

            {/* 버튼 */}
            {/* <Box className="btn_container btn_right">
              <Button variant="contained" color="primary" onClick={handleConfirm}>
                확인
              </Button>
            </Box> */}
          </Box>
        </Stack>
      </Box>
    </BaseModal>
  );
}
