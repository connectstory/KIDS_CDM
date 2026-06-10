import type { ApiResponse } from "./commonInterface.ts";

// Backend API Response Types
export interface DisclosureListResponse {
  pblntSn: number; // 공시일련번호
  pblntDvcd: string | null; // 공시구분코드
  ttlNm: string | null; // 제목명
  pblntBgngYmd: string | null; // 공시시작일자 (YYYYMMDD)
  pblntEndYmd: string | null; // 공시종료일자 (YYYYMMDD)
  pblntStcd: string | null; // 공시진행상태코드
  rgtrId: string | null; // 등록자아이디 (사번)
  rgtrNm?: string | null; // 등록자명 (tb_pp_m_emp_info 조인)
  regYmd: string; // 등록일자 (ISO 8601 format)
  completedPartnersCount?: number; // 등록한 기관 수(파일·현황 등 임의 형태 1회 이상 등록)
  totalPartnersCount?: number; // 전체 대상 기관 수(참여취소·삭제 제외)
  /** 파트너 목록 (TB_CM_M_ULD_PRST.uld_inst_prgrs_stts_cd) */
  uldInstPrgrsSttsCd?: string | null;
  /** 파트너 목록 (TB_CM_M_ULD_PRST.uld_type_cd) */
  uldTypeCd?: string | null;
  /** Jackson snake 등으로 올 때 대비 (선택) */
  uld_inst_prgrs_stts_cd?: string | null;
  uld_type_cd?: string | null;
}

/** 파트너 공시 목록 그리드 행 (목록 API + 기간 셀 묶음) */
export type DisclosureListPartnerGridRow = Pick<
  DisclosureListResponse,
  "pblntSn" | "pblntDvcd" | "ttlNm" | "pblntStcd" | "rgtrId" | "rgtrNm"
> & {
  period: Pick<DisclosureListResponse, "pblntBgngYmd" | "pblntEndYmd">;
  uldTypeCd: string | null;
  uldInstPrgrsSttsCd: string | null;
};

export interface DisclosureDetailResponse {
  pblntSn: number; // 공시일련번호
  pblntDvcd: string | null; // 공시구분코드 (API 응답 키)
  pblntSeCd?: string | null; // 공시구분코드 (백엔드 필드명으로 올 수 있음)
  ttlNm: string | null; // 제목명
  pblntCn: string | null; // 공시내용
  pblntBgngYmd: string | null; // 공시시작일자 (YYYYMMDD)
  pblntEndYmd: string | null; // 공시종료일자 (YYYYMMDD)
  pblntStcd: string | null; // 공시진행상태코드
  rgtrId: string | null; // 등록자아이디 (계정)
  rgtrNm?: string | null; // 등록자명 (tb_pp_m_emp_info 조인)
  regYmd: string; // 등록일자 (ISO 8601 format)
  mdfrId: string | null; // 수정자아이디
  mdfcnYmd: string | null; // 수정일자 (ISO 8601 format)
}

export interface DisclosureCreateRequest {
  pblntDvcd: string; // 공시구분코드
  ttlNm: string; // 제목명
  pblntCn: string; // 공시내용
  pblntBgngYmd: string; // 공시시작일자 (YYYYMMDD)
  pblntEndYmd: string; // 공시종료일자 (YYYYMMDD)
  pblntStcd?: string; // 공시진행상태코드 (선택)
  instIdList?: string[]; // 기관아이디 목록 (참여기관)
}

export interface DisclosureUpdateRequest {
  pblntDvcd: string; // 공시구분코드
  ttlNm: string; // 제목명
  pblntCn: string; // 공시내용
  pblntBgngYmd: string; // 공시시작일자 (YYYYMMDD)
  pblntEndYmd: string; // 공시종료일자 (YYYYMMDD)
  pblntStcd: string; // 공시진행상태코드
  instIdList?: string[]; // 기관아이디 목록 (참여기관)
}

export interface DisclosureSearchRequest {
  pblntDvcd?: string; // 공시구분코드
  pblntStcd?: string; // 공시진행상태코드 (01=등록, 02=진행중, 03=마감)
  uldPrgrSttsCd?: string; // 업로드기관진행상태코드 (01=참여요청, 02=진행중, 03=완료, 04=참여취소, 05=등록, 06=참여재요청, 07=등록재요청)
  pblntBgngYmd?: string; // 공시시작일자 (YYYYMMDD)
  pblntEndYmd?: string; // 공시종료일자 (YYYYMMDD)
  keyword?: string; // 검색어 (제목 또는 내용 검색용)
  searchType?: string; // 검색 타입: "title", "content", "both"
  instIdList?: string[]; // 참여기관 ID 목록
  page?: number; // 페이지 번호 (1부터 시작, 기본값: 1)
  length?: number; // 페이지당 항목 수 (기본값: 10)
}

export interface DisclosureCreateResponse {
  pblntSn: number; // 생성된 공시일련번호
}

// =====================================
// API Response Wrapper Types
// 서버 응답 형식: { status, message, data, page, length, total }
// =====================================
export type DisclosureListApiResponse = ApiResponse<DisclosureListResponse[]> & {
  page?: number;
  length?: number;
  total?: number;
};

export type DisclosureDetailApiResponse = ApiResponse<DisclosureDetailResponse>;
export type DisclosureCreateApiResponse = ApiResponse<DisclosureCreateResponse>;

// 참여기관 관련 인터페이스
export interface DisclosurePartnerResponse {
  ptcpInstSn: number; // 참여기관번호
  ptcp_inst_sn?: number; // API snake_case 대응
  pblntSn: number; // 공시일련번호
  instId: string; // 기관아이디
  inst_id?: string; // API snake_case 대응
  brno?: string; // 사업자등록번호 (instId 대체)
  instNm: string; // 기관명
  uldInstPrgrsSttsStcd: string | null; // 업로드기관진행상태코드
  ptcpDmndDt: string | null; // 참여요청일시
  ptcpCfmtnDt: string | null; // 참여확정일시
  ptcpRtrcnDt: string | null; // 참여취소일시
  ptcpRegDt: string | null; // 참여등록일시
  ptcpCmptnDt: string | null; // 참여완료일시
  ptcpRdmndDt: string | null; // 참여재요청일시
  uldTypeCd: string | null; // 업로드유형코드
  uldDt: string | null; // 업로드일시
  verInfoNm: string | null; // 버전정보명
  lastUpdtYmd: string | null; // 최종갱신일자
  regDt: string | null; // 등록일자 (TB_CM_M_ULD_PRST.reg_dt)
  updtCycleCnt: number | null; // 갱신주기수
  /** 논리삭제 Y면 집계·등록완료 판정에서 제외 */
  delYn?: string | null;
}

export interface DisclosurePartnerRequest {
  instIds: string[]; // 기관아이디 목록
}

export type DisclosurePartnerApiResponse = ApiResponse<DisclosurePartnerResponse[]>;
