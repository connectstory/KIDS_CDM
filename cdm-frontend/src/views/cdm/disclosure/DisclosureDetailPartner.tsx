/**
 * DisclosureDetailCustomer — 협력기관(참여기관) 공시 상세 화면
 *
 * 구성 요약:
 * - 모듈 상단: 날짜/상태/등록유형 판별 순수 함수 → AgGrid `partnerColDefs` → 컴포넌트 `DisclosureDetailCustomer`
 * - 데이터: React Query로 공시 상세 · 참여기관 목록 · 첨부파일 목록 조회 후, 세션 기관과 일치하는 행만 그리드에 표시
 * - 상호작용: 비고/등록유형 셀에서 참여확정·거부·등록·취소사유 등 → 핸들러 → DisclosureAPI
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, FormControl, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import dayjs from "dayjs";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CONTENT_GAP, DISCLOSURE_PARTNER_PROGRESS_STATUS, DISCLOSURE_PBLNT_STATUS_CODE } from "@/constants/types";
import type { DisclosurePartnerResponse } from "@/interfaces/disclosureInterface.ts";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { DisclosureAPI } from "@/api/disclosureApi";
import type { RootState } from "@/store";
import { formatDate, formatDateTime } from "@/utils/dateUtils";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import FileContainer, { type FileData } from "@/components/FileContainer";
import Loader from "@/components/Loader";
import { SpaceBox } from "@/components/SpaceBox";

/**
 * formatPartnerDate — 참여기관 그리드 일시 컬럼 표시용 포맷터
 * @param value API가 내려주는 날짜(문자열 또는 [년,월,일,시,분,초] 배열 등)
 * @returns `YYYY.MM.DD HH:mm` 형 문자열, 파싱 불가 시 `"-"` 또는 원문(문자열인데 파싱 실패 시)
 */
function formatPartnerDate(value: unknown): string {
  if (value == null || value === "") return "-";

  // 이미 문자열인 경우
  if (typeof value === "string") {
    const parsed = dayjs(value);
    if (parsed.isValid()) {
      return parsed.format("YYYY.MM.DD HH:mm");
    }
    // 파싱 실패 시 원본 반환 (디버깅용)
    return value;
  }

  // 배열 형태인 경우 [y, m, d, h, i, s]
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m = 1, day = 1, h = 0, min = 0, s = 0] = value;
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    const parsed = dayjs(dateStr);
    return parsed.isValid() ? parsed.format("YYYY.MM.DD HH:mm") : "-";
  }

  return "-";
}

/**
 * normalizeUldTypeCd — 업로드(등록) 유형 코드 정규화
 * @param v `uldTypeCd` / `uld_type_cd` 등 원시값
 * @returns trim된 문자열 (01=파일·CDM 업로드 경로, 02=현황등록 — 관리자 화면과 동일 코드)
 */
function normalizeUldTypeCd(v: unknown): string {
  if (v == null || v === "") return "";
  return String(v).trim();
}

/**
 * hasSavedCdmStatusDraft — 현황등록 쪽 “초안 저장” 여부 (서버가 uld_type_cd를 안 올린 경우 대비)
 * @param partner 참여기관 행 객체 (camelCase/snake_case 혼용 필드 참조)
 * @returns 버전명·최종수정일·주기 중 하나라도 있으면 true
 */
function hasSavedCdmStatusDraft(partner: any): boolean {
  if (!partner) return false;
  const v = partner.verInfoNm ?? partner.ver_info_nm;
  const l = partner.lastUpdtYmd ?? partner.last_updt_ymd;
  const c = partner.updtCycleCnt ?? partner.updt_cycle_cnt;
  if (v != null && String(v).trim() !== "") return true;
  if (l != null && String(l).trim() !== "") return true;
  if (c != null && String(c).trim() !== "") return true;
  return false;
}

/**
 * normalizePartnerStatusCode — 참여기관 진행상태 코드를 두 자리 문자열로 통일 (예: 7 → "07")
 * @param v `uldInstPrgrsSttsStcd` 등
 * @returns 두 자리 코드 문자열 또는 빈 문자열
 */
function normalizePartnerStatusCode(v: unknown): string {
  if (v == null || v === "") return "";
  const s = String(v).trim();
  if (s.length === 1 && /^\d$/.test(s)) return `0${s}`;
  return s;
}

/**
 * isStatusRegistrationTransmitted — “현황등록” 경로에서 전송(확정) 완료로 볼 수 있는지
 * @param partner 참여기관 행
 * @returns 현황등록 흐름이 아니면 false. 03/05면 true. 06/07은 재요청일 대비 완료일 시각 비교. 그 외는 완료일시 존재 여부
 */
function isStatusRegistrationTransmitted(partner: any): boolean {
  if (!partner) return false;

  const uld = normalizeUldTypeCd(partner.uldTypeCd ?? partner.uld_type_cd);
  const draft = hasSavedCdmStatusDraft(partner);
  const looksLikeStatusPath = uld === "02" || (draft && uld !== "01");
  if (!looksLikeStatusPath) return false;

  const st = normalizePartnerStatusCode(partner.uldInstPrgrsSttsStcd ?? partner.uld_inst_prgrs_stts_cd);
  if (st === "03" || st === "05") return true;

  const cmptn = partner.ptcpCmptnDt ?? partner.ptcp_cmptn_dt;
  const rdmnd = partner.ptcpRdmndDt ?? partner.ptcp_rdmnd_dt;

  const cmptnStr = cmptn != null ? String(cmptn).trim() : "";
  const rdmndStr = rdmnd != null ? String(rdmnd).trim() : "";

  // 재요청(06/07) 상태에서는 단순 완료일시만으로는 과거 값이 남아있을 수 있어,
  // 재요청일시(ptcpRdmndDt) 이후에 완료일시가 갱신된 경우에만 "전송 완료"로 본다.
  if (st === "06" || st === "07") {
    if (!cmptnStr || !rdmndStr) return false;
    const cmptnD = dayjs(cmptnStr);
    const rdmndD = dayjs(rdmndStr);
    if (!cmptnD.isValid() || !rdmndD.isValid()) return false;
    return cmptnD.isAfter(rdmndD) || cmptnD.isSame(rdmndD);
  }

  // 그 외 상태는 완료일시 존재 여부로 판정
  return cmptnStr !== "";
}

/**
 * deriveLockedRegistrationType — 등록유형(파일 vs 현황)이 서버/업로드 상태로 이미 확정됐는지 판단
 * @param partner 참여기관 행
 * @param hasCdmUploadForPtcpInstSn 해당 참여기관에 CDM(fileSeCd 08) 업로드가 있는지
 * @returns `"file"` | `"status"` 로 잠길 때만 반환, 선택 가능이면 `null`
 */
function deriveLockedRegistrationType(
  partner: any | null | undefined,
  hasCdmUploadForPtcpInstSn: (ptcpInstSn?: number | null) => boolean
): "file" | "status" | null {
  if (!partner) return null;
  const rowUld = normalizeUldTypeCd(partner.uldTypeCd ?? partner.uld_type_cd);
  const hasCdm = hasCdmUploadForPtcpInstSn(partner.ptcpInstSn);
  const draft = hasSavedCdmStatusDraft(partner);
  const lockedFile = rowUld === "01" || hasCdm;
  const lockedStatus = rowUld === "02" || (draft && !hasCdm && rowUld !== "01");
  if (lockedFile && lockedStatus) return hasCdm ? "file" : "status";
  if (lockedFile) return "file";
  if (lockedStatus) return "status";
  return null;
}

/** 참여기관 전용 AgGrid 컬럼: 진행상태·일시·등록유형(Select)·비고(상태별 버튼) — `context`로 핸들러 주입 */
const partnerColDefs: ColDef<DisclosurePartnerResponse>[] = [
  /** 컬럼: 진행상태 — 코드 → 한글 라벨 */
  {
    headerName: "진행상태",
    field: "uldInstPrgrsSttsStcd",
    flex: 1,
    headerClass: "ag-header-center",
    cellStyle: { textAlign: "center" },
    valueFormatter: (params) => {
      if (!params.value) return "-";
      const statusMap: Record<string, string> = {
        "01": "참여요청", // 코드모음: 01=참여요청
        "02": "진행중", // 코드모음: 02=진행중
        "03": "완료", // 코드모음: 03=완료
        "04": "참여취소", // 코드모음: 04=참여취소
        "05": "등록완료", // 코드모음: 05=등록
        "06": "참여재요청", // 코드모음: 06=참여재요청
        "07": "등록재요청", // 코드모음: 07=등록재요청
      };
      return statusMap[params.value] || params.value;
    },
  },
  /** 컬럼: 요청일시 — `ptcpDmndDt` */
  {
    headerName: "요청일시",
    field: "ptcpDmndDt",
    flex: 1,
    headerClass: "ag-header-center",
    cellStyle: { textAlign: "center" },
    valueFormatter: (params) => formatPartnerDate(params.value),
  },
  /** 컬럼: 확정일시 — `ptcpCfmtnDt` */
  {
    headerName: "확정일시",
    field: "ptcpCfmtnDt",
    flex: 1,
    headerClass: "ag-header-center",
    cellStyle: { textAlign: "center" },
    valueFormatter: (params) => formatPartnerDate(params.value),
  },
  /** 컬럼: 완료일자 — `ptcpCmptnDt` */
  {
    headerName: "완료일자",
    field: "ptcpCmptnDt",
    flex: 1,
    headerClass: "ag-header-center",
    cellStyle: { textAlign: "center" },
    valueFormatter: (params) => formatPartnerDate(params.value),
  },
  /** 컬럼: 재요청일자 — `ptcpRdmndDt` (비고 컬럼의 field와 동일 필드명이나 용도는 표시만) */
  {
    headerName: "재요청일자",
    field: "ptcpRdmndDt",
    width: 150,
    headerClass: "ag-header-center",
    cellStyle: { textAlign: "center" },
    valueFormatter: (params) => formatPartnerDate(params.value),
  },
  /**
   * 컬럼: 등록유형 — 파일업로드 vs 현황등록
   * context: `registrationType`, `onRegistrationTypeChange`, `hasCdmUploadForPtcpInstSn`, `partnerSubmissionAllowed`
   */
  {
    headerName: "등록유형",
    width: 140,
    headerClass: "ag-header-center",
    cellStyle: { textAlign: "center" },
    cellClass: "ag-cell-center-vertical",
    cellRenderer: (params: ICellRendererParams<any>) => {
      const row = params.data;
      const hasCdmFn = params.context?.hasCdmUploadForPtcpInstSn as ((n?: number | null) => boolean) | undefined;
      const derived = hasCdmFn != null ? deriveLockedRegistrationType(row, hasCdmFn) : null;
      const cellValue: "file" | "status" = derived ?? ((params.context?.registrationType ?? "file") as "file" | "status");
      const registrationTypeLocked = derived != null;
      const onRegistrationTypeChange = params.context?.onRegistrationTypeChange;
      const submissionBlocked = params.context?.partnerSubmissionAllowed === false;
      return (
        <div
          className="ag-cell-center-vertical"
          style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <FormControl>
            <Select
              value={cellValue}
              onChange={(e) => onRegistrationTypeChange?.(e.target.value as "file" | "status")}
              displayEmpty
              disabled={submissionBlocked || registrationTypeLocked}
            >
              <MenuItem value="file">파일업로드</MenuItem>
              <MenuItem value="status">현황등록</MenuItem>
            </Select>
          </FormControl>
        </div>
      );
    },
  },
  /**
   * 컬럼: 비고 — `uldInstPrgrsSttsStcd`에 따라 참여확정/거부/등록/취소사유/재등록 등 분기
   * context: `onPartnerRequest`, `onPartnerRefuse`, `onRegister`, `onViewCancelReason`, `registeredPtcpInstSnSet`, 기타 등록유형과 동일
   */
  {
    headerName: "비고",
    field: "ptcpRdmndDt",
    minWidth: 220,
    flex: 1,
    headerClass: "ag-header-center",
    cellStyle: { textAlign: "center" },
    cellClass: "ag-cell-center-vertical",
    cellRenderer: (params: ICellRendererParams<any>) => {
      /** 비고 셀: `uldInstPrgrsSttsStcd` → 분기 (01 요청 / 02 확정·등록 / 04 취소 / 05 완료 / 07 재요청 / 기타) */
      const statusValue = params.data?.uldInstPrgrsSttsStcd;
      const currentStatus = normalizePartnerStatusCode(statusValue);

      const submissionBlocked = params.context?.partnerSubmissionAllowed === false;

      if (currentStatus === "01") {
        /* 01 참여요청: 참여확정(onPartnerRequest→02) · 참여거부 버튼 비활성(정책) */
        return (
          <div
            className="ag-cell-center-vertical"
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "row",
              flexWrap: "nowrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxSizing: "border-box",
            }}
          >
            <Button
              variant="outlined"
              size="small"
              disabled={submissionBlocked}
              sx={{ flexShrink: 0 }}
              onClick={() => {
                if (params.context?.onPartnerRequest) {
                  params.context.onPartnerRequest(params.data?.ptcpInstSn, "02");
                }
              }}
            >
              참여확정
            </Button>
          </div>
        );
      } else if (currentStatus === "02") {
        /* 02 진행중: 등록(onRegister) — 직후 registeredPtcpInstSnSet이면 "완료됨", 현황 전송 완료면 버튼 비활성 */
        const ptcpInstSn = params.data?.ptcpInstSn;
        const isJustRegistered = ptcpInstSn != null && params.context?.registeredPtcpInstSnSet?.[String(ptcpInstSn)] === true;
        const statusRegTransmitted = isStatusRegistrationTransmitted(params.data);
        if (isJustRegistered) {
          return (
            <div
              className="ag-cell-center-vertical"
              style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Typography variant="body2" color="text.secondary">
                완료됨
              </Typography>
            </div>
          );
        }
        return (
          <div
            className="ag-cell-center-vertical"
            style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Button
              variant="outlined"
              size="small"
              color="primary"
              disabled={submissionBlocked || statusRegTransmitted}
              onClick={() => {
                if (params.context?.onRegister) {
                  params.context.onRegister(
                    params.data?.pblntSn,
                    params.data?.ptcpInstSn // ← 두 번째 인자로 함께 전달
                  );
                }
              }}
            >
              등록
            </Button>
          </div>
        );
      } else if (currentStatus === "05") {
        /* 05 등록완료: 텍스트만 */
        return (
          <div
            className="ag-cell-center-vertical"
            style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Typography variant="body2" color="text.secondary">
              완료됨
            </Typography>
          </div>
        );
      } else if (currentStatus === "04") {
        /* 04 참여취소: 취소사유 모달(onViewCancelReason) */
        return (
          <div
            className="ag-cell-center-vertical"
            style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => {
                if (params.context?.onViewCancelReason) {
                  params.context.onViewCancelReason(params.data?.ptcpInstSn);
                }
              }}
            >
              취소사유
            </Button>
          </div>
        );
      } else if (currentStatus === "07") {
        /* 07 등록재요청: 재업로드 vs 현황 재등록 라벨, 전송 완료면 완료됨·비활성 */
        const row = params.data;
        const statusRegTransmitted = isStatusRegistrationTransmitted(row);
        const hasCdmFn = params.context?.hasCdmUploadForPtcpInstSn as ((n?: number | null) => boolean) | undefined;
        const derived = hasCdmFn != null ? deriveLockedRegistrationType(row, hasCdmFn) : null;
        const reg = derived ?? ((params.context?.registrationType ?? "file") as "file" | "status");
        const btnLabel = statusRegTransmitted ? "완료됨" : reg === "status" ? "현황 재등록" : "재업로드";
        return (
          <div
            className="ag-cell-center-vertical"
            style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Button
              variant="outlined"
              size="small"
              color="primary"
              disabled={submissionBlocked || statusRegTransmitted}
              onClick={() => {
                if (params.context?.onRegister) {
                  params.context.onRegister(params.data?.pblntSn, params.data?.ptcpInstSn);
                }
              }}
            >
              {btnLabel}
            </Button>
          </div>
        );
      } else {
        /* 그 외(예: 03 완료 등): 맵에 있으면 라벨, 없으면 "-" */
        const statusLabelMap: Record<string, string> = {
          "03": "완료", // 코드모음: 03=완료
          "05": "등록완료", // 코드모음: 05=등록
        };
        const label = statusLabelMap[currentStatus] || "-";

        return (
          <div
            className="ag-cell-center-vertical"
            style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </div>
        );
      }
    },
  },
];

/**
 * localStorage 접근이 거부되거나(비활성·쿼터 등) 예외가 나면 로깅한 뒤 폴백합니다 (CWE-390).
 */
function readLocalStorageString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("[DisclosureDetailCustomer] localStorage.getItem 실패", { key, error });
    return null;
  }
}

function writeLocalStorageString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error("[DisclosureDetailCustomer] localStorage.setItem 실패", { key, error });
  }
}

/**
 * DisclosureDetailCustomer — 협력기관(참여기관) 전용 공시 상세 페이지
 *
 * UI 정책:
 * - 공시 수정/삭제·참여기관 추가 없음 (관리자 전용 기능 제외)
 * - 세션 기관과 일치하는 참여기관 행만 그리드에 표시
 * - `mbrTypeCd === "A"`(관리자)가 이 경로로 진입한 경우에만 하단 **수집현황상세**, **공시시작** 노출
 *
 * 데이터 흐름: `pblntSn` 확정 → 공시 상세 쿼리 → 참여기관 쿼리 → 본인 기관 필터 → 파일 목록(CDM 여부) → 그리드 context
 */
export default function DisclosureDetailCustomer() {
  // --- 라우팅·전역 ---
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { pblntSn: pblntSnFromRoute } = useParams<{ pblntSn: string }>();
  const [searchParams] = useSearchParams();
  /** 라우트 재진입 시 `location.key`로 쿼리 무효화/재조회 트리거 */
  const location = useLocation();
  const { showAlert } = useGlobalAlert();
  const queryClient = useQueryClient();
  /** 모달: 참여취소 등 사유 조회 */
  const cancelReasonViewModal = useModal(ModalNames.CancelReasonView);
  /** 모달: 참여거부 시 사유 입력 */
  const commentForReasonModal = useModal(ModalNames.CommentForReason);

  /**
   * state: registeredPtcpInstSnSet — `handleRegister` 직후 같은 행에 "등록" 버튼이 다시 뜨지 않도록 표시용(완료됨)
   * 형식: `{ [ptcpInstSn]: true }`
   */
  const [registeredPtcpInstSnSet, setRegisteredPtcpInstSnSet] = useState<Record<string, true>>({});

  /** 로컬스토리지 키: 등록유형 기본값 유지 (`file` | `status`) */
  const STORAGE_KEY = "disclosureRegistrationType";
  const [registrationType, setRegistrationType] = useState<"file" | "status">(() => {
    const v = readLocalStorageString(STORAGE_KEY);
    if (v === "status" || v === "file") return v;
    return "file";
  });
  /**
   * onRegistrationTypeChange — AgGrid 등록유형 Select 변경 핸들러
   * @param value `"file"` | `"status"` — `registrationType` 상태 및 `localStorage`(STORAGE_KEY) 갱신
   */
  const onRegistrationTypeChange = useCallback((value: "file" | "status") => {
    setRegistrationType(value);
    writeLocalStorageString(STORAGE_KEY, value);
  }, []);

  // --- 세션(Redux): 기관 식별·관리자 여부 ---
  const session = useSelector((state: RootState) => state.session);
  const mbrId = session.mbrId || "";
  const instId = session.instId || "";
  /** 관리자가 고객용 상세 URL로 들어와도 하단 운영 버튼(수집현황·공시시작) 사용 가능 */
  const isAdminUser = session.mbrTypeCd === "A";

  // --- 공시일련번호 `pblntSn` 확정 (우선순위: path param > legacy query > localStorage) ---
  const pblntSnFromUrl = searchParams.get("pblntSn");
  const pblntSnFromStorage = readLocalStorageString("pblntSn");
  const pblntSn = pblntSnFromRoute || pblntSnFromUrl || pblntSnFromStorage;
  /** 숫자 공시 PK (라우팅/스토리지에서 문자열로 들어오므로 필요 시만 변환) */
  const pblntSnId = useMemo(() => (pblntSn ? Number(pblntSn) : NaN), [pblntSn]);

  // --- React Query: 공시 상세 (`DisclosureAPI.getDisclosureById`) ---
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["disclosure", pblntSn],
    queryFn: () => DisclosureAPI.getDisclosureById(String(pblntSn!)),
    enabled: !!pblntSn,
    staleTime: 0,
    refetchOnMount: "always" as const,
  });

  /** API 응답 본문의 공시 단건 */
  const disclosure = response?.data?.data;

  /** 공시 상태(`pblntStcd`)에 따라 협력기관 제출·버튼 허용 여부 및 경고 문구 */
  const partnerSubmissionAllowed = useMemo(
    () => DisclosureAPI.isPartnerSubmissionAllowed(disclosure?.pblntStcd),
    [disclosure?.pblntStcd]
  );
  const partnerSubmissionBlockedMessage = useMemo(
    () => DisclosureAPI.getPartnerSubmissionBlockedMessage(disclosure?.pblntStcd),
    [disclosure?.pblntStcd]
  );

  // --- React Query: 참여기관 목록 (`getPartnersByPblntSn`) — 상세 로드 후에만 실행 ---
  const {
    data: partners = [],
    isLoading: isLoadingPartners,
    error: partnersError,
  } = useQuery({
    queryKey: ["disclosure-partners", pblntSn],
    queryFn: async () => {
      if (!pblntSn) {
        return [];
      }

      try {
        const response = await DisclosureAPI.getPartnersByPblntSn(String(pblntSn));

        // 응답 데이터가 배열인지 확인
        const partnersData = response.data?.data;
        if (Array.isArray(partnersData)) {
          return partnersData;
        } else {
          return [];
        }
      } catch (error: unknown) {
        console.error("[DisclosureDetailCustomer] 참여기관 목록 조회 실패", error);
        return [];
      }
    },
    enabled: !!pblntSn && !isLoading && !!disclosure,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always" as const,
  });
  /** 그리드 필터: 세션 `instId` 우선, 없으면 `mbrId`로 기관 매칭 */
  const filterInstId = instId || mbrId;

  /** 본인 소속 기관과 `instId`가 일치하는 참여기관 행만 (협력기관 화면은 자기 행만) */
  const myPartner = useMemo(() => {
    if (!Array.isArray(partners) || !filterInstId) return [];
    const normalize = (value: unknown) => {
      if (value == null) return "";
      const str = typeof value === "string" ? value : String(value);
      return str.trim();
    };
    const target = normalize(filterInstId);
    return partners.filter((p: any) => normalize(p.instId) === target);
  }, [partners, filterInstId]);

  /** 첫 번째 본인 행의 `ptcpInstSn` — 파일 목록 쿼리 키·CDM 파일 매핑에 사용 */
  const currentPtcpInstSn: number | null = useMemo(() => {
    if (myPartner.length > 0) return myPartner[0].ptcpInstSn ?? null;
    return null;
  }, [myPartner]);

  // --- React Query: 공시 첨부파일 (`getFilesByPblntSn`) — CDM(08) 존재 여부로 등록유형 잠금 판단 ---
  const {
    data: filesResponse,
    isLoading: isLoadingFiles,
    isError: isErrorFiles,
    error: errorFiles,
  } = useQuery({
    queryKey: ["disclosure-files", pblntSn, currentPtcpInstSn],
    queryFn: async () => {
      const res = await DisclosureAPI.getFilesByPblntSn(
        String(pblntSn!),
        currentPtcpInstSn != null ? String(currentPtcpInstSn) : null
      );
      return res;
    },
    enabled: !!pblntSn && !!disclosure,
    staleTime: 0,
    refetchOnMount: "always" as const,
  });

  /** ptcpInstSn → 해당 기관에 CDM 업로드 파일(fileSeCd 08)이 있는지 */
  const cdmUploadByPtcpInstSn = useMemo(() => {
    const list = filesResponse?.data?.data;
    const m = new Map<number, boolean>();
    if (!Array.isArray(list)) return m;
    list.forEach((f: any) => {
      const del = f.delYn ?? f.del_yn;
      if (del === "Y" || del === "y") return;
      if (normalizeUldTypeCd(f.fileSeCd ?? f.file_se_cd) !== "08") return;
      const sn = f.ptcpInstSn != null ? Number(f.ptcpInstSn) : NaN;
      if (!Number.isNaN(sn)) m.set(sn, true);
    });
    return m;
  }, [filesResponse?.data?.data]);

  /**
   * hasCdmUploadForPtcpInstSn — 특정 참여기관에 CDM 파일이 있는지 (deriveLockedRegistrationType에 주입)
   * @param ptcpInstSn 참여기관 일련번호
   */
  const hasCdmUploadForPtcpInstSn = useCallback(
    (ptcpInstSn?: number | null) => {
      if (ptcpInstSn == null) return false;
      return cdmUploadByPtcpInstSn.get(Number(ptcpInstSn)) === true;
    },
    [cdmUploadByPtcpInstSn]
  );

  /** 서버/파일 반영으로 등록유형이 잠기면 `registrationType`·localStorage를 동기화 */
  useEffect(() => {
    const p = myPartner[0];
    const derived = deriveLockedRegistrationType(p, hasCdmUploadForPtcpInstSn);
    if (derived == null) return;
    setRegistrationType(derived);
    writeLocalStorageString(STORAGE_KEY, derived);
  }, [myPartner, hasCdmUploadForPtcpInstSn, filesResponse?.data?.data]);

  useEffect(() => {}, [pblntSnId, isLoadingPartners, partners, partnersError, filterInstId, myPartner.length]);

  /**
   * 라우트 `location.key` 변경 시 — 재진입 시 그리드/상세가 stale하지 않도록 disclosure·partners 강제 갱신
   * (같은 라우트에서 컴포넌트가 remount 되지 않는 케이스 대비)
   */
  useEffect(() => {
    if (Number.isNaN(pblntSnId)) return;
    queryClient.invalidateQueries({ queryKey: ["disclosure", pblntSn], exact: true });
    queryClient.invalidateQueries({ queryKey: ["disclosure-partners", pblntSn], exact: true });
    queryClient.refetchQueries({ queryKey: ["disclosure", pblntSn], exact: true });
    queryClient.refetchQueries({ queryKey: ["disclosure-partners", pblntSn], exact: true });
  }, [location.key, pblntSn, pblntSnId, queryClient]);

  /** 동일하게 `location.key` 변경 시 첨부파일 쿼리만 재조회 */
  useEffect(() => {
    if (Number.isNaN(pblntSnId) || currentPtcpInstSn == null) return;
    queryClient.refetchQueries({
      queryKey: ["disclosure-files", pblntSn, currentPtcpInstSn],
      exact: true,
    });
  }, [location.key, pblntSn, pblntSnId, currentPtcpInstSn, queryClient]);

  /** 참여기관 목록 쿼리 실패 시 토스트 */
  useEffect(() => {
    if (partnersError) {
      const message =
        partnersError instanceof Error
          ? partnersError.message
          : (partnersError as any)?.response?.data?.message || "진행상태를 불러오는 중 오류가 발생했습니다.";
      showAlert({ message, severity: "error" });
    }
  }, [partnersError, showAlert]);

  /**
   * handlePartnerRefuse — 비고 "참여거부" (진행상태 01일 때)
   * 입력: `ptcpInstSn` — 모달에서 사유 수집 후 `requestPartnerStatus(..., "04", reason)`
   * 출력: 성공 시 partners 쿼리 무효화·재조회, 알림
   */
  const handlePartnerRefuse = useCallback(
    async (ptcpInstSn?: number | null) => {
      if (Number.isNaN(pblntSnId)) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      if (!ptcpInstSn) {
        showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
        return;
      }
      const partner = myPartner.find((p) => p.ptcpInstSn === ptcpInstSn);
      if (!partner) {
        showAlert({ message: "참여기관 정보를 찾을 수 없습니다.", severity: "error" });
        return;
      }
      try {
        const result = await commentForReasonModal.open({
          title: "참여거부 사유 입력",
          data: { partner, partnerRefuseOnly: true },
        });
        if (result && typeof result === "object" && "reason" in result && (result as { reason?: string }).reason) {
          const modalResult = result as { ptcpInstSn: number; processType: string; reason: string };
          if (modalResult.processType === DISCLOSURE_PARTNER_PROGRESS_STATUS.CANCELLED) {
            await DisclosureAPI.requestPartnerStatus(
              pblntSnId,
              modalResult.ptcpInstSn,
              DISCLOSURE_PARTNER_PROGRESS_STATUS.CANCELLED,
              modalResult.reason
            );
            await queryClient.invalidateQueries({ queryKey: ["disclosure-partners", pblntSn] });
            await queryClient.refetchQueries({ queryKey: ["disclosure-partners", pblntSn] });
            showAlert({ message: "참여가 거부 처리되었습니다.", severity: "success" });
          }
        }
      } catch (error: unknown) {
        const e = error as { response?: { data?: { message?: string } }; message?: string };
        if (e?.response || e?.message) {
          const message = e?.response?.data?.message || e?.message || "참여거부 처리 중 오류가 발생했습니다.";
          showAlert({ message, severity: "error" });
        } else if (error != null) {
          console.error("[DisclosureDetailCustomer] 참여거부 처리 중 예외", error);
        }
      }
    },
    [pblntSn, pblntSnId, myPartner, queryClient, showAlert, commentForReasonModal]
  );

  /**
   * handlePartnerRequest — 비고 "참여확정" 등 상태 전이 (`requestPartnerStatus`)
   * @param ptcpInstSn 참여기관 번호
   * @param status 목표 상태 코드 (예: "02" 참여확정)
   */
  const handlePartnerRequest = useCallback(
    async (ptcpInstSn?: number | null, status?: string) => {
      if (Number.isNaN(pblntSnId)) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      if (!ptcpInstSn) {
        showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
        return;
      }
      if (!DisclosureAPI.isPartnerSubmissionAllowed(disclosure?.pblntStcd)) {
        showAlert({ message: DisclosureAPI.getPartnerSubmissionBlockedMessage(disclosure?.pblntStcd), severity: "warning" });
        return;
      }
      try {
        await DisclosureAPI.requestPartnerStatus(pblntSnId, ptcpInstSn, status);
        // 캐시를 무효화하여 자동으로 리프레시되도록 함
        await queryClient.invalidateQueries({ queryKey: ["disclosure-partners", pblntSn] });
        // 추가로 명시적으로 리프레시
        await queryClient.refetchQueries({ queryKey: ["disclosure-partners", pblntSn] });
        showAlert({ message: "상태가 변경되었습니다.", severity: "success" });
      } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "상태 변경 중 오류가 발생했습니다.";
        showAlert({ message, severity: "error" });
      }
    },
    [pblntSn, pblntSnId, queryClient, showAlert, disclosure?.pblntStcd]
  );

  /**
   * handleRegister — 비고 "등록" / 재업로드 / 현황 재등록
   * @param pblntSn 공시 번호
   * @param ptcpInstSn 참여기관 번호 — `registeredPtcpInstSnSet`에 표시용 키로 사용 후 라우팅
   * 동작: 공시 제출 허용 검사 → 현황 전송 완료면 차단 → `PARTNER_INFO_WRITE`(현황) 또는 `UPLOAD`(파일)로 navigate
   */
  const handleRegister = useCallback(
    (pblntSn?: number | null, ptcpInstSn?: number | null) => {
      if (!pblntSn) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      if (!DisclosureAPI.isPartnerSubmissionAllowed(disclosure?.pblntStcd)) {
        showAlert({ message: DisclosureAPI.getPartnerSubmissionBlockedMessage(disclosure?.pblntStcd), severity: "warning" });
        return;
      }
      const partnerRow = ptcpInstSn != null ? myPartner.find((p: any) => p.ptcpInstSn === ptcpInstSn) : myPartner[0];
      const regTypeEarly = deriveLockedRegistrationType(partnerRow, hasCdmUploadForPtcpInstSn) ?? registrationType;
      if (regTypeEarly === "status" && isStatusRegistrationTransmitted(partnerRow)) {
        showAlert({ message: "현황등록이 전송 완료되어 등록을 진행할 수 없습니다.", severity: "warning" });
        return;
      }
      if (ptcpInstSn != null) {
        setRegisteredPtcpInstSnSet((prev) => ({ ...prev, [String(ptcpInstSn)]: true }));
      }
      const regType = deriveLockedRegistrationType(partnerRow, hasCdmUploadForPtcpInstSn) ?? registrationType;
      if (regType === "status") {
        navigate(`${routes.CDM.PARTNER_INFO_WRITE}?pblntSn=${pblntSn}&ptcpInstSn=${ptcpInstSn}`);
      } else {
        navigate(`${routes.CDM.UPLOAD}?pblntSn=${pblntSn}&ptcpInstSn=${ptcpInstSn}`);
      }
    },
    [
      navigate,
      showAlert,
      registrationType,
      hasCdmUploadForPtcpInstSn,
      myPartner,
      routes.CDM.PARTNER_INFO_WRITE,
      routes.CDM.UPLOAD,
      disclosure?.pblntStcd,
    ]
  );

  /**
   * handleViewCancelReason — 비고 "취소사유" (상태 04) — 조회 전용 모달
   * @param ptcpInstSn 해당 행의 참여기관 번호
   */
  const handleViewCancelReason = useCallback(
    async (ptcpInstSn?: number | null) => {
      if (Number.isNaN(pblntSnId)) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      if (!ptcpInstSn) {
        showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
        return;
      }

      // 참여기관 정보 찾기
      const partner = myPartner.find((p) => p.ptcpInstSn === ptcpInstSn);
      if (!partner) {
        showAlert({ message: "참여기관 정보를 찾을 수 없습니다.", severity: "error" });
        return;
      }

      try {
        // 취소사유 조회 모달 열기
        await cancelReasonViewModal.open({
          title: "취소사유 조회",
          data: {
            partner: partner,
            pblntSn: pblntSnId,
          },
        });
      } catch (error: unknown) {
        const e = error as { response?: { data?: { message?: string } }; message?: string };
        if (e?.response || e?.message) {
          const message = e?.response?.data?.message || e?.message || "취소사유 조회 중 오류가 발생했습니다.";
          showAlert({ message, severity: "error" });
        } else if (error != null) {
          console.error("[DisclosureDetailCustomer] 취소사유 조회 중 예외", error);
        }
      }
    },
    [pblntSnId, myPartner, showAlert, cancelReasonViewModal]
  );

  /**
   * handleDisclosureStartClick — 관리자 전용 "공시시작" — 공시 상태를 진행중(02)으로 변경
   * 전제: `isAdminUser`일 때만 버튼 노출, 본 함수는 일정·상태 검증 후 `updateDisclosureStatus`
   */
  const handleDisclosureStartClick = useCallback(async () => {
    const statusCode = disclosure?.pblntStcd != null ? String(disclosure.pblntStcd) : null;
    const n = DisclosureAPI.normalizePblntStcd(statusCode);
    if (n === DISCLOSURE_PBLNT_STATUS_CODE.IN_PROGRESS) {
      showAlert({ message: "공시는 이미 진행중 상태입니다.", severity: "warning" });
      return;
    }
    if (n === DISCLOSURE_PBLNT_STATUS_CODE.CLOSED) {
      showAlert({ message: "공시가 마감 상태이므로 공시시작을 수행할 수 없습니다.", severity: "warning" });
      return;
    }
    if (!disclosure) {
      showAlert({ message: "공시 정보를 불러오지 못했습니다.", severity: "error" });
      return;
    }
    const today = dayjs().format("YYYYMMDD");
    const startYmd = disclosure.pblntBgngYmd;
    if (!startYmd || startYmd > today) {
      showAlert({ message: "공시시작일자가 아직 도래하지 않아 공시를 시작할 수 없습니다.", severity: "warning" });
      return;
    }
    if (Number.isNaN(pblntSnId)) {
      showAlert({ message: "공시일련번호가 없습니다.", severity: "error" });
      return;
    }
    try {
      await DisclosureAPI.updateDisclosureStatus(pblntSnId, DISCLOSURE_PBLNT_STATUS_CODE.IN_PROGRESS);
      showAlert({ message: "공시가 진행중 상태로 변경되었습니다.", severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["disclosure", pblntSn] });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "공시 상태 변경 중 오류가 발생했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    }
  }, [disclosure, pblntSn, pblntSnId, showAlert, queryClient]);

  /** 첨부파일 목록 표시용: 바이트 → 읽기 쉬운 문자열 */
  const formatFileSize = (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined || bytes === 0) return "-";
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  };

  const getFileExtension = (fileName: string): string => {
    if (!fileName) return "";
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot === -1) return "";
    return fileName.substring(lastDot + 1).toUpperCase();
  };

  /** 다운로드/표시용: 경로·UUID 접미사 등 제거해 파일명 라벨 정리 */
  const cleanAttachmentFileName = (rawName: string): string => {
    if (!rawName) return "";
    let name = String(rawName).trim();

    // URL/경로 형태가 섞인 경우 방어
    if (name.includes("?")) name = name.split("?")[0].trim();
    if (name.includes("#")) name = name.split("#")[0].trim();
    name = name.replaceAll("\\", "/");
    if (name.includes("/")) name = name.substring(name.lastIndexOf("/") + 1).trim();

    // 이미 괄호/대괄호로 부가정보가 붙어있다면 제거 (우리는 별도 suffix를 붙임)
    name = name.replace(/\s*(\([^)]*\)|\[[^\]]*\])\s*$/g, "").trim();

    // 저장파일명에 붙는 UUID/타임스탬프류 제거: base_(digits|uuid).ext, base-(digits|uuid).ext
    // 예) 보고서_20260101123000.pdf → 보고서.pdf
    // 예) 보고서_8da9f68f-a83e-4181-8995-7b5d9caed1e2.pdf → 보고서.pdf
    name = name.replace(/([_-])(\d{8,14}|[0-9a-fA-F]{8,}(?:-[0-9a-fA-F]{4,}){2,}|[0-9a-fA-F]{32})\.(\w{1,10})$/g, ".$3");

    return name;
  };

  /**
   * files — 고객용 첨부파일 카드 데이터 (삭제 버튼 없음, DRB·CDM 행 제외, 다운로드는 atchFileId UUID)
   * 소스: `filesResponse.data.data`
   */
  const files: FileData[] = (() => {
    if (!filesResponse?.data?.data || !Array.isArray(filesResponse.data.data)) {
      return [];
    }

    const fileList = filesResponse.data.data;

    const mappedFiles = fileList
      .map((file: any) => {
        const delYn = file.delYn;
        if (delYn === "Y" || delYn === "y") return null;

        // CDM 데이터(08), DRB(07) 파일은 목록에 표시하지 않음
        const fileSeCdRaw = file.fileSeCd || "";
        if (fileSeCdRaw === "07" || fileSeCdRaw === "08") return null;

        const strgFileNm =
          (file.strgFileNm && String(file.strgFileNm).trim()) || (file.strgfilenm && String(file.strgfilenm).trim()) || "";
        const atchFileSn = file.atchFileSn != null ? String(file.atchFileSn).trim() : "";
        // 다운로드 API는 첨부파일 ID(UUID) 기준
        const atchFileId =
          (file.atchFileId != null ? String(file.atchFileId).trim() : "") ||
          (file.atchfileid != null ? String(file.atchfileid).trim() : "") ||
          (file.atch_file_id != null ? String(file.atch_file_id).trim() : "");
        if (!atchFileId) return null;

        // 표시용 파일명은 원본(atchFileSn) 우선, 없으면 저장명(strgFileNm)에서 불필요 문자열 제거
        const rawLabel = atchFileSn || strgFileNm || atchFileId;
        const cleanedLabel = cleanAttachmentFileName(rawLabel);
        const baseLabel = cleanedLabel || rawLabel;
        const ext = getFileExtension(baseLabel);
        const fileSeCd = file.fileSeCd || "";
        const fileSize = file.fileSz || null;

        const displayName = baseLabel;

        return {
          name: displayName,
          ext: ext || fileSeCd,
          size: formatFileSize(fileSize),
          showDeleteButton: false,
          // onClick 다운로드 파라미터로 atch_file_id(UUID)만 전달
          atchFileSn: atchFileId,
          downloadAs: baseLabel,
        } as FileData & { atchFileSn: string };
      })
      .filter((file: FileData | null) => file !== null) as FileData[];

    return mappedFiles;
  })();

  /** FileContainer onClick — `DisclosureAPI.downloadFile` 후 Blob 저장 */
  const handleFileDownload = async (file: FileData) => {
    try {
      const fileWithSn = file as FileData & { atchFileSn?: string };
      const downloadFileName = fileWithSn.atchFileSn || file.name;

      if (!downloadFileName || downloadFileName.trim() === "" || downloadFileName === "파일") {
        showAlert({ message: "파일명을 찾을 수 없습니다.", severity: "error" });
        return;
      }

      if (!pblntSn) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      const response = await DisclosureAPI.downloadFile(downloadFileName, pblntSn);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const originalName = (file as FileData & { downloadAs?: string }).downloadAs || file.name;
      link.download = originalName || downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showAlert({ message: "파일 다운로드가 시작되었습니다.", severity: "success" });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "파일 다운로드 중 오류가 발생했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    }
  };

  /** 공시 `pblntStcd` → 한글 상태 (Chip 라벨) */
  const getStatusText = (statusCode: string | null | undefined): string => {
    if (!statusCode) return "알수없음";
    // 상태 코드를 안전하게 문자열로 변환
    const codeStr = typeof statusCode === "string" ? statusCode : String(statusCode);
    return DisclosureAPI.convertStatus(codeStr.trim());
  };

  const getStatusChipColor = (statusCode: string | null | undefined): "default" | "primary" | "success" | "error" | "warning" => {
    const status = getStatusText(statusCode);
    if (status === "마감") return "error";
    if (status === "진행중") return "primary";
    return "default";
  };

  useEffect(() => {
    document.title = "공시정보 - CDM 데이터 업로드 등록 안내";
  }, []);

  // ========== 렌더 분기: 공시번호 없음 / 로딩 / 에러 ==========
  if (Number.isNaN(pblntSnId)) {
    return (
      <div className="p-10 text-center text-gray-500">
        <div>공시일련번호가 없습니다.</div>
        <div className="mt-4 text-sm">공시목록에서 공시를 선택하거나, URL 경로에 공시번호를 포함해주세요.</div>
        <div className="mt-4">
          <Button variant="outlined" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
            목록으로 이동
          </Button>
        </div>
      </div>
    );
  }

  /** 상세 쿼리 로딩 스켈레톤 */
  if (isLoading) {
    return (
      <Box sx={{ position: "relative", minHeight: "400px" }}>
        <Loader isLoading={true} />
      </Box>
    );
  }

  /** 상세 조회 실패 또는 데이터 없음 */
  if (isError || !disclosure) {
    return (
      <div className="p-10 text-center text-red-500">
        {error instanceof Error ? error.message : "공시 정보를 불러올 수 없습니다."}
        <div className="mt-4">
          <Button variant="outlined" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  // ========== 본문: 공시 상세 + 첨부 + 진행상태 그리드 (+ 관리자 하단 버튼) ==========
  return (
    <div className="">
      <Helmet>
        <title>CDM - CDM 업로드 공시</title>
      </Helmet>
      {/* --- 헤더: 제목 + 목록 버튼 (협력기관은 수정 없음) --- */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Stack direction="column" spacing={1}>
          <Typography variant="h2">{disclosure.ttlNm || "-"}</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          {/* 협력기관은 수정 버튼 없음 */}
          <Button variant="outlined" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
            목록
          </Button>
        </Stack>
      </Box>

      <SpaceBox gap={CONTENT_GAP.LARGE} />

      {/* --- 섹션: 공시내용 (구분, 기간, 진행상태 Chip, 작성자, 등록일시, 본문 HTML) --- */}
      <section>
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            공시내용
          </Typography>
        </Box>
        <div className="form_container">
          {/* 공시 내용 1 */}
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">구분</Typography>
              </Box>
              <Box className="form_container-row-content">
                {DisclosureAPI.convertType(disclosure.pblntDvcd ?? disclosure.pblntSeCd) || "-"}
              </Box>
            </Box>
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">공시 기간</Typography>
              </Box>
              <Box className="form_container-row-content">
                {disclosure.pblntBgngYmd && disclosure.pblntEndYmd
                  ? `${formatDate(disclosure.pblntBgngYmd)} ~ ${formatDate(disclosure.pblntEndYmd)}`
                  : "-"}
              </Box>
            </Box>
          </Stack>

          {/* 공시 내용 2 */}
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">진행상태</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Chip label={getStatusText(disclosure.pblntStcd)} size="small" color={getStatusChipColor(disclosure.pblntStcd)} />
              </Box>
            </Box>
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">작성자</Typography>
              </Box>
              <Box className="form_container-row-content">{disclosure.rgtrNm || disclosure.rgtrId || "-"}</Box>
            </Box>
          </Stack>

          {/* 공시 내용 3 */}
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">등록일시</Typography>
              </Box>
              <Box className="form_container-row-content">
                {formatDateTime(disclosure.regYmd)}
              </Box>
            </Box>
          </Stack>

          {/* 공시 내용 4 */}
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">내용</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Box
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: disclosure.pblntCn?.replace(/\n/g, "<br/>") || "-",
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </div>
      </section>

      <SpaceBox gap={CONTENT_GAP.XLARGE} />

      {/* --- 섹션: 첨부파일 — `FileContainer`, DRB(07)·CDM(08) 제외 --- */}
      <section>
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            첨부파일
          </Typography>
        </Box>
        <div className="form_container">
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">파일 목록</Typography>
              </Box>
              <Box className="form_container-row-content">
                {isLoadingFiles ? (
                  <Typography variant="body2" color="text.secondary">
                    파일 목록을 불러오는 중...
                  </Typography>
                ) : isErrorFiles ? (
                  <Typography variant="body2" color="error">
                    파일 목록을 불러오는 중 오류가 발생했습니다:{" "}
                    {errorFiles instanceof Error ? errorFiles.message : "알 수 없는 오류"}
                  </Typography>
                ) : files.length > 0 ? (
                  <Box>
                    <FileContainer files={files} showDeleteButton={false} onClick={handleFileDownload} />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    등록된 파일이 없습니다.
                  </Typography>
                )}
              </Box>
            </Box>
          </Stack>
        </div>
      </section>

      <SpaceBox gap={CONTENT_GAP.XLARGE} />

      {/* --- 섹션: 진행상태 — 제출 불가 시 Alert + AgGrid `myPartner` --- */}
      <section>
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            진행상태
          </Typography>
        </Box>
        {!partnerSubmissionAllowed && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {partnerSubmissionBlockedMessage}
          </Alert>
        )}
        <div className="ag-theme-cdm w-full" style={{ maxHeight: 350, overflow: "auto" }}>
          {/*
            AgGrid key: 행·상태·등록유형·CDM맵·제출허용이 바뀌면 셀 렌더러(비고/등록유형) 재동기화
          */}
          <AgGridReact
            key={`partners-${myPartner.length}-${myPartner.map((p: any) => p.uldInstPrgrsSttsStcd).join("-")}-${myPartner.map((p: any) => normalizeUldTypeCd(p.uldTypeCd ?? p.uld_type_cd)).join("-")}-${myPartner.map((p: any) => `${p.verInfoNm ?? ""}-${p.lastUpdtYmd ?? ""}-${p.updtCycleCnt ?? ""}-${p.ptcpCmptnDt ?? ""}`).join("|")}-${cdmUploadByPtcpInstSn.size}-${registrationType}-${partnerSubmissionAllowed ? "1" : "0"}`}
            rowData={myPartner}
            columnDefs={partnerColDefs}
            context={{
              onPartnerRequest: handlePartnerRequest,
              onPartnerRefuse: handlePartnerRefuse,
              onRegister: handleRegister,
              onViewCancelReason: handleViewCancelReason,
              registrationType,
              onRegistrationTypeChange,
              partnerSubmissionAllowed,
              registeredPtcpInstSnSet,
              hasCdmUploadForPtcpInstSn,
            }}
            domLayout="autoHeight"
            headerHeight={42}
            rowHeight={undefined}
            getRowId={(params) => `${params.data.ptcpInstSn}-${params.data.pblntSn}`}
            overlayNoRowsTemplate={`<span style="padding:8px;">등록된 참여기관이 없습니다.</span>`}
          />
        </div>
      </section>

      {/* --- 관리자만: 수집현황상세 이동 + 공시시작 --- */}
      {isAdminUser && (
        <>
          <SpaceBox gap={CONTENT_GAP.SMALL} />
          <div className="flex justify-end gap-2">
            <Button variant="outlined" onClick={() => navigate(routes.CDM.UPLOAD_SUMMARY)}>
              수집현황상세
            </Button>
            <Button
              variant="contained"
              onClick={handleDisclosureStartClick}
              disabled={(() => {
                const statusCode = disclosure?.pblntStcd != null ? String(disclosure.pblntStcd) : null;
                const n = DisclosureAPI.normalizePblntStcd(statusCode);
                return n === DISCLOSURE_PBLNT_STATUS_CODE.IN_PROGRESS || n === DISCLOSURE_PBLNT_STATUS_CODE.CLOSED;
              })()}
            >
              공시시작
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
