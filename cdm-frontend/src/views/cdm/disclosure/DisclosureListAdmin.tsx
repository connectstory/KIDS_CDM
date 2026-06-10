import { useEffect, useMemo, useState } from "react";
import { Box, Fade, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { Helmet } from "react-helmet";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types";
import type { DisclosureListResponse, DisclosureSearchRequest } from "@/interfaces/disclosureInterface";
import { ModalNames } from "@/interfaces/modalInterface";
import type { PartnerResponse } from "@/interfaces/researchInterface";
import { DisclosureAPI } from "@/api/disclosureApi";
import { buildPath, getDisclosurePblntStatusConfig } from "@/utils/common";
import { formatDateToYYYYMMDD } from "@/utils/dateUtils";
import { useCmRoutes, useIsAdminCmShell } from "@/hooks/useCmRoutes";
import { useModal } from "@/hooks/useModal";
import CdmPagination from "@/components/CdmPagination";
import CdmPaginationMove from "@/components/CdmPaginationMove";
import Loader from "@/components/Loader";
import { SearchArea } from "@/components/SearchArea";
import { SpaceBox } from "@/components/SpaceBox";
import { AppButton, AppStatusChip } from "@/components/ui";

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
    instIds: searchParams.get(Q.INST_IDS) ?? defaultSearchState.instIds,
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

function formatYmdToDot(ymd: string | null | undefined): string {
  if (!ymd) return "-";
  const d = dayjs(ymd);
  return d.isValid() ? d.format("YYYY.MM.DD") : "-";
}

export default function CDMUploadNotice() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const AddPartnersModal = useModal(ModalNames.AddPartners);
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  const isAdminShell = useIsAdminCmShell();

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
  const totalPages = pageLength > 0 ? Math.ceil(total / pageLength) : 0;

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
    const result = (await AddPartnersModal.open({
      title: "참여기관 추가",
      data: selectedPartners,
    })) as { status: boolean; data: PartnerResponse[] };

    if (!result?.status || !Array.isArray(result.data)) return;

    if (Array.isArray(result.data)) {
      setSelectedPartners(result.data);
    }
  };

  const handleRemovePartner = (brno: string) => {
    setSelectedPartners((prev) => prev.filter((p) => p.brno !== brno));
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
        width: 80,
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
        width: 120,
        cellStyle: () => ({
          textAlign: "center",
          whiteSpace: "normal",
          lineHeight: "1.2",
          padding: 0,
        }),
        cellRenderer: (p: ICellRendererParams<DisclosureRow>) => (
          <Box className="ag-cell-center-vertical">
            <Box>
              <Box component="p">{formatYmdToDot(p.value?.pblntBgngYmd)} ~</Box>
              <Box component="p">{formatYmdToDot(p.value?.pblntEndYmd)}</Box>
            </Box>
          </Box>
        ),
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
          const raw = p.data?.pblntStcd;
          const s = raw == null ? "" : String(raw).trim();
          const statusCode = !s ? "" : s.length === 1 ? `0${s}` : s;
          if (!statusCode) return "-";
          const statusConfig = getDisclosurePblntStatusConfig(statusCode);
          return (
            <Box className="ag-cell-center-vertical">
              <AppStatusChip
                size="small"
                label={statusConfig?.label ?? DisclosureAPI.convertStatus(statusCode)}
                chipStyle={statusConfig?.chipStyle ?? {}}
              />
            </Box>
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

  if (isLoading) {
    return (
      <Box sx={{ position: "relative", minHeight: "400px" }}>
        <Loader isLoading={true} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Helmet>
          <title>CDM - CDM 업로드 공시</title>
        </Helmet>
        <Typography color="text.secondary">목록을 불러오지 못했습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box>
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

      <Fade in timeout={280}>
        <Box>
          <Box className="tbl_info">
            <Box className="total">
              <Box component="p" className="cases" sx={{ whiteSpace: "nowrap" }}>
                전체
                <Box component="span" className="count">
                  {total}
                </Box>
                건
              </Box>
            </Box>
            <Box className="view_count">
              <Box component="label" htmlFor="viewCountSelect" sx={{ whiteSpace: "nowrap" }}>
                조회건수
              </Box>
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
            </Box>
            {isAdminShell && (
              <Box className="tbl_controller">
                <AppButton variant="contained" size="medium" onClick={() => navigate(routes.CDM.DISCLOSURE_CREATE)}>
                  등록
                </AppButton>
              </Box>
            )}
          </Box>

          <Box className="ag-theme-cdm w-full" sx={{ display: "flex", flexDirection: "column" }}>
            <AgGridReact
              rowData={rowData}
              columnDefs={colDefs}
              domLayout="autoHeight"
              rowHeight={44}
              headerHeight={44}
              overlayNoRowsTemplate={`<span style="padding:8px;">검색된 공시가 없습니다.</span>`}
              onRowClicked={(event) => {
                if (event.data?.pblntSn) {
                  navigate(
                    buildPath(routes.CDM.DISCLOSURE_DETAIL, {
                      pblntSn: event.data.pblntSn,
                    })
                  );
                }
              }}
              rowStyle={{ cursor: "pointer" }}
            />
          </Box>

          {totalPages > 0 && (
            <>
              <Box sx={{ mt: 2 }} />
              <Stack direction="row" className="relative">
                <CdmPagination page={currentPage} totalPages={totalPages} onChange={handlePageChange} />
                <CdmPaginationMove currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </Stack>
            </>
          )}
        </Box>
      </Fade>
    </Box>
  );
}
