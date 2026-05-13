/**
 * 기관 데이터 분석결과 표시 컴포넌트 (참여기관용)
 */
import { Box, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { isPreviewableFile } from "@/constants/researchFileUpload";
import { STRINGS } from "@/constants/string";
import { RSLT_GROUP_STCD_TYPE as RsltGroupStcdType } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import { downloadFileViaProxy, getFilePreviewUrl } from "@/api/commonApi";
import { getResearchAnalysisStatusConfig } from "@/utils/common";
import { mapLatestAnalysisResponseToFileData } from "@/utils/researchAnalysisFiles";
import { formatDateTime } from "@/utils/dateUtils";
import { useLatestAnalysisDataDetail } from "@/hooks/research/useResearchQueries";
import { useModal } from "@/hooks/useModal";
import { AppButton, AppStatusChip } from "@/components/ui";
import FileContainer from "@/components/FileContainer";
import TextWithLineLimit from "@/components/TextWithLineLimit";

export default function ContentMemberAnalysisOrg() {
  const orgDataManagementModal = useModal(ModalNames.OrgDataManagement);
  const pdfPreviewModal = useModal(ModalNames.PDF_PREVIEW);

  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;

  const { data: latestAnalysisData } = useLatestAnalysisDataDetail(asmtSnNumber, RsltGroupStcdType.ANALYSIS_ORG);
  const fileList = mapLatestAnalysisResponseToFileData(latestAnalysisData);

  const handleOpenOrgDataManagement = () => {
    orgDataManagementModal.open({
      title: "기관 데이터 분석결과 관리",
      showHeaderCloseButton: true,
    });
  };

  return (
    <Box>
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
              {latestAnalysisData?.regDt ? formatDateTime(latestAnalysisData.regDt) : "-"}
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
                    } else {
                      downloadFileViaProxy(file.atchFileId, file.name);
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
              <Typography variant="h6">분석결과 관리</Typography>
            </Box>
            <Box className="form_container-row-content ">
              <AppButton variant="containedLight" size="small" onClick={handleOpenOrgDataManagement}>
                분석결과 관리
              </AppButton>
            </Box>
          </Box>
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography variant="h6">분석결과 검토 상태</Typography>
            </Box>
            <Box className="form_container-row-content">
              <AppStatusChip
                size="small"
                label={getResearchAnalysisStatusConfig(latestAnalysisData?.asmtMetaRsltSttsCd)?.label}
                chipStyle={getResearchAnalysisStatusConfig(latestAnalysisData?.asmtMetaRsltSttsCd)?.chipStyle ?? {}}
              />
            </Box>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
