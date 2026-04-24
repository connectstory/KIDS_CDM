import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBoardComments,
  createBoardComment,
  updateBoardComment,
  deleteBoardComment,
  type BoardCommentCreateRequest,
  type BoardCommentUpdateRequest,
} from "@/api/communityApi";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";

const boardCommentKeys = {
  list: (pstSn: number | null | undefined, bbsId: string) => ["boardComments", pstSn, bbsId] as const,
};

export function useBoardComments(pstSn: number | null | undefined, bbsId: string) {
  return useQuery({
    queryKey: boardCommentKeys.list(pstSn, bbsId),
    queryFn: () => fetchBoardComments(pstSn!, bbsId),
    enabled: !!pstSn && !!bbsId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useCreateBoardComment(pstSn: number, bbsId: string) {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation({
    mutationFn: (data: BoardCommentCreateRequest) => createBoardComment(pstSn, bbsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardCommentKeys.list(pstSn, bbsId) });
      showAlert({ message: "댓글이 등록되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || "댓글 등록에 실패했습니다.";
      showAlert({ message: msg, severity: "error" });
    },
  });
}

export function useUpdateBoardComment(pstSn: number, bbsId: string) {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation({
    mutationFn: ({ asmtCmntSn, data }: { asmtCmntSn: number; data: BoardCommentUpdateRequest }) =>
      updateBoardComment(pstSn, asmtCmntSn, bbsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardCommentKeys.list(pstSn, bbsId) });
      showAlert({ message: "댓글이 수정되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || "댓글 수정에 실패했습니다.";
      showAlert({ message: msg, severity: "error" });
    },
  });
}

export function useDeleteBoardComment(pstSn: number, bbsId: string) {
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  return useMutation({
    mutationFn: (asmtCmntSn: number) => deleteBoardComment(pstSn, asmtCmntSn, bbsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardCommentKeys.list(pstSn, bbsId) });
      showAlert({ message: "댓글이 삭제되었습니다.", severity: "success" });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || "댓글 삭제에 실패했습니다.";
      showAlert({ message: msg, severity: "error" });
    },
  });
}
