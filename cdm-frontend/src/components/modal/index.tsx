import { useSelector } from "react-redux";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { type RootState } from "@/store";
import CancelReasonViewModal from "./cdm/CancelReasonViewModal";
import CommentForReasonModal from "./cdm/CommentForReasonModal";
import DrbViewModal from "./cdm/DrbViewModal";
import AddPartnersModal from "./common/AddPartnersModal";
import ConfirmModal from "./common/ConfirmModal";
import PdfPreviewModal from "./common/PdfPreviewModal";
import AnalysisUploadModal from "./research/AnalysisResultUploadModal";
import CancelInviteModal from "./research/CancelInviteModal";
import CloseResearchModal from "./research/CloseResearchModal";
import IrbUploadModal from "./research/IrbUploadModal";
import IrbViewModal from "./research/IrbViewModal";
import PartnerDetailModal from "./research/PartnerDetailModal";
import TextViewModal from "./research/TextViewModal";
import AsmtAccountModal from "./research/AsmtAccountModal";
import AnalysisDataManagementModal from "./research/analysis-management/AnalysisDataManagementModal";
import CdmDataManagementModal from "./research/analysis-management/CdmDataManagementModal";
import MetaDataManagementModal from "./research/analysis-management/MetaDataManagementModal";
import OrgDataManagementModal from "./research/analysis-management/OrgDataManagementModal";

const MODAL_COMPONENTS: Record<ModalNames, React.FC> = {
  [ModalNames.CONFIRM]: ConfirmModal,
  [ModalNames.PDF_PREVIEW]: PdfPreviewModal,
  [ModalNames.AddPartners]: AddPartnersModal,
  [ModalNames.CancelInvite]: CancelInviteModal,
  [ModalNames.CloseResearch]: CloseResearchModal,
  [ModalNames.IrbView]: IrbViewModal,
  [ModalNames.IrbUpload]: IrbUploadModal,
  [ModalNames.AnalysisResultUpload]: AnalysisUploadModal,
  [ModalNames.AnalysisDataManagement]: AnalysisDataManagementModal,
  [ModalNames.MetaDataManagement]: MetaDataManagementModal,
  [ModalNames.OrgDataManagement]: OrgDataManagementModal,
  [ModalNames.CdmDataManagement]: CdmDataManagementModal,
  [ModalNames.AsmtAccount]: AsmtAccountModal,
  [ModalNames.TextView]: TextViewModal,
  [ModalNames.PartnerDetail]: PartnerDetailModal,
  [ModalNames.DrbView]: DrbViewModal,
  [ModalNames.CommentForReason]: CommentForReasonModal,
  [ModalNames.CancelReasonView]: CancelReasonViewModal,
};

export default function ModalHost() {
  const { stack, modals } = useSelector((state: RootState) => state.modal);

  return (
    <>
      {stack.map((key, index) => {
        if (!modals[key]?.open) return null;

        const Modal = MODAL_COMPONENTS[key];
        if (!Modal) return null;

        return <Modal key={`${key}-${index}`} />;
      })}
    </>
  );
}
