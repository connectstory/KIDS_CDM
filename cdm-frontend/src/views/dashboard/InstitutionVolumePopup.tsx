import { Button, MenuItem, Select, Typography } from "@mui/material";
import { type ColDef, AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { X } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchInstUploadList,
  fetchErrorSummary,
  fetchTblUldStats,
  fetchInstCdmOverview,
} from "@/api/communityApi";
import { cdmTableDisplayName } from "@/utils/cdmTableUtils";
import { Helmet } from "react-helmet";

ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  onClose: () => void;
}

function formatYmd(ymd?: string) {
  if (ymd?.length !== 8) return "-";
  return `${ymd.substring(0, 4)}.${ymd.substring(4, 6)}.${ymd.substring(6, 8)}`;
}

export default function InstitutionVolumePopup({ onClose }: Readonly<Props>) {
  const [selectedInstId, setSelectedInstId] = useState<string>("");           // instId(brno) - errorSummary, tblUldStats용
  const [selectedInstSn, setSelectedInstSn] = useState<number | undefined>(undefined); // ptcpInstSn - instCdmOverview용

  const TABLE_NAME_MAP: Record<string, string> = {
    "01": "Enrollment",
    "02": "Demographic",
    "03": "Dispensing",
    "04": "Encounter",
    "05": "Diagnosis",
    "06": "Procedure",
    "07": "Laboratory Result",
    "08": "Vital Signs",
    "09": "Death",
    "10": "Cause_of_Death",
    "11": "Observation Period",
    "12": "Person",
    "13": "Drug Exposure",
    "14": "Visit Occurrence",
    "15": "Condition Occurrence",
    "16": "Procedure Occurrence",
    "17": "Measurement",
    "18": "Observation",
    "19": "Death (OMOP)",
  };

  const TABLE_LABEL_MAP: Record<string, { min?: string; max?: string; count?: string }> = {
    "02": { count: "총 건수" },
    "01": { min: "최초 방문일", max: "최종 방문일" },
    "03": { min: "최초 약물처방일", max: "최종 약물처방일" },
    "04": { min: "방문 시작일", max: "방문 종료일" },
    "05": { min: "진단 시작일", max: "진단 종료일" },
    "06": { min: "시술 시작일", max: "시술 종료일" },
    "07": { min: "검사 시작일", max: "검사 종료일" },
    "08": { min: "측정 시작일", max: "측정 종료일" },
    "09": { min: "사망 시작일", max: "사망 종료일" },
    "10": { min: "사인 시작일", max: "사인 종료일" },
    "11": { min: "관찰 시작일", max: "관찰 종료일" },
    "12": { count: "총 환자 수" },
    "13": { min: "약물 시작일", max: "약물 종료일" },
    "14": { min: "방문 시작일", max: "방문 종료일" },
    "15": { min: "상태 시작일", max: "상태 종료일" },
    "16": { min: "시술 시작일", max: "시술 종료일" },
    "17": { min: "측정 시작일", max: "측정 종료일" },
    "18": { min: "관찰 시작일", max: "관찰 종료일" },
    "19": { min: "사망 시작일", max: "사망 종료일" },
  };

  const tableColumns: ColDef[] = [
    {
      headerName: "TABLE",
      field: "tableName",
      flex: 1,
      headerClass: "ag-header-center",
      cellClass: "ag-cell-center-vertical",
      valueFormatter: (params) => cdmTableDisplayName(params.value ?? ""),
    },
    {
      headerName: "건수",
      field: "uldNocs",
      width: 120,
      headerClass: "ag-header-center",
      cellClass: "ag-cell-center-vertical",
      valueFormatter: (params) => {
        const v = params.value;
        if (v === null || v === undefined || v === "") return "-";
        return Number(v).toLocaleString();
      },
    },
  ];

  /* =========================
      React Query: 기관 목록 조회
  ========================= */
  const instListQuery = useQuery({
    queryKey: ["instUploadList"],
    queryFn: fetchInstUploadList,
    select: (data) => {
      // 첫 번째 기관을 자동 선택
      if (data && data.length > 0 && !selectedInstId) {
        const firstItem = data[0];
        if (firstItem.instId) {
          setTimeout(() => {
            setSelectedInstId(String(firstItem.instId));
            setSelectedInstSn(firstItem.ptcpInstSn ? Number(firstItem.ptcpInstSn) : undefined);
          }, 0);
        }
      }
      return data;
    },
  });

  const instList = instListQuery.data || [];

  /* =========================
      React Query: 선택된 기관의 상세 데이터
  ========================= */

  // 오류 요약 - instId(brno) 기준
  const errorSummaryQuery = useQuery({
    queryKey: ["errorSummary", selectedInstId],
    queryFn: () => fetchErrorSummary(selectedInstId),
    enabled: !!selectedInstId,
    staleTime: 1000 * 60,
  });

  // 테이블별 보유량 - instId(brno) 기준
  const tblUldStatsQuery = useQuery({
    queryKey: ["tblUldStats", selectedInstId],
    queryFn: () => fetchTblUldStats(selectedInstId),
    enabled: !!selectedInstId,
    staleTime: 1000 * 60,
  });

  // 기관 CDM 개요 - ptcpInstSn 기준
  const instCdmOverviewQuery = useQuery({
    queryKey: ["instCdmOverview", selectedInstSn],
    queryFn: () => fetchInstCdmOverview(selectedInstSn!),
    enabled: !!selectedInstSn,
    staleTime: 1000 * 60,
  });

  const uldStats = errorSummaryQuery.data || null;
  const tblStats = tblUldStatsQuery.data || [];
  const overviewList = instCdmOverviewQuery.data || [];

  const sentinelData = tblStats.filter((d: any) => d.modelType === "Sentinel");
  const omopData = tblStats.filter((d: any) => d.modelType === "OMOP");

  /* =========================
      유틸리티 함수
  ========================= */
  const safe = (v: any) => (v === null || v === undefined || v === "" ? "-" : v);

  const formatDate = (v: any) => {
    if (!v) return "-";
    const datePart = String(v).substring(0, 10);
    if (datePart.includes("-")) {
      return datePart.replaceAll("-", ".");
    } else if (datePart.length >= 8) {
      const s = datePart.replaceAll(/\D/g, "");
      return `${s.substring(0, 4)}.${s.substring(4, 6)}.${s.substring(6, 8)}`;
    }
    return datePart;
  };

  const base = overviewList[0] || {};

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/40 pt-20">
      <Helmet>
        <title>CDM - 대시보드</title>
      </Helmet>
      <div className="w-[900px] max-h-[90vh] bg-white rounded-lg border border-zinc-400 shadow-lg flex flex-col mt-2">
        <div className="flex items-center justify-between px-4 py-3 pt-5">
          <Typography variant="h5">기관별 CDM 보유량 정보 조회</Typography>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-end px-5 pt-4">
          <Select
            fullWidth
            sx={{ maxWidth: "20rem" }}
            value={selectedInstId || ""}
            displayEmpty
            onChange={(e) => {
              const inst = instList.find(
                (i: any) => String(i.instId) === e.target.value
              );
              setSelectedInstId(e.target.value);
              setSelectedInstSn(inst?.ptcpInstSn ? Number(inst.ptcpInstSn) : undefined);
            }}
            renderValue={(v) => {
              if (!v) return "기관을 선택하세요";
              const inst = instList.find(
                (i: any) => String(i.instId) === v
              );
              return inst?.instName || "";
            }}
          >
            {instList.map((inst: any) => (
              <MenuItem
                key={inst.ptcpInstSn}
                value={String(inst.instId)}
              >
                {inst.instName}
              </MenuItem>
            ))}
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          {/* CDM 데이터 보유현황 정보 */}
          <div>
            <div className="py-2 font-semibold text-gray-800">CDM 데이터 보유현황 정보</div>
            <div className="border-t border-slate-800">
              <div className="grid grid-cols-4 text-center border-b border-zinc-200">
                <div className="bg-gray-100 py-2">보유건수</div>
                <div className="py-2">
                  {(uldStats?.uldNocs ?? 0).toLocaleString()}건
                </div>
                <div className="bg-gray-100 py-2">업로드일자</div>
                <div className="py-2 text-red-500 font-semibold">
                  {formatDate(uldStats?.lastUldDt)}
                </div>
              </div>
            </div>
          </div>

          {/* Sentinel / OMOP 그리드 */}
          <div className="grid grid-cols-2 gap-6">
            {[
              ["▶ Sentinel", sentinelData],
              ["▶ OMOP", omopData],
            ].map(([title, data]: any) => (
              <div key={title}>
                <div className="py-2 font-semibold border-b border-slate-300">{title}</div>
                <div className="ag-theme-cdm w-full">
                  <AgGridReact
                    rowData={data}
                    columnDefs={tableColumns}
                    domLayout="autoHeight"
                    overlayNoRowsTemplate="<span>게시물이 존재하지 않습니다.</span>"
                    rowHeight={40}
                    headerHeight={40}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* CDM 현황 등록 정보 */}
          <div>
            <div className="py-2 font-semibold text-gray-800">CDM 현황 등록 정보</div>
            <div className="border-t border-slate-800">
              <div className="grid grid-cols-4 bg-gray-100 text-center border-b border-slate-300">
                <div className="py-2">CDM 버전</div>
                <div className="py-2">업데이트 주기</div>
                <div className="py-2">최종 업데이트</div>
                <div className="py-2">등록일자</div>
              </div>
              <div className="grid grid-cols-4 text-center border-b border-slate-200">
                <div className="py-2">{safe(base.cdmVersion)}</div>
                <div className="py-2">{base.updateCycle ? `${base.updateCycle}일` : "-"}</div>
                <div className="py-2">{formatDate(safe(base.lastUpdtYmd))}</div>
                <div className="py-2">{formatDate(safe(base.regDt))}</div>
              </div>
            </div>
          </div>

          {/* 상세 테이블 리스트 */}
          <div className="border-t border-gray-500">
            {overviewList.map((row: any) => {
              const labels = TABLE_LABEL_MAP[row.tableType] || {};
              return (
                <div key={row.tableType} className="grid grid-cols-5 border-b border-gray-300">
                  <div className="bg-gray-100 px-3 py-2 font-medium">
                    {TABLE_NAME_MAP[row.tableType] || row.tableType}
                  </div>
                  <div className="bg-gray-50 px-3 py-2 text-gray-600">
                    · {labels.count || labels.min}
                  </div>
                  <div className="px-3 py-2">
                    {labels.count
                      ? `${row.totalNocs.toLocaleString()} 건`
                      : formatYmd(row.minDate)}
                  </div>
                  <div className="bg-gray-50 px-3 py-2 text-gray-600">
                    {labels.max ? `· ${labels.max}` : ""}
                  </div>
                  <div className="px-3 py-2">
                    {labels.max ? formatYmd(row.maxDate) : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end px-5 py-4 border-t border-zinc-200">
          <Button variant="outlined" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}