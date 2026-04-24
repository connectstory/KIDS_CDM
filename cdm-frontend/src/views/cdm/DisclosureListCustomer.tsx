import { useCallback, useEffect, useMemo, useState } from "react";
import { Chip, MenuItem, Select, Stack } from "@mui/material";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AllCommunityModule, type ColDef, type ICellRendererParams, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types";
import type {
  DisclosureListResponse,
  DisclosurePartnerResponse,
  DisclosureSearchRequest,
} from "@/interfaces/disclosureInterface";
import { DisclosureAPI } from "@/api/disclosureApi";
import type { RootState } from "@/store";
import { setPblntSn } from "@/store/sessionSlice";
import { formatDateFromYYYYMMDD, formatDateToYYYYMMDD } from "@/utils/dateUtils";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import CdmPagination from "@/components/CdmPagination";
import CdmPaginationMove from "@/components/CdmPaginationMove";
import { SearchArea } from "@/components/SearchArea";
import { SpaceBox } from "@/components/SpaceBox";

ModuleRegistry.registerModules([AllCommunityModule]);

/** URL 쿼리 키 */
const Q = {
  PAGE: "page",
  PBLNT_DVCD: "pblntDvcd",
  ULD_PRGR_STTS_CD: "uldPrgrSttsCd",
  SEARCH_START_DATE: "searchStartDate",
  SEARCH_END_DATE: "searchEndDate",
  SEARCH_TYPE: "searchType",
  SEARCH_KEYWORD: "searchKeyword",
  LENGTH: "length",
} as const;

type SearchState = {
  pblntDvcd: string;
  uldPrgrSttsCd: string;
  searchType: string;
  searchKeyword: string;
  startdate: dayjs.Dayjs | null;
  enddate: dayjs.Dayjs | null;
  viewCount: string;
  currentPage: number;
};

const defaultSearchState: SearchState = {
  pblntDvcd: "",
  uldPrgrSttsCd: "",
  searchType: "",
  searchKeyword: "",
  startdate: null,
  enddate: null,
  viewCount: "10",
  currentPage: 1,
};

function parseSearchParamsFromURL(searchParams: URLSearchParams): SearchState {
  const page = searchParams.get(Q.PAGE);
  const startDateStr = searchParams.get(Q.SEARCH_START_DATE);
  const endDateStr = searchParams.get(Q.SEARCH_END_DATE);
  return {
    pblntDvcd: searchParams.get(Q.PBLNT_DVCD) ?? defaultSearchState.pblntDvcd,
    uldPrgrSttsCd: searchParams.get(Q.ULD_PRGR_STTS_CD) ?? defaultSearchState.uldPrgrSttsCd,
    searchType: searchParams.get(Q.SEARCH_TYPE) ?? defaultSearchState.searchType,
    searchKeyword: searchParams.get(Q.SEARCH_KEYWORD) ?? defaultSearchState.searchKeyword,
    startdate: startDateStr && dayjs(startDateStr).isValid() ? dayjs(startDateStr) : null,
    enddate: endDateStr && dayjs(endDateStr).isValid() ? dayjs(endDateStr) : null,
    viewCount: searchParams.get(Q.LENGTH) ?? defaultSearchState.viewCount,
    currentPage: page ? Math.max(1, parseInt(page, 10) || 1) : defaultSearchState.currentPage,
  };
}

function buildURLSearchParams(state: SearchState, pageOverride?: number): Record<string, string> {
  const page = pageOverride ?? state.currentPage;
  const params: Record<string, string> = {
    [Q.PAGE]: String(page),
    [Q.PBLNT_DVCD]: state.pblntDvcd,
    [Q.ULD_PRGR_STTS_CD]: state.uldPrgrSttsCd,
    [Q.SEARCH_TYPE]: state.searchType,
    [Q.LENGTH]: state.viewCount,
  };
  if (state.searchKeyword.trim()) params[Q.SEARCH_KEYWORD] = state.searchKeyword.trim();
  if (state.startdate) params[Q.SEARCH_START_DATE] = state.startdate.format("YYYY-MM-DD");
  if (state.enddate) params[Q.SEARCH_END_DATE] = state.enddate.format("YYYY-MM-DD");
  return params;
}

const DISCLOSURE_TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "01", label: "정기" },
  { value: "02", label: "비정기" },
];

const INST_UPLOAD_STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "01", label: "참여요청" },
  { value: "02", label: "진행중" },
  { value: "03", label: "완료" },
  { value: "04", label: "참여취소" },
  { value: "05", label: "등록" },
  { value: "06", label: "참여재요청" },
  { value: "07", label: "등록재요청" },
];

const DISCLOSURE_SEARCH_TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "01", label: "제목" },
  { value: "02", label: "내용" },
  { value: "03", label: "제목+내용" },
];

/**
 * 협력기관(참여기관) 전용 공시 목록 페이지
 * - 등록 버튼 없음
 * - 참여기관 필터 없음 (자기 기관 공시만 조회)
 * - SearchArea + URL 쿼리 방식 (Admin과 동일)
 */
export default function DisclosureListCustomer() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const session = useSelector((state: RootState) => state.session);
  const instId = session.instId || "";
  const mbrId = session.mbrId || "";
  const filterInstId = (instId || mbrId)?.trim();

  const appliedState = useMemo(() => parseSearchParamsFromURL(urlSearchParams), [urlSearchParams]);
  const [formState, setFormState] = useState<SearchState>(() => parseSearchParamsFromURL(new URLSearchParams(urlSearchParams)));
  const [searchKeywordError, setSearchKeywordError] = useState(false);

  useEffect(() => {
    const parsed = parseSearchParamsFromURL(urlSearchParams);
    setFormState(parsed);
  }, [urlSearchParams]);

  const { pblntDvcd, uldPrgrSttsCd, searchType, searchKeyword, startdate, enddate, viewCount } = formState;
  const applied = appliedState;

  const setStartDate = (v: dayjs.Dayjs | null) => setFormState((s) => ({ ...s, startdate: v }));
  const setEndDate = (v: dayjs.Dayjs | null) => setFormState((s) => ({ ...s, enddate: v }));
  const setPblntDvcdFilter = (v: string) => setFormState((s) => ({ ...s, pblntDvcd: v }));
  const setUldPrgrSttsCdFilter = (v: string) => setFormState((s) => ({ ...s, uldPrgrSttsCd: v }));
  const setSearchTypeFilter = (v: string) => setFormState((s) => ({ ...s, searchType: v }));
  const setSearchKeywordFilter = (v: string) => setFormState((s) => ({ ...s, searchKeyword: v }));

  const searchParams: DisclosureSearchRequest = useMemo(() => {
    const params: DisclosureSearchRequest = {
      page: applied.currentPage,
      length: parseInt(applied.viewCount, 10),
    };
    if (applied.pblntDvcd) params.pblntDvcd = applied.pblntDvcd;
    if (applied.uldPrgrSttsCd) params.uldPrgrSttsCd = applied.uldPrgrSttsCd;
    if (applied.startdate) params.pblntBgngYmd = formatDateToYYYYMMDD(applied.startdate.format("YYYY-MM-DD"));
    if (applied.enddate) params.pblntEndYmd = formatDateToYYYYMMDD(applied.enddate.format("YYYY-MM-DD"));
    if (applied.searchKeyword.trim()) {
      params.keyword = applied.searchKeyword.trim();
      if (applied.searchType === "01") params.searchType = "title";
      else if (applied.searchType === "02") params.searchType = "content";
      else params.searchType = "both";
    }
    return params;
  }, [applied]);

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["disclosures-customer", searchParams],
    queryFn: () => DisclosureAPI.getDisclosures(searchParams),
    enabled: true,
    staleTime: 0,
    refetchOnMount: "always" as const,
  });

  const disclosures = useMemo(() => response?.data?.data || [], [response?.data?.data]);
  const total = response?.data?.total || 0;
  const currentPage = response?.data?.page || 1;
  const pageLength = response?.data?.length || 10;
  const totalPages = Math.ceil(total / pageLength);

  const uploadTypeLabel = useCallback((uldTypeCd: string | null | undefined): string => {
    const raw = uldTypeCd != null ? String(uldTypeCd).trim() : "";
    if (!raw) return "-";
    const map: Record<string, string> = {
      "01": "파일업로드",
      "02": "현황등록",
    };
    return map[raw] || raw;
  }, []);

  const instUploadStatusLabel = useCallback((uldInstPrgrsSttsStcd: string | null | undefined): string => {
    const raw = uldInstPrgrsSttsStcd != null ? String(uldInstPrgrsSttsStcd).trim() : "";
    if (!raw) return "-";
    const normalized = raw.length === 1 ? `0${raw}` : raw;
    const map: Record<string, string> = {
      "01": "참여요청",
      "02": "진행중",
      "03": "완료",
      "04": "참여취소",
      "05": "등록",
      "06": "참여재요청",
      "07": "등록재요청",
    };
    return map[normalized] || raw;
  }, []);

  // 공시별 참여기관 목록 조회 → 내 기관의 업로드유형(uldTypeCd) 매핑
  const partnerQueries = useQueries({
    queries: disclosures.map((d: DisclosureListResponse) => ({
      queryKey: ["disclosure-partners", d.pblntSn],
      queryFn: async () => {
        const res = await DisclosureAPI.getPartnersByPblntSn(d.pblntSn);
        return (res.data?.data || []) as DisclosurePartnerResponse[];
      },
      enabled: !!d?.pblntSn && !!filterInstId,
      // 목록에서 진행상태(03 완료)를 즉시 반영해야 하므로 캐시 신선도 시간을 0으로 둠
      staleTime: 0,
      refetchOnMount: "always" as const,
      retry: false,
    })),
  });

  const uldTypeByPblntSn = useMemo(() => {
    const map: Record<number, string | null> = {};
    const normalize = (v: unknown) => (v == null ? "" : String(v).trim());
    const target = normalize(filterInstId);

    partnerQueries.forEach((q, idx) => {
      const pblntSn = disclosures[idx]?.pblntSn;
      if (!pblntSn) return;
      const list = q.data;
      if (!Array.isArray(list) || !target) {
        map[pblntSn] = null;
        return;
      }
      const mine = list.find((p: any) => normalize(p?.instId) === target);
      map[pblntSn] = mine?.uldTypeCd ?? null;
    });
    return map;
  }, [disclosures, filterInstId, partnerQueries]);

  // 공시별 내 기관 업로드 진행상태(uldInstPrgrsSttsStcd) 매핑
  const instUploadStatusByPblntSn = (srcPblntSn: number) => {
    const map: Record<number, string | null> = {};
    const normalize = (v: unknown) => (v == null ? "" : String(v).trim());
    const target = normalize(filterInstId);

    partnerQueries.forEach((q, idx) => {
      const pblntSn = disclosures[idx]?.pblntSn;
      if (!pblntSn) return;
      const list = q.data;
      if (!Array.isArray(list) || !target) {
        map[pblntSn] = null;
        return;
      }
      const mine = list.find((p: any) => normalize(p?.instId) === target);
      map[pblntSn] = mine?.uldInstPrgrsSttsStcd ?? null;
    });
    return map[srcPblntSn] ?? null;
  };
  // const instUploadStatusByPblntSn = useMemo(() => {
  // }, [partnerQueries]);

  const applySearchParams = (state: SearchState, pageOverride?: number) => {
    setUrlSearchParams(buildURLSearchParams(state, pageOverride), { replace: false });
  };

  const handleSearch = () => {
    const keyword = formState.searchKeyword.trim();
    const valid = keyword.length === 0 || keyword.length >= 2;
    setSearchKeywordError(keyword.length > 0 && !valid);
    const stateToApply: SearchState = {
      ...formState,
      searchKeyword: valid ? keyword : "",
    };
    applySearchParams(stateToApply, 1);
  };

  const handleResetFilter = () => {
    setSearchKeywordError(false);
    setFormState(defaultSearchState);
    applySearchParams(defaultSearchState);
  };

  const handlePageChange = (page: number) => {
    applySearchParams(appliedState, page);
  };

  type DisclosureRow = {
    pblntSn: number;
    pblntDvcd: string | null;
    ttlNm: string | null;
    period: { pblntBgngYmd: string | null; pblntEndYmd: string | null };
    pblntStcd: string | null;
    uploadType: string | null;
    instUploadStatus: string | null;
    rgtrId: string | null;
    rgtrNm: string | null;
  };

  const rowData: DisclosureRow[] = useMemo(
    () =>
      disclosures.map((item: DisclosureListResponse) => ({
        pblntSn: item.pblntSn,
        pblntDvcd: item.pblntDvcd,
        ttlNm: item.ttlNm,
        period: {
          pblntBgngYmd: item.pblntBgngYmd,
          pblntEndYmd: item.pblntEndYmd,
        },
        pblntStcd: item.pblntStcd ?? null,
        uploadType: uldTypeByPblntSn[item.pblntSn] ?? null,
        instUploadStatus: instUploadStatusByPblntSn(item.pblntSn) ?? null,
        rgtrId: item.rgtrId,
        rgtrNm: item.rgtrNm ?? null,
      })),
    [disclosures, partnerQueries]
  );

  const colDefs = useMemo<ColDef<DisclosureRow>[]>(
    () => [
      {
        headerName: "번호",
        headerClass: "ag-header-center",
        field: "pblntSn",
        width: 80,
        cellStyle: () => ({ textAlign: "center" }),
      },
      {
        headerName: "구분",
        field: "pblntDvcd",
        width: 100,
        cellRenderer: (p: ICellRendererParams<DisclosureRow>) => {
          return DisclosureAPI.convertType(p.value) || "-";
        },
      },
      {
        headerName: "제목",
        field: "ttlNm",
        flex: 1,
      },
      {
        headerName: "업로드 기간",
        headerClass: "ag-header-center",
        field: "period",
        cellDataType: false,
        flex: 1,
        cellStyle: () => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }),
        cellRenderer: (p: ICellRendererParams<DisclosureRow>) => {
          const period = p.value;
          if (period?.pblntBgngYmd && period?.pblntEndYmd) {
            return `${formatDateFromYYYYMMDD(period.pblntBgngYmd)} ~ ${formatDateFromYYYYMMDD(period.pblntEndYmd)}`;
          }
          return "-";
        },
      },
      {
        headerName: "업로드 유형",
        headerClass: "ag-header-center",
        field: "uploadType",
        width: 140,
        cellStyle: () => ({ textAlign: "center" }),
        valueFormatter: (params) => uploadTypeLabel(params.value),
      },
      {
        headerName: "상태",
        headerClass: "ag-header-center",
        field: "instUploadStatus",
        width: 100,
        cellStyle: () => ({ textAlign: "center" }),
        cellRenderer: (p: ICellRendererParams<DisclosureRow>) => {
          const pblntStcdRaw = p.data?.pblntStcd != null ? String(p.data.pblntStcd).trim() : "";
          if (pblntStcdRaw && DisclosureAPI.convertStatus(pblntStcdRaw) === "마감") {
            return (
              <div className="ag-cell-center-vertical">
                <Chip label="마감" size="small" color="error" />
              </div>
            );
          }
          const statusCode = p.value != null ? (typeof p.value === "string" ? p.value.trim() : String(p.value).trim()) : "";
          const statusText = instUploadStatusLabel(statusCode || null);
          let chipColor: "default" | "primary" | "success" | "error" | "warning" = "default";
          const normalizedCode = statusCode.length === 1 ? `0${statusCode}` : statusCode;
          if (normalizedCode === "01" || normalizedCode === "02") chipColor = "primary";
          else if (normalizedCode === "03") chipColor = "success";
          else if (normalizedCode === "04") chipColor = "error";
          else if (normalizedCode === "05") chipColor = "warning";
          return (
            <div className="ag-cell-center-vertical">
              <Chip label={statusText || statusCode || "-"} size="small" color={chipColor} />
            </div>
          );
        },
      },
      {
        headerName: "작성자",
        headerClass: "ag-header-center",
        cellStyle: () => ({ textAlign: "center" }),
        field: "rgtrNm",
        width: 120,
        valueGetter: (params) => {
          const name = params.data?.rgtrNm;
          return name != null && String(name).trim() !== "" ? String(name).trim() : "-";
        },
      },
    ],
    [uploadTypeLabel, instUploadStatusLabel]
  );

  return (
    <div className="">
      <Helmet>
        <title>CDM - CDM 업로드 공시</title>
      </Helmet>
      <SearchArea
        twoColumn
        showStatusFilter
        statusLabel="구분"
        statusFilter={pblntDvcd}
        onStatusFilterChange={setPblntDvcdFilter}
        statusOptions={DISCLOSURE_TYPE_OPTIONS}
        statusOptionsIncludeCancel={false}
        showStatusFilter2
        statusLabel2="기관진행상태"
        statusFilter2={uldPrgrSttsCd}
        onStatusFilterChange2={setUldPrgrSttsCdFilter}
        statusOptions2={INST_UPLOAD_STATUS_OPTIONS}
        showDateRange
        startDate={startdate}
        endDate={enddate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        searchType={searchType}
        onSearchTypeChange={setSearchTypeFilter}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={(v) => {
          setSearchKeywordFilter(v);
          setSearchKeywordError(false);
        }}
        searchKeywordError={searchKeywordError}
        searchKeywordHelperText={searchKeywordError ? "두자 이상 입력해주세요" : undefined}
        searchTypeOptions={DISCLOSURE_SEARCH_TYPE_OPTIONS}
        onSearch={handleSearch}
        onReset={handleResetFilter}
      />

      <SpaceBox gap={CONTENT_GAP.MEDIUM} />

      <div>
        <div className="tbl_info">
          <div className="total">
            <p className="cases" style={{ whiteSpace: "nowrap" }}>
              전체<span className="count">{total}</span>건
            </p>
          </div>
          <div className="view_count">
            <label htmlFor="viewCountSelect" style={{ whiteSpace: "nowrap" }}>
              조회건수
            </label>
            <Select
              id="viewCountSelect"
              size="small"
              value={viewCount}
              onChange={(e) => {
                const nextViewCount = e.target.value;
                setFormState((s) => ({ ...s, viewCount: nextViewCount, currentPage: 1 }));
                applySearchParams({ ...appliedState, viewCount: nextViewCount, currentPage: 1 }, 1);
              }}
            >
              <MenuItem value="10">10개씩</MenuItem>
              <MenuItem value="30">30개씩</MenuItem>
              <MenuItem value="50">50개씩</MenuItem>
            </Select>
          </div>
        </div>

        {isLoading && <div style={{ textAlign: "center", padding: "40px" }}>로딩 중...</div>}

        {isError && <div style={{ textAlign: "center", padding: "40px", color: "red" }}>오류가 발생했습니다.</div>}

        {!isLoading && !isError && (
          <>
            <div className="ag-theme-cdm w-full" style={{ display: "flex", flexDirection: "column" }}>
              <AgGridReact
                rowData={rowData}
                columnDefs={colDefs}
                domLayout="autoHeight"
                rowHeight={44}
                headerHeight={44}
                overlayNoRowsTemplate={`<span style="padding:8px;">검색된 공시가 없습니다.</span>`}
                onRowClicked={(event) => {
                  if (event.data?.pblntSn) {
                    dispatch(setPblntSn(event.data.pblntSn));
                    navigate(`${routes.CDM.DISCLOSURE_DETAIL_CUSTOMER}?pblntSn=${event.data.pblntSn}`);
                  }
                }}
                rowStyle={{ cursor: "pointer" }}
              />
            </div>

            {totalPages > 0 && (
              <>
                <div style={{ marginTop: "16px" }} />
                <Stack direction="row" className="paging_wrap">
                  <CdmPagination page={currentPage} totalPages={totalPages} onChange={handlePageChange} />
                  <CdmPaginationMove currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </Stack>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
