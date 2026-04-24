import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Link,
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
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { koKR } from "@mui/x-date-pickers/locales";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { Helmet } from "react-helmet";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  type PeriodScaleItem,
  confirmCdmCurrentInfo,
  deleteCatalog,
  fetchCatalogList,
  fetchPeriodScaleList,
  fetchStatusDetail,
  insertCatalog,
  insertPeriodScale,
  updateCatalog,
  updateCdmCurrentInfo,
  updatePeriodScale,
} from "@/api/pstinfoApi";
import { normalizeCdmSeCode } from "@/utils/cdmTableUtils";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import tempCsvUrl from "./temp.csv?url";

/* ================================================================
 * 타입
 * ================================================================ */
interface CatalogRowItem {
  localId: number;
  uldListSn?: number;
  tblSeCd: string;
  colNm: string;
  dataTypeNm: string;
  nulYn: string;
  pkYn: string;
  fkYn: string;
  isNew?: boolean;
}

const CDM_TYPE_OPTIONS = [
  { value: "01", label: "Sentinel" },
  { value: "02", label: "OMOP" },
];

const CDM_TABLE_OPTIONS: Record<string, { value: string; label: string }[]> = {
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

const toDayjs = (ymd: string | null | undefined): dayjs.Dayjs | null => {
  if (!ymd) return null;
  const s = String(ymd).replace(/-/g, "");
  if (s.length === 8) return dayjs(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`);
  return dayjs(ymd);
};
const toYmd = (d: dayjs.Dayjs | null): string => (d ? d.format("YYYYMMDD") : "");

/** selectStatusDetail 응답: Jackson camelCase 또는 snake_case 모두 대응 */
function readPrstDetailFields(sd: Record<string, unknown> | null | undefined) {
  if (!sd) {
    return {
      verInfoNm: "",
      lastUpdtYmd: undefined as string | undefined,
      updtCycleCnt: undefined as string | number | undefined,
    };
  }
  const verInfoNm = String(sd.verInfoNm ?? sd.ver_info_nm ?? "");
  const lastUpdtYmd = (sd.lastUpdtYmd ?? sd.last_updt_ymd) as string | undefined;
  const updtCycleCnt = sd.updtCycleCnt ?? sd.updt_cycle_cnt;
  return { verInfoNm, lastUpdtYmd, updtCycleCnt };
}

const filterNoKorean = (value: string) => value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
const filterNumberOnly = (value: string) => value.replace(/[^0-9]/g, "");

const DATA_TYPES = ["VARCHAR", "INTEGER", "BIGINT", "NUMERIC", "DATE", "TIMESTAMP", "BOOLEAN", "TEXT", "CHAR"];

/** CSV data_type → Select 옵션 값 */
const DATA_TYPE_ALIASES: Record<string, string> = {
  INT: "INTEGER",
  INTEGER: "INTEGER",
  BIGINT: "BIGINT",
  SMALLINT: "INTEGER",
  VARCHAR: "VARCHAR",
  CHAR: "CHAR",
  TEXT: "TEXT",
  STRING: "VARCHAR",
  NUMERIC: "NUMERIC",
  DECIMAL: "NUMERIC",
  FLOAT: "NUMERIC",
  DOUBLE: "NUMERIC",
  REAL: "NUMERIC",
  DATE: "DATE",
  TIMESTAMP: "TIMESTAMP",
  DATETIME: "TIMESTAMP",
  BOOLEAN: "BOOLEAN",
  BOOL: "BOOLEAN",
  BIT: "BOOLEAN",
};

function normalizeCatalogDataType(raw: string): string {
  const u = raw.trim().toUpperCase();
  if (!u) return "";
  if (DATA_TYPES.includes(u)) return u;
  return DATA_TYPE_ALIASES[u] || u;
}

function parseCsvCatalogTemplate(text: string): { rows: Omit<CatalogRowItem, "localId" | "isNew">[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) {
    return { rows: [], errors: ["데이터 행이 없습니다."] };
  }

  const headerCells = lines[0].split(",").map((c) => c.trim().toLowerCase());
  const idx = (name: string) => headerCells.indexOf(name.toLowerCase());
  const iCdm = idx("cdm");
  const iTable = idx("table_name");
  const iCol = idx("column_name");
  const iDt = idx("data_type");
  const iNul = idx("nullable");
  const iPk = idx("pk");
  const iFk = idx("fk");
  if (iCdm < 0 || iTable < 0 || iCol < 0 || iDt < 0 || iNul < 0 || iPk < 0 || iFk < 0) {
    return {
      rows: [],
      errors: ["헤더에 CDM, table_name, column_name, data_type, nullable, PK, FK 컬럼이 필요합니다."],
    };
  }

  const cdmNameToCd = (name: string): string | null => {
    const n = name.trim().toLowerCase();
    if (n === "sentinel") return "01";
    if (n === "omop") return "02";
    return null;
  };

  const resolveTblSeCd = (cdmCd: string, tableLabel: string): string | null => {
    const t = tableLabel.trim();
    const opts = CDM_TABLE_OPTIONS[cdmCd];
    if (!opts) return null;
    const found = opts.find((o) => o.label.toLowerCase() === t.toLowerCase());
    return found?.value ?? null;
  };

  const flag01 = (v: string): "Y" | "N" => {
    const s = v.trim();
    if (s === "1" || s.toLowerCase() === "y" || s.toLowerCase() === "true") return "Y";
    return "N";
  };

  const rows: Omit<CatalogRowItem, "localId" | "isNew">[] = [];
  for (let lineNo = 2; lineNo <= lines.length; lineNo++) {
    const cells = lines[lineNo - 1].split(",").map((c) => c.trim());
    const cdm = cells[iCdm] ?? "";
    const tableName = cells[iTable] ?? "";
    const colNm = cells[iCol] ?? "";
    const dataTypeRaw = cells[iDt] ?? "";
    const nulRaw = cells[iNul] ?? "";
    const pkRaw = cells[iPk] ?? "";
    const fkRaw = cells[iFk] ?? "";

    const cdmCd = cdmNameToCd(cdm);
    if (!cdmCd) {
      errors.push(`${lineNo}행: CDM "${cdm}" — Sentinel 또는 OMOP만 지원합니다.`);
      continue;
    }
    const tblSeCd = resolveTblSeCd(cdmCd, tableName);
    if (!tblSeCd) {
      errors.push(`${lineNo}행: table_name "${tableName}"을(를) CDM 유형에 맞는 테이블로 찾지 못했습니다.`);
      continue;
    }
    if (!colNm) {
      errors.push(`${lineNo}행: column_name이 비어 있습니다.`);
      continue;
    }

    rows.push({
      tblSeCd,
      colNm: filterNoKorean(colNm),
      dataTypeNm: normalizeCatalogDataType(dataTypeRaw),
      nulYn: flag01(nulRaw),
      pkYn: flag01(pkRaw),
      fkYn: flag01(fkRaw),
    });
  }

  return { rows, errors };
}

function CdmDatePicker({ value, onChange }: { value: dayjs.Dayjs | null; onChange: (v: dayjs.Dayjs | null) => void }) {
  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale="ko"
      localeText={koKR.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <DatePicker
        format="YYYY-MM-DD"
        value={value}
        onChange={onChange}
        slotProps={{
          textField: { size: "small", fullWidth: true },
          calendarHeader: { format: "YYYY년 M월" },
        }}
      />
    </LocalizationProvider>
  );
}

function PeriodDateRow({
  label,
  startLabel,
  endLabel,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: {
  label: string;
  startLabel: string;
  endLabel: string;
  startValue: dayjs.Dayjs | null;
  endValue: dayjs.Dayjs | null;
  onStartChange: (v: dayjs.Dayjs | null) => void;
  onEndChange: (v: dayjs.Dayjs | null) => void;
}) {
  const isInvalid = !!(startValue && endValue && endValue.isBefore(startValue));

  return (
    <TableRow>
      <TableCell sx={{ bgcolor: "#f7f7f7", width: "180px", borderRight: "1px solid #e0e0e0" }}>{label}</TableCell>
      <TableCell sx={{ bgcolor: "#f7f7f7", width: "150px", color: "#555", borderRight: "1px solid #e0e0e0" }}>
        • {startLabel}
      </TableCell>
      <TableCell>
        <CdmDatePicker value={startValue} onChange={onStartChange} />
      </TableCell>
      <TableCell sx={{ bgcolor: "#f7f7f7", width: "150px", color: "#555" }}>• {endLabel}</TableCell>
      <TableCell>
        <CdmDatePicker value={endValue} onChange={onEndChange} />
        {isInvalid && (
          <Typography sx={{ fontSize: "11px", color: "#d32f2f", mt: 0.3 }}>종료일이 시작일보다 이전입니다.</Typography>
        )}
      </TableCell>
    </TableRow>
  );
}

function PeriodCountRow({
  label,
  value,
  onChange,
  topBorder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  topBorder?: boolean;
}) {
  return (
    <TableRow sx={topBorder ? { "& .MuiTableCell-root": { borderTop: "1px solid #000 !important" } } : {}}>
      <TableCell sx={{ bgcolor: "#f7f7f7", borderRight: "1px solid #e0e0e0" }}>{label}</TableCell>
      <TableCell sx={{ bgcolor: "#f7f7f7", color: "#555", borderRight: "1px solid #e0e0e0" }}>• 총 건수</TableCell>
      <TableCell colSpan={3}>
        <TextField size="small" sx={{ width: "50%" }} value={value} onChange={(e) => onChange(e.target.value)} />
      </TableCell>
    </TableRow>
  );
}

export default function PartnerInformationWrite() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const queryClient = useQueryClient();

  const pblntSn = searchParams.get("pblntSn") ? Number(searchParams.get("pblntSn")) : null;
  const ptcpInstSn = searchParams.get("ptcpInstSn") ? Number(searchParams.get("ptcpInstSn")) : null;

  const [verInfoNm, setVerInfoNm] = useState("");
  const [lastUpdtYmd, setLastUpdtYmd] = useState<dayjs.Dayjs | null>(() => dayjs());
  const [updtCycleCnt, setUpdtCycleCnt] = useState("");

  /** 테이블별 기간 공통 기본값 — 오늘로 시작, 변경 시 아래 모든 행의 시작/종료에 각각 반영 */
  const [defaultPeriodStart, setDefaultPeriodStart] = useState<dayjs.Dayjs | null>(() => dayjs());
  const [defaultPeriodEnd, setDefaultPeriodEnd] = useState<dayjs.Dayjs | null>(() => dayjs());

  const [s01Bgng, setS01Bgng] = useState<dayjs.Dayjs | null>(null);
  const [s01End, setS01End] = useState<dayjs.Dayjs | null>(null);
  const [s01Sn, setS01Sn] = useState<number | undefined>();
  const [s02Tnocs, setS02Tnocs] = useState("");
  const [s02Sn, setS02Sn] = useState<number | undefined>();
  const [s03Bgng, setS03Bgng] = useState<dayjs.Dayjs | null>(null);
  const [s03End, setS03End] = useState<dayjs.Dayjs | null>(null);
  const [s03Sn, setS03Sn] = useState<number | undefined>();
  const [s04Bgng, setS04Bgng] = useState<dayjs.Dayjs | null>(null);
  const [s04End, setS04End] = useState<dayjs.Dayjs | null>(null);
  const [s04Sn, setS04Sn] = useState<number | undefined>();
  const [s05Bgng, setS05Bgng] = useState<dayjs.Dayjs | null>(null);
  const [s05End, setS05End] = useState<dayjs.Dayjs | null>(null);
  const [s05Sn, setS05Sn] = useState<number | undefined>();
  const [s06Bgng, setS06Bgng] = useState<dayjs.Dayjs | null>(null);
  const [s06End, setS06End] = useState<dayjs.Dayjs | null>(null);
  const [s06Sn, setS06Sn] = useState<number | undefined>();
  const [s07Bgng, setS07Bgng] = useState<dayjs.Dayjs | null>(null);
  const [s07End, setS07End] = useState<dayjs.Dayjs | null>(null);
  const [s07Sn, setS07Sn] = useState<number | undefined>();
  const [s08Bgng, setS08Bgng] = useState<dayjs.Dayjs | null>(null);
  const [s08End, setS08End] = useState<dayjs.Dayjs | null>(null);
  const [s08Sn, setS08Sn] = useState<number | undefined>();
  const [s09Bgng, setS09Bgng] = useState<dayjs.Dayjs | null>(null);
  const [s09End, setS09End] = useState<dayjs.Dayjs | null>(null);
  const [s09Sn, setS09Sn] = useState<number | undefined>();
  const [s10Bgng, setS10Bgng] = useState<dayjs.Dayjs | null>(null);
  const [s10End, setS10End] = useState<dayjs.Dayjs | null>(null);
  const [s10Sn, setS10Sn] = useState<number | undefined>();

  const [o11Bgng, setO11Bgng] = useState<dayjs.Dayjs | null>(null);
  const [o11End, setO11End] = useState<dayjs.Dayjs | null>(null);
  const [o11Sn, setO11Sn] = useState<number | undefined>();
  const [o12Tnocs, setO12Tnocs] = useState("");
  const [o12Sn, setO12Sn] = useState<number | undefined>();
  const [o13Bgng, setO13Bgng] = useState<dayjs.Dayjs | null>(null);
  const [o13End, setO13End] = useState<dayjs.Dayjs | null>(null);
  const [o13Sn, setO13Sn] = useState<number | undefined>();
  const [o14Bgng, setO14Bgng] = useState<dayjs.Dayjs | null>(null);
  const [o14End, setO14End] = useState<dayjs.Dayjs | null>(null);
  const [o14Sn, setO14Sn] = useState<number | undefined>();
  const [o15Bgng, setO15Bgng] = useState<dayjs.Dayjs | null>(null);
  const [o15End, setO15End] = useState<dayjs.Dayjs | null>(null);
  const [o15Sn, setO15Sn] = useState<number | undefined>();
  const [o16Bgng, setO16Bgng] = useState<dayjs.Dayjs | null>(null);
  const [o16End, setO16End] = useState<dayjs.Dayjs | null>(null);
  const [o16Sn, setO16Sn] = useState<number | undefined>();
  const [o17Bgng, setO17Bgng] = useState<dayjs.Dayjs | null>(null);
  const [o17End, setO17End] = useState<dayjs.Dayjs | null>(null);
  const [o17Sn, setO17Sn] = useState<number | undefined>();
  const [o18Bgng, setO18Bgng] = useState<dayjs.Dayjs | null>(null);
  const [o18End, setO18End] = useState<dayjs.Dayjs | null>(null);
  const [o18Sn, setO18Sn] = useState<number | undefined>();
  const [o19Bgng, setO19Bgng] = useState<dayjs.Dayjs | null>(null);
  const [o19End, setO19End] = useState<dayjs.Dayjs | null>(null);
  const [o19Sn, setO19Sn] = useState<number | undefined>();

  const [catalogList, setCatalogList] = useState<CatalogRowItem[]>([]);
  /** 템플릿 CSV 파싱 오류를 카탈로그 영역에 고정 표시 */
  const [templateLoadIssue, setTemplateLoadIssue] = useState<
    { kind: "fatal"; messages: string[] } | { kind: "partial"; messages: string[] } | null
  >(null);
  const [nextLocalId, setNextLocalId] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isStatusLocked, setIsStatusLocked] = useState(false);

  const debugLog = useCallback((..._args: unknown[]) => {}, []);

  const [catalogCdmType, setCatalogCdmType] = useState("01");
  const [catalogTblSeCd, setCatalogTblSeCd] = useState("01");

  const applyDefaultStartToAllTableRows = useCallback((v: dayjs.Dayjs | null) => {
    setS01Bgng(v);
    setS03Bgng(v);
    setS04Bgng(v);
    setS05Bgng(v);
    setS06Bgng(v);
    setS07Bgng(v);
    setS08Bgng(v);
    setS09Bgng(v);
    setS10Bgng(v);
    setO11Bgng(v);
    setO13Bgng(v);
    setO14Bgng(v);
    setO15Bgng(v);
    setO16Bgng(v);
    setO17Bgng(v);
    setO18Bgng(v);
    setO19Bgng(v);
  }, []);

  const applyDefaultEndToAllTableRows = useCallback((v: dayjs.Dayjs | null) => {
    setS01End(v);
    setS03End(v);
    setS04End(v);
    setS05End(v);
    setS06End(v);
    setS07End(v);
    setS08End(v);
    setS09End(v);
    setS10End(v);
    setO11End(v);
    setO13End(v);
    setO14End(v);
    setO15End(v);
    setO16End(v);
    setO17End(v);
    setO18End(v);
    setO19End(v);
  }, []);

  const handleDefaultPeriodStartChange = useCallback(
    (v: dayjs.Dayjs | null) => {
      setDefaultPeriodStart(v);
      applyDefaultStartToAllTableRows(v);
    },
    [applyDefaultStartToAllTableRows]
  );

  const handleDefaultPeriodEndChange = useCallback(
    (v: dayjs.Dayjs | null) => {
      setDefaultPeriodEnd(v);
      applyDefaultEndToAllTableRows(v);
    },
    [applyDefaultEndToAllTableRows]
  );

  /** 최초 1회만 상단 기본일(오늘)을 테이블 전체에 채움 — 이후 서버 데이터 로드 effect가 덮어씀 */
  useEffect(() => {
    const s = dayjs();
    const e = dayjs();
    applyDefaultStartToAllTableRows(s);
    applyDefaultEndToAllTableRows(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 1회만
  }, []);

  const handleCatalogCdmTypeChange = (value: string) => {
    setCatalogCdmType(value);
    setCatalogTblSeCd(CDM_TABLE_OPTIONS[value]?.[0]?.value || "01");
  };

  useEffect(() => {
    document.title = "CDM 현황정보 등록";
  }, []);

  const { data: statusDetail } = useQuery({
    queryKey: ["cdm-status-detail", pblntSn, ptcpInstSn],
    queryFn: () => {
      if (!pblntSn || !ptcpInstSn) return null;
      return fetchStatusDetail({ pblntSn, ptcpInstSn });
    },
    enabled: !!pblntSn && !!ptcpInstSn,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: periodScaleList = [] } = useQuery({
    queryKey: ["cdm-period-scale", pblntSn, ptcpInstSn],
    queryFn: () => {
      if (!pblntSn || !ptcpInstSn) return [];
      return fetchPeriodScaleList({ pblntSn, ptcpInstSn });
    },
    enabled: !!pblntSn && !!ptcpInstSn,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: catalogData = [] } = useQuery({
    queryKey: ["cdm-catalog", pblntSn, ptcpInstSn],
    queryFn: () => {
      if (!pblntSn || !ptcpInstSn) return [];
      return fetchCatalogList({ pblntSn, ptcpInstSn });
    },
    enabled: !!pblntSn && !!ptcpInstSn,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });

  /* tb_cm_m_uld_prst 상세: 카탈로그/기간과 독립 적용 — 재등록요청(07) 후 재진입 시에도 상세가 늦게 도착해도 반영 */
  useEffect(() => {
    if (statusDetail === undefined) return;
    const raw = statusDetail as Record<string, unknown> | null | undefined;
    const p = readPrstDetailFields(raw);
    setVerInfoNm(p.verInfoNm || "");
    setLastUpdtYmd(toDayjs(p.lastUpdtYmd));
    setUpdtCycleCnt(p.updtCycleCnt != null ? String(p.updtCycleCnt) : "");
    const rawUldType = (raw?.uldTypeCd ?? raw?.uld_type_cd) as string | number | null | undefined;
    const rawStts = (raw?.uldInstPrgrsSttsStcd ?? raw?.uld_inst_prgrs_stts_cd) as string | number | null | undefined;
    const sttsNorm = normalizeCdmSeCode(rawStts);
    // 초안 저장도 uld_type_cd=02 이므로, 폼 전체 잠금은 전송(확정) 후 진행상태 03(완료)일 때만
    const locked = sttsNorm === "03";
    setIsStatusLocked(locked);
    debugLog("statusDetail loaded", {
      rawUldType,
      normalizedUldType: normalizeCdmSeCode(rawUldType),
      rawStts,
      sttsNorm,
      locked,
    });
  }, [statusDetail]);

  useEffect(() => {
    if (periodScaleList.length === 0) return;

    periodScaleList.forEach((item: PeriodScaleItem) => {
      const trsfSeCd = normalizeCdmSeCode(item.trsfSeCd);
      const tblSeCd = normalizeCdmSeCode(item.tblSeCd);
      const { uldPrdSn } = item;
      if (trsfSeCd === "01") {
        if (tblSeCd === "01") {
          if (item.bgngYmd) setS01Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setS01End(toDayjs(item.endYmd));
          setS01Sn(uldPrdSn);
        }
        if (tblSeCd === "02") {
          if (item.tnocs != null) setS02Tnocs(String(item.tnocs));
          setS02Sn(uldPrdSn);
        }
        if (tblSeCd === "03") {
          if (item.bgngYmd) setS03Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setS03End(toDayjs(item.endYmd));
          setS03Sn(uldPrdSn);
        }
        if (tblSeCd === "04") {
          if (item.bgngYmd) setS04Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setS04End(toDayjs(item.endYmd));
          setS04Sn(uldPrdSn);
        }
        if (tblSeCd === "05") {
          if (item.bgngYmd) setS05Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setS05End(toDayjs(item.endYmd));
          setS05Sn(uldPrdSn);
        }
        if (tblSeCd === "06") {
          if (item.bgngYmd) setS06Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setS06End(toDayjs(item.endYmd));
          setS06Sn(uldPrdSn);
        }
        if (tblSeCd === "07") {
          if (item.bgngYmd) setS07Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setS07End(toDayjs(item.endYmd));
          setS07Sn(uldPrdSn);
        }
        if (tblSeCd === "08") {
          if (item.bgngYmd) setS08Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setS08End(toDayjs(item.endYmd));
          setS08Sn(uldPrdSn);
        }
        if (tblSeCd === "09") {
          if (item.bgngYmd) setS09Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setS09End(toDayjs(item.endYmd));
          setS09Sn(uldPrdSn);
        }
        if (tblSeCd === "10") {
          if (item.bgngYmd) setS10Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setS10End(toDayjs(item.endYmd));
          setS10Sn(uldPrdSn);
        }
      }
      if (trsfSeCd === "02") {
        if (tblSeCd === "11") {
          if (item.bgngYmd) setO11Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setO11End(toDayjs(item.endYmd));
          setO11Sn(uldPrdSn);
        }
        if (tblSeCd === "12") {
          if (item.tnocs != null) setO12Tnocs(String(item.tnocs));
          setO12Sn(uldPrdSn);
        }
        if (tblSeCd === "13") {
          if (item.bgngYmd) setO13Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setO13End(toDayjs(item.endYmd));
          setO13Sn(uldPrdSn);
        }
        if (tblSeCd === "14") {
          if (item.bgngYmd) setO14Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setO14End(toDayjs(item.endYmd));
          setO14Sn(uldPrdSn);
        }
        if (tblSeCd === "15") {
          if (item.bgngYmd) setO15Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setO15End(toDayjs(item.endYmd));
          setO15Sn(uldPrdSn);
        }
        if (tblSeCd === "16") {
          if (item.bgngYmd) setO16Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setO16End(toDayjs(item.endYmd));
          setO16Sn(uldPrdSn);
        }
        if (tblSeCd === "17") {
          if (item.bgngYmd) setO17Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setO17End(toDayjs(item.endYmd));
          setO17Sn(uldPrdSn);
        }
        if (tblSeCd === "18") {
          if (item.bgngYmd) setO18Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setO18End(toDayjs(item.endYmd));
          setO18Sn(uldPrdSn);
        }
        if (tblSeCd === "19") {
          if (item.bgngYmd) setO19Bgng(toDayjs(item.bgngYmd));
          if (item.endYmd) setO19End(toDayjs(item.endYmd));
          setO19Sn(uldPrdSn);
        }
      }
    });

    const enrollmentRow = periodScaleList.find(
      (item: PeriodScaleItem) => normalizeCdmSeCode(item.trsfSeCd) === "01" && normalizeCdmSeCode(item.tblSeCd) === "01"
    );
    if (enrollmentRow) {
      const es = enrollmentRow.bgngYmd ? toDayjs(enrollmentRow.bgngYmd) : null;
      const ee = enrollmentRow.endYmd ? toDayjs(enrollmentRow.endYmd) : null;
      if (es) setDefaultPeriodStart(es);
      if (ee) setDefaultPeriodEnd(ee);
      /**
       * 상단 기본일은 Enrollment로 갱신되지만 OMOP 행은 마운트 시 '오늘'만 들어가 있을 수 있음.
       * DB에 OMOP 기간이 비어 있으면 상단·표가 어긋나고, 저장 조건(o11Bgng||o11End)도 실패할 수 있어 동기화한다.
       */
      if (es && ee) {
        const syncOmopIfNoServerDate = (
          tbl: string,
          setBg: (v: dayjs.Dayjs | null) => void,
          setEd: (v: dayjs.Dayjs | null) => void
        ) => {
          const row = periodScaleList.find(
            (x) => normalizeCdmSeCode(x.trsfSeCd) === "02" && normalizeCdmSeCode(x.tblSeCd) === tbl
          );
          if (!row?.bgngYmd) setBg(es);
          if (!row?.endYmd) setEd(ee);
        };
        syncOmopIfNoServerDate("11", setO11Bgng, setO11End);
        syncOmopIfNoServerDate("13", setO13Bgng, setO13End);
        syncOmopIfNoServerDate("14", setO14Bgng, setO14End);
        syncOmopIfNoServerDate("15", setO15Bgng, setO15End);
        syncOmopIfNoServerDate("16", setO16Bgng, setO16End);
        syncOmopIfNoServerDate("17", setO17Bgng, setO17End);
        syncOmopIfNoServerDate("18", setO18Bgng, setO18End);
        syncOmopIfNoServerDate("19", setO19Bgng, setO19End);
      }
    }
  }, [periodScaleList]);

  useEffect(() => {
    if (catalogData.length === 0) return;

    const loaded: CatalogRowItem[] = catalogData.map((item: any, idx: number) => ({
      localId: idx + 1,
      uldListSn: item.uldListSn,
      tblSeCd: normalizeCdmSeCode(item.tblSeCd) || "01",
      colNm: item.colNm || "",
      dataTypeNm: item.dataTypeNm || "",
      nulYn: item.nulYn || "N",
      pkYn: item.pkYn || "N",
      fkYn: item.fkYn || "N",
      isNew: false,
    }));
    setCatalogList(loaded);
    setNextLocalId(loaded.length + 1);
  }, [catalogData]);

  /* ── 테이블 전환 시 행 없으면 자동 추가 ── */
  useEffect(() => {
    const filtered = catalogList.filter((c) => normalizeCdmSeCode(c.tblSeCd) === normalizeCdmSeCode(catalogTblSeCd));
    if (filtered.length === 0 && catalogData.length === 0) {
      setCatalogList((prev) => [
        ...prev,
        {
          localId: nextLocalId,
          tblSeCd: catalogTblSeCd,
          colNm: "",
          dataTypeNm: "",
          nulYn: "N",
          pkYn: "N",
          fkYn: "N",
          isNew: true,
        },
      ]);
      setNextLocalId((prev) => prev + 1);
    }
  }, [catalogTblSeCd, catalogList, catalogData.length, nextLocalId]);

  const savePeriodScale = async (
    uldPrdSn: number | undefined,
    trsfSeCd: string,
    tblSeCd: string,
    payload: { bgngYmd?: string; endYmd?: string; tnocs?: number }
  ) => {
    if (!pblntSn || !ptcpInstSn) return;
    const base = { pblntSn, ptcpInstSn, trsfSeCd, tblSeCd, ...payload };
    if (uldPrdSn) {
      await updatePeriodScale({ ...base, uldPrdSn });
    } else {
      await insertPeriodScale(base);
    }
  };

  const handleAddCatalogRow = () => {
    setCatalogList([
      ...catalogList,
      {
        localId: nextLocalId,
        tblSeCd: catalogTblSeCd,
        colNm: "",
        dataTypeNm: "",
        nulYn: "N",
        pkYn: "N",
        fkYn: "N",
        isNew: true,
      },
    ]);
    setNextLocalId(nextLocalId + 1);
  };

  const catalogTemplateFileRef = useRef<HTMLInputElement>(null);

  const handleCatalogTemplateButtonClick = () => {
    catalogTemplateFileRef.current?.click();
  };

  const handleCatalogTemplateFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      setTemplateLoadIssue(null);
      const text = typeof reader.result === "string" ? reader.result : "";
      const { rows, errors } = parseCsvCatalogTemplate(text);
      if (rows.length === 0) {
        const fatalMsgs = errors.length > 0 ? errors : ["불러올 행이 없습니다."];
        setTemplateLoadIssue({ kind: "fatal", messages: fatalMsgs });
        showAlert({
          message: fatalMsgs.join("\n"),
          severity: "error",
        });
        return;
      }

      /* 플러시: 이미 DB에 저장된 카탈로그 행 삭제 후 템플릿으로 전면 교체(중복 방지) */
      if (pblntSn) {
        const persisted = catalogList.filter((c) => c.uldListSn != null);
        if (persisted.length > 0) {
          try {
            await Promise.all(persisted.map((c) => deleteCatalog({ uldListSn: c.uldListSn!, pblntSn })));
          } catch {
            showAlert({ message: "기존 카탈로그 삭제 중 오류가 발생했습니다. 템플릿을 적용하지 않았습니다.", severity: "error" });
            return;
          }
        }
      }

      const newRows: CatalogRowItem[] = rows.map((r, i) => ({
        localId: i + 1,
        tblSeCd: r.tblSeCd,
        colNm: r.colNm,
        dataTypeNm: r.dataTypeNm,
        nulYn: r.nulYn,
        pkYn: r.pkYn,
        fkYn: r.fkYn,
        isNew: true,
      }));
      setCatalogList(newRows);
      setNextLocalId(newRows.length + 1);

      if (pblntSn && ptcpInstSn) {
        await queryClient.invalidateQueries({ queryKey: ["cdm-catalog", pblntSn, ptcpInstSn] });
      }

      if (errors.length > 0) {
        setTemplateLoadIssue({ kind: "partial", messages: errors });
      }
      const msg =
        `기존 카탈로그를 비우고 ${rows.length}건을 불러왔습니다.` +
        (errors.length > 0 ? ` (일부 행 제외: ${errors.length}건, 아래 목록 참고)` : "");
      showAlert({
        message: msg,
        severity: errors.length > 0 ? "warning" : "success",
      });
    };
    reader.onerror = () => {
      setTemplateLoadIssue({ kind: "fatal", messages: ["파일을 읽는 중 오류가 발생했습니다."] });
      showAlert({ message: "파일을 읽는 중 오류가 발생했습니다.", severity: "error" });
    };
    reader.readAsText(file, "UTF-8");
  };

  const filteredCatalogList = catalogList.filter((c) => normalizeCdmSeCode(c.tblSeCd) === normalizeCdmSeCode(catalogTblSeCd));

  const handleDeleteCatalogRow = async (item: CatalogRowItem) => {
    if (!item.isNew && item.uldListSn && pblntSn) {
      try {
        await deleteCatalog({ uldListSn: item.uldListSn, pblntSn });
      } catch {
        showAlert({ message: "행 삭제 중 오류가 발생했습니다.", severity: "error" });
        return;
      }
    }
    setCatalogList(catalogList.filter((c) => c.localId !== item.localId));
  };

  const handleCatalogChange = (localId: number, field: keyof CatalogRowItem, value: string) => {
    setCatalogList(catalogList.map((c) => (c.localId === localId ? { ...c, [field]: value } : c)));
  };

  const persistPartnerInformation = async () => {
    if (!pblntSn || !ptcpInstSn) {
      showAlert({ message: "공시번호 또는 참여기관 정보가 없습니다.", severity: "error" });
      return false;
    }

    /** OMOP 행이 비어 있어도 상단 기본 시작/종료일로 검증·저장 (상단만 맞춰 둔 경우 저장 분기 누락 방지) */
    const omopStart = (v: dayjs.Dayjs | null) => v ?? defaultPeriodStart;
    const omopEnd = (v: dayjs.Dayjs | null) => v ?? defaultPeriodEnd;

    const dateRangePairs: { label: string; start: dayjs.Dayjs | null; end: dayjs.Dayjs | null }[] = [
      { label: "Sentinel - Enrollment", start: s01Bgng, end: s01End },
      { label: "Sentinel - Dispensing", start: s03Bgng, end: s03End },
      { label: "Sentinel - Encounter", start: s04Bgng, end: s04End },
      { label: "Sentinel - Diagnosis", start: s05Bgng, end: s05End },
      { label: "Sentinel - Procedure", start: s06Bgng, end: s06End },
      { label: "Sentinel - Laboratory_result", start: s07Bgng, end: s07End },
      { label: "Sentinel - Vital_Signs", start: s08Bgng, end: s08End },
      { label: "Sentinel - Death", start: s09Bgng, end: s09End },
      { label: "Sentinel - Cause_of_Death", start: s10Bgng, end: s10End },
      { label: "OMOP - observation_period", start: omopStart(o11Bgng), end: omopEnd(o11End) },
      { label: "OMOP - drug_exposure", start: omopStart(o13Bgng), end: omopEnd(o13End) },
      { label: "OMOP - visit_occurrence", start: omopStart(o14Bgng), end: omopEnd(o14End) },
      { label: "OMOP - condition_occurrence", start: omopStart(o15Bgng), end: omopEnd(o15End) },
      { label: "OMOP - procedure_occurrence", start: omopStart(o16Bgng), end: omopEnd(o16End) },
      { label: "OMOP - measurement", start: omopStart(o17Bgng), end: omopEnd(o17End) },
      { label: "OMOP - observation", start: omopStart(o18Bgng), end: omopEnd(o18End) },
      { label: "OMOP - death", start: omopStart(o19Bgng), end: omopEnd(o19End) },
    ];

    const invalidPairs = dateRangePairs.filter(({ start, end }) => start && end && end.isBefore(start));

    if (invalidPairs.length > 0) {
      const labels = invalidPairs.map((p) => `• ${p.label}`).join("\n");
      showAlert({
        message: `종료일이 시작일보다 이전인 항목이 있습니다.\n\n${labels}`,
        severity: "error",
      });
      return false;
    }

    try {
      await updateCdmCurrentInfo({
        ptcpInstSn,
        pblntSn,
        verInfoNm,
        lastUpdtYmd: toYmd(lastUpdtYmd),
        updtCycleCnt: updtCycleCnt ? Number(updtCycleCnt) : undefined,
      });

      await Promise.all([
        s01Bgng || s01End
          ? savePeriodScale(s01Sn, "01", "01", { bgngYmd: toYmd(s01Bgng), endYmd: toYmd(s01End) })
          : Promise.resolve(),
        s02Tnocs ? savePeriodScale(s02Sn, "01", "02", { tnocs: Number(s02Tnocs) }) : Promise.resolve(),
        s03Bgng || s03End
          ? savePeriodScale(s03Sn, "01", "03", { bgngYmd: toYmd(s03Bgng), endYmd: toYmd(s03End) })
          : Promise.resolve(),
        s04Bgng || s04End
          ? savePeriodScale(s04Sn, "01", "04", { bgngYmd: toYmd(s04Bgng), endYmd: toYmd(s04End) })
          : Promise.resolve(),
        s05Bgng || s05End
          ? savePeriodScale(s05Sn, "01", "05", { bgngYmd: toYmd(s05Bgng), endYmd: toYmd(s05End) })
          : Promise.resolve(),
        s06Bgng || s06End
          ? savePeriodScale(s06Sn, "01", "06", { bgngYmd: toYmd(s06Bgng), endYmd: toYmd(s06End) })
          : Promise.resolve(),
        s07Bgng || s07End
          ? savePeriodScale(s07Sn, "01", "07", { bgngYmd: toYmd(s07Bgng), endYmd: toYmd(s07End) })
          : Promise.resolve(),
        s08Bgng || s08End
          ? savePeriodScale(s08Sn, "01", "08", { bgngYmd: toYmd(s08Bgng), endYmd: toYmd(s08End) })
          : Promise.resolve(),
        s09Bgng || s09End
          ? savePeriodScale(s09Sn, "01", "09", { bgngYmd: toYmd(s09Bgng), endYmd: toYmd(s09End) })
          : Promise.resolve(),
        s10Bgng || s10End
          ? savePeriodScale(s10Sn, "01", "10", { bgngYmd: toYmd(s10Bgng), endYmd: toYmd(s10End) })
          : Promise.resolve(),
        omopStart(o11Bgng) || omopEnd(o11End)
          ? savePeriodScale(o11Sn, "02", "11", { bgngYmd: toYmd(omopStart(o11Bgng)), endYmd: toYmd(omopEnd(o11End)) })
          : Promise.resolve(),
        o12Tnocs ? savePeriodScale(o12Sn, "02", "12", { tnocs: Number(o12Tnocs) }) : Promise.resolve(),
        omopStart(o13Bgng) || omopEnd(o13End)
          ? savePeriodScale(o13Sn, "02", "13", { bgngYmd: toYmd(omopStart(o13Bgng)), endYmd: toYmd(omopEnd(o13End)) })
          : Promise.resolve(),
        omopStart(o14Bgng) || omopEnd(o14End)
          ? savePeriodScale(o14Sn, "02", "14", { bgngYmd: toYmd(omopStart(o14Bgng)), endYmd: toYmd(omopEnd(o14End)) })
          : Promise.resolve(),
        omopStart(o15Bgng) || omopEnd(o15End)
          ? savePeriodScale(o15Sn, "02", "15", { bgngYmd: toYmd(omopStart(o15Bgng)), endYmd: toYmd(omopEnd(o15End)) })
          : Promise.resolve(),
        omopStart(o16Bgng) || omopEnd(o16End)
          ? savePeriodScale(o16Sn, "02", "16", { bgngYmd: toYmd(omopStart(o16Bgng)), endYmd: toYmd(omopEnd(o16End)) })
          : Promise.resolve(),
        omopStart(o17Bgng) || omopEnd(o17End)
          ? savePeriodScale(o17Sn, "02", "17", { bgngYmd: toYmd(omopStart(o17Bgng)), endYmd: toYmd(omopEnd(o17End)) })
          : Promise.resolve(),
        omopStart(o18Bgng) || omopEnd(o18End)
          ? savePeriodScale(o18Sn, "02", "18", { bgngYmd: toYmd(omopStart(o18Bgng)), endYmd: toYmd(omopEnd(o18End)) })
          : Promise.resolve(),
        omopStart(o19Bgng) || omopEnd(o19End)
          ? savePeriodScale(o19Sn, "02", "19", { bgngYmd: toYmd(omopStart(o19Bgng)), endYmd: toYmd(omopEnd(o19End)) })
          : Promise.resolve(),
      ]);

      const validCatalog = catalogList.filter((c) => c.colNm.trim() !== "");
      await Promise.all(
        validCatalog.map((item) => {
          const payload = {
            pblntSn,
            ptcpInstSn,
            tblSeCd: item.tblSeCd,
            colNm: item.colNm,
            dataTypeNm: item.dataTypeNm,
            nulYn: item.nulYn,
            pkYn: item.pkYn,
            fkYn: item.fkYn,
          };
          return item.isNew ? insertCatalog(payload) : updateCatalog({ ...payload, uldListSn: item.uldListSn! });
        })
      );

      await queryClient.invalidateQueries({ queryKey: ["cdm-status-detail", pblntSn, ptcpInstSn] });
      await queryClient.invalidateQueries({ queryKey: ["cdm-period-scale", pblntSn, ptcpInstSn] });
      await queryClient.invalidateQueries({ queryKey: ["cdm-catalog", pblntSn, ptcpInstSn] });
      // 공시목록/관리자 목록에서 업로드유형(uld_type_cd) 표시가 즉시 반영되도록 캐시 무효화
      await queryClient.invalidateQueries({ queryKey: ["disclosures-customer"] });
      // 관리자용/일반용 공시 목록은 모두 queryKey prefix가 ["disclosures"] 이므로 함께 무효화
      await queryClient.invalidateQueries({ queryKey: ["disclosures"] });
      await queryClient.invalidateQueries({ queryKey: ["disclosure-partners", pblntSn] });

      return true;
    } catch (error: any) {
      showAlert({ message: error?.response?.data?.message || "저장 중 오류가 발생했습니다.", severity: "error" });
      return false;
    }
  };

  const handleSave = async () => {
    if (isStatusLocked) return;
    try {
      setIsSaving(true);
      debugLog("click SAVE", { pblntSn, ptcpInstSn, isStatusLocked, isSaving, isConfirming });
      const ok = await persistPartnerInformation();
      if (ok) {
        showAlert({ message: "저장되었습니다.", severity: "success" });
      }
    } finally {
      setIsSaving(false);
      debugLog("SAVE finished", { isStatusLocked, isSaving: false, isConfirming });
    }
  };

  const handleSend = async () => {
    if (isStatusLocked) return;
    if (!pblntSn || !ptcpInstSn) {
      showAlert({ message: "공시번호 또는 참여기관 정보가 없습니다.", severity: "error" });
      return;
    }

    try {
      setIsConfirming(true);
      debugLog("click SEND", { pblntSn, ptcpInstSn, isStatusLocked, isSaving, isConfirming });

      const ok = await persistPartnerInformation();
      if (!ok) return;

      await confirmCdmCurrentInfo({
        ptcpInstSn,
        pblntSn,
        verInfoNm,
        lastUpdtYmd: toYmd(lastUpdtYmd),
        updtCycleCnt: updtCycleCnt ? Number(updtCycleCnt) : undefined,
      });

      await queryClient.invalidateQueries({ queryKey: ["cdm-status-detail", pblntSn, ptcpInstSn] });
      setIsStatusLocked(true);
      debugLog("SEND confirmed -> locked", { nextLocked: true });

      showAlert({
        message: "전송되었습니다. 전송 후에는 편집이 불가능합니다.",
        severity: "warning",
      });
      navigate(`${routes.CDM.DISCLOSURE_DETAIL}?pblntSn=${pblntSn}`);
    } catch (error: any) {
      showAlert({ message: error?.response?.data?.message || "전송 중 오류가 발생했습니다.", severity: "error" });
    } finally {
      setIsConfirming(false);
      debugLog("SEND finished", { isStatusLocked, isSaving, isConfirming: false });
    }
  };

  return (
    <div>
      <Helmet>
        <title>CDM - CDM 업로드 공시</title>
      </Helmet>
      <Box sx={{ pb: 2, borderBottom: "1px solid #e0e0e0", mb: 3 }}>
        <div className="mb-4">
          <Typography variant="mainTitle">CDM 업로드 공시</Typography>
        </div>
        <Typography sx={{ fontSize: "13px", color: "#777" }}>협력기관에서 업로드한 CDM 데이터 규격 및 관련정보입니다.</Typography>
      </Box>

      {isStatusLocked && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          전송 완료된 현황정보는 편집할 수 없습니다.
        </Alert>
      )}

      <fieldset disabled={isStatusLocked} style={{ border: 0, padding: 0, margin: 0, minInlineSize: 0 }}>
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
                <TextField
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={verInfoNm}
                  onChange={(e) => setVerInfoNm(e.target.value)}
                />
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
                <CdmDatePicker value={lastUpdtYmd} onChange={setLastUpdtYmd} />
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
                <TextField
                  variant="outlined"
                  size="small"
                  fullWidth
                  placeholder="일 단위"
                  value={updtCycleCnt}
                  onChange={(e) => setUpdtCycleCnt(filterNumberOnly(e.target.value).slice(0, 3))}
                />
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
                <Typography sx={{ fontSize: "13px" }}>• 기본 시작일자</Typography>
              </Box>
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 2, py: 1, borderRight: "1px solid #e0e0e0" }}>
                <CdmDatePicker value={defaultPeriodStart} onChange={handleDefaultPeriodStartChange} />
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
                <Typography sx={{ fontSize: "13px" }}>• 기본 마지막일자</Typography>
              </Box>
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 2, py: 1 }}>
                <CdmDatePicker value={defaultPeriodEnd} onChange={handleDefaultPeriodEndChange} />
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
                <PeriodCountRow
                  label="Demographic"
                  value={s02Tnocs}
                  onChange={(v) => setS02Tnocs(filterNumberOnly(v))}
                  topBorder
                />
                <PeriodDateRow
                  label="Enrollment"
                  startLabel="최초 방문일"
                  endLabel="최종 방문일"
                  startValue={s01Bgng}
                  endValue={s01End}
                  onStartChange={setS01Bgng}
                  onEndChange={setS01End}
                />
                <PeriodDateRow
                  label="Dispensing"
                  startLabel="최초 약물처방일"
                  endLabel="최종 약물처방일"
                  startValue={s03Bgng}
                  endValue={s03End}
                  onStartChange={setS03Bgng}
                  onEndChange={setS03End}
                />
                <PeriodDateRow
                  label="Encounter"
                  startLabel="방문 시작일"
                  endLabel="방문 종료일"
                  startValue={s04Bgng}
                  endValue={s04End}
                  onStartChange={setS04Bgng}
                  onEndChange={setS04End}
                />
                <PeriodDateRow
                  label="Diagnosis"
                  startLabel="진단 시작일"
                  endLabel="진단 종료일"
                  startValue={s05Bgng}
                  endValue={s05End}
                  onStartChange={setS05Bgng}
                  onEndChange={setS05End}
                />
                <PeriodDateRow
                  label="Procedure"
                  startLabel="시술 시작일"
                  endLabel="시술 종료일"
                  startValue={s06Bgng}
                  endValue={s06End}
                  onStartChange={setS06Bgng}
                  onEndChange={setS06End}
                />
                <PeriodDateRow
                  label="Laboratory_result"
                  startLabel="검사 시작일"
                  endLabel="검사 종료일"
                  startValue={s07Bgng}
                  endValue={s07End}
                  onStartChange={setS07Bgng}
                  onEndChange={setS07End}
                />
                <PeriodDateRow
                  label="Vital_Signs"
                  startLabel="측정 시작일"
                  endLabel="측정 종료일"
                  startValue={s08Bgng}
                  endValue={s08End}
                  onStartChange={setS08Bgng}
                  onEndChange={setS08End}
                />
                <PeriodDateRow
                  label="Death"
                  startLabel="사망 시작일"
                  endLabel="사망 종료일"
                  startValue={s09Bgng}
                  endValue={s09End}
                  onStartChange={setS09Bgng}
                  onEndChange={setS09End}
                />
                <PeriodDateRow
                  label="Cause_of_Death"
                  startLabel="사인 시작일"
                  endLabel="사인 종료일"
                  startValue={s10Bgng}
                  endValue={s10End}
                  onStartChange={setS10Bgng}
                  onEndChange={setS10End}
                />

                <TableRow>
                  <TableCell
                    colSpan={5}
                    sx={{ bgcolor: "#ffffff", color: "#333", fontWeight: "bold", pl: 2, borderBottom: "1px solid #e0e0e0" }}
                  >
                    ▶ OMOP
                  </TableCell>
                </TableRow>
                <PeriodCountRow label="person" value={o12Tnocs} onChange={(v) => setO12Tnocs(filterNumberOnly(v))} topBorder />
                <PeriodDateRow
                  label="observation_period"
                  startLabel="관찰 시작일"
                  endLabel="관찰 종료일자"
                  startValue={o11Bgng}
                  endValue={o11End}
                  onStartChange={setO11Bgng}
                  onEndChange={setO11End}
                />
                <PeriodDateRow
                  label="drug_exposure"
                  startLabel="약물 시작일"
                  endLabel="약물 종료일"
                  startValue={o13Bgng}
                  endValue={o13End}
                  onStartChange={setO13Bgng}
                  onEndChange={setO13End}
                />
                <PeriodDateRow
                  label="visit_occurrence"
                  startLabel="방문 시작일"
                  endLabel="방문 종료일"
                  startValue={o14Bgng}
                  endValue={o14End}
                  onStartChange={setO14Bgng}
                  onEndChange={setO14End}
                />
                <PeriodDateRow
                  label="condition_occurrence"
                  startLabel="상태 시작일"
                  endLabel="상태 종료일"
                  startValue={o15Bgng}
                  endValue={o15End}
                  onStartChange={setO15Bgng}
                  onEndChange={setO15End}
                />
                <PeriodDateRow
                  label="procedure_occurrence"
                  startLabel="시술 시작일"
                  endLabel="시술 종료일"
                  startValue={o16Bgng}
                  endValue={o16End}
                  onStartChange={setO16Bgng}
                  onEndChange={setO16End}
                />
                <PeriodDateRow
                  label="measurement"
                  startLabel="측정 시작일"
                  endLabel="측정 종료일"
                  startValue={o17Bgng}
                  endValue={o17End}
                  onStartChange={setO17Bgng}
                  onEndChange={setO17End}
                />
                <PeriodDateRow
                  label="observation"
                  startLabel="관찰 시작일"
                  endLabel="관찰 종료일"
                  startValue={o18Bgng}
                  endValue={o18End}
                  onStartChange={setO18Bgng}
                  onEndChange={setO18End}
                />
                <PeriodDateRow
                  label="death"
                  startLabel="사망 시작일"
                  endLabel="사망 종료일"
                  startValue={o19Bgng}
                  endValue={o19End}
                  onStartChange={setO19Bgng}
                  onEndChange={setO19End}
                />
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
          <Box sx={{ borderBottom: "1px solid #e0e0e0", p: 2, pt: 0 }}>
            <Stack direction="row" alignItems="center" gap={1} mb={1}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Select
                  size="small"
                  value={catalogCdmType}
                  onChange={(e) => handleCatalogCdmTypeChange(e.target.value)}
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
                  {(CDM_TABLE_OPTIONS[catalogCdmType] || []).map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
              <input
                ref={catalogTemplateFileRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: "none" }}
                onChange={handleCatalogTemplateFileChange}
              />
              <Stack direction="row" alignItems="center" gap={1}>
                <Button variant="outlined" size="small" onClick={handleCatalogTemplateButtonClick}>
                  템플릿 로딩
                </Button>
                <Link
                  href={tempCsvUrl}
                  download="temp.csv"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{ whiteSpace: "nowrap" }}
                >
                  양식다운로드 받기
                </Link>
              </Stack>
              <Button variant="contained" size="small" onClick={handleAddCatalogRow}>
                행추가
              </Button>
            </Stack>

            {templateLoadIssue && (
              <Alert
                severity={templateLoadIssue.kind === "fatal" ? "error" : "warning"}
                onClose={() => setTemplateLoadIssue(null)}
                sx={{ mb: 2, alignItems: "flex-start" }}
              >
                <Typography variant="subtitle2" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {templateLoadIssue.kind === "fatal"
                    ? "템플릿을 적용할 수 없습니다. CSV 형식·헤더·값을 확인해 주세요."
                    : `일부 행을 건너뛰었습니다. (${templateLoadIssue.messages.length}건)`}
                </Typography>
                <Box
                  component="ul"
                  sx={{
                    m: 0,
                    pl: 2.25,
                    maxHeight: 280,
                    overflow: "auto",
                    fontSize: "13px",
                    lineHeight: 1.45,
                  }}
                >
                  {templateLoadIssue.messages.map((msg, i) => (
                    <Box component="li" key={`${i}-${msg.slice(0, 40)}`}>
                      {msg}
                    </Box>
                  ))}
                </Box>
              </Alert>
            )}

            <TableContainer>
              <Table size="small" sx={{ "& .MuiTableCell-root": { fontSize: "13px", py: 0.5, borderColor: "#e0e0e0" } }}>
                <TableHead>
                  <TableRow>
                    {["번호", "컬럼명", "데이터 타입", "Null 여부", "PK 여부", "FK 여부", "비고"].map((h) => (
                      <TableCell
                        key={h}
                        align="center"
                        sx={{ bgcolor: "#eeeeee", fontWeight: "bold", borderTop: "1px solid #000 !important" }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCatalogList.map((item, index) => (
                    <TableRow key={item.localId}>
                      <TableCell align="center" sx={{ width: "100px" }}>
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={item.colNm}
                          onChange={(e) => handleCatalogChange(item.localId, "colNm", filterNoKorean(e.target.value))}
                        />
                      </TableCell>
                      <TableCell sx={{ width: "180px" }}>
                        <Select
                          size="small"
                          fullWidth
                          displayEmpty
                          value={item.dataTypeNm}
                          onChange={(e) => handleCatalogChange(item.localId, "dataTypeNm", e.target.value)}
                        >
                          <MenuItem value="">
                            <em>- 선 택 -</em>
                          </MenuItem>
                          {DATA_TYPES.map((t) => (
                            <MenuItem key={t} value={t}>
                              {t}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell align="center" sx={{ width: "100px" }}>
                        <Checkbox
                          size="small"
                          checked={item.nulYn === "Y"}
                          onChange={(e) => handleCatalogChange(item.localId, "nulYn", e.target.checked ? "Y" : "N")}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: "100px" }}>
                        <Checkbox
                          size="small"
                          checked={item.pkYn === "Y"}
                          onChange={(e) => handleCatalogChange(item.localId, "pkYn", e.target.checked ? "Y" : "N")}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: "100px" }}>
                        <Checkbox
                          size="small"
                          checked={item.fkYn === "Y"}
                          onChange={(e) => handleCatalogChange(item.localId, "fkYn", e.target.checked ? "Y" : "N")}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: "100px" }}>
                        <Button variant="outlined" size="small" color="inherit" onClick={() => handleDeleteCatalogRow(item)}>
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </fieldset>

      <div className="flex justify-end gap-3">
        <Button variant="outlined" size="medium" className="btn_outline" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
          목록
        </Button>
        <Button variant="contained" size="medium" onClick={handleSave} disabled={isStatusLocked}>
          {isSaving ? "저장 중..." : "저장"}
        </Button>
        <Button variant="outlined" size="medium" onClick={handleSend} disabled={isStatusLocked || isSaving || isConfirming}>
          {isConfirming ? "전송 중..." : "전송"}
        </Button>
      </div>
    </div>
  );
}
