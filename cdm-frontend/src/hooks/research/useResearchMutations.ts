// Research 관련 React Query Mutations
import { ResearchAPI } from "@/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ANALYSIS_RESULT_STATUS } from "@/constants/types";
import { ANALYSIS_RESULT_REVIEW_IN_PROGRESS_CODES } from "@/constants/types";
import type { ApiResponse } from "@/interfaces/commonInterface";
import type {
  AnalysisDataRequest,
  AnalysisDatasetTaskResponse,
  AsmtAccountRequest,
  AsmtPersonCreateRequest,
  CancelInviteRequest,
  CancelResearchRequest,
  CloseResearchRequest,
  OpinionRequest,
  PartnerCreateRequest,
  ResearchCommentCreateRequest,
  ResearchCommentUpdateRequest,
  ResearchCreateResponse,
  ResearchUpdateRequest,
} from "@/interfaces/researchInterface";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { analysisDataKeys, opinionKeys, orgAnalysisDataKeys, researchCommentKeys, researchKeys } from "./researchQueryKeys";

// 연구과제 등록 (항상 multipart FormData)
export function useCreateResearch() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<ResearchCreateResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const res = await ResearchAPI.createResearch(formData);
      if (!res.data.data) {
        throw new Error(res.data.message || "연구과제 생성에 실패했습니다.");
      }
      return res.data.data;
    },
    onSuccess: (data) => {
      // 관련 쿼리 무효화하여 자동 refetch
      queryClient.invalidateQueries({ queryKey: researchKeys.listBase });
      queryClient.invalidateQueries({ queryKey: researchKeys.detail(data.asmtSn) });

      showAlert({
        message: "연구과제를 등록했습니다.",
        severity: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "연구과제 등록에 실패했습니다. 다시 시도해주세요.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 연구과제 수정 (항상 multipart FormData + deleteFileIds)
export function useUpdateResearch() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  type UpdatePayload = {
    asmtSn: number;
    data: ResearchUpdateRequest;
    formData: FormData;
    deleteFileIds?: string[];
  };

  return useMutation<void, Error, UpdatePayload>({
    mutationFn: async ({ asmtSn, formData, deleteFileIds }) => {
      await ResearchAPI.updateResearch(asmtSn, formData, deleteFileIds);
      return;
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: researchKeys.listBase });
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });

      showAlert({
        message: "연구과제를 수정했습니다.",
        severity: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "연구과제 수정에 실패했습니다. 다시 시도해주세요.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 연구과제 삭제
export function useRemoveResearch() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, number>({
    mutationFn: async (asmtSn: number) => {
      await ResearchAPI.removeResearch(asmtSn);
      return;
    },
    onSuccess: (_, asmtSn) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: researchKeys.listBase });
      // 삭제된 항목의 상세 조회 캐시 제거
      queryClient.removeQueries({ queryKey: researchKeys.detail(asmtSn) });

      showAlert({
        message: "연구과제를 삭제했습니다.",
        severity: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "연구과제 삭제에 실패했습니다. 다시 시도해주세요.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 참여기관 정보 저장
export function useCreatePartners() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { asmtSn: number; data: PartnerCreateRequest }>({
    mutationFn: async ({ asmtSn, data }) => {
      await ResearchAPI.createPartners(asmtSn, data);
      return;
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화하여 자동 refetch
      queryClient.invalidateQueries({
        queryKey: researchKeys.researchPartners(variables.asmtSn),
      });
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });

      showAlert({
        message: "참여기관 정보가 저장되었습니다.",
        severity: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || "참여기관 정보 저장에 실패했습니다. 다시 시도해주세요.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 참여기관 참여취소
export function useCancelInvitePartner() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { asmtSn: number; asmtPtcpInstSn: number; data: CancelInviteRequest }>({
    mutationFn: async ({ asmtSn, asmtPtcpInstSn, data }) => {
      await ResearchAPI.cancelInvitePartner(asmtSn, asmtPtcpInstSn, data);
      return;
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화하여 자동 refetch
      queryClient.invalidateQueries({
        queryKey: researchKeys.researchPartners(variables.asmtSn),
      });
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });
      queryClient.invalidateQueries({
        queryKey: researchKeys.partner(variables.asmtSn, variables.asmtPtcpInstSn),
      });

      showAlert({
        message: "참여취소가 완료되었습니다.",
        severity: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "참여취소에 실패했습니다. 다시 시도해주세요.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 참여기관 참여승인
export function useApproveInvitePartner() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { asmtSn: number; asmtPtcpInstSn: number | string }>({
    mutationFn: async ({ asmtSn, asmtPtcpInstSn }) => {
      await ResearchAPI.approveInvitePartner(asmtSn, asmtPtcpInstSn);
      return;
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화하여 자동 refetch
      queryClient.invalidateQueries({
        queryKey: researchKeys.researchPartners(variables.asmtSn),
      });
      queryClient.invalidateQueries({
        queryKey: researchKeys.partner(variables.asmtSn, variables.asmtPtcpInstSn),
      });
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });

      showAlert({
        message: "연구과제에 참여하셨습니다.\n연구과제의 상태가 진행중으로 변경되면 이메일로 알려드립니다.",
        severity: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "참여승인에 실패했습니다. 다시 시도해주세요.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 의견 등록
export function useCreateOpinion() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<
    void,
    Error,
    {
      asmtSn: number;
      asmtMetaRsltSn: number;
      data: OpinionRequest;
      rsltGroupStcd: string;
    }
  >({
    mutationFn: async ({ asmtSn, asmtMetaRsltSn, data }) => {
      const response = await ResearchAPI.createOpinion(asmtSn, asmtMetaRsltSn, data);
      if (response.data.status === "fail") {
        throw new Error(response.data.message || "의견 등록에 실패했습니다.");
      }
      return;
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화 및 의견 목록(useOpinionList) refetch
      const opinionListKey = opinionKeys.list(variables.asmtSn, variables.asmtMetaRsltSn, variables.rsltGroupStcd);
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.detail(variables.asmtSn, variables.asmtMetaRsltSn, variables.rsltGroupStcd),
      });
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });
      queryClient.invalidateQueries({ queryKey: opinionListKey });
      queryClient.refetchQueries({ queryKey: opinionListKey });
      const orgListKey = orgAnalysisDataKeys.list(variables.asmtSn, variables.rsltGroupStcd);
      queryClient.invalidateQueries({ queryKey: orgListKey });
      queryClient.refetchQueries({ queryKey: orgListKey });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.latest(variables.asmtSn, variables.rsltGroupStcd),
      });
    },
    onError: (error: any) => {
      if (error.message) {
        showAlert({
          message: error.message,
          severity: "error",
        });
      } else {
        showAlert({
          message: "검토 결과 변경에 실패했습니다. 다시 시도해 주세요.",
          severity: "error",
        });
      }
    },
  });
}

// 의견 수정
export function useUpdateOpinion() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<
    void,
    Error,
    {
      asmtSn: number;
      asmtMetaRsltSn: number;
      rsltGroupStcd: string;
      data: OpinionRequest;
    }
  >({
    mutationFn: async ({ asmtSn, asmtMetaRsltSn, data }) => {
      const response = await ResearchAPI.updateOpinion(asmtSn, asmtMetaRsltSn, data);
      if (response.data.status === "fail") {
        throw new Error(response.data.message || "의견 수정에 실패했습니다.");
      }
      return;
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화 및 의견 목록(useOpinionList) refetch
      const opinionListKey = opinionKeys.list(variables.asmtSn, variables.asmtMetaRsltSn, variables.rsltGroupStcd);
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.detail(variables.asmtSn, variables.asmtMetaRsltSn, variables.rsltGroupStcd),
      });
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });
      queryClient.invalidateQueries({ queryKey: opinionListKey });
      queryClient.refetchQueries({ queryKey: opinionListKey });
      const orgListKey = orgAnalysisDataKeys.list(variables.asmtSn, variables.rsltGroupStcd);
      queryClient.invalidateQueries({ queryKey: orgListKey });
      queryClient.refetchQueries({ queryKey: orgListKey });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.latest(variables.asmtSn, variables.rsltGroupStcd),
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "검토 결과 등록에 실패했습니다.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 분석 데이터 생성
export function useCreateAnalysisData() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<
    number,
    Error,
    { asmtSn: number; data: AnalysisDataRequest; files?: File[]; datasetFiles?: File[]; vdiFiles?: File[] }
  >({
    mutationFn: async ({ asmtSn, data, files, datasetFiles, vdiFiles }) => {
      const response = await ResearchAPI.createAnalysisData(asmtSn, data, files, datasetFiles, vdiFiles);
      if (response.data.status === "fail") {
        throw new Error(response.data.message || "분석 데이터 생성에 실패했습니다.");
      }
      return response.data.data?.asmtMetaRsltSn || 0;
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화하여 자동 refetch
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.listPrefix(variables.asmtSn, variables.data.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.latest(variables.asmtSn, variables.data.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });

      showAlert({
        message: "저장되었습니다.",
        severity: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "저장에 실패했습니다.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 분석 데이터 수정
export function useUpdateAnalysisData() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<
    void,
    Error,
    {
      asmtSn: number;
      asmtMetaRsltSn: number;
      data: AnalysisDataRequest;
      deleteFileIds?: string[];
      deleteDatasetFileIds?: string[];
      deleteVdiFileIds?: string[];
      files?: File[];
      datasetFiles?: File[];
      vdiFiles?: File[];
    }
  >({
    mutationFn: async ({
      asmtSn,
      asmtMetaRsltSn,
      data,
      files,
      datasetFiles,
      vdiFiles,
      deleteFileIds,
      deleteDatasetFileIds,
      deleteVdiFileIds,
    }) => {
      const response = await ResearchAPI.updateAnalysisData(
        asmtSn,
        asmtMetaRsltSn,
        data,
        files,
        datasetFiles,
        vdiFiles,
        deleteFileIds,
        deleteDatasetFileIds,
        deleteVdiFileIds
      );
      if (response.data.status === "fail") {
        throw new Error(response.data.message || "분석 데이터 수정에 실패했습니다.");
      }
      return;
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화하여 자동 refetch
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.detail(variables.asmtSn, variables.asmtMetaRsltSn, variables.data.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.listPrefix(variables.asmtSn, variables.data.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.latest(variables.asmtSn, variables.data.rsltGroupCd),
      });
      // queryClient.invalidateQueries({
      //   queryKey: ["research", "detail", variables.asmtSn],
      // });

      showAlert({
        message: "저장되었습니다.",
        severity: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "저장에 실패했습니다.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 연구과제 상태 변경
export function useUpdateResearchStatus() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { asmtSn: number; asmtPrgrsSttsCd: string }>({
    mutationFn: async ({ asmtSn, asmtPrgrsSttsCd }) => {
      await ResearchAPI.updateResearchStatus(asmtSn, asmtPrgrsSttsCd);
      return;
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화하여 자동 refetch
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });
      queryClient.invalidateQueries({ queryKey: researchKeys.listBase });

      showAlert({
        message: "과제 상태가 변경되었습니다.",
        severity: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || "과제 상태 변경에 실패했습니다. 다시 시도해주세요.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

/** 분석 데이터셋 복사(CDM 데이터 생성) 비동기 제출. 복사 완료 시 서버에서 과제를 진행 상태로 변경 */
export function useSubmitAnalysisDatasetCopy() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<AnalysisDatasetTaskResponse, Error, { asmtSn: number }>({
    mutationFn: async (params) => {
      const res = await ResearchAPI.submitAnalysisDatasetCopy(params);
      if (!res.data?.data) throw new Error(res.data?.message ?? "복사 요청 실패");
      return res.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: researchKeys.detail(variables.asmtSn) });
      queryClient.invalidateQueries({ queryKey: researchKeys.listBase });
      showAlert({
        message: "CDM 데이터 복사가 시작되었습니다. 완료되면 과제가 진행 상태로 전환됩니다.",
        severity: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "CDM 데이터 복사 요청에 실패했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    },
  });
}

// 분석 데이터 상태 수정 (검토 요청 등)
export function useUpdateAnalysisDataStatus() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<
    { asmtMetaRsltSn: number },
    Error,
    {
      asmtSn: number;
      asmtMetaRsltSn: number;
      asmtMetaRsltSttsCd: ANALYSIS_RESULT_STATUS;
      rsltGroupCd: string;
    }
  >({
    mutationFn: async ({ asmtSn, asmtMetaRsltSn, asmtMetaRsltSttsCd, rsltGroupCd }) => {
      const response = await ResearchAPI.updateAnalysisDataStatus(asmtSn, asmtMetaRsltSn, {
        asmtMetaRsltSttsCd,
        rsltGroupCd,
      });
      if (response.data.status === "fail") {
        throw new Error(response.data.message || "분석 데이터 상태 변경에 실패했습니다.");
      }
      return response.data.data || { asmtMetaRsltSn };
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화하여 자동 refetch
      queryClient.invalidateQueries({
        queryKey: opinionKeys.list(variables.asmtSn, variables.asmtMetaRsltSn, variables.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.detail(variables.asmtSn, variables.asmtMetaRsltSn, variables.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.listPrefix(variables.asmtSn, variables.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.latest(variables.asmtSn, variables.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });

      if (ANALYSIS_RESULT_REVIEW_IN_PROGRESS_CODES.includes(variables.asmtMetaRsltSttsCd)) {
        showAlert({
          message: "검토 진행중으로 변경되었습니다, 검토 후 결과를 등록해주세요.",
          severity: "info",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || "분석 데이터 상태 변경에 실패했습니다. 다시 시도해주세요.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 검토 요청 전용 (REQUEST_REVIEW 전송)
export function useSendReviewRequest() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<
    { asmtMetaRsltSn: number },
    Error,
    {
      asmtSn: number;
      asmtMetaRsltSn: number;
      // 상태 전환 후 필요한 쿼리 무효화를 위해 컴포넌트에서 전달
      rsltGroupCd: string;
    }
  >({
    mutationFn: async ({ asmtSn, asmtMetaRsltSn }) => {
      const response = await ResearchAPI.sendReviewRequest(asmtSn, asmtMetaRsltSn);
      if (response.data.status === "fail") {
        throw new Error(response.data.message || "검토 요청 전송에 실패했습니다.");
      }
      return response.data.data || { asmtMetaRsltSn };
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화하여 자동 refetch
      queryClient.invalidateQueries({
        queryKey: opinionKeys.list(variables.asmtSn, variables.asmtMetaRsltSn, variables.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.detail(variables.asmtSn, variables.asmtMetaRsltSn, variables.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.listPrefix(variables.asmtSn, variables.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.latest(variables.asmtSn, variables.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });
    },
    onError: () => {
      showAlert({
        message: "검토 요청 전송에 실패했습니다. 다시 시도해 주세요.",
        severity: "error",
      });
    },
  });
}

// 검토 요청 마감 전용
export function useCloseReview() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<
    { asmtMetaRsltSn: number },
    Error,
    {
      asmtSn: number;
      asmtMetaRsltSn: number;
      rsltGroupCd: string;
    }
  >({
    mutationFn: async ({ asmtSn, asmtMetaRsltSn }) => {
      const response = await ResearchAPI.closeReview(asmtSn, asmtMetaRsltSn);
      if (response.data.status === "fail") {
        throw new Error(response.data.message || "검토 요청 마감에 실패했습니다.");
      }
      return response.data.data || { asmtMetaRsltSn };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: opinionKeys.list(variables.asmtSn, variables.asmtMetaRsltSn, variables.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.detail(variables.asmtSn, variables.asmtMetaRsltSn, variables.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.listPrefix(variables.asmtSn, variables.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: analysisDataKeys.latest(variables.asmtSn, variables.rsltGroupCd),
      });
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || "검토 요청 마감에 실패했습니다. 다시 시도해주세요.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 연구과제 마감
export function useCloseResearch() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<ApiResponse<void>, Error, { asmtSn: number; data: CloseResearchRequest }>({
    mutationFn: async ({ asmtSn, data }) => {
      const response = await ResearchAPI.closeResearch(asmtSn, data);
      return response.data;
    },
    onSuccess: (response: ApiResponse<void>, variables) => {
      // 관련 쿼리 무효화하여 자동 refetch
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });
      queryClient.invalidateQueries({ queryKey: researchKeys.listBase });

      if (response.status === "success") {
        showAlert({
          message: "연구과제가 종료되었습니다.",
          severity: "success",
        });
      } else {
        showAlert({
          message: response.message,
          severity: "warning",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "연구과제 마감에 실패했습니다. 다시 시도해주세요.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 연구과제 취소
export function useCancelResearch() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<ApiResponse<void>, Error, { asmtSn: number; data: CancelResearchRequest }>({
    mutationFn: async ({ asmtSn, data }) => {
      const response = await ResearchAPI.cancelResearch(asmtSn, data);
      return response.data;
    },
    onSuccess: (response: ApiResponse<void>, variables) => {
      queryClient.invalidateQueries({
        queryKey: researchKeys.detail(variables.asmtSn),
      });
      queryClient.invalidateQueries({ queryKey: researchKeys.listBase });

      if (response.status === "success") {
        showAlert({
          message: "연구과제가 취소되었습니다.",
          severity: "success",
        });
      } else {
        showAlert({
          message: response.message,
          severity: "warning",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "연구과제 취소에 실패했습니다. 다시 시도해주세요.";
      showAlert({
        message: errorMessage,
        severity: "error",
      });
    },
  });
}

// 과제 댓글 등록
export function useCreateResearchComment() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { asmtSn: number; data: ResearchCommentCreateRequest }>({
    mutationFn: async ({ asmtSn, data }) => {
      const res = await ResearchAPI.createComment(asmtSn, data);
      if (res.data.status === "fail") {
        throw new Error(res.data.message || "댓글 등록에 실패했습니다.");
      }
      return;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: researchCommentKeys.list(variables.asmtSn),
      });
      showAlert({ message: "댓글이 등록되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "댓글 등록에 실패했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    },
  });
}

// 과제 댓글 수정
export function useUpdateResearchComment() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { asmtSn: number; asmtCmntSn: number; data: ResearchCommentUpdateRequest }>({
    mutationFn: async ({ asmtSn, asmtCmntSn, data }) => {
      const res = await ResearchAPI.updateComment(asmtSn, asmtCmntSn, data);
      if (res.data.status === "fail") {
        throw new Error(res.data.message || "댓글 수정에 실패했습니다.");
      }
      return;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: researchCommentKeys.list(variables.asmtSn),
      });
      showAlert({ message: "댓글이 수정되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "댓글 수정에 실패했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    },
  });
}

// 과제 댓글 삭제
export function useDeleteResearchComment() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { asmtSn: number; asmtCmntSn: number }>({
    mutationFn: async ({ asmtSn, asmtCmntSn }) => {
      const res = await ResearchAPI.deleteComment(asmtSn, asmtCmntSn);
      if (res.data.status === "fail") {
        throw new Error(res.data.message || "댓글 삭제에 실패했습니다.");
      }
      return;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: researchCommentKeys.list(variables.asmtSn),
      });
      showAlert({ message: "댓글이 삭제되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "댓글 삭제에 실패했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    },
  });
}

// VDI/DB 계정 등록 (ADMIN 전용)
export function useCreateAsmtAccount() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { data: AsmtAccountRequest }>({
    mutationFn: async ({ data }) => {
      const res = await ResearchAPI.createAsmtAccount(data);
      if (res.data.status === "fail") {
        throw new Error(res.data.message || "계정 등록에 실패했습니다.");
      }
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.searchAsmtAccounts() });
      showAlert({ message: "계정이 등록되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "계정 등록에 실패했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    },
  });
}

// VDI/DB 계정 수정 (ADMIN 전용)
export function useUpdateAsmtAccount() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { sqAsmtAccountSn: number; payload: AsmtAccountRequest }>({
    mutationFn: async ({ sqAsmtAccountSn, payload }) => {
      const res = await ResearchAPI.updateAsmtAccount(sqAsmtAccountSn, payload);
      if (res.data.status === "fail") {
        throw new Error(res.data.message || "계정 수정에 실패했습니다.");
      }
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.searchAsmtAccounts() });
      showAlert({ message: "계정이 수정되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "계정 수정에 실패했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    },
  });
}

// VDI/DB 계정 삭제 (ADMIN 전용)
export function useDeleteAsmtAccount() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { sqAsmtAccountSn: number }>({
    mutationFn: async ({ sqAsmtAccountSn }) => {
      const res = await ResearchAPI.deleteAsmtAccount(sqAsmtAccountSn);
      if (res.data.status === "fail") {
        throw new Error(res.data.message || "계정 삭제에 실패했습니다.");
      }
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.searchAsmtAccounts() });
      showAlert({ message: "계정이 삭제되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "계정 삭제에 실패했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    },
  });
}

// 담당자 등록 (ADMIN 전용)
export function useCreateAsmtPerson() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, AsmtPersonCreateRequest>({
    mutationFn: async (payload) => {
      const res = await ResearchAPI.createAsmtPerson(payload);
      if (res.data.status === "fail") {
        throw new Error(res.data.message || "담당자 등록에 실패했습니다.");
      }
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.asmtPersonList() });
      showAlert({ message: "담당자가 등록되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "담당자 등록에 실패했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    },
  });
}

// 담당자 삭제 (ADMIN 전용)
export function useDeleteAsmtPerson() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { personSn: number }>({
    mutationFn: async ({ personSn }) => {
      const res = await ResearchAPI.deleteAsmtPerson(personSn);
      if (res.data.status === "fail") {
        throw new Error(res.data.message || "담당자 삭제에 실패했습니다.");
      }
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.asmtPersonList() });
      showAlert({ message: "담당자가 삭제되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "담당자 삭제에 실패했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    },
  });
}
