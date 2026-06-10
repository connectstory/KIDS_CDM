import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, FormControl, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import dayjs from "dayjs";
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
import { DisclosureAPI } from "@/api/disclosureApi";
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
  const normalizedStatus = rawStatus == null ? "" : (typeof rawStatus === "string" ? rawStatus : String(rawStatus)).trim();
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

export type ContentDisclosurePartnerProgressContext = {
  onPartnerRequest: (ptcpInstSn?: number | null, status?: string) => void;
  onPartnerRefuse: (ptcpInstSn?: number | null) => void;
  onRegister: (pblntSn?: number | null, ptcpInstSn?: number | null) => void;
  onViewCancelReason: (ptcpInstSn?: number | null) => void;
  registrationType: "file" | "status";
  onRegistrationTypeChange: (value: "file" | "status") => void;
  partnerSubmissionAllowed: boolean;
  registeredPtcpInstSnSet: Record<string, true>;
  hasCdmUploadForPtcpInstSn: (ptcpInstSn?: number | null) => boolean;
};

export type ContentDisclosurePartnerProgressProps = {
  rowData: DisclosurePartnerResponse[];
  columnDefs: ColDef<DisclosurePartnerResponse>[];
  context: ContentDisclosurePartnerProgressContext;
  cdmUploadByPtcpInstSnSize: number;
  /** 페이지 단위 고정 key (행·상태 변경 시 remount 방지) */
  gridKey: string;
};

const PARTNER_PROGRESS_COL_REGISTRATION_TYPE = "partnerRegistrationType";
const PARTNER_PROGRESS_COL_REMARK = "partnerRemark";

/** 협력기관 공시 상세 — 진행상태 AgGrid (`columnDefs`·`context`는 상위에서 주입) */
export function ContentDisclosurePartnerProgress({
  rowData,
  columnDefs,
  context,
  cdmUploadByPtcpInstSnSize,
  gridKey,
}: ContentDisclosurePartnerProgressProps) {
  const gridRef = useRef<AgGridReact<DisclosurePartnerResponse>>(null);

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.setGridOption("context", context);
    api.refreshCells({ force: true });
  }, [context, rowData, cdmUploadByPtcpInstSnSize]);

  return (
    <div className="ag-theme-cdm w-full" style={{ maxHeight: 350, overflow: "auto" }}>
      {/*
        gridKey는 공시 단위로 고정. rowData·context·CDM맵 변경은 refreshCells로 셀만 갱신.
      */}
      <AgGridReact
        ref={gridRef}
        key={gridKey}
        rowData={rowData}
        columnDefs={columnDefs}
        context={context}
        domLayout="autoHeight"
        headerHeight={42}
        rowHeight={undefined}
        getRowId={(params) => `${params.data.ptcpInstSn}-${params.data.pblntSn}`}
        overlayNoRowsTemplate={`<span style="padding:8px;">등록된 참여기관이 없습니다.</span>`}
      />
    </div>
  );
}

const PARTNER_REGISTRATION_TYPE_LS_KEY = "disclosureRegistrationType";

function readPartnerCustomerLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("[ContentDisclosurePartner] localStorage.getItem 실패", { key, error });
    return null;
  }
}

function writePartnerCustomerLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error("[ContentDisclosurePartner] localStorage.setItem 실패", { key, error });
  }
}

function hasSavedCdmStatusDraft(partner: any): boolean {
  if (!partner) return false;
  const v = partner.verInfoNm ?? partner.ver_info_nm;
  const l = partner.lastUpdtYmd ?? partner.last_updt_ymd;
  const c = partner.updtCycleCnt ?? partner.updt_cycle_cnt;
  if (v != null && String(v).trim() !== "") return true;
  if (l != null && String(l).trim() !== "") return true;
  if (c != null && String(c).trim() !== "") return true;
  return false;
}

function isStatusRegistrationTransmitted(partner: any): boolean {
  if (!partner) return false;

  const uld = String(partner.uldTypeCd ?? partner.uld_type_cd ?? "").trim();
  const draft = hasSavedCdmStatusDraft(partner);
  const looksLikeStatusPath = uld === "02" || (draft && uld !== "01");
  if (!looksLikeStatusPath) return false;

  const rawSt = partner.uldInstPrgrsSttsStcd ?? partner.uld_inst_prgrs_stts_cd;
  const st =
    rawSt == null || rawSt === ""
      ? ""
      : (() => {
          const s = String(rawSt).trim();
          return s.length === 1 && /^\d$/.test(s) ? `0${s}` : s;
        })();
  if (st === DISCLOSURE_PARTNER_PROGRESS_STATUS.COMPLETED || st === DISCLOSURE_PARTNER_PROGRESS_STATUS.REGISTRATION_COMPLETED) {
    return true;
  }

  const cmptn = partner.ptcpCmptnDt ?? partner.ptcp_cmptn_dt;
  const rdmnd = partner.ptcpRdmndDt ?? partner.ptcp_rdmnd_dt;

  const cmptnStr = cmptn != null ? String(cmptn).trim() : "";
  const rdmndStr = rdmnd != null ? String(rdmnd).trim() : "";

  if (
    st === DISCLOSURE_PARTNER_PROGRESS_STATUS.RE_INVITATION_REQUEST ||
    st === DISCLOSURE_PARTNER_PROGRESS_STATUS.RE_REGISTRATION_REQUEST
  ) {
    if (!cmptnStr || !rdmndStr) return false;
    const cmptnD = dayjs(cmptnStr);
    const rdmndD = dayjs(rdmndStr);
    if (!cmptnD.isValid() || !rdmndD.isValid()) return false;
    return cmptnD.isAfter(rdmndD) || cmptnD.isSame(rdmndD);
  }

  return cmptnStr !== "";
}

function deriveLockedRegistrationType(
  partner: any | null | undefined,
  hasCdmUploadForPtcpInstSn: (ptcpInstSn?: number | null) => boolean
): "file" | "status" | null {
  if (!partner) return null;
  const rowUld = String(partner.uldTypeCd ?? partner.uld_type_cd ?? "").trim();
  const hasCdm = hasCdmUploadForPtcpInstSn(partner.ptcpInstSn);
  const draft = hasSavedCdmStatusDraft(partner);
  const lockedFile = rowUld === "01" || hasCdm;
  const lockedStatus = rowUld === "02" || (draft && !hasCdm && rowUld !== "01");
  if (lockedFile && lockedStatus) return hasCdm ? "file" : "status";
  if (lockedFile) return "file";
  if (lockedStatus) return "status";
  return null;
}

const partnerCustomerColDefs: ColDef<DisclosurePartnerResponse>[] = [
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
    field: "uldInstPrgrsSttsStcd",
    width: 100,
    headerClass: "ag-header-center",
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
    width: 100,
    cellClass: ["ag-cell-wrap-text", "cdm-date-2line"],
    cellStyle: { textAlign: "center", fontSize: "13px", whiteSpace: "pre-line" },
    valueFormatter: (params) => formatDateTime2Line(params.value),
  },
  {
    headerName: "확정일시",
    headerClass: "ag-header-center",
    field: "ptcpCfmtnDt",
    width: 100,
    cellClass: ["ag-cell-wrap-text", "cdm-date-2line"],
    cellStyle: { textAlign: "center", fontSize: "13px", whiteSpace: "pre-line" },
    valueFormatter: (params) => formatDateTime2Line(params.value),
  },
  {
    headerName: "완료일자",
    headerClass: "ag-header-center",
    field: "ptcpCmptnDt",
    width: 100,
    cellClass: ["ag-cell-wrap-text", "cdm-date-2line"],
    cellStyle: { textAlign: "center", fontSize: "13px", whiteSpace: "pre-line" },
    valueFormatter: (params) => formatDateTime2Line(params.value),
  },
  {
    headerName: "재요청일자",
    headerClass: "ag-header-center",
    field: "ptcpRdmndDt",
    width: 100,
    cellClass: ["ag-cell-wrap-text", "cdm-date-2line"],
    cellStyle: { textAlign: "center", fontSize: "13px", whiteSpace: "pre-line" },
    valueFormatter: (params) => formatDateTime2Line(params.value),
  },
  {
    colId: PARTNER_PROGRESS_COL_REGISTRATION_TYPE,
    headerName: "등록유형",
    width: 150,
    headerClass: "ag-header-center",
    cellStyle: { textAlign: "center" },
    cellClass: "ag-cell-center-vertical",
    cellRenderer: (params: ICellRendererParams<any>) => {
      const row = params.data;
      const hasCdmFn = params.context?.hasCdmUploadForPtcpInstSn as ((n?: number | null) => boolean) | undefined;
      const derived = hasCdmFn != null ? deriveLockedRegistrationType(row, hasCdmFn) : null;
      const cellValue: "file" | "status" = derived ?? ((params.context?.registrationType ?? "file") as "file" | "status");
      const registrationTypeLocked = derived != null;
      const onRegistrationTypeChange = params.context?.onRegistrationTypeChange;
      const submissionBlocked = params.context?.partnerSubmissionAllowed === false;
      return (
        <div
          className="ag-cell-center-vertical"
          style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <FormControl>
            <Select
              value={cellValue}
              onChange={(e) => onRegistrationTypeChange?.(e.target.value as "file" | "status")}
              displayEmpty
              disabled={submissionBlocked || registrationTypeLocked}
            >
              <MenuItem value="file">파일업로드</MenuItem>
              <MenuItem value="status">현황등록</MenuItem>
            </Select>
          </FormControl>
        </div>
      );
    },
  },
  {
    colId: PARTNER_PROGRESS_COL_REMARK,
    headerName: "비고",
    field: "ptcpRdmndDt",
    minWidth: 220,
    flex: 1,
    headerClass: "ag-header-center",
    cellStyle: { textAlign: "center" },
    cellClass: "ag-cell-center-vertical",
    cellRenderer: (params: ICellRendererParams<any>) => {
      const statusValue = params.data?.uldInstPrgrsSttsStcd;
      const currentStatus =
        statusValue == null || statusValue === ""
          ? ""
          : (() => {
              const s = String(statusValue).trim();
              return s.length === 1 && /^\d$/.test(s) ? `0${s}` : s;
            })();

      const submissionBlocked = params.context?.partnerSubmissionAllowed === false;

      if (currentStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.INVITATION_REQUEST) {
        return (
          <div
            className="ag-cell-center-vertical"
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "row",
              flexWrap: "nowrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxSizing: "border-box",
            }}
          >
            <Button
              variant="outlined"
              size="small"
              disabled={submissionBlocked}
              sx={{ flexShrink: 0 }}
              onClick={() => {
                params.context?.onPartnerRequest?.(params.data?.ptcpInstSn, "02");
              }}
            >
              참여확정
            </Button>
          </div>
        );
      }
      if (currentStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.IN_PROGRESS) {
        const ptcpInstSn = params.data?.ptcpInstSn;
        const isJustRegistered = ptcpInstSn != null && params.context?.registeredPtcpInstSnSet?.[String(ptcpInstSn)] === true;
        const statusRegTransmitted = isStatusRegistrationTransmitted(params.data);
        if (isJustRegistered) {
          return (
            <div
              className="ag-cell-center-vertical"
              style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Typography variant="body2" color="text.secondary">
                완료됨
              </Typography>
            </div>
          );
        }
        return (
          <div
            className="ag-cell-center-vertical"
            style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Button
              variant="outlined"
              size="small"
              color="primary"
              disabled={submissionBlocked || statusRegTransmitted}
              onClick={() => {
                params.context?.onRegister?.(params.data?.pblntSn, params.data?.ptcpInstSn);
              }}
            >
              등록
            </Button>
          </div>
        );
      }
      if (currentStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.REGISTRATION_COMPLETED) {
        return (
          <div
            className="ag-cell-center-vertical"
            style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Typography variant="body2" color="text.secondary">
              완료됨
            </Typography>
          </div>
        );
      }
      if (currentStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.CANCELLED) {
        return (
          <div
            className="ag-cell-center-vertical"
            style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => {
                params.context?.onViewCancelReason?.(params.data?.ptcpInstSn);
              }}
            >
              취소사유
            </Button>
          </div>
        );
      }
      if (currentStatus === DISCLOSURE_PARTNER_PROGRESS_STATUS.RE_REGISTRATION_REQUEST) {
        const row = params.data;
        const statusRegTransmitted = isStatusRegistrationTransmitted(row);
        const hasCdmFn = params.context?.hasCdmUploadForPtcpInstSn as ((n?: number | null) => boolean) | undefined;
        const derived = hasCdmFn != null ? deriveLockedRegistrationType(row, hasCdmFn) : null;
        const reg = derived ?? ((params.context?.registrationType ?? "file") as "file" | "status");
        const btnLabel = statusRegTransmitted ? "완료됨" : reg === "status" ? "현황 재등록" : "재업로드";
        return (
          <div
            className="ag-cell-center-vertical"
            style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Button
              variant="outlined"
              size="small"
              color="primary"
              disabled={submissionBlocked || statusRegTransmitted}
              onClick={() => {
                params.context?.onRegister?.(params.data?.pblntSn, params.data?.ptcpInstSn);
              }}
            >
              {btnLabel}
            </Button>
          </div>
        );
      }
      const label = DISCLOSURE_PARTNER_PROGRESS_STATUS_LABEL_MAP[currentStatus] || "-";

      return (
        <div
          className="ag-cell-center-vertical"
          style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </div>
      );
    },
  },
];

export type ContentDisclosurePartnerCustomerProgressProps = {
  pblntSn: string;
  pblntSnId: number;
  pblntStcd?: string | null;
  rowData: DisclosurePartnerResponse[];
  partnerSubmissionAllowed: boolean;
  hasCdmUploadForPtcpInstSn: (ptcpInstSn?: number | null) => boolean;
  cdmUploadByPtcpInstSnSize: number;
  /** 첨부(CDM) 목록이 바뀔 때 등록유형 잠금·로컬스토리지 동기화 */
  registrationSyncDependency?: unknown;
};

/** 협력기관 공시 상세 — 진행상태 그리드(모달·상태전이·등록유형·내비게이션 자체 처리) */
export function ContentDisclosurePartnerCustomerProgressPanel({
  pblntSn,
  pblntSnId,
  pblntStcd,
  rowData,
  partnerSubmissionAllowed,
  hasCdmUploadForPtcpInstSn,
  cdmUploadByPtcpInstSnSize,
  registrationSyncDependency,
}: ContentDisclosurePartnerCustomerProgressProps) {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();
  const session = useSelector((state: RootState) => state.session);
  const cancelReasonViewModal = useModal(ModalNames.CancelReasonView);

  const [registeredPtcpInstSnSet, setRegisteredPtcpInstSnSet] = useState<Record<string, true>>({});
  const [registrationType, setRegistrationType] = useState<"file" | "status">(() => {
    const v = readPartnerCustomerLocalStorage(PARTNER_REGISTRATION_TYPE_LS_KEY);
    if (v === "status" || v === "file") return v;
    return "file";
  });

  const onRegistrationTypeChange = useCallback((value: "file" | "status") => {
    setRegistrationType(value);
    writePartnerCustomerLocalStorage(PARTNER_REGISTRATION_TYPE_LS_KEY, value);
  }, []);

  useEffect(() => {
    const p = rowData[0];
    const derived = deriveLockedRegistrationType(p, hasCdmUploadForPtcpInstSn);
    if (derived == null) return;
    setRegistrationType(derived);
    writePartnerCustomerLocalStorage(PARTNER_REGISTRATION_TYPE_LS_KEY, derived);
  }, [rowData, hasCdmUploadForPtcpInstSn, registrationSyncDependency]);

  const handlePartnerRefuse = useCallback(
    async (ptcpInstSn?: number | null) => {
      if (Number.isNaN(pblntSnId)) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      if (!ptcpInstSn) {
        showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
        return;
      }
      const partner = rowData.find((p) => p.ptcpInstSn === ptcpInstSn);
      if (!partner) {
        showAlert({ message: "참여기관 정보를 찾을 수 없습니다.", severity: "error" });
        return;
      }
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
        const e = error as { response?: { data?: { message?: string } }; message?: string };
        if (e?.response || e?.message) {
          const message = e?.response?.data?.message || e?.message || "참여취소 처리 중 오류가 발생했습니다.";
          showAlert({ message, severity: "error" });
        } else if (error != null) {
          console.error("[ContentDisclosurePartner] 참여취소 처리 중 예외", error);
        }
      }
    },
    [pblntSnId, rowData, showAlert, cancelReasonViewModal]
  );

  const handlePartnerRequest = useCallback(
    async (ptcpInstSn?: number | null, status?: string) => {
      if (Number.isNaN(pblntSnId)) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      if (!ptcpInstSn) {
        showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
        return;
      }
      if (!DisclosureAPI.isPartnerSubmissionAllowed(pblntStcd)) {
        showAlert({ message: DisclosureAPI.getPartnerSubmissionBlockedMessage(pblntStcd), severity: "warning" });
        return;
      }
      try {
        await DisclosureAPI.requestPartnerStatus(pblntSnId, ptcpInstSn, status);
        await queryClient.invalidateQueries({ queryKey: ["disclosure-partners", pblntSn] });
        showAlert({ message: "상태가 변경되었습니다.", severity: "success" });
      } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "상태 변경 중 오류가 발생했습니다.";
        showAlert({ message, severity: "error" });
      }
    },
    [pblntSn, pblntSnId, queryClient, showAlert, pblntStcd]
  );

  const handleRegister = useCallback(
    (pblntSnArg?: number | null, ptcpInstSn?: number | null) => {
      if (!pblntSnArg) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      if (!DisclosureAPI.isPartnerSubmissionAllowed(pblntStcd)) {
        showAlert({ message: DisclosureAPI.getPartnerSubmissionBlockedMessage(pblntStcd), severity: "warning" });
        return;
      }
      const partnerRow = ptcpInstSn != null ? rowData.find((p: any) => p.ptcpInstSn === ptcpInstSn) : rowData[0];
      const regTypeEarly = deriveLockedRegistrationType(partnerRow, hasCdmUploadForPtcpInstSn) ?? registrationType;
      if (regTypeEarly === "status" && isStatusRegistrationTransmitted(partnerRow)) {
        showAlert({ message: "현황등록이 전송 완료되어 등록을 진행할 수 없습니다.", severity: "warning" });
        return;
      }
      if (ptcpInstSn != null) {
        setRegisteredPtcpInstSnSet((prev) => ({ ...prev, [String(ptcpInstSn)]: true }));
      }
      const regType = deriveLockedRegistrationType(partnerRow, hasCdmUploadForPtcpInstSn) ?? registrationType;
      if (regType === "status") {
        navigate(`${routes.CDM.PARTNER_INFO_WRITE}?pblntSn=${pblntSnArg}&ptcpInstSn=${ptcpInstSn}`);
      } else {
        navigate(`${routes.CDM.UPLOAD}?pblntSn=${pblntSnArg}&ptcpInstSn=${ptcpInstSn}`);
      }
    },
    [
      navigate,
      showAlert,
      registrationType,
      hasCdmUploadForPtcpInstSn,
      rowData,
      routes.CDM.PARTNER_INFO_WRITE,
      routes.CDM.UPLOAD,
      pblntStcd,
    ]
  );

  const handleViewCancelReason = useCallback(
    async (ptcpInstSn?: number | null) => {
      if (Number.isNaN(pblntSnId)) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      if (!ptcpInstSn) {
        showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
        return;
      }

      const partner = rowData.find((p) => p.ptcpInstSn === ptcpInstSn);
      if (!partner) {
        showAlert({ message: "참여기관 정보를 찾을 수 없습니다.", severity: "error" });
        return;
      }

      try {
        await cancelReasonViewModal.open({
          data: {
            partner,
            pblntSn: pblntSnId,
          },
        });
      } catch (error: unknown) {
        const e = error as { response?: { data?: { message?: string } }; message?: string };
        if (e?.response || e?.message) {
          const message = e?.response?.data?.message || e?.message || "취소사유 조회 중 오류가 발생했습니다.";
          showAlert({ message, severity: "error" });
        } else if (error != null) {
          console.error("[ContentDisclosurePartner] 취소사유 조회 중 예외", error);
        }
      }
    },
    [pblntSnId, rowData, showAlert, cancelReasonViewModal]
  );

  const progressContext: ContentDisclosurePartnerProgressContext = useMemo(
    () => ({
      onPartnerRequest: handlePartnerRequest,
      onPartnerRefuse: handlePartnerRefuse,
      onRegister: handleRegister,
      onViewCancelReason: handleViewCancelReason,
      registrationType,
      onRegistrationTypeChange,
      partnerSubmissionAllowed,
      registeredPtcpInstSnSet,
      hasCdmUploadForPtcpInstSn,
    }),
    [
      handlePartnerRequest,
      handlePartnerRefuse,
      handleRegister,
      handleViewCancelReason,
      registrationType,
      onRegistrationTypeChange,
      partnerSubmissionAllowed,
      registeredPtcpInstSnSet,
      hasCdmUploadForPtcpInstSn,
    ]
  );

  return (
    <ContentDisclosurePartnerProgress
      gridKey={`partner-progress-${pblntSn}`}
      rowData={rowData}
      columnDefs={partnerCustomerColDefs}
      context={progressContext}
      cdmUploadByPtcpInstSnSize={cdmUploadByPtcpInstSnSize}
    />
  );
}

type ContentDisclosurePartnerProps = {
  /** 상위(예: 관리자 상세)에서 참여기관 쿼리 초기 로딩까지 기다린 경우 내부 전역형 Loader 중복 표시 생략 */
  skipInitialLoader?: boolean;
};

export default function ContentDisclosurePartner({ skipInitialLoader = false }: ContentDisclosurePartnerProps) {
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
        data: {
          partner,
          pblntSn: Number(pblntSn),
        },
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
