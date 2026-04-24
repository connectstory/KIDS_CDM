import type { PartnerListApiResponse } from "@/interfaces/researchInterface";
import axios, { getActiveMenuSn } from "@/api/axios";

const BASE_URL = "/common";

/** temp 폴더 PDF 목록 항목 */
export interface TempPdfListItem {
  fileName: string;
  fileSize: number;
}

/** API 서버 기준 URL (이미지 등에서 사용) */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/cm";
}

/** 파일 다운로드 URL (백엔드 origin 사용, window.open 등에서 사용) */
export function getFileDownloadUrl(atchFileId: string): string {
  return `${getApiBaseUrl()}${BASE_URL}/file/download/${atchFileId}`;
}

/** 파일 다운로드 (프록시 경유, 외부망 접근 가능) */
export async function downloadFileViaProxy(atchFileId: string, fileNm: string): Promise<void> {
  if (!atchFileId) return;
  const res = await axios.get(`${BASE_URL}/file/download/${atchFileId}`, { responseType: 'blob' });
  // flfmtTaskCd "7" = 다운로드 (CA0003)
  axios.post("/auth/access-history", {
    menuPath: `${BASE_URL}/file/download/${atchFileId}`,
    flfmtTaskCd: "7",
    menuSn: getActiveMenuSn(),
  }).catch(() => {});
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileNm || atchFileId;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 파일 미리보기 URL (inline, 뷰어에서 표시용) */
export function getFilePreviewUrl(atchFileId: string): string {
  return `${getApiBaseUrl()}${BASE_URL}/file/preview/${atchFileId}`;
}

/** 분석 DATASET 양식 파일 다운로드 URL */
export function getAnalysisDatasetTemplateDownloadUrl(): string {
  return `${getApiBaseUrl()}${BASE_URL}/template/analysis-dataset`;
}

/** VDI 신청서 양식 파일 다운로드 URL */
export function getVdiTemplateDownloadUrl(): string {
  return `${getApiBaseUrl()}${BASE_URL}/template/vdi-application`;
}

async function downloadTemplateBlob(pathSuffix: string, fileName: string): Promise<void> {
  const res = await axios.get(`${BASE_URL}${pathSuffix}`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 분석 DATASET 양식 (axios·blob, 새 탭/원격세션 검증 회피) */
export function downloadAnalysisDatasetTemplate(): Promise<void> {
  return downloadTemplateBlob("/template/analysis-dataset", "분석 데이터 양식.xlsx");
}

/** VDI 신청서 양식 (axios·blob) */
export function downloadVdiApplicationTemplate(): Promise<void> {
  return downloadTemplateBlob("/template/vdi-application", "VDI 신청서 양식.hwpx");
}

/** 저장된 파일 워터마크 미리보기: 메타 (totalPages, isImage) */
export function getFilePreviewMetaUrl(atchFileId: string): string {
  return `${getApiBaseUrl()}${BASE_URL}/file/preview/${atchFileId}/meta`;
}

/** 저장된 파일 워터마크 미리보기: PDF 페이지 PNG URL */
export function getFilePreviewPageImageUrl(atchFileId: string, page: number, dpi: number = 130): string {
  const params = new URLSearchParams({ dpi: String(dpi) });
  return `${getApiBaseUrl()}${BASE_URL}/file/preview/${atchFileId}/pages/${page}.png?${params.toString()}`;
}

/** 저장된 파일 워터마크 미리보기: 이미지 파일 PNG URL */
export function getFilePreviewImageUrl(atchFileId: string): string {
  return `${getApiBaseUrl()}${BASE_URL}/file/preview/${atchFileId}/image`;
}

/** temp PDF 페이지 이미지 URL (fileName + page) */
export function getTempPdfPageImageUrl(fileName: string, page: number, dpi: number = 150): string {
  const params = new URLSearchParams({ fileName, dpi: String(dpi) });
  return `${getApiBaseUrl()}${BASE_URL}/temp/pdfs/pages/${page}.png?${params.toString()}`;
}

/** temp 폴더 내 이미지/PDF 원본 파일 URL (이미지 미리보기용) */
export function getTempFileContentUrl(fileName: string): string {
  const params = new URLSearchParams({ fileName });
  return `${getApiBaseUrl()}${BASE_URL}/temp/files/content?${params.toString()}`;
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
export function isImageFileName(fileName: string): boolean {
  const lower = fileName?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export interface CommonCodeItem {
  code: string;
  name: string;
}

export const fetchCommonCodes = (groupCode: string): Promise<CommonCodeItem[]> =>
  axios.get<{ data: CommonCodeItem[] }>(`${BASE_URL}/codes/${groupCode}`)
    .then((res) => res.data.data);

export const CommonAPI = {
  /**
   * 협력기관 목록 조회
   * CDM, 연구과제 협력기관 추가 시 사용
   * @returns 협력기관 목록
   */
  getPartners: () => axios.get<PartnerListApiResponse>(`${BASE_URL}/partners`),

  /**
   * temp 폴더 내 PDF 파일 목록 조회
   */
  listTempPdfs: () =>
    axios.get<{
      status: string;
      message: string;
      data: TempPdfListItem[];
    }>(`${BASE_URL}/temp/pdfs`),

  /**
   * temp 폴더 내 PDF + 이미지 통합 목록 조회 (미리보기용)
   */
  listTempFiles: () =>
    axios.get<{
      status: string;
      message: string;
      data: TempPdfListItem[];
    }>(`${BASE_URL}/temp/files`),

  /**
   * temp 폴더 PDF 메타 (총 페이지 수) 조회
   */
  getTempPdfMeta: (fileName: string) =>
    axios.get<{
      status: string;
      message: string;
      data: { totalPages: number };
    }>(`${BASE_URL}/temp/pdfs/meta`, { params: { fileName } }),

  /**
   * temp 폴더 PDF 전체 페이지 한 번에 조회 (totalPages, pages: base64 PNG 배열)
   */
  getTempPdfAllPages: (fileName: string, dpi: number = 150) =>
    axios.get<{
      status: string;
      message: string;
      data: { totalPages: number; pages: string[] };
    }>(`${BASE_URL}/temp/pdfs/all-pages`, { params: { fileName, dpi } }),

  /**
   * 저장된 파일 미리보기 메타 (워터마크 미리보기용: totalPages, isImage)
   */
  getFilePreviewMeta: (atchFileId: string) =>
    axios.get<{
      status: string;
      message: string;
      data: { totalPages: number; isImage: boolean };
    }>(`${BASE_URL}/file/preview/${atchFileId}/meta`),
};
