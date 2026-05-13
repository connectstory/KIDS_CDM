import { useEffect, useMemo, useState } from "react";
import { Chip, MenuItem, Select, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types";
import type { QnaItem } from "@/interfaces/communityInterface.ts";
import { fetchQnaList } from "@/api/communityApi";
import { getQnaStatusConfig } from "@/utils/common";
import { useCommonCodes } from "@/hooks/useCommonCodes";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import CdmPagination from "@/components/CdmPagination";
import CdmPaginationMove from "@/components/CdmPaginationMove";
import { SearchArea } from "@/components/SearchArea";
import { SpaceBox } from "@/components/SpaceBox";
import { BOARD_CONFIG, type BoardType } from "@/config/boardConfig";
import { Helmet } from "react-helmet";

const BOARD_BBS_ID: Partial<Record<BoardType, string>> = {
  qna: "BBS0000001",
  researchProject: "BBS0000002",
};

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

function makeStatusCellRenderer(codeMap: Record<string, string>) {
  return function StatusCellRenderer(p: Readonly<ICellRendererParams>) {
    const status = p.value?.trim() || "";
    const cfg = getQnaStatusConfig(status);
    const label = codeMap[status] ?? cfg?.label;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <Chip size="small" label={label} sx={cfg?.chipStyle} />
      </div>
    );
  };
}

const Q = {
  PAGE: "page",
  LENGTH: "length",
  SEARCH_TYPE: "searchType",
  SEARCH_KEYWORD: "searchKeyword",
  STATUS: "status",
} as const;

type SearchState = {
  viewCount: string;
  currentPage: number;
  searchType: string;
  searchKeyword: string;
  status: string;
};

const defaultSearchState: SearchState = {
  viewCount: "10",
  currentPage: 1,
  searchType: "title",
  searchKeyword: "",
  status: "ALL",
};

function parseSearchParamsFromURL(searchParams: URLSearchParams): SearchState {
  const page = searchParams.get(Q.PAGE);
  const viewCount = searchParams.get(Q.LENGTH);
  const searchType = searchParams.get(Q.SEARCH_TYPE);
  const searchKeyword = searchParams.get(Q.SEARCH_KEYWORD);
  const status = searchParams.get(Q.STATUS);

  return {
    viewCount: viewCount ?? defaultSearchState.viewCount,
    currentPage: page ? Math.max(1, Number.parseInt(page, 10) || 1) : defaultSearchState.currentPage,
    searchType: searchType ?? defaultSearchState.searchType,
    searchKeyword: searchKeyword ?? defaultSearchState.searchKeyword,
    status: status ?? defaultSearchState.status,
  };
}

function buildURLSearchParams(state: SearchState, pageOverride?: number): Record<string, string> {
  const page = pageOverride ?? state.currentPage;
  const params: Record<string, string> = {
    [Q.PAGE]: String(page),
    [Q.LENGTH]: state.viewCount,
    [Q.SEARCH_TYPE]: state.searchType,
    [Q.STATUS]: state.status,
  };
  if (state.searchKeyword.trim()) params[Q.SEARCH_KEYWORD] = state.searchKeyword.trim();
  return params;
}

export default function AdminQnaListView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  const appliedState = useMemo(() => parseSearchParamsFromURL(urlSearchParams), [urlSearchParams]);
  const [formState, setFormState] = useState<SearchState>(() => parseSearchParamsFromURL(new URLSearchParams(urlSearchParams)));
  const [searchKeywordError, setSearchKeywordError] = useState(false);
  const { boardType } = useParams<{ boardType: BoardType }>();
  const bbsId = boardType ? BOARD_BBS_ID[boardType] : undefined;

  useEffect(() => {
    setFormState(parseSearchParamsFromURL(urlSearchParams));
  }, [urlSearchParams]);

  const { viewCount, searchKeyword, searchType, status } = formState;

  const applySearchParams = (state: SearchState, pageOverride?: number) => {
    setUrlSearchParams(buildURLSearchParams(state, pageOverride), {
      replace: false,
    });
  };

  const { optionsWithAll: categoryOptions, codeMap: statusCodeMap } = useCommonCodes("CMCMM00001");

  const { data } = useQuery({
    queryKey: [
      "qnaList",
      boardType,
      appliedState.status,
      appliedState.currentPage,
      appliedState.viewCount,
      appliedState.searchType,
      appliedState.searchKeyword,
    ],
    queryFn: () =>
      fetchQnaList({
        bbsId,
        page: appliedState.currentPage,
        pageSize: appliedState.viewCount,
        qstnPrgrsSttsCd: appliedState.status === "ALL" ? undefined : appliedState.status,
        searchType: appliedState.searchType,
        searchKeyword: appliedState.searchKeyword,
        searchAll: true,
      }),
    refetchOnMount: "always",
  });

  const qnaData: QnaItem[] = data?.list ?? [];
  const totalCount: number = data?.totalCount ?? 0;

  const colDefs: ColDef<QnaItem>[] = [
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
      width: 130,
      headerClass: "ag-header-center",
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      cellRenderer: FileIconRenderer,
    },
    {
      headerName: "진행",
      field: "qstnPrgrsSttsCd",
      width: 130,
      headerClass: "ag-header-center",
      cellRenderer: makeStatusCellRenderer(statusCodeMap),
    },
    {
      headerName: "작성일",
      field: "regDt",
      width: 150,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "작성자",
      field: "qstnrNm",
      width: 250,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "조회수",
      field: "pstInqCnt",
      width: 130,
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
      status,
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

  return (
    <div className="aggridguard-page">
      <Helmet>
        <title>{`CDM - ${BOARD_CONFIG[boardType!]?.title ?? 'Q&A'}`}</title>
      </Helmet>
      <SearchArea
        showCategoryFilter
        categoryValue={status}
        onCategoryChange={(v) => setFormState((s) => ({ ...s, status: v }))}
        categoryOptions={categoryOptions}
        searchTypeOptions={[
          { value: "title", label: "제목" },
          { value: "content", label: "내용" },
          { value: "writer", label: "작성자" },
          { value: "inst", label: "소속" },
        ]}
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
      </div>

      <div className="ag-theme-cdm w-full aggridguard">
        <AgGridReact
          rowData={qnaData}
          columnDefs={colDefs}
          domLayout="autoHeight"
          loading={false}
          overlayNoRowsTemplate="<span style='padding: 20px; display: block;'>게시물이 존재하지 않습니다.</span>"
          rowStyle={{ cursor: "pointer" }}
          onRowClicked={(e) => {
            const data = e.data;
            if (!boardType || !data?.qstnSn) return;
            navigate(`${routes.COMMUNITY.ROOT}/${boardType}/admin/qna/detail/${data.qstnSn}`);
          }}
        />
      </div>

      <SpaceBox gap={CONTENT_GAP.MEDIUM} />

      <Stack direction="row" className="paging_wrap">
        <CdmPagination
          page={appliedState.currentPage}
          totalPages={Math.ceil(totalCount / Number(appliedState.viewCount))}
          onChange={(page) => {
            const nextState: SearchState = { ...appliedState, currentPage: page };
            setFormState(nextState);
            applySearchParams(nextState);
          }}
        />
        <CdmPaginationMove
          currentPage={appliedState.currentPage}
          totalPages={Math.ceil(totalCount / Number(appliedState.viewCount))}
          onPageChange={(page) => {
            const nextState: SearchState = { ...appliedState, currentPage: page };
            setFormState(nextState);
            applySearchParams(nextState);
          }}
        />
      </Stack>
    </div>
  );
}