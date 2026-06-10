import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Divider, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { isPreviewableFile } from "@/constants/researchFileUpload";
import { MSG } from "@/constants/string";
import {
  ANALYSIS_RESULT_STATUS as AnalysisResultStatus,
  CONTENT_GAP,
  RSLT_GROUP_STCD_TYPE as RsltGroupStcdType,
} from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import { downloadFileViaProxy, getFilePreviewUrl } from "@/api/commonApi";
import type { RootState } from "@/store";
import {
  formatFileSize,
  getResearchAnalysisStatusConfig,
  isResearchCrudDisabled,
  researchOpinionDisplayStatusCode,
} from "@/utils/common";
import { formatDateTime } from "@/utils/dateUtils";
import { useCreateOpinion, useSendReviewRequest } from "@/hooks/research/useResearchMutations";
import { useAnalysisDataDetail, useResearchDetail } from "@/hooks/research/useResearchQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import type { FileData } from "@/components/FileContainer";
import FileContainer from "@/components/FileContainer";
import { SpaceBox } from "@/components/SpaceBox";
import TextWithLineLimit from "@/components/TextWithLineLimit";

export default function OrgDataManagementDetail({
  asmtMetaRsltSn,
  onConfirm,
  onEdit,
}: {
  asmtMetaRsltSn: number;
  onConfirm: () => void;
  onEdit?: () => void;
}) {
  // 라우팅 파라미터
  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;
  // 데이터 조회
  const { data: research } = useResearchDetail(asmtSnNumber);
  // 데이터 수정 & 등록
  const createOpinionMutation = useCreateOpinion();
  const sendReviewRequestMutation = useSendReviewRequest();
  // 컴포넌트 hook
  const confirmModal = useModal(ModalNames.CONFIRM);
  const pdfPreviewModal = useModal(ModalNames.PDF_PREVIEW);
  const { showAlert } = useGlobalAlert();
  // 스토어
  const session = useSelector((state: RootState) => state.session);
  // 연구과제 마감/취소 시 CRUD 비활성화
  const isCrudDisabled = isResearchCrudDisabled(research?.asmtPrgrsSttsCd);
  // 상태 변수
  const [opnnIntgDmndCn, setOpnnIntgDmndCn] = useState<string>("");
  const [utlzAgreSeCd, setUtlzAgreSeCd] = useState<string>(AnalysisResultStatus.COMPLETED);
  const [opnnIntgDmndCnError, setOpnnIntgDmndCnError] = useState<string>("");

  // 기관 데이터 상세 조회
  const { data: analysisDataDetail, refetch } = useAnalysisDataDetail(
    research?.asmtSn ?? null,
    asmtMetaRsltSn,
    RsltGroupStcdType.ANALYSIS_ORG
  );
  const fileList: FileData[] = useMemo(
    () =>
      (analysisDataDetail?.fileList ?? []).map((f) => ({
        name: f.fileNm,
        ext: f.fileExtNm ?? (f.fileNm?.split(".").pop() || ""),
        size: formatFileSize(f.fileSz ?? 0),
        atchFileId: f.atchFileId,
        atchFileGroupId: f.atchFileGroupId,
      })),
    [analysisDataDetail?.fileList]
  );
  const isRequester = research?.instId !== session.instId;
  const isReviewer = research?.instId === session.instId;
  const canSendReviewRequest =
    isRequester &&
    analysisDataDetail?.rsltNotiDt == null &&
    analysisDataDetail?.asmtMetaRsltSttsCd !== AnalysisResultStatus.COMPLETED &&
    analysisDataDetail?.asmtMetaRsltSttsCd !== AnalysisResultStatus.REQUEST_MODIFY &&
    !isCrudDisabled;
  const canShowEditButton =
    isRequester && analysisDataDetail?.asmtMetaRsltSttsCd === AnalysisResultStatus.SUBMITTED && !isCrudDisabled;

  const latestOpinion = analysisDataDetail?.opinionList?.[0] ?? null;

  const canShowReviewRegister =
    isReviewer &&
    latestOpinion === null &&
    (analysisDataDetail?.asmtMetaRsltSttsCd === AnalysisResultStatus.REQUEST_REVIEW ||
      analysisDataDetail?.asmtMetaRsltSttsCd === AnalysisResultStatus.INPROGRESS_REVIEW);
  const canShowReviewResult =
    latestOpinion !== null &&
    latestOpinion.utlzAgreSeCd !== AnalysisResultStatus.INPROGRESS_REVIEW &&
    latestOpinion.utlzAgreSeCd !== AnalysisResultStatus.NOT_REGISTERED;

  useEffect(() => {
    if (!analysisDataDetail) return;

    onConfirm();
  }, [analysisDataDetail]);

  useEffect(() => {
    if (!canShowReviewRegister) return;

    setUtlzAgreSeCd(AnalysisResultStatus.COMPLETED);
    setOpnnIntgDmndCn("");
    setOpnnIntgDmndCnError("");
  }, [canShowReviewRegister]);

  const handleFileClick = useCallback(
    (file: FileData) => {
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
    },
    [pdfPreviewModal]
  );

  /* ------------------------------
   * 승인 검토 제출 핸들러
   * ------------------------------ */
  const handleSubmitApprovalReview = async () => {
    if (!research?.asmtSn) {
      showAlert({ message: "연구과제 정보를 찾을 수 없습니다.", severity: "error" });
      return;
    }

    if (opnnIntgDmndCn.trim() === "") {
      setOpnnIntgDmndCnError(MSG.CONTENT_REQUIRED);
      showAlert({ message: MSG.CONTENT_REQUIRED, severity: "warning" });
      return;
    }

    createOpinionMutation.mutateAsync(
      {
        asmtSn: research.asmtSn,
        asmtMetaRsltSn: asmtMetaRsltSn,
        rsltGroupStcd: RsltGroupStcdType.ANALYSIS_ORG,
        data: {
          opnnIntgDmndCn: opnnIntgDmndCn,
          utlzAgreSeCd: utlzAgreSeCd,
          asmtOpnnSttsCd: "",
        },
      },
      {
        onSuccess: () => {
          refetch();
          onConfirm();
        },
      }
    );
  };

  return (
    <Box className="relative w-full pb-14">
      <Stack direction="column" spacing={CONTENT_GAP.LARGE} width="100%">
        <Box className="flex justify-between items-center h-[35px]">
          <Box className="min-w-[200px]">
            <Typography variant="mainTitle">기관 데이터 상세</Typography>
          </Box>
          {isRequester && (
            <Box className="btn_container btn_right">
              <Button
                variant="containedLight"
                color="primary"
                disabled={!canSendReviewRequest}
                onClick={async () => {
                  if (sendReviewRequestMutation.isPending) {
                    return;
                  }

                  const result = await confirmModal.open({
                    title: STRINGS.CONFIRM,
                    message: "연구과제 분석자에게 검토 요청을 전송합니다.",
                  });

                  if (result && asmtSnNumber && asmtMetaRsltSn) {
                    sendReviewRequestMutation.mutate(
                      {
                        asmtSn: asmtSnNumber,
                        asmtMetaRsltSn: asmtMetaRsltSn,
                        rsltGroupCd: RsltGroupStcdType.ANALYSIS_ORG,
                      },
                      {
                        onSuccess: () => {
                          showAlert({
                            message: "연구과제 분석자에게 검토 요청을 전송했습니다.",
                            severity: "success",
                          });
                          refetch();
                        },
                      }
                    );
                  }
                }}
              >
                검토 요청 보내기
              </Button>
            </Box>
          )}
        </Box>
        {analysisDataDetail && (
          <>
            {/* 기관 데이터 상세 */}
            <Box>
              <Box className="sub_path">
                <Typography className="tit" variant="h5">
                  분석 결과
                </Typography>
              </Box>
              <Box className="form_container">
                <Stack direction="row" className="form_container-row">
                  <Box className="form_container-column">
                    <Box className="form_container-row-label">
                      <Typography variant="h6">등록일시</Typography>
                    </Box>
                    <Box className="form_container-row-content">
                      <Typography variant="default">{formatDateTime(analysisDataDetail.regDt)}</Typography>
                    </Box>
                  </Box>
                  <Box className="form_container-column">
                    <Box className="form_container-row-label">
                      <Typography variant="h6">등록자</Typography>
                    </Box>
                    <Box className="form_container-row-content">
                      <Typography variant="default">{analysisDataDetail.mbrEncptFlnm}</Typography>
                    </Box>
                  </Box>
                </Stack>
                <Stack direction="row" className="form_container-row">
                  <Box className="form_container-column">
                    <Box className="form_container-row-label">
                      <Typography variant="h6">기관 데이터 자료</Typography>
                    </Box>
                    <Box className="form_container-row-content">
                      <div className="w100">
                        {fileList.length === 0 ? (
                          <Typography variant="default" color="text.secondary">
                            첨부된 파일이 없습니다.
                          </Typography>
                        ) : (
                          <FileContainer files={fileList} showDeleteButton={false} onClick={handleFileClick} />
                        )}
                      </div>
                    </Box>
                  </Box>
                </Stack>
                <Stack direction="row" className="form_container-row">
                  <Box className="form_container-column">
                    <Box className="form_container-row-label">
                      <Typography variant="h6">내용</Typography>
                    </Box>
                    <Box className="form_container-row-content">
                      <TextWithLineLimit text={analysisDataDetail.asmtMetaRsltCn} maxLines={5} />
                    </Box>
                  </Box>
                </Stack>
              </Box>

              {canShowEditButton && (
                <>
                  <SpaceBox gap={CONTENT_GAP.SMALL} />

                  <Stack justifyContent={"flex-end"} direction="row">
                    <Button variant="outlined" onClick={onEdit}>
                      수정
                    </Button>
                  </Stack>
                </>
              )}
            </Box>

            {/* CDM 관리자 검토 등록/수정 */}
            {canShowReviewRegister && (
              <>
                <Divider orientation="horizontal" flexItem />

                <Box>
                  <Box className="sub_path">
                    <Typography className="tit" variant="h5">
                      검토 등록
                    </Typography>
                  </Box>
                  <Box className="form_container">
                    <Stack direction="row" className="form_container-row">
                      <Box className="form_container-column">
                        <Box className="form_container-row-label">
                          <Typography variant="h6">검토 결과</Typography>
                        </Box>
                        <Box className="form_container-row-content">
                          <RadioGroup row value={utlzAgreSeCd} onChange={(e) => setUtlzAgreSeCd(e.target.value)}>
                            <FormControlLabel value={AnalysisResultStatus.COMPLETED} control={<Radio />} label="검토완료" />
                            <FormControlLabel value={AnalysisResultStatus.REQUEST_MODIFY} control={<Radio />} label="보완요청" />
                          </RadioGroup>
                        </Box>
                      </Box>
                    </Stack>
                    <Stack direction="row" className="form_container-row">
                      <Box className="form_container-column">
                        <Box className="form_container-row-label">
                          <Typography variant="h6">검토 내용</Typography>
                        </Box>
                        <Box className="form_container-row-content">
                          <TextField
                            error={opnnIntgDmndCnError.length > 0}
                            helperText={opnnIntgDmndCnError}
                            fullWidth
                            placeholder={MSG.COMMENT_CONTENT_REQUIRED}
                            value={opnnIntgDmndCn}
                            onChange={(e) => {
                              setOpnnIntgDmndCn(e.target.value);
                              setOpnnIntgDmndCnError("");
                            }}
                            variant="outlined"
                            multiline
                            rows={5}
                          />
                        </Box>
                      </Box>
                    </Stack>
                  </Box>

                  <SpaceBox gap={CONTENT_GAP.SMALL} />

                  {/* 버튼 */}
                  <div className="btn_container btn_right">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmitApprovalReview}
                      disabled={createOpinionMutation.isPending || isCrudDisabled}
                    >
                      등록
                    </Button>
                  </div>
                </Box>
              </>
            )}
            {/* CDM 관리자 검토 상세 */}
            {canShowReviewResult && (
              <>
                <Divider orientation="horizontal" flexItem />

                <Box>
                  <Box className="sub_path">
                    <Typography className="tit" variant="h5">
                      검토 결과
                    </Typography>
                  </Box>
                  <Box className="form_container">
                    <Stack direction="row" className="form_container-row">
                      <Box className="form_container-column">
                        <Box className="form_container-row-label">
                          <Typography variant="h6">등록일시</Typography>
                        </Box>
                        <Box className="form_container-row-content">
                          <Typography variant="default">{formatDateTime(latestOpinion!.regDt)}</Typography>
                        </Box>
                      </Box>
                      <Box className="form_container-column">
                        <Box className="form_container-row-label">
                          <Typography variant="h6">등록자</Typography>
                        </Box>
                        <Box className="form_container-row-content">
                          <Typography variant="default">{latestOpinion!.mbrEncptFlnm || "-"}</Typography>
                        </Box>
                      </Box>
                    </Stack>
                    <Stack direction="row" className="form_container-row">
                      <Box className="form_container-column">
                        <Box className="form_container-row-label">
                          <Typography variant="h6">검토 결과</Typography>
                        </Box>
                        <Box className="form_container-row-content">
                          <Chip
                            size="small"
                            label={getResearchAnalysisStatusConfig(researchOpinionDisplayStatusCode(latestOpinion!))?.label}
                            sx={
                              getResearchAnalysisStatusConfig(researchOpinionDisplayStatusCode(latestOpinion!))?.chipStyle ?? {}
                            }
                          />
                        </Box>
                      </Box>
                    </Stack>
                    <Stack direction="row" className="form_container-row">
                      <Box className="form_container-column">
                        <Box className="form_container-row-label">
                          <Typography variant="h6">검토 내용</Typography>
                        </Box>
                        <Box className="form_container-row-content">
                          <TextWithLineLimit text={latestOpinion!.opnnIntgDmndCn} maxLines={5} />
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              </>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
