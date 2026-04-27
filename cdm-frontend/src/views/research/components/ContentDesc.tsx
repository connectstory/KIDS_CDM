import { useEffect, useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { STRINGS } from "@/constants/string";
import { TOOLTIP_IDS } from "@/constants/tooltip";
import { type PROGRESS_STATUS_TYPE, ProgressStatusType, RoleType } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import type { ResearchDetailResponse, ResearchFileItem } from "@/interfaces/researchInterface";
import { downloadFileViaProxy } from "@/api/commonApi";
import type { RootState } from "@/store";
import { setTooltipVisible } from "@/store/tooltipSlice";
import { convertResearchStatus, formatFileSize, getResearchAnalysisStatusConfig, getStatusConfig } from "@/utils/common";
import { formatDate, formatDateTime } from "@/utils/dateUtils";
import { useModal } from "@/hooks/useModal";
import type { FileData } from "@/components/FileContainer";
import FileContainer from "@/components/FileContainer";
import TextWithLineLimit from "@/components/TextWithLineLimit";
import { AppButton, AppStatusChip } from "@/components/ui";

function researchFileToFileData(f: ResearchFileItem): FileData {
  const ext = f.fileExtNm ?? (f.fileNm?.split(".").pop() || "");
  return {
    name: f.fileNm,
    ext,
    size: f.fileSz != null ? formatFileSize(f.fileSz) : "-",
    atchFileId: f.atchFileId,
    atchFileGroupId: f.atchFileGroupId,
  };
}

const PROGRESS_STEPS = [
  ProgressStatusType.REQUEST_INVITE,
  ProgressStatusType.IN_PROGRESS_ANALYSIS,
  ProgressStatusType.IN_PROGRESS_META,
  ProgressStatusType.COMPLETED,
] as const;

const STEP_SECTION_IDS: Record<(typeof PROGRESS_STEPS)[number], string | null> = {
  [ProgressStatusType.REQUEST_INVITE]: "content-request-invite",
  [ProgressStatusType.IN_PROGRESS_ANALYSIS]: "content-analysis",
  [ProgressStatusType.IN_PROGRESS_META]: "content-meta",
  [ProgressStatusType.COMPLETED]: "content-status-btn",
};

/** ResearchDetail: 주관 분석 탭 / 참여기관 기관·CDM 분석 블록 중 DOM에 있는 첫 섹션으로 스크롤 */
const ANALYSIS_PROGRESS_ANCHOR_IDS = ["content-analysis", "content-org-analysis-partner", "content-cdm-analysis-partner"] as const;

function scrollToSection(sectionId: string | null) {
  if (!sectionId) return;
  const el = document.getElementById(sectionId);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToFirstVisibleAnalysisSection() {
  for (const id of ANALYSIS_PROGRESS_ANCHOR_IDS) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }
}

function ProgressStepper({ currentStatus }: { currentStatus: PROGRESS_STATUS_TYPE }) {
  const theme = useTheme();
  const inactiveChipStyle = useMemo(
    () => ({ bgcolor: theme.palette.grey[300], color: theme.palette.grey[600] }),
    [theme]
  );
  const currentStepIndex = PROGRESS_STEPS.indexOf(currentStatus as (typeof PROGRESS_STEPS)[number]);
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <Stack alignItems="center" direction="row" gap={0}>
      {PROGRESS_STEPS.map((stepType, index) => {
        const isCurrentStep = index === activeIndex;
        const isLinePassed = index > 0 && index <= activeIndex;
        const stepConfig = getStatusConfig(stepType);
        const chipStyle = isCurrentStep ? stepConfig?.chipStyle || inactiveChipStyle : inactiveChipStyle;
        const label = stepConfig?.label ?? stepType;

        // 라인 단일 색상 (그라데이션 복원 시 아래 주석 참고)
        const lineSx = {
          width: 30,
          height: 3,
          borderRadius: 1,
          bgcolor: isLinePassed ? "grey.400" : "grey.300",
          mx: 0.25,
        };

        const sectionId = STEP_SECTION_IDS[stepType];
        const isAnalysisProgressStep = stepType === ProgressStatusType.IN_PROGRESS_ANALYSIS;
        const isClickable = isCurrentStep && (Boolean(sectionId) || isAnalysisProgressStep);

        return (
          <Stack key={stepType} direction="row" alignItems="center" gap={0} flexShrink={0}>
            {index > 0 && <Box sx={lineSx} />}
            <AppStatusChip
              size="small"
              label={label}
              chipStyle={{
                ...chipStyle,
                cursor: isClickable ? "pointer" : "default",
                opacity: isCurrentStep ? 1 : 0.7,
              }}
              onClick={
                isClickable
                  ? () =>
                      isAnalysisProgressStep ? scrollToFirstVisibleAnalysisSection() : scrollToSection(sectionId)
                  : undefined
              }
              component={isClickable ? "button" : "div"}
            />
          </Stack>
        );
      })}
    </Stack>
  );
}

export default function ContentDescView({ research }: { research: ResearchDetailResponse }) {
  const dispatch = useDispatch();
  const analysisManagementModal = useModal(ModalNames.AnalysisDataManagement);
  const session = useSelector((state: RootState) => state.session);
  const legacyCancelReason = (research as ResearchDetailResponse & { asmt_ddln_cn?: string | null }).asmt_ddln_cn;
  const cancelReason = legacyCancelReason?.trim() || research.asmtClsCn?.trim() || "-";

  const datasetTooltipVisible = research.asmtMetaRsltSttsCd === null;
  useEffect(() => {
    dispatch(setTooltipVisible({ id: TOOLTIP_IDS.ANALYSIS_DATASET_REGISTER, visible: datasetTooltipVisible }));
  }, [dispatch, datasetTooltipVisible]);

  // fileSeCd=19 (FileCodeType.RESEARCH_ADMIN_ATTACHED)
  // const { data: adminFiles = [], refetch: refetchAdminFiles } = useResearchFiles(research.asmtSn, "19", "01", true);

  // const isCreator = useMemo(() => research.instId === session.instId, [research.instId, session.instId]);

  // const [pendingFiles, setPendingFiles] = useState<FileData[]>([]);
  // const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  // const [submittingAdminFiles, setSubmittingAdminFiles] = useState(false);

  /* ------------------------------
   * URL param
   * ------------------------------ */
  // const { role } = useParams<{ role: string; id: string }>();

  /* ------------------------------
   * 분석 DATASET 관리 모달 표시 핸들러
   * ------------------------------ */
  const onShowAnalysisDataManagementModal = async () => {
    await analysisManagementModal.open({
      title: "분석 DATASET 관리",
      showHeaderCloseButton: true,
    });
  };

  /** 파일 리스트 클릭 시 미리보기(이미지/PDF) 또는 다운로드 */
  const onFileClick = (file: FileData) => {
    if (!file.atchFileId) return;
    downloadFileViaProxy(file.atchFileId, file.name);
  };

  // const handleAdminFileDrop = (acceptedFiles: File[]) => {
  //   if (acceptedFiles.length === 0) return;
  //   const newFileDatas: FileData[] = acceptedFiles.map((file) => ({
  //     name: file.name,
  //     ext: getFileExtension(file.name),
  //     size: formatFileSize(file.size),
  //   }));
  //   setPendingFiles((prev) => [...prev, ...newFileDatas]);
  //   setUploadFiles((prev) => [...prev, ...acceptedFiles]);
  // };

  // const handleAdminPendingFileDelete = (fileToDelete: FileData) => {
  //   setPendingFiles((prev) => prev.filter((f) => f.name !== fileToDelete.name));
  //   setUploadFiles((prev) => prev.filter((f) => f.name !== fileToDelete.name));
  // };

  // const handleAdminUploadedFileDelete = async (fileToDelete: FileData) => {
  //   if (!isCreator) {
  //     showAlert({ message: "권한이 없습니다.", severity: "error" });
  //     return;
  //   }
  //   if (!fileToDelete.atchFileId) {
  //     showAlert({ message: "삭제할 파일 정보를 찾을 수 없습니다.", severity: "error" });
  //     return;
  //   }
  //   try {
  //     await ResearchAPI.deleteAdminFile(research.asmtSn, fileToDelete.atchFileId);
  //     await refetchAdminFiles();
  //     showAlert({ message: "첨부파일이 삭제되었습니다.", severity: "success" });
  //   } catch {
  //     showAlert({ message: "첨부파일 삭제에 실패했습니다.", severity: "error" });
  //   }
  // };

  // const handleUploadAdminFiles = async () => {
  //   if (!isCreator) {
  //     showAlert({ message: "권한이 없습니다.", severity: "error" });
  //     return;
  //   }
  //   if (uploadFiles.length === 0) {
  //     showAlert({ message: "업로드할 파일을 추가해주세요.", severity: "warning" });
  //     return;
  //   }
  //   setSubmittingAdminFiles(true);
  //   try {
  //     await ResearchAPI.uploadAdminFiles(research.asmtSn, uploadFiles);
  //     await refetchAdminFiles();
  //     showAlert({ message: "첨부파일이 업로드되었습니다.", severity: "success" });
  //     setUploadFiles([]);
  //     setPendingFiles([]);
  //   } catch {
  //     showAlert({ message: "첨부파일 업로드에 실패했습니다.", severity: "error" });
  //   } finally {
  //     setSubmittingAdminFiles(false);
  //   }
  // };

  return (
    <Box className="form_container">
      {/* 과제 내용 1 */}
      <Stack direction="row" className="form_container-row">
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">등록기관</Typography>
          </Box>
          <Box className="form_container-row-content">
            <Typography variant="default">{research.instNm || "-"}</Typography>
          </Box>
        </Box>
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">{STRINGS.REGISTERED_BY}</Typography>
          </Box>
          <Box className="form_container-row-content">
            <Typography variant="default">{research.mbrEncptFlnm || "-"}</Typography>
          </Box>
        </Box>
      </Stack>

      {/* 과제 내용 2 */}
      <Stack direction="row" className="form_container-row">
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">{STRINGS.REGISTERED_AT}</Typography>
          </Box>
          <Box className="form_container-row-content">
            <Typography variant="default">{formatDateTime(research.regDt)}</Typography>
          </Box>
        </Box>
      </Stack>

      {/* 과제 내용 3 */}
      <Stack direction="row" className="form_container-row">
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">{STRINGS.STATUS}</Typography>
          </Box>
          <Box className="form_container-row-content">
            {research.asmtPrgrsSttsCd !== ProgressStatusType.CANCELLED ? (
              <ProgressStepper currentStatus={convertResearchStatus(research.asmtPrgrsSttsCd)} />
            ) : (
              <AppStatusChip
                size="small"
                label={getStatusConfig(ProgressStatusType.CANCELLED)?.label}
                chipStyle={getStatusConfig(ProgressStatusType.CANCELLED)?.chipStyle ?? {}}
              />
            )}
          </Box>
        </Box>
      </Stack>

      {/* 취소사유 (상태가 취소일 때만 표시) */}
      {research.asmtPrgrsSttsCd === ProgressStatusType.CANCELLED && (
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography variant="h6">취소사유</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography variant="default">{cancelReason}</Typography>
            </Box>
          </Box>
        </Stack>
      )}

      {/* 과제 내용 4 */}
      <Stack direction="row" className="form_container-row">
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">{STRINGS.CONTENT}</Typography>
          </Box>
          <Box className="form_container-row-content">
            <TextWithLineLimit title="연구과제 내용 더보기" text={research.asmtArtclDtlCn || "-"} maxLines={20} />
          </Box>
        </Box>
      </Stack>

      {/* 과제 내용 5 */}
      <Stack direction="row" className="form_container-row">
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">{STRINGS.RESEARCH_PERIOD}</Typography>
          </Box>
          <Box className="form_container-row-content" gap={1}>
            <Typography variant="default">{formatDate(research.flfmtBgngDt)}</Typography>
            <Typography variant="default">~</Typography>
            <Typography variant="default">{formatDate(research.flfmtEndDt)}</Typography>
          </Box>
        </Box>
      </Stack>

      {/* 과제 내용 6 */}
      {/* {isCreator && (...) } */}

      {/* 과제 내용 6 */}
      <Stack direction="row" className="form_container-row">
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">첨부파일</Typography>
          </Box>
          <Box className="form_container-row-content">
              <Box className="w-full">
              {research.fileList && research.fileList?.length > 0 ? (
                <FileContainer files={(research.fileList ?? []).map(researchFileToFileData)} onClick={onFileClick} />
              ) : (
                <Typography variant="default">첨부 파일이 없습니다.</Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Stack>

      {/* 과제 내용 7 */}
      <Stack direction="row" className="form_container-row">
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">분석질의</Typography>
          </Box>
          <Box className="form_container-row-content">
            <Box className="w-full">
              {research.analysisFileList && research.analysisFileList?.length > 0 ? (
                <FileContainer files={(research.analysisFileList ?? []).map(researchFileToFileData)} onClick={onFileClick} />
              ) : (
                <Typography variant="default">분석질의 파일이 없습니다.</Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Stack>

      {/* 과제 내용 8 */}
      {(research.instId === session.instId || session.userType === RoleType.ADMIN) && (
        <>
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">분석 DATASET 관리</Typography>
              </Box>
              <Box className="form_container-row-content">
                <AppButton variant="containedLight" size="small" onClick={onShowAnalysisDataManagementModal}>
                  분석 DATASET 관리
                </AppButton>
              </Box>
            </Box>
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">분석 데이터 검토 상태</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Box component="span" className="form_container-row-content-inline-block">
                  {research.asmtMetaRsltSttsCd === null && (
                    <AppStatusChip
                      size="small"
                      label={getStatusConfig(ProgressStatusType.NOT_REGISTERED)?.label}
                      chipStyle={getStatusConfig(ProgressStatusType.NOT_REGISTERED)?.chipStyle ?? {}}
                    />
                  )}
                  {research.asmtMetaRsltSttsCd && (
                    <AppStatusChip
                      size="small"
                      label={getResearchAnalysisStatusConfig(research.asmtMetaRsltSttsCd)?.label}
                      chipStyle={getResearchAnalysisStatusConfig(research.asmtMetaRsltSttsCd)?.chipStyle ?? {}}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Stack>
        </>
      )}
    </Box>
  );
}
