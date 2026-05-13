/**
 * 통합 데이터 분석결과 표시 컴포넌트 (참여기관용)
 * 참여기관 권한으로 통합 데이터 분석결과를 조회하는 컴포넌트
 */
import { useEffect } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { isPreviewableFile } from "@/constants/researchFileUpload";
import { STRINGS } from "@/constants/string";
import { TOOLTIP_IDS } from "@/constants/tooltip";
import { RSLT_GROUP_STCD_TYPE as RsltGroupStcdType } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import { getFilePreviewUrl } from "@/api/commonApi";
import { setTooltipVisible } from "@/store/tooltipSlice";
import { getResearchAnalysisStatusConfig, researchOpinionDisplayStatusCode } from "@/utils/common";
import { mapLatestAnalysisResponseToFileData } from "@/utils/researchAnalysisFiles";
import { formatDate } from "@/utils/dateUtils";
import { useLatestAnalysisDataDetail } from "@/hooks/research/useResearchQueries";
import { useModal } from "@/hooks/useModal";
import { AppButton, AppStatusChip } from "@/components/ui";
import FileContainer from "@/components/FileContainer";
import TextWithLineLimit from "@/components/TextWithLineLimit";

export default function ContentMemberAnalysisCdm() {
  const cdmDataManagementModal = useModal(ModalNames.CdmDataManagement);
  const pdfPreviewModal = useModal(ModalNames.PDF_PREVIEW);

  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;

  const dispatch = useDispatch();
  const { data: latestAnalysisData } = useLatestAnalysisDataDetail(asmtSnNumber, RsltGroupStcdType.ANALYSIS_CDM);
  const fileList = mapLatestAnalysisResponseToFileData(latestAnalysisData);

  const latestOpinion = latestAnalysisData?.opinionList?.[0] ?? null;
  const reviewTooltipVisible = !!latestAnalysisData && (latestAnalysisData?.opinionList?.length ?? 0) === 0;
  useEffect(() => {
    dispatch(setTooltipVisible({ id: TOOLTIP_IDS.ANALYSIS_REVIEW_REGISTER, visible: reviewTooltipVisible }));
  }, [dispatch, reviewTooltipVisible]);

  return (
    <Box className="form_container">
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
            {latestAnalysisData?.regDt ? formatDate(latestAnalysisData.regDt) : "-"}
          </Box>
        </Box>
      </Stack>

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
                  }
                }}
              />
            )}
            {(!latestAnalysisData || fileList.length === 0) && <Typography variant="default">-</Typography>}
          </Box>
        </Box>
      </Stack>

      <Stack direction="row" className="form_container-row">
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">{STRINGS.CONTENT}</Typography>
          </Box>
          <Box className="form_container-row-content">
            <TextWithLineLimit text={latestAnalysisData?.asmtMetaRsltCn || "-"} variant="default" />
          </Box>
        </Box>
      </Stack>

      <Stack direction="row" className="form_container-row">
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">분석결과 검토</Typography>
          </Box>
          <Box className="form_container-row-content">
            <AppButton
              variant="containedLight"
              size="small"
              onClick={() => {
                cdmDataManagementModal.open({});
              }}
            >
              분석결과 검토 등록
            </AppButton>
          </Box>
        </Box>
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">분석결과 검토 결과</Typography>
          </Box>
          <Box className="form_container-row-content">
            <AppStatusChip
              size="small"
              label={
                getResearchAnalysisStatusConfig(
                  latestOpinion ? researchOpinionDisplayStatusCode(latestOpinion) : undefined
                )?.label
              }
              chipStyle={
                getResearchAnalysisStatusConfig(
                  latestOpinion ? researchOpinionDisplayStatusCode(latestOpinion) : undefined
                )?.chipStyle ?? {}
              }
            />
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
