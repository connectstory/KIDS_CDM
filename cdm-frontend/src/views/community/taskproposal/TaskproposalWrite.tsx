import { useEffect, useRef, useState } from "react";
import { Box, Button, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { adminImgSuggestProcess } from "@/config/images";
import { MSG, STRINGS } from "@/constants/string";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { fetchAsmtPrpDetail, insertAsmtPrp, updateAsmtPrp } from "@/api/communityApi";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import FileContainer, { type FileData } from "@/components/FileContainer";
import { Helmet } from "react-helmet";

export default function TaskproposalWriteView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { id: asmtPrpSn } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditMode = !!asmtPrpSn;
  const { showAlert } = useGlobalAlert();
  const confirmModal = useModal(ModalNames.CONFIRM);
  const isModalOpenRef = useRef(false);
  const [shouldBlock, setShouldBlock] = useState(true);
  const skipBlockRef = useRef(false);

  const [topicTitle, setTopicTitle] = useState("");
  const [rlsYn, setRlsYn] = useState("N");
  const [proposalContent, setProposalContent] = useState("");
  const [expectedEffect, setExpectedEffect] = useState("");
  const [etcExplanation, setEtcExplanation] = useState("");
  const [caution, setCaution] = useState("");
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

  /* =========================
     수정 모드 조회
  ========================= */
  const { data, isLoading } = useQuery({
    queryKey: ["asmtPrpDetail", asmtPrpSn],
    queryFn: () => fetchAsmtPrpDetail(asmtPrpSn!),
    enabled: isEditMode && !!asmtPrpSn,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  useEffect(() => {
    if (!data) return;

    setTopicTitle(data.tpcTtlNm || "");
    setRlsYn(data.rlsYn || "N");
    setProposalContent(data.asmtPrpCn || "");
    setExpectedEffect(data.asmtExptEfctCn || "");
    setEtcExplanation(data.asmtEtcExplnCn || "");
    setCaution(data.asmtCutnMttrCn || "");

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
     저장
  ========================= */
  const saveMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return isEditMode ? updateAsmtPrp(formData) : insertAsmtPrp(formData);
    },
    onSuccess: async () => {
      showAlert({
        message: isEditMode ? "수정되었습니다." : "등록되었습니다.",
        severity: "success",
      });

      await queryClient.invalidateQueries({ queryKey: ["asmtPrpList"], exact: false });

      if (asmtPrpSn) {
        await queryClient.invalidateQueries({ queryKey: ["asmtPrpDetail", asmtPrpSn] });
      }

      skipBlockRef.current = true;
      setShouldBlock(false);

      navigate(`${routes.COMMUNITY.ROOT}/proposal/member/list`, { replace: true });
    },
    onError: () => {
      showAlert({
        message: isEditMode ? "수정 중 오류가 발생했습니다." : "등록 중 오류가 발생했습니다.",
        severity: "error",
      });
    },
  });

  const handleSave = () => {
    if (!topicTitle.trim()) {
      showAlert({ message: "주제제목을 입력해주세요.", severity: "warning" });
      return;
    }

    if (!proposalContent.trim()) {
      showAlert({ message: "제안내용을 입력해주세요.", severity: "warning" });
      return;
    }

    const formData = new FormData();
    formData.append("tpcTtlNm", topicTitle);
    formData.append("rlsYn", rlsYn);
    formData.append("asmtPrpCn", proposalContent);
    formData.append("asmtExptEfctCn", expectedEffect);
    formData.append("asmtEtcExplnCn", etcExplanation);
    formData.append("asmtCutnMttrCn", caution);

    if (isEditMode && asmtPrpSn) {
      formData.append("asmtPrpSn", asmtPrpSn);
    }

    uploadFiles.forEach((file) => formData.append("files", file, file.name));
    deleteFileIds.forEach((id) => formData.append("deleteFileIds", id));

    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="py-12 text-center text-gray-600">로딩 중...</div>;
  }

  const pendingLabel = isEditMode ? "수정 중..." : "저장 중...";
  const idleLabel = isEditMode ? "수정" : "저장";
  const saveButtonLabel = saveMutation.isPending ? pendingLabel : idleLabel;

  return (
    <div className="">
      <Helmet>
        <title>CDM - 과제제안</title>
      </Helmet>
      {/* 안내문 */}
      <div className="border border-gray-200 bg-white rounded p-5 text-gray-700">
        <p className="leading-relaxed mb-4">
          한국의약품안전관리원은 다양한 경로로 연구주제를 수집하여 의약품 의료정보 연계분석 사업을 수행하고 있습니다.
        </p>
        <p className="leading-relaxed mb-4">
          이에 병원자료(전자의무기록) 활용 의약품 안전성 분석연구를 위한 주제를 제안받고 있습니다.
        </p>
        <p className="leading-relaxed mb-4 text-gray-700">
          <span className="text-blue-600 font-medium">
            연구를 위한 주제는 공개 및 비공개를 선택하여 제안 할 수 있으며, 제안해주신 내용은 다음과 같은 과정을 거쳐 의약품
            안전정보 생산에 활용됩니다.
          </span>
        </p>
        <div className="w-full flex justify-center my-6">
          <img src={adminImgSuggestProcess} alt="제안접수 → 주관부서검토 → 제안선정" className="max-w-full" />
        </div>
        <p className="text-gray-500 leading-relaxed">
          <span className="text-blue-600 font-medium">
            ※ 개인정보 유출, 타인에 대한 비방과 허위 사실 적시, 욕설 등의 게시물은 정보통신망 이용촉진 및 정보보호 등에 관한
            법률에 의거 처벌받을 수 있으며 관리자에 의해 비공개로 전환될 수 있습니다.
          </span>
        </p>
      </div>

      <div className="h-10" />

      <Box className="form_container">
        {/* 주제제목 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">주제제목</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                fullWidth
                placeholder="주제제목을 입력하세요!"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
              />
            </Box>
          </Box>
        </Stack>

        {/* 공개여부 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>공개여부</Typography>
            </Box>
            <Box className="form_container-row-content">
              <RadioGroup row value={rlsYn} onChange={(e) => setRlsYn(e.target.value)}>
                <FormControlLabel value="Y" control={<Radio />} label="공개" />
                <FormControlLabel value="N" control={<Radio />} label="비공개" />
              </RadioGroup>
            </Box>
          </Box>
        </Stack>

        {/* 제안내용 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">제안내용</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                fullWidth
                multiline
                rows={4}
                value={proposalContent}
                onChange={(e) => setProposalContent(e.target.value)}
              />
            </Box>
          </Box>
        </Stack>

        {/* 기대효과 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>기대효과</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                fullWidth
                multiline
                rows={4}
                value={expectedEffect}
                onChange={(e) => setExpectedEffect(e.target.value)}
              />
            </Box>
          </Box>
        </Stack>

        {/* 기타설명 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>기타설명</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                fullWidth
                multiline
                rows={4}
                value={etcExplanation}
                onChange={(e) => setEtcExplanation(e.target.value)}
              />
            </Box>
          </Box>
        </Stack>

        {/* 주의할점 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>주의할점</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextField fullWidth multiline rows={4} value={caution} onChange={(e) => setCaution(e.target.value)} />
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
            navigate(`${routes.COMMUNITY.ROOT}/proposal/member/list`);
          }}
          disabled={saveMutation.isPending}
        >
          취소
        </Button>
      </div>
    </div>
  );
}
