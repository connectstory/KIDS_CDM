import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { DATASET_EXTS } from "@/constants/researchFileUpload";
import { MSG } from "@/constants/string";
import { TOOLTIP_IDS } from "@/constants/tooltip";
import {
  ANALYSIS_RESULT_STATUS as AnalysisResultStatus,
  CONTENT_GAP,
  ROLE_TYPE as RoleType,
  RSLT_GROUP_STCD_TYPE as RsltGroupStcdType,
} from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import { downloadFileViaProxy } from "@/api/commonApi";
import type { RootState } from "@/store";
import { setTooltipVisible } from "@/store/tooltipSlice";
import { formatFileSize, getResearchAnalysisStatusConfig } from "@/utils/common";
import { formatDateTime } from "@/utils/dateUtils";
import { useCreateOpinion, useSendReviewRequest } from "@/hooks/research/useResearchMutations";
import { useAnalysisDataDetail, useResearchDetail } from "@/hooks/research/useResearchQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import type { FileData } from "@/components/FileContainer";
import FileContainer from "@/components/FileContainer";
import { SpaceBox } from "@/components/SpaceBox";
import TextWithLineLimit from "@/components/TextWithLineLimit";

const REVIEW_REQUEST_BLOCKED: Set<string> = new Set([
  AnalysisResultStatus.COMPLETED,
  AnalysisResultStatus.REQUEST_MODIFY,
  AnalysisResultStatus.INPROGRESS_REVIEW_DEPT1,
  AnalysisResultStatus.INPROGRESS_REVIEW_DEPT2,
]);
const REVIEW_REGISTER_HIDDEN: Set<string> = new Set([
  AnalysisResultStatus.NOT_REGISTERED,
  AnalysisResultStatus.COMPLETED,
  AnalysisResultStatus.EXCLUDED,
  AnalysisResultStatus.REQUEST_MODIFY,
]);
const REVIEW_REGISTER_TITLE_MAP: Record<string, string> = {
  [AnalysisResultStatus.INPROGRESS_REVIEW_DEPT1]: "약물역학 팀 검토 등록",
  [AnalysisResultStatus.INPROGRESS_REVIEW_DEPT2]: "정보화 팀 검토 등록",
};

export default function AnalysisDataDetail({
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
  const { data: research, isLoading: isResearchLoading } = useResearchDetail(asmtSnNumber);
  // 데이터 수정 & 등록
  const createOpinionMutation = useCreateOpinion();
  const sendReviewRequestMutation = useSendReviewRequest();
  // 컴포넌트 hook
  const confirmModal = useModal(ModalNames.CONFIRM);
  const { showAlert } = useGlobalAlert();

  // 스토어
  const dispatch = useDispatch();
  const session = useSelector((state: RootState) => state.session);
  const isDept1Reviewer = session.deptNo === "0000080";
  const isDept2Reviewer = session.deptNo === "0000004";
  // 상태 변수
  const [opnnIntgDmndCn, setOpnnIntgDmndCn] = useState<string>("");
  const [utlzAgreSeCd, setUtlzAgreSeCd] = useState<string>(AnalysisResultStatus.COMPLETED);
  const [opnnIntgDmndCnError, setOpnnIntgDmndCnError] = useState<string>("");

  // 분석 DATASET 상세 조회
  const {
    data: analysisDataDetail,
    refetch,
    isLoading: isDetailLoading,
  } = useAnalysisDataDetail(research?.asmtSn ?? null, asmtMetaRsltSn, RsltGroupStcdType.ANALYSIS_DATA);

  const isInitialLoading = isResearchLoading || isDetailLoading;
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

  const extUpper = (f: FileData) => (f.ext ?? "").toUpperCase();
  // CaFileItem 응답에는 DATASET/VDI 구분 코드가 없어서, 확장자로 분류해 UI를 분리합니다.
  // 분석 DATASET 화면에서는 "XLS/XLSX는 DATASET, 그 외는 VDI"로 취급해 누락을 방지합니다.
  const datasetFiles = useMemo(() => fileList.filter((f) => DATASET_EXTS.has(extUpper(f))), [fileList]);
  const vdiFiles = useMemo(() => fileList.filter((f) => !DATASET_EXTS.has(extUpper(f))), [fileList]);
  const hasDetail = analysisDataDetail != null;
  const status = analysisDataDetail?.asmtMetaRsltSttsCd;
  const isOwnerInstitute = research?.instId === session.instId;
  const isAdmin = session.userType === RoleType.ADMIN;
  const canSendReviewRequest =
    isOwnerInstitute &&
    hasDetail &&
    analysisDataDetail.rsltNotiDt == null &&
    status != null &&
    !REVIEW_REQUEST_BLOCKED.has(status);
  // "결과제출" 상태에서만 수정 버튼을 렌더링합니다.
  const isResultSubmitted = status === AnalysisResultStatus.SUBMITTED;
  const canShowEditButton = isOwnerInstitute && isResultSubmitted;
  const isDept1ReviewTarget = status === AnalysisResultStatus.INPROGRESS_REVIEW_DEPT1 && isDept1Reviewer;
  const isDept2ReviewTarget = status === AnalysisResultStatus.INPROGRESS_REVIEW_DEPT2 && isDept2Reviewer;
  const canShowReviewRegister =
    isAdmin && hasDetail && status != null && !REVIEW_REGISTER_HIDDEN.has(status) && (isDept1ReviewTarget || isDept2ReviewTarget);
  const canShowOpinionList = Array.isArray(analysisDataDetail?.opinionList) && analysisDataDetail.opinionList.length > 0;
  const canShowAccountInfo = status === AnalysisResultStatus.COMPLETED;
  const reviewRegisterTitle = (status != null && REVIEW_REGISTER_TITLE_MAP[status]) || "검토 등록";

  useEffect(() => {
    if (!analysisDataDetail) return;

    onConfirm();
  }, [analysisDataDetail]);

  // 검토 요청 보내기 버튼이 보이고 활성화된 경우에만 툴팁 표시
  const requestReviewVisible = isOwnerInstitute && canSendReviewRequest;

  useEffect(() => {
    dispatch(setTooltipVisible({ id: TOOLTIP_IDS.ANALYSIS_DATASET_REQUEST_REVIEW, visible: requestReviewVisible }));
  }, [dispatch, requestReviewVisible]);

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
        rsltGroupStcd: RsltGroupStcdType.ANALYSIS_DATA,
        data: {
          opnnIntgDmndCn: opnnIntgDmndCn,
          utlzAgreSeCd: utlzAgreSeCd,
          asmtOpnnSttsCd: "",
        },
      },
      {
        onSuccess: () => {
          if (isDept1Reviewer) {
            showAlert({ message: "정보화 팀에게 검토 요청을 전송했습니다.", severity: "success" });
          }

          refetch();
          onConfirm();
        },
      }
    );
  };

  const handleSendReviewRequest = async () => {
    if (sendReviewRequestMutation.isPending) {
      return;
    }

    const result = await confirmModal.open({
      title: "확인",
      message: "관리자에게 검토 요청을 전송합니다.",
    });

    if (result && asmtSnNumber && asmtMetaRsltSn) {
      sendReviewRequestMutation.mutate(
        {
          asmtSn: asmtSnNumber,
          asmtMetaRsltSn: asmtMetaRsltSn,
          // 상태 전환 후 필요한 쿼리 무효화를 위해 group을 전달합니다.
          rsltGroupCd: RsltGroupStcdType.ANALYSIS_DATA,
        },
        {
          onSuccess: () => {
            showAlert({
              message: "관리자에게 검토 요청을 전송했습니다.",
              severity: "success",
            });
            refetch();
          },
        }
      );
    }
  };

  if (isInitialLoading) {
    return (
      <Box className="flex relative items-center justify-center  w-full h-[400px]">
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box className="relative w-full">
      <Stack direction="column" spacing={CONTENT_GAP.LARGE} className="w-full pb-14">
        <Box className="flex justify-between items-center h-[35px]">
          <Box className="min-w-[300px]">
            <Typography variant="mainTitle">분석 DATASET 상세</Typography>
          </Box>
          {isOwnerInstitute && (
            <Box className="btn_container btn_right">
              <Button variant="containedLight" color="primary" disabled={!canSendReviewRequest} onClick={handleSendReviewRequest}>
                검토 요청 보내기
              </Button>
            </Box>
          )}
        </Box>
        {analysisDataDetail && (
          <>
            {/* 분석 DATASET 상세 */}
            <Box>
              <Box className="sub_path">
                <Typography className="tit" variant="h5">
                  분석 DATASET
                </Typography>
              </Box>
              <SpaceBox gap={CONTENT_GAP.MEDIUM} />
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
                      <Typography variant="h6">분석 DATASET 자료</Typography>
                    </Box>
                    <Box className="form_container-row-content">
                      <div className="w100">
                        {datasetFiles.length === 0 ? (
                          <Typography variant="default" color="text.secondary">
                            분석 DATASET 파일이 없습니다.
                          </Typography>
                        ) : (
                          <FileContainer
                            files={datasetFiles}
                            showDeleteButton={false}
                            onClick={(file) => {
                              if (!file.atchFileId) return;
                              downloadFileViaProxy(file.atchFileId, file.name);
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
                      <Typography variant="h6">VDI 신청서</Typography>
                    </Box>
                    <Box className="form_container-row-content">
                      <div className="w100">
                        {vdiFiles.length === 0 ? (
                          <Typography variant="default" color="text.secondary">
                            VDI 신청서 파일이 없습니다.
                          </Typography>
                        ) : (
                          <FileContainer
                            files={vdiFiles}
                            showDeleteButton={false}
                            onClick={(file) => {
                              if (!file.atchFileId) return;
                              downloadFileViaProxy(file.atchFileId, file.name);
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
                      <TextWithLineLimit text={analysisDataDetail.asmtMetaRsltCn} maxLines={5} />
                    </Box>
                  </Box>
                </Stack>
              </Box>

              {canShowEditButton && (
                <>
                  <SpaceBox gap={CONTENT_GAP.SMALL} />

                  <Box className="btn_container btn_right">
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // 상태가 바뀌는 레이스 컨디션을 방지: UI 조건과 동일한 체크로 안전하게 처리합니다.
                        if (!isResultSubmitted) return;
                        onEdit?.();
                      }}
                    >
                      수정
                    </Button>
                  </Box>
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
                      {reviewRegisterTitle}
                    </Typography>{" "}
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
                      disabled={createOpinionMutation.isPending}
                    >
                      등록
                    </Button>
                  </div>
                </Box>
              </>
            )}
            {/* CDM 관리자 검토 상세 */}

            {/* 검토 결과 */}
            {canShowOpinionList && (
              <>
                <Divider orientation="horizontal" flexItem />
                {analysisDataDetail.opinionList.map((opinion, index) => (
                  <Box key={opinion.opnnIntgRsltSn}>
                    <Box className="sub_path">
                      <Typography className="tit" variant="h5">
                        {index === 0 ? "약물역학 팀 검토 결과" : "정보화 팀 검토 결과"}
                      </Typography>
                    </Box>
                    <Box className="form_container">
                      <Stack direction="row" className="form_container-row">
                        <Box className="form_container-column">
                          <Box className="form_container-row-label">
                            <Typography variant="h6">등록일시</Typography>
                          </Box>
                          <Box className="form_container-row-content">
                            <Typography variant="default">{formatDateTime(opinion.regDt)}</Typography>
                          </Box>
                        </Box>
                        <Box className="form_container-column">
                          <Box className="form_container-row-label">
                            <Typography variant="h6">등록자</Typography>
                          </Box>
                          <Box className="form_container-row-content">
                            <Typography variant="default">{opinion.empNm || "-"}</Typography>
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
                              label={getResearchAnalysisStatusConfig(opinion.utlzAgreSeCd)?.label}
                              sx={getResearchAnalysisStatusConfig(opinion.utlzAgreSeCd)?.chipStyle ?? {}}
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
                            <TextWithLineLimit text={opinion.opnnIntgDmndCn} maxLines={5} />
                          </Box>
                        </Box>
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </>
            )}

            {/* VDI 및 DB 계정 */}
            {canShowAccountInfo && (
              <>
                <Divider orientation="horizontal" flexItem />
                <Box>
                  <Box className="sub_path">
                    <Typography className="tit" variant="h5">
                      VDI 및 DB 계정
                    </Typography>
                  </Box>
                  <Box className="form_container">
                    <Stack direction="row" className="form_container-row">
                      <Box className="form_container-column">
                        <Box className="form_container-row-label">
                          <Typography variant="h6">VDI</Typography>
                        </Box>
                        <Box className="form_container-row-content">
                          <Typography variant="default">{analysisDataDetail.asmtUserFlnm01 ?? "-"}</Typography>
                        </Box>
                      </Box>
                      <Box className="form_container-column">
                        <Box className="form_container-row-label">
                          <Typography variant="h6">DB</Typography>
                        </Box>
                        <Box className="form_container-row-content">
                          <Typography variant="default">{analysisDataDetail.asmtUserFlnm02 ?? "-"}</Typography>
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
