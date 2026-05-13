import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  CDM_UPLOAD_TYPE,
  CDM_UPLOAD_TYPE_LABEL_MAP,
  DISCLOSURE_PARTNER_PROGRESS_STATUS,
  DISCLOSURE_PARTNER_PROGRESS_STATUS_LABEL_MAP,
  DISCLOSURE_PBLNT_STATUS_CODE,
  ROLE_TYPE as RoleType,
} from "@/constants/types";
import type { DisclosurePartnerResponse } from "@/interfaces/disclosureInterface";
import { ModalNames } from "@/interfaces/modalInterface";
import type { PartnerResponse } from "@/interfaces/researchInterface";
import { normalizePblntStcd } from "@/api/disclosureApi";
import type { RootState } from "@/store";
import { formatDateTime2Line } from "@/utils/dateUtils";
import { useAddDisclosurePartners, useRequestDisclosurePartnerStatus } from "@/hooks/disclosure/useDisclosureMutations";
import { useDisclosureDetail, useDisclosurePartners } from "@/hooks/disclosure/useDisclosureQueries";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import Loader from "@/components/Loader";
import { AppButton } from "@/components/ui";
import styles from "./ContentDisclosurePartner.module.scss";

type AddPartnersModalResult = {
  status: boolean;
  data: PartnerResponse[];
};

// 등록유형·등록일자 문구 (참여취소 시 취소일시 포함)
function getUploadTypeWithDate(data: DisclosurePartnerResponse): string {
  const status = String(data.uldInstPrgrsSttsStcd ?? "").trim();
  if (status === DISCLOSURE_PARTNER_PROGRESS_STATUS.CANCELLED) {
    // const cancelDate = data.ptcpRtrcnDt ? formatPartnerCellDateTime(data.ptcpRtrcnDt) : "";
    // return cancelDate ? `참여취소 (${cancelDate})` : "참여취소";
    return "참여취소";
  }

  const rawType = data.uldTypeCd != null && String(data.uldTypeCd).trim() !== "" ? String(data.uldTypeCd).trim() : "";
  const uploadType = rawType ? CDM_UPLOAD_TYPE_LABEL_MAP[rawType] || rawType : "대기중";
  // const regDate = data.regDt ? formatPartnerCellDateTime(data.regDt) : "";
  // if (uploadType && regDate) return `${uploadType} (${regDate})`;
  // return uploadType || regDate || "-";
  return uploadType;
}

const cellCenterSx = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const;

/**
 * 참여기관의 비고 셀 렌더링
 */
function renderRemarkAction(
  params: ICellRendererParams<DisclosurePartnerResponse>,
  handlers: {
    onPartnerCancel: (ptcpInstSn?: number | null) => void;
    onViewCancelReason: (ptcpInstSn?: number | null) => void;
    onReregisterRequest: (ptcpInstSn?: number | null) => void;
  }
) {
  // 업로드 기관 진행상태 원본
  const statusValue = params.data?.uldInstPrgrsSttsStcd;
  // 상태 분기용 (trim·문자열 통일)
  const normalizedStatus = statusValue ? (typeof statusValue === "string" ? statusValue : String(statusValue)).trim() : "";

  if (
    normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.INVITATION_REQUEST ||
    normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.IN_PROGRESS
  ) {
    if (params.context?.isDisclosureClosed) return <Box className="ag-cell-center-vertical" sx={cellCenterSx} />;
    return (
      <Box className="ag-cell-center-vertical" sx={cellCenterSx}>
        <AppButton
          variant="outlined"
          size="small"
          color="error"
          onClick={() => handlers.onPartnerCancel(params.data?.ptcpInstSn)}
        >
          참여취소
        </AppButton>
      </Box>
    );
  }

  if (normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.COMPLETED) {
    // 완료 상태에서 현황정보(NOT_CDM)만 재요청 버튼 노출
    const normalizedUldType = String(params.data?.uldTypeCd ?? "").trim();
    const isCurrentInfoComplete = normalizedUldType === CDM_UPLOAD_TYPE.NOT_CDM;
    if (isCurrentInfoComplete) {
      if (params.context?.isDisclosureClosed) return <Box className="ag-cell-center-vertical" sx={cellCenterSx} />;
      return (
        <Box className="ag-cell-center-vertical" sx={cellCenterSx}>
          <AppButton
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => handlers.onReregisterRequest(params.data?.ptcpInstSn)}
          >
            현황재요청
          </AppButton>
        </Box>
      );
    }
    return (
      <Box className="ag-cell-center-vertical" sx={cellCenterSx}>
        <AppButton variant="outlined" size="small" color="success" disabled>
          완료
        </AppButton>
      </Box>
    );
  }

  if (normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.CANCELLED) {
    return (
      <Box className="ag-cell-center-vertical" sx={cellCenterSx}>
        <AppButton
          variant="outlined"
          size="small"
          color="error"
          onClick={() => handlers.onViewCancelReason(params.data?.ptcpInstSn)}
        >
          취소사유
        </AppButton>
      </Box>
    );
  }

  if (normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.REGISTRATION_COMPLETED) {
    if (params.context?.isDisclosureClosed) return <Box className="ag-cell-center-vertical" sx={cellCenterSx} />;
    return (
      <Box className="ag-cell-center-vertical" sx={cellCenterSx}>
        <AppButton
          variant="outlined"
          size="small"
          color="primary"
          onClick={() => handlers.onReregisterRequest(params.data?.ptcpInstSn)}
        >
          재요청
        </AppButton>
      </Box>
    );
  }

  if (normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.RE_INVITATION_REQUEST) {
    return (
      <Box className="ag-cell-center-vertical" sx={cellCenterSx}>
        <AppButton variant="outlined" size="small" color="primary" disabled>
          참여재요청 완료
        </AppButton>
      </Box>
    );
  }

  if (normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.RE_REGISTRATION_REQUEST) {
    return (
      <Box className="ag-cell-center-vertical" sx={cellCenterSx}>
        <AppButton variant="outlined" size="small" color="primary" disabled>
          재요청완료
        </AppButton>
      </Box>
    );
  }

  return "-";
}

type DisclosurePartnerSectionProps = {
  /** 상위(예: 관리자 상세)에서 참여기관 쿼리 초기 로딩까지 기다린 경우 내부 전역형 Loader 중복 표시 생략 */
  skipInitialLoader?: boolean;
};

export default function DisclosurePartnerSection({ skipInitialLoader = false }: DisclosurePartnerSectionProps) {
  const { pblntSn } = useParams<{ pblntSn: string }>();
  const navigate = useNavigate();
  const routes = useCmRoutes();
  const { showAlert } = useGlobalAlert();
  const session = useSelector((state: RootState) => state.session);

  const { data: disclosure } = useDisclosureDetail(pblntSn);
  const {
    data: partners = [],
    isLoading: isLoadingPartners,
    isError: isPartnersError,
    refetch: refetchPartners,
  } = useDisclosurePartners(pblntSn, session.userType === RoleType.ADMIN);

  const addPartnersModal = useModal(ModalNames.AddPartners);
  const cancelReasonViewModal = useModal(ModalNames.CancelReasonView);
  const commentForReasonModal = useModal(ModalNames.CommentForReason);

  const addPartnersMutation = useAddDisclosurePartners();
  const requestPartnerStatusMutation = useRequestDisclosurePartnerStatus();

  /** 공시진행상태코드 (한 자리면 0패딩) */
  const pblntStcd = useMemo(() => {
    const raw = disclosure?.pblntStcd != null ? String(disclosure.pblntStcd).trim() : "";
    if (!raw) return "";
    return raw.length === 1 ? `0${raw}` : raw;
  }, [disclosure?.pblntStcd]);

  const isUploadSummaryDisabled = useMemo(() => pblntStcd === DISCLOSURE_PBLNT_STATUS_CODE.REGISTERED, [pblntStcd]);

  const hasValidPblntSn = typeof pblntSn === "string" && pblntSn.trim() !== "" && !Number.isNaN(Number(pblntSn));

  const isDisclosureClosed = useMemo(() => normalizePblntStcd(disclosure?.pblntStcd) === "03", [disclosure?.pblntStcd]);

  const isPartnerAddDisabled = useMemo(() => {
    const code = normalizePblntStcd(disclosure?.pblntStcd);
    if (!code) return true;
    return code === "03";
  }, [disclosure?.pblntStcd]);

  const handleMoveToUploadSummary = () => {
    navigate(routes.CDM.UPLOAD_SUMMARY);
  };

  const handlePartnerCancel = async (ptcpInstSn?: number | null) => {
    if (!pblntSn) {
      showAlert({ message: "공시번호가 없습니다.", severity: "error" });
      return;
    }
    const pblntSnId = Number(pblntSn);
    if (!ptcpInstSn) {
      showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
      return;
    }
    const partner = partners.find((p) => p.ptcpInstSn === ptcpInstSn);
    if (!partner) {
      showAlert({ message: "참여기관 정보를 찾을 수 없습니다.", severity: "error" });
      return;
    }
    try {
      const result = await commentForReasonModal.open({
        title: "거부사유 등록",
        data: { partner },
      });
      if (result && typeof result === "object" && "reason" in result && result.reason) {
        const modalResult = result as { ptcpInstSn: number; processType: string; reason: string };
        if (modalResult.processType === DISCLOSURE_PARTNER_PROGRESS_STATUS.CANCELLED) {
          try {
            await requestPartnerStatusMutation.mutateAsync({
              pblntSn: pblntSnId,
              ptcpInstSn: modalResult.ptcpInstSn,
              status: DISCLOSURE_PARTNER_PROGRESS_STATUS.CANCELLED,
              reason: modalResult.reason,
              successMessage: "참여가 취소되었습니다.",
            });
            await refetchPartners();
          } catch {
            /* onError에서 처리 */
          }
        }
      }
    } catch (error: any) {
      if (error?.response || error?.message) {
        const message = error?.response?.data?.message || error?.message || "참여취소 중 오류가 발생했습니다.";
        showAlert({ message, severity: "error" });
      }
    }
  };

  const handleViewCancelReason = async (ptcpInstSn?: number | null) => {
    if (!pblntSn) {
      showAlert({ message: "공시번호가 없습니다.", severity: "error" });
      return;
    }
    if (!ptcpInstSn) {
      showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
      return;
    }
    const partner = partners.find((p) => p.ptcpInstSn === ptcpInstSn);
    if (!partner) {
      showAlert({ message: "참여기관 정보를 찾을 수 없습니다.", severity: "error" });
      return;
    }
    try {
      await cancelReasonViewModal.open({
        title: "취소사유 조회",
        data: { partner, pblntSn },
      });
    } catch (error: any) {
      if (error?.response || error?.message) {
        const message = error?.response?.data?.message || error?.message || "취소사유 조회 중 오류가 발생했습니다.";
        showAlert({ message, severity: "error" });
      }
    }
  };

  const handleReregisterRequest = async (ptcpInstSn?: number | null) => {
    if (!pblntSn || !hasValidPblntSn) {
      showAlert({ message: "공시번호가 없습니다.", severity: "error" });
      return;
    }
    const pblntSnId = Number(pblntSn);
    if (!ptcpInstSn) {
      showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
      return;
    }
    try {
      await requestPartnerStatusMutation.mutateAsync({
        pblntSn: pblntSnId,
        ptcpInstSn,
        status: DISCLOSURE_PARTNER_PROGRESS_STATUS.RE_REGISTRATION_REQUEST,
        successMessage: "재등록요청이 완료되었습니다.",
      });
      await refetchPartners();
    } catch {
      /* onError에서 처리 */
    }
  };

  const handleOpenPartnerModal = async () => {
    try {
      const currentPartners: PartnerResponse[] = partners.map((p) => ({
        instId: p.instId,
        instNm: p.instNm,
        brno: p.instId || "",
      }));

      const result = (await addPartnersModal.open({
        title: "참여기관 추가",
        data: { partners: currentPartners, pblntSn: pblntSn ?? undefined },
      })) as AddPartnersModalResult;

      if (!result?.status || !Array.isArray(result.data)) return;
      if (!result.data.length) return;
      if (result.data.length === partners.length) return;

      await addPartnersMutation.mutateAsync({
        pblntSn: Number(pblntSn),
        data: {
          instIds: result.data.map((p) => (p.instId || p.brno || "").trim()).filter((id) => id !== ""),
        },
      });
      await refetchPartners();
    } catch (error: any) {
      if (error?.response || error?.message) {
        const message = error?.response?.data?.message || error?.message || "참여기관 추가 중 오류가 발생했습니다.";
        showAlert({ message, severity: "error" });
      }
    }
  };

  const partnerColDefs: ColDef<DisclosurePartnerResponse>[] = [
    {
      headerName: "번호",
      headerClass: "ag-header-center",
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
      width: 65,
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "기관명",
      field: "instNm",
      wrapText: true,
      autoHeight: true,
      flex: 1,
      minWidth: 180,
      cellStyle: { textAlign: "left" },
    },
    {
      headerName: "진행상태",
      headerClass: "ag-header-center",
      field: "uldInstPrgrsSttsStcd",
      flex: 1,
      cellStyle: { textAlign: "center" },
      valueFormatter: (params) => {
        if (!params.value) return "-";
        return DISCLOSURE_PARTNER_PROGRESS_STATUS_LABEL_MAP[params.value] || params.value;
      },
    },
    {
      headerName: "요청일시",
      headerClass: "ag-header-center",
      field: "ptcpDmndDt",
      wrapText: true,
      autoHeight: true,
      flex: 1,
      cellClass: ["ag-cell-wrap-text", "cdm-date-2line"],
      cellStyle: { textAlign: "center", fontSize: "13px", whiteSpace: "pre-line" },
      valueFormatter: (params) => formatDateTime2Line(params.value),
    },
    {
      headerName: "취소일자",
      headerClass: "ag-header-center",
      field: "ptcpRtrcnDt",
      wrapText: true,
      autoHeight: true,
      flex: 1,
      cellClass: ["ag-cell-wrap-text", "cdm-date-2line"],
      cellStyle: { textAlign: "center", fontSize: "13px", whiteSpace: "pre-line" },
      valueFormatter: (params) => formatDateTime2Line(params.value),
    },
    {
      headerName: "확정일시",
      headerClass: "ag-header-center",
      field: "ptcpCfmtnDt",
      wrapText: true,
      autoHeight: true,
      flex: 1,
      cellClass: ["ag-cell-wrap-text", "cdm-date-2line"],
      cellStyle: { textAlign: "center", fontSize: "13px", whiteSpace: "pre-line" },
      valueFormatter: (params) => formatDateTime2Line(params.value),
    },
    {
      headerName: "등록유형",
      headerClass: "ag-header-center",
      field: "uldTypeCd",
      wrapText: true,
      autoHeight: true,
      flex: 1,
      cellStyle: { textAlign: "center" },
      valueFormatter: (params) => (params.data ? getUploadTypeWithDate(params.data) : "-"),
    },
    {
      headerName: "완료일자",
      headerClass: "ag-header-center",
      field: "ptcpCmptnDt",
      wrapText: true,
      autoHeight: true,
      flex: 1,
      cellClass: ["ag-cell-wrap-text", "cdm-date-2line"],
      cellStyle: { textAlign: "center", fontSize: "13px", whiteSpace: "pre-line" },
      valueFormatter: (params) => formatDateTime2Line(params.value),
    },
    {
      headerName: "재요청일자",
      headerClass: "ag-header-center",
      field: "ptcpRdmndDt",
      wrapText: true,
      autoHeight: true,
      flex: 1,
      cellClass: ["ag-cell-wrap-text", "cdm-date-2line"],
      cellStyle: { textAlign: "center", fontSize: "13px", whiteSpace: "pre-line" },
      valueFormatter: (params) => formatDateTime2Line(params.value),
    },
    {
      headerName: "비고",
      headerClass: "ag-header-center",
      field: "ptcpRdmndDt",
      flex: 1,
      cellStyle: { textAlign: "center" },
      cellClass: "ag-cell-center-vertical",
      cellRenderer: (params: ICellRendererParams<DisclosurePartnerResponse>) =>
        renderRemarkAction(params, {
          onPartnerCancel: handlePartnerCancel,
          onViewCancelReason: handleViewCancelReason,
          onReregisterRequest: handleReregisterRequest,
        }),
    },
  ];

  return (
    <>
      <Box component="section" id="content-partners" className={styles.section}>
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            참여기관
            <Typography variant="body2">({partners.length})</Typography>
          </Typography>
          <Box className="controller">
            <Stack className="btn_wrapper tbl_top" direction="row">
              <AppButton
                variant="outlined"
                disabled={isUploadSummaryDisabled}
                onClick={() => {
                  if (isUploadSummaryDisabled) return;
                  handleMoveToUploadSummary();
                }}
              >
                수집현황 상세
              </AppButton>
              <AppButton
                variant="containedLight"
                color="primary"
                disabled={isPartnerAddDisabled}
                onClick={handleOpenPartnerModal}
              >
                참여기관 추가
              </AppButton>
            </Stack>
          </Box>
        </Box>
        <Box sx={{ width: "100%" }}>
          {isLoadingPartners && !skipInitialLoader ? (
            <Box sx={{ position: "relative", minHeight: 220 }}>
              <Loader isLoading={true} />
            </Box>
          ) : isPartnersError ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                참여기관 조회에 실패했습니다.
              </Typography>
              <AppButton variant="outlined" size="small" onClick={() => void refetchPartners()}>
                다시 시도
              </AppButton>
            </Box>
          ) : (
            <Box className="ag-theme-cdm w-full" style={{ maxHeight: 350, overflow: "auto" }}>
              <AgGridReact
                key={`partners-grid-${pblntSn}-${String(disclosure?.pblntStcd ?? "")}-${isDisclosureClosed ? "c" : "o"}`}
                rowData={partners}
                columnDefs={partnerColDefs}
                context={{
                  onPartnerCancel: handlePartnerCancel,
                  onViewCancelReason: handleViewCancelReason,
                  onReregisterRequest: handleReregisterRequest,
                  pblntDvcd: disclosure?.pblntDvcd ?? null,
                  isDisclosureClosed,
                }}
                domLayout="autoHeight"
                headerHeight={42}
                rowHeight={42}
                getRowId={(params) => `${params.data.ptcpInstSn}-${params.data.pblntSn}`}
                overlayNoRowsTemplate={`<span style="padding:8px;">참여기관이 없습니다.</span>`}
              />
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
}
