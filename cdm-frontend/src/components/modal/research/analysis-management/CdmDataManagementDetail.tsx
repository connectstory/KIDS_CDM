import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Divider, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { isPreviewableFile } from "@/constants/researchFileUpload";
import { MSG } from "@/constants/string";
import { ANALYSIS_RESULT_STATUS as AnalysisResultStatus, CONTENT_GAP, RSLT_GROUP_STCD_TYPE as RsltGroupStcdType } from "@/constants/types";
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
import { useCreateOpinion, useUpdateOpinion } from "@/hooks/research/useResearchMutations";
import { useAnalysisDataDetail, useResearchDetail } from "@/hooks/research/useResearchQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import type { FileData } from "@/components/FileContainer";
import FileContainer from "@/components/FileContainer";
import { SpaceBox } from "@/components/SpaceBox";
import TextWithLineLimit from "@/components/TextWithLineLimit";

export default function CdmDataManagementDetail({
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
  const updateOpinionMutation = useUpdateOpinion();
  // 컴포넌트 hook
  const pdfPreviewModal = useModal(ModalNames.PDF_PREVIEW);
  const { showAlert } = useGlobalAlert();
  // 사용자 정보
  const session = useSelector((state: RootState) => state.session);
  // 연구과제 마감/취소 시 CRUD 비활성화
  const isCrudDisabled = isResearchCrudDisabled(research?.asmtPrgrsSttsCd);
  // 상태 변수
  const [opnnIntgDmndCn, setOpnnIntgDmndCn] = useState<string>("");
  // 검토 결과: tb_cm_e_opnn.utlz_agre_se_cd (06/07/08...)
  const [utlzAgreSeCd, setUtlzAgreSeCd] = useState<string>(AnalysisResultStatus.COMPLETED);
  // 검토 내용 오류 메시지
  const [opnnIntgDmndCnError, setOpnnIntgDmndCnError] = useState<string>("");

  // CDM 분석 데이터 상세 조회
  const { data: analysisDataDetail, refetch } = useAnalysisDataDetail(
    research?.asmtSn ?? null,
    asmtMetaRsltSn,
    RsltGroupStcdType.ANALYSIS_CDM
  );

  // 분석 데이터 상세 응답의 fileList 사용 (해당 asmtMetaRsltSn에 첨부된 파일)
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

  // 소유자 기관 여부
  const isOwnerInstitute = research?.instId === session.instId;

  // 검토자 기관 여부
  const isReviewerInstitute = research?.instId !== session.instId;

  // 수정 가능 여부
  const canEdit =
    isOwnerInstitute && analysisDataDetail?.asmtMetaRsltSttsCd === AnalysisResultStatus.SUBMITTED && !isCrudDisabled;

  // 검토 등록 가능 여부
  const latestOpinion = analysisDataDetail?.opinionList?.[0] ?? null;
  const canShowReviewRegister =
    isReviewerInstitute &&
    (analysisDataDetail?.asmtMetaRsltSttsCd === AnalysisResultStatus.REQUEST_REVIEW ||
      analysisDataDetail?.asmtMetaRsltSttsCd === AnalysisResultStatus.INPROGRESS_REVIEW) &&
    (latestOpinion === null || latestOpinion.utlzAgreSeCd === AnalysisResultStatus.NOT_REGISTERED);

  // 검토 결과 가능 여부
  const canShowReviewResult =
    isReviewerInstitute && latestOpinion !== null && latestOpinion.utlzAgreSeCd !== AnalysisResultStatus.NOT_REGISTERED;

  useEffect(() => {
    if (!research?.asmtSn) return;
    if (!analysisDataDetail) return;

    onConfirm();
  }, [analysisDataDetail]);

  /* ------------------------------
   * 검토 등록 섹션 활성화 시 입력값 초기화
   * ------------------------------ */
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

    const payloadUtlz = utlzAgreSeCd === AnalysisResultStatus.EXCLUDED ? AnalysisResultStatus.COMPLETED : utlzAgreSeCd;
    const payloadAsmt = utlzAgreSeCd === AnalysisResultStatus.EXCLUDED ? AnalysisResultStatus.EXCLUDED : "";

    if (latestOpinion === null) {
      createOpinionMutation.mutateAsync(
        {
          asmtSn: research.asmtSn,
          asmtMetaRsltSn: asmtMetaRsltSn,
          rsltGroupStcd: RsltGroupStcdType.ANALYSIS_CDM,
          data: {
            opnnIntgDmndCn: opnnIntgDmndCn,
            utlzAgreSeCd: payloadUtlz,
            asmtOpnnSttsCd: payloadAsmt,
          },
        },
        {
          onSuccess: () => {
            refetch();
            onConfirm();
          },
        }
      );
    } else {
      updateOpinionMutation.mutateAsync(
        {
          asmtSn: research.asmtSn,
          asmtMetaRsltSn: asmtMetaRsltSn,
          rsltGroupStcd: RsltGroupStcdType.ANALYSIS_CDM,
          data: {
            opnnIntgDmndCn: opnnIntgDmndCn,
            utlzAgreSeCd: payloadUtlz,
            asmtOpnnSttsCd: payloadAsmt,
          },
        },
        {
          onSuccess: () => {
            refetch();
            onConfirm();
          },
        }
      );
    }
  };

  return (
    <Box className="relative w-full pb-14">
      <Box>
        <Typography variant="mainTitle">분석 데이터 상세</Typography>

        <SpaceBox gap={CONTENT_GAP.LARGE} />

        {analysisDataDetail && (
          <>
            {/* ------------------------------
             * 분석 데이터 상세
             * ------------------------------ */}
            <Box>
              <Box className="sub_path">
                <Typography className="tit" variant="h5">
                  분석 데이터
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
                      <Typography variant="h6">분석 데이터 자료</Typography>
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

              <SpaceBox gap={CONTENT_GAP.SMALL} />

              {canEdit && (
                <Box className="btn_container btn_right">
                  <Button variant="outlined" color="primary" onClick={onEdit}>
                    수정
                  </Button>
                </Box>
              )}
            </Box>

            {/* ------------------------------
             * CDM 참여기관 검토 등록/수정
             * ------------------------------ */}
            {canShowReviewRegister && (
              <>
                <Divider orientation="horizontal" flexItem sx={{ my: CONTENT_GAP.LARGE }} />
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
                            <FormControlLabel value={AnalysisResultStatus.EXCLUDED} control={<Radio />} label="결과제외" />
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

                  {/* ------------------------------
                   * 버튼
                   * ------------------------------ */}
                  <Box className="btn_container btn_right">
                    <Button
                      variant="contained"
                      onClick={handleSubmitApprovalReview}
                      disabled={updateOpinionMutation.isPending || isCrudDisabled}
                    >
                      등록
                    </Button>
                  </Box>
                </Box>
              </>
            )}
            {/* ------------------------------
             * CDM 참여기관 검토 상세
             * ------------------------------ */}
            {canShowReviewResult && (
              <>
                <Divider orientation="horizontal" flexItem sx={{ my: CONTENT_GAP.LARGE }} />
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
      </Box>
    </Box>
  );
}
