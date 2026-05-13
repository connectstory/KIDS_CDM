/**
 * 통합 데이터 분석결과 표시 컴포넌트
 * 관리자 권한으로 통합 데이터 분석결과를 표시하는 컴포넌트
 *
 * 표시 정보:
 * - 등록자 및 등록일시
 * - 연구결과 수정 버튼
 * - 연구결과 내용 및 첨부 파일
 * - 연구결과 설명
 * - 분석결과 검토 요청 및 검토 결과
 */
import { useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { isPreviewableFile } from "@/constants/researchFileUpload";
import { STRINGS } from "@/constants/string";
import {
  ANALYSIS_RESULT_STATUS as AnalysisResultStatus,
  CDM_UPLOAD_TYPE as CdmUploadType,
  RSLT_GROUP_STCD_TYPE as RsltGroupStcdType,
} from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import { getFileDownloadUrl, getFilePreviewUrl } from "@/api/commonApi";
import {
  convertResearchAnalysisStatus,
  formatFileSize,
  getResearchAnalysisStatusConfig,
  isResearchOpinionExcludedResult,
} from "@/utils/common";
import { formatDateTime } from "@/utils/dateUtils";
import { useLatestAnalysisDataDetail, useResearchPartners } from "@/hooks/research/useResearchQueries";
import { useModal } from "@/hooks/useModal";
import type { FileData } from "@/components/FileContainer";
import FileContainer from "@/components/FileContainer";
import TextWithLineLimit from "@/components/TextWithLineLimit";
import { AppButton, AppStatusChip } from "@/components/ui";
import overlayStyles from "./ResearchOverlay.module.scss";

export default function ContentAnalysisCdm() {
  const cdmDataManagementModal = useModal(ModalNames.CdmDataManagement);
  const pdfPreviewModal = useModal(ModalNames.PDF_PREVIEW);

  /* ------------------------------
   * 상태 변수
   * ------------------------------ */
  const [rsltGroupStcd] = useState(RsltGroupStcdType.ANALYSIS_CDM);

  /* ------------------------------
   * URL param
   * ------------------------------ */
  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;
  /* ------------------------------
   * React Query로 데이터 조회
   * ------------------------------ */
  // 최신 분석 데이터 상세 조회 (fileList 포함)
  const { data: latestAnalysisData } = useLatestAnalysisDataDetail(asmtSnNumber, rsltGroupStcd);
  const fileList: FileData[] = (latestAnalysisData?.fileList ?? []).map((f) => ({
    name: f.fileNm,
    ext: f.fileExtNm ?? (f.fileNm?.split(".").pop() || ""),
    size: formatFileSize(f.fileSz ?? 0),
    atchFileId: f.atchFileId,
  }));

  // 참여기관 목록 조회
  const { data: partners = [] } = useResearchPartners(asmtSnNumber);

  // uldTypeCd가 "01"인 기관 수 계산
  const cdmUploadedCount = useMemo(() => {
    return partners.filter((p) => p.uldTypeCd === CdmUploadType.CDM && p.asmtPtcpRtrcnDt === null).length;
  }, [partners]);

  // CDM 데이터 업로드된 기관이 없으면 사용불가
  const isCdmUnavailable = cdmUploadedCount === 0;

  // 통계: 항목 표시 순서는 그대로 두고, 한 건의 의견은 한 버킷만 잡는다. utlz=06+asmt=08(결과제외)은 검토완료보다 우선해 결과제외만 증가.
  const statistics = useMemo(() => {
    const opinionList = latestAnalysisData?.opinionList || [];
    const exclude = opinionList.filter((item) => isResearchOpinionExcludedResult(item)).length;
    const completed = opinionList.filter(
      (item) => item.utlzAgreSeCd === AnalysisResultStatus.COMPLETED && !isResearchOpinionExcludedResult(item)
    ).length;
    const requestModify = opinionList.filter((item) => item.utlzAgreSeCd === AnalysisResultStatus.REQUEST_MODIFY).length;
    const notRegistered = (latestAnalysisData?.totalVotePartnerCount ?? 0) - completed - requestModify - exclude;

    // 상태 계산 로직 (CdmDataManagementModal과 동일)
    let status = convertResearchAnalysisStatus(latestAnalysisData?.asmtMetaRsltSttsCd);
    if (notRegistered === 0) {
      if (exclude > 0) {
        status = convertResearchAnalysisStatus(AnalysisResultStatus.EXCLUDED);
      } else if (requestModify > 0) {
        status = convertResearchAnalysisStatus(AnalysisResultStatus.REQUEST_MODIFY);
      } else {
        status = convertResearchAnalysisStatus(AnalysisResultStatus.COMPLETED);
      }
    }

    return { completed, requestModify, exclude, notRegistered, status };
  }, [latestAnalysisData?.opinionList, latestAnalysisData?.asmtMetaRsltSttsCd, latestAnalysisData?.totalVotePartnerCount]);

  const handleOpenCdmDataManagement = () => {
    cdmDataManagementModal.open({
      title: "분석결과 관리",
      showHeaderCloseButton: true,
    });
  };

  return (
    <Box sx={{ position: "relative" }}>
      {/* 사용불가 오버레이 */}
      {isCdmUnavailable && (
        <Box className={overlayStyles.unavailableOverlay}>
          <Box>
            <Typography component="p" variant="h6" sx={{ color: "common.white" }}>
              CDM 데이터를 업로드한 참여기관이 없습니다,
            </Typography>
            <Typography component="p" variant="h6" sx={{ color: "common.white", pt: 1 }}>
              통합 데이터 분석결과는 업로드된 CDM 데이터를 기반으로 분석됩니다.
            </Typography>
          </Box>
        </Box>
      )}
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
          {/* <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography variant="h6">연구결과 수정</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Button
                variant="outlined"
                
                onClick={() => {
                  analysisResultUploadModal.open({
                    title: "분석결과 등록",
                    data: {
                      title: research?.asmtNm || "",
                    },
                  });
                }}
              >
                수정
              </Button>
            </Box>
          </Box> */}
        </Stack>

        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column max-w-[400px]">
            <Box className="form_container-row-label ">
              <Typography variant="h6">분석결과 상태</Typography>
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
              {latestAnalysisData && fileList.length > 0 && (
                <FileContainer
                  files={fileList}
                  showDeleteButton={false}
                  onClick={(file) => {
                    if (!file.atchFileId) return;
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
                  }}
                />
              )}
              {(!latestAnalysisData || fileList.length === 0) && <Typography variant="default">-</Typography>}
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

        {/* 과제 내용 4 */}
        {/* <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography variant="h6">분석결과 검토 요청</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Button
                variant="outlined"
                
                onClick={() => {
                  cdmDataManagementModal.open({});
                }}
              >
                검토요청
              </Button>
            </Box>
          </Box>
        </Stack> */}

        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column max-w-[400px]">
            <Box className="form_container-row-label ">
              <Typography variant="h6">분석결과 관리</Typography>
            </Box>
            <Box className="form_container-row-content ">
              {/* <ClickableStateTooltip ... /> */}
              <AppButton variant="containedLight" size="small" disabled={isCdmUnavailable} onClick={handleOpenCdmDataManagement}>
                분석결과 관리
              </AppButton>
            </Box>
          </Box>
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography variant="h6">분석결과 검토 현황</Typography>
            </Box>
            <Box className="form_container-row-content">
              {latestAnalysisData && (
                <>
                  {/* 검토 결과 통계 */}
                  <Box component="span">
                    검토완료:
                    <Box component="span" sx={{ px: 1, fontWeight: 600, color: "research.voteApprove" }}>
                      {statistics.completed}
                    </Box>
                  </Box>
                  <Box component="span" sx={{ px: 1, color: "text.disabled" }}>
                    |
                  </Box>
                  <Box component="span">
                    보완요청:
                    <Box component="span" sx={{ px: 1, fontWeight: 600, color: "research.votePending" }}>
                      {statistics.requestModify}
                    </Box>
                  </Box>
                  <Box component="span" sx={{ px: 1, color: "text.disabled" }}>
                    |
                  </Box>
                  <Box component="span">
                    결과제외:
                    <Box component="span" sx={{ px: 1, fontWeight: 600, color: "research.voteReject" }}>
                      {statistics.exclude}
                    </Box>
                  </Box>
                  <Box component="span" sx={{ px: 1, color: "text.disabled" }}>
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
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
