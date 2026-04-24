import { useEffect, useMemo, useState } from "react";
import { Button, MenuItem, Select, Stack } from "@mui/material";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Helmet } from "react-helmet";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types";
import type { ValidateRuleItem } from "@/interfaces/validateRuleInterface.ts";
import { fetchValidateRuleList } from "@/api/validateRuleApi.ts";
import { STD_SE_CD_OPTIONS, convertStdSeCd } from "@/utils/common";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import CdmPagination from "@/components/CdmPagination";
import CdmPaginationMove from "@/components/CdmPaginationMove";
import { SearchArea } from "@/components/SearchArea";
import { SpaceBox } from "@/components/SpaceBox";

// =============================
// URL Query Key
// =============================
const Q = {
  PAGE: "page",
  LENGTH: "length",
  STD_SE_CD: "stdSeCd",
  SEARCH_TYPE: "searchType",
  SEARCH_KEYWORD: "searchKeyword",
} as const;

// =============================
// 타입
// =============================
type SearchState = {
  stdSeCd: string;
  searchType: string;
  searchKeyword: string;
  viewCount: string;
  currentPage: number;
};

const DEFAULT_SEARCH: SearchState = {
  stdSeCd: "ALL",
  searchType: "tableName",
  searchKeyword: "",
  viewCount: "10",
  currentPage: 1,
};

// =============================
// URL → State
// =============================
function parseSearchParamsFromURL(searchParams: URLSearchParams): SearchState {
  return {
    stdSeCd: searchParams.get(Q.STD_SE_CD) ?? DEFAULT_SEARCH.stdSeCd,
    searchType: searchParams.get(Q.SEARCH_TYPE) ?? DEFAULT_SEARCH.searchType,
    searchKeyword: searchParams.get(Q.SEARCH_KEYWORD) ?? "",
    viewCount: searchParams.get(Q.LENGTH) ?? DEFAULT_SEARCH.viewCount,
    currentPage: Number.parseInt(searchParams.get(Q.PAGE) ?? "1", 10),
  };
}

// =============================
// State → URL
// =============================
function buildURLSearchParams(state: SearchState, pageOverride?: number) {
  return {
    [Q.PAGE]: String(pageOverride ?? state.currentPage),
    [Q.LENGTH]: state.viewCount,
    [Q.STD_SE_CD]: state.stdSeCd,
    [Q.SEARCH_TYPE]: state.searchType,
    ...(state.searchKeyword && {
      [Q.SEARCH_KEYWORD]: state.searchKeyword,
    }),
  };
}

function ValidateRuleListView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  // URL 기반 실제 적용 상태
  const appliedState = useMemo(() => parseSearchParamsFromURL(urlSearchParams), [urlSearchParams]);

  // 입력 폼 상태
  const [formState, setFormState] = useState<SearchState>(appliedState);

  useEffect(() => {
    setFormState(appliedState);
  }, [appliedState]);

  // =============================
  // React Query (URL 기반)
  // =============================
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "validateRuleList",
      appliedState.currentPage,
      appliedState.viewCount,
      appliedState.stdSeCd,
      appliedState.searchType,
      appliedState.searchKeyword,
    ],
    queryFn: () =>
      fetchValidateRuleList({
        page: appliedState.currentPage,
        pageSize: appliedState.viewCount,
        stdSeCd: appliedState.stdSeCd === "ALL" ? "" : appliedState.stdSeCd,
        searchType: appliedState.searchType,
        searchKeyword: appliedState.searchKeyword,
      }),
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });

  const listData: ValidateRuleItem[] = data?.list ?? [];
  const totalCount: number = data?.totalCount ?? 0;

  // =============================
  // URL 반영 함수
  // =============================
  const applySearchParams = (state: SearchState, pageOverride?: number) => {
    setUrlSearchParams(buildURLSearchParams(state, pageOverride), { replace: false });
  };

  // 검색
  const handleSearch = () => {
    applySearchParams({ ...formState, currentPage: 1 }, 1);
  };

  // 초기화
  const handleResetFilter = () => {
    applySearchParams(DEFAULT_SEARCH, 1);
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    applySearchParams(appliedState, page);
  };

  // 조회건수 변경
  const handleViewCountChange = (value: string) => {
    applySearchParams({ ...appliedState, viewCount: value }, 1);
  };

  // =============================
  // 컬럼 정의 (기존 그대로)
  // =============================
  const colDefs: ColDef<ValidateRuleItem>[] = [
    {
      headerName: "번호",
      width: 80,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
      valueGetter: (params) => {
        const pageSize = Number(appliedState.viewCount);
        const rowIndex = params.node?.rowIndex ?? 0;
        return totalCount - ((appliedState.currentPage - 1) * pageSize + rowIndex);
      },
    },
    {
      headerName: "구분",
      field: "stdSeCd",
      width: 130,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
      valueFormatter: (params) => convertStdSeCd(params.value),
    },
    {
      headerName: "테이블명",
      field: "vrfcTblNm",
      minWidth: 200,
      flex: 1,
      headerClass: "ag-header-center",
    },
    {
      headerName: "컬럼명",
      field: "vrfcColNm",
      minWidth: 200,
      flex: 1,
      headerClass: "ag-header-center",
    },
    {
      headerName: "등록일자",
      field: "regDt",
      width: 160,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "작성자",
      field: "rgtrId",
      width: 128,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
  ];

  return (
    <div className="aggridguard-page">
      <Helmet>
        <title>CDM - CDM 표준화 관리</title>
      </Helmet>

      <SearchArea
        showCategoryFilter
        categoryLabel="구분"
        categoryValue={formState.stdSeCd}
        onCategoryChange={(v) => setFormState((s) => ({ ...s, stdSeCd: v }))}
        categoryOptions={STD_SE_CD_OPTIONS}
        searchType={formState.searchType}
        onSearchTypeChange={(v) => setFormState((s) => ({ ...s, searchType: v }))}
        searchKeyword={formState.searchKeyword}
        onSearchKeywordChange={(v) => setFormState((s) => ({ ...s, searchKeyword: v }))}
        searchTypeOptions={[
          { value: "tableName", label: "테이블 명" },
          { value: "columnName", label: "컬럼 명" },
        ]}
        onSearch={handleSearch}
        onReset={handleResetFilter}
      />

      <SpaceBox gap={CONTENT_GAP.SMALL} />

      <div className="tbl_info">
        <div className="total">
          <p className="cases">
            전체<span className="count">{totalCount}</span>건
          </p>
        </div>

        <div className="view_count">
          <label htmlFor="viewCountSelect">조회건수</label>
          <Select id="viewCountSelect" value={appliedState.viewCount} onChange={(e) => handleViewCountChange(e.target.value)}>
            <MenuItem value="10">10개씩</MenuItem>
            <MenuItem value="30">30개씩</MenuItem>
            <MenuItem value="50">50개씩</MenuItem>
          </Select>
        </div>

        <div className="tbl_controller">
          <Button variant="contained" size="medium" onClick={() => navigate(routes.CDM.VALIDATE_RULE_EDIT)}>
            등록
          </Button>
        </div>
      </div>

      <div className="ag-theme-cdm w-full aggridguard">
        <AgGridReact
          rowData={listData}
          columnDefs={colDefs}
          domLayout="autoHeight"
          loading={isLoading || isFetching}
          overlayNoRowsTemplate="<span style='padding: 20px; display: block;'>데이터가 존재하지 않습니다.</span>"
          rowStyle={{ cursor: "pointer" }}
          onRowClicked={(e) => {
            if (!e.data?.vrfcSn) return;

            const currentParams = new URLSearchParams(globalThis.location.search);
            currentParams.set("vrfcSn", String(e.data.vrfcSn));

            navigate({
              pathname: routes.CDM.VALIDATE_RULE_DETAIL,
              search: currentParams.toString(),
            });
          }}
        />
      </div>

      <SpaceBox gap={CONTENT_GAP.MEDIUM} />

      <Stack direction="row" className="paging_wrap">
        <CdmPagination
          page={appliedState.currentPage}
          totalPages={Math.ceil(totalCount / Number(appliedState.viewCount))}
          onChange={handlePageChange}
        />
        <CdmPaginationMove
          currentPage={appliedState.currentPage}
          totalPages={Math.ceil(totalCount / Number(appliedState.viewCount))}
          onPageChange={handlePageChange}
        />
      </Stack>

      <div className="h-10" />
    </div>
  );
}

export default ValidateRuleListView;
