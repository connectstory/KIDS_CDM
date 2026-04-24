export const DISCLOSURE_ATTACHMENT_REJECT_MSG =
  "첨부파일은 엑셀(.xlsx, .xls), 워드(.doc, .docx), 아래한글(.hwp, .hwpx), PDF(.pdf), R(.r, .rds), CSV(.csv), 파이썬(.py), PKL(.pkl), JSM(.jsm), Parquet(.parquet), 텍스트(.txt)만 등록할 수 있습니다.";

/** 공시등록/수정 첨부파일 허용 확장자: 엑셀, 워드, 아래한글, PDF, R, CSV, Python, PKL, JSM, Parquet, TXT */
export const DISCLOSURE_ATTACHMENT_EXTENSIONS = [
  ".xlsx",
  ".xls",
  ".doc",
  ".docx",
  ".hwp",
  ".hwpx",
  ".pdf",
  ".r",
  ".rds",
  ".csv",
  ".py",
  ".pkl",
  ".jsm",
  ".parquet",
  ".txt",
] as const;

export function isAllowedDisclosureAttachment(fileName: string): boolean {
  const i = fileName.lastIndexOf(".");
  if (i < 0) return false;
  const ext = fileName.slice(i).toLowerCase();
  return (DISCLOSURE_ATTACHMENT_EXTENSIONS as readonly string[]).includes(ext);
}
