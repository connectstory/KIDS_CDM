import type { ApiResponse } from "@/interfaces/commonInterface.ts";
import type {
  AnalysisDataApiResponse,
  AnalysisDataDetailApiResponse,
  AnalysisDataRequest,
  AnalysisDataResponse,
  AnalysisDataUpdateApiResponse,
  AnalysisDatasetTaskResponse,
  AsmtAccountListApiResponse,
  AsmtAccountRequest,
  AsmtPersonCreateRequest,
  AsmtPersonListApiResponse,
  CancelInviteRequest,
  CancelResearchRequest,
  CloseResearchRequest,
  EmpOptionListApiResponse,
  ExcludedOpinionListApiResponse,
  MetaAccessCheckResponse,
  OpinionListApiResponse,
  OpinionRequest,
  OrgAnalysisDataApiResponse,
  PartnerActionRequest,
  PartnerCreateRequest,
  ResearchCommentCreateRequest,
  ResearchCommentUpdateRequest,
  ResearchCommentsApiResponse,
  ResearchCreateApiResponse,
  ResearchDetailApiResponse,
  ResearchDetailResponse,
  ResearchFileItem,
  ResearchListApiResponse,
  ResearchListResponse,
  ResearchPartnerApiResponse,
  ResearchPartnerListApiResponse,
  ResearchSearchRequest,
} from "@/interfaces/researchInterface";
import { researchApiPaths } from "@/api/apiPaths";
import axios from "@/api/axios";
import { convertResearchStatus } from "@/utils/common";

// ResearchListResponse의 상태 코드를 변환
function transformResearchListResponse(response: ResearchListResponse): ResearchListResponse {
  return {
    ...response,
    asmtPrgrsSttsCd: convertResearchStatus(response.asmtPrgrsSttsCd),
  };
}

// ResearchDetailResponse의 상태 코드를 변환
function transformResearchDetailResponse(response: ResearchDetailResponse): ResearchDetailResponse {
  return {
    ...response,
    asmtPrgrsSttsCd: convertResearchStatus(response.asmtPrgrsSttsCd),
  };
}

export const ResearchAPI = {
  // =====================================
  // 연구과제 — 본문 (목록·상세·등록·수정·삭제·상태·마감·취소)
  // =====================================

  // 연구과제 목록 조회
  getResearchesByAdmin: async (params?: ResearchSearchRequest) => {
    const response = await axios.get<ResearchListApiResponse>(researchApiPaths.adminList(), {
      params,
    });
    // 서버 코드를 프론트엔드 코드로 변환
    if (response.data.data) {
      return {
        ...response,
        data: {
          ...response.data,
          data: response.data.data.map(transformResearchListResponse),
        },
      };
    }
    return response;
  },

  // 연구과제 목록 조회
  getResearchesByPartner: async (params?: ResearchSearchRequest) => {
    const response = await axios.get<ResearchListApiResponse>(researchApiPaths.partnerList(), {
      params,
    });
    // 서버 코드를 프론트엔드 코드로 변환
    if (response.data.data) {
      return {
        ...response,
        data: {
          ...response.data,
          data: response.data.data.map(transformResearchListResponse),
        },
      };
    }
    return response;
  },

  // 연구과제 상세 조회
  getResearchById: async (id: number) => {
    if (id == null || id === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const response = await axios.get<ResearchDetailApiResponse>(researchApiPaths.researchById(id));
    // 서버 코드를 프론트엔드 코드로 변환
    if (response.data.data) {
      return {
        ...response,
        data: {
          ...response.data,
          data: transformResearchDetailResponse(response.data.data),
        },
      };
    }
    return response;
  },

  // 연구과제 등록 (multipart: data 필수, files 선택)
  createResearch: (formData: FormData) => axios.post<ResearchCreateApiResponse>(researchApiPaths.researchesRoot(), formData),

  // 연구과제 수정 (multipart: data 필수, files·deleteFileIds 선택)
  updateResearch: (asmtSn: number, formData: FormData, deleteFileIds?: string[]) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const params: Record<string, string | string[]> = {};
    if (deleteFileIds && deleteFileIds.length > 0) {
      params.deleteFileIds = deleteFileIds;
    }
    return axios.put<void>(researchApiPaths.researchByAsmtSn(asmtSn), formData, {
      params,
      paramsSerializer: (p) => {
        const search = new URLSearchParams();
        Object.entries(p).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => search.append(key, v));
          } else {
            search.append(key, String(value));
          }
        });
        return search.toString();
      },
    });
  },

  // 연구과제 삭제
  removeResearch: (id: number) => {
    if (id == null || id === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    return axios.delete<void>(researchApiPaths.researchById(id));
  },

  // 연구과제 상태 변경
  updateResearchStatus: (asmtSn: number, asmtPrgrsSttsCd: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtPrgrsSttsCd == null || asmtPrgrsSttsCd === undefined) {
      throw new Error("과제진행상태코드는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(researchApiPaths.status(asmtSn), {
      asmtPrgrsSttsCd,
    });
  },

  // 연구과제 마감
  closeResearch: (asmtSn: number, payload: CloseResearchRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(researchApiPaths.close(asmtSn), payload);
  },

  // 연구과제 취소 (asmt_cls_cn, asmt_cls_dt 저장)
  cancelResearch: (asmtSn: number, payload: CancelResearchRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(researchApiPaths.cancel(asmtSn), payload);
  },

  // =====================================
  // 연구과제 — 참여기관
  // =====================================

  // 연구과제 참여기관 목록 조회
  getResearchPartners: async (asmtSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const response = await axios.get<ResearchPartnerListApiResponse>(researchApiPaths.partners(asmtSn));
    return response;
  },

  // 연구과제 참여기관 단건 조회
  getResearchPartner: async (asmtSn: number, asmtPtcpInstSn: string | number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtPtcpInstSn == null || asmtPtcpInstSn === undefined) {
      throw new Error("참여기관 일련번호는 필수입니다.");
    }
    const response = await axios.get<ResearchPartnerApiResponse>(researchApiPaths.partnerBySn(asmtSn, asmtPtcpInstSn));
    return response;
  },

  // 참여기관 정보 저장
  createPartners: (asmtSn: number, payload: PartnerCreateRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    return axios.post<ApiResponse<void>>(researchApiPaths.partners(asmtSn), payload);
  },

  // 참여기관 참여취소
  cancelInvitePartner: (asmtSn: number, instId: number, payload: CancelInviteRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (instId == null || instId === undefined) {
      throw new Error("기관 ID는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(researchApiPaths.inviteByInst(asmtSn, instId), {
      action: "delete",
      asmtPtcpRtrcnRsn: payload.asmtPtcpRtrcnRsn,
    } as PartnerActionRequest);
  },

  // 참여기관 참여승인
  approveInvitePartner: (asmtSn: number, asmtPtcpInstSn: number | string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtPtcpInstSn == null || asmtPtcpInstSn === undefined) {
      throw new Error("참여기관 일련번호는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(researchApiPaths.inviteByPtcp(asmtSn, asmtPtcpInstSn), {
      action: "approve",
    } as PartnerActionRequest);
  },

  // =====================================
  // 연구과제 — 분석 데이터·의견·검토
  // =====================================

  // 분석 데이터 목록 조회
  getAnalysisData: async (asmtSn: number, rsltGroupStcd?: string, instId?: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const params: { rsltGroupStcd?: string; instId?: string } = {};
    if (rsltGroupStcd) params.rsltGroupStcd = rsltGroupStcd;
    if (instId) params.instId = instId;
    const response = await axios.get<ApiResponse<AnalysisDataResponse[]>>(researchApiPaths.analysisData(asmtSn), { params });
    return response;
  },

  // Non-CDM 기관 분석 데이터 목록 조회
  getOrgAnalysisData: async (asmtSn: number, rsltGroupStcd: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (rsltGroupStcd == null || rsltGroupStcd === undefined) {
      throw new Error("결과그룹상태코드는 필수입니다.");
    }
    const response = await axios.get<OrgAnalysisDataApiResponse>(researchApiPaths.orgAnalysisData(asmtSn), {
      params: { rsltGroupStcd },
    });
    return response;
  },

  // 분석 데이터 상세 조회
  getAnalysisDataDetail: async (asmtSn: number, asmtMetaRsltSn: number, rsltGroupStcd?: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    const params = rsltGroupStcd ? { rsltGroupStcd: rsltGroupStcd } : {};
    const response = await axios.get<AnalysisDataDetailApiResponse>(researchApiPaths.analysisDataBySn(asmtSn, asmtMetaRsltSn), {
      params,
    });
    return response;
  },

  // 최신 분석 데이터 상세 조회
  getLatestAnalysisDataDetail: async (asmtSn: number, rsltGroupStcd: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (rsltGroupStcd == null || rsltGroupStcd === undefined) {
      throw new Error("결과그룹상태코드는 필수입니다.");
    }
    const params = { rsltGroupStcd: rsltGroupStcd };
    const response = await axios.get<AnalysisDataDetailApiResponse>(researchApiPaths.analysisDataLatest(asmtSn), { params });
    return response;
  },

  // 분석 데이터 생성 (multipart: data 필수, files 선택)
  createAnalysisData: (
    asmtSn: number,
    payload: AnalysisDataRequest,
    files?: File[],
    datasetFiles?: File[],
    vdiFiles?: File[]
  ) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    if (files?.length) {
      files.forEach((file) => formData.append("files", file, file.name));
    }
    if (datasetFiles?.length) {
      datasetFiles.forEach((file) => formData.append("datasetFiles", file, file.name));
    }
    if (vdiFiles?.length) {
      vdiFiles.forEach((file) => formData.append("vdiFiles", file, file.name));
    }
    return axios.post<AnalysisDataApiResponse>(researchApiPaths.analysisData(asmtSn), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 분석 데이터 수정 (multipart: data 필수, files 선택)
  updateAnalysisData: (
    asmtSn: number,
    asmtMetaRsltSn: number,
    payload: AnalysisDataRequest,
    files?: File[],
    datasetFiles?: File[],
    vdiFiles?: File[],
    deleteFileIds?: string[],
    deleteDatasetFileIds?: string[],
    deleteVdiFileIds?: string[]
  ) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    if (files?.length) {
      files.forEach((file) => formData.append("files", file, file.name));
    }
    if (datasetFiles?.length) {
      datasetFiles.forEach((file) => formData.append("datasetFiles", file, file.name));
    }
    if (vdiFiles?.length) {
      vdiFiles.forEach((file) => formData.append("vdiFiles", file, file.name));
    }
    const params: Record<string, string | string[]> = {};
    if (deleteFileIds && deleteFileIds.length > 0) params.deleteFileIds = deleteFileIds;
    if (deleteDatasetFileIds && deleteDatasetFileIds.length > 0) params.deleteDatasetFileIds = deleteDatasetFileIds;
    if (deleteVdiFileIds && deleteVdiFileIds.length > 0) params.deleteVdiFileIds = deleteVdiFileIds;

    return axios.put<AnalysisDataUpdateApiResponse>(researchApiPaths.analysisDataBySn(asmtSn, asmtMetaRsltSn), formData, {
      headers: { "Content-Type": "multipart/form-data" },
      params,
      paramsSerializer: (p) => {
        const search = new URLSearchParams();
        Object.entries(p).forEach(([key, value]) => {
          if (Array.isArray(value)) value.forEach((v) => search.append(key, v));
          else search.append(key, String(value));
        });
        return search.toString();
      },
    });
  },

  // 분석 데이터 상태 수정
  updateAnalysisDataStatus: (
    asmtSn: number,
    asmtMetaRsltSn: number,
    payload: { asmtMetaRsltSttsCd: string; rsltGroupCd: string }
  ) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    return axios.put<ApiResponse<{ asmtMetaRsltSn: number }>>(
      researchApiPaths.analysisDataStatus(asmtSn, asmtMetaRsltSn),
      payload
    );
  },

  // 검토 요청 전송
  sendReviewRequest: (asmtSn: number, asmtMetaRsltSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    return axios.post<ApiResponse<{ asmtMetaRsltSn: number }>>(researchApiPaths.reviewRequest(asmtSn, asmtMetaRsltSn), null);
  },

  // 검토 요청 마감
  closeReview: (asmtSn: number, asmtMetaRsltSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    return axios.post<ApiResponse<{ asmtMetaRsltSn: number }>>(researchApiPaths.reviewClose(asmtSn, asmtMetaRsltSn), null);
  },

  // 의견 전체 상태 체크 (메타분석, 원천데이터 분석의 최신 데이터가 모두 검토완료인지 확인)
  checkAllStatusCompleted: async (asmtSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const response = await axios.get<ApiResponse<boolean>>(researchApiPaths.allStatusCheck(asmtSn));
    return response;
  },

  // 메타분석 접근 가능 여부 체크 (결과제외/활용미동의)
  checkMetaAccess: async (asmtSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const response = await axios.get<ApiResponse<MetaAccessCheckResponse>>(researchApiPaths.metaAccessCheck(asmtSn));
    return response;
  },

  // 의견 등록
  createOpinion: (asmtSn: number, asmtMetaRsltSn: number, payload: OpinionRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    return axios.post<ApiResponse<void>>(researchApiPaths.opinion(asmtSn, asmtMetaRsltSn), payload);
  },

  // 의견 수정
  updateOpinion: (asmtSn: number, asmtMetaRsltSn: number, payload: OpinionRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(researchApiPaths.opinion(asmtSn, asmtMetaRsltSn), payload);
  },

  // 의견 목록 조회
  getOpinionList: async (asmtSn: number, asmtMetaRsltSn: number, rsltGroupStcd: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    if (rsltGroupStcd == null || rsltGroupStcd === undefined) {
      throw new Error("결과그룹상태코드는 필수입니다.");
    }
    const response = await axios.get<OpinionListApiResponse>(researchApiPaths.opinion(asmtSn, asmtMetaRsltSn), {
      params: { rsltGroupStcd },
    });
    return response;
  },

  // =====================================
  // 연구과제 — 파일·IRB·첨부
  // =====================================

  // 결과제외 등 의견 목록 조회 (`GET .../analysis-data/opinion`, 평면 OpinionListResponse 배열)
  getOpinionByCondition: async (asmtSn: number, instId?: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const params: { instId?: string } = {};
    if (instId) params.instId = instId;
    const response = await axios.get<ExcludedOpinionListApiResponse>(researchApiPaths.opinionFlat(asmtSn), { params });
    return response;
  },

  // 연구과제 파일 목록 조회 (uldTaskSeCd=01, fileSeCd 필터)
  getResearchFiles: async (asmtSn: number, fileSeCd: string, uldTaskSeCd?: string, ptcpInstSn?: number | null) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (!fileSeCd) {
      throw new Error("fileSeCd는 필수입니다.");
    }
    const params: { fileSeCd: string; uldTaskSeCd?: string; ptcpInstSn?: number } = { fileSeCd };
    if (uldTaskSeCd) params.uldTaskSeCd = uldTaskSeCd;
    if (ptcpInstSn != null && !isNaN(ptcpInstSn)) params.ptcpInstSn = ptcpInstSn;
    const response = await axios.get<ApiResponse<ResearchFileItem[]>>(researchApiPaths.files(asmtSn), { params });
    return response;
  },

  // IRB/DRB 파일 업로드 (multipart files)
  uploadIrbFiles: (asmtSn: number, files?: File[]) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const formData = new FormData();
    if (files?.length) {
      files.forEach((file) => formData.append("files", file, file.name));
    }
    return axios.post<ApiResponse<void>>(researchApiPaths.irbFiles(asmtSn), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // IRB 파일 삭제 (본인 업로드분만, DRB는 삭제 불가)
  deleteIrbFile: (asmtSn: number, atchFileId: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (!atchFileId) {
      throw new Error("첨부파일 ID는 필수입니다.");
    }
    const encoded = encodeURIComponent(atchFileId);
    return axios.delete<ApiResponse<void>>(researchApiPaths.irbFileItem(asmtSn, encoded));
  },

  // 참여기관 공유파일 업로드 (multipart files, FileCodeType.RESEARCH_PARTNER)
  uploadPartnerFiles: (asmtSn: number, asmtPtcpInstSn: number, files?: File[]) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtPtcpInstSn == null || asmtPtcpInstSn === undefined) {
      throw new Error("참여기관 일련번호는 필수입니다.");
    }
    const formData = new FormData();
    formData.append("asmtPtcpInstSn", String(asmtPtcpInstSn));
    if (files?.length) {
      files.forEach((file) => formData.append("files", file, file.name));
    }
    return axios.post<ApiResponse<void>>(researchApiPaths.partnerFiles(asmtSn), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 연구과제 등록자(주관기관) 첨부파일 업로드 (multipart files, FileCodeType.RESEARCH_ADMIN_ATTACHED)
  uploadAdminFiles: (asmtSn: number, files?: File[]) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const formData = new FormData();
    if (files?.length) {
      files.forEach((file) => formData.append("files", file, file.name));
    }
    return axios.post<ApiResponse<void>>(researchApiPaths.adminFiles(asmtSn), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 연구과제 등록자/관리자 첨부파일 삭제 (atchFileId 기준)
  deleteAdminFile: (asmtSn: number, atchFileId: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (!atchFileId) {
      throw new Error("첨부파일 ID는 필수입니다.");
    }
    const encoded = encodeURIComponent(atchFileId);
    return axios.delete<ApiResponse<void>>(researchApiPaths.adminFileItem(asmtSn, encoded));
  },

  // =====================================
  // 연구과제 — 댓글
  // =====================================

  // 참여기관 공유파일 삭제 (atchFileId 기준)
  deletePartnerFile: (asmtSn: number, asmtPtcpInstSn: number, atchFileId: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtPtcpInstSn == null || asmtPtcpInstSn === undefined) {
      throw new Error("참여기관 일련번호는 필수입니다.");
    }
    if (!atchFileId) {
      throw new Error("첨부파일 ID는 필수입니다.");
    }
    const encoded = encodeURIComponent(atchFileId);
    return axios.delete<ApiResponse<void>>(researchApiPaths.partnerFileItem(asmtSn, encoded), {
      params: { asmtPtcpInstSn },
    });
  },

  // 댓글 목록 조회
  getComments: async (asmtSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    return axios.get<ResearchCommentsApiResponse>(researchApiPaths.comments(asmtSn));
  },

  // 댓글 등록
  createComment: (asmtSn: number, payload: ResearchCommentCreateRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    return axios.post<ApiResponse<any>>(researchApiPaths.comments(asmtSn), payload);
  },

  // 댓글 수정
  updateComment: (asmtSn: number, asmtCmntSn: number, payload: ResearchCommentUpdateRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtCmntSn == null || asmtCmntSn === undefined) {
      throw new Error("댓글 ID는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(researchApiPaths.commentBySn(asmtSn, asmtCmntSn), payload);
  },

  // 댓글 삭제
  deleteComment: (asmtSn: number, asmtCmntSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtCmntSn == null || asmtCmntSn === undefined) {
      throw new Error("댓글 ID는 필수입니다.");
    }
    return axios.delete<ApiResponse<void>>(researchApiPaths.commentBySn(asmtSn, asmtCmntSn));
  },

  // =====================================
  // 연구과제 — VDI/DB 계정
  // =====================================

  // VDI/DB 계정 목록 조회 (searchAsmtAccounts - 관리자용 전체 목록)
  searchAsmtAccounts: async () => {
    const response = await axios.get<AsmtAccountListApiResponse>(researchApiPaths.accounts());
    return response;
  },

  // 과제별 VDI/DB 계정 목록 조회
  getAsmtAccounts: async (asmtSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const response = await axios.get<AsmtAccountListApiResponse>(researchApiPaths.accountsByAsmt(asmtSn));
    return response;
  },

  // VDI/DB 계정 등록 (ADMIN 전용)
  createAsmtAccount: (payload: AsmtAccountRequest) => {
    return axios.post<ApiResponse<void>>(researchApiPaths.accounts(), payload);
  },

  // VDI/DB 계정 수정 (ADMIN 전용)
  updateAsmtAccount: (sqAsmtAccountSn: number, payload: AsmtAccountRequest) => {
    if (sqAsmtAccountSn == null || sqAsmtAccountSn === undefined) {
      throw new Error("계정 일련번호는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(researchApiPaths.accountBySn(sqAsmtAccountSn), payload);
  },

  // VDI/DB 계정 삭제 (ADMIN 전용)
  deleteAsmtAccount: (sqAsmtAccountSn: number) => {
    if (sqAsmtAccountSn == null || sqAsmtAccountSn === undefined) {
      throw new Error("계정 일련번호는 필수입니다.");
    }
    return axios.delete<ApiResponse<void>>(researchApiPaths.accountBySn(sqAsmtAccountSn));
  },

  // =====================================
  // 연구과제 — 과제 담당자
  // =====================================

  // 담당자 드롭다운용 직원 목록 (deptNos: 0000004,0000080 등)
  searchAsmtPersonEmpOptions: (deptNos: string[]) => {
    const params = deptNos.length > 0 ? { deptNos: deptNos.join(",") } : {};
    return axios.get<EmpOptionListApiResponse>(researchApiPaths.asmtPersonEmpOptions(), { params });
  },

  // 담당자 목록 (emp_nm, dept_no 포함)
  searchAsmtPersons: () => {
    return axios.get<AsmtPersonListApiResponse>(researchApiPaths.asmtPersons());
  },

  // 담당자 등록 (ADMIN 전용)
  createAsmtPerson: (payload: AsmtPersonCreateRequest) => {
    return axios.post<ApiResponse<void>>(researchApiPaths.asmtPersons(), payload);
  },

  // 담당자 삭제 (ADMIN 전용)
  deleteAsmtPerson: (personSn: number) => {
    if (personSn == null || personSn === undefined) {
      throw new Error("담당자 일련번호는 필수입니다.");
    }
    return axios.delete<ApiResponse<void>>(researchApiPaths.asmtPersonBySn(personSn));
  },

  // =====================================
  // 연구과제 — 분석 데이터셋(CDM 복사 비동기)
  // =====================================

  // 분석 데이터셋 조건 기반 복사 비동기 제출 (CDM 데이터 생성).
  submitAnalysisDatasetCopy: async (params: { asmtSn: number }) => {
    const searchParams = new URLSearchParams({ asmtSn: String(params.asmtSn) });
    const response = await axios.post<ApiResponse<AnalysisDatasetTaskResponse>>(
      researchApiPaths.analysisDataset(searchParams.toString())
    );
    return response;
  },

  // 분석 데이터셋 복사 작업 상태 조회
  getAnalysisDatasetTaskStatus: async (taskId: string) => {
    const response = await axios.get<ApiResponse<AnalysisDatasetTaskResponse>>(
      researchApiPaths.analysisDatasetTask(encodeURIComponent(taskId))
    );
    return response;
  },
};
