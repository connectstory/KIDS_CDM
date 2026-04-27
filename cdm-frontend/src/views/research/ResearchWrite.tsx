import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { koKR } from "@mui/x-date-pickers/locales";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { Helmet } from "react-helmet";
import { useBlocker, useLocation, useNavigate, useParams } from "react-router-dom";
import { ANALYSIS_QUERY_ACCEPT } from "@/constants/researchFileUpload";
import { MSG, STRINGS } from "@/constants/string";
import { CONTENT_GAP, ProgressStatusType } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import type { PartnerResponse, ResearchCreateRequest, ResearchUpdateRequest } from "@/interfaces/researchInterface";
import { buildPath, formatFileSize, getFileExtension } from "@/utils/common";
import { useCreateResearch, useRemoveResearch, useUpdateResearch } from "@/hooks/research/useResearchMutations";
import { useResearchDetail, useResearchPartners } from "@/hooks/research/useResearchQueries";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import FileContainer, { type FileData } from "@/components/FileContainer";
import FileDropZone from "@/components/FileDropzone";
import Loader from "@/components/Loader";
import { SpaceBox } from "@/components/SpaceBox";
import { AppButton, AppIconButton, AppTextField } from "@/components/ui";
import styles from "./ResearchWrite.module.scss";

/* ------------------------------
 * 파트너의 고유 키를 반환하는 헬퍼 함수
 * ------------------------------ */
const getPartnerKey = (partner: PartnerResponse): string => {
  return partner.instId || partner.brno || "";
};

export default function ResearchWriteView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const confirmModal = useModal(ModalNames.CONFIRM);
  const confirmModalOpenRef = useRef(confirmModal.open);
  confirmModalOpenRef.current = confirmModal.open;
  const AddPartnersModal = useModal(ModalNames.AddPartners);

  /* ------------------------------
   * URL param
   * ------------------------------ */
  const location = useLocation();
  const { asmtSn } = useParams<{ asmtSn?: string }>();
  const isEditMode = location.pathname.includes("/edit");
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;

  /* 마운트 시 스크롤 최상단으로 이동 (레이아웃의 .content_wrap이 스크롤 컨테이너) */
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.querySelector<HTMLElement>(".content_wrap")?.scrollTo(0, 0);
    };
    scrollToTop();
    const id = requestAnimationFrame(scrollToTop);
    return () => cancelAnimationFrame(id);
  }, []);

  /* ------------------------------
   * React Query
   * ------------------------------ */
  // 연구과제 등록
  const createMutation = useCreateResearch();
  // 연구과제 수정
  const updateMutation = useUpdateResearch();
  // 연구과제 삭제
  const removeMutation = useRemoveResearch();
  // 연구과제 상세 조회
  const { data: researchDetail, isLoading: isLoadingDetail } = useResearchDetail(isEditMode ? asmtSnNumber : null);
  // 참여기관 목록 조회
  const { data: researchPartners = [], isLoading: isLoadingPartners } = useResearchPartners(isEditMode ? asmtSnNumber : null);

  /* ------------------------------
   * Local state
   * ------------------------------ */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [partners, setPartners] = useState<PartnerResponse[]>([]);
  const [shouldBlock, setShouldBlock] = useState(true);
  /** useBlocker 조건에 사용 — setState보다 먼저 false로 두어 저장/이동 직후 navigate가 막히지 않게 함 */
  const shouldBlockRef = useRef(true);
  const isModalOpenRef = useRef(false);

  // 첨부파일 섹션
  const [files, setFiles] = useState<FileData[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileData[]>([]);
  const [deleteFileIds, setDeleteFileIds] = useState<string[]>([]);
  // 분석질의 섹션 (서버에 analysisFiles 파트로 별도 전송)
  const [analysisFiles, setAnalysisFiles] = useState<FileData[]>([]);
  const [analysisUploadFiles, setAnalysisUploadFiles] = useState<File[]>([]);
  const [existingAnalysisFiles, setExistingAnalysisFiles] = useState<FileData[]>([]);

  /* ------------------------------
   * 페이지 이동 방지 블로커 처리
   * ------------------------------ */
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => shouldBlockRef.current && currentLocation.pathname !== nextLocation.pathname
  );

  /** 차단 플래그만 해제. blocked 네비게이션을 이어가려면 호출부에서 `blocker.proceed()`를 한 번만 호출 */
  const allowNavigationAway = useCallback(() => {
    shouldBlockRef.current = false;
    setShouldBlock(false);
  }, []);

  /* ------------------------------
   * 수정 모드일 때 기존 데이터로 폼 초기화
   * ------------------------------ */
  useEffect(() => {
    if (isEditMode && researchDetail) {
      setTitle(researchDetail.asmtNm || "");
      setDescription(researchDetail.asmtArtclDtlCn || "");
      if (researchDetail.flfmtBgngDt) {
        setStartDate(dayjs(researchDetail.flfmtBgngDt));
      }
      if (researchDetail.flfmtEndDt) {
        setEndDate(dayjs(researchDetail.flfmtEndDt));
      }
    } else if (!isEditMode) {
      // 신규 작성 모드일 때만 오늘 날짜로 초기화
      setStartDate(dayjs(Date.now()));
    }
  }, [isEditMode, researchDetail]);

  /* ------------------------------
   * 수정 모드일 때 참여기관 데이터 변환 및 설정
   * ------------------------------ */
  useEffect(() => {
    if (isEditMode && researchPartners.length > 0) {
      // ResearchPartnerResponse를 PartnerResponse로 변환
      const convertedPartners: PartnerResponse[] = researchPartners.map((partner) => ({
        instId: partner.instId,
        instNm: partner.instNm || "",
        brno: partner.instId, // instId를 brno로 사용 (기존 코드와 호환)
      }));
      setPartners(convertedPartners);
    }
  }, [isEditMode, researchPartners]);

  /* ------------------------------
   * 수정 모드일 때 상세 데이터의 fileList / analysisFileList → existingFiles / existingAnalysisFiles 매핑
   * ------------------------------ */
  useEffect(() => {
    if (!isEditMode) {
      setExistingFiles([]);
      setExistingAnalysisFiles([]);
      return;
    }
    if (!researchDetail) {
      setExistingFiles([]);
      setExistingAnalysisFiles([]);
      return;
    }
    const toFileData = (f: {
      fileNm: string;
      fileExtNm?: string;
      fileSz?: number;
      atchFileId: string;
      atchFileGroupId: string;
    }) => ({
      name: f.fileNm,
      ext: f.fileExtNm ?? "",
      size: typeof f.fileSz === "number" ? formatFileSize(f.fileSz) : String(f.fileSz ?? ""),
      atchFileId: f.atchFileId,
      atchFileGroupId: f.atchFileGroupId,
    });
    setExistingFiles((researchDetail.fileList ?? []).map(toFileData));
    setExistingAnalysisFiles((researchDetail.analysisFileList ?? []).map(toFileData));
  }, [isEditMode, researchDetail]);

  /* ------------------------------
   * 페이지 이동 방지 블로커 처리
   * ------------------------------ */
  useEffect(() => {
    if (blocker.state !== "blocked" || isModalOpenRef.current || !shouldBlock) {
      return;
    }
    isModalOpenRef.current = true;
    void (async () => {
      try {
        const result = await confirmModalOpenRef.current({
          title: STRINGS.WARNING,
          message: MSG.UNSAVED_CONTENT_CONFIRM,
        });
        if (result) {
          allowNavigationAway();
          blocker.proceed?.();
        } else {
          blocker.reset?.();
        }
      } finally {
        isModalOpenRef.current = false;
      }
    })();
  }, [blocker, shouldBlock, allowNavigationAway]);

  /* ------------------------------
   * 브라우저 탭 닫기/새로고침 경고 처리
   * ------------------------------ */
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldBlock) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [shouldBlock]);

  /* ------------------------------
   * 참여기관 목록 테이블 컬럼 정의
   * ------------------------------ */
  const colDefs = useMemo<ColDef<PartnerResponse>[]>(
    () => [
      {
        headerName: "기관명",
        field: "instNm",
        flex: 1,
      },
      {
        headerName: "",
        width: 120,
        cellStyle: { textAlign: "right" as const },
        cellRenderer: (p: ICellRendererParams<PartnerResponse>) => {
          /* ------------------------------
           * 참여기관 삭제 핸들러
           * ------------------------------ */
          const handleDelete = async () => {
            if (!p.data) return;

            const result = await confirmModal.open({
              title: "확인",
              message: `${p.data.instNm} 기관을 참여 취소합니다.`,
            });

            if (result) {
              const partnerKey = getPartnerKey(p.data);
              setPartners((prev) => {
                const filtered = prev.filter((m) => getPartnerKey(m) !== partnerKey);
                return filtered;
              });
            }
          };

          return (
            <AppIconButton className={styles.deleteButton} aria-label="close" onClick={handleDelete}>
              <i className="fa-solid fa-xmark"></i>
            </AppIconButton>
          );
        },
      },
    ],
    [confirmModal]
  );

  /* ------------------------------
   * 참여기관 목록 테이블(ag-grid) 높이 계산
   * ------------------------------ */
  const gridHeight = useMemo(() => {
    const headerHeight = 48;
    const rowHeight = 42;
    const minHeight = 100;
    const maxHeight = 300;

    const calculatedHeight = headerHeight + rowHeight * partners.length;
    return Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
  }, [partners.length]);

  /* ------------------------------
   * 파일 드롭/업로드 핸들러
   * ------------------------------ */
  const handleFileDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const newFileDatas: FileData[] = [];
    acceptedFiles.forEach((file) => {
      newFileDatas.push({
        name: file.name,
        ext: getFileExtension(file.name),
        size: formatFileSize(file.size),
      });
    });
    setFiles((prev) => [...prev, ...newFileDatas]);
    setUploadFiles((prev) => [...prev, ...acceptedFiles]);
  };

  /* ------------------------------
   * 파일 삭제 핸들러 (신규 추가한 파일)
   * ------------------------------ */
  const handleFileDelete = (fileToDelete: FileData) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileToDelete.name));
    setUploadFiles((prev) => prev.filter((f) => f.name !== fileToDelete.name));
  };

  /* ------------------------------
   * 분석질의 파일 드롭/삭제 핸들러
   * ------------------------------ */
  const handleAnalysisFileDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const newFileDatas: FileData[] = acceptedFiles.map((file) => ({
      name: file.name,
      ext: getFileExtension(file.name),
      size: formatFileSize(file.size),
    }));
    setAnalysisFiles((prev) => [...prev, ...newFileDatas]);
    setAnalysisUploadFiles((prev) => [...prev, ...acceptedFiles]);
  };
  const handleAnalysisFileDelete = (fileToDelete: FileData) => {
    setAnalysisFiles((prev) => prev.filter((f) => f.name !== fileToDelete.name));
    setAnalysisUploadFiles((prev) => prev.filter((f) => f.name !== fileToDelete.name));
  };

  /* ------------------------------
   * 기존 파일 삭제 핸들러 (수정 모드, 첨부파일)
   * ------------------------------ */
  const handleExistingFileDelete = (file: FileData) => {
    if (!file.atchFileId) return;
    setExistingFiles((prev) => prev.filter((f) => f.atchFileId !== file.atchFileId));
    if (!file.atchFileGroupId) return;
    setDeleteFileIds((prev) => (prev.includes(file.atchFileGroupId!) ? prev : [...prev, file.atchFileGroupId!]));
  };

  /* ------------------------------
   * 기존 분석질의 파일 삭제 핸들러 (수정 모드)
   * ------------------------------ */
  const handleExistingAnalysisFileDelete = (file: FileData) => {
    if (!file.atchFileId) return;
    setExistingAnalysisFiles((prev) => prev.filter((f) => f.atchFileId !== file.atchFileId));
    if (!file.atchFileGroupId) return;
    setDeleteFileIds((prev) => (prev.includes(file.atchFileGroupId!) ? prev : [...prev, file.atchFileGroupId!]));
  };

  /* ------------------------------
   * 참여기관 추가 모달을 표시하는 함수
   * ------------------------------ */
  const handleAddPartners = async () => {
    const result = (await AddPartnersModal.open({
      title: "참여기관 추가",
      data: partners,
    })) as PartnerResponse[];
    // result가 undefined나 null이면 취소된 것이므로 무시
    // result가 배열이면 (빈 배열 포함) 항상 업데이트
    if (result !== undefined && result !== null) {
      setPartners(result);
    }
  };

  /* ------------------------------
   * 작성/수정 취소 핸들러
   * ------------------------------ */
  const onCancel = async () => {
    const result = await confirmModal.open({
      title: STRINGS.WARNING,
      message: MSG.UNSAVED_CONTENT_CONFIRM,
    });

    if (result) {
      allowNavigationAway();
      if (isEditMode && asmtSnNumber) {
        navigate(
          buildPath(routes.RESEARCH.DETAIL, {
            role: "owner",
            asmtSn: String(asmtSnNumber),
          }),
          { replace: true }
        );
      } else {
        navigate(routes.RESEARCH.OWNER, { replace: true });
      }
    }
  };

  /* ------------------------------
   * 연구과제 제출 핸들러
   * ------------------------------ */
  const onSubmit = async () => {
    // 유효성 검사
    if (!title.trim()) {
      showAlert({
        message: "과제명을 입력해주세요.",
        severity: "warning",
      });
      return;
    }

    if (!startDate || !endDate) {
      showAlert({
        message: "수행기간을 입력해주세요.",
        severity: "warning",
      });
      return;
    }

    if (startDate.isAfter(endDate)) {
      showAlert({
        message: "시작일은 종료일보다 이전이어야 합니다.",
        severity: "warning",
      });
      return;
    }

    if (partners.length === 0) {
      showAlert({
        message: "참여기관을 추가해주세요.",
        severity: "warning",
      });
      return;
    }

    if (existingAnalysisFiles.length === 0 && analysisFiles.length === 0) {
      showAlert({
        message: "분석질의 파일을 첨부해주세요.",
        severity: "warning",
      });
      return;
    }

    const confirmMessage = isEditMode ? "연구과제를 수정하시겠습니까?" : "연구과제를 등록하시겠습니까?";

    const result = await confirmModal.open({
      title: "확인",
      message: confirmMessage,
    });
    if (!result) {
      return;
    }

    try {
      if (isEditMode && asmtSnNumber) {
        // 수정 모드
        const request: ResearchUpdateRequest = {
          asmtNm: title.trim(),
          asmtArtclDtlCn: description.trim(),
          flfmtBgngDt: startDate.format("YYYY-MM-DDTHH:mm:ss"),
          flfmtEndDt: endDate.format("YYYY-MM-DDTHH:mm:ss"),
        };

        const formData = new FormData();
        formData.append("data", new Blob([JSON.stringify(request)], { type: "application/json" }));
        uploadFiles.forEach((file) => formData.append("files", file, file.name));
        analysisUploadFiles.forEach((file) => formData.append("analysisFiles", file, file.name));
        await updateMutation.mutateAsync({
          asmtSn: asmtSnNumber,
          data: request,
          formData,
          deleteFileIds: deleteFileIds.length > 0 ? deleteFileIds : undefined,
        });

        allowNavigationAway();
        navigate(
          buildPath(routes.RESEARCH.DETAIL, {
            role: "owner",
            asmtSn: String(asmtSnNumber),
          }),
          { replace: true }
        );
      } else {
        // 등록 모드
        const request: ResearchCreateRequest = {
          asmtNm: title.trim(),
          asmtArtclDtlCn: description.trim(),
          flfmtBgngDt: startDate.format("YYYY-MM-DDTHH:mm:ss"),
          flfmtEndDt: endDate.format("YYYY-MM-DDTHH:mm:ss"),
          asmtPrcpInsttList: partners.map((partner) => (partner.instId ? partner.instId : partner.brno)),
        };

        const formData = new FormData();
        formData.append("data", new Blob([JSON.stringify(request)], { type: "application/json" }));
        uploadFiles.forEach((file) => formData.append("files", file, file.name));
        analysisUploadFiles.forEach((file) => formData.append("analysisFiles", file, file.name));
        const result = await createMutation.mutateAsync(formData);

        allowNavigationAway();
        navigate(buildPath(routes.RESEARCH.DETAIL, { role: "owner", asmtSn: result.asmtSn }), { replace: true });
      }
    } catch (error) {
      // 에러는 mutation의 onError에서 이미 처리됨
      console.error(isEditMode ? "연구과제 수정 실패:" : "연구과제 등록 실패:", error);
    }
  };

  // 수정 모드일 때 데이터 로딩 중 표시
  if (isEditMode && (isLoadingDetail || isLoadingPartners)) {
    return <Loader isLoading={true} />;
  }

  // 수정 모드일 때 데이터가 없으면 에러 처리
  if (isEditMode && !researchDetail) {
    return (
      <Box sx={{ p: 5, textAlign: "center" }}>
        <Typography color="text.secondary">연구과제를 찾을 수 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.root}>
      <Helmet>
        <title>{isEditMode ? `CDM - 연구과제 수정` : `CDM - 연구과제 등록`}</title>
      </Helmet>
      {/* ==============================
          과제 내용
      ============================== */}
      <Box className="form_container">
        {/* 과제 내용 1 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">과제명</Typography>
            </Box>
            <Box className="form_container-row-content">
              <AppTextField
                variant="outlined"
                placeholder="연구과제명을 입력해주세요."
                label="과제명"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />
            </Box>
          </Box>
        </Stack>

        {/* 과제 내용 2 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>과제내용</Typography>
            </Box>
            <Box className="form_container-row-content">
              <AppTextField
                variant="outlined"
                placeholder={MSG.COMMENT_CONTENT_REQUIRED}
                label="과제내용"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={12}
                fullWidth
                // sx={{
                //   '& .MuiInputBase-input': {
                //     resize: 'vertical',
                //     maxHeight: '500px',
                //   },
                // }}
              />
            </Box>
          </Box>
        </Stack>

        {/* 과제 내용 3 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">수행기간</Typography>
            </Box>
            <Box className="form_container-row-content">
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="ko"
                localeText={koKR.components.MuiLocalizationProvider.defaultProps.localeText}
              >
                <DatePicker
                  label={STRINGS["START_DATE"]}
                  format="YYYY-MM-DD"
                  disabled={isEditMode}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: {
                        width: 180,
                      },
                    },
                    calendarHeader: {
                      format: "YYYY년 M월",
                    },
                  }}
                  value={startDate}
                  onChange={(v) => setStartDate(v)}
                  minDate={isEditMode ? undefined : dayjs()}
                  maxDate={endDate ?? undefined}
                />
                <Box component="span" className="px-2">
                  -
                </Box>
                <DatePicker
                  label={STRINGS["END_DATE"]}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: {
                        width: 180,
                      },
                    },
                    calendarHeader: {
                      format: "YYYY년 M월",
                    },
                  }}
                  value={endDate}
                  onChange={(v) => setEndDate(v)}
                  minDate={startDate ?? undefined}
                />
              </LocalizationProvider>
            </Box>
          </Box>
        </Stack>

        {/* 과제 내용 4 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>첨부파일</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Box className="w-full">
                {existingFiles.length > 0 && (
                  <>
                    <FileContainer files={existingFiles} showDeleteButton={true} onDelete={handleExistingFileDelete} />
                    <Box className="pt-2" />
                  </>
                )}
                <FileContainer files={files} showDeleteButton={true} onDelete={handleFileDelete} />
                <Box className="pt-2" />
                <FileDropZone onDrop={handleFileDrop}></FileDropZone>
              </Box>
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">분석질의</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Box className="relative w-full">
                {/* 분석질의 설명 */}
                {existingAnalysisFiles.length === 0 && analysisFiles.length === 0 && (
                  <Box
                    sx={{
                      position: "relative",
                      px: 2,
                      py: 1.5,
                      borderRadius: 1,
                      border: 1,
                      borderColor: "divider",
                      bgcolor: "grey.50",
                    }}
                  >
                    <Typography variant="default">
                      기관에서 분석에 필요한 파일을 첨부해주세요.
                      <br></br>각 참여기관마다 사용하는 데이터베이스(Oracle, PostgreSQL등)가 다르므로 해당 데이터베이스에 맞는
                      분석질의 자료를 첨부해주세요.
                      <br></br>예) SQL, R 파일 및 관련 자료 첨부
                    </Typography>
                  </Box>
                )}

                {existingAnalysisFiles.length > 0 && (
                  <>
                    <FileContainer
                      files={existingAnalysisFiles}
                      showDeleteButton={true}
                      onDelete={handleExistingAnalysisFileDelete}
                    />
                    <Box className="pt-2" />
                  </>
                )}
                <FileContainer files={analysisFiles} showDeleteButton={true} onDelete={handleAnalysisFileDelete} />
                <Box className="pt-2" />
                <FileDropZone onDrop={handleAnalysisFileDrop} acceptExtensions={ANALYSIS_QUERY_ACCEPT} />
              </Box>
            </Box>
          </Box>
        </Stack>
      </Box>

      <SpaceBox gap={CONTENT_GAP.SMALL} />

      {/* ==============================
          하단 버튼 영역
      ============================== */}
      <Box className={`btn_container btn_right ${styles.bottomActions}`}>
        <AppButton variant="outlined" size="medium" onClick={onCancel}>
          취소
        </AppButton>
        <AppButton
          variant="contained"
          size="medium"
          onClick={async () => {
            await onSubmit();
          }}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {isEditMode ? (updateMutation.isPending ? "수정 중..." : "수정") : createMutation.isPending ? "등록 중..." : "등록"}
        </AppButton>

        {isEditMode && researchDetail?.asmtPrgrsSttsCd === ProgressStatusType.REQUEST_INVITE && (
          <AppButton
            variant="containedGray"
            size="medium"
            onClick={async () => {
              const result = await confirmModal.open({
                title: "과제 삭제",
                message: "과제를 삭제하시겠습니까?",
              });

              if (result) {
                await removeMutation.mutateAsync(Number(asmtSnNumber));
                allowNavigationAway();
                navigate(routes.RESEARCH.OWNER);
              }
            }}
          >
            삭제
          </AppButton>
        )}
      </Box>

      {/* ==============================
          참여기관 영역
      ============================== */}
      {!isEditMode && (
        <>
          <SpaceBox gap={CONTENT_GAP.XLARGE} />

          <Box>
            <Box className="tbl_info">
              <Box className="total">
                <Box component="p" className="cases">
                  참여기관<Box component="span" className="count">{partners.length}</Box>건
                </Box>
              </Box>
              <Box className="tbl_controller">
                <AppButton variant="containedLight" size="medium" onClick={handleAddPartners}>
                  참여기관 추가
                </AppButton>
              </Box>
            </Box>

            <Box className="ag-theme-cdm w-full" sx={{ height: `${gridHeight}px` }}>
              <AgGridReact
                rowData={partners}
                columnDefs={colDefs}
                rowHeight={42}
                headerHeight={48}
                getRowId={(params) => getPartnerKey(params.data)}
                overlayNoRowsTemplate={`<span style="padding:8px;">등록된 기관이 없습니다.</span>`}
              />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
