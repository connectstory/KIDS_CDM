/************************************************
 * 모달 네임
 ************************************************/
export const ModalNames = {
  CONFIRM: "confirm",
  PDF_PREVIEW: "pdf-preview",
  AddPartners: "add-partners",
  CancelInvite: "cancel-invite",
  CloseResearch: "close-research",
  IrbView: "irb-view",
  IrbUpload: "irb-upload",
  AnalysisResultUpload: "analysis-upload",
  AnalysisDataManagement: "analysis-data-management",
  MetaDataManagement: "meta-data-management",
  CdmDataManagement: "cdm-data-management",
  OrgDataManagement: "org-data-management",
  AsmtAccount: "asmt-account",
  TextView: "text-view",
  PartnerDetail: "partner-detail",
  DrbView: "drb-view",
  CommentForReason: "comment-for-reason",
  CancelReasonView: "cancel-reason-view",
} as const;

export type ModalNames = (typeof ModalNames)[keyof typeof ModalNames];
