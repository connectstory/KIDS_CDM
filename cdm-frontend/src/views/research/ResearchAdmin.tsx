import { useMemo } from "react";
import { Box, Fade, MenuItem, Select, Typography } from "@mui/material";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { STRINGS } from "@/constants/string";
import { CONTENT_GAP, ProgressStatusType } from "@/constants/types";
import type { ResearchListResponse } from "@/interfaces/researchInterface";
import { StatusMap, buildPath, getResearchStatusConfig, getStatusConfig } from "@/utils/common";
import { useResearchListByAdmin } from "@/hooks/research/useResearchQueries";
import { useResearchListUrlState } from "@/hooks/research/useResearchListUrlState";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import CdmPagination from "@/components/CdmPagination";
import CdmPaginationMove from "@/components/CdmPaginationMove";
import Loader from "@/components/Loader";
import { SearchArea } from "@/components/SearchArea";
import { SpaceBox } from "@/components/SpaceBox";
import { AppButton, AppStatusChip } from "@/components/ui";
import styles from "./researchListShared.module.scss";

export default function ResearchAdminView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const {
    appliedState,
    statusFilter,
    searchType,
    searchKeyword,
    startdate,
    enddate,
    viewCount,
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
  } = useResearchListUrlState();

  const { data: researchListData, isLoading, isError, refetch } = useResearchListByAdmin(searchParams);

  const researches = useMemo(() => researchListData?.data || [], [researchListData?.data]);

  const pagination = useMemo(
    () => ({
      page: researchListData?.page || 1,
      length: researchListData?.length || 10,
      total: researchListData?.total || 0,
    }),
    [researchListData]
  );

  type ResearchRow = {
    asmtSn: number;
    asmtId: string;
    instNm: string;
    asmtNm: string;
    period: { flfmtBgngDt: string; flfmtEndDt: string };
    asmtPrgrsSttsCd: string;
    metaStatus: number;
    reviewInProgress: boolean;
  };

  const rowData: ResearchRow[] = useMemo(
    () =>
      researches.map((r: ResearchListResponse) => ({
        asmtSn: r.asmtSn,
        asmtId: r.asmtId,
        instNm: r.instNm || r.deptNm || "-",
        asmtNm: r.asmtNm,
        period: r.flfmtBgngDt
          ? {
              flfmtBgngDt: dayjs(r.flfmtBgngDt).format("YYYY.MM.DD"),
              flfmtEndDt: dayjs(r.flfmtEndDt).format("YYYY.MM.DD"),
            }
          : { flfmtBgngDt: "", flfmtEndDt: "" },
        asmtPrgrsSttsCd: r.asmtPrgrsSttsCd,
        metaStatus: r.metaAnalysisCount || 0,
        reviewInProgress: r.reviewInProgress ?? false,
      })),
    [researches]
  );

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
          cellRenderer: (p: ICellRendererParams<ResearchRow>) => {
            const inProgress = p.data?.reviewInProgress ?? false;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {inProgress && (
                  <AppStatusChip size="small" label="관리자 검토요청" chipStyle={StatusMap.inprogressReviewDept1.chipStyle} />
                )}
                <span className="u-ellipsis">{p.value ?? ""}</span>
              </Box>
            );
          },
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
          cellRenderer: (p: ICellRendererParams<ResearchRow>) => (
            <Box className="ag-cell-center-vertical">
              <Box>
                <Box component="p">{p.value?.flfmtBgngDt} ~</Box>
                <Box component="p">{p.value?.flfmtEndDt}</Box>
              </Box>
            </Box>
          ),
        },
        {
          headerName: STRINGS.RESEARCH_STATUS,
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
            const statusConfig = getResearchStatusConfig(p.value);
            return <AppStatusChip size="small" label={statusConfig?.label ?? ""} chipStyle={statusConfig?.chipStyle ?? {}} />;
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
              <AppStatusChip
                size="small"
                label={(p.value as number) > 0 ? STRINGS.REGISTERED : STRINGS.NOT_REGISTERED}
                chipStyle={statusConfig?.chipStyle || {}}
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
    return (
      <Box className={styles.root} sx={{ py: 4, textAlign: "center" }}>
        <Helmet>
          <title>{`CDM - 연구과제 관리`}</title>
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
      <Box className={styles.root}>
        <Helmet>
          <title>{`CDM - 연구과제 관리`}</title>
        </Helmet>
        <SearchArea
          showStatusFilter
          showDateRange
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusOptionsIncludeCancel={true}
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

        <Box>
          <Box className="tbl_info">
            <Box className="total">
              <Box component="p" className="cases">
                전체<Box component="span" className="count">{pagination.total}</Box>건
              </Box>
            </Box>
            <Box className="view_count">
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
            </Box>
            <Box className="tbl_controller">
              <AppButton variant="contained" size="medium" onClick={() => navigate(routes.RESEARCH.CREATE)}>
                과제 등록{" "}
              </AppButton>
            </Box>
          </Box>

          <Box className="ag-theme-cdm w-full">
            <AgGridReact
              rowData={rowData}
              columnDefs={colDefs}
              domLayout="autoHeight"
              overlayNoRowsTemplate={`<span style="padding:8px;">검색된 연구과제가 없습니다.</span>`}
              onRowClicked={(event) => {
                if (event.data?.asmtSn) {
                  navigate(
                    buildPath(routes.RESEARCH.DETAIL, {
                      role: "owner",
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

                <Box className={styles.pagingWrap}>
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
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}
