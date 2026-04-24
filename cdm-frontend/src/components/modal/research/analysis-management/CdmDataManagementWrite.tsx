import { useEffect, useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { MSG, STRINGS } from "@/constants/string";
import { CONTENT_GAP, RsltGroupStcdType } from "@/constants/types";
import { getFileDownloadUrl, getFilePreviewUrl } from "@/api/commonApi";
import { formatFileSize, getFileExtension } from "@/utils/common";
import { useCreateAnalysisData, useUpdateAnalysisData } from "@/hooks/research/useResearchMutations";
import { useAnalysisDataDetail, useResearchDetail } from "@/hooks/research/useResearchQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import FileContainer, { type FileData } from "@/components/FileContainer";
import FileDropZone from "@/components/FileDropzone";
import { SpaceBox } from "@/components/SpaceBox";
import { ANALYSIS_CDM_META_ATTACHMENT_ACCEPT, isPreviewableFile } from "@/constants/researchFileUpload";

export default function CdmDataManagementWrite({
  asmtMetaRsltSn,
  onConfirm,
  onCancel,
}: {
  asmtMetaRsltSn?: number;
  onConfirm: ({ isEditMode, asmtMetaRsltSn }: { isEditMode: boolean; asmtMetaRsltSn?: number }) => void;
  onCancel?: () => void;
}) {
  const { showAlert } = useGlobalAlert();

  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;
  const { data: research } = useResearchDetail(asmtSnNumber);
  const createAnalysisDataMutation = useCreateAnalysisData();
  const updateAnalysisDataMutation = useUpdateAnalysisData();
  const [existingFiles, setExistingFiles] = useState<FileData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [deleteFileIds, setDeleteFileIds] = useState<string[]>([]);
  const [asmtMetaRsltCn, setAsmtMetaRsltCn] = useState<string>("");
  const [asmtMetaRsltCnError, setAsmtMetaRsltCnError] = useState<string>("");

  const isEditMode = !!asmtMetaRsltSn;

  // 수정 모드일 때 기존 데이터 로드
  const { data: analysisDataDetail } = useAnalysisDataDetail(
    research?.asmtSn ?? null,
    asmtMetaRsltSn ?? null,
    RsltGroupStcdType.ANALYSIS_CDM,
    isEditMode && !!research?.asmtSn && !!asmtMetaRsltSn
  );

  // 수정 모드일 때 기존 데이터·파일 목록으로 폼 초기화
  useEffect(() => {
    if (isEditMode && analysisDataDetail) {
      setAsmtMetaRsltCn(analysisDataDetail.asmtMetaRsltCn || "");
      const list: FileData[] = (analysisDataDetail.fileList ?? []).map((f) => ({
        name: f.fileNm,
        ext: f.fileExtNm ?? (f.fileNm?.split(".").pop() || "").toUpperCase(),
        size: formatFileSize(f.fileSz ?? 0),
        atchFileId: f.atchFileId,
        atchFileGroupId: f.atchFileGroupId,
      }));
      setExistingFiles(list);
      setDeleteFileIds([]);
    }
  }, [isEditMode, analysisDataDetail]);

  const handleFileDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      setFiles((prev) => [...prev, { name: file.name, ext: getFileExtension(file.name), size: formatFileSize(file.size) }]);
      setUploadFiles((prev) => [...prev, file]);
    });
  };

  const handleFileDelete = (fileToDelete: FileData) => {
    if (fileToDelete.atchFileId) {
      setExistingFiles((prev) => prev.filter((f) => f.atchFileId !== fileToDelete.atchFileId));
      if (fileToDelete.atchFileGroupId) {
        setDeleteFileIds((prev) =>
          prev.includes(fileToDelete.atchFileGroupId!) ? prev : [...prev, fileToDelete.atchFileGroupId!]
        );
      }
    } else {
      const idx = files.findIndex((f) => f.name === fileToDelete.name && f.size === fileToDelete.size);
      if (idx >= 0) {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
        setUploadFiles((prev) => prev.filter((_, i) => i !== idx));
      }
    }
  };

  const displayFiles = [...existingFiles, ...files];

  // 분석 데이터 등록/수정 핸들러
  const handleSubmit = () => {
    if (!research?.asmtSn) {
      showAlert({ message: MSG.RESEARCH_NOT_FOUND, severity: "error" });
      return;
    }

    if (displayFiles.length === 0) {
      showAlert({ message: "분석 데이터를 첨부해주세요.", severity: "warning" });
      return;
    }

    if (asmtMetaRsltCn.trim() === "") {
      setAsmtMetaRsltCnError(MSG.CONTENT_REQUIRED);
      showAlert({ message: MSG.CONTENT_REQUIRED, severity: "warning" });
      return;
    }

    if (isEditMode && asmtMetaRsltSn) {
      updateAnalysisDataMutation.mutateAsync(
        {
          asmtSn: research.asmtSn,
          asmtMetaRsltSn: asmtMetaRsltSn,
          data: {
            asmtMetaRsltCn: asmtMetaRsltCn,
            rsltGroupCd: analysisDataDetail?.rsltGroupCd || RsltGroupStcdType.ANALYSIS_CDM,
          },
          deleteFileIds: deleteFileIds.length > 0 ? deleteFileIds : undefined,
          files: uploadFiles.length > 0 ? uploadFiles : undefined,
        },
        { onSuccess: () => onConfirm({ isEditMode: true, asmtMetaRsltSn: asmtMetaRsltSn }) }
      );
    } else {
      createAnalysisDataMutation.mutateAsync(
        {
          asmtSn: research.asmtSn,
          data: {
            asmtMetaRsltCn: asmtMetaRsltCn,
            rsltGroupCd: RsltGroupStcdType.ANALYSIS_CDM,
          },
          files: uploadFiles.length > 0 ? uploadFiles : undefined,
        },
        { onSuccess: (newAsmtMetaRsltSn) => onConfirm({ isEditMode: false, asmtMetaRsltSn: newAsmtMetaRsltSn }) }
      );
    }
  };

  return (
    <Box className="relative w-full">
      <Typography variant="mainTitle">{isEditMode ? "분석결과 수정" : "분석결과 등록"}</Typography>

      <SpaceBox gap={CONTENT_GAP.LARGE} />

      <Box className="sub_path">
        <Typography className="tit" variant="h5">
          연구내용
        </Typography>
      </Box>

      <Box className="form_container">
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">분석 데이터 첨부</Typography>
            </Box>
            <Box className="form_container-row-content w-full">
              <Stack className="w100" direction="column" spacing={CONTENT_GAP.XSMALL}>
                {/* 파일 리스트 (기존 + 새로 첨부) */}
                <FileContainer
                  files={displayFiles}
                  showDeleteButton={true}
                  onClick={(file) => {
                    if (file.atchFileId) {
                      if (isPreviewableFile(file.name, file.ext)) {
                        window.open(getFilePreviewUrl(file.atchFileId), "_blank");
                      } else {
                        window.open(getFileDownloadUrl(file.atchFileId), "_blank");
                      }
                    }
                  }}
                  onDelete={handleFileDelete}
                />
                {/* 파일 업로드 영역 */}
                <FileDropZone onDrop={handleFileDrop} acceptExtensions={ANALYSIS_CDM_META_ATTACHMENT_ACCEPT} />
                <Typography variant="description">작성하신 분석 데이터를 첨부해주세요.</Typography>
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

      <SpaceBox gap={CONTENT_GAP.MEDIUM} />
    </Box>
  );
}
