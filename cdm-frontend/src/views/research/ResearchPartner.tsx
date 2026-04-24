import { useEffect, useMemo, useState } from "react";
import { Box, Chip, MenuItem, Select, Stack } from "@mui/material";
import { AllCommunityModule, type ColDef, type ICellRendererParams, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useNavigate, useSearchParams } from "react-router-dom";
import { STRINGS } from "@/constants/string";
import { CONTENT_GAP, CdmUploadType, ProgressStatusType } from "@/constants/types";
import type { ResearchListResponse, ResearchSearchRequest } from "@/interfaces/researchInterface";
import { buildPath, getCdmParticipationStatusConfig, getOrgParticipationStatusConfig, getStatusConfig } from "@/utils/common";
import { useResearchListByPartner } from "@/hooks/research/useResearchQueries";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import CdmPagination from "@/components/CdmPagination";
import CdmPaginationMove from "@/components/CdmPaginationMove";
import Loader from "@/components/Loader";
import { SearchArea } from "@/components/SearchArea";
import { SpaceBox } from "@/components/SpaceBox";

ModuleRegistry.registerModules([AllCommunityModule]);

/** URL 쿼리 키 ( /cm/ad/research/partner?...) */
const Q = {
  PAGE: "page",
  PROGRESS_STATUS: "progressStatus",
  SEARCH_TYPE: "searchType",
  SEARCH_KEYWORD: "searchKeyword",
  SEARCH_START_DATE: "searchStartDate",
  SEARCH_END_DATE: "searchEndDate",
  LENGTH: "length",
} as const;

type SearchState = {
  statusFilter: string;
  searchType: "title" | "content";
  searchKeyword: string;
  startdate: dayjs.Dayjs | null;
  enddate: dayjs.Dayjs | null;
  viewCount: string;
  currentPage: number;
};

const defaultSearchState: SearchState = {
  statusFilter: "00",
  searchType: "title",
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
    statusFilter: searchParams.get(Q.PROGRESS_STATUS) ?? defaultSearchState.statusFilter,
    searchType: (searchParams.get(Q.SEARCH_TYPE) as "title" | "content") ?? defaultSearchState.searchType,
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
    [Q.PROGRESS_STATUS]: state.statusFilter,
    [Q.SEARCH_TYPE]: state.searchType,
    [Q.LENGTH]: state.viewCount,
  };
  if (state.searchKeyword.trim()) params[Q.SEARCH_KEYWORD] = state.searchKeyword.trim();
  if (state.startdate) params[Q.SEARCH_START_DATE] = state.startdate.format("YYYY-MM-DD");
  if (state.enddate) params[Q.SEARCH_END_DATE] = state.enddate.format("YYYY-MM-DD");
  return params;
}

export default function ResearchMemberView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  /* ------------------------------
   * URL = 실제 적용된 검색 조건 (API 요청용)
   * formState = 입력 필드용 (검색 버튼 클릭 시에만 URL에 반영)
   * ------------------------------ */
  const appliedState = useMemo(() => parseSearchParamsFromURL(urlSearchParams), [urlSearchParams]);

  const [formState, setFormState] = useState<SearchState>(() => parseSearchParamsFromURL(new URLSearchParams(urlSearchParams)));
  const [searchKeywordError, setSearchKeywordError] = useState(false);

  useEffect(() => {
    setFormState(parseSearchParamsFromURL(urlSearchParams));
  }, [urlSearchParams]);

  const { statusFilter, searchType, searchKeyword, startdate, enddate, viewCount } = formState;
  const applied = appliedState;

  const setStartDate = (v: dayjs.Dayjs | null) => setFormState((s) => ({ ...s, startdate: v }));
  const setEndDate = (v: dayjs.Dayjs | null) => setFormState((s) => ({ ...s, enddate: v }));
  const setStatusFilter = (v: string) => setFormState((s) => ({ ...s, statusFilter: v }));
  const setSearchType = (v: "title" | "content") => setFormState((s) => ({ ...s, searchType: v }));
  const setSearchKeyword = (v: string) => setFormState((s) => ({ ...s, searchKeyword: v }));

  /* ------------------------------
   * 검색 파라미터 구성 (API 요청용) - URL 기준, 검색 버튼 클릭 시에만 반영됨
   * ------------------------------ */
  const searchParams: ResearchSearchRequest = useMemo(() => {
    const params: ResearchSearchRequest = {};

    if (applied.statusFilter) {
      params.progressStatus = applied.statusFilter === "00" ? "" : applied.statusFilter;
    }
    if (applied.searchKeyword.trim()) {
      params.searchKeyword = applied.searchKeyword.trim();
      params.searchType = applied.searchType;
    }
    if (applied.startdate) params.searchStartDate = applied.startdate.startOf("day").toISOString();
    if (applied.enddate) params.searchEndDate = applied.enddate.endOf("day").toISOString();
    if (applied.viewCount) params.length = parseInt(applied.viewCount, 10);
    params.page = applied.currentPage;

    return params;
  }, [applied]);

  /* ------------------------------
   * React Query로 데이터 조회 (URL 기반 파라미터)
   * ------------------------------ */
  const { data: researchListData, isLoading, isError } = useResearchListByPartner(searchParams);

  /* ------------------------------
   * 연구과제 목록 데이터
   * ------------------------------ */
  const researches = useMemo(() => researchListData?.data || [], [researchListData?.data]);

  /* ------------------------------
   * 페이지네이션 정보
   * ------------------------------ */
  const pagination = useMemo(
    () => ({
      page: researchListData?.page || 1,
      length: researchListData?.length || 10,
      total: researchListData?.total || 0,
    }),
    [researchListData]
  );

  /* ------------------------------
   * URL 반영 (검색/페이지/초기화 시 쿼리스트링 갱신, replace: false로 히스토리 push)
   * ------------------------------ */
  const applySearchParams = (state: SearchState, pageOverride?: number) => {
    setUrlSearchParams(buildURLSearchParams(state, pageOverride), {
      replace: false,
    });
  };

  const handleSearch = () => {
    const keyword = formState.searchKeyword.trim();
    const valid = keyword.length === 0 || keyword.length >= 2;
    setSearchKeywordError(keyword.length > 0 && !valid);
    const stateToApply = {
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

  type ResearchRow = {
    asmtSn: number;
    asmtId: string;
    instNm: string;
    asmtNm: string;
    period: { flfmtBgngDt: string; flfmtEndDt: string };
    asmtPrgrsSttsCd: string;
    uldTypeCd: string | null;
    metaStatus: number;
  };

  /* ------------------------------
   * 테이블 행 데이터
   * ------------------------------ */
  const rowData: ResearchRow[] = useMemo(
    () =>
      researches.map((r: ResearchListResponse) => ({
        asmtSn: r.asmtSn,
        asmtId: r.asmtId,
        instNm: r.instNm ? r.instNm : r.deptNm ? r.deptNm : "-",
        asmtNm: r.asmtNm,
        period: r.flfmtBgngDt
          ? {
              flfmtBgngDt: dayjs(r.flfmtBgngDt).format("YYYY.MM.DD"),
              flfmtEndDt: dayjs(r.flfmtEndDt).format("YYYY.MM.DD"),
            }
          : { flfmtBgngDt: "", flfmtEndDt: "" },
        asmtPrgrsSttsCd: r.ptcpPrgrsSttsCd ?? r.asmtPrgrsSttsCd,
        uldTypeCd: r.uldTypeCd ?? null,
        metaStatus: r.metaAnalysisCount || 0,
      })),
    [researches]
  );

  /* ------------------------------
   * 테이블 컬럼 정의
   * ------------------------------ */
  const colDefs = useMemo<ColDef<ResearchRow>[]>(
    () =>
      [
        {
          headerName: STRINGS.NO,
          headerClass: "ag-header-center",
          field: "asmtSn",
          width: 70,
          cellStyle: { textAlign: "center" as const },
        },
        {
          headerName: STRINGS.RESEARCH_ID,
          field: "asmtId",
          width: 190,
        },
        {
          headerName: STRINGS.REGISTERED_INSTITUTION,
          field: "instNm",
          width: 180,
        },
        {
          headerName: STRINGS.RESEARCH_NAME,
          field: "asmtNm",
          flex: 1,
        },
        {
          headerName: STRINGS.RESEARCH_PERIOD,
          headerClass: "ag-header-center",
          field: "period",
          cellDataType: false,
          width: 150,
          cellStyle: {
            textAlign: "center" as const,
            whiteSpace: "normal" as const,
            lineHeight: "1.2",
            padding: 0,
          },
          // valueFormatter: (p) =>
          //   p.value ? `${p.value.flfmtBgngDt} ~ ${p.value.flfmtEndDt}` : "",
          cellRenderer: (p: ICellRendererParams<ResearchRow>) => (
            <div className="ag-cell-center-vertical">
              <div>
                <p>{p.value?.flfmtBgngDt} ~</p>
                <p>{p.value?.flfmtEndDt}</p>
              </div>
            </div>
          ),
        },
        {
          headerName: STRINGS.PARTNER_STATUS,
          headerClass: "ag-header-center",
          field: "asmtPrgrsSttsCd",
          width: 150,
          cellStyle: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center" as const,
            textAlign: "center" as const,
          },
          cellRenderer: (p: ICellRendererParams<ResearchRow>) => {
            const serverCode = p.value as string;
            const statusConfig =
              p.data?.uldTypeCd === CdmUploadType.CDM
                ? getCdmParticipationStatusConfig(serverCode)
                : getOrgParticipationStatusConfig(serverCode);
            return <Chip size="small" label={statusConfig?.label ?? serverCode ?? ""} sx={statusConfig?.chipStyle ?? {}} />;
          },
        },
        {
          headerName: STRINGS.RESEARCH_RESULT,
          headerClass: "ag-header-center",
          field: "metaStatus",
          width: 110,
          cellStyle: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center" as const,
            textAlign: "center" as const,
          },
          cellRenderer: (p: ICellRendererParams<ResearchRow>) => {
            const status = (p.value as number) > 0 ? ProgressStatusType.APPROVAL : ProgressStatusType.NOT_REGISTERED;
            const statusConfig = getStatusConfig(status);
            return (
              <Chip
                size="small"
                label={(p.value as number) > 0 ? STRINGS.REGISTERED : STRINGS.NOT_REGISTERED}
                sx={statusConfig?.chipStyle || {}}
              />
            );
          },
        },
      ] as ColDef<ResearchRow>[],
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
    return <div>에러가 발생했습니다.</div>;
  }

  return (
    <div className="">
      {/* ==============================
          검색 영역
      ============================== */}
      <SearchArea
        showStatusFilter
        showDateRange
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptionsIncludeCancel={false}
        startDate={startdate}
        endDate={enddate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        searchType={searchType}
        onSearchTypeChange={(v) => setSearchType(v as "title" | "content")}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={(v) => {
          setSearchKeyword(v);
          setSearchKeywordError(false);
        }}
        searchKeywordError={searchKeywordError}
        searchKeywordHelperText={searchKeywordError ? "두자 이상 입력해주세요" : undefined}
        searchTypeOptions={[
          { value: "title", label: "제목" },
          { value: "content", label: "내용" },
        ]}
        onSearch={handleSearch}
        onReset={handleResetFilter}
      />

      <SpaceBox gap={CONTENT_GAP.SMALL} />

      {/* ==============================
          리스트 영역
      ============================== */}
      <div>
        <div className="tbl_info">
          <div className="total">
            <p className="cases">
              전체<span className="count">{pagination.total}</span>건
            </p>
          </div>
          <div className="view_count">
            <label htmlFor="viewCountSelect">조회건수</label>
            <Select
              id="viewCountSelect"
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

        <div className="ag-theme-cdm w-full">
          <AgGridReact
            rowData={rowData}
            columnDefs={colDefs}
            domLayout="autoHeight"
            overlayNoRowsTemplate={`<span style="padding:8px;">검색된 연구과제가 없습니다.</span>`}
            onRowClicked={(event) => {
              if (event.data?.asmtSn) {
                navigate(
                  buildPath(routes.RESEARCH.DETAIL, {
                    role: "partner",
                    asmtSn: event.data.asmtSn,
                  })
                );
              }
            }}
            rowStyle={{ cursor: "pointer" }}
          />
          {pagination.total !== 0 && (
            <>
              <SpaceBox gap={CONTENT_GAP.MEDIUM}></SpaceBox>

              <Stack direction="row" className="paging_wrap">
                <CdmPagination
                  page={pagination.page}
                  totalPages={Math.ceil(pagination.total / pagination.length)}
                  onChange={handlePageChange}
                />
                <CdmPaginationMove
                  currentPage={pagination.page}
                  totalPages={Math.ceil(pagination.total / pagination.length)}
                  onPageChange={handlePageChange}
                />
              </Stack>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
