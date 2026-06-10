import { useMemo } from "react";
import { Box, Fade, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "dayjs/locale/ko";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import {
  CONTENT_GAP,
  DISCLOSURE_PARTNER_PROGRESS_STATUS,
  DISCLOSURE_PARTNER_PROGRESS_STATUS_LABEL_MAP,
  DISCLOSURE_PARTNER_PROGRESS_STATUS_OPTIONS,
  DISCLOSURE_PBLNT_STATUS_CODE,
  PROGRESS_STATUS,
} from "@/constants/types";
import type { DisclosureListPartnerGridRow, DisclosureListResponse } from "@/interfaces/disclosureInterface";
import { DisclosureAPI } from "@/api/disclosureApi";
import {
  buildPath,
  getDisclosurePartnerProgressStatusChipStyle,
  getDisclosurePblntStatusConfig,
  getStatusConfig,
} from "@/utils/common";
import { formatDateComma } from "@/utils/dateUtils";
import { useDisclosureListPartnerUrlState } from "@/hooks/disclosure/useDisclosureListPartnerUrlState";
import { useDisclosureList } from "@/hooks/disclosure/useDisclosureQueries";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import CdmPagination from "@/components/CdmPagination";
import CdmPaginationMove from "@/components/CdmPaginationMove";
import Loader from "@/components/Loader";
import { SearchArea } from "@/components/SearchArea";
import { SpaceBox } from "@/components/SpaceBox";
import { AppButton, AppStatusChip } from "@/components/ui";

const DISCLOSURE_TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "01", label: "정기" },
  { value: "02", label: "비정기" },
];

const DISCLOSURE_SEARCH_TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "01", label: "제목" },
  { value: "02", label: "내용" },
  { value: "03", label: "제목+내용" },
];

const DISCLOSURE_PARTNER_PROGRESS_CODE_VALUES = Object.values(DISCLOSURE_PARTNER_PROGRESS_STATUS) as readonly string[];

export default function DisclosureListPartner() {
  const routes = useCmRoutes();
  const navigate = useNavigate();

  const {
    appliedState,
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
  } = useDisclosureListPartnerUrlState();

  const { data: response, isLoading, isError, refetch } = useDisclosureList(searchParams);

  const disclosures = useMemo(() => response?.data?.data || [], [response?.data?.data]);

  const pagination = useMemo(
    () => ({
      page: response?.data?.page || 1,
      length: response?.data?.length || 10,
      total: response?.data?.total || 0,
    }),
    [response?.data?.page, response?.data?.length, response?.data?.total]
  );

  const totalPages = pagination.length > 0 ? Math.ceil(pagination.total / pagination.length) : 0;

  const rowData: DisclosureListPartnerGridRow[] = useMemo(
    () =>
      disclosures.map((item: DisclosureListResponse) => ({
        pblntSn: item.pblntSn,
        pblntDvcd: item.pblntDvcd,
        ttlNm: item.ttlNm,
        period: {
          pblntBgngYmd: item.pblntBgngYmd,
          pblntEndYmd: item.pblntEndYmd,
        },
        pblntStcd: item.pblntStcd ?? null,
        uldTypeCd: item.uldTypeCd ?? null,
        uldInstPrgrsSttsCd: item.uldInstPrgrsSttsCd ?? null,
        rgtrId: item.rgtrId,
        rgtrNm: item.rgtrNm ?? null,
      })),
    [disclosures]
  );

  const colDefs = useMemo<ColDef<DisclosureListPartnerGridRow>[]>(
    () =>
      [
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
          cellRenderer: (p: ICellRendererParams<DisclosureListPartnerGridRow>) => {
            return DisclosureAPI.convertType(p.value) || "-";
          },
        },
        {
          headerName: "제목",
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
          cellRenderer: (p: ICellRendererParams<DisclosureListPartnerGridRow>) => (
            <Box className="ag-cell-center-vertical">
              <Box>
                <Box component="p">{formatDateComma(p.value?.pblntBgngYmd)} ~</Box>
                <Box component="p">{formatDateComma(p.value?.pblntEndYmd)}</Box>
              </Box>
            </Box>
          ),
        },
        {
          headerName: "업로드 유형",
          headerClass: "ag-header-center",
          field: "uldTypeCd",
          width: 140,
          cellStyle: () => ({ textAlign: "center" }),
          valueFormatter: (params) => {
            const map: Record<string, string> = {
              "01": "파일업로드",
              "02": "현황등록",
            };
            return params.value ? map[params.value] || params.value : "-";
          },
        },
        {
          headerName: "상태",
          headerClass: "ag-header-center",
          field: "uldInstPrgrsSttsCd",
          width: 100,
          cellStyle: () => ({ textAlign: "center" }),
          cellRenderer: (p: ICellRendererParams<DisclosureListPartnerGridRow>) => {
            const pblntStcdRaw = p.data?.pblntStcd;
            const s = pblntStcdRaw == null ? "" : String(pblntStcdRaw).trim();
            const pblntKey = !s ? "" : s.length === 1 ? `0${s}` : s;
            if (pblntKey === DISCLOSURE_PBLNT_STATUS_CODE.CLOSED) {
              const closedCfg = getDisclosurePblntStatusConfig(DISCLOSURE_PBLNT_STATUS_CODE.CLOSED);
              return (
                <Box className="ag-cell-center-vertical">
                  <AppStatusChip label={closedCfg?.label ?? "마감"} size="small" chipStyle={closedCfg?.chipStyle} />
                </Box>
              );
            }

            const progressCdRaw = p.value != null ? String(p.value) : "";
            const statusText =
              progressCdRaw && DISCLOSURE_PARTNER_PROGRESS_CODE_VALUES.includes(progressCdRaw)
                ? DISCLOSURE_PARTNER_PROGRESS_STATUS_LABEL_MAP[progressCdRaw] ?? "-"
                : progressCdRaw || "-";
            const chipStyle =
              getDisclosurePartnerProgressStatusChipStyle(progressCdRaw || null) ??
              getStatusConfig(PROGRESS_STATUS.NOT_REGISTERED)?.chipStyle;
            return (
              <Box className="ag-cell-center-vertical">
                <AppStatusChip label={statusText} size="small" chipStyle={chipStyle} />
              </Box>
            );
          },
        },
        {
          headerName: "작성자",
          headerClass: "ag-header-center",
          cellStyle: () => ({ textAlign: "center" }),
          field: "rgtrNm",
          width: 120,
          valueGetter: (params) => {
            const name = params.data?.rgtrNm;
            return name != null && String(name).trim() !== "" ? String(name).trim() : "-";
          },
        },
      ] as ColDef<DisclosureListPartnerGridRow>[],
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
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          목록을 불러오지 못했습니다.
        </Typography>
        <AppButton variant="outlined" onClick={() => void refetch()}>
          다시 시도
        </AppButton>
      </Box>
    );
  }

  return (
    <Fade in timeout={280}>
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
          statusLabel2="기관진행상태"
          statusFilter2={uldPrgrSttsCd}
          onStatusFilterChange2={setUldPrgrSttsCdFilter}
          statusOptions2={DISCLOSURE_PARTNER_PROGRESS_STATUS_OPTIONS}
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
        />

        <SpaceBox gap={CONTENT_GAP.SMALL} />

        <Box>
          <Box className="tbl_info">
            <Box className="total">
              <Box component="p" className="cases" sx={{ whiteSpace: "nowrap" }}>
                전체
                <Box component="span" className="count">
                  {pagination.total}
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
            <Box className="tbl_controller"></Box>
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
                  const pblntSn = event.data.pblntSn;
                  try {
                    localStorage.setItem("pblntSn", String(pblntSn));
                  } catch {
                    // ignore
                  }
                  const detailPath = buildPath(routes.CDM.DISCLOSURE_DETAIL, { pblntSn });
                  navigate(detailPath);
                }
              }}
              rowStyle={{ cursor: "pointer" }}
            />
          </Box>

          {totalPages > 0 && (
            <>
              <Box sx={{ mt: 2 }} />
              <Stack direction="row" className="paging_wrap">
                <CdmPagination page={pagination.page} totalPages={totalPages} onChange={handlePageChange} />
                <CdmPaginationMove currentPage={pagination.page} totalPages={totalPages} onPageChange={handlePageChange} />
              </Stack>
            </>
          )}
        </Box>
      </Box>
    </Fade>
  );
}
