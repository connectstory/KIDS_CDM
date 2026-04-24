// src/communityApi.ts
import type { BoardItem, FaqItem, AsmtPrpItem } from "@/interfaces/communityInterface";
/* =========================
 * TaskProposal (과제제안 / asmtprp) API
 * ========================= */
import axios from "@/api/axios";

/* =========================
 * 타입
 * ========================= */
export type FetchBoardListParams = {
  bbsId: string;
  page: number;
  pageSize: string;
  searchType?: string;
  searchKeyword?: string;
};

export type FetchBoardListResponse = {
  list: BoardItem[];
  totalCount: number;
};

export type FetchBoardDetailParams = {
  bbsId: string;
  pstSn: string;
};

export type InsertBoardParams = FormData;

export type UpdateBoardParams = FormData;

export type DeleteBoardParams = {
  bbsId: string;
  pstSn: string;
};

/* =========================
 * BoardListView 공통 API (Admin/Member)
 * ========================= */
export const fetchBoardList = (params: FetchBoardListParams): Promise<FetchBoardListResponse> => {
  return axios.get("/community/board/selectList", { params }).then((res) => {
    return {
      list: res.data?.data || [],
      totalCount: res.data?.total || 0,
    };
  });
};

/* =========================
 * AdminBoardWriteView 전용 API
 * ========================= */
export const fetchBoardDetail = (params: FetchBoardDetailParams): Promise<BoardItem> => {
  return axios.get("/community/board/selectDetail", { params }).then((res) => res.data?.data);
};

export const insertBoard = (formData: InsertBoardParams): Promise<any> => {
  return axios
    .post("/community/board/insertBoard", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data?.data);
};

export const updateBoard = (formData: UpdateBoardParams): Promise<any> => {
  return axios
    .put("/community/board/updateBoard", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data?.data);
};

/* =========================
 * AdminBoardDetailView 전용 API
 * ========================= */
export const deleteBoard = (params: DeleteBoardParams): Promise<any> => {
  return axios.delete("/community/board/deleteBoard", { params }).then((res) => res.data?.data);
};

/* =========================
 * MemberBoardDetailView 전용 API
 * ========================= */
export type IncreaseViewCountParams = {
  pstSn: string;
};

export const increaseViewCount = (params: IncreaseViewCountParams): Promise<any> => {
  return axios.post("/community/board/increaseViewCount", null, { params }).then((res) => res.data?.data);
};

/* =========================
 * FAQ API
 * ========================= */
export type FetchFaqListParams = {
  page: number;
  pageSize: string;
  faqSeCd?: string;
  searchType?: string;
  searchKeyword?: string;
};

export type FetchFaqListResponse = {
  list: FaqItem[];
  totalCount: number;
};

export const fetchFaqList = (params: FetchFaqListParams): Promise<FetchFaqListResponse> => {
  return axios.get("/community/faq/selectList", { params }).then((res) => {
    return {
      list: res.data?.data || [],
      totalCount: res.data?.total || 0,
    };
  });
};

export const fetchFaqDetail = (faqSn: string): Promise<FaqItem> => {
  return axios
    .get("/community/faq/selectDetail", {
      params: { bbsId: "faq", faqSn },
    })
    .then((res) => res.data?.data);
};

export const insertFaq = (formData: FormData) => {
  return axios.post("/community/faq/insertFaq", formData).then((res) => res.data?.data);
};

export const updateFaq = (formData: FormData) => {
  return axios.put("/community/faq/updateFaq", formData).then((res) => res.data?.data);
};

export const deleteFaq = (faqSn: string) => {
  return axios
    .delete("/community/faq/deleteFaq", {
      params: { bbsId: "faq", faqSn },
    })
    .then((res) => res.data?.data);
};

export const increaseFaqViewCount = (faqSn: string) => {
  return axios
    .post("/community/faq/increaseViewCount", null, {
      params: { faqSn },
    })
    .then((res) => res.data?.data);
};

/* =========================
 * QNA API
 * ========================= */
export type FetchQnaListParams = {
  bbsId?: string;
  page: number;
  pageSize: string;
  searchType?: string;
  searchKeyword?: string;
  qstnPrgrsSttsCd?: string;
  searchAll?: boolean;
  loginId?: string;
};

export type FetchQnaListResponse = {
  list: any[];
  totalCount: number;
};

export const fetchQnaList = (params: FetchQnaListParams): Promise<FetchQnaListResponse> => {
  return axios.get("/community/qna/selectList", { params }).then((res) => {
    return {
      list: res.data?.data || [],
      totalCount: res.data?.total || 0,
    };
  });
};

export const fetchQnaDetail = (qstnSn: string, bbsId?: string) => {
  return axios
    .get("/community/qna/selectDetail", {
      params: { qstnSn, bbsId },
    })
    .then((res) => res.data?.data);
};

export const insertQna = (formData: FormData) => {
  return axios.post("/community/qna/insertQna", formData).then((res) => res.data?.data);
};

export const insertQnaAnswer = (formData: FormData) => {
  return axios.post("/community/qna/insertAnswer", formData).then((res) => res.data?.data);
};

export const deleteQna = (params: { ansSn?: number; qstnSn: string }) => {
  return axios
    .delete("/community/qna/deleteQna", {
      data: params,
    })
    .then((res) => res.data?.data);
};

export const fetchQnaAnswer = (qstnSn: string) => {
  return axios
    .get("/community/qna/selectAnswer", {
      params: { qstnSn },
    })
    .then((res) => res.data?.data);
};

export const deleteQnaAnswer = (params: { ansSn: string; qstnSn: string }) => {
  return axios
    .delete("/community/qna/deleteAnswer", {
      data: params,
    })
    .then((res) => res.data?.data);
};

export const updateQnaAnswer = (formData: FormData) => {
  return axios.put("/community/qna/updateAnswer", formData).then((res) => res.data?.data);
};

export const increaseQnaViewCount = (qstnSn: string) => {
  return axios
    .post("/community/qna/increaseViewCount", null, {
      params: { qstnSn },
    })
    .then((res) => res.data?.data);
};

export const checkQnaPassword = (qstnSn: number, password: string) => {
  const params = new URLSearchParams();
  params.append("qstnSn", String(qstnSn));
  params.append("pstEnpswd", password);

  return axios
    .post("/community/qna/checkPassword", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .then((res) => res.data?.data);
};

export const updateQna = (formData: FormData) => {
  return axios.put("/community/qna/updateQna", formData).then((res) => res.data?.data);
};

/* 리스트 */
export type FetchAsmtPrpListParams = {
  page: number;
  pageSize: string;
  searchType?: string;
  searchKeyword?: string;
  asmtPrpAnsSttsCd?: string;
  searchAll?: boolean;
  loginId?: string;
};

export type FetchAsmtPrpListResponse = {
  list: AsmtPrpItem[];
  totalCount: number;
};

export const fetchAsmtPrpList = (params: FetchAsmtPrpListParams): Promise<FetchAsmtPrpListResponse> => {
  return axios.get("/community/asmtprp/selectList", { params }).then((res) => {
    return {
      list: res.data?.data || [],
      totalCount: res.data?.total || 0,
    };
  });
};

/* 상세 */
export const fetchAsmtPrpDetail = (asmtPrpSn: string): Promise<AsmtPrpItem> => {
  return axios
    .get("/community/asmtprp/selectDetail", {
      params: { asmtPrpSn },
    })
    .then((res) => res.data?.data);
};

/* 조회수 증가 */
export const increaseAsmtPrpViewCount = (asmtPrpSn: string) => {
  return axios
    .post("/community/asmtprp/increaseViewCount", null, {
      params: { asmtPrpSn },
    })
    .then((res) => res.data?.data);
};

/* 등록 */
export const insertAsmtPrp = (formData: FormData) => {
  return axios
    .post("/community/asmtprp/insertAsmtPrp", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data?.data);
};

/* 수정 */
export const updateAsmtPrp = (formData: FormData) => {
  return axios
    .put("/community/asmtprp/updateAsmtPrp", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data?.data);
};

/* 삭제 */
export const deleteAsmtPrp = (params: { asmtPrpSn: string; ansSn?: string }) => {
  return axios.delete("/community/asmtprp/deleteAsmtPrp", {
    params,
  });
};

/* 답변 조회 */
export const fetchAsmtPrpAnswer = (asmtPrpSn: string) => {
  return axios
    .get("/community/asmtprp/selectAnswer", {
      params: { asmtPrpSn },
    })
    .then((res) => res.data?.data);
};

/* 답변 등록 */
export const insertAsmtPrpAnswer = (formData: FormData) => {
  return axios
    .post("/community/asmtprp/insertAnswer", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data?.data);
};

/* 답변 수정 */
export const updateAsmtPrpAnswer = (formData: FormData) => {
  return axios.put("/community/asmtprp/updateAnswer", formData).then((res) => res.data?.data);
};

/* 답변 삭제 */
export const deleteAsmtPrpAnswer = (ansSn: number) => {
  return axios
    .delete("/community/asmtprp/deleteAnswer", {
      params: { ansSn }, // ✅ 여기로 바꿔야 함
    })
    .then((res) => res.data?.data);
};

/* 비공개 비밀번호 체크 */
export const checkAsmtPrpPassword = (asmtPrpSn: string, password: string) => {
  const params = new URLSearchParams();
  params.append("asmtPrpSn", asmtPrpSn);
  params.append("pstEnpswd", password);

  return axios
    .post("/community/asmtprp/checkPassword", params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .then((res) => res.data?.data);
};

/* =========================
 * Content (CMS 컨텐츠 / conts) API
 * ========================= */
export type FetchContentListParams = {
  bbsId: string;
  page: number;
  pageSize: string;
};

export type ContentRevision = {
  rvsnNo: string;
  rgtrId: string;
  rlsYn: "Y" | "N";
  regDt: string;
};

export type FetchContentListResponse = {
  list: ContentRevision[];
  totalCount: number;
};

/* 리비전 목록 */
export const fetchContentList = (params: FetchContentListParams): Promise<FetchContentListResponse> => {
  return axios.get("/community/conts/selectList", { params }).then((res) => {
    return {
      list: res.data?.data || [],
      totalCount: res.data?.total || 0,
    };
  });
};

/* 리비전 상세 */
export const fetchContentDetail = (bbsId: string, rvsnNo: string) => {
  return axios
    .get("/community/conts/selectDetail", {
      params: { bbsId, rvsnNo },
    })
    .then((res) => res.data?.data);
};

/* 임시저장 */
export const saveContentDraft = (
  bbsId: string,
  vo: {
    contsCn: string;
    rgtrId: string;
    regPrgmId: string;
  }
) => {
  return axios
    .post("/community/conts/draft", vo, {
      params: { bbsId },
    })
    .then((res) => res.data?.data); // rvsnNo 반환
};

/* 수정 */
export const updateContent = (vo: { bbsId: string; rvsnNo: string; contsCn: string; mdfrId: string; mdfcnPrgmId: string }) => {
  return axios.put("/community/conts/updateConts", vo).then((res) => res.data?.data);
};

/* 공개 처리 */
export const publishContent = (bbsId: string, rvsnNo: string) => {
  return axios
    .post("/community/conts/publish", null, {
      params: { bbsId, rvsnNo },
    })
    .then((res) => res.data?.data);
};

/* 삭제 */
export const deleteContent = (boardType: string, rvsnNo: string) => {
  return axios
    .delete("/community/conts/deleteConts", {
      params: { boardType, rvsnNo },
    })
    .then((res) => res.data?.data);
};

/* 리비전 히스토리 */
export const fetchRevisionHistory = (bbsId: string) => {
  return axios
    .get("/community/conts/revisionList", {
      params: { bbsId },
    })
    .then((res) => res.data?.data);
};

/* 이미지 업로드 */
export const uploadContentImage = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios
    .post("/community/conts/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data?.data);
};

/* 사용자 화면: 현재 공개된 컨텐츠 */
export type PublishedContent = {
  contsSn: number;
  contsTtl: string;
  contsCn: string;
  regDt: string;
};

export const fetchPublishedContent = (boardType: string): Promise<PublishedContent> => {
  return axios
    .get("/community/conts/published", {
      params: { boardType },
    })
    .then((res) => res.data?.data);
};

/* 미리보기 HTML */
export const fetchContentPreviewHtml = (boardType: string): Promise<string> => {
  return axios
    .get(`/community/content/${boardType}`, {
      responseType: "text",
    })
    .then((res) => res.data);
};

/* =========================
 * Dashboard API
 * ========================= */

/* CDM 전체 통계 */
export const fetchCdmStats = () => {
  return axios.get("/dashboard/cdmStats").then((res) => res.data?.data);
};

/* 공시진행현황 */
export const fetchPblntPrgrStats = () => axios.get("/dashboard/pblntPrgrStats").then((res) => res.data?.data);

/* 연구과제 현황 */
export const fetchAsmtStatusStats = () => {
  return axios.get("/dashboard/asmtStatusStats").then((res) => res.data?.data);
};

/* 기관별 업로드 통계 */
export const fetchInstUldStats = (ptcpInstSn: number | string) => {
  return axios.get("/dashboard/instUldStats", { params: { ptcpInstSn } }).then((res) => res.data?.data);
};

/* 기관별 데이터 건수 */
export const fetchInstUldNocs = (ptcpInstSn: number | string) => {
  return axios.get("/dashboard/instUldNocs", { params: { ptcpInstSn } }).then((res) => res.data?.data);
};

/* 기관별 오류율 */
export const fetchInstErrRate = (ptcpInstSn: number | string) => {
  return axios.get("/dashboard/instErrRate", { params: { ptcpInstSn } }).then((res) => res.data?.data);
};

/* 기관별 과제 참여 현황 */
export const fetchInstAsmtPrtcpStats = (instId: string) =>
  axios.get("/dashboard/instAsmtPrtcpStats", { params: { instId } }).then((res) => res.data?.data);

/* 기관별 생성 과제 현황 */
export const fetchInstAsmtStatusStats = (instId: string) =>
  axios.get("/dashboard/instAsmtStatusStats", { params: { instId } }).then((res) => res.data?.data);

/* 테이블별 보유량 */
export const fetchTblUldStats = (instId: string) =>
  axios.get("/dashboard/tblUldStats", { params: { instId } }).then((res) => res.data?.data);

/* 모델별 테이블 보유량 */
export const fetchInstTblUld = (ptcpInstSn: number | string, trsfSeCd: string) => {
  return axios
    .get("/dashboard/instTblUld", {
      params: { ptcpInstSn, trsfSeCd },
    })
    .then((res) => res.data?.data);
};

/* 기관 CDM 개요 */
export const fetchInstCdmOverview = (ptcpInstSn: number | string) => {
  return axios.get("/dashboard/instCdmOverview", { params: { ptcpInstSn } }).then((res) => res.data?.data);
};

/* 오류 요약 */
export const fetchErrorSummary = (instId: string) =>
  axios.get("/dashboard/errorSummary", { params: { instId } }).then((res) => res.data?.data);

/* 업로드 이력 */
export const fetchInstUploadList = (inVo: any) => {
  return axios.post("/dashboard/instUploadList", inVo).then((res) => res.data?.data);
};

/* 기관별 업로드 진행 현황 */
export const fetchInstUldPrgrStats = (instId: string) =>
  axios.get("/dashboard/instUldPrgrStats", { params: { instId } }).then((res) => res.data?.data);

/* 업로드 공시 */
export const fetchUploadNotice = () => {
  return axios.get("/dashboard/uploadNotice").then((res) => res.data?.data);
};

/* =========================
 * 게시판 댓글 API
 * ========================= */

export interface BoardCommentDto {
  asmtCmntSn: number;
  asmtSn: number;
  instId: string | null;
  instNm: string | null;
  deptNm: string | null;
  mbrNm: string | null;
  empNm: string | null;
  cmntDtlCn: string | null;
  orgnlUpCmntAnsSn: number | null;
  upCmntAnsSn: number | null;
  cmntAnsDepth: number | null;
  cmntAnsSn: number | null;
  delIndctYn: string | null;
  delYn: string | null;
  rgtrId: string | null;
  regDt: string | null;
  mdfrId: string | null;
  mdfcnDt: string | null;
}

export interface BoardCommentCreateRequest {
  cmntDtlCn: string;
  upCmntAnsSn?: number | null;
}

export interface BoardCommentUpdateRequest {
  cmntDtlCn: string;
}

/** 게시판 댓글 목록 조회 */
export const fetchBoardComments = (pstSn: number, bbsId: string): Promise<BoardCommentDto[]> =>
  axios.get(`/community/board/${pstSn}/comments`, { params: { bbsId } }).then((res) => res.data?.data || []);

/** 게시판 댓글 등록 */
export const createBoardComment = (pstSn: number, bbsId: string, payload: BoardCommentCreateRequest) =>
  axios.post(`/community/board/${pstSn}/comments`, payload, { params: { bbsId } });

/** 게시판 댓글 수정 */
export const updateBoardComment = (pstSn: number, asmtCmntSn: number, bbsId: string, payload: BoardCommentUpdateRequest) =>
  axios.put(`/community/board/${pstSn}/comments/${asmtCmntSn}`, payload, { params: { bbsId } });

/** 게시판 댓글 삭제 */
export const deleteBoardComment = (pstSn: number, asmtCmntSn: number, bbsId: string) =>
  axios.delete(`/community/board/${pstSn}/comments/${asmtCmntSn}`, { params: { bbsId } });
