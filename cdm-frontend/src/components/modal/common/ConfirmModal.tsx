import { Box, type Breakpoint, Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import BaseModal from "@/components/modal/BaseModal";
import ConfirmModalStyles from "./ConfirmModal.module.css";

interface ConfirmModalData {
  hiddenCancelButton?: boolean;
  hiddenConfirmButton?: boolean;
}

export default function ConfirmModal() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.CONFIRM]);

  if (!modal?.open) return null;

  const modalData = modal.data as ConfirmModalData;

  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.CONFIRM, result);
    dispatch(closeModal(ModalNames.CONFIRM));
  };

  return (
    <BaseModal
      open={modal.open}
      onClose={() => handleClose(false)}
      title={modal.title ? modal.title : undefined}
      width={modal.width ? (modal.width as Breakpoint) : false}
      fullWidth={modal.fullWidth ? modal.fullWidth : false}
      footer={
        <>
          {(!modalData || !modalData.hiddenConfirmButton) && (
            <Button variant="contained" onClick={() => handleClose(true)}>
              확인
            </Button>
          )}
          {(!modalData || !modalData.hiddenCancelButton) && (
            <Button variant="outlined" onClick={() => handleClose(false)}>
              취소
            </Button>
          )}
        </>
      }
    >
      {/* 메시지 출력 */}
      <Box className={ConfirmModalStyles.message_wrapper}>
        {Array.isArray(modal.message) ? (
          <>
            {modal.message.map((line, index) => (
              <p key={index} className={ConfirmModalStyles.message_line}>
                {line}
              </p>
            ))}
          </>
        ) : (
          <p className={ConfirmModalStyles.message_line}>{modal.message}</p>
        )}
      </Box>
    </BaseModal>
  );
}
