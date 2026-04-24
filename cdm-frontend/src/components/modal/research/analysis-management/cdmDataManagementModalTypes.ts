/** 모달에 전달되는 데이터 타입 */
export interface CdmDataManagementModalData {
  asmtMetaRsltSn?: number; // 초기 표시할 분석 데이터 일련번호
}

export type CdmDataManagementViewType = "none" | "write" | "detail";
