/**
 * IRB/DRB 파일 조회 모달 컴포넌트
 * 참여기관이 업로드한 IRB/DRB 파일을 조회하는 모달
 *
 * 주요 기능:
 * - 기관명 표시
 * - IRB/DRB 파일 목록 표시 (공시 파일 API 조회 후 file_se_cd=02 필터)
 * - 파일 다운로드
 */
import { useMemo } from "react";
import { DisclosureAPI } from "@/api";
import { Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import FileContainer, { type FileData } from "@/components/FileContainer";
import BaseModal from "@/components/modal/BaseModal";

/** 공시 파일 API 응답 한 건 (SQL alias에 쌍따옴표를 사용하여 camelCase 유지) */
interface DisclosureFileRow {
  pstSn?: number;
  ptcpInstSn?: number | null;
  atchFileSn?: string;
  atchFileId?: string;
  strgFileNm?: string;
  fileSeCd?: string;
  fileSz?: number | string;
  fileSeq?: number;
  atchFileGroupId?: string;
  fileStrgPathDsctn?: string;
  fileExtnNm?: string;
  uldTaskSeCd?: string;
  regDt?: string;
  rgtrId?: string;
}

interface ModalData {
  name: string;
  files?: FileData[];
  pblntSn?: string;
  ptcpInstSn?: string;
}

const DRB_FILE_SE_CD = "07"; // 파일구분코드: 07=DRB (코드모음 그룹ID 0013)

export default function DrbViewModal() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.DrbView]);
  const { showAlert } = useGlobalAlert();

  const modalData = modal?.data as ModalData | undefined;
  const pblntSn = modalData?.pblntSn;
  const ptcpInstSn = modalData?.ptcpInstSn ?? null;

  // 공시 파일 목록 조회 (ptcpInstSn으로 서버 사이드 기관 필터) 후 DRB(file_se_cd=02)만 프론트 필터
  const {
    data: filesResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["disclosure-files-drb", pblntSn, ptcpInstSn],
    queryFn: () => DisclosureAPI.getFilesByPblntSn(pblntSn!, ptcpInstSn),
    enabled: !!modal?.open && !!pblntSn,
  });

  const files: FileData[] = useMemo(() => {
    const list = filesResponse?.data?.data as DisclosureFileRow[] | undefined;
    if (!Array.isArray(list)) return [];
    return list
      .filter((row) => {
        // DRB 파일만 (file_se_cd 필터는 프론트에서 수행)
        // 다운로드 API는 atch_file_id(UUID) 기준으로 동작하므로 atchFileId가 없는 행은 제외
        return row.fileSeCd === DRB_FILE_SE_CD && !!row.atchFileId;
      })
      .map((row): FileData & { atchFileSn?: string } => {
        const atchFileSnVal = String(row.atchFileSn ?? "").trim();
        const strgFileNm = String(row.strgFileNm ?? "").trim();
        const originalName = atchFileSnVal !== "" ? atchFileSnVal : strgFileNm || "파일";
        const size = row.fileSz != null ? String(row.fileSz) : "";
        return {
          atchFileId: row.atchFileId!,
          name: originalName,
          ext: row.fileExtnNm ?? "",
          size,
          showDeleteButton: false,
          // 백엔드(/files/download)는 atchFileSn 파라미터에 atch_file_id(UUID)를 기대
          atchFileSn: row.atchFileId!, // 다운로드용 키
        };
      });
  }, [filesResponse?.data?.data]);

  if (!modal?.open) return null;

  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.DrbView, result);
    dispatch(closeModal(ModalNames.DrbView));
  };

  // 파일 다운로드 핸들러 (atchFileSn = atch_file_id(UUID))
  const handleFileClick = async (file: FileData & { atchFileSn?: string }) => {
    const downloadParam = file.atchFileSn ?? (file as FileData).atchFileId ?? (file as FileData).name;
    if (!downloadParam) {
      showAlert({
        message: "파일 정보가 없습니다.",
        severity: "error",
      });
      return;
    }

    try {
      if (!pblntSn) {
        showAlert({
          message: "공시번호가 없습니다.",
          severity: "error",
        });
        return;
      }
      const response = await DisclosureAPI.downloadFile(downloadParam, pblntSn);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "파일 다운로드 중 오류가 발생했습니다.";
      showAlert({
        message,
        severity: "error",
      });
    }
  };

  return (
    <BaseModal open={modal.open} onClose={() => handleClose(false)} title="DRB 파일목록" width="xs" fullWidth={true}>
      {/* 메시지 출력 */}
      <div className="text-gray-700 whitespace-pre-line mb-6">
        <Typography variant="subtitle">{modalData?.name || "기관명"}</Typography>
      </div>

      <div>
        {isLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            DRB 파일 목록을 불러오는 중…
          </Typography>
        ) : isError ? (
          <Typography variant="body2" color="error" sx={{ py: 2 }}>
            파일 목록을 불러오지 못했습니다.
          </Typography>
        ) : files.length > 0 ? (
          <FileContainer files={files} showDeleteButton={false} onClick={handleFileClick} />
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            업로드된 DRB 파일이 없습니다.
          </Typography>
        )}
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
