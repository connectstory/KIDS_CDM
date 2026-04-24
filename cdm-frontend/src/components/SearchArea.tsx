import { Box, Button, Chip, MenuItem, Select, TextField } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { koKR } from "@mui/x-date-pickers/locales";
import type { Dayjs } from "dayjs";
import "dayjs/locale/ko";
import { STRINGS } from "@/constants/string";
import styles from "./SearchArea.module.css";

export type SearchAreaOption = { value: string; label: string };

const DEFAULT_SEARCH_TYPE_OPTIONS: SearchAreaOption[] = [
  { value: "title", label: "제목" },
  { value: "content", label: "내용" },
  { value: "writer", label: "작성자" },
];

const RESEARCH_STATUS_OPTIONS: SearchAreaOption[] = [
  { value: "00", label: "전체" },
  { value: "01", label: "참여요청" },
  { value: "02", label: "진행중(통합,기관분석)" },
  { value: "03", label: "진행중(메타분석)" },
  { value: "04", label: "마감" },
  { value: "05", label: "취소" },
];

const RESEARCH_STATUS_OPTIONS_WITHOUT_CANCEL: SearchAreaOption[] = RESEARCH_STATUS_OPTIONS.filter((o) => o.value !== "05");

const QNA_CATEGORY_OPTIONS: SearchAreaOption[] = [
  { value: "ALL", label: "전체" },
  { value: "01", label: "답변대기" },
  { value: "02", label: "답변완료" },
];

export type SearchAreaProps = {
  onSearch: () => void;
  onReset: () => void;
  /** 과제상태 블록 표시 (Research) */
  showStatusFilter?: boolean;
  /** 상태/구분 필터 라벨 (기본: "과제상태", Disclosure: "구분") */
  statusLabel?: string;
  /** 두 번째 상태 필터 표시 (Disclosure: 공시상태) */
  showStatusFilter2?: boolean;
  /** 두 번째 상태 필터 라벨 */
  statusLabel2?: string;
  /** 기간선택 블록 표시 (Research) */
  showDateRange?: boolean;
  /** 분류 블록 표시 (Qna admin) */
  showCategoryFilter?: boolean;
  // 과제상태 (showStatusFilter 시)
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  statusOptions?: SearchAreaOption[];
  /** ResearchPartner는 취소 미포함 */
  statusOptionsIncludeCancel?: boolean;
  // 두 번째 상태 (showStatusFilter2 시)
  statusFilter2?: string;
  onStatusFilterChange2?: (value: string) => void;
  statusOptions2?: SearchAreaOption[];
  // 기간 (showDateRange 시)
  startDate?: Dayjs | null;
  endDate?: Dayjs | null;
  onStartDateChange?: (value: Dayjs | null) => void;
  onEndDateChange?: (value: Dayjs | null) => void;
  // 분류 (showCategoryFilter 시)
  categoryValue?: string;
  onCategoryChange?: (value: string) => void;
  categoryOptions?: SearchAreaOption[];
  categoryLabel?: string;
  // 검색어 (항상)
  searchType: string;
  onSearchTypeChange: (value: string) => void;
  searchKeyword: string;
  onSearchKeywordChange: (value: string) => void;
  searchTypeOptions?: SearchAreaOption[];
  /** 검색어 2자 미만 등 유효성 오류 표시 */
  searchKeywordError?: boolean;
  searchKeywordHelperText?: string;
  /** 참여기관 블록 표시 (Disclosure 공시 관리) */
  showPartnerFilter?: boolean;
  /** 참여기관 블록 라벨 */
  partnerLabel?: string;
  /** 선택된 참여기관 목록 (brno, instNm) */
  selectedPartners?: { brno: string; instNm: string }[];
  /** 기관 추가 모달 열기 */
  onOpenPartnerModal?: () => void;
  /** 참여기관 칩 삭제 */
  onRemovePartner?: (brno: string) => void;

  twoColumn?: boolean;
};

export function SearchArea({
  onSearch,
  onReset,
  twoColumn = false,
  showStatusFilter = false,
  statusLabel = "과제상태",
  showStatusFilter2 = false,
  statusLabel2 = "상태",
  showDateRange = false,
  showCategoryFilter = false,
  statusFilter = "00",           // ← 기존 기본값 유지
  onStatusFilterChange,
  statusOptions,
  statusOptionsIncludeCancel = true,
  statusFilter2 = "",
  onStatusFilterChange2,
  statusOptions2,
  startDate = null,
  endDate = null,
  onStartDateChange,
  onEndDateChange,
  categoryValue = "ALL",
  onCategoryChange,
  categoryOptions = QNA_CATEGORY_OPTIONS,
  categoryLabel = "분류",
  searchType,
  onSearchTypeChange,
  searchKeyword,
  onSearchKeywordChange,
  searchTypeOptions = DEFAULT_SEARCH_TYPE_OPTIONS,
  searchKeywordError = false,
  searchKeywordHelperText,
  showPartnerFilter = false,
  partnerLabel = "참여기관",
  selectedPartners = [],
  onOpenPartnerModal,
  onRemovePartner,
}: SearchAreaProps) {
  const effectiveStatusOptions =
    statusOptions ?? (statusOptionsIncludeCancel ? RESEARCH_STATUS_OPTIONS : RESEARCH_STATUS_OPTIONS_WITHOUT_CANCEL);
  const effectiveStatusOptions2 = statusOptions2 ?? [];

  // twoColumn 모드: 상태필터들만 첫 행, 기간선택은 검색어 행에 합침
  // 일반 모드: 기존 방식 (상태필터 + 기간선택 모두 첫 행)
  const hasFirstRow = showStatusFilter || showStatusFilter2 || (!twoColumn && showDateRange);

  const dateRangeBlock = showDateRange && (
    <Box className={styles.search_wrap_column}>
      <Box className={styles.search_wrap_row_label}>
        <span>기간선택</span>
      </Box>
      <Box className={styles.search_wrap_row_content}>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="ko"
          localeText={koKR.components.MuiLocalizationProvider.defaultProps.localeText}
        >
          <DatePicker
            label={STRINGS.START_DATE}
            format="YYYY-MM-DD"
            slotProps={{
              textField: { size: "small", sx: { width: 180 } },
              calendarHeader: { format: "YYYY년 M월" },
            }}
            value={startDate ?? null}
            onChange={(v) => onStartDateChange?.(v ?? null)}
            maxDate={endDate ?? undefined}
          />
          <span className="px-2 leading-[2.5]">-</span>
          <DatePicker
            label={STRINGS.END_DATE}
            format="YYYY-MM-DD"
            slotProps={{
              textField: { size: "small", sx: { width: 180 } },
              calendarHeader: { format: "YYYY년 M월" },
            }}
            value={endDate ?? null}
            onChange={(v) => onEndDateChange?.(v ?? null)}
            minDate={startDate ?? undefined}
          />
        </LocalizationProvider>
      </Box>
    </Box>
  );

  return (
    <Box className={styles.filter_finder}>
      <Box className={styles.search_wrap}>
        {hasFirstRow && (
          <Box className={styles.search_wrap_row}>
            {showStatusFilter && (
              <Box className={styles.search_wrap_column}>
                <Box className={styles.search_wrap_row_label}>
                  <span>{statusLabel}</span>
                </Box>
                <Box className={styles.search_wrap_row_content}>
                  <Select
                    className="w-full max-w-[12rem]"
                    value={statusFilter}
                    displayEmpty
                    renderValue={(value) => {
                      const found = effectiveStatusOptions.find((o) => o.value === value);
                      return found ? found.label : "전체";
                    }}
                    onChange={(e) => onStatusFilterChange?.(e.target.value)}
                  >
                    {effectiveStatusOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </Box>
            )}

            {showStatusFilter2 && (
              <Box className={styles.search_wrap_column}>
                <Box className={styles.search_wrap_row_label}>
                  <span>{statusLabel2}</span>
                </Box>
                <Box className={styles.search_wrap_row_content}>
                  <Select
                    className="w-full max-w-[12rem]"
                    value={statusFilter2}
                    displayEmpty
                    renderValue={(value) => {
                      const found = effectiveStatusOptions2.find((o) => o.value === value);
                      return found ? found.label : "전체";
                    }}
                    onChange={(e) => onStatusFilterChange2?.(e.target.value)}
                  >
                    {effectiveStatusOptions2.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </Box>
            )}

            {/* twoColumn 아닐 때는 기간선택을 첫 행에 */}
            {!twoColumn && dateRangeBlock}
          </Box>
        )}

        <Box className={styles.search_wrap_row}>
          {/* twoColumn일 때는 기간선택을 검색어 행 앞에 */}
          {twoColumn && dateRangeBlock}

          {showCategoryFilter && (
            <Box className={styles.search_wrap_column}>
              <Box className={styles.search_wrap_row_label}>
                <span>{categoryLabel}</span>
              </Box>
              <Box className={styles.search_wrap_row_content}>
                <Select
                  className="w-full max-w-[14rem]"
                  value={categoryValue}
                  displayEmpty
                  renderValue={(value) => {
                    const found = categoryOptions.find((o) => o.value === value);
                    return found ? found.label : "전체";
                  }}
                  onChange={(e) => onCategoryChange?.(e.target.value)}
                >
                  {categoryOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
          )}

          <Box className={styles.search_wrap_column}>
            <Box className={styles.search_wrap_row_label}>
              <span>검색어</span>
            </Box>
            <Box className={styles.search_wrap_row_content}>
              <Select
                className={showCategoryFilter ? "min-w-[6rem]" : "min-w-[6rem] field_input"}
                value={searchType}
                displayEmpty
                renderValue={(value) => {
                  const found = searchTypeOptions.find((o) => o.value === value);
                  return found ? found.label : "전체";
                }}
                onChange={(e) => onSearchTypeChange(e.target.value)}
              >
                {searchTypeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              <div className="w-1" />
              <Box>
                <TextField
                  className="max-w-[15rem]"
                  variant="outlined"
                  value={searchKeyword}
                  onChange={(e) => onSearchKeywordChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch();
                  }}
                  label="검색어를 입력하세요"
                  error={searchKeywordError}
                  helperText={searchKeywordHelperText}
                />
              </Box>
            </Box>
          </Box>
        </Box>

        {showPartnerFilter && (
          <Box className={styles.search_wrap_row}>
            <Box className={styles.search_wrap_column}>
              <Box className={styles.search_wrap_row_label}>
                <span>{partnerLabel}</span>
              </Box>
              <Box className="w-full">
                <Box className={styles.search_wrap_row_content}>
                  <Button variant="outlined" size="medium" onClick={onOpenPartnerModal}>
                    기관 추가
                  </Button>
                </Box>
                {selectedPartners.length > 0 && (
                  <Box className={styles.search_wrap_row_content}>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        alignItems: "center",
                        flex: 1,
                        px: 1,
                        py: 1,
                        bgcolor: "white",
                        border: "1px solid",
                        borderColor: "grey.300",
                        borderRadius: 1,
                      }}
                    >
                      {selectedPartners.length > 0 ? (
                        selectedPartners.map((partner) => (
                          <Chip
                            key={partner.brno}
                            label={partner.instNm}
                            size="small"
                            onDelete={onRemovePartner ? () => onRemovePartner(partner.brno) : undefined}
                            sx={{ margin: "2px" }}
                          />
                        ))
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "14px" }}>참여기관을 선택하세요</span>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}

        <Box className={`${styles.btn_area}`}>
          <Button variant="outlined" size="medium" onClick={onReset}>
            <i className="fa-solid fa-arrows-rotate text-sm mr-1" />
            초기화
          </Button>
          <div className="w-1" />
          <Button variant="contained" size="medium" onClick={onSearch}>
            <i className="fa-solid fa-magnifying-glass text-sm mr-1" />
            검색
          </Button>
        </Box>
      </Box>
    </Box>
  );
}