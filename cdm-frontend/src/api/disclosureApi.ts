import type {
  DisclosureCreateApiResponse,
  DisclosureCreateRequest,
  DisclosureDetailApiResponse,
  DisclosureDetailResponse,
  //공시상세 응답
  DisclosureListApiResponse,
  DisclosureListResponse,
  DisclosurePartnerApiResponse,
  DisclosurePartnerRequest,
  DisclosureSearchRequest,
  DisclosureStatusApiResponse,
  DisclosureUpdateRequest,
} from "@/interfaces/disclosureInterface.ts";
import axios from "./axios";

const BASE_URL = "/disclosures";

/** 업로드 통계 이력 항목 (기관 CDM 업로드 이력 팝업용) */
export interface UploadStatsHistoryItem {
  uldStatsSn?: number;
  pblntSn?: number;
  ptcpInstSn?: number;
  /** 공시명 (기관별 전체 이력 조회 시 포함) */
  pblntTtlNm?: string;
  val1?:any|undefined|unknown;
  uldNocs?: number;
  errNocs?: number;
  errRt?: number;
  rgtrId?: string;
  /** 등록자명 (emp_nm 또는 encpt_mbr_flnm 조인) */
  rgtrNm?: string | null;
  regDt?: string;
}

/** 현황정보 입력 이력 항목 (기관 CDM 업로드 이력 팝업용) */
export interface StatusInfoHistoryItem {
  pblntSn?: number;
  pblntTtlNm?: string;
  regDt?: string;
  rgtrId?: string;
  /** 등록자명 (emp_nm 또는 encpt_mbr_flnm 조인) */
  rgtrNm?: string | null;
  verInfoNm?: string;
  lastUpdtYmd?: string;
  updtCycleCnt?: number | string;
}

// 상태 코드 매핑 (백엔드 코드 → 프론트엔드 표시 텍스트)
const DISCLOSURE_STATUS_MAP: Record<string, string> = {
  "1": "등록",
  "2": "진행중",
  "3": "마감",
  "01": "등록",
  "02": "진행중",
  "03": "마감",
  // 백엔드에서 사용하는 실제 코드값에 맞춰 조정 가능
};

// 구분 코드 매핑
const DISCLOSURE_TYPE_MAP: Record<string, string> = {
  "01": "정기",
  "02": "비정기",
  // 백엔드에서 사용하는 실제 코드값에 맞춰 조정 가능
};

/**
 * 서버의 상태 코드를 프론트엔드 표시용 텍스트로 변환
 */
function convertDisclosureStatus(serverCode: string | null | undefined): string {
  if (!serverCode) return "알수없음";
  return DISCLOSURE_STATUS_MAP[serverCode] || serverCode;
}

/** 공시 진행상태코드 정규화 (01 / 02 / 03). 표시는 convertStatus, 업무 분기는 이 값 사용 */
export function normalizePblntStcd(raw: string | null | undefined): string {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  return s.length === 1 ? `0${s}` : s;
}

/** 협력기관: 업로드·현황등록·참여승인 — 공시 코드 02(진행중)일 때만 허용 */
export function isPartnerSubmissionAllowed(pblntStcd: string | null | undefined): boolean {
  return normalizePblntStcd(pblntStcd) === "02";
}

export function getPartnerSubmissionBlockedMessage(pblntStcd: string | null | undefined): string {
  const n = normalizePblntStcd(pblntStcd);
  if (!n) return "공시 상태를 확인할 수 없습니다. 업로드·현황등록·참여승인을 진행할 수 없습니다.";
  if (n === "02") return "";
  if (n === "03") return "마감된 공시에서는 업로드·현황등록·참여승인을 진행할 수 없습니다.";
  if (n === "01") return "관리자가 공시를 시작한 후에만 업로드·현황등록·참여승인을 진행할 수 있습니다.";
  return "이 공시에서는 업로드·현황등록·참여승인을 진행할 수 없습니다.";
}

/**
 * 서버의 구분 코드를 프론트엔드 표시용 텍스트로 변환 (01=정기, 02=비정기)
 */
function convertDisclosureType(serverCode: string | null | undefined): string {
  const code = typeof serverCode === "string" ? serverCode.trim() : "";
  if (!code) return "";
  // "1" -> "01", "2" -> "02" 등 정규화
  const normalized = code.length === 1 ? `0${code}` : code;
  return DISCLOSURE_TYPE_MAP[normalized] ?? "";
}

/**
 * 프론트엔드 표시용 텍스트를 서버 코드값으로 변환
 */
function convertTextToDisclosureType(text: string | null | undefined): string {
  if (!text) return "02"; // 기본값: 비정기
  // 역매핑: 텍스트 → 코드
  const reverseMap: Record<string, string> = {
    정기: "01",
    비정기: "02",
  };
  return reverseMap[text] || text; // 이미 코드값이면 그대로 반환
}

/**
 * DisclosureListResponse의 상태 코드를 변환
 */
function transformDisclosureListResponse(response: DisclosureListResponse): DisclosureListResponse {
  return {
    ...response,
    // 상태 코드는 변환하지 않고 그대로 유지 (필요시 변환 함수 사용)
  };
}

/**
 * DisclosureDetailResponse의 상태 코드를 변환
 */
function transformDisclosureDetailResponse(response: DisclosureDetailResponse): DisclosureDetailResponse {
  return {
    ...response,
    // 상태 코드는 변환하지 않고 그대로 유지 (필요시 변환 함수 사용)
  };
}

export const DisclosureAPI = {
  // =====================================
  // 공시: 게시글 관리
  // =====================================

  /**
   * 공시 목록 조회
   * @param params 검색 조건 (pblntDvcd, pblntBgngYmd, pblntEndYmd, keyword, page, length)
   * @returns 공시 목록
   */
  getDisclosures: async (params?: DisclosureSearchRequest) => {
    const response = await axios.get<DisclosureListApiResponse>(BASE_URL, {
      params,
      paramsSerializer: (p) => {
        const search = new URLSearchParams();
        Object.entries(p).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => search.append(key, String(v)));
          } else if (value !== undefined && value !== null && value !== "") {
            search.append(key, String(value));
          }
        });
        return search.toString();
      },
    });
    // 서버 코드를 프론트엔드 코드로 변환
    if (response.data.data) {
      return {
        ...response,
        data: {
          ...response.data,
          data: response.data.data.map(transformDisclosureListResponse),
        },
      };
    }
    return response;
  },

  /**
   * 공시 상세 조회
   * @param id 공시일련번호 (pblntSn)
   * @returns 공시 상세 정보
   */
  getDisclosureById: async (id: number) => {
    const response = await axios.get<DisclosureDetailApiResponse>(`${BASE_URL}/${id}`);
    // 서버 코드를 프론트엔드 코드로 변환
    if (response.data?.data) {
      return {
        ...response,
        data: {
          ...response.data,
          data: transformDisclosureDetailResponse(response.data.data),
        },
      };
    }
    return response;
  },

  /**
   * 공시 등록
   * @param payload 생성 요청 데이터
   * @returns 생성된 공시의 pblntSn
   */
  createDisclosure: (payload: DisclosureCreateRequest) => axios.post<DisclosureCreateApiResponse>(BASE_URL, payload),

  /**
   * 공시 수정
   * @param id 공시일련번호 (pblntSn)
   * @param payload 수정 요청 데이터
   */
  updateDisclosure: (id: number, payload: DisclosureUpdateRequest) => axios.put<void>(`${BASE_URL}/${id}`, payload),

  /**
   * 공시 삭제
   * @param id 공시일련번호 (pblntSn)
   */
  deleteDisclosure: (id: number) => axios.delete<void>(`${BASE_URL}/${id}`),

  /**
   * 공시에 업로드된 파일 목록 조회
   * @param pblntSn 공시일련번호
   * @param ptcpInstSn 참여기관일련번호 (null/undefined이면 전체 기관 파일 조회)
   * @returns 파일 목록
   */
  getFilesByPblntSn: async (pblntSn: number, ptcpInstSn?: number | null) => {
    const params: Record<string, unknown> = {};
    if (ptcpInstSn != null) {
      params.ptcpInstSn = ptcpInstSn;
    }
    const response = await axios.get<{
      status: string;
      message: string;
      data: Array<{
        pstSn: number;
        atchFileSn: string;
        atchFileId?: string;
        strgFileNm?: string | null;
        fileSz?: number | null;
        fileSeq?: number | null;
        uldTaskSeCd: string;
        fileSeCd: string;
        ptcpInstSn: number | null;
        delYn: string | null;
        rgtrId: string | null;
        regDt: string;
        regPrgmId: string | null;
        mdfrId: string | null;
        mdfcnDt: string | null;
        mdfcnPrgmId: string | null;
      }>;
    }>(`${BASE_URL}/${pblntSn}/files`, { params });
    return response;
  },

  /**
   * 파일 업로드
   * @param pblntSn 공시일련번호
   * @param files 업로드할 파일들
   * @param fileSeCd 파일구분코드 (01:IRB, 06:공시등록, 07:DRB, 08:CDM, 기본값: 08)
   * @param ptcpInstSn 참여기관일련번호 (기관별 파일 구분용, 선택)
   */
  uploadFiles: async (pblntSn: number, files: File[], fileSeCd: string = "08", ptcpInstSn?: number | null) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("fileSeCd", fileSeCd);
    if (ptcpInstSn != null) {
      formData.append("ptcpInstSn", String(ptcpInstSn));
    }

    const response = await axios.post<{
      status: string;
      message: string;
      data: string[];
    }>(`${BASE_URL}/${pblntSn}/files`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  },

  /**
   * CSV/TSV 임시 업로드 (CDM 검증용)
   * @param pblntSn 공시일련번호
   * @param files 업로드할 파일들
   * @param fileSeCd 파일구분코드 (기본값: 08)
   * @param ptcpInstSn 참여기관일련번호 (선택)
   */
  uploadCsvTmp: async (pblntSn: number, files: File[], fileSeCd: string = "08", ptcpInstSn?: number | null) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("pblntSn", String(pblntSn));
    formData.append("fileSeCd", fileSeCd);
    if (ptcpInstSn != null) {
      formData.append("ptcpInstSn", String(ptcpInstSn));
    }

    const response = await axios.post<{
      status: string;
      message: string;
      data: Array<{
        originalFilename: string;
        storedFilename: string;
        absolutePath: string;
        atchFileGroupId: string;
      }>;
    }>(`${BASE_URL}/files/csv-tmp`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  },

  /**
   * 파일 다운로드
   * @param atchFileSn 첨부파일일련번호
   */
  downloadFile: async (atchFileSn: string) => {
    const response = await axios.get(`${BASE_URL}/files/download?atchFileSn=${encodeURIComponent(atchFileSn)}`, {
      responseType: "blob",
    });
    return response;
  },

  /**
   * 파일 삭제 (atchFileId = UUID, path variable)
   * @param pblntSn 공시일련번호
   * @param atchFileId 첨부파일ID(UUID)
   */
  deleteFile: async (pblntSn: number, atchFileId: string) => {
    const encoded = encodeURIComponent(atchFileId);
    const response = await axios.delete(`${BASE_URL}/${pblntSn}/files/${encoded}`);
    return response;
  },

  // =====================================
  // 참여기관 관리
  // =====================================

  /**
   * 공시의 참여기관 목록 조회
   * @param pblntSn 공시일련번호
   * @returns 참여기관 목록
   */
  getPartnersByPblntSn: async (pblntSn: number) => {
    const response = await axios.get<DisclosurePartnerApiResponse>(`${BASE_URL}/${pblntSn}/partners`);
    return response;
  },

  /**
   * 다른 진행중 공시에 이미 배정된 기관 식별값(inst_id/brno) 목록 — 참여기관 선택 모달에서 선택 차단용
   */
  getPartnerPickerBusyInstIds: async (pblntSn: number) => {
    const response = await axios.get<{ status?: string; message?: string; data: string[] }>(
      `${BASE_URL}/${pblntSn}/partners/busy-inst-ids`
    );
    return response;
  },

  /**
   * 참여기관 추가
   * @param pblntSn 공시일련번호
   * @param request 참여기관 요청
   */
  addPartners: async (pblntSn: number, request: DisclosurePartnerRequest) => {
    const response = await axios.post<void>(`${BASE_URL}/${pblntSn}/partners`, request);
    return response;
  },

  /**
   * 참여기관 삭제
   * @param pblntSn 공시일련번호
   * @param ptcpInstSn 참여기관번호
   */
  deletePartner: async (pblntSn: number, ptcpInstSn: number) => {
    const response = await axios.delete<void>(`${BASE_URL}/${pblntSn}/partners/${ptcpInstSn}`);
    return response;
  },

  /**
   * 참여요청/참여확정 처리
   * @param pblntSn 공시번호
   * @param ptcpInstSn 참여기관번호
   * @param status 상태코드 (기본값: "02" - 참여확정)
   * @param reason 취소사유 (상태가 "04"일 때만 사용)
   */
  requestPartnerStatus: async (pblntSn: number, ptcpInstSn: number, status?: string, reason?: string) => {
    const response = await axios.post<void>(`${BASE_URL}/${pblntSn}/partners/request`, {
      ptcpInstSn,
      status: status || "02", // 기본값: 참여확정
      reason: reason, // 취소사유 (상태가 "04"일 때만 사용)
    });
    return response;
  },

  /**
   * 참여기관 진행상태 조회
   * @param pblntSn 공시일련번호
   * @param ptcpInstSn 참여기관번호
   */
  getPartnerStatus: async (pblntSn: number, ptcpInstSn: number) => {
    const response = await axios.get(`${BASE_URL}/${pblntSn}/partners/status`, {
      params: { ptcpInstSn },
    });
    return response;
  },

  /**
   * 참여취소 사유 조회
   * @param pblntSn 공시일련번호
   * @param ptcpInstSn 참여기관번호
   */
  getCancelReason: async (pblntSn: number, ptcpInstSn: number) => {
    const response = await axios.get(`${BASE_URL}/${pblntSn}/partners/${ptcpInstSn}/cancel-reason`);
    return response;
  },

  /**
   * 참여취소 사유 업데이트
   * @param pblntSn 공시일련번호
   * @param ptcpInstSn 참여기관번호
   * @param cancelReason 취소사유
   */
  updateCancelReason: async (pblntSn: number, ptcpInstSn: number, cancelReason: string) => {
    const response = await axios.post(`${BASE_URL}/${pblntSn}/partners/${ptcpInstSn}/cancel-reason/update`, {
      cancelReason,
    });
    return response;
  },

  /**
   * 공시 진행 상태 코드만 조회 (관리자 또는 해당 공시 참여기관)
   * @param pblntSn 공시일련번호
   */
  getDisclosureStatus: async (pblntSn: number) => {
    const response = await axios.get<DisclosureStatusApiResponse>(`${BASE_URL}/${pblntSn}/status`);
    return response;
  },

  /**
   * 공시 상태 변경
   * @param pblntSn 공시일련번호
   * @param pblntStcd 공시진행상태코드 ("01": 등록, "02": 진행중, "03": 마감)
   */
  updateDisclosureStatus: async (pblntSn: number, pblntStcd: string) => {
    const response = await axios.post(`${BASE_URL}/${pblntSn}/status`, {
      pblntPrgrsSttsCd: pblntStcd,
    });
    return response;
  },

  /**
   * 공시 마감:
   * - 미등록(05=등록 이외) 참여기관을 모두 참여취소(04)로 전환
   * - 취소사유는 서버에서 "마감에 의한 취소"로 기록
   */
  closeDisclosure: async (pblntSn: number) => {
    const response = await axios.post(`${BASE_URL}/${pblntSn}/close`);
    return response;
  },

  /**
   * 모든 참여기관 완료 확인 및 공시 상태 완료로 업데이트
   * @param pblntSn 공시일련번호
   * @returns 완료 체크 결과 및 상태 업데이트 정보
   */
  checkAndCompleteDisclosure: async (pblntSn: number) => {
    const response = await axios.post(`${BASE_URL}/${pblntSn}/check-and-complete`);
    return response;
  },

  // =====================================
  // 유틸리티 함수
  // =====================================

  /**
   * 상태 코드를 표시용 텍스트로 변환
   */
  convertStatus: convertDisclosureStatus,

  normalizePblntStcd,

  isPartnerSubmissionAllowed,

  getPartnerSubmissionBlockedMessage,

  /**
   * 구분 코드를 표시용 텍스트로 변환
   */
  convertType: convertDisclosureType,

  /**
   * 텍스트를 구분 코드로 변환
   */
  convertTextToType: convertTextToDisclosureType,

  /**
   * 업로드 확정
   * @param pblntSn 공시일련번호
   * @param ptcpInstSn 참여기관일련번호
   */
  confirmUploadStats: async (pblntSn: number, ptcpInstSn: number) => {
    const response = await axios.post<void>(`${BASE_URL}/${pblntSn}/upload-stats/confirm`, {
      ptcpInstSn,
    });
    return response;
  },

  /**
   * 업로드 통계 조회
   * @param pblntSn 공시일련번호
   * @param ptcpInstSn 참여기관일련번호 (선택)
   * @returns 업로드 통계 정보
   */
  getUploadStats: async (pblntSn: number, ptcpInstSn?: number | null) => {
    const params = ptcpInstSn ? { ptcpInstSn } : {};
    const response = await axios.get(`${BASE_URL}/${pblntSn}/upload-stats`, { params });
    return response;
  },

  /**
   * 일관성(필드명) 상세: 기대 필드 대비 CSV 헤더 불일치·일치 목록
   */
  getConsistencyHeaderDetail: async (pblntSn: number, ptcpInstSn: number, errTblNm: string) => {
    const response = await axios.get<{
      data: {
        data: {
          missingFields?: string[];
          matchedFields?: string[];
          referenceFields?: string[];
          errTblNm?: string;
          slotKey?: string;
          error?: string;
        };
      };
    }>(`${BASE_URL}/${pblntSn}/consistency-header-detail`, {
      params: { ptcpInstSn, errTblNm },
    });
    return response;
  },

  /**
   * 업로드 통계 이력 목록 조회 (기관 CDM 업로드 이력 팝업용, 특정 공시 기준)
   */
  getUploadStatsHistory: async (pblntSn: number, ptcpInstSn?: number | null) => {
    const params = ptcpInstSn != null ? { ptcpInstSn } : {};
    const response = await axios.get<{ data: { data: UploadStatsHistoryItem[] } }>(
      `${BASE_URL}/${pblntSn}/upload-stats/history`,
      { params }
    );
    return response;
  },

  /**
   * 기관별 업로드 통계 이력 전체 목록 조회 (참여기관 기준, 모든 공시 포함·삭제된 공시 포함)
   * @param ptcpInstSn 참여기관일련번호
   * @param pblntSn 공시일련번호 (선택, 있으면 해당 공시 기준으로 기관 검증하여 동일 ptcp_inst_sn 다른 공시 기관과 구분)
   */
  getUploadStatsHistoryByPartner: async (ptcpInstSn: number, pblntSn?: number | null) => {
    const params = pblntSn != null ? { pblntSn } : {};
    const response = await axios.get<{ data: { data: UploadStatsHistoryItem[] } }>(
      `${BASE_URL}/partners/${ptcpInstSn}/upload-stats/history`,
      { params }
    );
    return response;
  },

  /**
   * 업로드 카탈로그 조회
   * @param pblntSn 공시일련번호
   * @param ptcpInstSn 참여기관일련번호 (선택, null이면 NULL인 카탈로그도 조회)
   * @param tblSeCd 테이블구분코드 (선택, 예: "01"=Demographic, "02"=Dispensing)
   * @returns 카탈로그 목록
   */
  getCatalog: async (pblntSn: number, ptcpInstSn?: number | null, tblSeCd?: string | null) => {
    const params: any = {};
    // ptcpInstSn이 명시적으로 전달된 경우에만 파라미터에 포함 (null이면 NULL인 카탈로그도 조회)
    if (ptcpInstSn !== undefined && ptcpInstSn !== null) {
      params.ptcpInstSn = ptcpInstSn;
    }
    if (tblSeCd) params.tblSeCd = tblSeCd;
    const response = await axios.get(`${BASE_URL}/${pblntSn}/catalog`, { params });
    return response;
  },

  /**
   * 참여기관 정보 저장 (CDM 현황정보, 기간&규모, 카탈로그)
   * @param pblntSn 공시일련번호
   * @param ptcpInstSn 참여기관일련번호
   * @param data 저장할 데이터
   */
  savePartnerInformation: async (
    pblntSn: number,
    ptcpInstSn: number,
    data: {
      verInfoNm?: string;
      lastUpdtYmd?: string;
      updtCycleCnt?: number;
      periodScaleList?: Array<{
        trsfSeCd: string;
        tblSeCd: string;
        tblNm: string;
        tnocs?: number;
        bgngYmd?: string;
        endYmd?: string;
      }>;
      catalogList?: Array<{
        tblSeCd: string;
        colNm: string;
        dataTypeCd?: string;
        nullYn?: string;
        pkYn?: string;
        fkYn?: string;
      }>;
    }
  ) => {
    const response = await axios.post(`${BASE_URL}/${pblntSn}/partners/${ptcpInstSn}/information`, data);
    return response;
  },

  /**
   * 참여기관 정보 조회 (CDM 현황정보, 기간&규모, 카탈로그)
   * @param pblntSn 공시일련번호
   * @param ptcpInstSn 참여기관일련번호
   */
  getPartnerInformation: async (pblntSn: number, ptcpInstSn: number) => {
    const response = await axios.get(`${BASE_URL}/${pblntSn}/partners/${ptcpInstSn}/information`);
    return response;
  },

  /** TB_CM_M_ULD_PRST.uld_prgrs_yn — 백그라운드 업로드/검증 진행 Y/N */
  getUldPrgrsYn: async (pblntSn: number, ptcpInstSn: number) => {
    const response = await axios.get<{ data: { uldPrgrsYn: string } }>(
      `${BASE_URL}/${pblntSn}/partners/${ptcpInstSn}/uld-prgrs-yn`
    );
    return response;
  },

  /** 업로드 진행 플래그 강제 N (재로그인 후 UI·DB 불일치 시) */
  clearUldPrgrsYn: async (pblntSn: number, ptcpInstSn: number) => {
    const response = await axios.post(`${BASE_URL}/${pblntSn}/partners/${ptcpInstSn}/uld-prgrs-yn/clear`);
    return response;
  },

  /**
   * 현황정보 입력 이력 목록 조회 (기관 CDM 업로드 이력 팝업용, 공시 종료 포함)
   */
  getStatusInfoHistory: async (pblntSn: number, ptcpInstSn: number) => {
    const response = await axios.get<{ data: { data: StatusInfoHistoryItem[] } }>(
      `${BASE_URL}/${pblntSn}/partners/${ptcpInstSn}/status-info-history`
    );
    return response;
  },

  /**
   * 재업로드: 해당 공시·기관의 업로드 내역(통계·파일) 전체 초기화
   */
  resetUploadData: async (pblntSn: number, ptcpInstSn: number) => {
    const response = await axios.post(`${BASE_URL}/${pblntSn}/reset-upload`, null, {
      params: { ptcpInstSn },
    });
    return response;
  },

  /**
   * CDM 검증 시작 (비동기)
   * @returns taskId
   */
  cdmValidate: async (
    pblntSn: number,
    body: {
      ptcpInstSn?: number | null;
      tables: Array<{ tableName: string; storedName: string }>;
      /** 업로드한 파일 총 용량(바이트). 결과 화면 용량 표시용 */
      totalUploadBytes?: number | null;
    }
  ) => {
    const response = await axios.post<{ status: string; message: string; data: { taskId: string } }>(
      `${BASE_URL}/${pblntSn}/cdm-validate`,
      body
    );
    return response;
  },

  /**
   * CDM 검증 진행상태 조회
   */
  cdmValidateStatus: async (pblntSn: number, taskId: string) => {
    const response = await axios.get<{
      status: string;
      message: string;
      data: {
        taskId: string;
        status: string;
        currentTable: string | null;
        completedCount: number;
        totalCount: number;
        startTimeMs: number;
        elapsedMs: number;
        estimatedRemainingMs: number;
        errorMessage: string | null;
        results: Array<{ tableName: string; totalRows: number; errorCount: number; errorRate: number }>;
      };
    }>(`${BASE_URL}/${pblntSn}/cdm-validate/status`, { params: { taskId } });
    return response;
  },

  /**
   * Plot 통계 데이터 조회
   * @param plotId 규칙 ID (1~32)
   * @param instTaskSn 기관업무일련번호 (선택)
   * @param conceptId ConceptId (필터 쿼리에서 필수)
   * @param includeDescendant descendant 포함 여부
   * @param minLevels concept_ancestor min_levels_of_separation 최소값 (선택)
   */
  getPlotData: async (
    plotId: number,
    instTaskSn?: number | null,
    conceptId?: number | null,
    includeDescendant?: boolean,
    minLevels?: number | null,
  ) => {
    const params: Record<string, unknown> = { plotId };
    if (instTaskSn != null) params.instTaskSn = instTaskSn;
    if (conceptId != null) params.conceptId = conceptId;
    if (includeDescendant != null) params.includeDescendant = includeDescendant;
    if (minLevels != null) params.minLevels = minLevels;
    const response = await axios.get<{
      status: string;
      message: string;
      data: {
        plotId: number;
        plotType: string;
        totalCount?: number;
        data?: Array<{ label: string; cnt: number }>;
      };
    }>("/plot", { params });
    return response;
  },

  /**
   * Concept ID → concept_name 조회
   * @param conceptId OMOP concept_id
   */
  getConceptName: async (conceptId: number) => {
    const response = await axios.get<{
      status: string;
      message: string;
      data: { conceptId: number; conceptName: string };
    }>("/plot/concept", { params: { conceptId } });
    return response;
  },
};
