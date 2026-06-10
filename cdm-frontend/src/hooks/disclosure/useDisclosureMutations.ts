import { DisclosureAPI } from "@/api/disclosureApi";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import type {
  DisclosureCreateRequest,
  DisclosurePartnerRequest,
  DisclosureUpdateRequest,
} from "@/interfaces/disclosureInterface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { disclosureKeys } from "./disclosureQueryKeys";

export function useDeleteDisclosure() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, string | number>({
    mutationFn: async (pblntSn) => {
      await DisclosureAPI.deleteDisclosure(pblntSn);
    },
    onSuccess: (_, pblntSn) => {
      queryClient.invalidateQueries({ queryKey: disclosureKeys.listBase });
      queryClient.removeQueries({ queryKey: disclosureKeys.detail(pblntSn) });
      showAlert({ message: "공시가 성공적으로 삭제되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "공시 삭제 중 오류가 발생했습니다.";
      showAlert({ message, severity: "error" });
    },
  });
}

export function useRequestDisclosurePartnerStatus() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<
    void,
    Error,
    {
      pblntSn: string | number;
      ptcpInstSn: number;
      status?: string;
      reason?: string;
      successMessage?: string;
    }
  >({
    mutationFn: async ({ pblntSn, ptcpInstSn, status, reason }) => {
      await DisclosureAPI.requestPartnerStatus(pblntSn, ptcpInstSn, status, reason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disclosureKeys.partners(variables.pblntSn) });
      queryClient.invalidateQueries({ queryKey: disclosureKeys.detail(variables.pblntSn) });
      queryClient.invalidateQueries({
        queryKey: disclosureKeys.cancelReason(variables.pblntSn, variables.ptcpInstSn),
      });
      if (variables.successMessage) {
        showAlert({ message: variables.successMessage, severity: "success" });
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "참여기관 처리 중 오류가 발생했습니다.";
      showAlert({ message, severity: "error" });
    },
  });
}

export function useAddDisclosurePartners() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { pblntSn: string | number; data: DisclosurePartnerRequest }>({
    mutationFn: async ({ pblntSn, data }) => {
      await DisclosureAPI.addPartners(pblntSn, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disclosureKeys.partners(variables.pblntSn) });
      queryClient.invalidateQueries({ queryKey: disclosureKeys.detail(variables.pblntSn) });
      showAlert({ message: "참여기관이 성공적으로 동기화되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "참여기관 동기화 중 오류가 발생했습니다.";
      showAlert({ message, severity: "error" });
    },
  });
}

export function useCloseDisclosure() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { pblntSn: string | number }>({
    mutationFn: async ({ pblntSn }) => {
      await DisclosureAPI.closeDisclosure(pblntSn);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disclosureKeys.detail(variables.pblntSn) });
      queryClient.invalidateQueries({ queryKey: disclosureKeys.partners(variables.pblntSn) });
      queryClient.invalidateQueries({ queryKey: disclosureKeys.files(variables.pblntSn) });
      queryClient.invalidateQueries({ queryKey: disclosureKeys.listBase });
      showAlert({ message: "공시가 마감되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "공시마감 중 오류가 발생했습니다.";
      showAlert({ message, severity: "error" });
    },
  });
}

/** 공시 등록 (생성 후 `pblntSn` 반환; 성공 알림은 호출부에서 처리) */
export function useCreateDisclosure() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<{ pblntSn: number }, Error, DisclosureCreateRequest>({
    mutationFn: async (payload) => {
      const res = await DisclosureAPI.createDisclosure(payload);
      const created = res.data?.data?.pblntSn;
      if (created == null) {
        throw new Error(res.data?.message ?? "공시 등록 중 응답이 올바르지 않습니다.");
      }
      return { pblntSn: Number(created) };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: disclosureKeys.listBase });
      queryClient.invalidateQueries({ queryKey: disclosureKeys.detail(String(data.pblntSn)) });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "공시 등록 중 오류가 발생했습니다.";
      showAlert({ message, severity: "error" });
    },
  });
}

/** 공시 수정 (성공 알림은 호출부에서 처리; PUT 본문) */
export function useUpdateDisclosure() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { pblntSn: string | number; data: DisclosureUpdateRequest }>({
    mutationFn: async ({ pblntSn, data }) => {
      await DisclosureAPI.updateDisclosure(pblntSn, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disclosureKeys.detail(String(variables.pblntSn)) });
      queryClient.invalidateQueries({ queryKey: disclosureKeys.listBase });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "공시 수정 중 오류가 발생했습니다.";
      showAlert({ message, severity: "error" });
    },
  });
}

/** 첨부 업로드 (알림 없음 — 호출부에서 결합 메시지 처리) */
export function useUploadDisclosureFiles() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { pblntSn: string | number; files: File[]; fileSeCd: string; ptcpInstSn?: number | null }
  >({
    mutationFn: async ({ pblntSn, files, fileSeCd, ptcpInstSn }) => {
      await DisclosureAPI.uploadFiles(pblntSn, files, fileSeCd, ptcpInstSn ?? null);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: disclosureKeys.files(
          String(variables.pblntSn),
          variables.ptcpInstSn == null ? undefined : String(variables.ptcpInstSn)
        ),
      });
    },
  });
}

export function useUpdateDisclosureStatus() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<void, Error, { pblntSn: string | number; pblntStcd: string }>({
    mutationFn: async ({ pblntSn, pblntStcd }) => {
      await DisclosureAPI.updateDisclosureStatus(pblntSn, pblntStcd);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disclosureKeys.detail(variables.pblntSn) });
      queryClient.invalidateQueries({ queryKey: disclosureKeys.listBase });
      showAlert({ message: "공시가 진행중 상태로 변경되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "공시 상태 변경 중 오류가 발생했습니다.";
      showAlert({ message, severity: "error" });
    },
  });
}

export function useUpdateDisclosureCancelReason() {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation<
    void,
    Error,
    {
      pblntSn: string | number;
      ptcpInstSn: string | number;
      cancelReason: string;
      successMessage?: string;
    }
  >({
    mutationFn: async ({ pblntSn, ptcpInstSn, cancelReason }) => {
      await DisclosureAPI.updateCancelReason(Number(pblntSn), Number(ptcpInstSn), cancelReason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disclosureKeys.cancelReason(variables.pblntSn, variables.ptcpInstSn) });
      queryClient.invalidateQueries({ queryKey: disclosureKeys.partners(variables.pblntSn) });
      queryClient.invalidateQueries({ queryKey: disclosureKeys.detail(variables.pblntSn) });
      if (variables.successMessage) {
        showAlert({ message: variables.successMessage, severity: "success" });
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || "취소사유 수정 중 오류가 발생했습니다.";
      showAlert({ message, severity: "error" });
    },
  });
}
