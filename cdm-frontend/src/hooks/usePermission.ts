import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { AuthrtType } from "@/constants/types";
import { type ActionType, checkPermission } from "@/config/permissions";
import type { RootState } from "@/store";

// ── 단일 키 ────────────────────────────────────────────────────────────────────
export const usePermission = (permissionKey: string) => {
  const authrtTypeCd = useSelector((state: RootState) => state.session.authrtTypeCd);

  return useMemo(
    () => ({
      can: (action: ActionType) => checkPermission(permissionKey, action, authrtTypeCd as AuthrtType),
      canCreate: checkPermission(permissionKey, "create", authrtTypeCd as AuthrtType),
      canRead: checkPermission(permissionKey, "read", authrtTypeCd as AuthrtType),
      canUpdate: checkPermission(permissionKey, "update", authrtTypeCd as AuthrtType),
      canDelete: checkPermission(permissionKey, "delete", authrtTypeCd as AuthrtType),
      canUpload: checkPermission(permissionKey, "upload", authrtTypeCd as AuthrtType),
      canApprove: checkPermission(permissionKey, "approve", authrtTypeCd as AuthrtType),
    }),
    [permissionKey, authrtTypeCd]
  );
};

// ── boardType 기반 동적 키 ────────────────────────────────────────────────────
export const useBoardPermission = (boardType: string | undefined) => {
  return usePermission(boardType ? `board:${boardType}` : "");
};
