import type { FileData } from "@/components/FileContainer";
import type { ResearchFileItem } from "@/interfaces/researchInterface";
import { formatFileSize } from "@/utils/common";

type RawFileRow = ResearchFileItem & {
  file_nm?: string;
  file_ext_nm?: string;
  file_sz?: number;
  atch_file_id?: string;
};

/**
 * 최신 분석 상세 API의 fileList / snake_case 폴백을 FileData[]로 통일.
 */
export function mapLatestAnalysisResponseToFileData(
  latest: { fileList?: ResearchFileItem[]; file_list?: ResearchFileItem[] } | null | undefined
): FileData[] {
  const rawList = latest?.fileList ?? (latest as { file_list?: RawFileRow[] })?.file_list;
  if (!Array.isArray(rawList)) return [];
  return rawList.map((f: RawFileRow) => ({
    name: f.fileNm ?? f.file_nm ?? "",
    ext: f.fileExtNm ?? f.file_ext_nm ?? (f.fileNm ?? f.file_nm)?.split(".").pop() ?? "",
    size: formatFileSize(Number(f.fileSz ?? f.file_sz ?? 0)),
    atchFileId: f.atchFileId ?? f.atch_file_id,
  }));
}
