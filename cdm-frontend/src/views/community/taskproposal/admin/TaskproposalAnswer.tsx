import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { fetchAsmtPrpAnswer, fetchAsmtPrpDetail, insertAsmtPrpAnswer, updateAsmtPrpAnswer } from "@/api/communityApi";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import FileContainer, { type FileData } from "@/components/FileContainer";
import { Helmet } from "react-helmet";

export default function TaskproposalWriteView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("asmtPrpSn");

  const [ansCn, setAnsCn] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileData[]>([]);
  const [deleteFileIds, setDeleteFileIds] = useState<string[]>([]);
  const { showAlert } = useGlobalAlert();

  // 파일 행 타입 정의
  interface FileInputRow {
    id: number;
    file: File | null;
  }

  const [fileRows, setFileRows] = useState<FileInputRow[]>([{ id: 0, file: null }]);
  const [rowIdCounter, setRowIdCounter] = useState(1);

  /* =========================
     질문 조회
  ========================= */
  const { data: taskproposalData } = useQuery({
    queryKey: ["asmtPrpDetail", id],
    queryFn: () => fetchAsmtPrpDetail(id!),
    enabled: !!id,
    refetchOnMount: "always",
  });

  /* =========================
     답변 조회
  ========================= */
  const { data: ansData } = useQuery({
    queryKey: ["asmtPrpAnswer", id],
    queryFn: () => fetchAsmtPrpAnswer(id!),
    enabled: !!id,
    retry: false,
  });

  const answer = ansData?.[0];
  const isEditMode = !!answer?.ansSn;

  useEffect(() => {
    // answer가 존재할 때만 상태를 업데이트합니다.
    if (answer) {
setAnsCn(answer.ansCn || "");

      // 기존 파일 로드
      if (answer.fileList && answer.fileList.length > 0) {
        setExistingFiles(
          answer.fileList.map((f: any) => ({
            name: f.fileNm,
            ext: f.fileExtNm,
            size: formatFileSize(f.fileSz),
            atchFileId: f.atchFileId,
          }))
        );
      }
    }
  }, [answer]); // answer 객체가 로드되면 실행

  /* =========================
     저장 Mutation
  ========================= */
  const saveMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return isEditMode ? updateAsmtPrpAnswer(formData) : insertAsmtPrpAnswer(formData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["asmtPrpDetail", id] });
      await queryClient.invalidateQueries({ queryKey: ["asmtPrpAnswer", id] });
      await queryClient.invalidateQueries({ queryKey: ["asmtPrpList"], exact: false });

      showAlert({
        message: isEditMode ? "답변이 수정되었습니다." : "답변이 등록되었습니다.",
        severity: "success",
      });
      navigate(`${routes.COMMUNITY.ROOT}/proposal/admin/detail/${id}`);
    },
    onError: () => {
      showAlert({
        message: isEditMode ? "답변 수정 중 오류가 발생했습니다." : "답변 등록 중 오류가 발생했습니다.",
        severity: "error",
      });
    },
  });

  const handleSave = () => {
    if (!ansCn.trim()) {
      showAlert({
        message: "답변 내용을 입력해주세요.",
        severity: "warning",
      });
      return;
    }

    // 🔥 이 방어 로직만 추가
    if (isEditMode && !answer?.ansSn) {
      showAlert({
        message: "답변 식별자(ansSn)가 없습니다.",
        severity: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("asmtPrpSn", id!);
    formData.append("ansCn", ansCn);
    formData.append("ansrId", "admin");
    formData.append("ansrNm", "관리자");

    if (isEditMode) {
      formData.append("ansSn", String(answer!.ansSn));
      formData.append("mdfrId", "admin");
      formData.append("mdfcnPrgmId", "TASKPROPOSAL_ADMIN");
    } else {
      formData.append("rgtrId", "admin");
      formData.append("regPrgmId", "TASKPROPOSAL_ADMIN");
    }

    uploadFiles.forEach((file) => {
      formData.append("files", file, file.name);
    });

    deleteFileIds.forEach((id) => {
      formData.append("deleteFileIds", id);
    });

    saveMutation.mutate(formData);
  };

  // 파일 크기 포맷팅 함수
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  };

  // 파일 행 추가 핸들러
  const handleAddFileRow = () => {
    setFileRows((prev) => [...prev, { id: rowIdCounter, file: null }]);
    setRowIdCounter((prev) => prev + 1);
  };

  // 파일 선택 핸들러
  const handleFileSelect = (rowId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 해당 행의 파일 업데이트
    setFileRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, file: selectedFile } : row)));

    const existingRow = fileRows.find((r) => r.id === rowId);

    setUploadFiles((prev) => {
      const filtered = prev.filter((f) => f.name !== existingRow?.file?.name);
      return [...filtered, selectedFile];
    });
  };

  // 파일 행의 파일 삭제 (clear)
  const handleFileClear = (rowId: number) => {
    const row = fileRows.find((r) => r.id === rowId);
    if (!row?.file) return;

    setUploadFiles((prev) => prev.filter((f) => f.name !== row.file!.name));

    // 해당 행의 파일만 제거
    setFileRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, file: null } : r)));
  };

  // 파일 행 삭제
  const handleFileRowDelete = (rowId: number) => {
    const row = fileRows.find((r) => r.id === rowId);

    if (row?.file) {
      setUploadFiles((prev) => prev.filter((f) => f.name !== row.file!.name));
    }

    // 행 삭제
    setFileRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // 기존 파일 삭제 핸들러
  const handleExistingFileDelete = (file: FileData) => {
    if (!file.atchFileId) return;

    // 화면에서 제거
    setExistingFiles((prev) => prev.filter((f) => f.atchFileId !== file.atchFileId));

    // 삭제 대상 ID 저장
    setDeleteFileIds((prev) => [...prev, file.atchFileId!]);
  };

  if (!taskproposalData) return null;

  const pendingLabel = "저장 중...";
  const idleLabel = isEditMode ? "답변 수정" : "답변 등록";
  const saveButtonLabel = saveMutation.isPending ? pendingLabel : idleLabel;

  return (
    <div className="">
      <Helmet>
        <title>CDM - 과제제안</title>
      </Helmet>
      {/* ===== 질문 정보 영역 ===== */}
      <Box className="mb-4">
        <Typography variant="h5" fontWeight="bold">
          {taskproposalData.tpcTtlNm}
        </Typography>
      </Box>

      <Box className="form_container">
        {/* 질문자 / 등록일시 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>질문자</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{taskproposalData.asmtPrpsrNm || "-"}</Typography>
            </Box>
          </Box>

          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>등록일시</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{taskproposalData.regDt || "-"}</Typography>
            </Box>
          </Box>
        </Stack>

        {/* 답변 내용 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>답변 내용</Typography>
            </Box>
            <Box className="form_container-row-content">
              <textarea
                style={{
                  width: "100%",
                  minHeight: "200px",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  resize: "vertical",
                }}
                value={ansCn}
                onChange={(e) => setAnsCn(e.target.value)}
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
                {/* 기존 파일 표시 */}
                {!!existingFiles.length && (
                  <div className="mb-3">
                    <FileContainer files={existingFiles} showDeleteButton={true} onDelete={handleExistingFileDelete} />
                  </div>
                )}

                {/* 파일 추가 버튼 */}
                <div className="mb-3">
                  <Button variant="outlined" size="medium" className="btn_outline" onClick={handleAddFileRow}>
                    파일 추가
                  </Button>
                </div>

                {/* 파일 입력 행들 */}
                <div className="space-y-2">
                  {fileRows.map((row, index) => (
                    <div key={row.id} className="flex items-center gap-2">
                      {/* 파일 선택 영역 */}
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
                            <span
                              className="text-sm u-ellipsis"
                              style={{
                                color: "#111827",
                                fontSize: "13px",
                              }}
                            >
                              {row.file.name}
                            </span>
                          )}
                        </label>

                        {/* 파일 삭제 버튼 (X) */}
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

                      {/* 추가된 행 삭제 버튼 */}
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
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#e5e7eb";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#f3f4f6";
                          }}
                          title="추가 파일행 삭제"
                        >
                          추가파일행 삭제
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div
                  className="mt-2"
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    textAlign: "right",
                  }}
                >
                  (100px × 100px)
                </div>
              </div>
            </Box>
          </Box>
        </Stack>
      </Box>

      <div className="h-10"></div>

      {/* 하단 버튼 */}
      <div className="flex justify-end gap-3">
        <Button variant="contained" onClick={handleSave} disabled={saveMutation.isPending}>
          {saveButtonLabel}
        </Button>

        <Button variant="outlined" onClick={() => navigate(`${routes.COMMUNITY.ROOT}/proposal/admin/detail/${id}`)}>
          취소
        </Button>
      </div>
    </div>
  );
}
