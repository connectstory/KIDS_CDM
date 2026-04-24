import { useEffect, useMemo, useState } from "react";
import { Button, Chip, MenuItem, Select, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AllCommunityModule, type ColDef, type ICellRendererParams, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types";
import type { DisclosureListResponse, DisclosureSearchRequest } from "@/interfaces/disclosureInterface";
import { ModalNames } from "@/interfaces/modalInterface";
import type { PartnerResponse } from "@/interfaces/researchInterface";
import { DisclosureAPI } from "@/api/disclosureApi";
import type { RootState } from "@/store";
import { setPblntSn } from "@/store/sessionSlice";
import { formatDateFromYYYYMMDD, formatDateToYYYYMMDD } from "@/utils/dateUtils";
import { useCmRoutes, useIsAdminCmShell } from "@/hooks/useCmRoutes";
import { useModal } from "@/hooks/useModal";
import CdmPagination from "@/components/CdmPagination";
import CdmPaginationMove from "@/components/CdmPaginationMove";
import { SearchArea } from "@/components/SearchArea";
import { SpaceBox } from "@/components/SpaceBox";

ModuleRegistry.registerModules([AllCommunityModule]);

/** URL 쿼리 키 */
const Q = {
  PAGE: "page",
  PBLNT_DVCD: "pblntDvcd",
  PBLNT_STCD: "pblntStcd",
  SEARCH_START_DATE: "searchStartDate",
  SEARCH_END_DATE: "searchEndDate",
  SEARCH_TYPE: "searchType",
  SEARCH_KEYWORD: "searchKeyword",
  LENGTH: "length",
  INST_IDS: "instIds",
} as const;

type SearchState = {
  pblntDvcd: string;
  pblntStcd: string;
  searchType: string;
  searchKeyword: string;
  startdate: dayjs.Dayjs | null;
  enddate: dayjs.Dayjs | null;
  viewCount: string;
  currentPage: number;
  instIds: string;
};

const defaultSearchState: SearchState = {
  pblntDvcd: "",
  pblntStcd: "",
  searchType: "",
  searchKeyword: "",
  startdate: null,
  enddate: null,
  viewCount: "10",
  currentPage: 1,
  instIds: "",
};

function parseSearchParamsFromURL(searchParams: URLSearchParams): SearchState {
  const page = searchParams.get(Q.PAGE);
  const startDateStr = searchParams.get(Q.SEARCH_START_DATE);
  const endDateStr = searchParams.get(Q.SEARCH_END_DATE);
  return {
    pblntDvcd: searchParams.get(Q.PBLNT_DVCD) ?? defaultSearchState.pblntDvcd,
    pblntStcd: searchParams.get(Q.PBLNT_STCD) ?? defaultSearchState.pblntStcd,
    searchType: searchParams.get(Q.SEARCH_TYPE) ?? defaultSearchState.searchType,
    searchKeyword: searchParams.get(Q.SEARCH_KEYWORD) ?? defaultSearchState.searchKeyword,
    startdate: startDateStr && dayjs(startDateStr).isValid() ? dayjs(startDateStr) : null,
    enddate: endDateStr && dayjs(endDateStr).isValid() ? dayjs(endDateStr) : null,
    viewCount: searchParams.get(Q.LENGTH) ?? defaultSearchState.viewCount,
    currentPage: page ? Math.max(1, parseInt(page, 10) || 1) : defaultSearchState.currentPage,
    instIds: "", // searchParams.get(Q.INST_IDS) ?? defaultSearchState.instIds,
  };
}

function buildURLSearchParams(state: SearchState, pageOverride?: number): Record<string, string> {
  const page = pageOverride ?? state.currentPage;
  const params: Record<string, string> = {
    [Q.PAGE]: String(page),
    [Q.PBLNT_DVCD]: state.pblntDvcd,
    [Q.PBLNT_STCD]: state.pblntStcd,
    [Q.SEARCH_TYPE]: state.searchType,
    [Q.LENGTH]: state.viewCount,
  };
  if (state.searchKeyword.trim()) params[Q.SEARCH_KEYWORD] = state.searchKeyword.trim();
  if (state.startdate) params[Q.SEARCH_START_DATE] = state.startdate.format("YYYY-MM-DD");
  if (state.enddate) params[Q.SEARCH_END_DATE] = state.enddate.format("YYYY-MM-DD");
  if (state.instIds.trim()) params[Q.INST_IDS] = state.instIds.trim();
  return params;
}

function instIdsToPartners(instIds: string): PartnerResponse[] {
  if (!instIds.trim()) return [];
  return instIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => ({ instId: id, instNm: id, brno: id }));
}

const DISCLOSURE_TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "01", label: "정기" },
  { value: "02", label: "비정기" },
];

const DISCLOSURE_STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "01", label: "등록" },
  { value: "02", label: "진행중" },
  { value: "03", label: "마감" },
];

const DISCLOSURE_SEARCH_TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "01", label: "공시명" },
  { value: "02", label: "내용" },
  { value: "03", label: "공시명+내용" },
];

export default function CDMUploadNotice() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const AddPartnersModal = useModal(ModalNames.AddPartners);
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  const isAdminShell = useIsAdminCmShell();

  const session = useSelector((state: RootState) => state.session);

  const appliedState = useMemo(() => parseSearchParamsFromURL(urlSearchParams), [urlSearchParams]);
  const [formState, setFormState] = useState<SearchState>(() => parseSearchParamsFromURL(new URLSearchParams(urlSearchParams)));
  const [selectedPartners, setSelectedPartners] = useState<PartnerResponse[]>(() => instIdsToPartners(appliedState.instIds));
  const [searchKeywordError, setSearchKeywordError] = useState(false);

  useEffect(() => {
    const parsed = parseSearchParamsFromURL(urlSearchParams);
    setFormState(parsed);
    setSelectedPartners(instIdsToPartners(parsed.instIds));
  }, [urlSearchParams]);

  const { pblntDvcd, pblntStcd, searchType, searchKeyword, startdate, enddate, viewCount } = formState;
  const applied = appliedState;

  const setStartDate = (v: dayjs.Dayjs | null) => setFormState((s) => ({ ...s, startdate: v }));
  const setEndDate = (v: dayjs.Dayjs | null) => setFormState((s) => ({ ...s, enddate: v }));
  const setPblntDvcdFilter = (v: string) => setFormState((s) => ({ ...s, pblntDvcd: v }));
  const setPblntStcdFilter = (v: string) => setFormState((s) => ({ ...s, pblntStcd: v }));
  const setSearchTypeFilter = (v: string) => setFormState((s) => ({ ...s, searchType: v }));
  const setSearchKeywordFilter = (v: string) => setFormState((s) => ({ ...s, searchKeyword: v }));

  const searchParams: DisclosureSearchRequest = useMemo(() => {
    const params: DisclosureSearchRequest = {
      page: applied.currentPage,
      length: parseInt(applied.viewCount, 10),
    };
    if (applied.pblntDvcd) params.pblntDvcd = applied.pblntDvcd;
    if (applied.pblntStcd) params.pblntStcd = applied.pblntStcd;
    if (applied.startdate) params.pblntBgngYmd = formatDateToYYYYMMDD(applied.startdate.format("YYYY-MM-DD"));
    if (applied.enddate) params.pblntEndYmd = formatDateToYYYYMMDD(applied.enddate.format("YYYY-MM-DD"));
    if (applied.searchKeyword.trim()) {
      params.keyword = applied.searchKeyword.trim();
      if (applied.searchType === "01") params.searchType = "title";
      else if (applied.searchType === "02") params.searchType = "content";
      else params.searchType = "both";
    }
    if (applied.instIds.trim()) {
      params.instIdList = applied.instIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    }
    return params;
  }, [applied]);

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["disclosures", searchParams],
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

  const applySearchParams = (state: SearchState, pageOverride?: number) => {
    setUrlSearchParams(buildURLSearchParams(state, pageOverride), { replace: false });
  };

  const handleSearch = () => {
    const keyword = formState.searchKeyword.trim();
    const valid = keyword.length === 0 || keyword.length >= 2;
    setSearchKeywordError(keyword.length > 0 && !valid);
    const instIdsFromPartners = selectedPartners
      .map((p) => (p.instId || p.brno || "").trim())
      .filter(Boolean)
      .join(",");
    const stateToApply: SearchState = {
      ...formState,
      searchKeyword: valid ? keyword : "",
      instIds: instIdsFromPartners,
    };
    applySearchParams(stateToApply, 1);
  };

  const handleResetFilter = () => {
    setSearchKeywordError(false);
    setFormState(defaultSearchState);
    setSelectedPartners([]);
    applySearchParams(defaultSearchState);
  };

  const handlePageChange = (page: number) => {
    applySearchParams(appliedState, page);
  };

  const handleOpenPartnerModal = async () => {
    try {
      const result = (await AddPartnersModal.open({
        title: "참여기관 추가",
        data: selectedPartners,
      })) as PartnerResponse[];

      if (result && Array.isArray(result)) {
        setSelectedPartners(result);
      }
    } catch {}
  };

  const handleRemovePartner = (brno: string) => {
    setSelectedPartners((prev) => prev.filter((p) => p.brno !== brno));
  };

  type DisclosureRow = {
    pblntSn: number;
    pblntDvcd: string | null;
    ttlNm: string | null;
    period: { pblntBgngYmd: string | null; pblntEndYmd: string | null };
    pblntStcd: string | null;
    rgtrId: string | null;
    rgtrNm?: string | null;
    cdmPartnersCount?: number;
    statusPartnersCount?: number;
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
        pblntStcd: item.pblntStcd,
        rgtrId: item.rgtrId,
        rgtrNm: item.rgtrNm,
        cdmPartnersCount: item.completedPartnersCount,
        statusPartnersCount: item.totalPartnersCount,
      })),
    [disclosures]
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
        headerName: "공시명",
        field: "ttlNm",
        flex: 1,
      },
      {
        headerName: "공시 기간",
        headerClass: "ag-header-center",
        field: "period",
        cellDataType: false,
        width: 170,
        cellStyle: () => ({
          textAlign: "center",
          whiteSpace: "normal",
          lineHeight: "1.2",
          padding: 0,
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
        headerName: "기관(등록/대상)",
        headerClass: "ag-header-center",
        field: "cdmPartnersCount",
        width: 130,
        cellStyle: () => ({ textAlign: "center" }),
        cellRenderer: (p: ICellRendererParams<DisclosureRow>) => {
          const cdmCount = p.data?.cdmPartnersCount ?? 0;
          const statusCount = p.data?.statusPartnersCount ?? 0;
          return `${cdmCount}/${statusCount}`;
        },
      },
      {
        headerName: "공시상태",
        headerClass: "ag-header-center",
        field: "pblntStcd",
        width: 110,
        cellStyle: () => ({ textAlign: "center" }),
        cellRenderer: (p: ICellRendererParams<DisclosureRow>) => {
          const raw = p.data?.pblntStcd != null ? String(p.data.pblntStcd).trim() : "";
          if (!raw) return "-";
          const text = DisclosureAPI.convertStatus(raw);
          const n = DisclosureAPI.normalizePblntStcd(raw);
          let chipColor: "default" | "primary" | "success" | "error" | "warning" = "default";
          if (n === "03") chipColor = "error";
          else if (n === "02") chipColor = "primary";
          else chipColor = "default";
          return (
            <div className="ag-cell-center-vertical">
              <Chip label={text} size="small" color={chipColor} />
            </div>
          );
        },
      },
      {
        headerName: "작성자",
        headerClass: "ag-header-center",
        cellStyle: () => ({ textAlign: "center" }),
        field: "rgtrNm",
        width: 150,
        // 작성자명만 표시 (아이디 미표시). 백엔드 조인으로 조회한 rgtrNm 없으면 "-"
        valueGetter: (params) => {
          const name = params.data?.rgtrNm;
          return name != null && String(name).trim() !== "" ? String(name).trim() : "-";
        },
      },
    ],
    []
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
        statusLabel2="공시상태"
        statusFilter2={pblntStcd}
        onStatusFilterChange2={setPblntStcdFilter}
        statusOptions2={DISCLOSURE_STATUS_OPTIONS}
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
        showPartnerFilter={isAdminShell}
        partnerLabel="참여기관"
        selectedPartners={selectedPartners}
        onOpenPartnerModal={handleOpenPartnerModal}
        onRemovePartner={handleRemovePartner}
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
          {isAdminShell && (
            <div className="tbl_controller">
              <Button variant="contained" size="medium" onClick={() => navigate(routes.CDM.DISCLOSURE_CREATE)}>
                등록
              </Button>
            </div>
          )}
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
                    const detailRoute = isAdminShell
                      ? routes.CDM.DISCLOSURE_DETAIL_ADMIN
                      : routes.CDM.DISCLOSURE_DETAIL_CUSTOMER;
                    navigate(`${detailRoute}?pblntSn=${event.data.pblntSn}`);
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
