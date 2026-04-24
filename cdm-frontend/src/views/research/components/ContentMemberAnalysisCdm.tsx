/**
 * 통합 데이터 분석결과 표시 컴포넌트 (참여기관용)
 * 참여기관 권한으로 통합 데이터 분석결과를 조회하는 컴포넌트
 *
 * 표시 정보:
 * - 등록자 및 등록일시
 * - 연구결과 내용 및 첨부 파일
 * - 연구결과 설명
 * - 분석결과 검토 요청 및 검토 결과
 */
import { useEffect, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { STRINGS } from "@/constants/string";
import { TOOLTIP_IDS } from "@/constants/tooltip";
import { RsltGroupStcdType } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import type { ResearchFileItem } from "@/interfaces/researchInterface";
import { getFilePreviewUrl } from "@/api/commonApi";
import { setTooltipVisible } from "@/store/tooltipSlice";
import { formatFileSize, getResearchAnalysisStatusConfig, researchOpinionDisplayStatusCode } from "@/utils/common";
import { formatDate } from "@/utils/dateUtils";
import { useLatestAnalysisDataDetail } from "@/hooks/research/useResearchQueries";
import { useModal } from "@/hooks/useModal";
import type { FileData } from "@/components/FileContainer";
import FileContainer from "@/components/FileContainer";
import TextWithLineLimit from "@/components/TextWithLineLimit";
import { isPreviewableFile } from "@/constants/researchFileUpload";

export default function ContentMemberAnalysisCdm() {
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
  // 최신 분석 데이터 상세 조회
  const dispatch = useDispatch();
  const {
    data: latestAnalysisData,
    // isLoading: isLoadingAnalysisData,
  } = useLatestAnalysisDataDetail(asmtSnNumber, rsltGroupStcd);
  // 최신 분석 데이터 상세 응답의 fileList 사용 (관리자용 ContentAnalysisCdm과 동일)
  const rawFileList = latestAnalysisData?.fileList ?? (latestAnalysisData as { file_list?: ResearchFileItem[] })?.file_list;
  const fileList: FileData[] = Array.isArray(rawFileList)
    ? rawFileList.map(
        (f: ResearchFileItem & { file_nm?: string; file_ext_nm?: string; file_sz?: number; atch_file_id?: string }) => ({
          name: f.fileNm ?? f.file_nm ?? "",
          ext: f.fileExtNm ?? f.file_ext_nm ?? (f.fileNm ?? f.file_nm)?.split(".").pop() ?? "",
          size: formatFileSize(Number(f.fileSz ?? f.file_sz ?? 0)),
          atchFileId: f.atchFileId ?? f.atch_file_id,
        })
      )
    : [];

  const latestOpinion = latestAnalysisData?.opinionList?.[0] ?? null;
  const reviewTooltipVisible = !!latestAnalysisData && (latestAnalysisData?.opinionList?.length ?? 0) === 0;
  useEffect(() => {
    dispatch(setTooltipVisible({ id: TOOLTIP_IDS.ANALYSIS_REVIEW_REGISTER, visible: reviewTooltipVisible }));
  }, [dispatch, reviewTooltipVisible]);

  return (
    <div className="form_container">
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
            {latestAnalysisData?.regDt ? formatDate(latestAnalysisData.regDt) : "-"}
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
            <Typography variant="h6">{STRINGS.CONTENT}</Typography>
          </Box>
          <Box className="form_container-row-content">
            <TextWithLineLimit text={latestAnalysisData?.asmtMetaRsltCn || "-"} variant="default" />
          </Box>
        </Box>
      </Stack>

      {/* 과제 내용 4 */}
      <Stack direction="row" className="form_container-row">
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">분석결과 검토</Typography>
          </Box>
          <Box className="form_container-row-content">
            {/* <ClickableStateTooltip
              tooltipId={TOOLTIP_IDS.ANALYSIS_REVIEW_REGISTER}
              placement="top"
              arrow
              slotProps={{ popper: { sx: { zIndex: 1 } } }}
            >
              <Button
                variant="containedLight"
                size="small"
                onClick={() => {
                  cdmDataManagementModal.open({});
                }}
              >
                분석결과 검토 등록
              </Button>
            </ClickableStateTooltip> */}
            <Button
              variant="containedLight"
              size="small"
              onClick={() => {
                cdmDataManagementModal.open({});
              }}
            >
              분석결과 검토 등록
            </Button>
          </Box>
        </Box>
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">분석결과 검토 결과</Typography>
          </Box>
          <Box className="form_container-row-content">
            <Chip
              size="small"
              label={
                getResearchAnalysisStatusConfig(
                  latestOpinion ? researchOpinionDisplayStatusCode(latestOpinion) : undefined
                )?.label
              }
              sx={
                getResearchAnalysisStatusConfig(
                  latestOpinion ? researchOpinionDisplayStatusCode(latestOpinion) : undefined
                )?.chipStyle ?? {}
              }
            />
          </Box>
        </Box>
      </Stack>
    </div>
  );
}
