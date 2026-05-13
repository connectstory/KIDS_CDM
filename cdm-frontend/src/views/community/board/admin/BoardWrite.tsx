import { useEffect, useRef, useState } from "react";
import { Box, Button, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { koKR } from "@mui/x-date-pickers/locales";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { Helmet } from "react-helmet";
import { useBlocker, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BOARD_CONFIG, type BoardType } from "@/config/boardConfig";
import { MSG, STRINGS } from "@/constants/string";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { fetchBoardDetail, insertBoard, updateBoard } from "@/api/communityApi";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import FileContainer, { type FileData } from "@/components/FileContainer";
import type { SmartEditorHandle } from "@/components/SmartEditor";
import SmartEditor from "@/components/SmartEditor";

export default function BuildInfoWriteView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pstSn = searchParams.get("pstSn");
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [isPublic, setIsPublic] = useState<string>("Y");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileData[]>([]);
  const [deleteFileIds, setDeleteFileIds] = useState<string[]>([]);
  const { showAlert } = useGlobalAlert();
  const isModalOpenRef = useRef(false);
  const confirmModal = useModal(ModalNames.CONFIRM);
  const [shouldBlock, setShouldBlock] = useState(true);
  const skipBlockRef = useRef(false);
  const isFixedNotice = isPublic === "Y";

  // 🔥 SmartEditor ref 추가
  const editorRef = useRef<SmartEditorHandle>(null);

  // 🔥 에디터 내용 지연 주입용 ref
  const pendingContentRef = useRef<string | null>(null);

  const { boardType } = useParams<{
    boardType: BoardType;
  }>();

  const bbsId = boardType ? BOARD_CONFIG[boardType]?.bbsId || "" : "";

  // 공지사항 게시판 여부
  const isNoticeBoard = boardType === "notice";

  const isEditMode = !!pstSn;

  const queryClient = useQueryClient();

  // 파일 행 타입 정의
  interface FileInputRow {
    id: number;
    file: File | null;
  }

  const [fileRows, setFileRows] = useState<FileInputRow[]>([{ id: 0, file: null }]);
  const [rowIdCounter, setRowIdCounter] = useState(1);

  // 수정 모드일 경우 기존 데이터 로드 (React Query)
  const {
    data: detailData,
    isLoading: isDetailLoading,
    error: detailError,
  } = useQuery({
    queryKey: ["adminBoardDetail", boardType, pstSn],
    queryFn: () =>
      fetchBoardDetail({
        bbsId: bbsId,
        pstSn: pstSn!,
      }),
    enabled: isEditMode && !!pstSn && !!boardType,
    retry: 1,
  });

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

  // 상세 데이터가 로딩되면 폼 상태에 반영
  useEffect(() => {
    if (!detailData) return;

    const data = detailData as any;

    setTitle(data.pstTtl || "");
    setIsPublic(data.fixYn || "Y");
    setStartDate(data.fixBgngYmd ? dayjs(data.fixBgngYmd) : null);
    setEndDate(data.fixEndYmd ? dayjs(data.fixEndYmd) : null);

    // 🔥 SmartEditor에 내용 주입 - iframe 로드 완료 후 주입
    const editorContent = data.pstCn || "";
    setContent(editorContent);
    pendingContentRef.current = editorContent;

    // 기존 파일 로드
    if (data.fileList && data.fileList.length > 0) {
      setExistingFiles(
        data.fileList.map((f: any) => ({
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

  // 상세 조회 에러 처리
  useEffect(() => {
    if (!detailError) return;

    console.error("데이터 로딩 오류:", detailError);
    showAlert({
      message: "게시글 정보를 불러오는 중 오류가 발생했습니다.",
      severity: "error",
    });
  }, [detailError, showAlert]);

  useEffect(() => {
    if (!isEditMode) {
      // 신규 작성 모드일 때만 오늘 날짜 세팅
      setStartDate(dayjs());
    }
  }, [isEditMode]);

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

  useEffect(() => {
    if (!isNoticeBoard) return;

    if (isPublic === "N") {
      // 비공개면 값 제거
      setStartDate(null);
      setEndDate(null);
    }

    if (isPublic === "Y") {
      // 다시 공개하면 시작일 오늘로
      setStartDate(dayjs());
    }
  }, [isPublic, isNoticeBoard]);

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

    // uploadFiles에서 제거
    setUploadFiles((prev) => prev.filter((f) => f.name !== row.file!.name));

    // 해당 행의 파일만 제거
    setFileRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, file: null } : r)));
  };

  // 파일 행 삭제
  const handleFileRowDelete = (rowId: number) => {
    const row = fileRows.find((r) => r.id === rowId);

    // uploadFiles에서 제거
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

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  // HTML 태그 및 공백 엔티티를 제거하여 실제 텍스트 내용만 추출
  const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? "").trim();
  };

  const saveMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return isEditMode ? updateBoard(formData) : insertBoard(formData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["adminBoardList", boardType],
      });

      if (pstSn) {
        await queryClient.invalidateQueries({
          queryKey: ["adminBoardDetail", boardType, pstSn],
        });
      }

      showAlert({
        message: isEditMode ? "게시글이 수정되었습니다." : "게시글이 등록되었습니다.",
        severity: "success",
      });

      skipBlockRef.current = true;
      setShouldBlock(false);

      navigate(`${routes.COMMUNITY.ROOT}/${boardType}/admin/list`, { replace: true });
    },
    onError: () => {
      showAlert({
        message: isEditMode ? "게시글 수정 중 오류가 발생했습니다." : "게시글 등록 중 오류가 발생했습니다.",
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

    // 공지사항 게시판일 때만 공지 관련 필드 추가
    if (isNoticeBoard) {
      // 공개이더라도 시작일/종료일 중 하나라도 없으면 비공개로 처리
      const effectiveFixYn = isPublic === "Y" && startDate && endDate ? "Y" : "N";
      formData.append("fixYn", effectiveFixYn);

      if (effectiveFixYn === "Y") {
        formData.append("fixBgngYmd", formatDate(startDate!.toDate()));
        formData.append("fixEndYmd", formatDate(endDate!.toDate()));
      }
    }

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

  if (isDetailLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  const pendingLabel = isEditMode ? "수정 중..." : "저장 중...";
  const idleLabel = isEditMode ? "수정" : "저장";
  const saveButtonLabel = saveMutation.isPending ? pendingLabel : idleLabel;

  return (
    <div className="">
      <Helmet>
        <title>{`CDM - ${BOARD_CONFIG[boardType!]?.title ?? ""}`}</title>
      </Helmet>
      <div className="h-5"></div>

      {/* 입력 박스 전체 */}
      <div className="">
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

          {/* 공지여부 - 공지사항 게시판일 때만 표시 */}
          {isNoticeBoard && (
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography className="required">공지여부</Typography>
                </Box>

                <Box className="form_container-row-content">
                  <RadioGroup row value={isPublic} onChange={(e) => setIsPublic(e.target.value)}>
                    <FormControlLabel value="Y" control={<Radio />} label="공개" />
                    <FormControlLabel value="N" control={<Radio />} label="비공개" />
                  </RadioGroup>
                </Box>
              </Box>
            </Stack>
          )}

          {/* 공지기간 - 공지사항 게시판일 때만 표시 */}
          {isNoticeBoard && (
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>공지기간</Typography>
                </Box>

                <Box className="form_container-row-content flex items-center">
                  <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="ko"
                    localeText={koKR.components.MuiLocalizationProvider.defaultProps.localeText}
                  >
                    <DatePicker
                      label={STRINGS["START_DATE"]}
                      format="YYYY-MM-DD"
                      value={startDate}
                      onChange={(v) => setStartDate(v)}
                      maxDate={endDate ?? undefined}
                      slotProps={{
                        textField: { size: "small", sx: { width: 190 } },
                        calendarHeader: { format: "YYYY년 M월" },
                      }}
                      disabled={!isFixedNotice}
                    />
                    <span className="px-3">-</span>
                    <DatePicker
                      label={STRINGS["END_DATE"]}
                      format="YYYY-MM-DD"
                      value={endDate}
                      onChange={(v) => setEndDate(v)}
                      minDate={startDate ?? undefined}
                      slotProps={{
                        textField: { size: "small", sx: { width: 190 } },
                        calendarHeader: { format: "YYYY년 M월" },
                      }}
                      disabled={!isFixedNotice}
                    />
                  </LocalizationProvider>
                </Box>
              </Box>
            </Stack>
          )}

          {/* 🔥 내용 - TextField → SmartEditor 교체 */}
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography className="required">내용</Typography>
              </Box>
              <Box className="form_container-row-content">
                <SmartEditor ref={editorRef} value={content} onChange={(val) => setContent(val)} height={200} />
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
      </div>

      <div className="h-10"></div>

      <div className="flex justify-end gap-3">
        <Button variant="contained" size="medium" onClick={handleSave} disabled={saveMutation.isPending}>
          {saveButtonLabel}
        </Button>
        <Button
          variant="outlined"
          size="medium"
          className="btn_outline"
          disabled={saveMutation.isPending}
          onClick={() => {
            skipBlockRef.current = true;
            setShouldBlock(false);

            navigate(`${routes.COMMUNITY.ROOT}/${boardType}/admin/list`);
          }}
        >
          취소
        </Button>
      </div>
    </div>
  );
}
