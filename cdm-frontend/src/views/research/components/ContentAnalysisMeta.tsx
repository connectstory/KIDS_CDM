/**
 * 연구결과(메타분석) 표시 컴포넌트
 * 연구과제의 메타분석 결과 정보를 표시하는 컴포넌트
 *
 * 표시 정보:
 * - 등록자 및 등록일시
 * - 연구결과 상태
 * - 연구결과 내용 및 첨부 파일
 * - 연구결과 설명
 * - 연구결과 관리 및 검토 현황
 */
import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { isPreviewableFile } from "@/constants/researchFileUpload";
import { STRINGS } from "@/constants/string";
import { TOOLTIP_IDS } from "@/constants/tooltip";
import { AnalysisResultStatus, RsltGroupStcdType } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { getFileDownloadUrl, getFilePreviewUrl } from "@/api/commonApi";
import type { RootState } from "@/store";
import { setTooltipVisible } from "@/store/tooltipSlice";
import {
  convertResearchAnalysisStatus,
  formatFileSize,
  getResearchAnalysisStatusConfig,
  isResearchOpinionExcludedResult,
  researchOpinionDisplayStatusCode,
} from "@/utils/common";
import { formatDateTime } from "@/utils/dateUtils";
import {
  useCheckAllStatusCompleted,
  useCheckMetaAccess,
  useLatestAnalysisDataDetail,
  useResearchDetail,
} from "@/hooks/research/useResearchQueries";
import { useModal } from "@/hooks/useModal";
import type { FileData } from "@/components/FileContainer";
import FileContainer from "@/components/FileContainer";
import TextWithLineLimit from "@/components/TextWithLineLimit";
import { AppButton, AppStatusChip } from "@/components/ui";

export default function ContentAnalysisMeta() {
  const dispatch = useDispatch();
  const metaDataManagementModal = useModal(ModalNames.MetaDataManagement);
  const confirmModal = useModal(ModalNames.CONFIRM);
  const pdfPreviewModal = useModal(ModalNames.PDF_PREVIEW);

  /* ------------------------------
   * URL param
   * ------------------------------ */
  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;

  /* ------------------------------
   * 상태 변수
   * ------------------------------ */
  const session = useSelector((state: RootState) => state.session);
  const appTarget = import.meta.env.VITE_APP_TARGET as "admin" | "partner" | undefined;
  const [rsltGroupStcd] = useState(RsltGroupStcdType.ANALYSIS_META);
  // const [isAllStatusCompleted, setIsAllStatusCompleted] = useState<boolean | null>(null);

  /* ------------------------------
   * React Query로 데이터 조회
   * ------------------------------ */
  const { data: research } = useResearchDetail(asmtSnNumber);
  // 최신 분석 데이터 상세 조회 (fileList 포함)
  const { data: latestAnalysisData } = useLatestAnalysisDataDetail(asmtSnNumber, rsltGroupStcd);
  const fileList: FileData[] = (latestAnalysisData?.fileList ?? []).map((f) => ({
    name: f.fileNm,
    ext: f.fileExtNm ?? (f.fileNm?.split(".").pop() || ""),
    size: formatFileSize(f.fileSz ?? 0),
    atchFileId: f.atchFileId,
  }));
  // 메타/원천데이터 분석 모두 검토완료 여부 (버튼 클릭 시 refetch)
  const { data: allAnalysisCompleted, refetch: refetchAllStatusCompleted } = useCheckAllStatusCompleted(asmtSnNumber, false);
  // 메타분석 접근 가능 여부 (버튼 클릭 시 refetch)
  const { refetch: refetchMetaAccess } = useCheckMetaAccess(asmtSnNumber, false);

  const showMetaAccessDeniedMessage = async () => {
    await confirmModal.open({
      title: "확인",
      message: "통합,메타 분석에서 결과제외, 활용미동의를 등록하신 기관은 메타분석 결과를 확인할 수 없습니다.",
      width: "xs",
      fullWidth: true,
      data: {
        hiddenCancelButton: true,
      },
    });
  };

  const validateMetaAccess = async () => {
    if (appTarget !== "partner") {
      return true;
    }
    const { data: metaAccess } = await refetchMetaAccess();
    if (metaAccess && !metaAccess.canAccessMetaResult) {
      await showMetaAccessDeniedMessage();
      return false;
    }
    return true;
  };

  // 통계 계산
  const statistics = useMemo(() => {
    const opinionList = latestAnalysisData?.opinionList || [];

    // 메타분석 참여기관 중 "결과제외(EXCLUDED)" 등록한 기관은 완전 제외한다.
    const excludedInstIds = new Set(
      opinionList.filter((item) => isResearchOpinionExcludedResult(item)).map((item) => item.instId)
    );

    const completed = opinionList.filter(
      (item) =>
        item.utlzAgreSeCd === AnalysisResultStatus.COMPLETED &&
        !isResearchOpinionExcludedResult(item) &&
        !excludedInstIds.has(item.instId)
    ).length;
    const requestModify = opinionList.filter(
      (item) => item.utlzAgreSeCd === AnalysisResultStatus.REQUEST_MODIFY && !excludedInstIds.has(item.instId)
    ).length;

    // excluded는 모수에서 완전 제외하므로 notRegistered는 completed/requestModify에 해당하지 않는 "남은" 기관 수로 계산한다.
    const notRegistered = Math.max(0, (latestAnalysisData?.totalVotePartnerCount ?? 0) - completed - requestModify);

    // 상태 계산 로직(남은 기관 기준)
    let status = convertResearchAnalysisStatus(latestAnalysisData?.asmtMetaRsltSttsCd);
    if (notRegistered === 0) {
      if (requestModify > 0) {
        status = convertResearchAnalysisStatus(AnalysisResultStatus.REQUEST_MODIFY);
      } else {
        status = convertResearchAnalysisStatus(AnalysisResultStatus.COMPLETED);
      }
    }

    // excluded 등록 수 자체는 UI에 사용되지 않지만, 기존 반환 shape을 유지하기 위해 count만 제공한다.
    const exclude = excludedInstIds.size;

    return { completed, requestModify, exclude, notRegistered, status };
  }, [latestAnalysisData?.opinionList, latestAnalysisData?.asmtMetaRsltSttsCd, latestAnalysisData?.totalVotePartnerCount]);

  const visible1 = latestAnalysisData === undefined || latestAnalysisData === null;
  const visible2 = latestAnalysisData === undefined || latestAnalysisData === null || latestAnalysisData?.rsltNotiDt === null;
  const finalVisible = !!allAnalysisCompleted && (visible1 || visible2);

  useEffect(() => {
    dispatch(setTooltipVisible({ id: TOOLTIP_IDS.ANALYSIS_META_REGISTER, visible: finalVisible }));
  }, [dispatch, finalVisible]);

  useEffect(() => {
    const fetchAllStatusCompleted = async () => {
      if (!asmtSnNumber) {
        return;
      }
    };

    fetchAllStatusCompleted();
  }, [asmtSnNumber, refetchAllStatusCompleted]);

  // const isMetaUnavailable = isAllStatusCompleted === false;

  const validateAllStatusCompleted = async () => {
    const { data: isAllCompleted } = await refetchAllStatusCompleted();
    if (!isAllCompleted) {
      await confirmModal.open({
        title: "알림",
        message: "통합 데이터 / 기관 데이터 분석결과가 검토완료 상태이어야 합니다.",
        width: "xs",
        fullWidth: true,
        data: {
          hiddenCancelButton: true,
        },
      });
      return false;
    }
    return true;
  };

  const handleOpenMetaDataManagement = async () => {
    if (!asmtSnNumber) {
      return;
    }

    try {
      const isAllCompleted = await validateAllStatusCompleted();
      if (!isAllCompleted) {
        return;
      }

      const canAccessMeta = await validateMetaAccess();
      if (!canAccessMeta) {
        return;
      }

      // 모두 검토완료인 경우 연구결과 관리 모달 표시
      metaDataManagementModal.open({
        title: "연구결과 관리",
        showHeaderCloseButton: true,
      });
    } catch (error) {
      console.error("상태 체크 실패:", error);
      await confirmModal.open({
        title: "오류",
        message: "상태 확인 중 오류가 발생했습니다.",
        data: {
          hiddenCancelButton: true,
        },
      });
    }
  };

  return (
    <Box sx={{ position: "relative" }}>
      {/* {isMetaUnavailable && (
        <Box className={overlayStyles.unavailableOverlay}>
          <Box>
            <Typography component="p" variant="h6" className="text-gray-100">
              기관 데이터 분석 및 통합 데이터 분석이 모두 검토완료 상태가 아닙니다.
            </Typography>
            <Typography component="p" variant="h6" className="pt-1 text-gray-100">
              메타분석은 두 분석결과가 모두 검토완료일 때 진행할 수 있습니다.
            </Typography>
          </Box>
        </Box>
      )} */}
      <Box className="form_container">
        {/* 과제 내용 1 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography variant="h6">{STRINGS.REGISTERED_BY}</Typography>
            </Box>
            <Box className="form_container-row-content">{latestAnalysisData?.mbrEncptFlnm || "-"}</Box>
          </Box>
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography variant="h6">{STRINGS.REGISTERED_AT}</Typography>
            </Box>
            <Box className="form_container-row-content">
              {latestAnalysisData?.regDt ? formatDateTime(latestAnalysisData.regDt) : "-"}
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column max-w-[400px]">
            <Box className="form_container-row-label ">
              <Typography variant="h6">연구결과 상태</Typography>
            </Box>
            <Box className="form_container-row-content ">
              <AppStatusChip
                size="small"
                label={getResearchAnalysisStatusConfig(latestAnalysisData?.asmtMetaRsltSttsCd)?.label}
                chipStyle={getResearchAnalysisStatusConfig(latestAnalysisData?.asmtMetaRsltSttsCd)?.chipStyle ?? {}}
              />
            </Box>
          </Box>
        </Stack>

        {/* 과제 내용 2 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography variant="h6">{STRINGS.RESEARCH_RESULT}</Typography>
            </Box>
            <Box className="form_container-row-content">
              {!latestAnalysisData && <Typography variant="default">-</Typography>}
              {latestAnalysisData && fileList.length === 0 && (
                <Typography variant="default" color="text.secondary">
                  첨부된 파일이 없습니다.
                </Typography>
              )}
              {latestAnalysisData && fileList.length > 0 && (
                <FileContainer
                  files={fileList}
                  showDeleteButton={false}
                  onClick={(file) => {
                    (async () => {
                      if (!file.atchFileId) return;
                      const canAccessMeta = await validateMetaAccess();
                      if (!canAccessMeta) {
                        return;
                      }
                      if (isPreviewableFile(file.name, file.ext)) {
                        pdfPreviewModal.open({
                          title: "미리보기",
                          data: {
                            url: getFilePreviewUrl(file.atchFileId),
                            fileName: file.name,
                            atchFileId: file.atchFileId,
                          },
                        });
                      } else {
                        window.open(getFileDownloadUrl(file.atchFileId), "_blank");
                      }
                    })();
                  }}
                />
              )}
            </Box>
          </Box>
        </Stack>

        {/* 과제 내용 3 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography variant="h6">연구결과 설명</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextWithLineLimit text={latestAnalysisData?.asmtMetaRsltCn || "-"} variant="default" />
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column max-w-[400px]">
            <Box className="form_container-row-label ">
              <Typography variant="h6">연구결과 관리</Typography>
            </Box>
            <Box className="form_container-row-content ">
              {/* <ClickableStateTooltip ... /> */}
              <AppButton variant="containedLight" size="small" onClick={handleOpenMetaDataManagement}>
                연구결과 관리
              </AppButton>
            </Box>
          </Box>
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography variant="h6">의견/활용동의 {research?.instId === session.instId ? "현황" : "결과"}</Typography>
            </Box>
            <Box className="form_container-row-content">
              {research?.instId === session.instId ? (
                <>
                  {latestAnalysisData && (
                    <>
                      {/* 검토 결과 통계 */}
                      <Box component="span">
                        검토완료:
                        <Box component="span" sx={{ px: 1, fontWeight: 600, color: "research.voteApprove" }}>
                          {statistics.completed}
                        </Box>
                      </Box>
                      <Box component="span" sx={{ px: 3, color: "text.disabled" }}>
                        |
                      </Box>
                      <Box component="span">
                        보완요청:
                        <Box component="span" sx={{ px: 1, fontWeight: 600, color: "research.votePending" }}>
                          {statistics.requestModify}
                        </Box>
                      </Box>
                      <Box component="span" sx={{ px: 3, color: "text.disabled" }}>
                        |
                      </Box>
                      <Box component="span">
                        미등록:
                        <Box component="span" sx={{ px: 1, fontWeight: 600, color: "research.voteNeutral" }}>
                          {statistics.notRegistered}
                        </Box>
                      </Box>
                    </>
                  )}
                  {!latestAnalysisData && <Typography variant="default">-</Typography>}
                </>
              ) : (
                <AppStatusChip
                  size="small"
                  label={
                    getResearchAnalysisStatusConfig(
                      latestAnalysisData?.opinion ? researchOpinionDisplayStatusCode(latestAnalysisData.opinion) : undefined
                    )?.label
                  }
                  chipStyle={
                    getResearchAnalysisStatusConfig(
                      latestAnalysisData?.opinion ? researchOpinionDisplayStatusCode(latestAnalysisData.opinion) : undefined
                    )?.chipStyle ?? {}
                  }
                />
              )}
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
