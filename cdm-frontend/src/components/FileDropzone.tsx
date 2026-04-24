import { useCallback, useMemo } from "react";
import { Box } from "@mui/material";
import { useDropzone } from "react-dropzone";

/** 확장자 배열을 react-dropzone accept 형식으로 변환 */
function buildAcceptFromExtensions(extensions: string[]): Record<string, string[]> | undefined {
  if (!extensions?.length) return undefined;
  const mimeByExt: Record<string, string> = {
    ".pdf": "application/pdf",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".csv": "text/csv",
    ".sql": "application/sql",
    ".r": "text/plain",
    ".R": "text/plain",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".hwp": "application/x-hwp",
    ".hwpx": "application/vnd.hancom.hwpx",
    ".txt": "text/plain",
    ".zip": "application/zip",
  };
  const accept: Record<string, string[]> = {};
  const extLower = new Set(extensions.map((e) => (e.startsWith(".") ? e : `.${e}`).toLowerCase()));
  for (const ext of extensions) {
    const normalized = ext.startsWith(".") ? ext : `.${ext}`;
    const mime = mimeByExt[normalized.toLowerCase()] ?? "application/octet-stream";
    if (!accept[mime]) accept[mime] = [];
    if (!accept[mime].includes(normalized)) accept[mime].push(normalized);
  }
  const addMime = (mime: string, ext: string) => {
    if (!accept[mime]) accept[mime] = [];
    if (!accept[mime].includes(ext)) accept[mime].push(ext);
  };
  if (extLower.has(".hwp")) {
    addMime("application/haansofthwp", ".hwp");
    addMime("application/octet-stream", ".hwp");
  }
  if (extLower.has(".hwpx")) {
    addMime("application/octet-stream", ".hwpx");
  }
  return Object.keys(accept).length ? accept : undefined;
}

export default function FileDropZone({
  onDrop,
  disabled = false,
  acceptExtensions,
  maxFiles,
}: {
  onDrop?: (acceptedFiles: File[]) => void;
  disabled?: boolean;
  /** 허용할 파일 확장자 배열 (예: ['.pdf', '.xlsx', '.sql']). 미지정 시 모든 파일 허용 */
  acceptExtensions?: string[];
  /** 최대 업로드 파일 개수 (예: 1). 미지정 시 제한 없음 */
  maxFiles?: number;
}) {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (onDrop) {
        const normalized = typeof maxFiles === "number" && maxFiles > 0 ? acceptedFiles.slice(0, maxFiles) : acceptedFiles;
        onDrop(normalized);
      }
    },
    [onDrop, maxFiles]
  );

  const accept = useMemo(() => buildAcceptFromExtensions(acceptExtensions ?? []), [acceptExtensions]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    disabled: disabled ?? false,
    multiple: !(typeof maxFiles === "number" && maxFiles === 1),
    ...(typeof maxFiles === "number" && maxFiles > 0 ? { maxFiles } : {}),
    ...(accept && { accept }),
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: "1px dashed",
        borderColor: isDragActive ? "primary.main" : "grey.400",
        borderRadius: 2,
        p: 2,
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        pointerEvents: disabled ? "none" : "auto",
        opacity: disabled ? 0.6 : 1,
        bgcolor: isDragActive ? "var(--row-hover-color)" : "transparent",
        transition: "all 0.25s ease",
        ...(!disabled && {
          "&:hover": {
            bgcolor: "var(--row-hover-color)",
            borderColor: "primary.main",
          },
        }),
      }}
    >
      <input {...getInputProps()} />
      <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
        <path
          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="mt-1 text-sm1 text-gray-800">파일을 드래그하거나 클릭하여 업로드</p>
      <p className="text-sm text-gray-500">
        {acceptExtensions?.length ? `${acceptExtensions.join(", ")} 파일 업로드 가능` : "모든 파일 형식 업로드 가능"}
      </p>
    </Box>
  );
}
