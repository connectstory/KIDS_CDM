import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { STRINGS } from "@/constants/string.ts";
import { CONTENT_GAP } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import { HttpError } from "@/api/axios";
import { DisclosureAPI } from "@/api/disclosureApi";
import { fetchCatalogList } from "@/api/pstinfoApi";
import type { RootState } from "@/store";
import { cdmTableDisplayName, normalizeCdmSeCode } from "@/utils/cdmTableUtils";
import {
  hasVrfcRuleHistDetail,
  pickVrfcRuleHistDetailFromRow,
  type VrfcRuleHistDetail,
  vrfcRuleHistDetailEntries,
} from "@/utils/vrfcRuleHistDetail";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import { SpaceBox } from "@/components/SpaceBox";

ModuleRegistry.registerModules([AllCommunityModule]);

/** DisclosureUpload 와 동일 — TB_CM_E_TBL_ULD_STATS_HIST 유효성 룰 상세 행 식별·매칭 */
function getVrfcRuleIdFromRow(tbl: any): number | null {
  const v = tbl?.vrfcRuleId ?? tbl?.vrfcruleid ?? tbl?.uld_rul_sn ?? tbl?.vrfc_rul_sn;
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function getUldVrfcGrpSnFromRow(tbl: any): number | null {
  const v = tbl?.uldVrfcGrpSn ?? tbl?.uldvrfcgrpsn ?? tbl?.uld_vrfc_sn;
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getVrfcRuleTpCdFromRow(tbl: any): string | null {
  const v = tbl?.vrfcRuleTpCd ?? tbl?.vrfcrultpcd ?? tbl?.uld_rul_type_nm ?? tbl?.vrfc_rul_type_nm;
  if (v == null || v === "") return null;
  return String(v).trim();
}

/** 입력화면(PartnerInformationWrite)과 동일한 CDM 타입/테이블 옵션 */
const CDM_TYPE_OPTIONS = [
  { value: "01", label: "Sentinel" },
  { value: "02", label: "OMOP" },
];
const CDM_TABLE_OPTIONS: Record<
  string,
  {
    value: string;
    label: string;
  }[]
> = {
  "01": [
    { value: "01", label: "Enrollment" },
    { value: "02", label: "Demographic" },
    { value: "03", label: "Dispensing" },
    { value: "04", label: "Encounter" },
    { value: "05", label: "Diagnosis" },
    { value: "06", label: "Procedure" },
    { value: "07", label: "Laboratory_result" },
    { value: "08", label: "Vital_Signs" },
    { value: "09", label: "Death" },
    { value: "10", label: "Cause_of_Death" },
  ],
  "02": [
    { value: "11", label: "observation_period" },
    { value: "12", label: "person" },
    { value: "13", label: "drug_exposure" },
    { value: "14", label: "visit_occurrence" },
    { value: "15", label: "condition_occurrence" },
    { value: "16", label: "procedure_occurrence" },
    { value: "17", label: "measurement" },
    { value: "18", label: "observation" },
    { value: "19", label: "death" },
  ],
};
/** 상단 참여기관·상세 테이블 `ag-theme-cdm`(assets/css/admin/aggrid.css)과 CDM 카탈로그(MUI Table) 시각 통일 */
const AG_GRID_LIKE_FONT = '"Pretendard GOV", system-ui, Avenir, Helvetica, Arial, sans-serif';
const AG_GRID_LIKE_BORDER = "#e5e7eb";
/** --ag-header-background-color */
const AG_GRID_LIKE_HEADER_BG = "oklch(96.7% 0.003 264.542)";
/** 기간&규모 ↔ 카탈로그: 동일 밀도·글자·구분선 (MUI `size="small"`과 별도로 통일) */
const CDM_INLINE_TABLE_BORDER = "#d1d5db";
const CDM_INLINE_TABLE_FS = "0.875rem";
const CDM_INLINE_TABLE_PY = "8px";
const cdmInlineTableBaseSx = {
  width: "100%",
  fontFamily: AG_GRID_LIKE_FONT,
  borderCollapse: "collapse" as const,
  "& .MuiTableCell-root": {
    fontSize: CDM_INLINE_TABLE_FS,
    fontWeight: 400,
    borderColor: CDM_INLINE_TABLE_BORDER,
    borderBottom: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
    py: CDM_INLINE_TABLE_PY,
    px: 1.5,
    lineHeight: 1.43,
    WebkitFontSmoothing: "antialiased",
    color: "#212124",
    verticalAlign: "middle",
  },
} as const;
/** 상단 CDM 테이블별 기간&규모 */
const periodReadonlyTableSx = {
  ...cdmInlineTableBaseSx,
} as const;
const periodReadonlyFirstColSx = {
  width: "22%",
  fontWeight: 600,
  fontSize: CDM_INLINE_TABLE_FS,
  bgcolor: AG_GRID_LIKE_HEADER_BG,
  borderRight: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
};
/** CDM 카탈로그 테이블 헤더 음영(기간&규모 좌측 라벨열과 유사한 톤) */
const CDM_CATALOG_HEADER_SHADE = "#e8edf3";
/** 하단 CDM 카탈로그 — 기간&규모와 동일 토큰 + 헤더 행 */
const catalogTableSx = {
  ...cdmInlineTableBaseSx,
  tableLayout: "fixed" as const,
  "& .MuiTableHead .MuiTableRow-root": {
    backgroundColor: CDM_CATALOG_HEADER_SHADE,
  },
  "& .MuiTableHead .MuiTableCell-root": {
    fontWeight: 600,
    backgroundColor: `${CDM_CATALOG_HEADER_SHADE} !important`,
    color: "#000",
    borderTop: "1px solid #212124",
    borderBottom: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
    py: CDM_INLINE_TABLE_PY,
    px: 1.5,
    fontSize: CDM_INLINE_TABLE_FS,
    textAlign: "left",
  },
} as const;
const catalogTableContainerSx = {
  borderRadius: 0,
  overflow: "hidden" as const,
  borderLeft: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
  borderRight: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
  borderBottom: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
};
/** 기관 상세·현황 읽기 전용: PartnerInformationWrite(CDM 현황정보) 레이아웃 + ag-theme-cdm 폰트·헤더색·보더 통일 */
const cdmReadOnlySectionBoxSx = {
  borderTop: "1px solid #212124",
  borderBottom: `1px solid ${AG_GRID_LIKE_BORDER}`,
  borderLeft: `1px solid ${AG_GRID_LIKE_BORDER}`,
  borderRight: `1px solid ${AG_GRID_LIKE_BORDER}`,
  fontFamily: AG_GRID_LIKE_FONT,
} as const;
const cdmReadOnlyLabelBoxSx = {
  width: "140px",
  minWidth: "140px",
  bgcolor: AG_GRID_LIKE_HEADER_BG,
  display: "flex",
  alignItems: "center",
  px: 2,
  py: 1.25,
  borderRight: `1px solid ${AG_GRID_LIKE_BORDER}`,
} as const;
const cdmReadOnlyValueBoxSx = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  px: 2,
  py: 1.25,
  minHeight: 48,
  borderRight: `1px solid ${AG_GRID_LIKE_BORDER}`,
  fontSize: "1rem",
  lineHeight: 1.5,
  color: "var(--main-font-color, #212124)",
} as const;
const cdmReadOnlyLabelTypoSx = { fontSize: "1rem", fontWeight: 600, color: "#000", fontFamily: AG_GRID_LIKE_FONT };
function normalizeUldTypeCd(raw: string | null | undefined): string {
  const s = raw != null ? String(raw).trim() : "";
  return s.length === 1 ? `0${s}` : s;
}
/** 참여기관 진행상태(04=참여취소·등록취소) — API camel/snake 대응 */
function normalizePartnerProgressStatus(partner: unknown): string {
  if (!partner || typeof partner !== "object") return "";
  const p = partner as Record<string, unknown>;
  const raw = p.uldInstPrgrsSttsStcd ?? p.uld_inst_prgrs_stts_stcd;
  if (raw == null || String(raw).trim() === "") return "";
  const s = String(raw).trim();
  return s.length === 1 ? `0${s}` : s;
}
/** 01=데이터(CDM) 업로드, 02=현황정보 — 공시 상세와 동일 */
function labelUploadKind(uldTypeCd: string | number | null | undefined): string {
  if (uldTypeCd === null || uldTypeCd === undefined) return "-";
  const s = String(uldTypeCd).trim();
  if (s === "") return "-";
  const c = normalizeUldTypeCd(s);
  if (c === "01") return "데이터 업로드";
  if (c === "02") return "현황정보";
  return "-";
}
/** 참여기관 API 응답의 업로드유형코드 (camel/snake 및 키 변형 대응) */
function extractUldTypeCdFromPartner(partner: any): string | null {
  if (!partner || typeof partner !== "object") return null;
  const direct = ["uldTypeCd", "uld_type_cd", "uldType"] as const;
  for (const k of direct) {
    const v = partner[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  for (const key of Object.keys(partner)) {
    const lower = key.toLowerCase().replace(/_/g, "");
    if (lower === "uldtypecd") {
      const v = partner[key];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        return String(v).trim();
      }
    }
  }
  return null;
}
/**
 * 현황정보(02) 기관은 CDM 파일 업로드 통계(uldNocs)가 없어 총건수가 0으로 보이는 문제 대응.
 * 참여기관 정보 API의 기간·규모(tnocs) 합계를 우선 쓰고, 없으면 카탈로그 행 수를 총건수로 사용.
 */
function totalCountFromPartnerInformationResponse(infoResponse: unknown): number {
  const res = infoResponse as {
    data?: {
      data?: Record<string, unknown>;
    } & Record<string, unknown>;
  };
  const raw = res?.data?.data ?? res?.data;
  if (!raw || typeof raw !== "object") return 0;
  const periodList = (raw as any).periodScaleList ?? (raw as any).period_scale_list ?? [];
  let sumTnocs = 0;
  if (Array.isArray(periodList)) {
    for (const row of periodList) {
      const n = row?.tnocs ?? row?.Tnocs ?? row?.TNOCS;
      const num = Number(n);
      if (Number.isFinite(num) && num > 0) sumTnocs += num;
    }
  }
  const catalog = (raw as any).catalogList ?? (raw as any).catalog_list ?? [];
  const catalogLen = Array.isArray(catalog) ? catalog.length : 0;
  if (sumTnocs > 0) return sumTnocs;
  return catalogLen;
}
// 기관별 통계 인터페이스
interface InstitutionStats {
  ptcpInstSn: number;
  instNm: string;
  instId: string;
  totalCount: number;
  errorCount: number;
  errorRate: number;
  /** 업로드 용량 (KB 단위, 리포팅 표시용) */
  uldCpct?: number | null;
  /** 04 참여취소(등록취소) — 행 표시·일부 상세 제외용(전체 보유건수 합산에는 포함) */
  registrationCancelled?: boolean;
}
// 테이블별 통계 인터페이스 (상세 테이블 정보: 기관별 행이면 instNm 포함)
interface TableStats {
  tblUldStatsSn: number;
  errtblNm: string;
  /** API 원본 테이블명(룰 팝업 매칭용, errtblNm 과 동일 출처) */
  errTblNmRaw?: string;
  /** 검증 배치 그룹(유효성 룰 상세 매칭) */
  uldVrfcGrpSn?: number | null;
  uldNocs: number;
  errNocs: number;
  vrfcFnlErrNocs: number; // 완전성
  vrfcUnqErrNocs: number; // 유일성
  vrfcVldErrNocs: number; // 유효성
  vrfcNmlErrNocs: number; // 정확성
  errRt: number; // 오류율(%) = (5항목 오류건수 합 ÷ 총건수) × 100
  /** 같은 테이블을 여러 기관이 올렸을 때 테이블명 뒤에 표시할 참여기관명 */
  instNm?: string;
}
// 기관별 업로드 요약 테이블 행 (institutionRowData용)
type InstitutionRow = {
  ptcpInstSn: number;
  instId: string;
  rowNumber: number;
  instNm: string;
  totalCount: number;
  errorCount: number;
  errorRate: number;
  uldCpct?: number | null;
  uldTypeCd: string | null;
  /** 등록취소(04) 행 — 업로드 유형·수치는 '-' 표시 */
  registrationCancelled?: boolean;
};
export default function CDMInfoReportingContent() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session = useSelector((state: RootState) => state.session);
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();
  const drbViewModal = useModal(ModalNames.DrbView);
  // 공시번호 가져오기 (우선순위: URL 파라미터 > Redux 스토어 > localStorage)
  const pblntSnFromUrl = searchParams.get("pblntSn");
  const pblntSnFromStore = session.pblntSn;
  const pblntSnFromStorage = localStorage.getItem("pblntSn");
  const pblntSn = pblntSnFromUrl || (pblntSnFromStore ? pblntSnFromStore.toString() : null) || pblntSnFromStorage;
  const pblntSnNumber = pblntSn ? parseInt(pblntSn, 10) : null;
  // 참여기관 목록 조회
  const { data: partnersData = [] } = useQuery({
    queryKey: ["disclosure-partners", pblntSnNumber],
    queryFn: async () => {
      if (!pblntSnNumber) {
        return [];
      }
      try {
        const response = await DisclosureAPI.getPartnersByPblntSn(pblntSnNumber);
        // 응답 데이터가 배열인지 확인
        const partnersData = response.data?.data;
        if (Array.isArray(partnersData)) {
          return partnersData;
        } else {
          return [];
        }
      } catch (error: any) {
        return [];
      }
    },
    enabled: !!pblntSnNumber,
    retry: false,
  });
  /* ------------------------------
   * 연구과제 목록 데이터
   * ------------------------------ */
  const partners = useMemo(() => partnersData || [], [partnersData]);
  const [selectedPtcpInstSn, setSelectedPtcpInstSn] = useState<number | null>(null);
  const [selectedInstId, setSelectedInstId] = useState<string | null>(null);
  const [validityRuleModal, setValidityRuleModal] = useState<{
    open: boolean;
    tableLabel: string;
    dialogTitle?: string;
    rules: { ruleId: number; count: number; detail: VrfcRuleHistDetail }[];
  }>({ open: false, tableLabel: "", rules: [] });
  /** 룰 상세 패널: 한 번에 하나만 펼침 */
  const [validityRuleExpandedId, setValidityRuleExpandedId] = useState<number | null>(null);
  const [consistencyModal, setConsistencyModal] = useState<{
    open: boolean;
    tableLabel: string;
    loading: boolean;
    errorMessage?: string;
    missingFields: string[];
    matchedFields: string[];
  }>({ open: false, tableLabel: "", loading: false, missingFields: [], matchedFields: [] });
  useEffect(() => {
    setSelectedPtcpInstSn(null);
    setSelectedInstId(null);
  }, [pblntSnNumber]);
  const getPartnerField = useCallback((p: any, ...keys: string[]) => {
    if (!p) return undefined;
    for (const k of keys) {
      const v = (p as any)[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return undefined;
  }, []);
  /* ------------------------------
   * 기관별 요약 테이블 컬럼 정의 (InstitutionRow)
   * ------------------------------ */
  const institutionColDefs = useMemo<ColDef<InstitutionRow>[]>(
    () =>
      [
        {
          headerName: STRINGS.NO,
          headerClass: "ag-header-center",
          field: "rowNumber",
          width: 72,
          cellStyle: { textAlign: "center" as const },
          cellRenderer: (params: ICellRendererParams<InstitutionRow>) => {
            const sn = params.data?.ptcpInstSn;
            const selected = sn != null && selectedPtcpInstSn != null && Number(sn) === Number(selectedPtcpInstSn);
            return (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  width: "100%",
                }}
              >
                {selected ? (
                  <span style={{ color: "#1976d2", fontWeight: 700, lineHeight: 1 }} aria-hidden>
                    ▶
                  </span>
                ) : (
                  <span style={{ width: 14, display: "inline-block" }} />
                )}
                <span>{params.value ?? ""}</span>
              </span>
            );
          },
        },
        {
          headerName: STRINGS.REGISTERED_INSTITUTION,
          field: "instNm",
          flex: 1,
        },
        {
          colId: "uploadTypeCd",
          headerName: "업로드 유형",
          headerClass: "ag-header-center",
          field: "uldTypeCd",
          width: 140,
          cellStyle: { textAlign: "center" as const },
          /** field + valueFormatter만 쓰면 동일 field 중복 컬럼 등으로 값이 비는 경우가 있어 data 기준으로 표시 */
          cellRenderer: (params: ICellRendererParams<InstitutionRow>) => {
            if (params.data?.registrationCancelled) {
              return <span>등록취소</span>;
            }
            const row = params.data;
            const raw =
              row?.uldTypeCd ??
              (
                row as unknown as {
                  uld_type_cd?: string | null;
                }
              )?.uld_type_cd ??
              null;
            return <span>{labelUploadKind(raw)}</span>;
          },
        },
        {
          headerName: "총 건수",
          headerClass: "ag-header-center",
          field: "totalCount",
          width: 120,
          cellStyle: { textAlign: "center" as const },
          valueFormatter: (params) => {
            if (params.data?.registrationCancelled) return "-";
            return params.value != null ? `${Number(params.value).toLocaleString()} 건` : "-";
          },
        },
        {
          headerName: "오류 건수",
          headerClass: "ag-header-center",
          field: "errorCount",
          width: 120,
          cellStyle: { textAlign: "center" as const },
          valueFormatter: (params) => {
            if (params.data?.registrationCancelled) return "-";
            return params.value != null ? `${Number(params.value).toLocaleString()} 건` : "-";
          },
        },
        {
          colId: "instErrorRate",
          headerName: "오류율",
          headerClass: "ag-header-center",
          field: "errorRate",
          width: 120,
          cellStyle: { textAlign: "center" as const },
          valueFormatter: (params) => {
            if (params.data?.registrationCancelled) return "-";
            return params.value != null ? `${Number(params.value).toFixed(2)} %` : "-";
          },
        },
        {
          headerName: "용량",
          headerClass: "ag-header-center",
          field: "uldCpct",
          width: 100,
          cellStyle: { textAlign: "center" as const },
          valueFormatter: (params) => {
            if (params.data?.registrationCancelled) return "-";
            return params.value != null && Number(params.value) > 0 ? `${(Number(params.value) / 1024).toFixed(2)} GB` : "-";
          },
        },
        {
          colId: "drb",
          headerName: "DRB",
          headerClass: "ag-header-center",
          /** errorRate와 field 중복 시 AG Grid colId 충돌로 다른 컬럼 표시가 깨질 수 있음 — DRB는 별도 colId만 사용 */
          width: 100,
          cellStyle: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center" as const,
            textAlign: "center" as const,
          },
          cellRenderer: (params: ICellRendererParams<InstitutionRow>) => {
            if (params.data?.registrationCancelled) return <>-</>;
            const kind =
              params.data?.uldTypeCd ??
              (
                params.data as unknown as {
                  uld_type_cd?: string | null;
                }
              )?.uld_type_cd ??
              null;
            if (normalizeUldTypeCd(kind) !== "01") return <>-</>;
            return (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  drbViewModal.open({
                    showHeaderCloseButton: true,
                    data: {
                      ptcpInstSn: params?.data?.ptcpInstSn,
                      name: params?.data?.instNm,
                      pblntSn: pblntSnNumber ?? undefined,
                    },
                  });
                }}
              >
                상세
              </Button>
            );
          },
        },
      ] as ColDef<InstitutionRow>[],
    [drbViewModal, pblntSnNumber, selectedPtcpInstSn]
  );
  // 모든 기관 표시 (참여 여부와 관계없이)
  const participatingPartners = useMemo(() => partners, [partners]);
  // 모든 기관 ID 배열을 메모이제이션하여 무한 호출 방지
  const participatingPartnerIds = useMemo(() => {
    const ids = participatingPartners.map((p: any) => p.ptcpInstSn).sort((a, b) => a - b);
    return ids;
  }, [participatingPartners]);
  // 모든 기관의 통계 조회 (참여 여부와 관계없이)
  const {
    data: allStatsData,
    isLoading: allStatsLoading,
    error: allStatsError,
  } = useQuery({
    queryKey: ["upload-stats-all", pblntSnNumber, participatingPartnerIds.join(",")],
    queryFn: async () => {
      if (!pblntSnNumber) {
        return { institutionStats: [], tableStats: [], perPartnerStatsList: [] };
      }
      if (participatingPartners.length === 0) {
        return { institutionStats: [], tableStats: [], perPartnerStatsList: [] };
      }
      try {
        // 모든 기관의 통계를 병렬로 조회
        const statsPromises = participatingPartners.map(async (partner: any) => {
          if (normalizePartnerProgressStatus(partner) === "04") {
            return {
              ptcpInstSn: partner.ptcpInstSn,
              instNm: partner.instNm || partner.instId || "알 수 없음",
              instId: partner.instId || "",
              totalCount: 0,
              errorCount: 0,
              errorRate: 0,
              uldCpct: null,
              tableStats: [] as TableStats[],
              rawTblList: [] as unknown[],
              registrationCancelled: true,
            };
          }
          try {
            const response = await DisclosureAPI.getUploadStats(pblntSnNumber, partner.ptcpInstSn);
            const statsData = (response as any)?.data?.data;
            // statsData의 키를 확인하고 소문자 변형도 체크
            const getStatsDataField = (obj: any, ...fieldNames: string[]): any => {
              if (!obj) return undefined;
              for (const fieldName of fieldNames) {
                if (obj[fieldName] !== undefined && obj[fieldName] !== null) {
                  return obj[fieldName];
                }
              }
              return undefined;
            };
            const uldStatsHist = getStatsDataField(statsData, "uldStatsHist", "uldstatshist", "uld_stats_hist");
            const tblUldStatsHistList =
              getStatsDataField(statsData, "tblUldStatsHistList", "tbluldstatshistlist", "tbl_uld_stats_hist_list") || [];
            if (uldStatsHist) {
            }
            if (tblUldStatsHistList.length > 0) {
            }
            // 숫자 변환 헬퍼 함수
            const toNumber = (value: any): number => {
              if (value === null || value === undefined) return 0;
              if (typeof value === "number") return value;
              if (typeof value === "string") {
                const parsed = parseFloat(value);
                return isNaN(parsed) ? 0 : parsed;
              }
              // BigDecimal 등 객체인 경우 문자열로 변환 후 파싱
              const str = String(value);
              const parsed = parseFloat(str);
              return isNaN(parsed) ? 0 : parsed;
            };
            // 필드명이 소문자로 변환될 수 있으므로 모든 경우를 체크하는 헬퍼 함수
            const getField = (obj: any, ...fieldNames: string[]): any => {
              for (const fieldName of fieldNames) {
                if (obj[fieldName] !== undefined && obj[fieldName] !== null) {
                  return obj[fieldName];
                }
              }
              return undefined;
            };
            const parsedTableStats = (tblUldStatsHistList || [])
              .filter((tbl: any) => {
                const rid = getField(tbl, "vrfcRuleId", "vrfcruleid", "vrfc_rul_sn");
                return rid == null || rid === "";
              })
              .map((tbl: any) => ({
                tblUldStatsSn: getField(tbl, "tblUldStatsSn", "tbluldstatssn", "tbl_uld_stats_sn") || 0,
                errtblNm: getField(tbl, "errTblNm", "errtblNm", "errtblnm", "errtbl_nm") || "",
                errTblNmRaw: String(getField(tbl, "errTblNm", "errtblNm", "errtblnm", "errtbl_nm") || "").trim(),
                uldVrfcGrpSn: (() => {
                  const v = getField(tbl, "uldVrfcGrpSn", "uldvrfcgrpsn", "uld_vrfc_sn");
                  if (v == null || v === "") return null;
                  const n = Number(v);
                  return Number.isFinite(n) ? n : null;
                })(),
                uldNocs: toNumber(getField(tbl, "uldNocs", "uldnocs", "uld_nocs")),
                errNocs: toNumber(getField(tbl, "errNocs", "errnocs", "err_nocs")),
                vrfcFnlErrNocs: toNumber(getField(tbl, "vrfcFnlErrNocs", "vrfcfnlerrnocs", "vrfc_fnl_err_nocs")),
                vrfcUnqErrNocs: toNumber(getField(tbl, "vrfcUnqErrNocs", "vrfcunqerrnocs", "vrfc_unq_err_nocs")),
                vrfcVldErrNocs: toNumber(getField(tbl, "vrfcVldErrNocs", "vrfcvlderrnocs", "vrfc_vld_err_nocs")),
                vrfcNmlErrNocs: toNumber(getField(tbl, "vrfcNmlErrNocs", "vrfcnmlerrnocs", "vrfc_nml_err_nocs")),
                // 테이블별 오류율은 업로드 화면 로직과 동일하게 프론트에서 재계산 (서버 errRt 값/스케일 차이 방지)
                errRt: 0,
              }))
              .map((t: any) => {
                const total = t.uldNocs ?? 0;
                if (total <= 0) return { ...t, errRt: 0 };
                const sum =
                  (t.errNocs ?? 0) +
                  (t.vrfcFnlErrNocs ?? 0) +
                  (t.vrfcUnqErrNocs ?? 0) +
                  (t.vrfcVldErrNocs ?? 0) +
                  (t.vrfcNmlErrNocs ?? 0);
                return { ...t, errRt: (sum / total) * 100 };
              });
            // 1차 통계 사용, 없으면 2차 테이블별 통계를 집계
            let instTotal = uldStatsHist ? toNumber(getField(uldStatsHist, "uldNocs", "uldnocs", "uld_nocs")) : 0;
            let instError = uldStatsHist ? toNumber(getField(uldStatsHist, "errNocs", "errnocs", "err_nocs")) : 0;
            let instRate = uldStatsHist ? toNumber(getField(uldStatsHist, "errRt", "errrt", "err_rt")) : 0;
            const instUldCpct = uldStatsHist ? toNumber(getField(uldStatsHist, "uldCpct", "uldcpct", "uld_cpct")) || null : null;
            if (instTotal === 0 && parsedTableStats.length > 0) {
              instTotal = parsedTableStats.reduce((s: number, t: any) => s + t.uldNocs, 0);
              instError = parsedTableStats.reduce((s: number, t: any) => s + t.errNocs, 0);
              instRate = instTotal > 0 ? Math.min((instError / instTotal) * 100, 100) : 0;
            }
            // 참여기관 오류건수 = 해당 기관이 올린 데이터의 5개 항목(일관성·완전성·유일성·유효성·정확성) 검사 중 발생한 모든 오류건수 총합
            const instErrorFromItems = parsedTableStats.reduce(
              (s: number, t: any) =>
                s +
                (t.errNocs ?? 0) +
                (t.vrfcFnlErrNocs ?? 0) +
                (t.vrfcUnqErrNocs ?? 0) +
                (t.vrfcVldErrNocs ?? 0) +
                (t.vrfcNmlErrNocs ?? 0),
              0
            );
            const result = {
              ptcpInstSn: partner.ptcpInstSn,
              instNm: partner.instNm || partner.instId || "알 수 없음",
              instId: partner.instId || "",
              totalCount: instTotal,
              errorCount: instErrorFromItems,
              errorRate: instTotal > 0 ? Math.min((instErrorFromItems / instTotal) * 100, 100) : instRate,
              uldCpct: instUldCpct,
              tableStats: parsedTableStats,
              rawTblList: Array.isArray(tblUldStatsHistList) ? tblUldStatsHistList : [],
            };
            const partnerUldNorm = normalizeUldTypeCd(extractUldTypeCdFromPartner(partner) ?? "");
            if (partnerUldNorm === "02") {
              try {
                const infoRes = await DisclosureAPI.getPartnerInformation(pblntSnNumber, partner.ptcpInstSn);
                const statusTotal = totalCountFromPartnerInformationResponse(infoRes);
                if (statusTotal > 0) {
                  result.totalCount = Math.max(result.totalCount, statusTotal);
                  result.errorRate = result.totalCount > 0 ? Math.min((result.errorCount / result.totalCount) * 100, 100) : 0;
                }
              } catch (e) {}
            }
            return result;
          } catch (error) {
            return {
              ptcpInstSn: partner.ptcpInstSn,
              instNm: partner.instNm || partner.instId || "알 수 없음",
              instId: partner.instId || "",
              totalCount: 0,
              errorCount: 0,
              errorRate: 0,
              uldCpct: null,
              tableStats: [],
              rawTblList: [],
            };
          }
        });
        const stats = await Promise.all(statsPromises);
        const perPartnerStatsList = stats.map((s: any) => ({
          ptcpInstSn: s.ptcpInstSn,
          instNm: s.instNm,
          tblUldStatsHistList: s.rawTblList || [],
        }));
        const institutionStats = stats.map((s: any) => ({
          ptcpInstSn: s.ptcpInstSn,
          instNm: s.instNm,
          instId: s.instId,
          totalCount: s.totalCount,
          errorCount: s.errorCount,
          errorRate: s.errorRate,
          uldCpct: s.uldCpct ?? null,
          registrationCancelled: s.registrationCancelled === true,
        }));
        // 상세 테이블 정보: 같은 테이블이라도 참여기관별로 행 분리, 테이블명 뒤에 (참여기관명) 표시
        const tableStatsRows: TableStats[] = [];
        stats.forEach((stat) => {
          stat.tableStats.forEach((tbl: TableStats) => {
            tableStatsRows.push({
              ...tbl,
              instNm: stat.instNm || "",
            });
          });
        });
        const tableStats = tableStatsRows.sort((a, b) => {
          const order: Record<string, number> = {
            "진단정보(condition_occurrence)": 1,
            "방문정보 (visit_occurrence)": 2,
            "약물정보 (drug_exposure)": 3,
            "환자정보 (person)": 4,
          };
          const orderDiff = (order[a.errtblNm] || 999) - (order[b.errtblNm] || 999);
          if (orderDiff !== 0) return orderDiff;
          return (a.instNm || "").localeCompare(b.instNm || "");
        });
        return { institutionStats, tableStats, perPartnerStatsList };
      } catch (error) {
        return { institutionStats: [], tableStats: [], perPartnerStatsList: [] };
      }
    },
    enabled: !!pblntSnNumber,
    retry: false,
  });
  const institutionStats: InstitutionStats[] = useMemo(() => {
    return allStatsData?.institutionStats || [];
  }, [allStatsData]);
  const tableStats: TableStats[] = useMemo(() => {
    const stats = allStatsData?.tableStats || [];
    return stats;
  }, [allStatsData]);
  const perPartnerStatsList = useMemo(() => allStatsData?.perPartnerStatsList ?? [], [allStatsData]);
  const rawTblUldStatsForSelectedPartner = useMemo(() => {
    if (selectedPtcpInstSn == null) return [] as unknown[];
    const row = perPartnerStatsList.find((p: any) => Number(p.ptcpInstSn) === Number(selectedPtcpInstSn));
    return (row?.tblUldStatsHistList as unknown[]) ?? [];
  }, [perPartnerStatsList, selectedPtcpInstSn]);

  const openValidityRuleBreakdownForSelectedTable = useCallback((tableRow: TableStats) => {
    const raw = rawTblUldStatsForSelectedPartner as any[];
    const errRaw = String(tableRow.errTblNmRaw ?? tableRow.errtblNm ?? "").trim();
    const grp = tableRow.uldVrfcGrpSn ?? null;
    const rules = raw
      .filter((r) => {
        if (getVrfcRuleIdFromRow(r) == null) return false;
        if (getVrfcRuleTpCdFromRow(r) === "FN") return false;
        const tnm = String(r.errTblNm ?? r.err_tbl_nm ?? "").trim();
        if (tnm !== errRaw) return false;
        if (grp != null) {
          const g = getUldVrfcGrpSnFromRow(r);
          if (g !== grp) return false;
        }
        return true;
      })
      .map((r) => ({
        ruleId: getVrfcRuleIdFromRow(r)!,
        count: Number(r.vrfcRuleErrNocs ?? r.vrfc_rul_err_nocs ?? 0) || 0,
        detail: pickVrfcRuleHistDetailFromRow(r as Record<string, unknown>),
      }))
      .sort((a, b) => a.ruleId - b.ruleId);
    const tableLabel = cdmTableDisplayName(errRaw || tableRow.errtblNm);
    setValidityRuleExpandedId(null);
    setValidityRuleModal({ open: true, tableLabel, dialogTitle: undefined, rules });
  }, [rawTblUldStatsForSelectedPartner]);

  const openConsistencyFieldNameRulesForSelectedTable = useCallback(
    (tableRow: TableStats) => {
      const raw = rawTblUldStatsForSelectedPartner as any[];
      const errRaw = String(tableRow.errTblNmRaw ?? tableRow.errtblNm ?? "").trim();
      const grp = tableRow.uldVrfcGrpSn ?? null;
      const rules = raw
        .filter((r) => {
          if (getVrfcRuleIdFromRow(r) == null) return false;
          if (getVrfcRuleTpCdFromRow(r) !== "FN") return false;
          const tnm = String(r.errTblNm ?? r.err_tbl_nm ?? "").trim();
          if (tnm !== errRaw) return false;
          if (grp != null) {
            const g = getUldVrfcGrpSnFromRow(r);
            if (g !== grp) return false;
          }
          return true;
        })
        .map((r) => ({
          ruleId: getVrfcRuleIdFromRow(r)!,
          count: Number(r.vrfcRuleErrNocs ?? r.vrfc_rul_err_nocs ?? 0) || 0,
          detail: pickVrfcRuleHistDetailFromRow(r as Record<string, unknown>),
        }))
        .sort((a, b) => a.ruleId - b.ruleId);
      const tableLabel = cdmTableDisplayName(errRaw || tableRow.errtblNm);
      setValidityRuleExpandedId(null);
      setValidityRuleModal({
        open: true,
        tableLabel,
        dialogTitle: "일관성 검증 — 필드명 룰별",
        rules,
      });
    },
    [rawTblUldStatsForSelectedPartner]
  );

  const openConsistencyHeaderDetailForTable = useCallback(
    async (tableRow: TableStats) => {
      if (!pblntSnNumber || selectedPtcpInstSn == null) {
        showAlert({ message: "공시 또는 선택 기관 정보가 없습니다.", severity: "warning" });
        return;
      }
      const errTbl = String(tableRow.errTblNmRaw ?? tableRow.errtblNm ?? "").trim();
      if (!errTbl) return;
      setConsistencyModal({
        open: true,
        tableLabel: cdmTableDisplayName(errTbl || tableRow.errtblNm),
        loading: true,
        errorMessage: undefined,
        missingFields: [],
        matchedFields: [],
      });
      try {
        const res = await DisclosureAPI.getConsistencyHeaderDetail(pblntSnNumber, selectedPtcpInstSn, errTbl);
        const d = res.data?.data as { missingFields?: string[]; matchedFields?: string[]; error?: string } | undefined;
        if (d?.error) {
          setConsistencyModal((m) => ({ ...m, loading: false, errorMessage: d.error }));
          return;
        }
        setConsistencyModal((m) => ({
          ...m,
          loading: false,
          missingFields: Array.isArray(d?.missingFields) ? d.missingFields : [],
          matchedFields: Array.isArray(d?.matchedFields) ? d.matchedFields : [],
        }));
      } catch (e: unknown) {
        let errMsg = "일관성 헤더 상세를 불러오지 못했습니다.";
        if (e instanceof HttpError) {
          const data = e.original.response?.data as { message?: string } | undefined;
          if (data?.message) errMsg = data.message;
        }
        setConsistencyModal((m) => ({
          ...m,
          loading: false,
          errorMessage: errMsg,
        }));
      }
    },
    [pblntSnNumber, selectedPtcpInstSn, showAlert]
  );

  const onConsistencyMetricClickForTable = useCallback(
    (tableRow: TableStats) => {
      const raw = rawTblUldStatsForSelectedPartner as any[];
      const errRaw = String(tableRow.errTblNmRaw ?? tableRow.errtblNm ?? "").trim();
      const grp = tableRow.uldVrfcGrpSn ?? null;
      const hasFn = raw.some((r) => {
        if (getVrfcRuleIdFromRow(r) == null) return false;
        if (getVrfcRuleTpCdFromRow(r) !== "FN") return false;
        const tnm = String(r.errTblNm ?? r.err_tbl_nm ?? "").trim();
        if (tnm !== errRaw) return false;
        if (grp != null) {
          const g = getUldVrfcGrpSnFromRow(r);
          if (g !== grp) return false;
        }
        return true;
      });
      if (hasFn) {
        openConsistencyFieldNameRulesForSelectedTable(tableRow);
        return;
      }
      void openConsistencyHeaderDetailForTable(tableRow);
    },
    [rawTblUldStatsForSelectedPartner, openConsistencyFieldNameRulesForSelectedTable, openConsistencyHeaderDetailForTable]
  );

  const resolvedPtcpInstSn = useMemo(() => {
    if (!pblntSnNumber) return null;
    if (selectedInstId) {
      const norm = (v: unknown) =>
        String(v ?? "")
          .trim()
          .toUpperCase();
      const target = norm(selectedInstId);
      const byInstId = partners.find((p: any) => norm(p?.instId ?? p?.inst_id ?? p?.brno) === target);
      if (byInstId) return Number(byInstId?.ptcpInstSn ?? byInstId?.ptcp_inst_sn);
    }
    if (selectedPtcpInstSn != null) {
      const bySn = partners.find((p: any) => (p?.ptcpInstSn ?? p?.ptcp_inst_sn) == selectedPtcpInstSn);
      if (bySn) return Number(bySn?.ptcpInstSn ?? bySn?.ptcp_inst_sn);
    }
    return null;
  }, [pblntSnNumber, partners, selectedInstId, selectedPtcpInstSn]);
  const selectedPartnerRow = useMemo(() => {
    if (selectedPtcpInstSn == null) return null;
    return partners.find((p: any) => Number(p?.ptcpInstSn ?? p?.ptcp_inst_sn) === Number(selectedPtcpInstSn)) ?? null;
  }, [partners, selectedPtcpInstSn]);
  const selectedIsStatusKind = useMemo(() => {
    if (selectedPartnerRow && normalizePartnerProgressStatus(selectedPartnerRow) === "04") return false;
    const fromPartner = selectedPartnerRow ? extractUldTypeCdFromPartner(selectedPartnerRow) : null;
    const stat = selectedPtcpInstSn != null ? institutionStats.find((s) => s.ptcpInstSn === selectedPtcpInstSn) : undefined;
    if (stat?.registrationCancelled) return false;
    const effective = fromPartner ?? ((stat?.totalCount ?? 0) > 0 ? "01" : null);
    return normalizeUldTypeCd(effective ?? undefined) === "02";
  }, [selectedPartnerRow, selectedPtcpInstSn, institutionStats]);
  /**
   * 그리드 업로드 유형이 '-' 인 경우: API에 uld_type_cd 없고 CDM 통계 건수도 없음 → 아직 데이터/현황 미등록.
   * UploadStatusSummary / PartnerInformationWrite 와 동일한 항목의 「입력 양식」을 읽기 전용으로 안내.
   */
  const selectedShowPendingStatusTemplate = useMemo(() => {
    if (selectedPtcpInstSn == null || selectedPartnerRow == null) return false;
    if (normalizePartnerProgressStatus(selectedPartnerRow) === "04") return false;
    if (allStatsLoading) return false;
    const raw = extractUldTypeCdFromPartner(selectedPartnerRow);
    if (raw != null && String(raw).trim() !== "") return false;
    const stat = institutionStats.find((s) => s.ptcpInstSn === selectedPtcpInstSn);
    if (stat?.registrationCancelled) return false;
    return (stat?.totalCount ?? 0) === 0;
  }, [selectedPtcpInstSn, selectedPartnerRow, institutionStats, allStatsLoading]);
  const { data: partnerInfoResponse } = useQuery({
    queryKey: ["partner-information", pblntSnNumber, resolvedPtcpInstSn],
    queryFn: () => DisclosureAPI.getPartnerInformation(pblntSnNumber!, resolvedPtcpInstSn!),
    enabled: !!pblntSnNumber && resolvedPtcpInstSn != null && selectedIsStatusKind,
    retry: false,
  });
  const { data: catalogListFromApi = [] } = useQuery({
    queryKey: ["cdm-catalog", pblntSnNumber, resolvedPtcpInstSn],
    queryFn: () => fetchCatalogList({ pblntSn: pblntSnNumber!, ptcpInstSn: resolvedPtcpInstSn! }),
    enabled: !!pblntSnNumber && resolvedPtcpInstSn != null && selectedIsStatusKind,
    retry: false,
  });
  const institutionDetailDataStatus = useMemo(() => {
    const formatDateString = (dateStr: string | null | undefined): string => {
      if (!dateStr) return "-";
      const trimmed = String(dateStr).trim();
      if (trimmed.length >= 8 && /^\d+$/.test(trimmed.replace(/\D/g, ""))) {
        const s = trimmed.replace(/\D/g, "").slice(0, 8);
        return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
      }
      return trimmed;
    };
    const raw = partnerInfoResponse?.data?.data as any;
    if (raw) {
      const v = raw.verInfoNm ?? raw.ver_info_nm ?? raw.verinfonm;
      const d = raw.lastUpdtYmd ?? raw.last_updt_ymd ?? raw.lastupdtymd;
      const c = raw.updtCycleCnt ?? raw.updt_cycle_cnt ?? raw.updtcyclecnt;
      return [
        { label: "CDM Version", value: v != null && String(v).trim() !== "" ? String(v) : "-" },
        { label: "Last Update", value: formatDateString(d) },
        { label: "Update Cycle", value: c != null ? `${c}` : "-" },
      ];
    }
    const target =
      resolvedPtcpInstSn != null ? partners.find((p: any) => (p?.ptcpInstSn ?? p?.ptcp_inst_sn) == resolvedPtcpInstSn) : null;
    if (!target) return [];
    const v = getPartnerField(target, "verInfoNm", "ver_info_nm", "verinfonm");
    const d = getPartnerField(target, "lastUpdtYmd", "last_updt_ymd", "lastupdtymd");
    const c = getPartnerField(target, "updtCycleCnt", "updt_cycle_cnt", "updtcyclecnt");
    return [
      { label: "CDM Version", value: v != null ? String(v) : "-" },
      { label: "Last Update", value: formatDateString(d as string) },
      { label: "Update Cycle", value: c != null ? `${c}` : "-" },
    ];
  }, [partnerInfoResponse, resolvedPtcpInstSn, partners, getPartnerField]);
  const selectedPartnerUploadStats = useMemo(() => {
    if (resolvedPtcpInstSn == null || !perPartnerStatsList?.length) return null;
    const matchSn = (s: any) => (s?.ptcpInstSn ?? s?.ptcp_inst_sn) == resolvedPtcpInstSn;
    return (perPartnerStatsList as any[]).find(matchSn) ?? null;
  }, [resolvedPtcpInstSn, perPartnerStatsList]);
  const omopDataForSelected = useMemo(() => {
    const stats = selectedPartnerUploadStats;
    const list = stats?.tblUldStatsHistList;
    if (!Array.isArray(list) || list.length === 0) return [];
    const omopTables = new Map<
      string,
      {
        totalCount: number;
        errorCount: number;
      }
    >();
    list.forEach((tbl: any) => {
      const tableName = tbl.errTblNm ?? tbl.errtblNm ?? tbl.errtblnm ?? tbl.errtbl_nm ?? "";
      const totalCount = Number(tbl.uldNocs ?? tbl.uldnocs ?? tbl.uld_nocs) || 0;
      const errorCount = Number(tbl.errNocs ?? tbl.errnocs ?? tbl.err_nocs) || 0;
      const trsfSeCd = normalizeCdmSeCode(tbl.trsfSeCd ?? tbl.trsfsecd ?? tbl.trsf_se_cd ?? "");
      if (trsfSeCd !== "01" && tableName.trim() !== "") {
        if (omopTables.has(tableName)) {
          const ex = omopTables.get(tableName)!;
          ex.totalCount += totalCount;
          ex.errorCount += errorCount;
        } else {
          omopTables.set(tableName, { totalCount, errorCount });
        }
      }
    });
    return Array.from(omopTables.entries()).map(([tableName, s]) => ({
      tableName: cdmTableDisplayName(tableName),
      scale: "",
      totalCount: s.totalCount,
      errorCount: s.errorCount,
    }));
  }, [selectedPartnerUploadStats]);
  const periodScaleList: Array<{
    trsfSeCd?: string;
    tblSeCd?: string;
    tnocs?: number;
    bgngYmd?: string;
    endYmd?: string;
  }> = useMemo(() => {
    const raw = partnerInfoResponse?.data?.data;
    if (!raw) return [];
    const list = (raw as any).periodScaleList ?? (raw as any).period_scale_list ?? [];
    return Array.isArray(list) ? list : [];
  }, [partnerInfoResponse]);
  const getPeriodScaleByKey = useCallback(
    (trsfSeCd: string, tblSeCd: string) => {
      const wantTr = normalizeCdmSeCode(trsfSeCd);
      const wantTbl = normalizeCdmSeCode(tblSeCd);
      return periodScaleList.find((p: any) => {
        const tr = normalizeCdmSeCode(p?.trsfSeCd ?? p?.trsf_se_cd ?? p?.trsfsecd);
        const tb = normalizeCdmSeCode(p?.tblSeCd ?? p?.tbl_se_cd ?? p?.tblsecd);
        return tr === wantTr && tb === wantTbl;
      });
    },
    [periodScaleList]
  );
  const formatYmd = (ymd: string | number | null | undefined) => {
    if (ymd == null || ymd === "") return "-";
    const s = String(ymd).replace(/\D/g, "").slice(0, 8);
    if (s.length !== 8) return "-";
    return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
  };
  const OMOP_PERIOD_SCALE_CONFIG: Array<{
    key: string;
    displayName: string;
    tblSeCd: string;
    type: "count" | "dateRange";
    label1?: string;
    label2?: string;
  }> = useMemo(
    () => [
      { key: "person", displayName: "person", tblSeCd: "12", type: "count" },
      {
        key: "observation_period",
        displayName: "observation_period",
        tblSeCd: "11",
        type: "dateRange",
        label1: "관찰 시작일",
        label2: "최종 방문일",
      },
      {
        key: "drug_exposure",
        displayName: "drug_exposure",
        tblSeCd: "13",
        type: "dateRange",
        label1: "약물 시작일",
        label2: "최종 약물처방일",
      },
      {
        key: "visit_occurrence",
        displayName: "visit_occurrence",
        tblSeCd: "14",
        type: "dateRange",
        label1: "방문 시작일",
        label2: "방문 종료일",
      },
      {
        key: "condition_occurrence",
        displayName: "condition_occurrence",
        tblSeCd: "15",
        type: "dateRange",
        label1: "상태 시작일",
        label2: "상태 종료일",
      },
      {
        key: "procedure_occurrence",
        displayName: "procedure_occurrence",
        tblSeCd: "16",
        type: "dateRange",
        label1: "시술 시작일",
        label2: "시술 종료일",
      },
      {
        key: "measurement",
        displayName: "measurement",
        tblSeCd: "17",
        type: "dateRange",
        label1: "측정 시작일",
        label2: "측정 종료일",
      },
      {
        key: "observation",
        displayName: "observation",
        tblSeCd: "18",
        type: "dateRange",
        label1: "관찰 시작일",
        label2: "관찰 종료일",
      },
      {
        key: "death",
        displayName: "death",
        tblSeCd: "19",
        type: "dateRange",
        label1: "사망 시작일",
        label2: "사망 종료일",
      },
    ],
    []
  );
  const SENTINEL_PERIOD_SCALE_CONFIG: Array<{
    key: string;
    displayName: string;
    tblSeCd: string;
    type: "count" | "dateRange";
    label1?: string;
    label2?: string;
  }> = useMemo(
    () => [
      { key: "Demographic", displayName: "Demographic", tblSeCd: "02", type: "count" },
      {
        key: "Enrollment",
        displayName: "Enrollment",
        tblSeCd: "01",
        type: "dateRange",
        label1: "최초 방문일",
        label2: "최종 방문일",
      },
      {
        key: "Dispensing",
        displayName: "Dispensing",
        tblSeCd: "03",
        type: "dateRange",
        label1: "최초 약물처방일",
        label2: "최종 약물처방일",
      },
      {
        key: "Encounter",
        displayName: "Encounter",
        tblSeCd: "04",
        type: "dateRange",
        label1: "방문 시작일",
        label2: "방문 종료일",
      },
      {
        key: "Diagnosis",
        displayName: "Diagnosis",
        tblSeCd: "05",
        type: "dateRange",
        label1: "진단 시작일",
        label2: "진단 종료일",
      },
      {
        key: "Procedure",
        displayName: "Procedure",
        tblSeCd: "06",
        type: "dateRange",
        label1: "시술 시작일",
        label2: "시술 종료일",
      },
      {
        key: "Laboratory_result",
        displayName: "Laboratory_result",
        tblSeCd: "07",
        type: "dateRange",
        label1: "검사 시작일",
        label2: "검사 종료일",
      },
      {
        key: "Vital_Signs",
        displayName: "Vital_Signs",
        tblSeCd: "08",
        type: "dateRange",
        label1: "측정 시작일",
        label2: "측정 종료일",
      },
      {
        key: "Death",
        displayName: "Death",
        tblSeCd: "09",
        type: "dateRange",
        label1: "사망 시작일",
        label2: "사망 종료일",
      },
      {
        key: "Cause_of_Death",
        displayName: "Cause_of_Death",
        tblSeCd: "10",
        type: "dateRange",
        label1: "사인 시작일",
        label2: "사인 종료일",
      },
    ],
    []
  );
  const normalizeTableKey = (displayName: string) => (displayName || "").toLowerCase().replace(/\s+/g, "_").trim();
  const catalogData = useMemo(() => {
    const list = Array.isArray(catalogListFromApi) ? catalogListFromApi : [];
    if (list.length === 0) return {};
    const grouped: Record<string, any[]> = {};
    list.forEach((item: any) => {
      const tblSeCd = normalizeCdmSeCode(item.tblSeCd ?? item.tbl_se_cd ?? item.tblsecd ?? "");
      if (!tblSeCd) return;
      if (!grouped[tblSeCd]) grouped[tblSeCd] = [];
      grouped[tblSeCd].push({
        number: grouped[tblSeCd].length + 1,
        columnName: item.colNm ?? item.col_nm ?? item.colnm ?? "",
        dataType: item.dataTypeNm ?? item.data_type_nm ?? item.datatypenm ?? "",
        nullYn: item.nulYn ?? item.nul_yn ?? item.nulyn ?? "N",
        pkYn: item.pkYn ?? item.pk_yn ?? item.pkyn ?? "",
        fkYn: item.fkYn ?? item.fk_yn ?? item.fkyn ?? "",
      });
    });
    return grouped;
  }, [catalogListFromApi]);
  const catalogTableKeys = useMemo(() => {
    const keys = Object.keys(catalogData).filter((k) => catalogData[k]?.length > 0);
    const order = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
    ];
    return order.filter((k) => keys.includes(k));
  }, [catalogData]);
  const [catalogCdmType, setCatalogCdmType] = useState("01");
  const [catalogTblSeCd, setCatalogTblSeCd] = useState("01");
  useEffect(() => {
    if (catalogTableKeys.length === 0) return;
    const first = catalogTableKeys[0];
    if (!catalogTableKeys.includes(catalogTblSeCd)) {
      setCatalogTblSeCd(first);
      setCatalogCdmType(Number(first) <= 10 ? "01" : "02");
    }
  }, [catalogTableKeys, catalogTblSeCd]);
  const catalogViewRows = catalogData[catalogTblSeCd] ?? [];
  /* ------------------------------
   * 참여기관 목록 테이블 행 데이터
   * ------------------------------ */
  const institutionRowData: InstitutionRow[] = useMemo(() => {
    return participatingPartners.map((partner: any, index: number) => {
      const sn = Number(partner?.ptcpInstSn ?? partner?.ptcp_inst_sn);
      const stat = institutionStats.find((s) => s.ptcpInstSn === sn);
      const cancelled = stat?.registrationCancelled === true || normalizePartnerProgressStatus(partner) === "04";
      const uldTypeRaw = extractUldTypeCdFromPartner(partner);
      /** API에 uld_type_cd 없을 때: CDM 통계(건수)가 있으면 데이터 업로드(01)로 표시 — DB 미확정·구데이터 대비 */
      const uldTypeDisplay = cancelled ? null : (uldTypeRaw ?? ((stat?.totalCount ?? 0) > 0 ? "01" : null));
      return {
        ptcpInstSn: sn,
        instId: String(stat?.instId ?? getPartnerField(partner, "instId", "inst_id") ?? "").trim(),
        rowNumber: index + 1,
        instNm: stat?.instNm ?? getPartnerField(partner, "instNm", "inst_nm") ?? "-",
        totalCount: stat?.totalCount ?? 0,
        errorCount: stat?.errorCount ?? 0,
        errorRate: stat?.errorRate ?? 0,
        uldCpct: stat?.uldCpct ?? null,
        uldTypeCd: uldTypeDisplay,
        registrationCancelled: cancelled,
      };
    });
  }, [participatingPartners, institutionStats, getPartnerField]);
  // 전체 통계 계산 — 보유건수/총건수·용량은 참여기관 전원(공시마감 등으로 참여취소된 기관 포함) 합산
  const totalStats = useMemo(() => {
    const totalCount = institutionStats.reduce((sum, stat) => sum + stat.totalCount, 0);
    const totalCapacityMb = institutionStats.reduce((sum, stat) => sum + (stat.uldCpct ?? 0), 0);
    const errorCount = tableStats.reduce(
      (sum, t) =>
        sum +
        (t.errNocs ?? 0) +
        (t.vrfcFnlErrNocs ?? 0) +
        (t.vrfcUnqErrNocs ?? 0) +
        (t.vrfcVldErrNocs ?? 0) +
        (t.vrfcNmlErrNocs ?? 0),
      0
    );
    // 종합 오류율(%) = (전체 5항목 오류합 ÷ 전체 총건수) × 100  (업로드 화면과 동일)
    const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;
    return { totalCount, totalCapacityMb, errorCount, errorRate };
  }, [institutionStats, tableStats]);
  const selectedInstitutionStat = useMemo(() => {
    if (selectedPtcpInstSn == null) return null;
    return institutionStats.find((s) => s.ptcpInstSn === selectedPtcpInstSn) ?? null;
  }, [institutionStats, selectedPtcpInstSn]);
  const selectedTableStatsFiltered = useMemo(() => {
    if (selectedInstitutionStat == null) return [];
    const name = selectedInstitutionStat.instNm?.trim();
    return tableStats.filter((t) => (t.instNm || "").trim() === name);
  }, [tableStats, selectedInstitutionStat]);
  const selectedTotalStats = useMemo(() => {
    if (selectedInstitutionStat == null) return null;
    const totalCount = selectedInstitutionStat.totalCount;
    const totalCapacityMb = selectedInstitutionStat.uldCpct ?? 0;
    const errorCount = selectedTableStatsFiltered.reduce(
      (sum, t) =>
        sum +
        (t.errNocs ?? 0) +
        (t.vrfcFnlErrNocs ?? 0) +
        (t.vrfcUnqErrNocs ?? 0) +
        (t.vrfcVldErrNocs ?? 0) +
        (t.vrfcNmlErrNocs ?? 0),
      0
    );
    const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;
    return { totalCount, totalCapacityMb, errorCount, errorRate };
  }, [selectedInstitutionStat, selectedTableStatsFiltered]);
  const formatCapacityMb = (mb: number): string => {
    const safeMb = Number(mb) || 0;
    if (safeMb <= 0) return "-";
    if (safeMb >= 1024) return `${(safeMb / 1024).toFixed(2)} GB`;
    return `${safeMb.toFixed(2)} MB`;
  };
  // 참여기관 정보 데이터 (필요 시 institutionStats로 rowData 구성)
  // 상세 테이블 정보 데이터
  type TableRow = TableStats & {
    rowNumber: number;
  };
  const selectedTableRowData = useMemo<TableRow[]>(() => {
    return selectedTableStatsFiltered.map((tbl, index) => ({
      ...tbl,
      rowNumber: selectedTableStatsFiltered.length - index,
    }));
  }, [selectedTableStatsFiltered]);
  /* ------------------------------
   * 상세 테이블 정보 컬럼 정의 (TableRow)
   * ------------------------------ */
  const tableColDefs = useMemo<ColDef<TableRow>[]>(
    () =>
      [
        {
          headerName: "번호",
          headerClass: "ag-header-center",
          field: "rowNumber",
          width: 60,
          cellStyle: { textAlign: "center" as const },
        },
        {
          headerName: "테이블명",
          field: "errtblNm",
          flex: 1,
          valueFormatter: (params) => {
            const row = params.data as TableStats | undefined;
            const tableName = cdmTableDisplayName(params.value ?? "");
            const instNm = row?.instNm?.trim();
            return instNm ? `${tableName} (${instNm})` : tableName;
          },
        },
        {
          headerName: "총건수",
          headerClass: "ag-header-center",
          field: "uldNocs",
          width: 100,
          cellStyle: { textAlign: "center" as const },
          valueFormatter: (params) => (params.data != null ? Number(params.data.uldNocs ?? 0).toLocaleString() : "-"),
        },
        {
          headerName: "일관성",
          headerClass: "ag-header-center",
          field: "errNocs",
          colId: "errNocs",
          width: 100,
          cellStyle: (params) => {
            const v = Number(params.value) || 0;
            return {
              textAlign: "center" as const,
              cursor: v > 0 ? ("pointer" as const) : ("default" as const),
              textDecoration: v > 0 ? "underline" : "none",
              color: v > 0 ? "#1565c0" : undefined,
            };
          },
          valueFormatter: (params) => {
            const row = params.data;
            if (!row) return "-";
            return Number(row.errNocs ?? 0).toLocaleString();
          },
          tooltipValueGetter: (p) => (Number(p.value) || 0) > 0 ? "클릭하여 CSV 헤더 불일치·일치 항목 보기" : "",
        },
        {
          headerName: "완전성",
          headerClass: "ag-header-center",
          field: "vrfcFnlErrNocs",
          width: 90,
          cellStyle: (params) => ({
            textAlign: "center" as const,
            color: (params.value ?? 0) > 0 ? "#d32f2f" : "#1976d2",
          }),
        },
        {
          headerName: "유일성",
          headerClass: "ag-header-center",
          field: "vrfcUnqErrNocs",
          width: 90,
          cellStyle: (params) => ({
            textAlign: "center" as const,
            color: (params.value ?? 0) > 0 ? "#d32f2f" : "#1976d2",
          }),
        },
        {
          headerName: "유효성",
          headerClass: "ag-header-center",
          field: "vrfcVldErrNocs",
          width: 90,
          cellStyle: (params) => {
            const v = Number(params.value) || 0;
            return {
              textAlign: "center" as const,
              color: v > 0 ? "#d32f2f" : "#1976d2",
              cursor: v > 0 ? ("pointer" as const) : ("default" as const),
              textDecoration: v > 0 ? "underline" : "none",
            };
          },
          tooltipValueGetter: (p) => (Number(p.value) || 0) > 0 ? "클릭하여 유효성 룰별 오류 건수 보기" : "",
        },
        {
          headerName: "정확성",
          headerClass: "ag-header-center",
          field: "vrfcNmlErrNocs",
          width: 90,
          cellStyle: (params) => ({
            textAlign: "center" as const,
            color: (params.value ?? 0) > 0 ? "#d32f2f" : "#1976d2",
          }),
        },
        {
          headerName: "오류율",
          headerClass: "ag-header-center",
          field: "errRt",
          width: 90,
          cellStyle: { textAlign: "center" as const },
          valueFormatter: (params) => (params.value != null ? `${Number(params.value).toFixed(2)} %` : "-"),
        },
      ] as ColDef<TableRow>[],
    []
  );
  if (!pblntSnNumber) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" color="error">
          공시번호가 없습니다.
        </Typography>
      </Box>
    );
  }
  return (
    <Box>
      {/* 공시 DATA 현황 */}
      <Box>
        <Typography variant="h6"> 공시데이터 현황 </Typography>
        <SpaceBox gap={CONTENT_GAP.SMALL} />
        {allStatsLoading ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2"> 데이터를 불러오는 중...</Typography>
          </Box>
        ) : (
          <div className="form_container">
            {/* 과제 내용 1 */}
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography variant="h6"> 보유건수 </Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography variant="body2"> {totalStats.totalCount.toLocaleString()} 건 </Typography>
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography variant="h6"> 용량 </Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography variant="body2"> {formatCapacityMb(totalStats.totalCapacityMb)} </Typography>
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography variant="h6"> 오류건수 </Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography variant="body2"> {totalStats.errorCount.toLocaleString()} 건 </Typography>
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography variant="h6"> 오류율 </Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography variant="body2" sx={{ color: "#d32f2f" }}>
                    {totalStats.errorRate.toFixed(2)} %
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </div>
        )}
      </Box>

      <SpaceBox gap={CONTENT_GAP.LARGE} />

      {/* 참여기관 목록 (데이터/현황 한 목록) */}
      <Box>
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            참여기관 목록
          </Typography>
        </Box>
        <SpaceBox gap={CONTENT_GAP.SMALL} />
        <div className="ag-theme-cdm w-full">
          <AgGridReact
            rowData={institutionRowData}
            columnDefs={institutionColDefs}
            domLayout="autoHeight"
            overlayNoRowsTemplate={`<span style="padding:8px;">데이터가 없습니다.</span>`}
            getRowId={(p) => String(p.data?.ptcpInstSn ?? "")}
            onRowClicked={(event) => {
              const d = event.data;
              const sn = d?.ptcpInstSn;
              if (sn != null) {
                setSelectedPtcpInstSn(Number(sn));
                setSelectedInstId(String(d?.instId ?? "").trim() || null);
              }
            }}
            getRowStyle={(params) => {
              const sn = params.data?.ptcpInstSn;
              return sn != null && selectedPtcpInstSn != null && Number(sn) === Number(selectedPtcpInstSn)
                ? {
                    backgroundColor: "rgba(25, 118, 210, 0.1)",
                    borderLeft: "4px solid #1976d2",
                    fontWeight: 500,
                  }
                : undefined;
            }}
            rowStyle={{ cursor: "pointer" }}
          />
        </div>
      </Box>

      <SpaceBox gap={CONTENT_GAP.LARGE} />

      {/* 선택: 업로드 유형 '-' — 현황정보 입력 양식 안내 (PartnerInformationWrite / UploadStatusSummary 참고) */}
      {selectedPtcpInstSn != null && selectedShowPendingStatusTemplate && (
        <Box>
          <Typography variant="subtitle1" color="primary" sx={{ mb: 1, fontWeight: 600 }}>
            현황정보 입력 안내 — {selectedPartnerRow?.instNm ?? "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            업로드 유형이 아직 지정되지 않았습니다(CDM 데이터·현황정보 미등록). 협력기관은 공시 상세에서 아래와 같은 항목을
            입력합니다. (읽기 전용 미리보기)
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Box className="sub_path">
              <Typography className="tit" variant="h5">
                CDM 현황정보
              </Typography>
            </Box>
            <Box sx={{ borderTop: "1px solid #000", borderBottom: "1px solid #e0e0e0" }}>
              <Stack direction="row" sx={{ borderBottom: "1px solid #e0e0e0" }}>
                <Box
                  sx={{
                    width: "130px",
                    minWidth: "130px",
                    bgcolor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1,
                    borderRight: "1px solid #e0e0e0",
                  }}
                >
                  <Typography sx={{ fontSize: "13px" }}>• CDM 버전</Typography>
                </Box>
                <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 2, py: 1 }}>
                  <TextField variant="outlined" size="small" fullWidth disabled placeholder="-" value="" />
                </Box>
              </Stack>
              <Stack direction="row">
                <Box
                  sx={{
                    width: "130px",
                    minWidth: "130px",
                    bgcolor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1,
                    borderRight: "1px solid #e0e0e0",
                  }}
                >
                  <Typography sx={{ fontSize: "13px" }}>• 최종 업데이트</Typography>
                </Box>
                <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 2, py: 1, borderRight: "1px solid #e0e0e0" }}>
                  <TextField variant="outlined" size="small" fullWidth disabled placeholder="YYYYMMDD" value="" />
                </Box>
                <Box
                  sx={{
                    width: "130px",
                    minWidth: "130px",
                    bgcolor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1,
                    borderRight: "1px solid #e0e0e0",
                  }}
                >
                  <Typography sx={{ fontSize: "13px" }}>• 업데이트 주기</Typography>
                </Box>
                <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 2, py: 1 }}>
                  <TextField variant="outlined" size="small" fullWidth disabled placeholder="일 단위" value="" />
                </Box>
              </Stack>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box className="sub_path">
              <Typography className="tit" variant="h5">
                CDM 테이블별 기간&규모
              </Typography>
            </Box>
            <TableContainer sx={{ borderBottom: "1px solid #e0e0e0" }}>
              <Table
                size="small"
                sx={{
                  "& .MuiTableCell-root": { fontSize: "13px", py: 1, borderColor: "#e0e0e0" },
                  borderCollapse: "separate",
                }}
              >
                <TableBody>
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      sx={{ bgcolor: "#ffffff", color: "#333", fontWeight: "bold", pl: 2, borderBottom: "1px solid #e0e0e0" }}
                    >
                      ▶ Sentinel
                    </TableCell>
                  </TableRow>
                  {[
                    "Demographic",
                    "Enrollment",
                    "Dispensing",
                    "Encounter",
                    "Diagnosis",
                    "Procedure",
                    "Laboratory_result",
                    "Vital_Signs",
                    "Death",
                    "Cause_of_Death",
                  ].map((label) => (
                    <TableRow key={label}>
                      <TableCell sx={{ width: "22%", fontWeight: 600 }}>{label}</TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth disabled placeholder="기간/건수" value="" />
                      </TableCell>
                      <TableCell sx={{ width: "12%" }} align="center">
                        ~
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth disabled placeholder="기간/건수" value="" />
                      </TableCell>
                      <TableCell sx={{ width: "8%" }} />
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      sx={{ bgcolor: "#ffffff", color: "#333", fontWeight: "bold", pl: 2, borderBottom: "1px solid #e0e0e0" }}
                    >
                      ▶ OMOP
                    </TableCell>
                  </TableRow>
                  {OMOP_PERIOD_SCALE_CONFIG.map((config) => (
                    <TableRow key={config.key}>
                      <TableCell sx={{ width: "22%", fontWeight: 600 }}>{config.displayName}</TableCell>
                      {config.type === "count" ? (
                        <TableCell colSpan={4}>
                          <TextField size="small" fullWidth disabled placeholder="총 건수" value="" />
                        </TableCell>
                      ) : (
                        <>
                          <TableCell>
                            <TextField size="small" fullWidth disabled placeholder={config.label1 ?? "시작"} value="" />
                          </TableCell>
                          <TableCell sx={{ width: "12%" }} align="center">
                            ~
                          </TableCell>
                          <TableCell>
                            <TextField size="small" fullWidth disabled placeholder={config.label2 ?? "종료"} value="" />
                          </TableCell>
                          <TableCell />
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box className="sub_path">
              <Typography className="tit" variant="h5">
                CDM 카탈로그
              </Typography>
            </Box>
            <Box sx={{ borderBottom: `1px solid ${CDM_INLINE_TABLE_BORDER}`, p: 2, pt: 0 }}>
              <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
                <Select size="small" value="01" disabled sx={{ minWidth: 120 }}>
                  {CDM_TYPE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                <Select size="small" value="12" disabled sx={{ minWidth: 210 }}>
                  {(CDM_TABLE_OPTIONS["02"] || []).map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
              <TableContainer sx={{ ...catalogTableContainerSx, borderTop: "1px solid #212124" }}>
                <Table sx={catalogTableSx}>
                  <TableHead>
                    <TableRow>
                      {["번호", "컬럼명", "데이터 타입", "Null 여부", "PK 여부", "FK 여부"].map((h) => (
                        <TableCell key={h}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 2, textAlign: "left" }}>
                        <Typography color="text.secondary" sx={{ fontSize: CDM_INLINE_TABLE_FS, lineHeight: 1.5 }}>
                          테이블별 컬럼 메타데이터를 행 단위로 등록합니다. (실제 입력은 협력기관 현황정보 등록 화면에서 수행)
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </Box>
      )}

      <SpaceBox gap={CONTENT_GAP.LARGE} />

      {/* 선택: CDM 데이터 업로드(01) — 기관별 데이터 상세 (데이터 없어도 동일 레이아웃) */}
      {selectedPtcpInstSn != null && !selectedIsStatusKind && !selectedShowPendingStatusTemplate && (
        <Box>
          <Typography variant="subtitle1" color="primary" sx={{ mb: 1, fontWeight: 600 }}>
            선택 기관 데이터 상세 — {selectedPartnerRow?.instNm ?? selectedInstitutionStat?.instNm ?? "-"}
          </Typography>
          <Box sx={{ mb: 1 }}>
            <Box className="sub_path">
              <Typography className="tit" variant="h5">
                공시데이터 현황 (선택 기관)
              </Typography>
            </Box>
          </Box>
          <SpaceBox gap={CONTENT_GAP.SMALL} />
          <Box sx={cdmReadOnlySectionBoxSx}>
            <Stack direction="row" sx={{ borderBottom: `1px solid ${AG_GRID_LIKE_BORDER}` }}>
              <Box sx={cdmReadOnlyLabelBoxSx}>
                <Typography sx={cdmReadOnlyLabelTypoSx}>• 보유건수</Typography>
              </Box>
              <Box sx={{ ...cdmReadOnlyValueBoxSx, borderRight: `1px solid ${AG_GRID_LIKE_BORDER}` }}>
                <Typography sx={{ fontSize: "1rem", fontFamily: AG_GRID_LIKE_FONT }}>
                  {allStatsLoading
                    ? "불러오는 중…"
                    : selectedTotalStats
                      ? `${selectedTotalStats.totalCount.toLocaleString()} 건`
                      : "데이터 없음"}
                </Typography>
              </Box>
              <Box sx={cdmReadOnlyLabelBoxSx}>
                <Typography sx={cdmReadOnlyLabelTypoSx}>• 용량</Typography>
              </Box>
              <Box sx={{ ...cdmReadOnlyValueBoxSx, borderRight: "none" }}>
                <Typography sx={{ fontSize: "1rem", fontFamily: AG_GRID_LIKE_FONT }}>
                  {allStatsLoading
                    ? "불러오는 중…"
                    : selectedTotalStats
                      ? formatCapacityMb(selectedTotalStats.totalCapacityMb)
                      : "데이터 없음"}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row">
              <Box sx={cdmReadOnlyLabelBoxSx}>
                <Typography sx={cdmReadOnlyLabelTypoSx}>• 오류건수</Typography>
              </Box>
              <Box sx={{ ...cdmReadOnlyValueBoxSx, borderRight: `1px solid ${AG_GRID_LIKE_BORDER}` }}>
                <Typography sx={{ fontSize: "1rem", fontFamily: AG_GRID_LIKE_FONT }}>
                  {allStatsLoading
                    ? "불러오는 중…"
                    : selectedTotalStats
                      ? `${selectedTotalStats.errorCount.toLocaleString()} 건`
                      : "데이터 없음"}
                </Typography>
              </Box>
              <Box sx={cdmReadOnlyLabelBoxSx}>
                <Typography sx={cdmReadOnlyLabelTypoSx}>• 오류율</Typography>
              </Box>
              <Box sx={{ ...cdmReadOnlyValueBoxSx, borderRight: "none" }}>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontFamily: AG_GRID_LIKE_FONT,
                    color: selectedTotalStats ? "#d32f2f" : "text.secondary",
                  }}
                >
                  {allStatsLoading
                    ? "불러오는 중…"
                    : selectedTotalStats
                      ? `${selectedTotalStats.errorRate.toFixed(2)} %`
                      : "데이터 없음"}
                </Typography>
              </Box>
            </Stack>
          </Box>
          <SpaceBox gap={CONTENT_GAP.MEDIUM} />
          <Box className="sub_path">
            <Typography className="tit" variant="h5">
              상세 테이블 정보 (선택 기관)
            </Typography>
          </Box>
          <SpaceBox gap={CONTENT_GAP.SMALL} />
          <div className="ag-theme-cdm w-full">
            <AgGridReact
              rowData={selectedTableRowData}
              columnDefs={tableColDefs}
              domLayout="autoHeight"
              overlayNoRowsTemplate={`<span style="padding:8px;">데이터가 없습니다.</span>`}
              onCellClicked={(e) => {
                const colId = e.column?.getColId();
                const row = e.data as TableRow | undefined;
                if (!row) return;
                if (colId === "errNocs" && (row.errNocs ?? 0) > 0) {
                  onConsistencyMetricClickForTable(row);
                  return;
                }
                if (colId === "vrfcVldErrNocs" && (row.vrfcVldErrNocs ?? 0) > 0) {
                  openValidityRuleBreakdownForSelectedTable(row);
                }
              }}
            />
          </div>
        </Box>
      )}

      <Dialog
        open={consistencyModal.open}
        onClose={() => setConsistencyModal((m) => ({ ...m, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>일관성 — CSV 헤더 ({consistencyModal.tableLabel})</DialogTitle>
        <DialogContent>
          {consistencyModal.loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : consistencyModal.errorMessage ? (
            <Typography color="error" sx={{ py: 1 }}>
              {consistencyModal.errorMessage}
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                기대 필드명 대비 CSV 헤더에 <strong>없음</strong>(불일치)과 <strong>있음</strong>(일치)입니다.
              </Typography>
              <Typography sx={{ fontWeight: 600, mb: 0.5, color: "error.main" }}>
                불일치 (CSV에 없는 기대 필드)
              </Typography>
              {consistencyModal.missingFields.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  없음
                </Typography>
              ) : (
                <Box component="ul" sx={{ m: 0, mb: 2, pl: 2.5, fontSize: "0.875rem" }}>
                  {consistencyModal.missingFields.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </Box>
              )}
              <Typography sx={{ fontWeight: 600, mb: 0.5, color: "success.dark" }}>
                일치 (CSV 헤더와 매칭)
              </Typography>
              {consistencyModal.matchedFields.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  없음
                </Typography>
              ) : (
                <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: "0.875rem" }}>
                  {consistencyModal.matchedFields.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={validityRuleModal.open}
        onClose={() => {
          setValidityRuleExpandedId(null);
          setValidityRuleModal((m) => ({ ...m, open: false }));
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {(validityRuleModal.dialogTitle ?? "유효성 검증 — 룰별 오류") + " (" + validityRuleModal.tableLabel + ")"}
        </DialogTitle>
        <DialogContent>
          {validityRuleModal.rules.length === 0 ? (
            <Typography variant="body2" sx={{ py: 1 }}>
              저장된 룰별 상세가 없습니다. DB 컬럼 반영 전 데이터이거나, 해당 검증에서 룰별 집계가 없는 경우입니다.
            </Typography>
          ) : (
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>룰 번호</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    오류 건수
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, width: 100 }}>
                    상세
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {validityRuleModal.rules.map((r) => {
                  const expanded = validityRuleExpandedId === r.ruleId;
                  const entries = vrfcRuleHistDetailEntries(r.detail);
                  const canExpand = hasVrfcRuleHistDetail(r.detail);
                  return (
                    <Fragment key={r.ruleId}>
                      <TableRow>
                        <TableCell>{r.ruleId}</TableCell>
                        <TableCell align="right">{r.count.toLocaleString("ko-KR")}</TableCell>
                        <TableCell align="center">
                          {canExpand ? (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                setValidityRuleExpandedId((prev) => (prev === r.ruleId ? null : r.ruleId))
                              }
                            >
                              {expanded ? "접기" : "상세"}
                            </Button>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                      {expanded && canExpand ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            sx={{ py: 1.5, px: 2, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}
                          >
                            <Box
                              component="dl"
                              sx={{
                                m: 0,
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "minmax(120px, 160px) 1fr" },
                                columnGap: 2,
                                rowGap: 0.75,
                                fontSize: "0.8125rem",
                              }}
                            >
                              {entries.map((e) => (
                                <Fragment key={`${r.ruleId}-${e.label}`}>
                                  <Typography component="dt" sx={{ fontWeight: 600, color: "text.secondary", m: 0 }}>
                                    {e.label}
                                  </Typography>
                                  <Typography component="dd" sx={{ m: 0, wordBreak: "break-word" }}>
                                    {e.value}
                                  </Typography>
                                </Fragment>
                              ))}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* 선택: 현황정보(02) */}
      {selectedPtcpInstSn != null && selectedIsStatusKind && resolvedPtcpInstSn != null && (
        <Box>
          <Typography variant="subtitle1" color="primary" sx={{ mb: 1, fontWeight: 600 }}>
            선택된 기관: {partners.find((p: any) => (p?.ptcpInstSn ?? p?.ptcp_inst_sn) == resolvedPtcpInstSn)?.instNm ?? "-"}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box className="sub_path">
              <Typography className="tit" variant="h5">
                기관 상세 정보
              </Typography>
            </Box>
            <Box sx={cdmReadOnlySectionBoxSx}>
              <Stack direction="row" sx={{ borderBottom: `1px solid ${AG_GRID_LIKE_BORDER}` }}>
                <Box sx={cdmReadOnlyLabelBoxSx}>
                  <Typography sx={cdmReadOnlyLabelTypoSx}>• CDM 버전</Typography>
                </Box>
                <Box sx={{ ...cdmReadOnlyValueBoxSx, borderRight: "none" }}>
                  <Typography sx={{ fontSize: "1rem", fontFamily: AG_GRID_LIKE_FONT }}>
                    {institutionDetailDataStatus.find((r) => r.label === "CDM Version")?.value || "-"}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row">
                <Box sx={cdmReadOnlyLabelBoxSx}>
                  <Typography sx={cdmReadOnlyLabelTypoSx}>• 최종 업데이트</Typography>
                </Box>
                <Box sx={cdmReadOnlyValueBoxSx}>
                  <Typography sx={{ fontSize: "1rem", fontFamily: AG_GRID_LIKE_FONT }}>
                    {institutionDetailDataStatus.find((r) => r.label === "Last Update")?.value || "-"}
                  </Typography>
                </Box>
                <Box sx={cdmReadOnlyLabelBoxSx}>
                  <Typography sx={cdmReadOnlyLabelTypoSx}>• 업데이트 주기</Typography>
                </Box>
                <Box sx={{ ...cdmReadOnlyValueBoxSx, borderRight: "none" }}>
                  <Typography sx={{ fontSize: "1rem", fontFamily: AG_GRID_LIKE_FONT }}>
                    {institutionDetailDataStatus.find((r) => r.label === "Update Cycle")?.value || "-"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          <SpaceBox gap={CONTENT_GAP.LARGE} />

          <Box sx={{ mb: 2 }}>
            <Box className="sub_path">
              <Typography className="tit" variant="h5">
                CDM 테이블별 기간&규모
              </Typography>
            </Box>
            <TableContainer
              sx={{
                ...catalogTableContainerSx,
                borderTop: "1px solid #212124",
              }}
            >
              <Table sx={periodReadonlyTableSx}>
                <TableBody>
                  {/* Sentinel (01) */}
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      sx={{
                        bgcolor: "#ffffff",
                        color: "#333",
                        fontWeight: "bold",
                        pl: 2,
                        borderBottom: "1px solid #e0e0e0",
                      }}
                    >
                      ▶ Sentinel
                    </TableCell>
                  </TableRow>
                  {SENTINEL_PERIOD_SCALE_CONFIG.map((config) =>
                    config.type === "count" ? (
                      <TableRow key={config.key}>
                        <TableCell sx={periodReadonlyFirstColSx}>{config.displayName}</TableCell>
                        <TableCell
                          sx={{
                            bgcolor: AG_GRID_LIKE_HEADER_BG,
                            fontWeight: 600,
                            width: "160px",
                            borderRight: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
                          }}
                        >
                          • 총 건수
                        </TableCell>
                        <TableCell colSpan={3}>
                          {(() => {
                            const val =
                              getPeriodScaleByKey("01", config.tblSeCd)?.tnocs ??
                              getPeriodScaleByKey("02", config.tblSeCd)?.tnocs ??
                              (getPeriodScaleByKey("01", config.tblSeCd) as any)?.tnocs ??
                              (getPeriodScaleByKey("02", config.tblSeCd) as any)?.tnocs;
                            return val != null ? `${Number(val).toLocaleString()} 건` : "-";
                          })()}
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={config.key}>
                        <TableCell sx={periodReadonlyFirstColSx}>{config.displayName}</TableCell>
                        <TableCell
                          sx={{
                            bgcolor: AG_GRID_LIKE_HEADER_BG,
                            color: "#555",
                            width: "150px",
                            borderRight: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
                          }}
                        >
                          • {config.label1}
                        </TableCell>
                        <TableCell sx={{ borderRight: `1px solid ${CDM_INLINE_TABLE_BORDER}` }}>
                          {formatYmd(
                            getPeriodScaleByKey("01", config.tblSeCd)?.bgngYmd ??
                              getPeriodScaleByKey("02", config.tblSeCd)?.bgngYmd ??
                              (getPeriodScaleByKey("01", config.tblSeCd) as any)?.bgng_ymd ??
                              (getPeriodScaleByKey("02", config.tblSeCd) as any)?.bgng_ymd
                          )}
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: AG_GRID_LIKE_HEADER_BG,
                            color: "#555",
                            width: "150px",
                            borderRight: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
                          }}
                        >
                          • {config.label2}
                        </TableCell>
                        <TableCell>
                          {formatYmd(
                            getPeriodScaleByKey("01", config.tblSeCd)?.endYmd ??
                              getPeriodScaleByKey("02", config.tblSeCd)?.endYmd ??
                              (getPeriodScaleByKey("01", config.tblSeCd) as any)?.end_ymd ??
                              (getPeriodScaleByKey("02", config.tblSeCd) as any)?.end_ymd
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  )}

                  {/* OMOP (02) */}
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      sx={{
                        bgcolor: "#ffffff",
                        color: "#333",
                        fontWeight: "bold",
                        pl: 2,
                        borderBottom: "1px solid #e0e0e0",
                      }}
                    >
                      ▶ OMOP
                    </TableCell>
                  </TableRow>
                  {OMOP_PERIOD_SCALE_CONFIG.map((config) =>
                    config.type === "count" ? (
                      <TableRow key={config.key}>
                        <TableCell sx={periodReadonlyFirstColSx}>{config.displayName}</TableCell>
                        <TableCell
                          sx={{
                            bgcolor: AG_GRID_LIKE_HEADER_BG,
                            fontWeight: 600,
                            width: "160px",
                            borderRight: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
                          }}
                        >
                          • 총 건수
                        </TableCell>
                        <TableCell colSpan={3}>
                          {(() => {
                            const row = omopDataForSelected.find((r: any) => {
                              const n = normalizeTableKey(r.tableName || "");
                              return n === config.key || n.includes(config.key) || config.key.includes(n);
                            });
                            const val =
                              row?.totalCount ??
                              getPeriodScaleByKey("02", config.tblSeCd)?.tnocs ??
                              getPeriodScaleByKey("01", config.tblSeCd)?.tnocs ??
                              (getPeriodScaleByKey("02", config.tblSeCd) as any)?.tnocs ??
                              (getPeriodScaleByKey("01", config.tblSeCd) as any)?.tnocs;
                            return val != null ? `${Number(val).toLocaleString()} 건` : "-";
                          })()}
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={config.key}>
                        <TableCell sx={periodReadonlyFirstColSx}>{config.displayName}</TableCell>
                        <TableCell
                          sx={{
                            bgcolor: AG_GRID_LIKE_HEADER_BG,
                            color: "#555",
                            width: "150px",
                            borderRight: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
                          }}
                        >
                          • {config.label1}
                        </TableCell>
                        <TableCell sx={{ borderRight: `1px solid ${CDM_INLINE_TABLE_BORDER}` }}>
                          {formatYmd(
                            getPeriodScaleByKey("02", config.tblSeCd)?.bgngYmd ??
                              getPeriodScaleByKey("01", config.tblSeCd)?.bgngYmd ??
                              (getPeriodScaleByKey("02", config.tblSeCd) as any)?.bgng_ymd ??
                              (getPeriodScaleByKey("01", config.tblSeCd) as any)?.bgng_ymd
                          )}
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: AG_GRID_LIKE_HEADER_BG,
                            color: "#555",
                            width: "150px",
                            borderRight: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
                          }}
                        >
                          • {config.label2}
                        </TableCell>
                        <TableCell>
                          {formatYmd(
                            getPeriodScaleByKey("02", config.tblSeCd)?.endYmd ??
                              getPeriodScaleByKey("01", config.tblSeCd)?.endYmd ??
                              (getPeriodScaleByKey("02", config.tblSeCd) as any)?.end_ymd ??
                              (getPeriodScaleByKey("01", config.tblSeCd) as any)?.end_ymd
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <SpaceBox gap={CONTENT_GAP.LARGE} />

          <Box sx={{ mb: 4 }}>
            <Box className="sub_path">
              <Typography className="tit" variant="h5">
                CDM 카탈로그
              </Typography>
            </Box>
            {catalogTableKeys.length === 0 ? (
              <Box
                sx={{
                  borderTop: "1px solid #212124",
                  borderBottom: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
                  borderLeft: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
                  borderRight: `1px solid ${CDM_INLINE_TABLE_BORDER}`,
                  p: 2,
                }}
              >
                <Typography color="text.secondary" sx={{ fontSize: CDM_INLINE_TABLE_FS }}>
                  입력된 카탈로그가 없습니다.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ borderBottom: `1px solid ${CDM_INLINE_TABLE_BORDER}`, p: 2, pt: 0 }}>
                <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
                  <Select
                    size="small"
                    value={catalogCdmType}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCatalogCdmType(v);
                      const opts = CDM_TABLE_OPTIONS[v] || [];
                      const firstInRange = catalogTableKeys.find((k) => opts.some((o) => o.value === k));
                      if (firstInRange) setCatalogTblSeCd(firstInRange);
                    }}
                    sx={{ minWidth: 120 }}
                  >
                    {CDM_TYPE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <Select
                    size="small"
                    value={catalogTblSeCd}
                    onChange={(e) => setCatalogTblSeCd(e.target.value)}
                    sx={{ minWidth: 210 }}
                  >
                    {(CDM_TABLE_OPTIONS[catalogCdmType] || [])
                      .filter((opt) => catalogTableKeys.includes(opt.value))
                      .map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                  </Select>
                </Stack>
                <TableContainer sx={{ ...catalogTableContainerSx, borderTop: "1px solid #212124" }}>
                  <Table sx={catalogTableSx}>
                    <TableHead>
                      <TableRow>
                        {["번호", "컬럼명", "데이터 타입", "Null 여부", "PK 여부", "FK 여부"].map((h) => (
                          <TableCell key={h}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {catalogViewRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ py: 2, textAlign: "left" }}>
                            <Typography color="text.secondary" sx={{ fontSize: CDM_INLINE_TABLE_FS, lineHeight: 1.5 }}>
                              데이터가 없습니다.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        catalogViewRows.map((row: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell sx={{ width: "72px" }}>{row.number ?? index + 1}</TableCell>
                            <TableCell>{row.columnName ?? ""}</TableCell>
                            <TableCell sx={{ width: "180px" }}>{row.dataType ?? ""}</TableCell>
                            <TableCell sx={{ width: "88px" }}>{row.nullYn === "Y" ? "Y" : "N"}</TableCell>
                            <TableCell sx={{ width: "88px" }}>{row.pkYn === "Y" ? "Y" : "N"}</TableCell>
                            <TableCell sx={{ width: "88px" }}>{row.fkYn === "Y" ? "Y" : "N"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <SpaceBox gap={CONTENT_GAP.SMALL} />

      {/* 하단: 공시 상세로 복귀 */}
      <Box className="btn_container btn_right">
        <Button
          variant="outlined"
          onClick={() => {
            navigate(routes.CDM.DISCLOSURES_ADMIN);
          }}
        >
          공시목록
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            if (pblntSnNumber != null && !Number.isNaN(pblntSnNumber)) {
              navigate(`${routes.CDM.DISCLOSURE_DETAIL}?pblntSn=${pblntSnNumber}`);
            } else {
              navigate(routes.CDM.DISCLOSURES);
            }
          }}
        >
          공시상세
        </Button>
      </Box>
    </Box>
  );
}
