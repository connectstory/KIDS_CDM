import { Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { ModalNames } from "@/interfaces/modalInterface";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import BaseModal from "@/components/modal/BaseModal";

export default function ConfirmModal() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.TextView]);

  if (!modal?.open) return null;

  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.TextView, result);
    dispatch(closeModal(ModalNames.TextView));
  };

  return (
    <BaseModal
      open={modal.open}
      onClose={() => handleClose(false)}
      title={modal.title ? modal.title : "더보기"}
      width="md"
      fullWidth={true}
    >
      {/* 메시지 출력 */}
      <Typography component="pre" whiteSpace="pre-wrap" variant="default">
        {modal.message}
      </Typography>
    </BaseModal>
  );
}
