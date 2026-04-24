// Research 관련 React Query Hooks
import { ResearchAPI } from "@/api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import type {
  AnalysisDataDetailResponse,
  AnalysisDataResponse,
  AsmtAccountResponse,
  AsmtPersonResponse,
  EmpOption,
  InstitutionWithOpinionsResponse,
  MetaAccessCheckResponse,
  OpinionListResponse,
  OrgAnalysisDataResponse,
  ResearchCommentDto,
  ResearchDetailResponse,
  ResearchFileItem,
  ResearchListResponse,
  ResearchPartnerResponse,
  ResearchSearchRequest,
} from "@/interfaces/researchInterface";
import { analysisDataKeys, opinionKeys, orgAnalysisDataKeys, researchCommentKeys, researchKeys } from "./researchQueryKeys";

// 연구과제 상세 조회
export function useResearchDetail(asmtSn: number | null | undefined) {
  return useQuery<ResearchDetailResponse, Error>({
    queryKey: researchKeys.detail(asmtSn),
    queryFn: async () => {
      if (!asmtSn) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      const res = await ResearchAPI.getResearchById(asmtSn);
      if (!res.data.data) {
        throw new Error(res.data.message || "연구과제 조회에 실패했습니다.");
      }
      return res.data.data;
    },
    enabled: !!asmtSn && !isNaN(asmtSn),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 연구과제 목록 조회
export function useResearchListByAdmin(params?: ResearchSearchRequest) {
  return useQuery<
    {
      data: ResearchListResponse[];
      page: number;
      length: number;
      total: number;
    },
    Error
  >({
    queryKey: researchKeys.listAdmin(params),
    queryFn: async () => {
      const res = await ResearchAPI.getResearchesByAdmin(params);
      return {
        data: res.data.data || [],
        page: res.data.page || 1,
        length: res.data.length || 10,
        total: res.data.total || 0,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 연구과제 목록 조회
export function useResearchListByPartner(params?: ResearchSearchRequest) {
  return useQuery<
    {
      data: ResearchListResponse[];
      page: number;
      length: number;
      total: number;
    },
    Error
  >({
    queryKey: researchKeys.listPartner(params),
    queryFn: async () => {
      const res = await ResearchAPI.getResearchesByPartner(params);
      return {
        data: res.data.data || [],
        page: res.data.page || 1,
        length: res.data.length || 10,
        total: res.data.total || 0,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 연구과제 파일 목록 조회 (uldTaskSeCd=01, fileSeCd 필터). ptcpInstSn 있으면 해당 참여기관 IRB만
export function useResearchFiles(
  asmtSn: number | null | undefined,
  fileSeCd: string,
  uldTaskSeCd?: string,
  enabled: boolean = true,
  ptcpInstSn?: number | null
) {
  return useQuery<ResearchFileItem[], Error>({
    queryKey: researchKeys.files(asmtSn, fileSeCd, uldTaskSeCd, ptcpInstSn),
    queryFn: async () => {
      if (!asmtSn) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      if (!fileSeCd) {
        throw new Error("fileSeCd가 필요합니다.");
      }
      const res = await ResearchAPI.getResearchFiles(asmtSn, fileSeCd, uldTaskSeCd, ptcpInstSn);
      return res.data.data ?? [];
    },
    enabled: enabled && !!asmtSn && !isNaN(asmtSn) && !!fileSeCd,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 연구과제 참여기관 목록 조회
export function useResearchPartners(asmtSn: number | null | undefined, enabled?: boolean) {
  return useQuery<ResearchPartnerResponse[], Error>({
    queryKey: researchKeys.researchPartners(asmtSn),
    queryFn: async () => {
      if (!asmtSn) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      const res = await ResearchAPI.getResearchPartners(asmtSn);
      return res.data.data || [];
    },
    enabled: (enabled !== undefined ? enabled : true) && !!asmtSn && !isNaN(asmtSn),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 연구과제 참여기관 단건 조회
export function useResearchPartner(asmtSn: number | null | undefined, ptcpInstSn: string | number | null | undefined) {
  return useQuery<ResearchPartnerResponse, Error>({
    queryKey: researchKeys.partner(asmtSn, ptcpInstSn),
    queryFn: async () => {
      if (!asmtSn) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      if (!ptcpInstSn) {
        throw new Error("참여기관 일련번호가 필요합니다.");
      }
      const res = await ResearchAPI.getResearchPartner(asmtSn, ptcpInstSn);
      if (!res.data.data) {
        throw new Error(res.data.message || "참여기관 조회에 실패했습니다.");
      }
      return res.data.data;
    },
    enabled: !!asmtSn && !isNaN(asmtSn) && !!ptcpInstSn,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

/** 멘션 팝업용: 과제 생성자(주관기관) + 참여기관 목록 (inst_id/brno, 기관명) */
export function useResearchMentionTargets(asmtSn: number | null | undefined, enabled?: boolean) {
  const detailQuery = useResearchDetail(asmtSn);
  const partnersQuery = useResearchPartners(asmtSn, enabled);

  const creator =
    detailQuery.data && detailQuery.data.instId
      ? { instId: detailQuery.data.instId, instNm: detailQuery.data.instNm ?? null }
      : null;

  return {
    creator,
    partners: partnersQuery.data ?? [],
    isLoading: detailQuery.isLoading || partnersQuery.isLoading,
    isError: detailQuery.isError || partnersQuery.isError,
    refetch: () => {
      detailQuery.refetch();
      partnersQuery.refetch();
    },
  };
}

// 분석 데이터 목록 조회
export function useAnalysisDataList(
  asmtSn: number | null | undefined,
  rsltGroupStcd?: string,
  instId?: string,
  enabled: boolean = true
) {
  return useQuery<AnalysisDataResponse[], Error>({
    queryKey: analysisDataKeys.list(asmtSn, rsltGroupStcd, instId),
    queryFn: async () => {
      if (!asmtSn) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      const res = await ResearchAPI.getAnalysisData(asmtSn, rsltGroupStcd, instId);
      return res.data.data || [];
    },
    enabled: enabled && !!asmtSn && !isNaN(asmtSn),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 분석 데이터 상세 조회
export function useAnalysisDataDetail(
  asmtSn: number | null | undefined,
  asmtMetaRsltSn: number | null | undefined,
  rsltGroupStcd: string,
  enabled?: boolean
) {
  return useQuery<AnalysisDataDetailResponse, Error>({
    queryKey: analysisDataKeys.detail(asmtSn, asmtMetaRsltSn, rsltGroupStcd),
    queryFn: async () => {
      if (!asmtSn) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      if (!asmtMetaRsltSn) {
        throw new Error("분석 데이터 ID가 필요합니다.");
      }
      const res = await ResearchAPI.getAnalysisDataDetail(asmtSn, asmtMetaRsltSn, rsltGroupStcd);
      if (!res.data.data) {
        throw new Error(res.data.message || "분석 데이터 조회에 실패했습니다.");
      }
      return res.data.data;
    },
    enabled: (enabled ?? true) && !!asmtSn && !isNaN(asmtSn) && !!asmtMetaRsltSn && !isNaN(asmtMetaRsltSn),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 최신 분석 데이터 상세 조회
export function useLatestAnalysisDataDetail(asmtSn: number | null | undefined, rsltGroupStcd: string, enabled: boolean = true) {
  return useQuery<AnalysisDataDetailResponse, Error>({
    queryKey: analysisDataKeys.latest(asmtSn, rsltGroupStcd),
    queryFn: async () => {
      if (!asmtSn) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      const res = await ResearchAPI.getLatestAnalysisDataDetail(asmtSn, rsltGroupStcd);
      if (!res.data.data) {
        throw new Error(res.data.message || "최신 분석 데이터 조회에 실패했습니다.");
      }
      return res.data.data;
    },
    enabled: enabled && !!asmtSn && !isNaN(asmtSn),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 의견 목록 조회 (기관 기준: 기관정보 + 해당 기관 의견 목록)
export function useOpinionList(
  asmtSn: number | null | undefined,
  asmtMetaRsltSn: number | null | undefined,
  rsltGroupStcd: string,
  enabled: boolean = true
) {
  return useQuery<InstitutionWithOpinionsResponse[], Error>({
    queryKey: opinionKeys.list(asmtSn, asmtMetaRsltSn, rsltGroupStcd),
    queryFn: async () => {
      if (!asmtSn) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      if (!asmtMetaRsltSn) {
        throw new Error("분석 데이터 ID가 필요합니다.");
      }
      const res = await ResearchAPI.getOpinionList(asmtSn, asmtMetaRsltSn, rsltGroupStcd);
      return res.data.data || [];
    },
    enabled: enabled && !!asmtSn && !isNaN(asmtSn) && !!asmtMetaRsltSn && !isNaN(asmtMetaRsltSn),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// Non-CDM 기관 분석 데이터 목록 조회
export function useOrgAnalysisDataList(asmtSn: number | null | undefined, rsltGroupStcd: string, enabled: boolean = true) {
  return useQuery<OrgAnalysisDataResponse[], Error>({
    queryKey: orgAnalysisDataKeys.list(asmtSn, rsltGroupStcd),
    queryFn: async () => {
      if (!asmtSn) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      const res = await ResearchAPI.getOrgAnalysisData(asmtSn, rsltGroupStcd);
      return res.data.data || [];
    },
    enabled: enabled && !!asmtSn && !isNaN(asmtSn),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 의견 조회 (결과제외, utlz_agre_se_cd=08 등 — `GET .../analysis-data/opinion` 평면 배열)
export function useOpinionByCondition(asmtSn: number | null | undefined, instId?: string, enabled: boolean = true) {
  return useQuery<OpinionListResponse[], Error>({
    queryKey: opinionKeys.condition(asmtSn, instId),
    queryFn: async () => {
      if (!asmtSn) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      const res = await ResearchAPI.getOpinionByCondition(asmtSn, instId);
      return res.data.data || [];
    },
    enabled: enabled && !!asmtSn && !isNaN(asmtSn),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 메타분석(02), 원천데이터 분석(03) 최신 데이터 모두 검토완료 여부 조회
export function useCheckAllStatusCompleted(asmtSn: number | null | undefined, enabled: boolean = false) {
  return useQuery<boolean, Error>({
    queryKey: researchKeys.checkAllStatusCompleted(asmtSn),
    queryFn: async () => {
      if (!asmtSn || isNaN(asmtSn)) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      const res = await ResearchAPI.checkAllStatusCompleted(asmtSn);
      return res.data.data ?? false;
    },
    enabled: enabled && !!asmtSn && !isNaN(asmtSn),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 메타분석 접근 가능 여부 조회 (결과제외/활용미동의 체크)
export function useCheckMetaAccess(asmtSn: number | null | undefined, enabled: boolean = false) {
  return useQuery<MetaAccessCheckResponse, Error>({
    queryKey: researchKeys.checkMetaAccess(asmtSn),
    queryFn: async () => {
      if (!asmtSn || isNaN(asmtSn)) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      const res = await ResearchAPI.checkMetaAccess(asmtSn);
      return res.data.data ?? { canAccessMetaResult: true, denyReasonCode: null };
    },
    enabled: enabled && !!asmtSn && !isNaN(asmtSn),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 과제 댓글 목록 조회
export function useResearchComments(asmtSn: number | null | undefined, enabled: boolean = true) {
  return useQuery<ResearchCommentDto[], Error>({
    queryKey: researchCommentKeys.list(asmtSn),
    queryFn: async () => {
      if (!asmtSn) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      const res = await ResearchAPI.getComments(asmtSn);
      return res.data.data || [];
    },
    enabled: enabled && !!asmtSn && !isNaN(asmtSn),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// VDI/DB 계정 전체 목록 조회 (searchAsmtAccounts - 설정 페이지용, vdiType으로 VDI/DB 구분)
export function useSearchAsmtAccounts() {
  return useQuery<AsmtAccountResponse[], Error>({
    queryKey: researchKeys.searchAsmtAccounts(),
    queryFn: async () => {
      const res = await ResearchAPI.searchAsmtAccounts();
      return res.data.data || [];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 과제별 VDI/DB 계정 목록 조회
export function useAsmtAccounts(asmtSn: number, enabled: boolean = true) {
  return useQuery<AsmtAccountResponse[], Error>({
    queryKey: researchKeys.asmtAccounts(asmtSn),
    queryFn: async () => {
      if (!asmtSn) {
        throw new Error("연구과제 ID가 필요합니다.");
      }
      const res = await ResearchAPI.getAsmtAccounts(asmtSn);
      return res.data.data || [];
    },
    enabled: enabled && !!asmtSn && !isNaN(asmtSn),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 라우트 파라미터(asmtSn)로 과제별 VDI/DB 계정 목록 조회 (setting/:asmtSn 페이지용)
export function useAsmtAccountsFromRoute() {
  const { asmtSn: asmtSnParam } = useParams<"asmtSn">();
  const asmtSn = asmtSnParam != null ? Number(asmtSnParam) : NaN;
  return useAsmtAccounts(asmtSn, !Number.isNaN(asmtSn));
}

// 담당자 드롭다운용 직원 목록 (deptNos: ['0000004', '0000080'] 등)
export function useAsmtPersonEmpOptions(deptNos: string[]) {
  return useQuery<EmpOption[], Error>({
    queryKey: researchKeys.asmtPersonEmpOptions(deptNos),
    queryFn: async () => {
      const res = await ResearchAPI.searchAsmtPersonEmpOptions(deptNos);
      return res.data.data ?? [];
    },
    enabled: Array.isArray(deptNos) && deptNos.length > 0,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// 담당자 목록 (emp_nm, dept_no 포함, Chip 표시용)
export function useAsmtPersonList() {
  return useQuery<AsmtPersonResponse[], Error>({
    queryKey: researchKeys.asmtPersonList(),
    queryFn: async () => {
      const res = await ResearchAPI.searchAsmtPersons();
      return res.data.data ?? [];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}
