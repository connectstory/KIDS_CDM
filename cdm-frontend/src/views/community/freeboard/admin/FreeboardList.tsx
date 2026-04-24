import { useEffect, useMemo, useState } from "react";
import { MenuItem, Select, Stack } from "@mui/material";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AllCommunityModule, type ColDef, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BOARD_CONFIG } from "@/config/boardConfig";
import { CONTENT_GAP } from "@/constants/types";
import type { BoardItem } from "@/interfaces/communityInterface.ts";
import { fetchBoardList } from "@/api/communityApi";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import CdmPagination from "@/components/CdmPagination";
import CdmPaginationMove from "@/components/CdmPaginationMove";
import { SearchArea } from "@/components/SearchArea";
import { SpaceBox } from "@/components/SpaceBox";
import { Helmet } from "react-helmet";

ModuleRegistry.registerModules([AllCommunityModule]);

type FreeBoardType = "freeboard" | "researchProject";

const isLocalhost = globalThis.location.hostname === "localhost";
const adminPath = import.meta.env.VITE_APP_TARGET === "admin" ? "/cm" : "/ucm";
const BASE_PATH = isLocalhost ? "" : adminPath;

function FileIconRenderer(params: Readonly<{ value: string }>) {
  if (params.value === "Y") {
    return <img src={`${BASE_PATH}/images/common/ico-attfile.svg`} width={20} height={20} style={{ display: "block" }} alt="" />;
  }
  return null;
}

const Q = {
  PAGE: "page",
  LENGTH: "length",
  SEARCH_TYPE: "searchType",
  SEARCH_KEYWORD: "searchKeyword",
} as const;

type SearchState = {
  viewCount: string;
  currentPage: number;
  searchType: string;
  searchKeyword: string;
};

const defaultSearchState: SearchState = {
  viewCount: "10",
  currentPage: 1,
  searchType: "title",
  searchKeyword: "",
};

function parseSearchParamsFromURL(searchParams: URLSearchParams): SearchState {
  const page = searchParams.get(Q.PAGE);
  const viewCount = searchParams.get(Q.LENGTH);
  const searchType = searchParams.get(Q.SEARCH_TYPE);
  const searchKeyword = searchParams.get(Q.SEARCH_KEYWORD);

  return {
    viewCount: viewCount ?? defaultSearchState.viewCount,
    currentPage: page ? Math.max(1, Number.parseInt(page, 10) || 1) : defaultSearchState.currentPage,
    searchType: searchType ?? defaultSearchState.searchType,
    searchKeyword: searchKeyword ?? defaultSearchState.searchKeyword,
  };
}

function buildURLSearchParams(state: SearchState, pageOverride?: number): Record<string, string> {
  const page = pageOverride ?? state.currentPage;
  const params: Record<string, string> = {
    [Q.PAGE]: String(page),
    [Q.LENGTH]: state.viewCount,
    [Q.SEARCH_TYPE]: state.searchType,
  };
  if (state.searchKeyword.trim()) params[Q.SEARCH_KEYWORD] = state.searchKeyword.trim();
  return params;
}

export default function AdminFreeBoardListView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { boardType } = useParams<{ boardType: FreeBoardType }>();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  const resolvedBoardType: FreeBoardType = boardType ?? "freeboard";
  const bbsId = resolvedBoardType ? BOARD_CONFIG[resolvedBoardType]?.bbsId || "" : "";

  const appliedState = useMemo(() => parseSearchParamsFromURL(urlSearchParams), [urlSearchParams]);
  const [formState, setFormState] = useState<SearchState>(() => parseSearchParamsFromURL(new URLSearchParams(urlSearchParams)));
  const [searchKeywordError, setSearchKeywordError] = useState(false);

  useEffect(() => {
    setFormState(parseSearchParamsFromURL(urlSearchParams));
  }, [urlSearchParams]);

  const { viewCount, searchKeyword, searchType } = formState;

  const applySearchParams = (state: SearchState, pageOverride?: number) => {
    setUrlSearchParams(buildURLSearchParams(state, pageOverride), {
      replace: false,
    });
  };

  const { data } = useQuery({
    queryKey: [
      "adminBoardList",
      resolvedBoardType,
      appliedState.currentPage,
      appliedState.viewCount,
      appliedState.searchType,
      appliedState.searchKeyword,
    ],
    queryFn: () =>
      fetchBoardList({
        bbsId: bbsId,
        page: appliedState.currentPage,
        pageSize: appliedState.viewCount,
        searchType: appliedState.searchType,
        searchKeyword: appliedState.searchKeyword,
      }),
    enabled: !!resolvedBoardType,
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const boardData: BoardItem[] = data?.list ?? [];
  const totalCount: number = data?.totalCount ?? 0;

  // =========================
  // AG-Grid 컬럼 정의
  // =========================
  const colDefs: ColDef<BoardItem>[] = [
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
      headerName: "제목",
      field: "pstTtl",
      minWidth: 320,
      flex: 1,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "left" },
    },
    {
      headerName: "파일",
      field: "hasFile",
      width: 150,
      headerClass: "ag-header-center",
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      cellRenderer: FileIconRenderer,
    },
    {
      headerName: "작성일",
      field: "regDt",
      width: 200,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "작성자",
      field: "rgtrId",
      width: 250,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "조회수",
      field: "pstInqCnt",
      width: 150,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
  ];

  // =========================
  // 검색 (버튼 클릭 시에만 적용)
  // =========================
  const handleSearch = () => {
    const keyword = searchKeyword.trim();
    const valid = keyword.length === 0 || keyword.length >= 2;
    setSearchKeywordError(keyword.length > 0 && !valid);
    const stateToApply: SearchState = {
      ...formState,
      searchKeyword: valid ? keyword : "",
      searchType,
      currentPage: 1,
    };
    setFormState(stateToApply);
    applySearchParams(stateToApply, 1);
  };

  const handleResetFilter = () => {
    setSearchKeywordError(false);
    setFormState(defaultSearchState);
    applySearchParams(defaultSearchState, 1);
  };

  const handlePageChange = (page: number) => {
    const nextState: SearchState = { ...appliedState, currentPage: page };
    setFormState(nextState);
    applySearchParams(nextState);
  };

  // =========================
  // 렌더링
  // =========================
  return (
    <div className="aggridguard-page">
      <Helmet>
        <title>CDM - 자유게시판</title>
      </Helmet>
      {/* 검색 영역 */}
      <SearchArea
        searchType={searchType}
        onSearchTypeChange={(v) => setFormState((s) => ({ ...s, searchType: v }))}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={(v) => {
          setFormState((s) => ({ ...s, searchKeyword: v }));
          setSearchKeywordError(false);
        }}
        searchKeywordError={searchKeywordError}
        searchKeywordHelperText={searchKeywordError ? "두자 이상 입력해주세요" : undefined}
        onSearch={handleSearch}
        onReset={handleResetFilter}
      />

      <SpaceBox gap={CONTENT_GAP.SMALL} />

      {/* 리스트 정보 */}
      <div className="tbl_info">
        <div className="total">
          <p className="cases">
            전체<span className="count">{totalCount}</span>건
          </p>
        </div>
        <div className="view_count">
          <label htmlFor="viewCountSelect">조회건수</label>
          <Select
            id="viewCountSelect"
            value={viewCount}
            onChange={(e) => {
              const nextViewCount = e.target.value;
              const nextState: SearchState = { ...appliedState, viewCount: nextViewCount, currentPage: 1 };
              setFormState(nextState);
              applySearchParams(nextState, 1);
            }}
          >
            <MenuItem value="10">10개씩</MenuItem>
            <MenuItem value="30">30개씩</MenuItem>
            <MenuItem value="50">50개씩</MenuItem>
          </Select>
        </div>
      </div>

      {/* 그리드 */}
      <div className="ag-theme-cdm w-full aggridguard">
        <AgGridReact
          rowData={boardData}
          columnDefs={colDefs}
          domLayout="autoHeight"
          loading={false}
          overlayNoRowsTemplate="<span style='padding: 20px; display: block;'>게시물이 존재하지 않습니다.</span>"
          rowStyle={{ cursor: "pointer" }}
          onRowClicked={(e) => {
            const data = e.data;
            if (!data?.pstSn) return;
            navigate(`${routes.COMMUNITY.ROOT}/${resolvedBoardType}/admin/freeboardDetail/${data.pstSn}`);
          }}
        />
      </div>

      <SpaceBox gap={CONTENT_GAP.MEDIUM} />

      {/* 페이징 */}
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
    </div>
  );
}
