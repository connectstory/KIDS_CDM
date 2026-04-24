import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { AllCommunityModule, type ColDef, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useNavigate } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types.ts";
import {
  fetchBoardList,
  fetchErrorSummary,
  fetchInstAsmtPrtcpStats,
  fetchInstAsmtStatusStats,
  fetchInstUldPrgrStats,
  fetchTblUldStats,
} from "@/api/communityApi";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { usePageAccessHistory } from "@/hooks/usePageAccessHistory";
import { SpaceBox } from "@/components/SpaceBox.tsx";
import { cdmTableDisplayName } from "@/utils/cdmTableUtils";
import { BOARD_CONFIG } from "@/config/boardConfig";
import { Helmet } from "react-helmet";

const ROW_HEIGHT = 42;
const HEADER_HEIGHT = 42;

const DASHBOARD_ROWS_SMALL = 2;
const DASHBOARD_ROWS_LARGE = 11;

ModuleRegistry.registerModules([AllCommunityModule]);

export default function PartnerDashboardView() {
  usePageAccessHistory();
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const instId = useSelector((state: RootState) => state.session.instId);

  /* ======================= React Query: 데이터 조회 ======================= */

  // 회의/행사 정보
  const meetingQuery = useQuery({
    queryKey: ["boardList", "meetingEventInfo", 1, 10],
    queryFn: () =>
      fetchBoardList({
        bbsId: BOARD_CONFIG.meetingEventInfo.bbsId,
        page: 1,
        pageSize: String(10),
      }),
  });

  // 자료실
  const archiveQuery = useQuery({
    queryKey: ["boardList", "resourceCenter", 1, 10],
    queryFn: () =>
      fetchBoardList({
        bbsId: BOARD_CONFIG.resourceCenter.bbsId,
        page: 1,
        pageSize: String(10),
      }),
  });

  // 테이블별 보유량
  const tableStatsQuery = useQuery({
    queryKey: ["dashboard", "tblUldStats", instId],
    queryFn: () => fetchTblUldStats(instId!),
    enabled: !!instId,  // instId 없으면 호출 안 함
    staleTime: 1000 * 60,
  });

  // CDM 오류 요약
  const cdmStatsQuery = useQuery({
    queryKey: ["dashboard", "errorSummary", instId],
    queryFn: () => fetchErrorSummary(instId!),
    enabled: !!instId,
    staleTime: 1000 * 60,
  });

  // 참여 과제 현황
  const asmtPrtcpQuery = useQuery({
    queryKey: ["dashboard", "instAsmtPrtcpStats", instId],
    queryFn: () => fetchInstAsmtPrtcpStats(instId!),
    enabled: !!instId,
    staleTime: 1000 * 60,
  });

  // 생성 연구과제 현황
  const asmtStatusQuery = useQuery({
    queryKey: ["dashboard", "instAsmtStatusStats", instId],
    queryFn: () => fetchInstAsmtStatusStats(instId!),
    enabled: !!instId,
    staleTime: 1000 * 60,
  });

  // 업로드 진행 현황
  const uldPrgrQuery = useQuery({
    queryKey: ["dashboard", "instUldPrgrStats", instId],
    queryFn: () => fetchInstUldPrgrStats(instId!),
    enabled: !!instId,
    staleTime: 1000 * 60,
  });

  /* ======================= 데이터 추출 ======================= */
  const meetingData = meetingQuery.data?.list || [];
  const archiveData = archiveQuery.data?.list || [];
  const tableData = tableStatsQuery.data || [];
  const cdmStats = cdmStatsQuery.data || {};
  const asmtStats = asmtPrtcpQuery.data || {};
  const createdStats = asmtStatusQuery.data || {};
  const uldPrgrStats = uldPrgrQuery.data || {};

  const safe = (v: any) => v ?? 0;

  /* ======================= 컬럼 정의 ======================= */
  const meetingColumns: ColDef[] = [
    {
      headerName: "번호",
      width: 80,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
    },
    { headerName: "제목", field: "pstTtl", flex: 1 },
    {
      headerName: "작성자",
      field: "rgtrId",
      width: 100,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "등록일",
      field: "regDt",
      width: 150,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
  ];

  const archiveColumns = meetingColumns;

  const formatNumber = (v: any) => {
    if (v === null || v === undefined || v === "") return "0";
    return Number(v).toLocaleString();
  };

  const tableColumns: ColDef[] = [
    {
      headerName: "번호",
      width: 80,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
    },
    { headerName: "테이블명", field: "tableName", flex: 1, valueFormatter: (p) => cdmTableDisplayName(p.value ?? "") },
    {
      headerName: "보유건수",
      field: "uldNocs",
      width: 110,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center", fontWeight: 600 },
      valueFormatter: (p) => formatNumber(p.value),
    },
    {
      headerName: "오류율",
      field: "errRt",
      width: 90,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center", color: "#dc2626", fontWeight: 700 },
      valueFormatter: (p) => `${Number(p.value || 0).toFixed(2)}%`,
    },
  ];

  /* ======================= UI ======================= */
  return (
    <div className="w-full">
      <Helmet>
        <title>CDM - 대시보드</title>
      </Helmet>
      {/* 행 1: 참여 과제 현황 | 생성 연구과제현황 정보 */}
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="py-2 font-semibold text-gray-800">참여 과제 현황</div>
          <div className="border-t border-slate-800">
            <div className="flex bg-gray-100 text-center border-b border-slate-300">
              {/* 총계 - 병합 */}
              <div className="flex-1 flex items-center justify-center font-semibold border-r border-zinc-200" style={{ minHeight: "64px" }}>
                총계
              </div>
              {/* 참여요청 - 병합 */}
              <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "64px" }}>
                참여요청
              </div>
              {/* 기관분석 - 서브헤더 포함 */}
              <div className="flex-[3] flex flex-col border-r border-slate-300">
                <div className="flex items-center justify-center py-1 font-semibold border-b border-slate-300">기관분석</div>
                <div className="flex">
                  <div className="flex-1 flex items-center justify-center py-1 font-semibold border-r border-slate-300">진행중</div>
                  <div className="flex-1 flex items-center justify-center py-1 font-semibold border-r border-slate-300">검토요청</div>
                  <div className="flex-1 flex items-center justify-center py-1 font-semibold">검토완료</div>
                </div>
              </div>
              {/* 메타분석 - 서브헤더 포함 */}
              <div className="flex-[2] flex flex-col border-r border-slate-300">
                <div className="flex items-center justify-center py-1 font-semibold border-b border-slate-300">메타분석</div>
                <div className="flex">
                  <div className="flex-1 flex items-center justify-center py-1 font-semibold border-r border-slate-300">검토요청</div>
                  <div className="flex-1 flex items-center justify-center py-1 font-semibold">검토완료</div>
                </div>
              </div>
              {/* 마감 - 병합 */}
              <div className="flex-1 flex items-center justify-center font-semibold" style={{ minHeight: "64px" }}>
                마감
              </div>
            </div>
            <div className="flex text-center border-b border-zinc-200">
              {[
                { value: asmtStats.totalCnt,             status: null,  border: true },
                { value: asmtStats.reqCnt,               status: "01",  border: true }, // 참여요청
                { value: asmtStats.instProgressCnt,      status: "02",  border: true }, // 진행중(통합,기관분석)
                { value: asmtStats.instReviewReqCnt,     status: "02",  border: true }, // 진행중(통합,기관분석)
                { value: asmtStats.instReviewCompleteCnt,status: "02",  border: true }, // 진행중(통합,기관분석)
                { value: asmtStats.metaReviewReqCnt,     status: "03",  border: true }, // 진행중(메타분석)
                { value: asmtStats.metaReviewCompleteCnt,status: "03",  border: true }, // 진행중(메타분석)
                { value: asmtStats.closeCnt,             status: "04",  border: false }, // 마감
              ].map(({ value, status, border }, idx) => (
                <div
                  key={`${status ?? "total"}-${idx}`}
                  className={`flex-1 py-2 text-center${border ? " border-r border-zinc-200" : ""}`}
                >
                  {safe(value)}건
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="py-2 font-semibold text-gray-800">생성 연구과제현황 정보</div>
          <div className="border-t border-slate-800">
            <div className="flex bg-gray-100 text-center border-b border-slate-300">
              {/* 총계 - 병합 */}
              <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "64px" }}>
                총계
              </div>
              {/* 참여요청 - 병합 */}
              <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "64px" }}>
                참여요청
              </div>
              {/* 진행중 - 서브헤더 포함 */}
              <div className="flex-[2] flex flex-col border-r border-slate-300">
                <div className="flex items-center justify-center py-1 font-semibold border-b border-slate-300">진행중</div>
                <div className="flex">
                  <div className="flex-1 flex items-center justify-center py-1 font-semibold border-r border-slate-300">통합/기관</div>
                  <div className="flex-1 flex items-center justify-center py-1 font-semibold">메타분석</div>
                </div>
              </div>
              {/* 마감 - 병합 */}
              <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "64px" }}>
                마감
              </div>
              {/* 취소 - 병합 */}
              <div className="flex-1 flex items-center justify-center font-semibold" style={{ minHeight: "64px" }}>
                취소
              </div>
            </div>
            <div className="flex text-center border-b border-slate-200">
              {[
                { value: createdStats.totalCnt, status: null, border: true },
                { value: createdStats.reqCnt, status: "01", border: true },
                { value: createdStats.progressCnt, status: "02", border: true },
                { value: createdStats.reviewCnt, status: "03", border: true },
                { value: createdStats.closeCnt, status: "04", border: true },
                { value: createdStats.cancelCnt, status: "05", border: false },
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
                      {safe(value)}
                    </button>
                  ) : safe(value)}건
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SpaceBox gap={CONTENT_GAP.SMALL} />

      {/* 행 2: 회의/행사·자료실 | CDM 데이터 정보·테이블별 보유량 */}
      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          {/* 업로드 진행 현황 */}
          <div>
            <div className="py-2 font-semibold text-gray-800">업로드 진행 현황</div>
            <div className="border-t border-slate-800">
              <div className="flex bg-gray-100 text-center border-b border-slate-300">
                <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                  총계
                </div>
                <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                  참여요청
                </div>
                <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                  진행중
                </div>
                <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                  완료
                </div>
                <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                  참여취소
                </div>
                <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                  등록
                </div>
                <div className="flex-1 flex items-center justify-center font-semibold border-r border-slate-300" style={{ minHeight: "42px" }}>
                  참여재요청
                </div>
                <div className="flex-1 flex items-center justify-center font-semibold" style={{ minHeight: "42px" }}>
                  등록재요청
                </div>
              </div>
              <div className="flex text-center border-b border-zinc-200">
                {[
                  { value: uldPrgrStats.totalCnt, stts: null, border: true },
                  { value: uldPrgrStats.reqCnt, stts: "01", border: true },
                  { value: uldPrgrStats.progressCnt, stts: "02", border: true },
                  { value: uldPrgrStats.completeCnt, stts: "03", border: true },
                  { value: uldPrgrStats.cancelCnt, stts: "04", border: true },
                  { value: uldPrgrStats.regCnt, stts: "05", border: true },
                  { value: uldPrgrStats.reReqCnt, stts: "06", border: true },
                  { value: uldPrgrStats.reRegCnt, stts: "07", border: false },
                ].map(({ value, stts, border }) => (
                  <div key={stts ?? "total"} className={`flex-1 py-2 text-center${border ? " border-r border-zinc-200" : ""}`}>
                    {stts ? (
                      <button
                        type="button"
                        className="cursor-pointer text-blue-600 hover:underline bg-transparent border-0 p-0"
                        onClick={() => navigate(`${routes.CDM.DISCLOSURES_CUSTOMER}?uldPrgrSttsCd=${stts}&page=1`)}
                      >
                        {safe(value)}
                      </button>
                    ) : safe(value)}건
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="py-2 font-semibold text-gray-800">회의/행사 정보</div>
            <div className="ag-theme-cdm w-full" style={{ height: ROW_HEIGHT * DASHBOARD_ROWS_SMALL + HEADER_HEIGHT }}>
              <AgGridReact
                rowData={meetingData}
                columnDefs={meetingColumns}
                rowHeight={ROW_HEIGHT}
                headerHeight={HEADER_HEIGHT}
                domLayout="normal"
                overlayNoRowsTemplate="<span>게시물이 존재하지 않습니다.</span>"
                suppressHorizontalScroll
                onRowClicked={(e) => navigate(`${routes.COMMUNITY.ROOT}/meetingEventInfo/admin/detail/${e.data.pstSn}`)}
              />
            </div>
          </div>
          <SpaceBox gap={CONTENT_GAP.MEDIUM} />
          <div>
            <div className="py-2 font-semibold text-gray-800">자료실</div>
            <div className="ag-theme-cdm w-full" style={{ height: ROW_HEIGHT * DASHBOARD_ROWS_SMALL + HEADER_HEIGHT }}>
              <AgGridReact
                rowData={archiveData}
                columnDefs={archiveColumns}
                rowHeight={ROW_HEIGHT}
                headerHeight={HEADER_HEIGHT}
                domLayout="normal"
                overlayNoRowsTemplate="<span>게시물이 존재하지 않습니다.</span>"
                suppressHorizontalScroll
                onRowClicked={(e) => navigate(`${routes.COMMUNITY.ROOT}/resourceCenter/admin/detail/${e.data.pstSn}`)}
              />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-6">
          <div>
            <div className="py-2 font-semibold text-gray-800">CDM 데이터 정보</div>
            <div className="border-t border-slate-800">
              <div className="flex bg-gray-100 text-center border-b border-slate-300">
                <div className="flex-1 py-2 font-semibold border-r border-zinc-200">보유건수</div>
                <div className="flex-1 py-2 font-semibold">오류율</div>
              </div>
              <div className="flex text-center border-b border-zinc-200">
                <div className="flex-1 py-2 border-r border-zinc-200">{safe(cdmStats.uldNocs).toLocaleString()}건</div>
                <div className="flex-1 py-2 text-red-500 font-semibold">
                  {Number(safe(cdmStats.errRt)).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="py-2 font-semibold text-gray-800">테이블별 보유량</div>
            <div className="ag-theme-cdm w-full" style={{ height: ROW_HEIGHT * DASHBOARD_ROWS_LARGE + HEADER_HEIGHT }}>
              <AgGridReact
                rowData={tableData}
                columnDefs={tableColumns}
                rowHeight={ROW_HEIGHT}
                headerHeight={HEADER_HEIGHT}
                domLayout="normal"
                overlayNoRowsTemplate="<span>게시물이 존재하지 않습니다.</span>"
                suppressHorizontalScroll
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
