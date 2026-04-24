import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCommonCodes } from "@/api/commonApi";
import type { CommonCodeItem } from "@/api/commonApi";

export interface CommonCodeOption {
  value: string;
  label: string;
}

interface UseCommonCodesResult {
  /** [{ value: "01", label: "답변대기" }, ...] 형태 — 필터 드롭다운용 */
  options: CommonCodeOption[];
  /** { "01": "답변대기", ... } 형태 — 그리드 렌더러 등 코드→이름 변환용 */
  codeMap: Record<string, string>;
  /** "전체" 옵션이 앞에 포함된 options (SearchArea categoryOptions 용) */
  optionsWithAll: CommonCodeOption[];
  isLoading: boolean;
}

/**
 * 공통코드 조회 훅
 * @param groupCode tb_ca_c_group_code.com_group_cd (예: "CMCMM00001")
 */
export function useCommonCodes(groupCode: string): UseCommonCodesResult {
  const { data: codes = [], isLoading } = useQuery<CommonCodeItem[]>({
    queryKey: ["commonCodes", groupCode],
    queryFn: () => fetchCommonCodes(groupCode),
    staleTime: Infinity,
  });

  const options = useMemo(
    () => codes.map((c) => ({ value: c.code, label: c.name })),
    [codes]
  );

  const optionsWithAll = useMemo(
    () => [{ value: "ALL", label: "전체" }, ...options],
    [options]
  );

  const codeMap = useMemo(
    () => Object.fromEntries(codes.map((c) => [c.code, c.name])),
    [codes]
  );

  return { options, optionsWithAll, codeMap, isLoading };
}
