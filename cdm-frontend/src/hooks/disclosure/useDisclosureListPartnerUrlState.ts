import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import type { DisclosureSearchRequest } from "@/interfaces/disclosureInterface";
import { formatDateToYYYYMMDD } from "@/utils/dateUtils";

/** URL 쿼리 키 (협력기관 공시 목록) */
export const DISCLOSURE_PARTNER_LIST_Q = {
  PAGE: "page",
  PBLNT_DVCD: "pblntDvcd",
  ULD_PRGR_STTS_CD: "uldPrgrSttsCd",
  SEARCH_START_DATE: "searchStartDate",
  SEARCH_END_DATE: "searchEndDate",
  SEARCH_TYPE: "searchType",
  SEARCH_KEYWORD: "searchKeyword",
  LENGTH: "length",
} as const;

export type DisclosurePartnerListSearchState = {
  pblntDvcd: string;
  uldPrgrSttsCd: string;
  searchType: string;
  searchKeyword: string;
  startdate: dayjs.Dayjs | null;
  enddate: dayjs.Dayjs | null;
  viewCount: string;
  currentPage: number;
};

const defaultSearchState: DisclosurePartnerListSearchState = {
  pblntDvcd: "",
  uldPrgrSttsCd: "",
  searchType: "",
  searchKeyword: "",
  startdate: null,
  enddate: null,
  viewCount: "10",
  currentPage: 1,
};

function parseSearchParamsFromURL(searchParams: URLSearchParams): DisclosurePartnerListSearchState {
  const page = searchParams.get(DISCLOSURE_PARTNER_LIST_Q.PAGE);
  const startDateStr = searchParams.get(DISCLOSURE_PARTNER_LIST_Q.SEARCH_START_DATE);
  const endDateStr = searchParams.get(DISCLOSURE_PARTNER_LIST_Q.SEARCH_END_DATE);
  return {
    pblntDvcd: searchParams.get(DISCLOSURE_PARTNER_LIST_Q.PBLNT_DVCD) ?? defaultSearchState.pblntDvcd,
    uldPrgrSttsCd:
      searchParams.get(DISCLOSURE_PARTNER_LIST_Q.ULD_PRGR_STTS_CD) ?? defaultSearchState.uldPrgrSttsCd,
    searchType: searchParams.get(DISCLOSURE_PARTNER_LIST_Q.SEARCH_TYPE) ?? defaultSearchState.searchType,
    searchKeyword: searchParams.get(DISCLOSURE_PARTNER_LIST_Q.SEARCH_KEYWORD) ?? defaultSearchState.searchKeyword,
    startdate: startDateStr && dayjs(startDateStr).isValid() ? dayjs(startDateStr) : null,
    enddate: endDateStr && dayjs(endDateStr).isValid() ? dayjs(endDateStr) : null,
    viewCount: searchParams.get(DISCLOSURE_PARTNER_LIST_Q.LENGTH) ?? defaultSearchState.viewCount,
    currentPage: page ? Math.max(1, parseInt(page, 10) || 1) : defaultSearchState.currentPage,
  };
}

function buildURLSearchParams(state: DisclosurePartnerListSearchState, pageOverride?: number): Record<string, string> {
  const page = pageOverride ?? state.currentPage;
  const params: Record<string, string> = {
    [DISCLOSURE_PARTNER_LIST_Q.PAGE]: String(page),
    [DISCLOSURE_PARTNER_LIST_Q.PBLNT_DVCD]: state.pblntDvcd,
    [DISCLOSURE_PARTNER_LIST_Q.ULD_PRGR_STTS_CD]: state.uldPrgrSttsCd,
    [DISCLOSURE_PARTNER_LIST_Q.SEARCH_TYPE]: state.searchType,
    [DISCLOSURE_PARTNER_LIST_Q.LENGTH]: state.viewCount,
  };
  if (state.searchKeyword.trim()) params[DISCLOSURE_PARTNER_LIST_Q.SEARCH_KEYWORD] = state.searchKeyword.trim();
  if (state.startdate) params[DISCLOSURE_PARTNER_LIST_Q.SEARCH_START_DATE] = state.startdate.format("YYYY-MM-DD");
  if (state.enddate) params[DISCLOSURE_PARTNER_LIST_Q.SEARCH_END_DATE] = state.enddate.format("YYYY-MM-DD");
  return params;
}

function buildApiSearchParams(applied: DisclosurePartnerListSearchState): DisclosureSearchRequest {
  const params: DisclosureSearchRequest = {
    page: applied.currentPage,
    length: parseInt(applied.viewCount, 10),
  };

  if (applied.pblntDvcd) params.pblntDvcd = applied.pblntDvcd;
  if (applied.uldPrgrSttsCd) params.uldPrgrSttsCd = applied.uldPrgrSttsCd;
  if (applied.startdate) params.pblntBgngYmd = formatDateToYYYYMMDD(applied.startdate.format("YYYY-MM-DD"));
  if (applied.enddate) params.pblntEndYmd = formatDateToYYYYMMDD(applied.enddate.format("YYYY-MM-DD"));

  if (applied.searchKeyword.trim()) {
    params.keyword = applied.searchKeyword.trim();
    if (applied.searchType === "01") params.searchType = "title";
    else if (applied.searchType === "02") params.searchType = "content";
    else params.searchType = "both";
  }

  return params;
}

/**
 * 협력기관 공시 목록: URL = 적용된 검색, form = 입력 필드.
 * - ResearchAdmin 패턴과 동일하게 "입력(form) ↔ 적용(URL)" 분리
 */
export function useDisclosureListPartnerUrlState() {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  const appliedState = useMemo(() => parseSearchParamsFromURL(urlSearchParams), [urlSearchParams]);

  const [formState, setFormState] = useState<DisclosurePartnerListSearchState>(() =>
    parseSearchParamsFromURL(new URLSearchParams(urlSearchParams))
  );
  const [searchKeywordError, setSearchKeywordError] = useState(false);

  useEffect(() => {
    setFormState(parseSearchParamsFromURL(urlSearchParams));
  }, [urlSearchParams]);

  const { pblntDvcd, uldPrgrSttsCd, searchType, searchKeyword, startdate, enddate, viewCount } = formState;

  const setStartDate = (v: dayjs.Dayjs | null) => setFormState((s) => ({ ...s, startdate: v }));
  const setEndDate = (v: dayjs.Dayjs | null) => setFormState((s) => ({ ...s, enddate: v }));
  const setPblntDvcdFilter = (v: string) => setFormState((s) => ({ ...s, pblntDvcd: v }));
  const setUldPrgrSttsCdFilter = (v: string) => setFormState((s) => ({ ...s, uldPrgrSttsCd: v }));
  const setSearchTypeFilter = (v: string) => setFormState((s) => ({ ...s, searchType: v }));
  const setSearchKeywordFilter = (v: string) => setFormState((s) => ({ ...s, searchKeyword: v }));

  const searchParams: DisclosureSearchRequest = useMemo(() => buildApiSearchParams(appliedState), [appliedState]);

  const applySearchParams = (state: DisclosurePartnerListSearchState, pageOverride?: number) => {
    setUrlSearchParams(buildURLSearchParams(state, pageOverride), { replace: false });
  };

  const handleSearch = () => {
    const keyword = formState.searchKeyword.trim();
    const valid = keyword.length === 0 || keyword.length >= 2;
    setSearchKeywordError(keyword.length > 0 && !valid);
    const stateToApply: DisclosurePartnerListSearchState = {
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
    pblntDvcd,
    uldPrgrSttsCd,
    searchType,
    searchKeyword,
    startdate,
    enddate,
    viewCount,
    setStartDate,
    setEndDate,
    setPblntDvcdFilter,
    setUldPrgrSttsCdFilter,
    setSearchTypeFilter,
    setSearchKeywordFilter,
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

