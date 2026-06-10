/** 서버 fileList 확장자 분류용 (대문자) */
export const DATASET_EXTS = new Set(["XLS", "XLSX"]);

export const DATASET_ACCEPT = [".xlsx", ".xls"];

const VDI_EXT_LIST = ["hwpx", "hwp", "docx", "doc", "pdf", "jpg", "jpeg", "png"] as const;

export const VDI_EXTS = new Set(VDI_EXT_LIST.map((e) => e.toUpperCase()));

/** FileDropZone 등 입력 허용 확장자 */
export const VDI_ACCEPT = VDI_EXT_LIST.map((e) => `.${e}`);

/** 연구과제 분석질의 첨부 (ResearchWrite 등) */
export const ANALYSIS_QUERY_ACCEPT: string[] = [
  ".sql",
  ".r",
  ".R",
  ".py",
  ".jsn",
  ".jsm",
  ".pdf",
  ".xlsx",
  ".csv",
  ".txt",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".hwp",
  ".hwpx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".zip",
];

const CDM_META_IMAGE_AND_DOC_LOWER = ["jpg", "jpeg", "png", "webp", "pdf"] as const;

/** CDM·메타 분석결과 첨부 허용 (미리보기 가능 형식과 정렬; gif 포함) */
export const ANALYSIS_CDM_META_ATTACHMENT_ACCEPT: string[] = CDM_META_IMAGE_AND_DOC_LOWER.map((e) => `.${e}`);

const ORG_EXTRA_LOWER = ["rds", "xlsx", "csv", "txt", "r", ".parquet"] as const;

/** 기관 분석결과 첨부: CDM/메타 공통 + 데이터 형식 */
export const ANALYSIS_ORG_ATTACHMENT_ACCEPT: string[] = [
  ...ANALYSIS_CDM_META_ATTACHMENT_ACCEPT,
  ...ORG_EXTRA_LOWER.map((e) => `.${e}`),
];

const PREVIEWABLE_LOWER = ["jpg", "jpeg", "png", "webp", "pdf"] as const;

export const PREVIEWABLE_EXTS = new Set(PREVIEWABLE_LOWER.map((e) => e.toUpperCase()));

export function isPreviewableFile(name: string, ext: string): boolean {
  const n = (name || "").toLowerCase();
  const e = (ext || "").toUpperCase();
  if (PREVIEWABLE_EXTS.has(e)) return true;
  return PREVIEWABLE_LOWER.some((lo) => n.endsWith(`.${lo}`));
}
