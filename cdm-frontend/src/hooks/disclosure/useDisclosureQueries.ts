import { useQuery } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import type {
  DisclosureDetailResponse,
  DisclosureListApiResponse,
  DisclosurePartnerResponse,
  DisclosureSearchRequest,
} from "@/interfaces/disclosureInterface";
import { DisclosureAPI } from "@/api/disclosureApi";
import { disclosureKeys } from "./disclosureQueryKeys";

type DisclosureFileItem = Record<string, any>;

export function useDisclosureList(params: DisclosureSearchRequest) {
  return useQuery<AxiosResponse<DisclosureListApiResponse>, Error>({
    queryKey: [...disclosureKeys.listBase, params],
    queryFn: () => DisclosureAPI.getDisclosures(params),
    enabled: true,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useDisclosureDetail(pblntSn: string | null | undefined) {
  return useQuery<DisclosureDetailResponse, Error>({
    queryKey: disclosureKeys.detail(pblntSn),
    queryFn: async () => {
      if (!pblntSn) {
        throw new Error("공시번호가 필요합니다.");
      }
      const res = await DisclosureAPI.getDisclosureById(pblntSn);
      if (!res.data?.data) {
        throw new Error(res.data?.message || "공시 상세 조회에 실패했습니다.");
      }
      return res.data.data;
    },
    enabled: !!pblntSn,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useDisclosureFiles(pblntSn: string | null | undefined, ptcpInstSn?: string | null) {
  return useQuery<DisclosureFileItem[], Error>({
    queryKey: disclosureKeys.files(pblntSn, ptcpInstSn),
    queryFn: async () => {
      if (!pblntSn) {
        throw new Error("공시번호가 필요합니다.");
      }
      const res = await DisclosureAPI.getFilesByPblntSn(pblntSn, ptcpInstSn ?? null);
      return res.data?.data ?? [];
    },
    enabled: !!pblntSn,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useDisclosurePartners(pblntSn: string | null | undefined, enabled?: boolean) {
  return useQuery<DisclosurePartnerResponse[], Error>({
    queryKey: disclosureKeys.partners(pblntSn),
    queryFn: async () => {
      if (!pblntSn) {
        return [];
      }
      const res = await DisclosureAPI.getPartnersByPblntSn(pblntSn);
      const data = res.data?.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: (enabled !== undefined ? enabled : true) && !!pblntSn,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

/**
 * 취소사유 조회
 * - 서버에서 404를 주는 경우(사유 미존재)는 빈 문자열로 처리
 */
export function useDisclosureCancelReason(
  pblntSn: string | number | null | undefined,
  ptcpInstSn: string | number | null | undefined,
  enabled?: boolean
) {
  return useQuery<string, Error>({
    queryKey: disclosureKeys.cancelReason(pblntSn, ptcpInstSn),
    queryFn: async () => {
      if (!pblntSn || !ptcpInstSn) {
        return "";
      }
      try {
        const res = await DisclosureAPI.getCancelReason(Number(pblntSn), Number(ptcpInstSn));
        return res.data?.data?.cancelReason || "";
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return "";
        }
        throw error;
      }
    },
    enabled: (enabled !== undefined ? enabled : true) && !!pblntSn && !!ptcpInstSn,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
}
