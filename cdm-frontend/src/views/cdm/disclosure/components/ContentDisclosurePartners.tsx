import { type ReactNode, useMemo } from "react";
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

function getUploadTypeWithDate(data: DisclosurePartnerResponse): string {
  const status = String(data.uldInstPrgrsSttsStcd ?? "").trim();
  if (status === DISCLOSURE_PARTNER_PROGRESS_STATUS.CANCELLED) {
    return "참여취소";
  }

  const rawType = data.uldTypeCd != null && String(data.uldTypeCd).trim() !== "" ? String(data.uldTypeCd).trim() : "";
  const uploadType = rawType ? CDM_UPLOAD_TYPE_LABEL_MAP[rawType] || rawType : "대기중";
  return uploadType;
}

const cellCenterSx = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const;

function RemarkCell({ children }: { children?: ReactNode }) {
  return (
    <Box className="ag-cell-center-vertical" sx={cellCenterSx}>
      {children}
    </Box>
  );
}

function isModalCatchableError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && ("response" in error || "message" in error));
}

function modalErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message || e.message || fallback;
}

function createDateTimeColumn(headerName: string, field: keyof DisclosurePartnerResponse): ColDef<DisclosurePartnerResponse> {
  return {
    headerName,
    headerClass: "ag-header-center",
    field,
    wrapText: true,
    autoHeight: true,
    flex: 1,
    cellClass: ["ag-cell-wrap-text", "cdm-date-2line"],
    cellStyle: { textAlign: "center", fontSize: "13px", whiteSpace: "pre-line" },
    valueFormatter: (params) => formatDateTime2Line(params.value),
  };
}

type RemarkHandlers = {
  onPartnerCancel: (ptcpInstSn?: number | null) => void;
  onViewCancelReason: (ptcpInstSn?: number | null) => void;
  onReregisterRequest: (ptcpInstSn?: number | null) => void;
};

/**
 * 참여기관의 비고 셀 렌더링
 */
function renderRemarkAction(params: ICellRendererParams<DisclosurePartnerResponse>, handlers: RemarkHandlers) {
  const rawStatus = params.data?.uldInstPrgrsSttsStcd;
  const normalizedStatus =
    rawStatus == null ? "" : (typeof rawStatus === "string" ? rawStatus : String(rawStatus)).trim();
  const closed = Boolean(params.context?.isDisclosureClosed);
  const ptcpInstSn = params.data?.ptcpInstSn;

  if (
    normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.INVITATION_REQUEST ||
    normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.IN_PROGRESS
  ) {
    if (closed) return <RemarkCell />;
    return (
      <RemarkCell>
        <AppButton variant="outlined" size="small" color="error" onClick={() => handlers.onPartnerCancel(ptcpInstSn)}>
          참여취소
        </AppButton>
      </RemarkCell>
    );
  }

  if (normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.COMPLETED) {
    const normalizedUldType = String(params.data?.uldTypeCd ?? "").trim();
    const isCurrentInfoComplete = normalizedUldType === CDM_UPLOAD_TYPE.NOT_CDM;
    if (isCurrentInfoComplete) {
      if (closed) return <RemarkCell />;
      return (
        <RemarkCell>
          <AppButton variant="outlined" size="small" color="primary" onClick={() => handlers.onReregisterRequest(ptcpInstSn)}>
            현황재요청
          </AppButton>
        </RemarkCell>
      );
    }
    return (
      <RemarkCell>
        <AppButton variant="outlined" size="small" color="success" disabled>
          완료
        </AppButton>
      </RemarkCell>
    );
  }

  if (normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.CANCELLED) {
    return (
      <RemarkCell>
        <AppButton variant="outlined" size="small" color="error" onClick={() => handlers.onViewCancelReason(ptcpInstSn)}>
          취소사유
        </AppButton>
      </RemarkCell>
    );
  }

  if (normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.REGISTRATION_COMPLETED) {
    if (closed) return <RemarkCell />;
    return (
      <RemarkCell>
        <AppButton variant="outlined" size="small" color="primary" onClick={() => handlers.onReregisterRequest(ptcpInstSn)}>
          재요청
        </AppButton>
      </RemarkCell>
    );
  }

  if (normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.RE_INVITATION_REQUEST) {
    return (
      <RemarkCell>
        <AppButton variant="outlined" size="small" color="primary" disabled>
          참여재요청 완료
        </AppButton>
      </RemarkCell>
    );
  }

  if (normalizedStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.RE_REGISTRATION_REQUEST) {
    return (
      <RemarkCell>
        <AppButton variant="outlined" size="small" color="primary" disabled>
          재요청완료
        </AppButton>
      </RemarkCell>
    );
  }

  return "-";
}

type ContentDisclosurePartnersProps = {
  /** 상위(예: 관리자 상세)에서 참여기관 쿼리 초기 로딩까지 기다린 경우 내부 전역형 Loader 중복 표시 생략 */
  skipInitialLoader?: boolean;
};

export default function ContentDisclosurePartners({ skipInitialLoader = false }: ContentDisclosurePartnersProps) {
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

  const addPartnersMutation = useAddDisclosurePartners();
  const requestPartnerStatusMutation = useRequestDisclosurePartnerStatus();

  const pblntStcd = useMemo(() => {
    const raw = disclosure?.pblntStcd;
    if (raw == null) return "";
    const s = String(raw).trim();
    if (!s) return "";
    return s.length === 1 ? `0${s}` : s;
  }, [disclosure?.pblntStcd]);

  const isUploadSummaryDisabled = useMemo(() => pblntStcd === DISCLOSURE_PBLNT_STATUS_CODE.REGISTERED, [pblntStcd]);

  const hasValidPblntSn = typeof pblntSn === "string" && pblntSn.trim() !== "" && !Number.isNaN(Number(pblntSn));

  const isDisclosureClosed = useMemo(() => pblntStcd === DISCLOSURE_PBLNT_STATUS_CODE.CLOSED, [pblntStcd]);

  const isPartnerAddDisabled = useMemo(() => {
    if (!pblntStcd) return true;
    return pblntStcd === DISCLOSURE_PBLNT_STATUS_CODE.CLOSED;
  }, [pblntStcd]);

  const showCatchableModalError = (error: unknown, fallback: string) => {
    if (!isModalCatchableError(error)) return;
    showAlert({ message: modalErrorMessage(error, fallback), severity: "error" });
  };

  const resolvePartnerForAction = (
    ptcpInstSn?: number | null,
    options: { strictNumericPblntSn?: boolean } = {}
  ): { pblntSnId: number; ptcpInstSn: number; partner: DisclosurePartnerResponse } | null => {
    if (options.strictNumericPblntSn) {
      if (!pblntSn || !hasValidPblntSn) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return null;
      }
    } else if (!pblntSn) {
      showAlert({ message: "공시번호가 없습니다.", severity: "error" });
      return null;
    }
    const pblntSnId = Number(pblntSn);
    if (!ptcpInstSn) {
      showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
      return null;
    }
    const partner = partners.find((p) => p.ptcpInstSn === ptcpInstSn);
    if (!partner) {
      showAlert({ message: "참여기관 정보를 찾을 수 없습니다.", severity: "error" });
      return null;
    }
    return { pblntSnId, ptcpInstSn, partner };
  };

  const handleMoveToUploadSummary = () => {
    navigate(routes.CDM.UPLOAD_SUMMARY);
  };

  const handlePartnerCancel = async (ptcpInstSn?: number | null) => {
    const resolved = resolvePartnerForAction(ptcpInstSn);
    if (!resolved) return;
    const { pblntSnId, partner } = resolved;
    try {
      await cancelReasonViewModal.open({
        data: {
          partner,
          pblntSn: pblntSnId,
          initialWithdraw: true,
          successMessage: "참여가 취소되었습니다.",
        },
      });
    } catch (error: unknown) {
      showCatchableModalError(error, "참여취소 중 오류가 발생했습니다.");
    }
  };

  const handleViewCancelReason = async (ptcpInstSn?: number | null) => {
    const resolved = resolvePartnerForAction(ptcpInstSn);
    if (!resolved) return;
    const { partner } = resolved;
    try {
      await cancelReasonViewModal.open({
        data: { partner, pblntSn: Number(pblntSn) },
      });
    } catch (error: unknown) {
      showCatchableModalError(error, "취소사유 조회 중 오류가 발생했습니다.");
    }
  };

  const handleReregisterRequest = async (ptcpInstSn?: number | null) => {
    const resolved = resolvePartnerForAction(ptcpInstSn, { strictNumericPblntSn: true });
    if (!resolved) return;
    const { pblntSnId, ptcpInstSn: id } = resolved;
    try {
      await requestPartnerStatusMutation.mutateAsync({
        pblntSn: pblntSnId,
        ptcpInstSn: id,
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
      })) as { status: boolean; data: PartnerResponse[] };

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
    } catch (error: unknown) {
      showCatchableModalError(error, "참여기관 추가 중 오류가 발생했습니다.");
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
      minWidth: 200,
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
    createDateTimeColumn("요청일시", "ptcpDmndDt"),
    createDateTimeColumn("취소일자", "ptcpRtrcnDt"),
    createDateTimeColumn("확정일시", "ptcpCfmtnDt"),
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
    createDateTimeColumn("완료일자", "ptcpCmptnDt"),
    createDateTimeColumn("재요청일자", "ptcpRdmndDt"),
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
            <AppButton variant="containedLight" color="primary" disabled={isPartnerAddDisabled} onClick={handleOpenPartnerModal}>
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
  );
}
