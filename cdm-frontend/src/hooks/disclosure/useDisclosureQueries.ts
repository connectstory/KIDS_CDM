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

export interface DisclosureCancelReasonView {
  cancelReason: string;
  rgtrId: string;
  rgtrNm: string;
  regDt: string;
  canEdit: boolean;
}

/**
 * 취소사유 조회 (사유·등록자·수정 가능 여부)
 */
export function useDisclosureCancelReason(
  pblntSn: string | number | null | undefined,
  ptcpInstSn: string | number | null | undefined,
  enabled?: boolean
) {
  return useQuery<DisclosureCancelReasonView, Error>({
    queryKey: disclosureKeys.cancelReason(pblntSn, ptcpInstSn),
    queryFn: async () => {
      if (!pblntSn || !ptcpInstSn) {
        return { cancelReason: "", rgtrId: "", rgtrNm: "", regDt: "", canEdit: true };
      }
      try {
        const res = await DisclosureAPI.getCancelReason(Number(pblntSn), Number(ptcpInstSn));
        const d = res.data?.data as
          | { cancelReason?: string; rgtrId?: string; rgtrNm?: string; regDt?: string; canEdit?: boolean }
          | undefined;
        return {
          cancelReason: d?.cancelReason ?? "",
          rgtrId: d?.rgtrId ?? "",
          rgtrNm: d?.rgtrNm ?? "",
          regDt: d?.regDt ?? "",
          canEdit: d?.canEdit !== false,
        };
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return { cancelReason: "", rgtrId: "", rgtrNm: "", regDt: "", canEdit: true };
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
