import { useEffect, useState } from "react";
import { Box, Button, Chip, Divider, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { isPreviewableFile } from "@/constants/researchFileUpload";
import { MSG } from "@/constants/string";
import { ANALYSIS_RESULT_STATUS as AnalysisResultStatus, CONTENT_GAP, RSLT_GROUP_STCD_TYPE as RsltGroupStcdType } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import type { AnalysisDataDetailResponse } from "@/interfaces/researchInterface";
import { downloadFileViaProxy, getFilePreviewUrl } from "@/api/commonApi";
import type { RootState } from "@/store";
import { formatFileSize, formatResearchOpinionConsentLabel, getResearchAnalysisStatusConfig } from "@/utils/common";
import { formatDateTime } from "@/utils/dateUtils";
import { useCreateOpinion, useUpdateOpinion } from "@/hooks/research/useResearchMutations";
import { useAnalysisDataDetail, useResearchDetail } from "@/hooks/research/useResearchQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import type { FileData } from "@/components/FileContainer";
import FileContainer from "@/components/FileContainer";
import { SpaceBox } from "@/components/SpaceBox";
import TextWithLineLimit from "@/components/TextWithLineLimit";

export default function MetaDataManagementDetail({
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
  const { data: analysisDataDetail, refetch } = useAnalysisDataDetail(
    research?.asmtSn ?? null,
    asmtMetaRsltSn,
    RsltGroupStcdType.ANALYSIS_META
  );
  const fileList: FileData[] = (analysisDataDetail?.fileList ?? []).map((f) => ({
    name: f.fileNm,
    ext: f.fileExtNm ?? (f.fileNm?.split(".").pop() || ""),
    size: formatFileSize(f.fileSz ?? 0),
    atchFileId: f.atchFileId,
    atchFileGroupId: f.atchFileGroupId,
  }));
  // 데이터 수정 & 등록
  const createOpinionMutation = useCreateOpinion();
  const updateOpinionMutation = useUpdateOpinion();
  // 컴포넌트 hook
  const pdfPreviewModal = useModal(ModalNames.PDF_PREVIEW);
  const { showAlert } = useGlobalAlert();
  // 스토어
  const session = useSelector((state: RootState) => state.session);
  // 상태 변수
  const [opnnIntgDmndCn, setOpnnIntgDmndCn] = useState<string>("");
  // 검토 결과: tb_cm_e_opnn.utlz_agre_se_cd (06/07/08...)
  const [reviewUtlzAgreSeCd, setReviewUtlzAgreSeCd] = useState<string>(AnalysisResultStatus.INPROGRESS_REVIEW_DEPT2);
  // 활용 동의: tb_cm_e_opnn.asmt_opnn_stts_cd (01=동의, 02=미동의)
  const [consentAsmtOpnnSttsCd, setConsentAsmtOpnnSttsCd] = useState<string>("01");
  const [opnnIntgDmndCnError, setOpnnIntgDmndCnError] = useState<string>("");
  const [oldAnalysisDataDetail, setOldAnalysisDataDetail] = useState<AnalysisDataDetailResponse | null>(null);
  const latestOpinion = oldAnalysisDataDetail?.opinionList?.[0] ?? null;

  useEffect(() => {
    if (!analysisDataDetail) return;

    setOldAnalysisDataDetail(analysisDataDetail);

    // 기본 초기값 설정
    if (analysisDataDetail.asmtMetaRsltSttsCd === AnalysisResultStatus.INPROGRESS_REVIEW) {
      setOpnnIntgDmndCn("");
      setReviewUtlzAgreSeCd(AnalysisResultStatus.COMPLETED);
      setConsentAsmtOpnnSttsCd("01");
    }

    onConfirm();
  }, [analysisDataDetail]);

  /* ------------------------------
   * 검토 등록 섹션 활성화 시 입력값 초기화
   * ------------------------------ */
  const isReviewSectionActive = latestOpinion === null || latestOpinion.utlzAgreSeCd === AnalysisResultStatus.NOT_REGISTERED;

  useEffect(() => {
    if (isReviewSectionActive) {
      setReviewUtlzAgreSeCd(AnalysisResultStatus.COMPLETED);
      setConsentAsmtOpnnSttsCd("01");
      setOpnnIntgDmndCn("");
      setOpnnIntgDmndCnError("");
    }
  }, [isReviewSectionActive]);

  /* ------------------------------
   * 승인 검토 제출 핸들러
   * 분석 데이터의 검토 결과를 승인/거부로 등록하는 함수
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

    if (latestOpinion === null) {
      createOpinionMutation.mutateAsync(
        {
          asmtSn: research.asmtSn,
          asmtMetaRsltSn: asmtMetaRsltSn,
          rsltGroupStcd: RsltGroupStcdType.ANALYSIS_META,
          data: {
            opnnIntgDmndCn: opnnIntgDmndCn,
            utlzAgreSeCd: reviewUtlzAgreSeCd,
            asmtOpnnSttsCd: consentAsmtOpnnSttsCd,
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
          rsltGroupStcd: RsltGroupStcdType.ANALYSIS_META,
          data: {
            opnnIntgDmndCn: opnnIntgDmndCn,
            utlzAgreSeCd: reviewUtlzAgreSeCd,
            asmtOpnnSttsCd: consentAsmtOpnnSttsCd,
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

  // const registeredOpinionCount = useMemo(() => {
  //   return opinionList.filter((item) => item.utlzAgreSeCd !== AnalysisResultStatus.NOT_REGISTERED).length;
  // }, [opinionList]);

  const canEdit =
    research?.instId === session.instId && analysisDataDetail?.asmtMetaRsltSttsCd === AnalysisResultStatus.SUBMITTED;

  return (
    <Box className="relative w-full pb-14">
      <Box>
        <Box className="sub_path"></Box>
        <Typography variant="mainTitle">분석 데이터 상세</Typography>

        <SpaceBox gap={CONTENT_GAP.LARGE} />

        {oldAnalysisDataDetail && (
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
                      <Typography variant="default">{formatDateTime(oldAnalysisDataDetail.regDt)}</Typography>
                    </Box>
                  </Box>
                  <Box className="form_container-column">
                    <Box className="form_container-row-label">
                      <Typography variant="h6">등록자</Typography>
                    </Box>
                    <Box className="form_container-row-content">
                      <Typography variant="default">{oldAnalysisDataDetail.mbrEncptFlnm}</Typography>
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
                      <TextWithLineLimit text={oldAnalysisDataDetail.asmtMetaRsltCn} maxLines={5} />
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
            {research?.instId !== session.instId &&
              (oldAnalysisDataDetail.asmtMetaRsltSttsCd === AnalysisResultStatus.REQUEST_REVIEW ||
                oldAnalysisDataDetail.asmtMetaRsltSttsCd === AnalysisResultStatus.INPROGRESS_REVIEW) &&
              (latestOpinion === null || latestOpinion.utlzAgreSeCd === AnalysisResultStatus.NOT_REGISTERED) && (
                <>
                  <Divider orientation="horizontal" flexItem sx={{ my: CONTENT_GAP.LARGE }} />
                  <Box>
                    <Box className="sub_path">
                      <Box className="">
                        <Typography className="tit" variant="h5">
                          검토 등록
                        </Typography>
                        <Typography variant="description" component="p">
                          분석결과 검토 및 연구결과 활용동의 요청에 대한 의견을 등록해주세요.
                        </Typography>
                      </Box>
                    </Box>
                    <Box className="form_container">
                      <Stack direction="row" className="form_container-row">
                        <Box className="form_container-column">
                          <Box className="form_container-row-label">
                            <Typography variant="h6">검토 결과</Typography>
                          </Box>
                          <Box className="form_container-row-content">
                            <RadioGroup row value={reviewUtlzAgreSeCd} onChange={(e) => setReviewUtlzAgreSeCd(e.target.value)}>
                              <FormControlLabel value={AnalysisResultStatus.COMPLETED} control={<Radio />} label="검토완료" />
                              <FormControlLabel
                                value={AnalysisResultStatus.REQUEST_MODIFY}
                                control={<Radio />}
                                label="보완요청"
                              />
                            </RadioGroup>
                          </Box>
                        </Box>
                      </Stack>
                      <Stack direction="row" className="form_container-row">
                        <Box className="form_container-column">
                          <Box className="form_container-row-label">
                            <Typography variant="h6">활용 동의</Typography>
                          </Box>
                          <Box className="form_container-row-content">
                            <RadioGroup
                              row
                              value={consentAsmtOpnnSttsCd}
                              onChange={(e) => setConsentAsmtOpnnSttsCd(e.target.value)}
                            >
                              <FormControlLabel value="01" control={<Radio />} label="동의" />
                              <FormControlLabel value="10" control={<Radio />} label="미동의" />
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
                        disabled={createOpinionMutation.isPending || updateOpinionMutation.isPending}
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
            {research?.instId !== session.instId &&
              oldAnalysisDataDetail !== null &&
              latestOpinion !== null &&
              latestOpinion.utlzAgreSeCd !== AnalysisResultStatus.NOT_REGISTERED && (
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
                            <Typography variant="h6">검토결과</Typography>
                          </Box>
                          <Box className="form_container-row-content">
                            <Chip
                              size="small"
                              label={getResearchAnalysisStatusConfig(latestOpinion!.utlzAgreSeCd)?.label}
                              sx={getResearchAnalysisStatusConfig(latestOpinion!.utlzAgreSeCd)?.chipStyle ?? {}}
                            />
                          </Box>
                        </Box>
                        <Box className="form_container-column">
                          <Box className="form_container-row-label">
                            <Typography variant="h6">활용동의</Typography>
                          </Box>
                          <Box className="form_container-row-content">
                            <Chip
                              size="small"
                              label={formatResearchOpinionConsentLabel(latestOpinion!.asmtOpnnSttsCd)}
                              sx={getResearchAnalysisStatusConfig(latestOpinion!.asmtOpnnSttsCd)?.chipStyle ?? {}}
                            />
                          </Box>
                        </Box>
                      </Stack>
                      {/* <Stack direction="row" className="form_container-row">
                        <Box className="form_container-column">
                          <Box className="form_container-row-label">
                            <Typography variant="h6">활용 동의</Typography>
                          </Box>
                          <Box className="form_container-row-content">
                            <Chip
                              size="small"
                              label={
                                latestOpinion?.asmtOpnnSttsCd === "01"
                                  ? "동의"
                                  : latestOpinion?.asmtOpnnSttsCd === "02"
                                    ? "미동의"
                                    : "-"
                              }
                            />
                          </Box>
                        </Box>
                      </Stack> */}
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
