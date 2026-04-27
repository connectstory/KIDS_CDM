import { useEffect, useRef, useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { MSG, STRINGS } from "@/constants/string";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { fetchQnaDetail, insertQna, updateQna } from "@/api/communityApi";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import FileContainer, { type FileData } from "@/components/FileContainer";
import { BOARD_CONFIG, type BoardType } from "@/config/boardConfig";
import { Helmet } from "react-helmet";

const BOARD_BBS_ID: Partial<Record<BoardType, string>> = {
  qna: "BBS0000001",
  researchProject: "BBS0000002",
};

export default function QnaWriteView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { id: qstnSn, boardType } = useParams<{ id: string; boardType: BoardType }>();
  const bbsId = boardType ? BOARD_BBS_ID[boardType] : undefined;
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();
  const isEditMode = !!qstnSn;
  const confirmModal = useModal(ModalNames.CONFIRM);
  const isModalOpenRef = useRef(false);
  const [shouldBlock, setShouldBlock] = useState(true);
  const skipBlockRef = useRef(false);

  // =========================
  // 상태
  // =========================
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileData[]>([]);
  const [deleteFileIds, setDeleteFileIds] = useState<string[]>([]);

  interface FileInputRow {
    id: number;
    file: File | null;
  }

  const [fileRows, setFileRows] = useState<FileInputRow[]>([{ id: 0, file: null }]);
  const [rowIdCounter, setRowIdCounter] = useState(1);

  /* ------------------------------
   * 페이지 이동 방지 블로커 처리
   * ------------------------------ */
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !skipBlockRef.current && shouldBlock && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked" && !isModalOpenRef.current && shouldBlock) {
      isModalOpenRef.current = true;
      const onConfirm = async () => {
        const result = await confirmModal.open({
          title: STRINGS.WARNING,
          message: MSG.UNSAVED_CONTENT_CONFIRM,
        });

        isModalOpenRef.current = false;
        if (result) {
          setShouldBlock(false);
          blocker.proceed();
        } else {
          blocker.reset();
        }
      };
      onConfirm();
    }
  }, [blocker, confirmModal, shouldBlock]);

  // =========================
  // 수정모드: 기존 데이터 로드
  // =========================
  const { data, isLoading } = useQuery({
    queryKey: ["qnaDetail", bbsId, qstnSn],
    queryFn: () => fetchQnaDetail(qstnSn!, bbsId),
    enabled: isEditMode && !!qstnSn,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  useEffect(() => {
    if (!data) return;

    setTitle(data.pstTtl || "");
    setContent(data.pstCn || "");

    if (data.fileList && data.fileList.length > 0) {
      setExistingFiles(
        data.fileList.map((f: any) => ({
          name: f.fileNm,
          ext: f.fileExtNm,
          size: formatFileSize(f.fileSz),
          atchFileId: f.atchFileId,
        }))
      );
    }
  }, [data]);

  // =========================
  // 저장 (Mutation)
  // =========================
  const saveMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return isEditMode ? updateQna(formData) : insertQna(formData);
    },
    onSuccess: async () => {
      showAlert({
        message: isEditMode ? "수정되었습니다." : "등록되었습니다.",
        severity: "success",
      });

      await queryClient.invalidateQueries({ queryKey: ["qnaList", boardType] });

      if (qstnSn) {
        await queryClient.invalidateQueries({ queryKey: ["qnaDetail", bbsId, qstnSn] });
      }

      skipBlockRef.current = true;
      setShouldBlock(false);

      navigate(`${routes.COMMUNITY.ROOT}/${boardType}/member/qnaList`, { replace: true });
    },
    onError: () => {
      showAlert({
        message: isEditMode ? "수정 중 오류가 발생했습니다." : "등록 중 오류가 발생했습니다.",
        severity: "error",
      });
    },
  });

  /* =========================
     파일
  ========================= */
  const handleAddFileRow = () => {
    setFileRows((prev) => [...prev, { id: rowIdCounter, file: null }]);
    setRowIdCounter((prev) => prev + 1);
  };

  const handleFileSelect = (rowId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFileRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, file: selectedFile } : row)));

    const existingRow = fileRows.find((r) => r.id === rowId);

    setUploadFiles((prev) => {
      const filtered = prev.filter((f) => f.name !== existingRow?.file?.name);
      return [...filtered, selectedFile];
    });
  };

  const handleFileClear = (rowId: number) => {
    const row = fileRows.find((r) => r.id === rowId);
    if (!row?.file) return;

    setUploadFiles((prev) => prev.filter((f) => f.name !== row.file!.name));
    setFileRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, file: null } : r)));
  };

  const handleFileRowDelete = (rowId: number) => {
    const row = fileRows.find((r) => r.id === rowId);

    if (row?.file) {
      setUploadFiles((prev) => prev.filter((f) => f.name !== row.file!.name));
    }

    setFileRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleExistingFileDelete = (file: FileData) => {
    if (!file.atchFileId) return;

    setExistingFiles((prev) => prev.filter((f) => f.atchFileId !== file.atchFileId));
    setDeleteFileIds((prev) => [...prev, file.atchFileId!]);
  };

  /* =========================
     저장 핸들러
  ========================= */
  const handleSave = () => {
    if (!title.trim()) {
      showAlert({ message: "제목을 입력해주세요.", severity: "warning" });
      return;
    }

    const formData = new FormData();
    formData.append("pstTtl", title);
    formData.append("pstCn", content);
    formData.append("bbsId", bbsId ?? "");

    if (isEditMode && qstnSn) {
      formData.append("qstnSn", qstnSn);
    }

    uploadFiles.forEach((file) => formData.append("files", file, file.name));
    deleteFileIds.forEach((id) => formData.append("deleteFileIds", id));

    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="py-12 text-center">로딩 중...</div>;
  }

  const pendingLabel = isEditMode ? "수정 중..." : "저장 중...";
  const idleLabel = isEditMode ? "수정" : "저장";
  const saveButtonLabel = saveMutation.isPending ? pendingLabel : idleLabel;

  return (
    <div className="">
      <Helmet>
        <title>{`CDM - ${BOARD_CONFIG[boardType!]?.title ?? 'Q&A'}`}</title>
      </Helmet>
      {/* 설명 헤더 - qna일 때만 표시 */}
      {boardType === "qna" && (
        <div className="pt-2">
          <h5>본 사이트를 이용하시며 궁금한 점, 불편한 점이나 개선사항에 대한 의견을 부탁드립니다.</h5>
        </div>
      )}

      <div className="h-10" />

      <Box className="form_container">
        {/* 제목 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">제목</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                fullWidth
                sx={{ maxWidth: "20rem" }}
                placeholder="제목을 입력하세요!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Box>
          </Box>
        </Stack>

        {/* 질문내용 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>질문내용</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                variant="outlined"
                placeholder="내용을 입력해주세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                multiline
                rows={6}
                fullWidth
              />
            </Box>
          </Box>
        </Stack>

        {/* 첨부파일 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>첨부파일</Typography>
            </Box>
            <Box className="form_container-row-content">
              <div className="w-full">
                {!!existingFiles.length && (
                  <div className="mb-3">
                    <FileContainer files={existingFiles} showDeleteButton={true} onDelete={handleExistingFileDelete} />
                  </div>
                )}

                <div className="mb-3">
                  <Button variant="outlined" size="medium" className="btn_outline" onClick={handleAddFileRow}>
                    파일 추가
                  </Button>
                </div>

                <div className="space-y-2">
                  {fileRows.map((row, index) => (
                    <div key={row.id} className="flex items-center gap-2">
                      <div
                        className="flex-1 flex items-center gap-2 border rounded"
                        style={{
                          borderColor: "#d1d5db",
                          backgroundColor: "#ffffff",
                          padding: "8px 12px",
                          minHeight: "38px",
                        }}
                      >
                        <label
                          htmlFor={`file-input-${row.id}`}
                          className="flex-1 cursor-pointer flex items-center gap-3"
                        >
                          <input
                            id={`file-input-${row.id}`}
                            type="file"
                            onChange={(e) => handleFileSelect(row.id, e)}
                            style={{ display: "none" }}
                          />
                          <span
                            className="inline-block px-3 py-1 border rounded text-sm"
                            style={{
                              borderColor: "#d1d5db",
                              backgroundColor: "#f9fafb",
                              color: "#374151",
                              fontSize: "13px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            파일 선택
                          </span>
                          {row.file && (
                            <span className="text-sm u-ellipsis" style={{ color: "#111827", fontSize: "13px" }}>
                              {row.file.name}
                            </span>
                          )}
                        </label>

                        {row.file && (
                          <button
                            type="button"
                            onClick={() => handleFileClear(row.id)}
                            className="flex-shrink-0"
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              backgroundColor: "#e5e7eb",
                              border: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              fontSize: "14px",
                              color: "#6b7280",
                            }}
                            title="파일 삭제"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleFileRowDelete(row.id)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "13px",
                            color: "#1f2937",
                            backgroundColor: "#f3f4f6",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e7eb")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                          title="추가 파일행 삭제"
                        >
                          추가파일행 삭제
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-2" style={{ fontSize: "12px", color: "#6b7280", textAlign: "right" }}>
                  (100px × 100px)
                </div>
              </div>
            </Box>
          </Box>
        </Stack>
      </Box>

      <div className="h-10" />

      {/* 하단 버튼 */}
      <div className="flex justify-end gap-3">
        <Button variant="contained" size="medium" onClick={handleSave} disabled={saveMutation.isPending}>
          {saveButtonLabel}
        </Button>
        <Button
          variant="outlined"
          size="medium"
          className="btn_outline"
          onClick={() => {
            skipBlockRef.current = true;
            setShouldBlock(false);
            navigate(`${routes.COMMUNITY.ROOT}/${boardType}/member/qnaList`);
          }}
          disabled={saveMutation.isPending}
        >
          취소
        </Button>
      </div>
    </div>
  );
}