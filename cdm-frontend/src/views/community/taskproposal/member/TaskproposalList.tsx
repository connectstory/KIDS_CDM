import { useEffect, useMemo, useState } from "react";
import { Button, Chip, MenuItem, Select, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { adminImgSuggestProcess } from "@/config/images";
import { CONTENT_GAP } from "@/constants/types";
import type { AsmtPrpItem } from "@/interfaces/communityInterface";
import { fetchAsmtPrpList } from "@/api/communityApi";
import { getQnaStatusConfig } from "@/utils/common";
import { useCommonCodes } from "@/hooks/useCommonCodes";
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

export default function MemberTaskproposalListView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const mbrId = useSelector((state: RootState) => state.session.userNo);

  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  const appliedState = useMemo(() => parseSearchParamsFromURL(urlSearchParams), [urlSearchParams]);
  const [formState, setFormState] = useState<SearchState>(() => parseSearchParamsFromURL(new URLSearchParams(urlSearchParams)));
  const [searchKeywordError, setSearchKeywordError] = useState(false);

  useEffect(() => {
    setFormState(parseSearchParamsFromURL(urlSearchParams));
  }, [urlSearchParams]);

  const { viewCount, searchKeyword, searchType } = formState;

  const { codeMap: statusCodeMap } = useCommonCodes("CMCMM00004");

  const applySearchParams = (state: SearchState, pageOverride?: number) => {
    setUrlSearchParams(buildURLSearchParams(state, pageOverride), {
      replace: false,
    });
  };

  /* =========================
     React Query (검색 버튼 클릭 시 반영된 값으로만 조회)
  ========================= */
  const { data } = useQuery({
    queryKey: [
      "asmtPrpList",
      appliedState.currentPage,
      appliedState.viewCount,
      appliedState.searchType,
      appliedState.searchKeyword,
    ],
    queryFn: () =>
      fetchAsmtPrpList({
        page: appliedState.currentPage,
        pageSize: appliedState.viewCount,
        searchType: appliedState.searchType,
        searchKeyword: appliedState.searchKeyword,
        loginId: mbrId,
      }),
    refetchOnMount: "always",
  });

  const rows = data?.list ?? [];
  const totalCount = data?.totalCount ?? 0;

  // =========================
  // AG-Grid 컬럼
  // =========================
  const colDefs: ColDef<AsmtPrpItem>[] = [
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
      field: "tpcTtlNm",
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
      headerName: "진행",
      field: "asmtPrpAnsSttsCd",
      width: 120,
      headerClass: "ag-header-center",
      cellRenderer: makeStatusCellRenderer(statusCodeMap),
    },
    {
      headerName: "작성일",
      field: "regDt",
      width: 140,
      headerClass: "ag-header-center",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "조회수",
      field: "pstInqCnt",
      width: 90,
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
        <title>CDM - 과제제안</title>
      </Helmet>
      {/* KRDS 안내문 */}
      <div className="border border-gray-200 bg-white rounded p-5 text-gray-700">
        <p className="leading-relaxed mb-4">
          한국의약품안전관리원은 다양한 경로로 연구주제를 수집하여 의약품 의료정보 연계분석 사업을 수행하고 있습니다.
        </p>

        <p className="leading-relaxed mb-4">
          이에 병원자료(전자의무기록) 활용 의약품 안전성 분석연구를 위한 주제를 제안받고 있습니다.
        </p>

        <p className="leading-relaxed mb-4 text-gray-700">
          <span className="text-blue-600 font-medium">
            연구를 위한 주제는 공개 및 비공개를 선택하여 제안 할 수 있으며, 제안해주신 내용은 다음과 같은 과정을 거쳐 의약품
            안전정보 생산에 활용됩니다.
          </span>
        </p>

        <div className="w-full flex justify-center my-6">
          <img src={adminImgSuggestProcess} className="max-w-full" alt="제안접수 → 주관부서검토 → 제안선정" />
        </div>

        <p className="text-gray-500 leading-relaxed">
          <span className="text-blue-600 font-medium">
            ※ 개인정보 유출, 타인에 대한 비방과 허위 사실 적시, 욕설 등의 게시물은 정보통신망 이용촉진 및 정보보호 등에 관한
            법률에 의거 처벌받을 수 있으며 관리자에 의해 비공개로 전환될 수 있습니다.
          </span>
        </p>
      </div>

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
        <div className="tbl_controller">
          <Button
            variant="contained"
            size="medium"
            onClick={() => navigate(`${routes.COMMUNITY.ROOT}/taskproposal/taskproposalWrite`)}
          >
            등록
          </Button>
        </div>
      </div>

      {/* 그리드 */}
      <div className="ag-theme-cdm w-full aggridguard">
        <AgGridReact
          rowData={rows}
          columnDefs={colDefs}
          domLayout="autoHeight"
          loading={false}
          overlayNoRowsTemplate="<span style='padding: 20px; display: block;'>게시물이 존재하지 않습니다.</span>"
          rowStyle={{ cursor: "pointer" }}
          onRowClicked={(e) => {
            const data = e.data;
            if (!data) return;
            navigate(`${routes.COMMUNITY.ROOT}/taskproposal/member/taskproposalDetail/${data.asmtPrpSn}`);
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
