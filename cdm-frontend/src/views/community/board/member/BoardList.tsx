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

const parseSearchParamsFromURL = (searchParams: URLSearchParams): SearchState => {
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
};

const buildURLSearchParams = (state: SearchState, pageOverride?: number): Record<string, string> => {
  const page = pageOverride ?? state.currentPage;
  const params: Record<string, string> = {
    [Q.PAGE]: String(page),
    [Q.LENGTH]: state.viewCount,
    [Q.SEARCH_TYPE]: state.searchType,
  };
  if (state.searchKeyword.trim()) params[Q.SEARCH_KEYWORD] = state.searchKeyword.trim();
  return params;
};

export default function MemberBoardListView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();

  const { boardType } = useParams<{
    boardType: "buildInfo" | "analysisInfo" | "notice";
  }>();

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

  const handlePageChange = (page: number) => {
    const nextState: SearchState = { ...appliedState, currentPage: page };
    setFormState(nextState);
    applySearchParams(nextState);
  };

  const config = BOARD_CONFIG[boardType!];
  const bbsId = boardType ? BOARD_CONFIG[boardType]?.bbsId || "" : "";

  // =========================
  // React Query (검색 버튼 클릭 시 반영된 값으로만 조회)
  // =========================
  const { data } = useQuery({
    queryKey: [
      "memberBoardList",
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
      cellStyle: { textAlign: "left" },
    },
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
      headerName: "작성자",
      field: "rgtrId",
      width: 128,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "작성일",
      field: "regDt",
      width: 160,
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

  // =========================
  // 렌더링
  // =========================
  return (
    <div className="aggridguard-page">
      <Helmet>
        <title>{`CDM - ${BOARD_CONFIG[boardType!]?.title ?? ''}`}</title>
      </Helmet>
      {/* KRDS 안내 */}
      {config.showKrdsNotice && (
        <div className="mt-4 mb-6 p-4 bg-amber-50 border border-amber-200 rounded text-gray-700 flex items-start space-x-3">
          <div className="text-amber-500 text-xl">⚠️</div>
          <p className="leading-relaxed text-base">
            개인정보 유출, 타인에 대한 비방과 허위 사실 적시, 욕설 등의 게시물은 「정보통신망 이용촉진 및 정보보호 등에 관한
            법률」에 의거 처벌을 받을 수 있으며 관리자에 의해 비공개로 전환될 수 있습니다.
          </p>
        </div>
      )}

      <SpaceBox gap={CONTENT_GAP.SMALL} />

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

      {/* 목록 정보 */}
      <div className="tbl_info">
        <div>
          전체 <b>{totalCount}</b>건
        </div>

        <div className="view_count">
          <Select
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
            navigate(`${routes.COMMUNITY.ROOT}/${boardType}/member/detail/${data.pstSn}`);
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

      <div className="h-10" />
    </div>
  );
}
