import axios from "@/api/axios";

/** CDM 현황정보 API prefix (백엔드: /api/cm/cdm/upload-status) */
const CDM_UPLOAD_STATUS_BASE = "/cdm/upload-status";

/* ================================================================
 * 타입
 * ================================================================ */

export type FetchStatusDetailParams = {
  ptcpInstSn: number;
  pblntSn: number;
};

export type UpdateCdmCurrentInfoParams = {
  ptcpInstSn: number;
  pblntSn: number;
  verInfoNm: string;
  lastUpdtYmd: string;
  updtCycleCnt?: number;
};

export type ConfirmCdmCurrentInfoParams = UpdateCdmCurrentInfoParams;

export type FetchPeriodScaleListParams = {
  pblntSn: number;
  ptcpInstSn: number;
};

export type PeriodScaleItem = {
  uldPrdSn?: number;
  pblntSn: number;
  ptcpInstSn: number;
  trsfSeCd: string;
  tblSeCd: string;
  bgngYmd?: string;
  endYmd?: string;
  tnocs?: number;
};

export type FetchCatalogListParams = {
  pblntSn: number;
  ptcpInstSn: number;
};

export type CatalogItem = {
  uldListSn?: number;
  pblntSn: number;
  ptcpInstSn: number;
  tblSeCd: string;
  colNm: string;
  dataTypeNm: string;
  nulYn: string;
  pkYn: string;
  fkYn: string;
};

/* ================================================================
 * CDM 현황정보
 * ================================================================ */

export const fetchStatusDetail = (params: FetchStatusDetailParams): Promise<any> => {
  return axios.get(`${CDM_UPLOAD_STATUS_BASE}/selectStatusDetail`, { params }).then((res) => res.data?.data || null);
};

export const updateCdmCurrentInfo = (data: UpdateCdmCurrentInfoParams): Promise<any> => {
  return axios.put(`${CDM_UPLOAD_STATUS_BASE}/updateCdmCurrentInfo`, data).then((res) => res.data?.data);
};

export const confirmCdmCurrentInfo = (data: ConfirmCdmCurrentInfoParams): Promise<any> => {
  return axios.put(`${CDM_UPLOAD_STATUS_BASE}/confirmCdmCurrentInfo`, data).then((res) => res.data?.data);
};

/* ================================================================
 * CDM 테이블별 기간&규모
 * ================================================================ */

export const fetchPeriodScaleList = (params: FetchPeriodScaleListParams): Promise<PeriodScaleItem[]> => {
  return axios.get(`${CDM_UPLOAD_STATUS_BASE}/selectPeriodScaleList`, { params }).then((res) => res.data?.data || []);
};

export const insertPeriodScale = (data: Omit<PeriodScaleItem, "uldPrdSn">): Promise<any> => {
  return axios.post(`${CDM_UPLOAD_STATUS_BASE}/insertCdmUploadPeriodScale`, data).then((res) => res.data?.data);
};

export const updatePeriodScale = (data: PeriodScaleItem & { uldPrdSn: number }): Promise<any> => {
  return axios.put(`${CDM_UPLOAD_STATUS_BASE}/updateCdmUploadPeriodScale`, data).then((res) => res.data?.data);
};

/* ================================================================
 * CDM 카탈로그
 * ================================================================ */

export const fetchCatalogList = (params: FetchCatalogListParams): Promise<CatalogItem[]> => {
  return axios.get(`${CDM_UPLOAD_STATUS_BASE}/selectCatalogList`, { params }).then((res) => res.data?.data || []);
};

export const insertCatalog = (data: Omit<CatalogItem, "uldListSn">): Promise<any> => {
  return axios.post(`${CDM_UPLOAD_STATUS_BASE}/insertCdmUploadCatalog`, data).then((res) => res.data?.data);
};

export const updateCatalog = (data: CatalogItem & { uldListSn: number }): Promise<any> => {
  return axios.put(`${CDM_UPLOAD_STATUS_BASE}/updateCdmUploadCatalog`, data).then((res) => res.data?.data);
};

export const deleteCatalog = (data: { uldListSn: number; pblntSn: number }): Promise<any> => {
  return axios.delete(`${CDM_UPLOAD_STATUS_BASE}/deleteCdmUploadCatalog`, { data }).then((res) => res.data?.data);
};
