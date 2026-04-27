import React, { useMemo } from "react";
import { Box, Button, Chip, Divider, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { STRINGS } from "@/constants/string";
import { AnalysisResultStatus, CONTENT_GAP, CdmUploadType, RsltGroupStcdType } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import type { OpinionItemResponse } from "@/interfaces/researchInterface";
import {
  formatResearchOpinionConsentLabel,
  getResearchAnalysisStatusConfig,
  isResearchOpinionExcludedResult,
  researchOpinionDisplayStatusCode,
} from "@/utils/common";
import { formatDateTime } from "@/utils/dateUtils";
import { useCloseReview, useSendReviewRequest } from "@/hooks/research/useResearchMutations";
import { useAnalysisDataDetail, useOpinionList, useResearchDetail } from "@/hooks/research/useResearchQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import { SpaceBox } from "@/components/SpaceBox";
import TextWithLineLimit from "@/components/TextWithLineLimit";

/** 기관별 의견 목록을 평면 목록으로 변환 (통계/테이블용). 의견이 없는 기관도 기관당 1건(미등록)으로 포함 */
function flattenOpinionsByInst(
  institutionList: Array<{ instId: string; instNm: string | null; opinions: OpinionItemResponse[] }>
): Array<OpinionItemResponse & { instId: string; instNm: string | null }> {
  return institutionList.flatMap((inst) => {
    const list = inst.opinions ?? [];
    if (list.length === 0) {
      const placeholder: OpinionItemResponse & { instId: string; instNm: string | null } = {
        asmtSn: 0,
        opnnIntgRsltSn: 0,
        asmtMetaRsltSn: 0,
        rsltGroupCd: null,
        opnnIntgDmndCn: null,
        utlzAgreSeCd: null,
        asmtOpnnSttsCd: null,
        rgtrId: null,
        regDt: null,
        mdfrNm: null,
        mdfrId: null,
        mdfcnDt: null,
        instId: inst.instId,
        instNm: inst.instNm,
      };
      return [placeholder];
    }
    return list.map((op) => ({ ...op, instId: inst.instId, instNm: inst.instNm }));
  });
}

export default function MetaDataManagementVote({
  asmtMetaRsltSn,
  asmtMetaRsltSttsCd,
  onStatusUpdated,
}: {
  asmtMetaRsltSn: number;
  asmtMetaRsltSttsCd?: string;
  onStatusUpdated?: () => void;
}) {
  const confirmModal = useModal(ModalNames.CONFIRM);
  const { showAlert } = useGlobalAlert();
  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;

  // 분석 데이터 상태 변경 mutation (검토 요청)
  const sendReviewRequestMutation = useSendReviewRequest();
  const closeReviewMutation = useCloseReview();

  const { data: researchDetail } = useResearchDetail(asmtSnNumber);
  const { data: analysisDataDetail } = useAnalysisDataDetail(
    asmtSnNumber,
    asmtMetaRsltSn,
    RsltGroupStcdType.ANALYSIS_META,
    !!asmtSnNumber && !!asmtMetaRsltSn
  );
  const { data: institutionList = [] } = useOpinionList(
    asmtSnNumber,
    asmtMetaRsltSn,
    RsltGroupStcdType.ANALYSIS_META,
    !!asmtSnNumber && !!asmtMetaRsltSn
  );

  // 참여기관 중 "결과제외(EXCLUDED)" 등록한 기관은 목록/통계 모수에서 제외
  const filteredInstitutionList = useMemo(() => {
    return institutionList.filter((inst) => !(inst.opinions ?? []).some((op) => isResearchOpinionExcludedResult(op)));
  }, [institutionList]);

  const flatOpinions = useMemo(() => flattenOpinionsByInst(filteredInstitutionList), [filteredInstitutionList]);
  const hasCdmInstitutionDisagreeConsent = useMemo(() => {
    return filteredInstitutionList.some(
      (inst) => inst.uldTypeCd === CdmUploadType.CDM && (inst.opinions ?? []).some((op) => op.asmtOpnnSttsCd === "10")
    );
  }, [filteredInstitutionList]);

  // 통계 계산
  const statistics = useMemo(() => {
    const completed = flatOpinions.filter(
      (item) => item.utlzAgreSeCd === AnalysisResultStatus.COMPLETED && !isResearchOpinionExcludedResult(item)
    ).length;
    const requestModify = flatOpinions.filter((item) => item.utlzAgreSeCd === AnalysisResultStatus.REQUEST_MODIFY).length;
    // const exclude = flatOpinions.filter((item) => item.utlzAgreSeCd === AnalysisResultStatus.EXCLUDED).length;
    const notRegistered = (analysisDataDetail?.totalVotePartnerCount ?? 0) - completed - requestModify; // - exclude;
    const consentAgree = flatOpinions.filter((item) => item.asmtOpnnSttsCd === "01").length;
    const consentDisagree = flatOpinions.filter((item) => item.asmtOpnnSttsCd === "10").length;

    return {
      completed,
      requestModify,
      // exclude,
      notRegistered,
      consentAgree,
      consentDisagree,
    };
  }, [flatOpinions, analysisDataDetail?.totalVotePartnerCount]);

  const handleExportExcel = () => {
    if (flatOpinions.length === 0) {
      showAlert({ message: "저장할 검토 결과가 없습니다.", severity: "warning" });
      return;
    }
    const headers = [STRINGS.STATUS, "활용동의", STRINGS.PARTNER, STRINGS.CONTENT, STRINGS.REGISTERED_BY, STRINGS.REGISTERED_AT];
    const rows: (string | number)[][] = flatOpinions.map((item) => [
      getResearchAnalysisStatusConfig(researchOpinionDisplayStatusCode(item))?.label ?? "-",
      formatResearchOpinionConsentLabel(item.asmtOpnnSttsCd),
      item.instNm ?? "-",
      item.opnnIntgDmndCn ?? "-",
      item.mdfrNm ?? "-",
      item.regDt ? formatDateTime(item.regDt) : "-",
    ]);
    const sheetData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const colWidths = [{ wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 50 }, { wch: 14 }, { wch: 20 }];
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "검토결과");
    const asmtNm = researchDetail?.asmtNm?.trim() || "검토결과";
    const fileName = `${asmtNm}_메타분석 검토결과.xlsx`;
    XLSX.writeFile(wb, fileName);
    showAlert({ message: "검토결과 엑셀 파일이 저장되었습니다.", severity: "success" });
  };

  const handleSendReviewRequest = async () => {
    if (sendReviewRequestMutation.isPending) {
      return;
    }

    const result = await confirmModal.open({
      title: "확인",
      message: "참여기관에 분석결과 검토 요청 알림을 전송합니다.",
      width: "max-w-[25rem]",
    });

    if (result && asmtSnNumber && asmtMetaRsltSn) {
      sendReviewRequestMutation.mutate(
        {
          asmtSn: asmtSnNumber,
          asmtMetaRsltSn: asmtMetaRsltSn,
          rsltGroupCd: RsltGroupStcdType.ANALYSIS_META,
        },
        {
          onSuccess: () => {
            showAlert({
              message: "참여기관에 분석결과 검토 요청 알림을 전송했습니다.",
              severity: "success",
            });
          },
        }
      );
    }
  };

  return (
    <Box position="relative" width="100%">
      <Box>
        <Box className="flex justify-between items-center h-[35px]">
          <Box className="min-w-[500px]">
            <Box className="">
              <Typography variant="mainTitle">분석결과 검토</Typography>
              <Typography variant="description" component="p">
                분석결과 검토 및 연구결과 활용동의 요청에 대한 결과
              </Typography>
            </Box>
          </Box>
          <Box className="btn_container btn_right">
            <Button
              variant="containedLight"
              color="primary"
              disabled={
                !!analysisDataDetail?.rsltNotiDt ||
                statistics.notRegistered === 0 ||
                (asmtMetaRsltSttsCd !== AnalysisResultStatus.SUBMITTED &&
                  asmtMetaRsltSttsCd !== AnalysisResultStatus.REQUEST_REVIEW &&
                  asmtMetaRsltSttsCd !== AnalysisResultStatus.INPROGRESS_REVIEW)
              }
              onClick={handleSendReviewRequest}
            >
              검토 요청 보내기
            </Button>
            <Button
              variant="containedGray"
              disabled={
                closeReviewMutation.isPending ||
                (asmtMetaRsltSttsCd !== AnalysisResultStatus.SUBMITTED &&
                  asmtMetaRsltSttsCd !== AnalysisResultStatus.REQUEST_REVIEW &&
                  asmtMetaRsltSttsCd !== AnalysisResultStatus.INPROGRESS_REVIEW)
              }
              onClick={async () => {
                const result = await confirmModal.open({
                  title: "확인",
                  message: ["분석결과 검토를 마감합니다,", "미등록한 참여기관은 검토 결과에서 제외합니다."],
                  width: "max-w-[25rem]",
                });

                if (result && asmtSnNumber && asmtMetaRsltSn) {
                  closeReviewMutation.mutate(
                    {
                      asmtSn: asmtSnNumber,
                      asmtMetaRsltSn: asmtMetaRsltSn,
                      rsltGroupCd: RsltGroupStcdType.ANALYSIS_META,
                    },
                    {
                      onSuccess: async () => {
                        showAlert({
                          message: "분석결과 검토를 마감했습니다.",
                          severity: "success",
                        });
                        onStatusUpdated?.();
                        if (hasCdmInstitutionDisagreeConsent) {
                          await confirmModal.open({
                            title: "확인",
                            message: "데이터 현황이 CDM인 기관이 활용미동의로 '통합 데이터 분석결과'를 다시 진행해야 합니다.",
                            width: "max-w-[32rem]",
                            data: {
                              hiddenCancelButton: true,
                            },
                          });
                        }
                      },
                    }
                  );
                }
              }}
            >
              검토 요청 마감
            </Button>
          </Box>
        </Box>

        <SpaceBox gap={CONTENT_GAP.LARGE} />

        <SpaceBox gap={CONTENT_GAP.XSMALL} />

        <Box className="btn_container">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="default">
              검토완료:
              <Typography component="span" variant="default" sx={{ pl: 1, color: "research.voteApprove" }}>
                {statistics.completed}
              </Typography>
            </Typography>
            <Typography component="span" sx={{ color: "text.disabled" }}>
              |
            </Typography>
            <Typography variant="default">
              보완요청:
              <Typography component="span" variant="default" sx={{ pl: 1, color: "research.votePending" }}>
                {statistics.requestModify}
              </Typography>
            </Typography>
            <Typography component="span" sx={{ color: "text.disabled" }}>
              |
            </Typography>
            <Typography variant="default">
              미등록:
              <Typography component="span" variant="default" sx={{ pl: 1, color: "research.voteNeutral" }}>
                {statistics?.notRegistered ?? "-"}
              </Typography>
            </Typography>
            <Typography component="span" sx={{ px: 1, color: "text.disabled" }}>
              /
            </Typography>
            <Typography variant="default">
              활용동의:
              <Typography component="span" variant="default" sx={{ pl: 1, color: "research.voteApprove" }}>
                {statistics.consentAgree}
              </Typography>
            </Typography>
            <Typography component="span" sx={{ color: "text.disabled" }}>
              |
            </Typography>
            <Typography variant="default">
              활용미동의:
              <Typography component="span" variant="default" sx={{ pl: 1, color: "research.voteDanger" }}>
                {statistics.consentDisagree}
              </Typography>
            </Typography>
          </Stack>
          <Button variant="outlined" color="primary" onClick={handleExportExcel}>
            검토결과 엑셀 저장
          </Button>
        </Box>

        <SpaceBox gap={CONTENT_GAP.XSMALL} />

        <Box
          sx={{
            display: "flex",
            width: "100%",
            bgcolor: "grey.200",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ width: 80, textAlign: "center", py: 2, bgcolor: "grey.200" }}>
            <Typography variant="default" fontWeight={600}>
              {STRINGS.STATUS}
            </Typography>
          </Box>
          <Box sx={{ width: 80, textAlign: "center", py: 2, bgcolor: "grey.200" }}>
            <Typography variant="default" fontWeight={600}>
              활용동의
            </Typography>
          </Box>
          <Box sx={{ flex: 1, py: 2, bgcolor: "grey.200" }}>
            <Typography variant="default" fontWeight={600}>
              {STRINGS.PARTNER} / {STRINGS.CONTENT}
            </Typography>
          </Box>
          <Box sx={{ width: 120, textAlign: "center", py: 2, bgcolor: "grey.200" }}>
            <Typography variant="default" fontWeight={600}>
              {STRINGS.REGISTERED_BY}
            </Typography>
          </Box>
          <Box sx={{ width: 180, textAlign: "center", py: 2, bgcolor: "grey.200" }}>
            <Typography variant="default" fontWeight={600}>
              {STRINGS.REGISTERED_AT}
            </Typography>
          </Box>
        </Box>

        <List className="w-full">
          {flatOpinions.map((item) => {
            const isNotRegistered = item.utlzAgreSeCd === AnalysisResultStatus.NOT_REGISTERED;

            return (
              <React.Fragment key={item.opnnIntgRsltSn}>
                <ListItem alignItems="center" sx={{ py: 0.8, px: 0, m: 0, width: "100%", minHeight: "50px" }}>
                  <Box className="w-[80px] text-center">
                    <Chip
                      size="small"
                      label={getResearchAnalysisStatusConfig(researchOpinionDisplayStatusCode(item))?.label}
                      sx={getResearchAnalysisStatusConfig(researchOpinionDisplayStatusCode(item))?.chipStyle ?? {}}
                    />
                  </Box>
                  <Box className="w-[80px] text-center">
                    <Typography variant="default">{formatResearchOpinionConsentLabel(item.asmtOpnnSttsCd)}</Typography>
                  </Box>
                  <Box className="flex-1">
                    <ListItemText
                      className="w-full"
                      primary={
                        <React.Fragment>
                          <Typography component="span" variant="h6">
                            {item.instNm}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                    <TextWithLineLimit text={item.opnnIntgDmndCn} variant="description" />
                  </Box>
                  <Box className="w-[120px] text-center">
                    <Typography variant="default">{isNotRegistered ? "-" : item.mdfrNm ? item.mdfrNm : "-"}</Typography>
                  </Box>
                  <Box className="w-[180px] text-center">
                    <Typography variant="default">
                      {isNotRegistered ? "-" : item.regDt ? formatDateTime(item.regDt) : "-"}
                    </Typography>
                  </Box>
                </ListItem>
                <Divider variant="inset" component="li" sx={{ width: "100%", m: 0, p: 0 }} />
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}
