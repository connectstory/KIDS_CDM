import { useEffect, useRef, useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BOARD_CONFIG } from "@/config/boardConfig";
import { MSG, STRINGS } from "@/constants/string";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { fetchBoardDetail, insertBoard, updateBoard } from "@/api/communityApi";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import FileContainer, { type FileData } from "@/components/FileContainer";
import type { SmartEditorHandle } from "@/components/SmartEditor";
import SmartEditor from "@/components/SmartEditor";
import { Helmet } from "react-helmet";

type FreeBoardType = "freeboard" | "researchProject";

export default function FreeBoardWriteView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pstSn = searchParams.get("pstSn");

  const { boardType } = useParams<{ boardType: FreeBoardType }>();
  const resolvedBoardType: FreeBoardType = boardType ?? "freeboard";
  const bbsId = resolvedBoardType ? BOARD_CONFIG[resolvedBoardType]?.bbsId || "" : "";
  const config = BOARD_CONFIG[resolvedBoardType];

  const [title, setTitle] = useState("");
  const [writer, setWriter] = useState("");
  const [content, setContent] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileData[]>([]);
  const [deleteFileIds, setDeleteFileIds] = useState<string[]>([]);
  const { showAlert } = useGlobalAlert();
  const isModalOpenRef = useRef(false);
  const confirmModal = useModal(ModalNames.CONFIRM);
  const [shouldBlock, setShouldBlock] = useState(true);
  const skipBlockRef = useRef(false);

  // 🔥 SmartEditor ref 추가
  const editorRef = useRef<SmartEditorHandle>(null);

  // 🔥 에디터 내용 지연 주입용 ref
  const pendingContentRef = useRef<string | null>(null);

  interface FileInputRow {
    id: number;
    file: File | null;
  }

  const [fileRows, setFileRows] = useState<FileInputRow[]>([{ id: 0, file: null }]);
  const [rowIdCounter, setRowIdCounter] = useState(1);

  const isEditMode = !!pstSn;
  const queryClient = useQueryClient();

  /* ===========================
     수정 모드 데이터 로딩
  =========================== */
  const { data: detailData, isLoading } = useQuery({
    queryKey: ["adminBoardDetail", resolvedBoardType, pstSn],
    queryFn: () =>
      fetchBoardDetail({
        bbsId: bbsId,
        pstSn: pstSn!,
      }),
    enabled: isEditMode && !!pstSn,
    retry: 1,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  useEffect(() => {
    if (!detailData) return;

    setTitle(detailData.pstTtl || "");
    setWriter(detailData.rgtrId || "");

    // 🔥 SmartEditor에 내용 주입 - iframe 로드 완료 후 주입
    const editorContent = detailData.pstCn || "";
    setContent(editorContent);
    pendingContentRef.current = editorContent;

    if (detailData.fileList && detailData.fileList.length > 0) {
      setExistingFiles(
        detailData.fileList.map((f: any) => ({
          name: f.fileNm,
          ext: f.fileExtNm,
          size: formatFileSize(f.fileSz),
          atchFileId: f.atchFileId,
        }))
      );
    } else {
      setExistingFiles([]);
    }
  }, [detailData]);

  // 🔥 detailData 로드 후 에디터에 내용 주입 (재시도 방식)
  useEffect(() => {
    const pending = pendingContentRef.current;
    if (!pending) return;

    let count = 0;
    const MAX_TRY = 150; // 최대 15초 대기
    const INTERVAL = 100;

    const tick = () => {
      if (!editorRef.current) {
        if (++count < MAX_TRY) setTimeout(tick, INTERVAL);
        return;
      }
      try {
        editorRef.current.setContent(pending);
        pendingContentRef.current = null;
      } catch {
        if (++count < MAX_TRY) setTimeout(tick, INTERVAL);
      }
    };

    // 첫 시도는 1초 후 (iframe 로드 여유)
    const timer = setTimeout(tick, 1000);
    return () => clearTimeout(timer);
  }, [detailData]);

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

  /* ===========================
     파일 유틸
  =========================== */
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

  // HTML 태그 및 공백 엔티티를 제거하여 실제 텍스트 내용만 추출
  const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? "").trim();
  };

  /* ===========================
     저장 / 수정
  =========================== */
  const saveMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return isEditMode ? updateBoard(formData) : insertBoard(formData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["memberBoardList", resolvedBoardType],
      });

      if (pstSn) {
        await queryClient.invalidateQueries({
          queryKey: ["memberBoardDetail", resolvedBoardType, pstSn],
        });
        await queryClient.invalidateQueries({
          queryKey: ["adminBoardDetail", resolvedBoardType, pstSn],
        });
      }

      showAlert({
        message: isEditMode ? "수정되었습니다." : "등록되었습니다.",
        severity: "success",
      });

      skipBlockRef.current = true;
      setShouldBlock(false);

      setTimeout(() => {
        navigate(`${routes.COMMUNITY.ROOT}/${resolvedBoardType}/member/freeboard/list`, { replace: true });
      }, 100);
    },
    onError: () => {
      showAlert({
        message: isEditMode ? "수정 중 오류가 발생했습니다." : "등록 중 오류가 발생했습니다.",
        severity: "error",
      });
    },
  });

  // 🔥 async로 변경 - SmartEditor에서 내용 가져오기
  const handleSave = async () => {
    if (saveMutation.isPending) return;

    if (!title.trim()) {
      showAlert({ message: "제목을 입력해주세요.", severity: "warning" });
      return;
    }

    // 🔥 SmartEditor에서 처리된 내용 가져오기
    let processedContent = "";
    if (editorRef.current) {
      processedContent = await editorRef.current.getProcessedContent();
    }

    // 🔥 HTML 태그 제거 후 실제 텍스트 기준으로 빈 내용 체크
    if (!stripHtml(processedContent)) {
      showAlert({ message: "내용을 입력해주세요.", severity: "warning" });
      return;
    }

    const formData = new FormData();
    formData.append("bbsId", bbsId);
    formData.append("pstTtl", title);
    formData.append("pstCn", processedContent); // 🔥 에디터 내용 사용
    formData.append("rgtrId", writer);

    if (isEditMode && pstSn) {
      formData.append("pstSn", pstSn);
    }

    uploadFiles.forEach((file) => {
      formData.append("files", file, file.name);
    });

    deleteFileIds.forEach((id) => {
      formData.append("deleteFileIds", id);
    });

    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="py-10 text-center">로딩 중...</div>;
  }

  const pendingLabel = isEditMode ? "수정 중..." : "저장 중...";
  const idleLabel = isEditMode ? "수정" : "저장";
  const saveButtonLabel = saveMutation.isPending ? pendingLabel : idleLabel;

  return (
    <div>
      <Helmet>
        <title>CDM - 자유게시판</title>
      </Helmet>
      <div className="pt-2">
        <h5>{config.description}</h5>
      </div>

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
                variant="outlined"
                placeholder="제목을 입력하세요."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />
            </Box>
          </Box>
        </Stack>

        {/* 🔥 내용 - TextField → SmartEditor 교체 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">내용</Typography>
            </Box>
            <Box className="form_container-row-content">
              <SmartEditor
                ref={editorRef}
                value={content}
                onChange={(val) => setContent(val)}
                height={200}
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
                        <label htmlFor={`file-input-${row.id}`} className="flex-1 cursor-pointer flex items-center gap-3">
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
        <Button variant="contained" onClick={handleSave} disabled={saveMutation.isPending}>
          {saveButtonLabel}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            skipBlockRef.current = true;
            setShouldBlock(false);
            navigate(`${routes.COMMUNITY.ROOT}/${resolvedBoardType}/member/freeboard/list`);
          }}
          disabled={saveMutation.isPending}
        >
          취소
        </Button>
      </div>
    </div>
  );
}