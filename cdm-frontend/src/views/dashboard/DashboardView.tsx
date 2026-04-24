import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useNavigate } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types.ts";
import {
  fetchAsmtStatusStats,
  fetchCdmStats,
  fetchInstErrRate,
  fetchInstUldStats,
  fetchPblntPrgrStats,
  fetchUploadNotice,
} from "@/api/communityApi";
import { DisclosureAPI } from "@/api/disclosureApi";
import { getPblntPrgrsStatusConfig } from "@/utils/common";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { usePageAccessHistory } from "@/hooks/usePageAccessHistory";
import { SpaceBox } from "@/components/SpaceBox.tsx";
import InstitutionVolumePopup from "./InstitutionVolumePopup.tsx";
import InstitutionErrorRateDonutChart from "./chart/InstitutionErrorRatedonutchart.tsx";
import InstitutionVolumeChart from "./chart/InstitutionVolumeChart.tsx";
import { Helmet } from "react-helmet";

ModuleRegistry.registerModules([AllCommunityModule]);

type DisclosureRow = {
  pblntSn: number;
  pblntSeCd: string | null;
  ttlNm: string | null;
  pblntBgngYmd: string | null;
  pblntEndYmd: string | null;
  pblntStcd: string | null;
  rgtrId: string | null;
};

function StatusCellRenderer(p: Readonly<ICellRendererParams<DisclosureRow>>) {
  const status = p.value?.trim() || "";
  const cfg = getPblntPrgrsStatusConfig(status);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <Chip size="small" label={cfg?.label} sx={cfg?.chipStyle} />
    </div>
  );
}

const ROW_H = 42;
const HEADER_H = 42;

const NOTICE_MAX_ROWS = 2;

const noticeHeight = HEADER_H + ROW_H * NOTICE_MAX_ROWS;

const INST_MAX_ROWS = 6;
const instHeight = HEADER_H + ROW_H * INST_MAX_ROWS;

const ERROR_MAX_ROWS = 7;
const ERROR_MIN_HEIGHT = HEADER_H + ROW_H * 7;
const ERROR_MAX_HEIGHT = HEADER_H + ROW_H * ERROR_MAX_ROWS;

/** 데이터 없을 때 동일 참조 유지용 (불필요한 하위 렌더 방지) */
const EMPTY_ARR: any[] = [];

export default function CdmDashboardView() {
  usePageAccessHistory();
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const selectedInstitution = null;

  // ?? DevTools & AG-Grid 안정화용 ref
  const instRef = useRef<any[]>([]);
  const errRef = useRef<any[]>([]);
  const noticeRef = useRef<any[]>([]);

  const ptcpInstSn = 1;

  const cdmStatsQuery = useQuery({
    queryKey: ["dashboard", "cdmStats"],
    queryFn: fetchCdmStats,
  });

  const asmtStatsQuery = useQuery({
    queryKey: ["dashboard", "asmtStatusStats"],
    queryFn: fetchAsmtStatusStats,
  });

  const instUldStatsQuery = useQuery({
    queryKey: ["dashboard", "instUldStats", ptcpInstSn],
    queryFn: () => fetchInstUldStats(ptcpInstSn),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60, // 1분
  });

  const instErrRateQuery = useQuery({
    queryKey: ["dashboard", "instErrRate", ptcpInstSn],
    queryFn: () => fetchInstErrRate(ptcpInstSn),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60,
  });

  const uploadNoticeQuery = useQuery({
    queryKey: ["dashboard", "uploadNotice"],
    queryFn: fetchUploadNotice,
  });

  const pblntPrgrQuery = useQuery({
    queryKey: ["dashboard", "pblntPrgrStats"],
    queryFn: fetchPblntPrgrStats,
  });

  const cdmStats = cdmStatsQuery.data ?? {};
  const asmtStats = asmtStatsQuery.data ?? {};
  const pblntPrgrStats = pblntPrgrQuery.data ?? {};

  // 1. 데이터 추출: 파생값만 계산 (ref 갱신은 useEffect에서)
  const instStats =
    Array.isArray(instUldStatsQuery.data) && instUldStatsQuery.data.length > 0 ? instUldStatsQuery.data : EMPTY_ARR;
  const errStats = Array.isArray(instErrRateQuery.data) ? instErrRateQuery.data : EMPTY_ARR;

  const noticeRaw: any = uploadNoticeQuery.data;
  const noticeData = Array.isArray(noticeRaw) ? noticeRaw : (noticeRaw?.data ?? EMPTY_ARR);

  useEffect(() => {
    instRef.current = instStats;
  }, [instStats]);
  useEffect(() => {
    errRef.current = errStats;
  }, [errStats]);
  useEffect(() => {
    noticeRef.current = noticeData;
  }, [noticeData]);

  // 3. 컬럼 정의 시 방어 코드 (데이터가 없을 때 map 에러 방지)
  const volumeData = useMemo(() => {
    if (instUldStatsQuery.data && Array.isArray(instUldStatsQuery.data) && instUldStatsQuery.data.length > 0) {
      return instUldStatsQuery.data.map((r: any) => ({
        name: r.instName || "-",
        total: (r.uldNocs || 0).toLocaleString(),
        error: (r.errNocs || 0).toLocaleString(),
        rate: r.errRt == null ? "0%" : `${r.errRt}%`,
        upload: r.lastUpdtYmd || "-",
      }));
    }
    return [];
  }, [instUldStatsQuery.data]);

  const volumeColumns: ColDef[] = [
    {
      headerName: "기관명",
      field: "name",
      flex: 1,
      headerClass: "ag-header-center",
    },
    {
      headerName: "보유건수",
      field: "total",
      width: 120,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "업로드일자",
      field: "upload",
      width: 120,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
      valueFormatter: (p) => {
        if (!p.value || p.value === "-") return "-";
        const v = String(p.value).trim();
        return v.length === 8 ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}` : (v || "-");
      },
    },
  ];

  const errorColumns: ColDef[] = [
    {
      headerName: "기관명",
      field: "name",
      flex: 1,
      headerClass: "ag-header-center",
    },
    {
      headerName: "오류건수",
      field: "error",
      width: 120,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "오류율",
      field: "rate",
      width: 100,
      headerClass: "ag-header-center",
      cellStyle: { color: "#dc2626", fontWeight: "600", textAlign: "center" },
    },
  ];

  const noticeColumns: ColDef[] = [
    {
      headerName: "구분",
      field: "pblntSeCd",
      width: 100,
      cellRenderer: (p: { value: string | null | undefined }) => DisclosureAPI.convertType(p.value) || "-",
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "제목",
      field: "ttlNm",
      flex: 1,
      headerClass: "ag-header-center",
    },
    {
      headerName: "완료일자",
      field: "pblntEndYmd",
      width: 120,
      valueFormatter: (p) =>
        p.value?.length === 8 ? `${p.value.slice(0, 4)}-${p.value.slice(4, 6)}-${p.value.slice(6, 8)}` : p.value,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "기관정보",
      width: 120,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center", fontWeight: "500" },
      valueGetter: (p) => `${p.data?.partCnt ?? 0} / ${p.data?.totalCnt ?? 0}`,
    },
    {
      headerName: "상태",
      field: "pblntStcd",
      width: 110,
      headerClass: "ag-header-center",
      cellRenderer: StatusCellRenderer,
    },
  ];


  const errorHeight = useMemo(() => {
    const rowCount = volumeData.length;

    if (rowCount === 0) {
      return ERROR_MIN_HEIGHT;
    }

    const neededHeight = HEADER_H + ROW_H * rowCount;
    return Math.min(neededHeight, ERROR_MAX_HEIGHT);
  }, [volumeData.length]);

  return (
    <div className="w-full">
      <Helmet>
        <title>CDM - 대시보드</title>
      </Helmet>
      {open && <InstitutionVolumePopup onClose={() => setOpen(false)} />}

      {/* 행 1: CDM 데이터 정보 | 공시진행현황 정보 */}
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="py-2 font-semibold text-gray-800">CDM 데이터 정보</div>
          <div className="border-t border-slate-800">
            <div className="flex bg-gray-100 text-center border-b border-slate-300">
              <div className="flex-1 py-2 font-semibold border-r border-zinc-200">보유건수</div>
              <div className="flex-1 py-2 font-semibold border-r border-zinc-200">오류건수</div>
              <div className="flex-1 py-2 font-semibold">오류율</div>
            </div>
            <div className="flex text-center border-b border-zinc-200">
              <div className="flex-1 py-2 border-r border-zinc-200">{(cdmStats.uldNocs ?? 0).toLocaleString()}건</div>
              <div className="flex-1 py-2 border-r border-zinc-200">{(cdmStats.errNocs ?? 0).toLocaleString()}건</div>
              <div className="flex-1 py-2 text-red-500 font-semibold">{cdmStats.errRt ?? 0}%</div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="py-2 font-semibold text-gray-800">공시진행현황 정보</div>
          <div className="border-t border-slate-800">
            <div className="flex bg-gray-100 text-center border-b border-slate-300">
              <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                총계
              </div>
              <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                등록
              </div>
              <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                진행중
              </div>
              <div className="flex-1 flex items-center justify-center font-semibold" style={{ minHeight: "42px" }}>
                마감
              </div>
            </div>
            <div className="flex text-center border-b border-zinc-200">
              {[
                { value: pblntPrgrStats.totalCnt, status: null, border: true },
                { value: pblntPrgrStats.reqCnt, status: "01", border: true },
                { value: pblntPrgrStats.progressCnt, status: "02", border: true },
                { value: pblntPrgrStats.closeCnt, status: "03", border: false },
              ].map(({ value, status, border }) => (
                <div
                  key={status ?? "total"}
                  className={`flex-1 py-2${border ? " border-r border-zinc-200" : ""}`}
                >
                  {status ? (
                    <button
                      type="button"
                      className="cursor-pointer text-blue-600 hover:underline bg-transparent border-0 p-0"
                      onClick={() => navigate(`${routes.CDM.DISCLOSURES}?pblntStcd=${status}&page=1`)}
                    >
                      {value ?? 0}
                    </button>
                  ) : (value ?? 0)}건
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SpaceBox gap={CONTENT_GAP.LARGE} />

      {/* 행 2: 기관별 보유량 | CDM 업로드 공시·연구과제현황 */}
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="flex justify-between items-center py-2">
            <span className="font-semibold text-gray-800">기관별 보유량</span>
            <Button variant="outlined" onClick={() => setOpen(true)}>
              기관별 보유량 조회
            </Button>
          </div>
          <div className="ag-theme-cdm w-full" style={{ height: instHeight, overflow: "hidden" }}>
            <AgGridReact
              rowData={volumeData}
              columnDefs={volumeColumns}
              rowHeight={ROW_H}
              headerHeight={HEADER_H}
              overlayNoRowsTemplate="<span>게시물이 존재하지 않습니다.</span>"
            />
          </div>
        </div>
        <div className="flex-1">
          <div>
            <div className="py-2 font-semibold text-gray-800">CDM 업로드 공시 정보</div>
            <div className="ag-theme-cdm w-full" style={{ height: noticeHeight }}>
              <AgGridReact
                rowData={noticeData}
                columnDefs={noticeColumns}
                rowHeight={ROW_H}
                headerHeight={HEADER_H}
                onRowClicked={(e) => e.data?.pblntSn && navigate(`${routes.CDM.DISCLOSURE_DETAIL}?pblntSn=${e.data.pblntSn}`)}
                overlayNoRowsTemplate="<span>게시물이 존재하지 않습니다.</span>"
              />
            </div>
          </div>
          <SpaceBox gap={CONTENT_GAP.MEDIUM} />
          <div>
            <div className="py-2 font-semibold text-gray-800">연구과제현황 정보</div>
            <div className="border-t border-slate-800">
              <div className="flex bg-gray-100 text-center border-b border-slate-300">
                <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                  총계
                </div>
                <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                  참여요청
                </div>
                <div className="flex-[2] flex flex-col border-r border-slate-300">
                  <div className="flex items-center justify-center py-1 font-semibold border-b border-slate-300">진행중</div>
                  <div className="flex">
                    <div className="flex-1 flex items-center justify-center py-1 font-semibold border-r border-slate-300">통합/기관</div>
                    <div className="flex-1 flex items-center justify-center py-1 font-semibold">메타분석</div>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                  마감
                </div>
                <div className="flex-1 flex items-center justify-center font-semibold" style={{ minHeight: "42px" }}>
                  취소
                </div>
              </div>
              <div className="flex text-center border-b border-slate-200">
                {[
                  { value: asmtStats.totalCnt, status: null, border: true },
                  { value: asmtStats.reqCnt, status: "01", border: true },
                  { value: asmtStats.progressCnt, status: "02", border: true },
                  { value: asmtStats.reviewCnt, status: "03", border: true },
                  { value: asmtStats.closeCnt, status: "04", border: true },
                  { value: asmtStats.cancelCnt, status: "05", border: false },
                ].map(({ value, status, border }) => (
                  <div
                    key={status ?? "total"}
                    className={`flex-1 py-2 text-center${border ? " border-r border-slate-200" : ""}`}
                  >
                    {status ? (
                      <button
                        type="button"
                        className="cursor-pointer text-blue-600 hover:underline bg-transparent border-0 p-0"
                        onClick={() => navigate(`${routes.RESEARCH.OWNER}?progressStatus=${status}&page=1`)}
                      >
                        {value ?? 0}
                      </button>
                    ) : (value ?? 0)}건
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SpaceBox gap={CONTENT_GAP.LARGE} />

      {/* 행 3: 기관별 보유량 차트 | 기관별 오류율 */}
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="font-semibold text-gray-800 mb-2">기관별 보유량</div>
          <div className="border-t border-slate-300 pt-4">
            <InstitutionVolumeChart data={instStats} />
          </div>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-800 mb-2">기관별 오류율</div>
          <div className="border-t border-slate-300 pt-4">
            <div className="flex gap-6">
              <div
                className="flex-1 ag-theme-cdm"
                style={{
                  height: errorHeight,
                  maxHeight: ERROR_MAX_HEIGHT,
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
                <AgGridReact
                  rowData={volumeData}
                  columnDefs={errorColumns}
                  rowHeight={ROW_H}
                  headerHeight={HEADER_H}
                  overlayNoRowsTemplate="<span>게시물이 존재하지 않습니다.</span>"
                />
              </div>
              <div className="flex-1 flex items-center justify-center h-[335px]">
                <InstitutionErrorRateDonutChart data={instStats} selectedInstitution={selectedInstitution} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
