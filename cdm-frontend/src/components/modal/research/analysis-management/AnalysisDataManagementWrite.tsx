import { useEffect, useState } from "react";
import { Box, Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { DATASET_ACCEPT, DATASET_EXTS, VDI_ACCEPT } from "@/constants/researchFileUpload";
import { MSG, STRINGS } from "@/constants/string";
import { CONTENT_GAP, RsltGroupStcdType } from "@/constants/types";
import { downloadAnalysisDatasetTemplate, downloadVdiApplicationTemplate, getFileDownloadUrl } from "@/api/commonApi";
import { formatFileSize, getFileExtension } from "@/utils/common";
import { useCreateAnalysisData, useUpdateAnalysisData } from "@/hooks/research/useResearchMutations";
import { useAnalysisDataDetail, useResearchDetail } from "@/hooks/research/useResearchQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import FileContainer, { type FileData } from "@/components/FileContainer";
import FileDropZone from "@/components/FileDropzone";
import { SpaceBox } from "@/components/SpaceBox";

export default function AnalysisDataManagementWrite({
  asmtMetaRsltSn,
  onConfirm,
  onCancel,
}: {
  asmtMetaRsltSn?: number;
  onConfirm: ({ isEditMode }: { isEditMode: boolean }) => void;
  onCancel?: () => void;
}) {
  const { showAlert } = useGlobalAlert();
  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;
  const { data: research } = useResearchDetail(asmtSnNumber);
  const createAnalysisDataMutation = useCreateAnalysisData();
  const updateAnalysisDataMutation = useUpdateAnalysisData();
  const [existingDatasetFiles, setExistingDatasetFiles] = useState<FileData[]>([]);
  const [datasetFiles, setDatasetFiles] = useState<FileData[]>([]);
  const [datasetUploadFiles, setDatasetUploadFiles] = useState<File[]>([]);
  const [deleteDatasetFileIds, setDeleteDatasetFileIds] = useState<string[]>([]);

  const [existingVdiFiles, setExistingVdiFiles] = useState<FileData[]>([]);
  /** 신규로 올릴 VDI 파일(여러 개, 개별 삭제 가능) */
  const [pendingVdi, setPendingVdi] = useState<Array<{ clientKey: string; file: File; data: FileData }>>([]);
  const [deleteVdiFileIds, setDeleteVdiFileIds] = useState<string[]>([]);
  const [asmtMetaRsltCn, setAsmtMetaRsltCn] = useState<string>("");
  const [asmtMetaRsltCnError, setAsmtMetaRsltCnError] = useState<string>("");
  // const [tooltipOpen, setTooltipOpen] = useState(false);

  const isEditMode = !!asmtMetaRsltSn;

  // const isPreviewableFile = (name: string, ext: string) => {
  //   const n = (name || "").toLowerCase();
  //   const e = (ext || "").toUpperCase();
  //   return (
  //     e === "PDF" ||
  //     n.endsWith(".pdf") ||
  //     e === "JPG" ||
  //     n.endsWith(".jpg") ||
  //     e === "JPEG" ||
  //     n.endsWith(".jpeg") ||
  //     e === "PNG" ||
  //     n.endsWith(".png") ||
  //     e === "GIF" ||
  //     n.endsWith(".gif") ||
  //     e === "WEBP" ||
  //     n.endsWith(".webp") ||
  //     e === "BMP" ||
  //     n.endsWith(".bmp")
  //   );
  // };

  // 마운트 후 1초 뒤 툴팁 표시
  // useEffect(() => {
  //   const timer = setTimeout(() => setTooltipOpen(true), 500);
  //   return () => clearTimeout(timer);
  // }, []);

  // 수정 모드일 때 기존 데이터 로드
  const { data: analysisDataDetail } = useAnalysisDataDetail(
    research?.asmtSn ?? null,
    asmtMetaRsltSn ?? null,
    RsltGroupStcdType.ANALYSIS_DATA,
    isEditMode && !!research?.asmtSn && !!asmtMetaRsltSn
  );

  // 수정 모드일 때 기존 데이터·파일 목록으로 폼 초기화
  useEffect(() => {
    if (isEditMode && analysisDataDetail) {
      setAsmtMetaRsltCn(analysisDataDetail.asmtMetaRsltCn || "");
      const datasetList: FileData[] = [];
      const vdiList: FileData[] = [];

      (analysisDataDetail.fileList ?? []).forEach((f) => {
        const ext = (f.fileExtNm ?? (f.fileNm?.split(".").pop() || "")).toUpperCase();
        const fileData: FileData = {
          name: f.fileNm,
          ext,
          size: formatFileSize(f.fileSz ?? 0),
          atchFileId: f.atchFileId,
          atchFileGroupId: f.atchFileGroupId,
        };
        if (DATASET_EXTS.has(ext)) datasetList.push(fileData);
        else vdiList.push(fileData);
      });

      setExistingDatasetFiles(datasetList);
      setExistingVdiFiles(vdiList);
      setDatasetFiles([]);
      setDatasetUploadFiles([]);
      setPendingVdi([]);
      setDeleteDatasetFileIds([]);
      setDeleteVdiFileIds([]);
    }
  }, [isEditMode, analysisDataDetail]);

  const toFileData = (file: File, clientKey?: string): FileData => ({
    name: file.name,
    ext: getFileExtension(file.name),
    size: formatFileSize(file.size),
    ...(clientKey ? { clientKey } : {}),
  });

  // 분석 DATASET 파일 업로드 핸들러 (1개로 관리)
  const handleDatasetFileDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    // 기존 파일이 남아있는 상태에서는 추가 업로드를 막고, 삭제 후 업로드하도록 유도
    if (existingDatasetFiles.length > 0) {
      showAlert({ message: "분석 DATASET은 1개만 첨부할 수 있습니다. 기존 파일을 삭제 후 업로드해주세요.", severity: "warning" });
      return;
    }
    setDatasetFiles([toFileData(file)]);
    setDatasetUploadFiles([file]);
  };

  // VDI 신청서 파일 업로드 핸들러 (여러 개 추가)
  const handleVdiFileDrop = (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    setPendingVdi((prev) => [
      ...prev,
      ...acceptedFiles.map((file) => {
        const clientKey = crypto.randomUUID();
        return { clientKey, file, data: toFileData(file, clientKey) };
      }),
    ]);
  };

  // 분석 DATASET 파일 삭제 핸들러 (기존 서버 파일은 목록에서만 제거, 새 파일은 업로드 목록에서도 제거)
  const handleDatasetFileDelete = (fileToDelete: FileData) => {
    if (fileToDelete.atchFileId) {
      setExistingDatasetFiles((prev) => prev.filter((f) => f.atchFileId !== fileToDelete.atchFileId));
      if (fileToDelete.atchFileGroupId) {
        setDeleteDatasetFileIds((prev) =>
          prev.includes(fileToDelete.atchFileGroupId!) ? prev : [...prev, fileToDelete.atchFileGroupId!]
        );
      }
    } else {
      setDatasetFiles([]);
      setDatasetUploadFiles([]);
    }
  };

  // VDI 신청서 파일 삭제 핸들러 (기존 서버 파일은 목록에서만 제거, 새 파일은 해당 건만 제거)
  const handleVdiFileDelete = (fileToDelete: FileData) => {
    if (fileToDelete.atchFileId) {
      setExistingVdiFiles((prev) => prev.filter((f) => f.atchFileId !== fileToDelete.atchFileId));
      if (fileToDelete.atchFileGroupId) {
        setDeleteVdiFileIds((prev) =>
          prev.includes(fileToDelete.atchFileGroupId!) ? prev : [...prev, fileToDelete.atchFileGroupId!]
        );
      }
    } else if (fileToDelete.clientKey) {
      setPendingVdi((prev) => prev.filter((p) => p.clientKey !== fileToDelete.clientKey));
    }
  };

  const displayDatasetFiles = [...existingDatasetFiles, ...datasetFiles];
  const displayVdiFiles = [...existingVdiFiles, ...pendingVdi.map((p) => p.data)];

  // 분석 DATASET 등록/수정 핸들러
  const handleSubmit = () => {
    if (!research?.asmtSn) {
      showAlert({ message: MSG.RESEARCH_NOT_FOUND, severity: "error" });
      return;
    }

    if (displayDatasetFiles.length === 0) {
      showAlert({ message: "분석 DATASET을 첨부해주세요.", severity: "warning" });
      return;
    }

    if (displayVdiFiles.length === 0) {
      showAlert({ message: "VDI 신청서를 첨부해주세요.", severity: "warning" });
      return;
    }

    if (asmtMetaRsltCn.trim() === "") {
      setAsmtMetaRsltCnError(MSG.CONTENT_REQUIRED);
      showAlert({ message: MSG.CONTENT_REQUIRED, severity: "warning" });
      return;
    }

    const datasetFilesToUpload = datasetUploadFiles.length > 0 ? datasetUploadFiles : undefined;
    const vdiFilesToUpload = pendingVdi.length > 0 ? pendingVdi.map((p) => p.file) : undefined;

    if (isEditMode && asmtMetaRsltSn) {
      updateAnalysisDataMutation.mutateAsync(
        {
          asmtSn: research.asmtSn,
          asmtMetaRsltSn: asmtMetaRsltSn,
          data: {
            asmtMetaRsltCn: asmtMetaRsltCn,
            rsltGroupCd: RsltGroupStcdType.ANALYSIS_DATA,
          },
          deleteDatasetFileIds: deleteDatasetFileIds.length > 0 ? deleteDatasetFileIds : undefined,
          deleteVdiFileIds: deleteVdiFileIds.length > 0 ? deleteVdiFileIds : undefined,
          datasetFiles: datasetFilesToUpload,
          vdiFiles: vdiFilesToUpload,
        } as any,
        { onSuccess: () => onConfirm({ isEditMode: true }) }
      );
    } else {
      createAnalysisDataMutation.mutateAsync(
        {
          asmtSn: research.asmtSn,
          data: {
            asmtMetaRsltCn: asmtMetaRsltCn,
            rsltGroupCd: RsltGroupStcdType.ANALYSIS_DATA,
          },
          datasetFiles: datasetFilesToUpload,
          vdiFiles: vdiFilesToUpload,
        },
        { onSuccess: () => onConfirm({ isEditMode: false }) }
      );
    }
  };

  return (
    // <Box className="relative w-full" onClick={() => setTooltipOpen(false)}>
    <Box className="relative w-full">
      <Typography variant="mainTitle">{isEditMode ? "분석 DATASET 수정" : "분석 DATASET 등록"}</Typography>

      <SpaceBox gap={CONTENT_GAP.LARGE} />

      <Box>
        <Box className="sub_path">
          {/* <Tooltip
            title="분석 DATASET 양식을 다운로드 후 아래에 업로드해주세요."
            placement="right"
            arrow
            open={tooltipOpen}
            disableHoverListener={true}
            disableFocusListener={true}
          >
            <Typography className="tit" variant="h5">
              분석 DATASET 양식
            </Typography>
          </Tooltip> */}
          <Typography className="tit" variant="h5">
            분석 DATASET 필수 양식
          </Typography>
        </Box>
        <Box sx={{ width: "100%", p: 2, borderRadius: 1, border: 1, borderColor: "divider" }}>
          <FileContainer
            files={[
              {
                name: "분석 데이터 양식.xlsx",
                ext: "XLSX",
                size: "양식",
                downloadAction: () => downloadAnalysisDatasetTemplate(),
              },
              {
                name: "VDI 신청서 양식.hwpx",
                ext: "HWPX",
                size: "양식",
                downloadAction: () => downloadVdiApplicationTemplate(),
              },
            ]}
          />
        </Box>
        <SpaceBox gap={CONTENT_GAP.XSMALL} />
        <Typography variant="description">
          연구과제를 진행하기 위한 데이터베이스를 생성하기 위해 양식을 다운로드 후 <br />
          아래에 업로드해주세요.
        </Typography>
      </Box>

      <Divider sx={{ my: CONTENT_GAP.LARGE }} />

      <Box>
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            연구내용
          </Typography>
        </Box>

        <Box className="form_container">
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography className="required">분석 DATASET 첨부</Typography>
              </Box>
              <Box className="form_container-row-content w-full">
                <Stack className="w-full" direction="column" spacing={CONTENT_GAP.XSMALL}>
                  {/* 파일 리스트 (기존 + 새로 첨부) */}
                  <FileContainer
                    files={displayDatasetFiles}
                    showDeleteButton={true}
                    onClick={(file) => {
                      if (file.atchFileId) {
                        window.open(getFileDownloadUrl(file.atchFileId), "_blank");
                      }
                    }}
                    onDelete={handleDatasetFileDelete}
                  />
                  <SpaceBox gap={CONTENT_GAP.XSMALL} />
                  {/* 파일 업로드 영역 */}
                  <FileDropZone onDrop={handleDatasetFileDrop} acceptExtensions={DATASET_ACCEPT} maxFiles={1} />
                  <Typography variant="description">작성하신 분석 DATASET을 첨부해주세요.</Typography>
                </Stack>
              </Box>
            </Box>
          </Stack>
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography className="required">VDI 신청서 첨부</Typography>
              </Box>
              <Box className="form_container-row-content w-full">
                <Stack className="w-full" direction="column" spacing={CONTENT_GAP.XSMALL}>
                  {/* 파일 리스트 (기존 + 새로 첨부) */}
                  <FileContainer
                    files={displayVdiFiles}
                    showDeleteButton={true}
                    onClick={(file) => {
                      if (file.atchFileId) {
                        window.open(getFileDownloadUrl(file.atchFileId), "_blank");
                      }
                    }}
                    onDelete={handleVdiFileDelete}
                  />
                  <SpaceBox gap={CONTENT_GAP.XSMALL} />
                  {/* 파일 업로드 영역 */}
                  <FileDropZone onDrop={handleVdiFileDrop} acceptExtensions={VDI_ACCEPT} />
                  <Typography variant="description">
                    작성하신 VDI 신청서를 첨부해주세요. 필요 시 여러 개를 추가할 수 있습니다.
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Stack>
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography className="required">{STRINGS.CONTENT}</Typography>
              </Box>
              <Box className="form_container-row-content">
                <TextField
                  error={asmtMetaRsltCnError.length > 0}
                  helperText={asmtMetaRsltCnError}
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={5}
                  placeholder={MSG.COMMENT_CONTENT_REQUIRED}
                  value={asmtMetaRsltCn}
                  onChange={(e) => {
                    setAsmtMetaRsltCn(e.target.value);
                    setAsmtMetaRsltCnError("");
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </Box>

        <SpaceBox gap={CONTENT_GAP.SMALL} />

        {/* 버튼 */}
        <Box className="btn_container btn_right">
          {isEditMode && onCancel && (
            <Button variant="text" color="primary" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={createAnalysisDataMutation.isPending || updateAnalysisDataMutation.isPending}
          >
            {isEditMode ? "수정" : "등록"}
          </Button>
        </Box>
      </Box>

      <SpaceBox gap={CONTENT_GAP.MEDIUM} />
    </Box>
  );
}
