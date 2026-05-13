import { useEffect, useRef, useState } from "react";
import { Box, Fade, Stack, Tab, Tabs, Typography } from "@mui/material";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { MSG, STRINGS } from "@/constants/string";
import {
  ANALYSIS_RESULT_STATUS as AnalysisResultStatus,
  CONTENT_GAP,
  CDM_UPLOAD_TYPE as CdmUploadType,
  DEPT_CODE_TYPE as DeptCodeType,
  PARTICIPATION_CDM_STATUS as ParticipationCdmStatus,
  PROGRESS_STATUS as ProgressStatusType,
  ROLE_TYPE as RoleType,
  RSLT_GROUP_STCD_TYPE as RsltGroupStcdType,
} from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import type { PartnerResponse } from "@/interfaces/researchInterface";
import type { RootState } from "@/store";
import { resetTooltips } from "@/store/tooltipSlice";
import { buildPath, convertResearchAnalysisStatus, convertResearchStatus, isResearchCrudDisabled } from "@/utils/common";
import { useApproveInvitePartner, useCreatePartners, useSubmitAnalysisDatasetCopy } from "@/hooks/research/useResearchMutations";
import { useLatestAnalysisDataDetail, useResearchDetail, useResearchPartners } from "@/hooks/research/useResearchQueries";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import Loader from "@/components/Loader";
import { SpaceBox } from "@/components/SpaceBox";
import { AppButton } from "@/components/ui";
import styles from "./ResearchDetail.module.scss";
import ContentCdm from "./components/ContentAnalysisCdm";
import ContentMember from "./components/ContentAnalysisMember";
import ContentMeta from "./components/ContentAnalysisMeta";
import ContentComment from "./components/ContentComment";
import ContentDesc from "./components/ContentDesc";
import ContentMemberAnalysisCdm from "./components/ContentMemberAnalysisCdm";
import ContentMemberAnalysisOrg from "./components/ContentMemberAnalysisOrg";
import ContentMembers from "./components/ContentMembers";

export default function ResearchDetailView() {
  type AddPartnersModalResult = {
    status: boolean;
    data: PartnerResponse[];
  };

  // 라우팅 파라미터
  const { role, asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;
  // 스토어
  const dispatch = useDispatch();
  const session = useSelector((state: RootState) => state.session);
  const appTarget = import.meta.env.VITE_APP_TARGET as "admin" | "partner" | undefined;
  // 상태 변수
  const hasScrolledOnLoadRef = useRef(false);
  /** 해당 asmtSn에 대해 참여 안내 알림을 이미 표시했는지 (한 번만 표시) */
  const shownParticipatingAlertForRef = useRef<number | null>(null);
  /** 해당 asmtSn에 대해 참여기관 CDM 안내 알림을 이미 표시했는지 (한 번만 표시) */
  const shownCdmGuideAlertForRef = useRef<number | null>(null);
  /** 상세 조회 실패 시 alert/navigate를 렌더 밖에서 한 번만 처리 */
  const loadErrorHandledRef = useRef(false);
  const [analysisTabIndex, setAnalysisTabIndex] = useState(0);
  const [isAllCompleted, setIsAllCompleted] = useState<boolean>(false);
  // 데이터 조회
  const { data: research, isLoading, isError, error, refetch: refetchResearch } = useResearchDetail(asmtSnNumber);
  const { data: researchPartners = [], refetch: refetchPartners } = useResearchPartners(
    asmtSnNumber,
    session.userType === RoleType.ADMIN
  );
  const { data: latestAnalysisData, refetch: refetchLatestAnalysis } = useLatestAnalysisDataDetail(
    asmtSnNumber,
    RsltGroupStcdType.ANALYSIS_META,
    isAllCompleted
  );
  // 데이터 수정 & 등록
  const approveInviteMutation = useApproveInvitePartner();
  const createPartnersMutation = useCreatePartners();
  // 컴포넌트 hook
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const confirmModal = useModal(ModalNames.CONFIRM);
  const irbUploadModal = useModal(ModalNames.IrbUpload);
  const AddPartnersModal = useModal(ModalNames.AddPartners);
  const analysisManagementModal = useModal(ModalNames.AnalysisDataManagement);
  const cancelInviteModal = useModal(ModalNames.CancelInvite);
  const closeResearchModal = useModal(ModalNames.CloseResearch);
  const submitAnalysisDatasetCopyMutation = useSubmitAnalysisDatasetCopy();
  const isCrudDisabled = isResearchCrudDisabled(research?.asmtPrgrsSttsCd);

  /* 화면 마운트 시 툴팁 상태 초기화 */
  useEffect(() => {
    dispatch(resetTooltips());
  }, [dispatch]);

  /* 화면 마운트·asmtSn 변경 시 연구과제/참여기관/최신분석 조회 갱신 */
  useEffect(() => {
    if (asmtSnNumber == null) return;
    refetchResearch();
    refetchPartners();
    refetchLatestAnalysis();
  }, [asmtSnNumber, refetchResearch, refetchPartners, refetchLatestAnalysis]);

  /* asmtSn 변경 시 스크롤 플래그 초기화 */
  useEffect(() => {
    hasScrolledOnLoadRef.current = false;
  }, [asmtSn]);

  useEffect(() => {
    loadErrorHandledRef.current = false;
  }, [asmtSnNumber]);

  /* 로딩 종료 후 조회 실패: 렌더가 아닌 effect에서 알림 + 뒤로가기 */
  useEffect(() => {
    if (isLoading || asmtSnNumber == null) return;
    if (!isError && research) return;
    if (loadErrorHandledRef.current) return;
    loadErrorHandledRef.current = true;
    showAlert({
      message: error?.message || "존재하지 않는 연구과제입니다.",
      severity: "error",
    });
    navigate(-1);
  }, [isLoading, isError, research, error, asmtSnNumber, showAlert, navigate]);

  /* 연구 상태가 취소(05)인 경우 툴팁 전부 비활성화 */
  useEffect(() => {
    if (isCrudDisabled) {
      dispatch(resetTooltips());
    }
  }, [dispatch, isCrudDisabled]);

  /* ------------------------------
   * 마운트/라우트 변경 시 스크롤 상단 (실제 스크롤 컨테이너는 .content_wrap)
   * ------------------------------ */
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>(".content_wrap")?.scrollTo(0, 0);
  }, [asmtSn]);

  /* 로딩 완료 후 한 번만 스크롤 상단 (컨텐츠가 그려진 뒤 확실히 적용) */
  useEffect(() => {
    if (!isLoading && research) {
      if (!hasScrolledOnLoadRef.current) {
        hasScrolledOnLoadRef.current = true;
        window.scrollTo(0, 0);
        document.querySelector<HTMLElement>(".content_wrap")?.scrollTo(0, 0);
      }

      if (
        asmtSnNumber != null &&
        research.asmtPrgrsSttsCd === ProgressStatusType.REQUEST_INVITE &&
        research.asmtPrcp &&
        research.asmtPrcp.ptcpPrgrsSttsCd === ParticipationCdmStatus.PARTICIPATING &&
        shownParticipatingAlertForRef.current !== asmtSnNumber
      ) {
        shownParticipatingAlertForRef.current = asmtSnNumber;
        // showAlert({
        //   message: "연구과제에 참여중입니다.\n연구과제의 상태가 진행중으로 변경되면 이메일로 알려드립니다.",
        //   severity: "description",
        //   anchorOrigin: { vertical: "bottom", horizontal: "center" },
        //   duration: null,
        // });
      }

      if (
        asmtSnNumber != null &&
        research?.instId !== session.instId &&
        research?.asmtPrcp?.uldTypeCd === CdmUploadType.CDM &&
        shownCdmGuideAlertForRef.current !== asmtSnNumber
      ) {
        shownCdmGuideAlertForRef.current = asmtSnNumber;
        // showAlert({
        //   message: "통합 데이터 분석결과가 등록되면 검토 후 검토결과를 등록해주세요.",
        //   severity: "description",
        //   anchorOrigin: { vertical: "bottom", horizontal: "center" },
        //   duration: null,
        // });
      }
    }
  }, [isLoading, research, asmtSnNumber, session.instId, showAlert]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // 레이아웃에서 실제 스크롤 컨테이너가 window가 아닐 수 있어 함께 처리
    document.querySelector<HTMLElement>(".content_wrap")?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ------------------------------
   * 예외 처리
   * ------------------------------ */
  if (isNaN(asmtSnNumber || 0)) {
    alert(MSG.INVALID_ACCESS);
    navigate(routes.RESEARCH.OWNER);
    return null;
  }

  if (isLoading) {
    return (
      <Box sx={{ position: "relative", minHeight: "400px" }}>
        <Loader isLoading={true} />
      </Box>
    );
  }

  if (isError || !research) {
    return null;
  }

  /* ------------------------------
   * 연구과제 상태 변경 버튼 제목 반환
   * ------------------------------ */
  const changeResearchStatusButtonTitle = () => {
    switch (convertResearchStatus(research.asmtPrgrsSttsCd)) {
      case ProgressStatusType.REQUEST_INVITE:
        return STRINGS.RUN;
      case ProgressStatusType.IN_PROGRESS_ANALYSIS:
        return STRINGS.COMPLETED;
      case ProgressStatusType.IN_PROGRESS_META:
        return STRINGS.COMPLETED;
      default:
        console.error(MSG.STATUS_NOT_FOUND);
        return "";
    }
  };

  /* ------------------------------
   * 연구과제 상태 변경 핸들러
   * ------------------------------ */
  const handleChangeResearchStatus = async () => {
    if (!research) return;

    // 과제 상태가 참여요청인 경우
    if (research.asmtPrgrsSttsCd === ProgressStatusType.REQUEST_INVITE) {
      // 분석 데이터 승인 상태가 없거나, 검토완료가 아닌 경우
      if (
        research.asmtMetaRsltSttsCd === null ||
        research.asmtMetaRsltSttsCd === "" ||
        convertResearchAnalysisStatus(research.asmtMetaRsltSttsCd) !== ProgressStatusType.APPROVAL_REVIEW
      ) {
        await confirmModal.open({
          title: "확인",
          message: ["분석 데이터 승인 상태가 [검토완료]가 아닙니다.", "분석 데이터 등록 후 승인을 받아야합니다."],
          data: {
            hiddenCancelButton: true,
          },
        });

        await analysisManagementModal.open({
          title: "분석 DATASET 관리",
          showHeaderCloseButton: true,
        });

        return;
      }

      // 참여기관 전체 상태 03(참여승인)인 경우
      if (researchPartners.every((partner) => partner.ptcpPrgrsSttsCd === ParticipationCdmStatus.INVITATION_REQUEST)) {
        // showAlert({
        //   message: "참여기관 전체 상태가 참여승인이 아닙니다.",
        //   severity: "warning",
        // });
        await confirmModal.open({
          title: "확인",
          message: ["참여요청 중인 참여기관이 있습니다.", "참여요청에 대한 응답을 기다리고 있습니다."],
          data: {
            hiddenCancelButton: true,
          },
        });
        return;
      }

      const result = await confirmModal.open({
        title: "확인",
        message: "과제를 진행하시겠습니까?",
        data: {},
      });

      if (result) {
        // CDM 데이터 생성(복사) 요청 전송. 복사 완료 시 서버에서 과제 진행 상태로 변경
        await submitAnalysisDatasetCopyMutation.mutateAsync({ asmtSn: research.asmtSn });
        refetchResearch();
        scrollToTop();
      }
    } else {
      setIsAllCompleted(true);

      if (latestAnalysisData?.asmtMetaRsltSttsCd !== AnalysisResultStatus.COMPLETED) {
        // showAlert({
        //   message: "연구결과(메타분석)이 검토완료 상태이어야 합니다.",
        //   severity: "warning",
        // });
        await confirmModal.open({
          title: "알림",
          message: "연구결과(메타분석)이 검토완료 상태이어야 합니다.",
          width: "xs",
          fullWidth: true,
          data: {
            hiddenCancelButton: true,
          },
        });
        return;
      }

      // 과제 마감 처리
      const result = await closeResearchModal.open({
        title: "연구과제 마감",
        data: {},
      });

      if (result) {
        // 성공 시 화면 상단으로 이동
        scrollToTop();
      }
    }
  };

  /* ------------------------------
   * 연구과제 취소 핸들러
   * ------------------------------ */
  const handleCancelResearch = async () => {
    if (!research) return;

    // 과제 마감 처리
    const result = await closeResearchModal.open({
      title: "연구과제 취소",
      data: {
        closeType: "cancel",
      },
    });

    if (result) {
      if (role === "owner") {
        navigate(routes.RESEARCH.OWNER);
      } else {
        navigate(routes.RESEARCH.PARTNER);
      }
    }
  };

  /* ------------------------------
   * 연구과제 참여 승인 핸들러
   * ------------------------------ */
  const handleJoinResearch = async () => {
    if (!research) return;

    // 참여기관 정보 확인
    if (!research.asmtPrcp?.asmtPtcpInstSn) {
      showAlert({
        message: "참여기관 정보를 찾을 수 없습니다.",
        severity: "error",
      });
      return;
    }

    // 이미 제출 중인 경우 중복 제출 방지
    if (approveInviteMutation.isPending) {
      return;
    }

    const result = await confirmModal.open({
      title: "확인",
      message: "참여하시겠습니까?",
      data: {},
    });

    if (result) {
      try {
        await approveInviteMutation.mutateAsync({
          asmtSn: research.asmtSn,
          asmtPtcpInstSn: research.asmtPrcp.asmtPtcpInstSn,
        });
        // 성공 시 상세 페이지 새로고침 (onSuccess에서 자동 처리됨)
      } catch (error) {
        // 에러는 mutation의 onError에서 자동 처리됨
        console.error("참여승인 처리 중 오류 발생:", error);
      }
    }
  };

  /* ------------------------------
   * 컨텐츠 섹션 표시 여부 결정
   * ------------------------------ */
  const showContentSection = (section: string): boolean => {
    if (research.asmtPrgrsSttsCd === ProgressStatusType.REQUEST_INVITE) {
      if (section === "partners") {
        return true;
      } else {
        return false;
      }
    } else {
      if (section === "meta") {
        return true;
      }

      if (section === "analysis") {
        if (research?.instId === session.instId || session.userType === RoleType.ADMIN) {
          return true;
        } else {
          return false;
        }
      }

      if (session.userType !== RoleType.ADMIN) {
        if (section === "orgAnalysis") {
          if (research?.instId !== session.instId && research?.asmtPrcp?.uldTypeCd !== CdmUploadType.CDM) {
            return true;
          } else {
            return false;
          }
        }

        if (section === "cdmAnalysis") {
          if (research?.instId !== session.instId && research?.asmtPrcp?.uldTypeCd === CdmUploadType.CDM) {
            return true;
          } else {
            return false;
          }
        }
      }

      if (section === "partners") {
        // if (research?.instId === session.instId || session.userType === RoleType.ADMIN) {
        //   return true;
        // } else {
        //   return false;
        // }
        return true;
      }

      if (section === "comment") {
        return true;
      }
    }

    return false;
  };

  /* ------------------------------
   * 참여취소 핸들러
   * ------------------------------ */
  const handleCancelInvite = async () => {
    if (!research.asmtPrcp) {
      showAlert({
        message: "참여기관 정보를 찾을 수 없습니다.",
        severity: "error",
      });
      return;
    }

    const result = await cancelInviteModal.open({
      data: {
        partner: {
          asmtPtcpInstSn: research.asmtPrcp?.asmtPtcpInstSn ?? null,
        },
      },
    });

    if (result) {
      showAlert({
        message: "참여취소가 완료되었습니다.",
        severity: "success",
      });

      navigate(routes.RESEARCH.PARTNER);
    }
  };

  /* ------------------------------
   * 참여기관 추가 핸들러
   * ------------------------------ */
  const handleAddPartners = async () => {
    const result = (await AddPartnersModal.open({
      title: "참여기관 추가",
      data: {
        partners: researchPartners.map((partner) => {
          return {
            instId: partner.instId,
            instNm: partner.instNm,
          };
        }),
        lockInitial: research.asmtPrgrsSttsCd === ProgressStatusType.REQUEST_INVITE ? true : false,
      },
    })) as AddPartnersModalResult;

    if (!result?.status || !Array.isArray(result.data)) return;
    if (!result.data.length) return;
    if (result.data.length === researchPartners.length) return;

    try {
      await createPartnersMutation.mutateAsync({
        asmtSn: research.asmtSn,
        data: {
          asmtPrcpInsttList: result.data.map((partner) => (partner.instId ? partner.instId : partner.brno)),
        },
      });
      await refetchPartners();
    } catch {
      /* onError에서 처리 */
    }
  };

  const handleAnalysisTabIndexChange = (event: React.SyntheticEvent, newValue: number) => {
    setAnalysisTabIndex(newValue);
  };

  return (
    <Fade in timeout={280}>
      <Box className={styles.root}>
        <Helmet>
          <title>{`CDM - 연구과제 상세`}</title>
        </Helmet>
        {/* ==============================
          헤더
      ============================== */}
        <Box className="btn_container">
          <Stack direction="column" spacing={1}>
            <Typography variant="mainTitle">{research.asmtNm}</Typography>
            <Typography variant="h6">과제ID: {research.asmtId}</Typography>
          </Stack>
          <Stack className="btn_wrapper tbl_top" direction="row">
            {research?.instId === session.instId && !isCrudDisabled && (
              <AppButton variant="outlined" onClick={() => navigate(buildPath(routes.RESEARCH.EDIT, { asmtSn }))}>
                수정
              </AppButton>
            )}
            <AppButton
              variant="outlined"
              onClick={() => (role === "owner" ? navigate(routes.RESEARCH.OWNER) : navigate(routes.RESEARCH.PARTNER))}
            >
              목록
            </AppButton>
          </Stack>
        </Box>

        <SpaceBox gap={CONTENT_GAP.LARGE} />

        {/* ==============================
          과제 내용
      ============================== */}
        <Box component="section" id="content-desc" className={styles.section}>
          <Box className="sub_path">
            <Typography className="tit" variant="h5">
              연구내용
            </Typography>
          </Box>
          <ContentDesc research={research} />
        </Box>

        <SpaceBox gap={CONTENT_GAP.SMALL} />

        {/* ==============================
          상태 버튼
      ============================== */}
        <Box id="content-status-btn" className="btn_container btn_right">
          {/* 과제 상태가 완료 또는 취소가 아닌 경우에만 버튼 표시 */}
          {!isCrudDisabled && (
            <>
              {appTarget === "admin" ? (
                <>
                  {research.instId === session.instId && session.deptNo === DeptCodeType.DRUG_ANALYSIS && (
                    <Box className="btn_container btn_right">
                      <AppButton variant="contained" onClick={() => handleChangeResearchStatus()}>
                        <i className="fa-regular fa-circle-check mr-2"></i>
                        <Typography variant="default">과제 {changeResearchStatusButtonTitle() || ""}</Typography>
                      </AppButton>
                      <AppButton variant="containedGray" color="secondary" onClick={() => handleCancelResearch()}>
                        <i className="fa-solid fa-ban mr-2"></i>
                        <Typography variant="default">과제 취소</Typography>
                      </AppButton>
                    </Box>
                  )}
                </>
              ) : (
                <>
                  {research.instId === session.instId && (
                    <Box className="btn_container btn_right">
                      <AppButton variant="contained" onClick={() => handleChangeResearchStatus()}>
                        <i className="fa-regular fa-circle-check mr-2"></i>
                        <Typography variant="default">과제 {changeResearchStatusButtonTitle() || ""}</Typography>
                      </AppButton>
                      <AppButton variant="containedGray" color="secondary" onClick={() => handleCancelResearch()}>
                        <i className="fa-solid fa-ban mr-2"></i>
                        <Typography variant="default">과제 취소</Typography>
                      </AppButton>
                    </Box>
                  )}
                </>
              )}
              {research?.instId !== session.instId && (
                <>
                  {session.userType !== RoleType.ADMIN && (
                    <AppButton
                      variant="outlined"
                      onClick={() => {
                        irbUploadModal.open({ data: { asmtSn: research?.asmtSn } });
                      }}
                    >
                      IRB/DRB 자료 업로드
                    </AppButton>
                  )}

                  {research.asmtPrgrsSttsCd === ProgressStatusType.REQUEST_INVITE &&
                    research.asmtPrcp?.ptcpPrgrsSttsCd === ParticipationCdmStatus.INVITATION_REQUEST && (
                      <AppButton variant="contained" onClick={handleJoinResearch}>
                        과제참여
                      </AppButton>
                    )}

                  {research.asmtPrgrsSttsCd === ProgressStatusType.REQUEST_INVITE &&
                    research.asmtPrcp?.ptcpPrgrsSttsCd === ParticipationCdmStatus.INVITATION_REQUEST && (
                      <AppButton variant="containedGray" onClick={handleCancelInvite}>
                        참여거절
                      </AppButton>
                    )}
                </>
              )}
            </>
          )}
          {isCrudDisabled && research?.instId !== session.instId && (
            <>
              {session.userType !== RoleType.ADMIN && (
                <AppButton
                  variant="outlined"
                  onClick={() => {
                    irbUploadModal.open({ data: { asmtSn: research?.asmtSn } });
                  }}
                >
                  IRB/DRB 자료 업로드
                </AppButton>
              )}
            </>
          )}
        </Box>

        <SpaceBox gap={CONTENT_GAP.XLARGE} />

        {/* {research.asmtPrgrsSttsCd === ProgressStatusType.REQUEST_INVITE && research.asmtPrcp?.ptcpPrgrsSttsCd === ParticipationStatus.APPROVAL_INVITE && (
        <Box className="text-center">
          <Typography variant="h5">연구과제의 참여가 승인되었습니다.</Typography>
          <Typography variant="body2">연구과제의 상태가 진행중으로 변경시 이메일로 알림을 발송합니다.</Typography>
        </Box>
      )} */}

        {/* ==============================
          분석결과 관리
      ============================== */}
        {showContentSection("analysis") && (
          <>
            <Box component="section" id="content-analysis" className={styles.section}>
              <Box className="sub_path">
                <Typography className="tit" variant="h5">
                  분석결과
                </Typography>
              </Box>

              <Box>
                <Box className="tab_container">
                  <Tabs value={analysisTabIndex} onChange={handleAnalysisTabIndexChange}>
                    <Tab label="통합 데이터 분석결과" />
                    <Tab label="기관 데이터 분석결과" />
                  </Tabs>
                </Box>

                <Box className="tab_content">
                  {analysisTabIndex === 0 && <ContentCdm />}
                  {analysisTabIndex === 1 && <ContentMember />}
                </Box>
              </Box>
            </Box>

            <SpaceBox gap={CONTENT_GAP.XLARGE} />
          </>
        )}
        {/* ==============================
          기관 데이터 분석결과 - Not CDM
      ============================== */}
        {showContentSection("orgAnalysis") && (
          <>
            <Box component="section" id="content-org-analysis-partner" className={styles.section}>
              <Box className="sub_path">
                <Typography className="tit" variant="h5">
                  기관 데이터 분석결과
                </Typography>
              </Box>
              <ContentMemberAnalysisOrg />
            </Box>

            <SpaceBox gap={CONTENT_GAP.XLARGE} />
          </>
        )}

        {/* ==============================
          기관 데이터 분석결과 - CDM
      ============================== */}
        {showContentSection("cdmAnalysis") && (
          <>
            <Box component="section" id="content-cdm-analysis-partner" className={styles.section}>
              <Box className="sub_path">
                <Typography className="tit" variant="h5">
                  통합 데이터 분석결과
                </Typography>
              </Box>
              <ContentMemberAnalysisCdm />
            </Box>

            <SpaceBox gap={CONTENT_GAP.XLARGE} />
          </>
        )}

        {/* ==============================
          연구결과 (메타분석)
      ============================== */}
        {research && showContentSection("meta") && (
          <>
            <Box component="section" id="content-meta" className={styles.section}>
              <Box className="sub_path">
                <Typography className="tit" variant="h5">
                  연구결과(메타분석)
                </Typography>
              </Box>
              <ContentMeta />
            </Box>

            <SpaceBox gap={CONTENT_GAP.XLARGE} />
          </>
        )}

        {/* {session.userType !== RoleType.ADMIN &&
        research?.instId !== session.instId &&
        research.asmtPrgrsSttsCd === ProgressStatusType.REQUEST_INVITE && (
          <Box className="text-center">
            <Typography variant="body2">과제 상태가 진행중으로 변경되면 이메일로 알림을 발송합니다.</Typography>
          </Box>
        )} */}

        {/* ==============================
          참여기관
      ============================== */}
        {showContentSection("partners") && (
          <>
            <Box
              component="section"
              id={research.asmtPrgrsSttsCd === ProgressStatusType.REQUEST_INVITE ? "content-request-invite" : ""}
              className={styles.section}
            >
              <Box className="sub_path">
                <Typography className="tit" variant="h5">
                  참여기관
                  <Typography variant="body2">({researchPartners.length})</Typography>
                </Typography>
                <Box className="controller">
                  {research &&
                    research.instId === session.instId &&
                    research.asmtPrgrsSttsCd === ProgressStatusType.REQUEST_INVITE && (
                      <AppButton variant="containedLight" color="primary" onClick={handleAddPartners}>
                        참여기관 추가
                      </AppButton>
                    )}
                </Box>
              </Box>
              <ContentMembers />
            </Box>
          </>
        )}

        {/* ==============================
          댓글
      ============================== */}
        {research && showContentSection("comment") && (
          <>
            <SpaceBox gap={CONTENT_GAP.XLARGE} />

            <Box component="section">{asmtSnNumber && <ContentComment asmtSn={asmtSnNumber} />}</Box>
          </>
        )}
      </Box>
    </Fade>
  );
}
