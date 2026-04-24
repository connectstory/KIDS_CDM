import { useCallback, useEffect, useRef, useState } from "react";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Box, Button, CircularProgress, IconButton, TextField, Typography } from "@mui/material";
import { CONTENT_GAP } from "@/constants/types";
import axios from "@/api/axios";
import {
  CommonAPI,
  type TempPdfListItem,
  getFilePreviewImageUrl,
  getFilePreviewPageImageUrl,
  getTempFileContentUrl,
  getTempPdfPageImageUrl,
  isImageFileName,
} from "@/api/commonApi";
import { SpaceBox } from "./SpaceBox";

/** 미리보기 워터마크는 서버에서 처리 (temp PDF 페이지 PNG, temp 이미지: /temp/pdfs/pages, /temp/files/content) */

const BASE_DPI = 130;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
function isImageByDisplayName(name: string | undefined): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

interface PdfPreviewViewerProps {
  /** 지정 시 해당 파일만 미리보기. 없으면 temp 폴더 목록에서 선택 */
  fileName?: string;
  /** URL 모드: 업로드된 파일 미리보기 (fileUrl 우선) */
  fileUrl?: string;
  /** URL 모드에서 제목/이미지 여부 판단용 파일명 */
  displayFileName?: string;
  /** 저장된 파일 ID: 지정 시 워터마크 적용 미리보기 API 사용 (fileUrl과 함께 전달) */
  atchFileId?: string;
  /** 목록/뷰어 영역 최소 높이 */
  minHeight?: number;
  className?: string;
  /** 로딩 상태 변경 시 호출 (모달 등에서 Loader 표시용) */
  onLoadingChange?: (loading: boolean) => void;
}

export default function PdfPreviewViewer({
  fileName: initialFileName,
  fileUrl,
  displayFileName,
  atchFileId,
  minHeight = 500,
  className,
  onLoadingChange,
}: PdfPreviewViewerProps) {
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [goPageInput, setGoPageInput] = useState("1");
  const [loading, setLoading] = useState(!fileUrl && !atchFileId);
  const [error, setError] = useState<string | null>(null);
  const [pdfList, setPdfList] = useState<TempPdfListItem[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(initialFileName ?? null);
  const [isPanning, setIsPanning] = useState(false);
  /** 뷰포트에 들어온 페이지만 이미지 로드 (Intersection Observer) */
  const [visiblePages, setVisiblePages] = useState<Set<number>>(() => new Set());
  /** URL 모드 PDF: axios(Bearer) → Blob → Object URL (X-Frame-Options 회피) */
  const [urlPdfBlobUrl, setUrlPdfBlobUrl] = useState<string | null>(null);
  const [urlPdfLoading, setUrlPdfLoading] = useState(false);
  const [urlPdfError, setUrlPdfError] = useState<string | null>(null);
  /** 저장된 파일 워터마크 미리보기: 메타 로드 후 isImage 여부 */
  const [savedFileMeta, setSavedFileMeta] = useState<{ atchFileId: string; isImage: boolean } | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });
  const lastReportedPageRef = useRef(1);

  const dpi = BASE_DPI;
  const isWatermarkedSavedFileMode = Boolean(atchFileId && savedFileMeta && totalPages != null);
  const isUrlMode = Boolean(fileUrl) && !atchFileId;
  const isUrlModeImage = isUrlMode && isImageByDisplayName(displayFileName);
  const isUrlModePdf = isUrlMode && !isUrlModeImage;

  /** 저장된 파일(atchFileId) 워터마크 미리보기: 메타 조회 후 페이지/이미지 URL로 표시 */
  useEffect(() => {
    if (!atchFileId) {
      setSavedFileMeta(null);
      return;
    }
    setLoading(true);
    setError(null);
    setTotalPages(null);
    CommonAPI.getFilePreviewMeta(atchFileId)
      .then((res) => {
        const data = res.data?.data;
        if (data && data.totalPages > 0) {
          setTotalPages(data.totalPages);
          setSavedFileMeta({ atchFileId, isImage: data.isImage });
          setVisiblePages(new Set());
          setGoPageInput("1");
          lastReportedPageRef.current = 1;
        } else if (data && data.totalPages === 0) {
          setError("미리보기할 수 없는 파일입니다.");
        } else {
          setError("메타 정보를 받지 못했습니다.");
        }
      })
      .catch((e: unknown) => {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e as Error)?.message ||
          "미리보기 메타 조회 실패";
        setError(String(msg));
        setTotalPages(null);
      })
      .finally(() => setLoading(false));
  }, [atchFileId]);

  /** URL 모드 PDF: axios(Bearer·withCredentials) → Blob → Object URL (백엔드 X-Frame-Options 유지). atchFileId 있으면 워터마크 API 사용으로 스킵 */
  useEffect(() => {
    if (!fileUrl || !isUrlModePdf || atchFileId) {
      return;
    }
    let cancelled = false;
    const prevBlobUrl = urlPdfBlobUrl;
    setUrlPdfBlobUrl(null);
    setUrlPdfError(null);
    setUrlPdfLoading(true);

    axios
      .get(fileUrl, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        setUrlPdfBlobUrl(URL.createObjectURL(res.data));
        setUrlPdfLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e as Error)?.message ||
          "PDF 로드 실패";
        setUrlPdfError(String(msg));
        setUrlPdfLoading(false);
      });

    return () => {
      cancelled = true;
      if (prevBlobUrl) URL.revokeObjectURL(prevBlobUrl);
    };
  }, [fileUrl, isUrlModePdf, atchFileId]);

  /** URL 모드 PDF blob URL 해제 (언마운트 또는 fileUrl 변경 시) */
  useEffect(() => {
    return () => {
      if (urlPdfBlobUrl) URL.revokeObjectURL(urlPdfBlobUrl);
    };
  }, [urlPdfBlobUrl]);

  /** 메타(총 페이지 수)만 조회. 각 페이지 이미지는 getTempPdfPageImageUrl로 lazy 로드 */
  const loadMeta = useCallback(async (fileName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await CommonAPI.getTempPdfMeta(fileName);
      const data = res.data?.data;
      const total = data?.totalPages;
      if (total != null && total >= 0) {
        setTotalPages(total);
        setVisiblePages(new Set());
        lastReportedPageRef.current = 1;
        setGoPageInput("1");
      } else {
        setError("페이지 정보를 받지 못했습니다.");
        setTotalPages(null);
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "페이지 정보 조회 실패";
      setError(String(msg));
      setTotalPages(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    if (fileUrl) {
      onLoadingChange?.(false);
    }
  }, [fileUrl, onLoadingChange]);

  useEffect(() => {
    if (fileUrl || atchFileId) return;
    if (selectedFileName) {
      if (isImageFileName(selectedFileName)) {
        setLoading(true);
        setError(null);
        setTotalPages(1);
        setGoPageInput("1");
        setVisiblePages(new Set([1]));
        setLoading(false);
        return;
      }
      loadMeta(selectedFileName);
      return;
    }
    if (initialFileName) {
      setSelectedFileName(initialFileName);
      return;
    }
    setLoading(true);
    setError(null);
    CommonAPI.listTempFiles()
      .then((res) => {
        const list = res.data?.data ?? [];
        setPdfList(list);
        if (list.length === 0) setError("temp 폴더에 PDF/이미지 파일이 없습니다.");
      })
      .catch((e: unknown) => {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e as Error)?.message ||
          "파일 목록 조회 실패";
        setError(String(msg));
      })
      .finally(() => setLoading(false));
  }, [initialFileName, selectedFileName, loadMeta, fileUrl, atchFileId]);

  const jumpToPage = () => {
    if (totalPages == null || !selectedFileName) return;
    const n = parseInt(goPageInput, 10);
    if (!Number.isFinite(n)) return;
    const idx = Math.max(1, Math.min(n, totalPages)) - 1;
    pageRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleZoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));

  const handleScrollAreaMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsPanning(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      const el = scrollContainerRef.current;
      if (!el) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      el.scrollLeft = dragRef.current.scrollLeft - dx;
      el.scrollTop = dragRef.current.scrollTop - dy;
    };
    const onMouseUp = () => setIsPanning(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isPanning]);

  // 스크롤 시 뷰포트 중심에 있는 페이지를 goPageInput에 반영
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (totalPages == null || !container) return;
    if (!pageRefs.current[0]) return;
    const { scrollTop, clientHeight } = container;
    const viewportCenter = scrollTop + clientHeight / 2;
    let currentPage = 1;
    for (let i = 0; i < totalPages; i++) {
      const el = pageRefs.current[i];
      if (!el) continue;
      const { offsetTop, offsetHeight } = el;
      if (viewportCenter < offsetTop) {
        currentPage = Math.max(1, i);
        break;
      }
      if (viewportCenter <= offsetTop + offsetHeight) {
        currentPage = i + 1;
        break;
      }
      currentPage = i + 1;
    }
    if (currentPage !== lastReportedPageRef.current) {
      lastReportedPageRef.current = currentPage;
      setGoPageInput(String(currentPage));
    }
  }, [totalPages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || totalPages == null) return;
    const opts: AddEventListenerOptions = { passive: true };
    container.addEventListener("scroll", handleScroll, opts);
    return () => container.removeEventListener("scroll", handleScroll, opts);
  }, [totalPages, handleScroll]);

  // 뷰포트에 들어온 페이지만 visiblePages에 추가 → 해당 페이지만 img src 부여
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || totalPages == null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const pageNum = entry.target.getAttribute("data-page");
          if (pageNum) {
            const n = Number(pageNum);
            setVisiblePages((prev) => (prev.has(n) ? prev : new Set([...prev, n])));
          }
        });
      },
      { root: container, rootMargin: "300px", threshold: 0 }
    );
    for (let i = 0; i < totalPages; i++) {
      const el = pageRefs.current[i];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [totalPages]);

  /** 저장된 파일 워터마크 미리보기: 페이지별 PNG 또는 단일 이미지 */
  if (isWatermarkedSavedFileMode && savedFileMeta) {
    const effectiveTotal = savedFileMeta.isImage ? 1 : (totalPages ?? 0);
    return (
      <Box
        className={className}
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box
          className="flex items-center justify-between pb-4"
          sx={{
            flexShrink: 0,
            pb: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6">{displayFileName ?? "미리보기"}</Typography>
          <Box className="flex items-center gap-1">
            <IconButton size="small" onClick={handleZoomOut} aria-label="축소">
              <ZoomOutIcon />
            </IconButton>
            <Typography variant="default" className="w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </Typography>
            <IconButton size="small" onClick={handleZoomIn} aria-label="확대">
              <ZoomInIcon />
            </IconButton>
            {effectiveTotal > 1 && (
              <>
                <span className="mx-[0.3rem] text-gray-400">|</span>
                <Box className="flex items-center gap-2">
                  <TextField
                    className="w-[5rem]"
                    size="small"
                    type="number"
                    value={goPageInput}
                    onChange={(e) => setGoPageInput(e.target.value)}
                    slotProps={{ htmlInput: { min: 1, max: effectiveTotal } }}
                  />
                  <span>/</span>
                  <Typography variant="default" className="w-[2rem]">
                    {effectiveTotal}
                  </Typography>
                  <Button
                    variant="containedLight"
                    onClick={() => {
                      if (effectiveTotal == null) return;
                      const n = parseInt(goPageInput, 10);
                      const idx = Math.max(1, Math.min(Number.isFinite(n) ? n : 1, effectiveTotal)) - 1;
                      pageRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    이동
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Box>
        <Box
          ref={scrollContainerRef}
          onMouseDown={handleScrollAreaMouseDown}
          sx={{
            flex: 1,
            maxHeight: "calc(100vh - 56px)",
            overflow: "auto",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            p: 1,
            bgcolor: "grey.100",
            cursor: isPanning ? "grabbing" : "grab",
            userSelect: "none",
          }}
        >
          {savedFileMeta.isImage ? (
            <Box
              component="img"
              src={getFilePreviewImageUrl(savedFileMeta.atchFileId)}
              alt="미리보기"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              sx={{
                width: `${zoom * 100}%`,
                maxWidth: 900 * zoom,
                display: "block",
                mx: "auto",
              }}
            />
          ) : (
            Array.from({ length: effectiveTotal }, (_, i) => i + 1).map((pageNum) => (
              <Box
                key={pageNum}
                ref={(el: HTMLDivElement | null) => {
                  pageRefs.current[pageNum - 1] = el;
                }}
                data-page={pageNum}
                sx={{ mb: 2, minHeight: 400, bgcolor: "grey.200" }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  Page {pageNum}
                </Typography>
                {visiblePages.has(pageNum) ? (
                  <Box
                    component="img"
                    src={getFilePreviewPageImageUrl(savedFileMeta.atchFileId, pageNum, dpi)}
                    alt={`page-${pageNum}`}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    sx={{
                      width: `${zoom * 100}%`,
                      maxWidth: 900 * zoom,
                      display: "block",
                      mx: "auto",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: `${zoom * 100}%`,
                      maxWidth: 900 * zoom,
                      height: 400,
                      mx: "auto",
                      bgcolor: "grey.200",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                )}
              </Box>
            ))
          )}
        </Box>
      </Box>
    );
  }

  /** URL 모드: 업로드된 파일 미리보기 (이미지 단일 img, PDF는 iframe, 워터마크 없음) */
  if (isUrlMode && fileUrl) {
    return (
      <Box
        className={className}
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box
          className="flex items-center justify-between pb-4"
          sx={{
            flexShrink: 0,
            pb: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6">{displayFileName ?? "미리보기"}</Typography>
          <Box className="flex items-center gap-1">
            <IconButton size="small" onClick={handleZoomOut} aria-label="축소">
              <ZoomOutIcon />
            </IconButton>
            <Typography variant="default" className="w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </Typography>
            <IconButton size="small" onClick={handleZoomIn} aria-label="확대">
              <ZoomInIcon />
            </IconButton>
          </Box>
        </Box>
        <Box
          ref={scrollContainerRef}
          onMouseDown={handleScrollAreaMouseDown}
          sx={{
            flex: 1,
            maxHeight: "calc(100vh - 56px)",
            overflow: "auto",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            p: 1,
            bgcolor: "grey.100",
            cursor: isPanning ? "grabbing" : "grab",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isUrlModeImage ? (
            <Box
              component="img"
              src={fileUrl}
              alt="미리보기"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              sx={{
                width: `${zoom * 100}%`,
                maxWidth: 900 * zoom,
                display: "block",
              }}
            />
          ) : urlPdfLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
              <CircularProgress />
            </Box>
          ) : urlPdfError ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
                gap: 2,
              }}
            >
              <Typography color="error">{urlPdfError}</Typography>
            </Box>
          ) : urlPdfBlobUrl ? (
            <Box
              component="iframe"
              title={displayFileName ?? "PDF"}
              src={urlPdfBlobUrl}
              sx={{
                width: `${zoom * 100}%`,
                maxWidth: 900 * zoom,
                minHeight: 600,
                height: "80vh",
                border: "none",
              }}
            />
          ) : null}
        </Box>
      </Box>
    );
  }

  if (loading && totalPages == null) {
    return (
      <Box className={className} sx={{ minHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && totalPages == null) {
    return (
      <Box className="h-[400px] flex flex-col items-center justify-center">
        <div className="flex items-center justify-center h-[120px] w-[120px] p-14 bg-gray-100 rounded-full">
          <i className="fa-solid fa-triangle-exclamation text-7xl text-gray-300"></i>
        </div>
        <SpaceBox gap={CONTENT_GAP.LARGE} />
        <Typography>{error}</Typography>
      </Box>
    );
  }

  if (totalPages == null && !loading) {
    return (
      <Box className={className} sx={{ minHeight, p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          temp 폴더 PDF/이미지 목록
        </Typography>
        {pdfList.length === 0 ? (
          <Typography>표시할 PDF/이미지가 없습니다.</Typography>
        ) : (
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {pdfList.map((item) => (
              <li key={item.fileName}>
                <Button variant="text" onClick={() => setSelectedFileName(item.fileName)}>
                  {item.fileName} ({(item.fileSize / 1024).toFixed(1)} KB)
                </Button>
              </li>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      className={className}
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* 기능 영역: 스크롤 컨테이너 밖에 두어 항상 고정 */}
      <Box
        className="flex items-center justify-between pb-4"
        sx={{
          flexShrink: 0,
          pb: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography variant="h6">{selectedFileName}</Typography>
        </Box>
        <Box className="flex items-center gap-1">
          <IconButton size="small" onClick={handleZoomOut} aria-label="축소">
            <ZoomOutIcon />
          </IconButton>
          <Typography variant="default" className="w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </Typography>
          <IconButton size="small" onClick={handleZoomIn} aria-label="확대">
            <ZoomInIcon />
          </IconButton>

          <span className="mx-[0.3rem] text-gray-400">|</span>

          <Box className="flex items-center gap-2">
            <TextField
              className="w-[5rem]"
              size="small"
              type="number"
              value={goPageInput}
              onChange={(e) => setGoPageInput(e.target.value)}
              slotProps={{ htmlInput: { min: 0, max: totalPages ?? 0 } }}
            />
            <span className="">/</span>
            <Typography variant="default" className="w-[2rem]">
              {totalPages}
            </Typography>
            <Button variant="containedLight" onClick={jumpToPage}>
              이동
            </Button>
          </Box>
          {!initialFileName && (
            <Button
              variant="containedLight"
              size="small"
              sx={{ ml: 1 }}
              onClick={() => {
                setTotalPages(null);
                setSelectedFileName(null);
                setGoPageInput("1");
              }}
            >
              목록으로
            </Button>
          )}
        </Box>
      </Box>
      <Box
        ref={scrollContainerRef}
        onMouseDown={handleScrollAreaMouseDown}
        sx={{
          flex: 1,
          maxHeight: "calc(100vh - 56px)",
          overflow: "auto",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          p: 1,
          bgcolor: "grey.100",
          cursor: isPanning ? "grabbing" : "grab",
          userSelect: "none",
        }}
      >
        {selectedFileName &&
          Array.from({ length: totalPages ?? 0 }, (_, i) => i + 1).map((pageNum) => (
            <Box
              key={pageNum}
              ref={(el: HTMLDivElement | null) => {
                pageRefs.current[pageNum - 1] = el;
              }}
              data-page={pageNum}
              sx={{ mb: 2, minHeight: 400, bgcolor: "grey.200" }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                Page {pageNum}
              </Typography>
              {visiblePages.has(pageNum) ? (
                <Box
                  component="img"
                  src={
                    isImageFileName(selectedFileName)
                      ? getTempFileContentUrl(selectedFileName)
                      : getTempPdfPageImageUrl(selectedFileName, pageNum, dpi)
                  }
                  alt={isImageFileName(selectedFileName) ? "preview" : `page-${pageNum}`}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  sx={{
                    width: `${zoom * 100}%`,
                    maxWidth: 900 * zoom,
                    display: "block",
                    mx: "auto",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: `${zoom * 100}%`,
                    maxWidth: 900 * zoom,
                    height: 400,
                    mx: "auto",
                    bgcolor: "grey.200",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress size={24} />
                </Box>
              )}
            </Box>
          ))}
      </Box>
    </Box>
  );
}
