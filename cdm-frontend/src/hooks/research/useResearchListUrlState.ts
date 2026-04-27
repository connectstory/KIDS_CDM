import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import type { ResearchSearchRequest } from "@/interfaces/researchInterface";

/** URL 쿼리 키 ( /cm/.../research/owner|partner?...) */
export const RESEARCH_LIST_Q = {
  PAGE: "page",
  PROGRESS_STATUS: "progressStatus",
  SEARCH_TYPE: "searchType",
  SEARCH_KEYWORD: "searchKeyword",
  SEARCH_START_DATE: "searchStartDate",
  SEARCH_END_DATE: "searchEndDate",
  LENGTH: "length",
} as const;

export type ResearchListSearchState = {
  statusFilter: string;
  searchType: "title" | "content";
  searchKeyword: string;
  startdate: dayjs.Dayjs | null;
  enddate: dayjs.Dayjs | null;
  viewCount: string;
  currentPage: number;
};

const defaultSearchState: ResearchListSearchState = {
  statusFilter: "00",
  searchType: "title",
  searchKeyword: "",
  startdate: null,
  enddate: null,
  viewCount: "10",
  currentPage: 1,
};

function parseSearchParamsFromURL(searchParams: URLSearchParams): ResearchListSearchState {
  const page = searchParams.get(RESEARCH_LIST_Q.PAGE);
  const startDateStr = searchParams.get(RESEARCH_LIST_Q.SEARCH_START_DATE);
  const endDateStr = searchParams.get(RESEARCH_LIST_Q.SEARCH_END_DATE);
  return {
    statusFilter: searchParams.get(RESEARCH_LIST_Q.PROGRESS_STATUS) ?? defaultSearchState.statusFilter,
    searchType: (searchParams.get(RESEARCH_LIST_Q.SEARCH_TYPE) as "title" | "content") ?? defaultSearchState.searchType,
    searchKeyword: searchParams.get(RESEARCH_LIST_Q.SEARCH_KEYWORD) ?? defaultSearchState.searchKeyword,
    startdate: startDateStr && dayjs(startDateStr).isValid() ? dayjs(startDateStr) : null,
    enddate: endDateStr && dayjs(endDateStr).isValid() ? dayjs(endDateStr) : null,
    viewCount: searchParams.get(RESEARCH_LIST_Q.LENGTH) ?? defaultSearchState.viewCount,
    currentPage: page ? Math.max(1, parseInt(page, 10) || 1) : defaultSearchState.currentPage,
  };
}

function buildURLSearchParams(state: ResearchListSearchState, pageOverride?: number): Record<string, string> {
  const page = pageOverride ?? state.currentPage;
  const params: Record<string, string> = {
    [RESEARCH_LIST_Q.PAGE]: String(page),
    [RESEARCH_LIST_Q.PROGRESS_STATUS]: state.statusFilter,
    [RESEARCH_LIST_Q.SEARCH_TYPE]: state.searchType,
    [RESEARCH_LIST_Q.LENGTH]: state.viewCount,
  };
  if (state.searchKeyword.trim()) params[RESEARCH_LIST_Q.SEARCH_KEYWORD] = state.searchKeyword.trim();
  if (state.startdate) params[RESEARCH_LIST_Q.SEARCH_START_DATE] = state.startdate.format("YYYY-MM-DD");
  if (state.enddate) params[RESEARCH_LIST_Q.SEARCH_END_DATE] = state.enddate.format("YYYY-MM-DD");
  return params;
}

function buildApiSearchParams(applied: ResearchListSearchState): ResearchSearchRequest {
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
}

/**
 * 연구 과제 목록(관리자/참여기관) 공통: URL = 적용된 검색, form = 입력 필드.
 */
export function useResearchListUrlState() {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  const appliedState = useMemo(() => parseSearchParamsFromURL(urlSearchParams), [urlSearchParams]);

  const [formState, setFormState] = useState<ResearchListSearchState>(() =>
    parseSearchParamsFromURL(new URLSearchParams(urlSearchParams))
  );
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

  const searchParams: ResearchSearchRequest = useMemo(() => buildApiSearchParams(applied), [applied]);

  const applySearchParams = (state: ResearchListSearchState, pageOverride?: number) => {
    setUrlSearchParams(buildURLSearchParams(state, pageOverride), { replace: false });
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

  return {
    appliedState,
    formState,
    statusFilter,
    searchType,
    searchKeyword,
    startdate,
    enddate,
    viewCount,
    applied,
    setStartDate,
    setEndDate,
    setStatusFilter,
    setSearchType,
    setSearchKeyword,
    setFormState,
    searchParams,
    applySearchParams,
    handleSearch,
    handleResetFilter,
    handlePageChange,
    searchKeywordError,
    setSearchKeywordError,
    defaultSearchState,
  };
}
