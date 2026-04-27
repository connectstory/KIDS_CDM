import { ResearchAPI, downloadFileViaProxy } from "@/api";
import { Box, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { ModalNames } from "@/interfaces/modalInterface";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { formatFileSize } from "@/utils/common";
import { resolveModal } from "@/utils/modalPromise";
import { useResearchFiles } from "@/hooks/research/useResearchQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import type { FileData } from "@/components/FileContainer";
import FileContainer from "@/components/FileContainer";
import BaseModal from "@/components/modal/BaseModal";

interface ModalData {
  name?: string;
  asmtSn?: number;
  /** 참여기관 일련번호. 전달 시 해당 참여기관이 업로드한 IRB만 조회 */
  asmtPtcpInstSn?: number;
}

/** RESEARCH_IRB 파일구분코드 (백엔드 FileCodeType.RESEARCH_IRB) */
const IRB_FILE_SE_CD = "01";
/** CDM_DRB 파일구분코드 (백엔드 FileCodeType.CDM_DRB) */
const DRB_FILE_SE_CD = "07";

export default function IrbViewModal() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.IrbView]);
  const confirmModal = useModal(ModalNames.CONFIRM);
  const { showAlert } = useGlobalAlert();

  const modalData = modal?.data as ModalData | undefined;
  const asmtSn = modalData?.asmtSn ?? null;
  const asmtPtcpInstSn = modalData?.asmtPtcpInstSn ?? null;

  const enabled = !!asmtSn && !!modal?.open;
  const { data: irbFiles = [], refetch: refetchIrbFiles } = useResearchFiles(
    asmtSn,
    IRB_FILE_SE_CD,
    "01",
    enabled,
    asmtPtcpInstSn
  );
  const { data: drbFiles = [], refetch: refetchDrbFiles } = useResearchFiles(
    asmtSn,
    DRB_FILE_SE_CD,
    "01",
    enabled,
    asmtPtcpInstSn
  );

  // 참여기관 IRB 조회 모드(asmtPtcpInstSn 전달)에서는 삭제 불가. 내 IRB 조회 모드에서만 IRB 삭제 허용.
  const canDeleteIrb = !!asmtSn && asmtPtcpInstSn == null;

  const irbFileList: FileData[] = irbFiles
    .filter((f) => !!f?.atchFileId)
    .map((f) => ({
      name: f.fileNm,
      ext: f.fileExtNm ?? (f.fileNm?.split(".").pop() || ""),
      size: formatFileSize(f.fileSz ?? 0),
      atchFileId: f.atchFileId,
      atchFileGroupId: f.atchFileGroupId,
      showDeleteButton: canDeleteIrb,
    }));

  const drbFileList: FileData[] = drbFiles
    .filter((f) => !!f?.atchFileId)
    .map((f) => ({
      name: f.fileNm,
      ext: f.fileExtNm ?? (f.fileNm?.split(".").pop() || ""),
      size: formatFileSize(f.fileSz ?? 0),
      atchFileId: f.atchFileId,
      atchFileGroupId: f.atchFileGroupId,
      showDeleteButton: false, // DRB는 삭제 불가
    }));

  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.IrbView, result);
    dispatch(closeModal(ModalNames.IrbView));
  };

  const handleDelete = async (file: FileData) => {
    if (!asmtSn || !file.atchFileId) return;

    // DRB는 항상 삭제 불가 (UI에서도 숨기지만, 방어적으로 막음)
    const isDrb = drbFileList.some((f) => f.atchFileId === file.atchFileId);
    if (isDrb) {
      showAlert({ message: "DRB 파일은 삭제할 수 없습니다.", severity: "warning" });
      return;
    }

    const ok = await confirmModal.open({
      title: "확인",
      message: ["선택한 IRB 파일을 삭제하시겠습니까?"],
      data: {},
    });
    if (!ok) return;

    try {
      await ResearchAPI.deleteIrbFile(asmtSn, file.atchFileId);
      await refetchIrbFiles();
      await refetchDrbFiles();
      showAlert({ message: "IRB 파일이 삭제되었습니다.", severity: "success" });
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || "파일 삭제에 실패했습니다.";
      showAlert({ message, severity: "error" });
    }
  };

  return (
    <BaseModal open={!!modal?.open} onClose={() => handleClose(false)} title="IRB/DRB" width="sm" fullWidth={true}>
      <Box sx={{ color: "text.primary", whiteSpace: "pre-line", mb: 3 }}>
        <Typography variant="subtitle">{modalData?.name}</Typography>
      </Box>

      <div>
        <FileContainer
          files={irbFileList}
          showDeleteButton={false}
          onClick={(file) => {
            if (!file.atchFileId) return;

            // window.open(getFileDownloadUrl(file.atchFileId), "_blank");

            downloadFileViaProxy(file.atchFileId, file.name);
          }}
          onDelete={handleDelete}
        />
        <FileContainer
          files={drbFileList}
          showDeleteButton={false}
          onClick={(file) => {
            if (!file.atchFileId) return;

            // window.open(getFileDownloadUrl(file.atchFileId), "_blank");

            downloadFileViaProxy(file.atchFileId, file.name);
          }}
          onDelete={handleDelete}
        />
      </div>

      <div className="h-10"></div>

      {/* 버튼 */}
      <div className="flex justify-end gap-3">
        {/* <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => handleClose(false)}
        >
          취소
        </button> */}
        {/* <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => handleClose(true)}
        >
          확인
        </button> */}
      </div>
    </BaseModal>
  );
}
