import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import { type ActionType, checkPermission } from "@/config/permissions";
import type { AuthrtType } from "@/constants/types";
import type { RootState } from "@/store";

interface PermissionGuardProps {
  permissionKey: string;
  action: ActionType;
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGuard = ({ permissionKey, action, fallback = null, children }: PermissionGuardProps) => {
  const authrtTypeCd = useSelector((state: RootState) => state.session.authrtTypeCd);
  const allowed = checkPermission(permissionKey, action, authrtTypeCd as AuthrtType);
  return <>{allowed ? children : fallback}</>;
};
