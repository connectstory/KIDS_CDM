export interface BoardItem {
  id: string;
  title: string;
  content: string;
  writer: string;
  pstSn: string;
  bbsId: string;
  pstTtl: string;
  pstCn: string;
  pstInqCnt: string;
  pstKoglCprgtTypeCd: string;
  atchFileGroupId: string;
  thmbId: string;
  fixYn: string;
  fixBgngYmd: string;
  fixEndYmd: string;
  vdoUrlAddr: string;
  expsrYn: string;
  wrtrDeptNm: string;
  mdfrDeptNm: string;
  rgtrId: string;
  regDt: string;
  mdfrId: string;
  mdfcnDt: string;

  hasFile: string;

  fileList?: FileItem[];
}

export interface FileItem {
  atchFileId: string;
  fileNm: string;
  fileExtnNm: string;
  fileSz: number;
  fileStrgPathDsctn: string;
}

export interface FaqItem {
  id: number;
  title: string;
  content: string;
  writer: string;
  faqSn: string;
  taskSeCd: string;
  faqClsfNm: string;
  faqSeNm: string;
  faqSeCd: string;
  faqTtl: string;
  faqSeq: number;
  useYn: string;
  langSeId: string;
  faqAnsCn: string;
  atchFileId: string;
  wrtrDeptNm: string;
  mdfrDeptNm: string;
  rgtrId: string;
  regDt: string;
  mdfrId: string;
  mdfcnDt: string;
  pstInqCnt: string;
}

export interface QnaItem {
  id: number;
  title: string;
  content: string;
  writer: string;
  qstnSn: string;
  bbsId: string;
  pstTtl: string;
  qstnrNm: string;
  qstnrEml: string;
  rlsYn: string;
  pstEnpswd: string;
  pstCn: string;
  pstInqCnt: string;
  atchFileId: string;
  thmbId: string;
  delYn: string;
  rgtrId: string;
  regDt: string;
  regPrgmId: string;
  mdfrId: string;
  mdfcnDt: string;
  mdfcnPrgmId: string;
  qstnPrgrsSttsCd: string;
  hasFile: string;

  fileList?: FileItem[];
}

export interface AsmtPrpItem {
  id: number;
  title: string;
  content: string;
  writer: string;
  asmtPrpSn: string;
  pstEnpswd: string;
  rlsYn: string;
  asmtPrpsrNm: string;
  asmtPrpsrEml: string;
  asmtPrpsrTelno: string;
  asmtPrpsrOgdpNm: string;
  tpcTtlNm: string;
  asmtPrpCn: string;
  asmtExptEfctCn: string;
  asmtEtcExplnCn: string;
  asmtCutnMttrCn: string;
  atchFileId: string;
  delYn: string;
  rgtrId: string;
  regDt: string;
  regPrgmId: string;
  mdfrId: string;
  mdfcnDt: string;
  mdfcnPrgmId: string;
  pstInqCnt: string;
  asmtPrpAnsSttsCd: string;
  hasFile: string;

  fileList?: FileItem[];
}