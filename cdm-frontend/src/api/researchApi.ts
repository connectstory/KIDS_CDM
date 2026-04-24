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
import axios from "@/api/axios";
import { convertResearchStatus } from "@/utils/common";

const BASE_URL = "/researches";

/**
 * ResearchListResponse의 상태 코드를 변환
 */
function transformResearchListResponse(response: ResearchListResponse): ResearchListResponse {
  return {
    ...response,
    asmtPrgrsSttsCd: convertResearchStatus(response.asmtPrgrsSttsCd),
  };
}

/**
 * ResearchDetailResponse의 상태 코드를 변환
 * 현재 ResearchDetailResponse에는 상태 필드가 없지만, 향후 확장 대비
 */
function transformResearchDetailResponse(response: ResearchDetailResponse): ResearchDetailResponse {
  return {
    ...response,
    asmtPrgrsSttsCd: convertResearchStatus(response.asmtPrgrsSttsCd),
  };
}

export const ResearchAPI = {
  // =====================================
  // 연구과제: 게시글 관리
  // =====================================

  /**
   * F-CM-037 연구과제 목록 조회
   * @param params 검색 조건 (title, content)
   * @returns 연구과제 목록
   */
  getResearchesByAdmin: async (params?: ResearchSearchRequest) => {
    const response = await axios.get<ResearchListApiResponse>(`${BASE_URL}/admin`, {
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

  /**
   * F-CM-037 연구과제 목록 조회
   * @param params 검색 조건 (title, content)
   * @returns 연구과제 목록
   */
  getResearchesByPartner: async (params?: ResearchSearchRequest) => {
    const response = await axios.get<ResearchListApiResponse>(`${BASE_URL}/partner`, {
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

  /**
   * F-CM-038 연구과제 상세 조회
   * @param id 연구과제 ID
   * @returns 연구과제 상세 정보
   */
  getResearchById: async (id: number) => {
    if (id == null || id === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const response = await axios.get<ResearchDetailApiResponse>(`${BASE_URL}/${id}`);
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

  /**
   * F-CM-039 연구과제 등록 (multipart: data 필수, files 선택)
   * @param formData part "data" (JSON Blob), part "files" (File[] optional)
   */
  createResearch: (formData: FormData) => axios.post<ResearchCreateApiResponse>(BASE_URL, formData),

  /**
   * F-CM-040 연구과제 수정 (multipart: data 필수, files·deleteFileIds 선택)
   * @param asmtSn 연구과제 ID
   * @param formData part "data" (JSON Blob), part "files" (File[] optional)
   * @param deleteFileIds 삭제할 파일 ID 목록 (query param, repeated)
   */
  updateResearch: (asmtSn: number, formData: FormData, deleteFileIds?: string[]) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const params: Record<string, string | string[]> = {};
    if (deleteFileIds && deleteFileIds.length > 0) {
      params.deleteFileIds = deleteFileIds;
    }
    return axios.put<void>(`${BASE_URL}/${asmtSn}`, formData, {
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

  /**
   * F-CM-041 연구과제 삭제
   * @param id 연구과제 ID
   */
  removeResearch: (id: number) => {
    if (id == null || id === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    return axios.delete<void>(`${BASE_URL}/${id}`);
  },

  /**
   * 연구과제 참여기관 목록 조회
   * @param asmtSn 연구과제 ID
   * @returns 참여기관 목록
   */
  getResearchPartners: async (asmtSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const response = await axios.get<ResearchPartnerListApiResponse>(`${BASE_URL}/${asmtSn}/partners`);
    return response;
  },

  /**
   * 연구과제 참여기관 단건 조회
   * @param asmtSn 연구과제 ID
   * @param ptcpInstSn 참여기관 일련번호
   * @returns 참여기관 정보
   */
  getResearchPartner: async (asmtSn: number, asmtPtcpInstSn: string | number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtPtcpInstSn == null || asmtPtcpInstSn === undefined) {
      throw new Error("참여기관 일련번호는 필수입니다.");
    }
    const response = await axios.get<ResearchPartnerApiResponse>(`${BASE_URL}/${asmtSn}/partners/${asmtPtcpInstSn}`);
    return response;
  },

  /**
   * 참여기관 정보 저장
   * @param asmtSn 연구과제 ID
   * @param payload 참여기관 생성 요청 데이터
   */
  createPartners: (asmtSn: number, payload: PartnerCreateRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    return axios.post<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/partners`, payload);
  },

  /**
   * 분석 데이터 목록 조회
   * @param asmtSn 연구과제 ID
   * @param rsltGroupStcd 결과그룹상태코드
   * @param instId 기관아이디 (사업자등록번호)
   * @returns 분석 데이터 목록
   */
  getAnalysisData: async (asmtSn: number, rsltGroupStcd?: string, instId?: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const params: { rsltGroupStcd?: string; instId?: string } = {};
    if (rsltGroupStcd) params.rsltGroupStcd = rsltGroupStcd;
    if (instId) params.instId = instId;
    const response = await axios.get<ApiResponse<AnalysisDataResponse[]>>(`${BASE_URL}/${asmtSn}/analysis-data`, { params });
    return response;
  },

  /**
   * Non-CDM 기관 분석 데이터 목록 조회
   * @param asmtSn 연구과제 ID
   * @param rsltGroupStcd 결과그룹상태코드
   * @returns Non-CDM 기관 분석 데이터 목록
   */
  getOrgAnalysisData: async (asmtSn: number, rsltGroupStcd: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (rsltGroupStcd == null || rsltGroupStcd === undefined) {
      throw new Error("결과그룹상태코드는 필수입니다.");
    }
    const response = await axios.get<OrgAnalysisDataApiResponse>(`${BASE_URL}/${asmtSn}/analysis-data/org-analysis-data`, {
      params: { rsltGroupStcd },
    });
    return response;
  },

  /**
   * 분석 데이터 상세 조회
   * @param asmtSn 연구과제 ID
   * @param asmtMetaRsltSn 분석 데이터 ID
   * @param rsltGroupStcd 결과그룹상태코드
   * @returns 분석 데이터 상세 정보
   */
  getAnalysisDataDetail: async (asmtSn: number, asmtMetaRsltSn: number, rsltGroupStcd?: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    const params = rsltGroupStcd ? { rsltGroupStcd: rsltGroupStcd } : {};
    const response = await axios.get<AnalysisDataDetailApiResponse>(`${BASE_URL}/${asmtSn}/analysis-data/${asmtMetaRsltSn}`, {
      params,
    });
    return response;
  },

  /**
   * 최신 분석 데이터 상세 조회
   * @param asmtSn 연구과제 ID
   * @param rsltGroupStcd 결과그룹상태코드
   * @returns 최신 분석 데이터 상세 정보
   */
  getLatestAnalysisDataDetail: async (asmtSn: number, rsltGroupStcd: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (rsltGroupStcd == null || rsltGroupStcd === undefined) {
      throw new Error("결과그룹상태코드는 필수입니다.");
    }
    const params = { rsltGroupStcd: rsltGroupStcd };
    const response = await axios.get<AnalysisDataDetailApiResponse>(`${BASE_URL}/${asmtSn}/analysis-data/latest`, { params });
    return response;
  },

  /**
   * 분석 데이터 생성 (multipart: data 필수, files 선택)
   * @param asmtSn 연구과제 ID
   * @param payload 분석 데이터 생성 요청 데이터
   * @param files 첨부 파일 (legacy 선택)
   * @param datasetFiles 분석 DATASET 첨부 파일 (optional)
   * @param vdiFiles VDI 신청서 첨부 파일 (optional)
   */
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
    return axios.post<AnalysisDataApiResponse>(`${BASE_URL}/${asmtSn}/analysis-data`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * 분석 데이터 수정 (multipart: data 필수, files 선택)
   * @param asmtSn 연구과제 ID
   * @param asmtMetaRsltSn 분석 데이터 ID
   * @param payload 분석 데이터 수정 요청 데이터
   * @param files 첨부 파일 (legacy 선택)
   * @param datasetFiles 분석 DATASET 첨부 파일 (optional)
   * @param vdiFiles VDI 신청서 첨부 파일 (optional)
   */
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

    return axios.put<AnalysisDataUpdateApiResponse>(`${BASE_URL}/${asmtSn}/analysis-data/${asmtMetaRsltSn}`, formData, {
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

  /**
   * 연구과제 파일 목록 조회 (uldTaskSeCd=01, fileSeCd 필터)
   * @param asmtSn 연구과제 ID
   * @param fileSeCd 파일구분코드 (01=IRB 등)
   * @param uldTaskSeCd 업로드업무구분코드 (기본 01)
   * @param ptcpInstSn 참여기관 일련번호 (IRB 조회 시 해당 기관 파일만, 생략 시 현재 사용자 기준)
   */
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
    const response = await axios.get<ApiResponse<ResearchFileItem[]>>(`${BASE_URL}/${asmtSn}/files`, { params });
    return response;
  },

  /**
   * IRB/DRB 파일 업로드 (multipart files)
   * @param asmtSn 연구과제 ID
   * @param files 첨부 파일 (선택, 비어 있으면 호출만 하고 업로드 없음)
   */
  uploadIrbFiles: (asmtSn: number, files?: File[]) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const formData = new FormData();
    if (files?.length) {
      files.forEach((file) => formData.append("files", file, file.name));
    }
    return axios.post<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/irb-files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * IRB 파일 삭제 (본인 업로드분만, DRB는 삭제 불가)
   * @param asmtSn 연구과제 ID
   * @param atchFileId 첨부파일ID(UUID)
   */
  deleteIrbFile: (asmtSn: number, atchFileId: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (!atchFileId) {
      throw new Error("첨부파일 ID는 필수입니다.");
    }
    const encoded = encodeURIComponent(atchFileId);
    return axios.delete<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/irb-files/${encoded}`);
  },

  /**
   * 참여기관 공유파일 업로드 (multipart files, FileCodeType.RESEARCH_PARTNER)
   * @param asmtSn 연구과제 ID
   * @param asmtPtcpInstSn 참여기관 일련번호(pst_sn)
   * @param files 첨부 파일 (선택)
   */
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
    return axios.post<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/partner-files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * 연구과제 등록자(주관기관) 첨부파일 업로드 (multipart files, FileCodeType.RESEARCH_ADMIN_ATTACHED)
   * @param asmtSn 연구과제 ID
   * @param files 첨부 파일 (선택)
   */
  uploadAdminFiles: (asmtSn: number, files?: File[]) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const formData = new FormData();
    if (files?.length) {
      files.forEach((file) => formData.append("files", file, file.name));
    }
    return axios.post<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/admin-files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * 연구과제 등록자/관리자 첨부파일 삭제 (atchFileId 기준)
   * @param asmtSn 연구과제 ID
   * @param atchFileId 첨부파일ID(UUID)
   */
  deleteAdminFile: (asmtSn: number, atchFileId: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (!atchFileId) {
      throw new Error("첨부파일 ID는 필수입니다.");
    }
    const encoded = encodeURIComponent(atchFileId);
    return axios.delete<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/admin-files/${encoded}`);
  },

  /**
   * 참여기관 공유파일 삭제 (atchFileId 기준)
   * @param asmtSn 연구과제 ID
   * @param asmtPtcpInstSn 참여기관 일련번호
   * @param atchFileId 첨부파일ID(UUID)
   */
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
    return axios.delete<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/partner-files/${encoded}`, {
      params: { asmtPtcpInstSn },
    });
  },

  /**
   * 의견 등록
   * @param asmtSn 연구과제 ID
   * @param asmtMetaRsltSn 분석 데이터 ID
   * @param payload 의견 등록 요청 데이터
   */
  createOpinion: (asmtSn: number, asmtMetaRsltSn: number, payload: OpinionRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    return axios.post<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/analysis-data/${asmtMetaRsltSn}/opinion`, payload);
  },

  /**
   * 의견 수정
   * @param asmtSn 연구과제 ID
   * @param asmtMetaRsltSn 분석 데이터 ID
   * @param payload 의견 수정 요청 데이터
   */
  updateOpinion: (asmtSn: number, asmtMetaRsltSn: number, payload: OpinionRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/analysis-data/${asmtMetaRsltSn}/opinion`, payload);
  },

  /**
   * 의견 목록 조회
   * @param asmtSn 연구과제 ID
   * @param asmtMetaRsltSn 분석 데이터 ID
   * @returns 의견 목록
   */
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
    const response = await axios.get<OpinionListApiResponse>(`${BASE_URL}/${asmtSn}/analysis-data/${asmtMetaRsltSn}/opinion`, {
      params: { rsltGroupStcd },
    });
    return response;
  },

  /**
   * 참여기관 참여취소
   * @param asmtSn 연구과제 ID
   * @param instId 기관 ID
   * @param payload 참여취소 요청 데이터
   */
  cancelInvitePartner: (asmtSn: number, instId: number, payload: CancelInviteRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (instId == null || instId === undefined) {
      throw new Error("기관 ID는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/partners/${instId}/invite`, {
      action: "delete",
      asmtPtcpRtrcnRsn: payload.asmtPtcpRtrcnRsn,
    } as PartnerActionRequest);
  },

  /**
   * 참여기관 참여승인
   * @param asmtSn 연구과제 ID
   * @param ptcpInstSn 참여기관 일련번호
   */
  approveInvitePartner: (asmtSn: number, asmtPtcpInstSn: number | string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtPtcpInstSn == null || asmtPtcpInstSn === undefined) {
      throw new Error("참여기관 일련번호는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/partners/${asmtPtcpInstSn}/invite`, {
      action: "approve",
    } as PartnerActionRequest);
  },

  /**
   * 연구과제 상태 변경
   * @param asmtSn 연구과제 ID
   * @param asmtPrgrsSttsCd 과제진행상태코드 ("01" 참여요청, "02" 진행중, "03" 완료)
   */
  updateResearchStatus: (asmtSn: number, asmtPrgrsSttsCd: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtPrgrsSttsCd == null || asmtPrgrsSttsCd === undefined) {
      throw new Error("과제진행상태코드는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/status`, {
      asmtPrgrsSttsCd,
    });
  },

  /**
   * 분석 데이터 상태 수정
   * @param asmtSn 연구과제 ID
   * @param asmtMetaRsltSn 분석 데이터 ID
   * @param payload 분석 데이터 상태 수정 요청 데이터
   */
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
      `${BASE_URL}/${asmtSn}/analysis-data/${asmtMetaRsltSn}/status`,
      payload
    );
  },

  /**
   * 검토 요청 전송
   * @param asmtSn 연구과제 ID
   * @param asmtMetaRsltSn 분석 데이터 ID
   */
  sendReviewRequest: (asmtSn: number, asmtMetaRsltSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    return axios.post<ApiResponse<{ asmtMetaRsltSn: number }>>(
      `${BASE_URL}/${asmtSn}/analysis-data/${asmtMetaRsltSn}/review-request`,
      null
    );
  },

  /**
   * 검토 요청 마감
   * @param asmtSn 연구과제 ID
   * @param asmtMetaRsltSn 분석 데이터 ID
   */
  closeReview: (asmtSn: number, asmtMetaRsltSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtMetaRsltSn == null || asmtMetaRsltSn === undefined) {
      throw new Error("분석 데이터 ID는 필수입니다.");
    }
    return axios.post<ApiResponse<{ asmtMetaRsltSn: number }>>(
      `${BASE_URL}/${asmtSn}/analysis-data/${asmtMetaRsltSn}/review-close`,
      null
    );
  },

  /**
   * 의견 전체 상태 체크 (메타분석, 원천데이터 분석의 최신 데이터가 모두 검토완료인지 확인)
   * @param asmtSn 연구과제 ID
   * @returns 모두 검토완료인 경우 true, 아닌 경우 false
   */
  checkAllStatusCompleted: async (asmtSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const response = await axios.get<ApiResponse<boolean>>(`${BASE_URL}/${asmtSn}/analysis-data/all-status-check`);
    return response;
  },

  /**
   * 메타분석 접근 가능 여부 체크 (결과제외/활용미동의)
   * @param asmtSn 연구과제 ID
   */
  checkMetaAccess: async (asmtSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const response = await axios.get<ApiResponse<MetaAccessCheckResponse>>(
      `${BASE_URL}/${asmtSn}/analysis-data/meta-access-check`
    );
    return response;
  },

  /**
   * 결과제외 등 의견 목록 조회 (`GET .../analysis-data/opinion`, 평면 OpinionListResponse 배열)
   * @param asmtSn 연구과제 ID
   * @param instId 기관아이디 (선택)
   */
  getOpinionByCondition: async (asmtSn: number, instId?: string) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const params: { instId?: string } = {};
    if (instId) params.instId = instId;
    const response = await axios.get<ExcludedOpinionListApiResponse>(`${BASE_URL}/${asmtSn}/analysis-data/opinion`, { params });
    return response;
  },

  /**
   * 연구과제 마감
   * @param asmtSn 연구과제 ID
   * @param payload 마감 요청 데이터
   */
  closeResearch: (asmtSn: number, payload: CloseResearchRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/close`, payload);
  },

  /**
   * 연구과제 취소 (asmt_cls_cn, asmt_cls_dt 저장)
   * @param asmtSn 연구과제 ID
   * @param payload 취소 요청 데이터
   */
  cancelResearch: (asmtSn: number, payload: CancelResearchRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/cancel`, payload);
  },

  // =====================================
  // 연구과제: 댓글
  // =====================================

  getComments: async (asmtSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    return axios.get<ResearchCommentsApiResponse>(`${BASE_URL}/${asmtSn}/comments`);
  },

  createComment: (asmtSn: number, payload: ResearchCommentCreateRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    return axios.post<ApiResponse<any>>(`${BASE_URL}/${asmtSn}/comments`, payload);
  },

  updateComment: (asmtSn: number, asmtCmntSn: number, payload: ResearchCommentUpdateRequest) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtCmntSn == null || asmtCmntSn === undefined) {
      throw new Error("댓글 ID는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/comments/${asmtCmntSn}`, payload);
  },

  deleteComment: (asmtSn: number, asmtCmntSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    if (asmtCmntSn == null || asmtCmntSn === undefined) {
      throw new Error("댓글 ID는 필수입니다.");
    }
    return axios.delete<ApiResponse<void>>(`${BASE_URL}/${asmtSn}/comments/${asmtCmntSn}`);
  },

  /**
   * VDI/DB 계정 목록 조회 (searchAsmtAccounts - 관리자용 전체 목록)
   * @returns VDI/DB 계정 목록 (vdiType으로 VDI/DB 구분)
   */
  searchAsmtAccounts: async () => {
    const response = await axios.get<AsmtAccountListApiResponse>(`${BASE_URL}/accounts`);
    return response;
  },

  /**
   * 과제별 VDI/DB 계정 목록 조회
   * @param asmtSn 연구과제 ID
   * @returns 과제별 계정 목록
   */
  getAsmtAccounts: async (asmtSn: number) => {
    if (asmtSn == null || asmtSn === undefined) {
      throw new Error("연구과제 ID는 필수입니다.");
    }
    const response = await axios.get<AsmtAccountListApiResponse>(`${BASE_URL}/${asmtSn}/accounts`);
    return response;
  },

  /**
   * VDI/DB 계정 등록 (ADMIN 전용)
   */
  createAsmtAccount: (payload: AsmtAccountRequest) => {
    return axios.post<ApiResponse<void>>(`${BASE_URL}/accounts`, payload);
  },

  /**
   * VDI/DB 계정 수정 (ADMIN 전용)
   */
  updateAsmtAccount: (sqAsmtAccountSn: number, payload: AsmtAccountRequest) => {
    if (sqAsmtAccountSn == null || sqAsmtAccountSn === undefined) {
      throw new Error("계정 일련번호는 필수입니다.");
    }
    return axios.put<ApiResponse<void>>(`${BASE_URL}/accounts/${sqAsmtAccountSn}`, payload);
  },

  /**
   * VDI/DB 계정 삭제 (ADMIN 전용)
   */
  deleteAsmtAccount: (sqAsmtAccountSn: number) => {
    if (sqAsmtAccountSn == null || sqAsmtAccountSn === undefined) {
      throw new Error("계정 일련번호는 필수입니다.");
    }
    return axios.delete<ApiResponse<void>>(`${BASE_URL}/accounts/${sqAsmtAccountSn}`);
  },

  /**
   * 담당자 드롭다운용 직원 목록 (deptNos: 0000004,0000080 등)
   */
  searchAsmtPersonEmpOptions: (deptNos: string[]) => {
    const params = deptNos.length > 0 ? { deptNos: deptNos.join(",") } : {};
    return axios.get<EmpOptionListApiResponse>(`${BASE_URL}/asmt-persons/emp-options`, { params });
  },

  /**
   * 담당자 목록 (emp_nm, dept_no 포함)
   */
  searchAsmtPersons: () => {
    return axios.get<AsmtPersonListApiResponse>(`${BASE_URL}/asmt-persons`);
  },

  /**
   * 담당자 등록 (ADMIN 전용)
   */
  createAsmtPerson: (payload: AsmtPersonCreateRequest) => {
    return axios.post<ApiResponse<void>>(`${BASE_URL}/asmt-persons`, payload);
  },

  /**
   * 담당자 삭제 (ADMIN 전용)
   */
  deleteAsmtPerson: (personSn: number) => {
    if (personSn == null || personSn === undefined) {
      throw new Error("담당자 일련번호는 필수입니다.");
    }
    return axios.delete<ApiResponse<void>>(`${BASE_URL}/asmt-persons/${personSn}`);
  },

  // // =====================================
  // // Legacy API (for backward compatibility)
  // // =====================================
  // // 과제 목록 조회 (legacy)
  // getAllResearchs: () => axios.get<Research[]>(BASE_URL),
  // // 과제 상세 조회 (legacy)
  // getByIdResearch: (id: number) => axios.get<Research>(`${BASE_URL}/${id}`),
  // // 과제 생성 (legacy)
  // createResearch: (payload: Partial<Research>) => axios.post(BASE_URL, payload),
  // // 과제 수정 (legacy)
  // updateResearch: (id: number, payload: Partial<Research>) =>
  //   axios.put(`${BASE_URL}/${id}`, payload),
  // // 과제 삭제 (legacy)
  // removeResearch: (id: number) => axios.delete(`${BASE_URL}/${id}`),
  // // 과제 초대요청 상태 변경 (legacy)
  // changeStatusInviteResearch: (id: number, payload: Partial<{ desc: string }>) =>
  //   axios.put(`${BASE_URL}/${id}`, payload),
  // // 과제 진행중 상태 변경 (legacy)
  // changeStatusOpenResearch: (id: number, payload: Partial<{ desc: string }>) =>
  //   axios.put(`${BASE_URL}/${id}`, payload),
  // // 과제 마감 상태 변경 (legacy)
  // changeStatusCloseResearch: (id: number, payload: Partial<{ desc: string }>) =>
  //   axios.put(`${BASE_URL}/${id}`, payload),

  // // =====================================
  // // 연구과제: 참여기관 관리
  // // =====================================

  // // =====================================
  // // 연구과제: 통합분석 관리
  // // =====================================

  // // =====================================
  // // 연구과제: 기관분석 관리
  // // =====================================

  // // =====================================
  // // 연구과제: 메타분석 관리
  // // =====================================

  /**
   * 분석 데이터셋 조건 기반 복사 비동기 제출 (CDM 데이터 생성).
   * asmtSn만 전달하며, 서버에서 과제·참여기관(CDM)·최신 메타·엑셀·스키마를 조회 후 복사. 복사 완료 시 해당 과제가 진행 상태로 변경됨.
   */
  submitAnalysisDatasetCopy: async (params: { asmtSn: number }) => {
    const searchParams = new URLSearchParams({ asmtSn: String(params.asmtSn) });
    const response = await axios.post<ApiResponse<AnalysisDatasetTaskResponse>>(
      `${BASE_URL}/analysis-dataset?${searchParams.toString()}`
    );
    return response;
  },

  /**
   * 분석 데이터셋 복사 작업 상태 조회
   */
  getAnalysisDatasetTaskStatus: async (taskId: string) => {
    const response = await axios.get<ApiResponse<AnalysisDatasetTaskResponse>>(
      `${BASE_URL}/analysis-dataset/tasks/${encodeURIComponent(taskId)}`
    );
    return response;
  },
};
