import { useEffect, useMemo, useState } from "react";
import { Button, MenuItem, Select, Stack } from "@mui/material";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BOARD_CONFIG, type BoardType } from "@/config/boardConfig";
import { CONTENT_GAP } from "@/constants/types";
import type { BoardItem } from "@/interfaces/communityInterface.ts";
import { fetchBoardList } from "@/api/communityApi";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import CdmPagination from "@/components/CdmPagination";
import CdmPaginationMove from "@/components/CdmPaginationMove";
import { SearchArea } from "@/components/SearchArea";
import { SpaceBox } from "@/components/SpaceBox";
import { Helmet } from "react-helmet";
import { adminIcoAttfile } from "@/config/images";

const isLocalhost = globalThis.location.hostname === "localhost";
const adminPath = import.meta.env.VITE_APP_TARGET === "admin" ? "/cm" : "/ucm";
const BASE_PATH = isLocalhost ? "" : adminPath;

function FileIconRenderer(params: Readonly<{ value: string }>) {
  if (params.value === "Y") {
    return <img src={adminIcoAttfile} width={20} height={20} style={{ display: "block" }} alt="" />;
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

export default function AdminBoardListView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { boardType } = useParams<{ boardType: BoardType }>();
  const bbsId = boardType ? BOARD_CONFIG[boardType]?.bbsId || "" : "";
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

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

  const isNotice = boardType === "notice";

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "adminBoardList",
      boardType,
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
    enabled: !!boardType,
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const boardData: BoardItem[] = data?.list ?? [];
  const totalCount: number = data?.totalCount ?? 0;

  const colDefs: ColDef<BoardItem>[] = [
    {
      headerName: "번호",
      width: 80,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
      valueGetter: (params) => {
        const d = params.data;
        const today = new Date().toISOString().replaceAll("-", "").substring(0, 8);
        const isActiveNotice =
          d?.fixYn === "Y" &&
          !!d.fixBgngYmd &&
          !!d.fixEndYmd &&
          today >= d.fixBgngYmd &&
          today <= d.fixEndYmd;
        if (isActiveNotice) return "[공지]";
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
    },
    ...(isNotice
      ? [
          {
            headerName: "공지기간",
            width: 220,
            headerClass: "ag-header-center",
            cellStyle: { textAlign: "center" },
            valueGetter: (params: { data?: BoardItem }) => {
              const bgng = params.data?.fixBgngYmd;
              const end = params.data?.fixEndYmd;

              if (!bgng && !end) return "-";

              const format = (ymd?: string) =>
                ymd?.length === 8 ? `${ymd.substring(0, 4)}-${ymd.substring(4, 6)}-${ymd.substring(6, 8)}` : "";

              return `${format(bgng)} ~ ${format(end)}`;
            },
          } satisfies ColDef<BoardItem>,
        ]
      : []),
    {
      headerName: "파일",
      field: "hasFile",
      width: 112,
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
    {
      headerName: "조회수",
      field: "pstInqCnt",
      width: 96,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
  ];

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

  return (
    <div className="aggridguard-page">
      <div className="h-5" />
      <Helmet>
        <title>{`CDM - ${BOARD_CONFIG[boardType!]?.title ?? ''}`}</title>
      </Helmet>
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
        <div className="tbl_controller">
          <Button variant="contained" size="medium" onClick={() => navigate(`${routes.COMMUNITY.ROOT}/${boardType}/admin/write`)}>
            등록
          </Button>
        </div>
      </div>

      <div className="ag-theme-cdm w-full aggridguard">
        <AgGridReact
          rowData={boardData}
          columnDefs={colDefs}
          domLayout="autoHeight"
          loading={isLoading || isFetching}
          overlayNoRowsTemplate="<span style='padding: 20px; display: block;'>게시물이 존재하지 않습니다.</span>"
          rowStyle={{ cursor: "pointer" }}
          onRowClicked={(e) => {
            const data = e.data;
            if (!data?.pstSn) return;
            navigate(`${routes.COMMUNITY.ROOT}/${boardType}/admin/detail/${data.pstSn}`);
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
