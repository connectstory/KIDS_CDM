import { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { MSG } from "@/constants/string";
import { CONTENT_GAP } from "@/constants/types";
import type { DisclosurePartnerResponse } from "@/interfaces/disclosureInterface.ts";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import { useUpdateDisclosureCancelReason } from "@/hooks/disclosure/useDisclosureMutations";
import { useDisclosureCancelReason } from "@/hooks/disclosure/useDisclosureQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { SpaceBox } from "@/components/SpaceBox";
import BaseModal from "@/components/modal/BaseModal";

interface CancelReasonViewModalData {
  partner: DisclosurePartnerResponse;
  pblntSn: number;
}

export default function CancelReasonViewModal() {
  const dispatch = useDispatch();
  const modal = useSelector((state: any) => state.modal.modals[ModalNames.CancelReasonView]);
  const modalData = modal?.data as CancelReasonViewModalData | undefined;
  const { showAlert } = useGlobalAlert();

  const [cancelReason, setCancelReason] = useState<string>("");
  const [originalCancelReason, setOriginalCancelReason] = useState<string>("");
  const [reasonError, setReasonError] = useState<string>("");

  const pblntSn = useMemo(() => modalData?.pblntSn ?? null, [modalData?.pblntSn]);
  const ptcpInstSn = useMemo(() => modalData?.partner?.ptcpInstSn ?? null, [modalData?.partner?.ptcpInstSn]);

  const {
    data: fetchedCancelReason = "",
    isFetching: loading,
    isError: isLoadError,
    error: loadError,
  } = useDisclosureCancelReason(pblntSn, ptcpInstSn, Boolean(modal?.open && pblntSn && ptcpInstSn));

  const updateCancelReasonMutation = useUpdateDisclosureCancelReason();
  const saving = updateCancelReasonMutation.isPending;

  useEffect(() => {
    if (!modal?.open) {
      setCancelReason("");
      setOriginalCancelReason("");
      setReasonError("");
      return;
    }

    setCancelReason(fetchedCancelReason || "");
    setOriginalCancelReason(fetchedCancelReason || "");
    setReasonError("");
  }, [modal?.open, fetchedCancelReason]);

  useEffect(() => {
    if (!modal?.open) return;
    if (!isLoadError) return;
    const errorMessage = (loadError as any)?.response?.data?.message || loadError?.message || "알 수 없는 오류";
    showAlert({ message: `취소사유를 불러오는 중 오류가 발생했습니다: ${errorMessage}`, severity: "error" });
  }, [isLoadError, loadError, modal?.open, showAlert]);

  const handleClose = () => {
    setCancelReason("");
    setOriginalCancelReason("");
    setReasonError("");
    resolveModal(ModalNames.CancelReasonView, null);
    dispatch(closeModal(ModalNames.CancelReasonView));
  };

  const handleSave = async () => {
    if (!modalData?.partner || !modalData?.pblntSn) {
      return;
    }

    // 취소사유 검증
    if (!cancelReason.trim()) {
      setReasonError(MSG.CONTENT_REQUIRED);
      return;
    }

    // 변경사유가 없는 경우
    if (cancelReason.trim() === originalCancelReason) {
      showAlert({ message: "변경된 내용이 없습니다.", severity: "info" });
      return;
    }

    setReasonError("");

    try {
      await updateCancelReasonMutation.mutateAsync({
        pblntSn: modalData.pblntSn,
        ptcpInstSn: modalData.partner.ptcpInstSn,
        cancelReason: cancelReason.trim(),
        successMessage: "취소사유가 수정되었습니다.",
      });

      setOriginalCancelReason(cancelReason.trim());
      //창닫기
      resolveModal(ModalNames.CancelReasonView, null);
      dispatch(closeModal(ModalNames.CancelReasonView));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "알 수 없는 오류";
      setReasonError(errorMessage);
    } finally {
      // 상태는 mutation에서 관리 (isPending)
    }
  };

  return (
    <BaseModal
      open={modal.open}
      onClose={handleClose}
      title="취소사유"
      width="sm"
      fullWidth={true}
      footer={
        <>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || loading || !cancelReason.trim() || cancelReason.trim() === originalCancelReason}
          >
            확인
          </Button>
          <Button variant="outlined" onClick={handleClose}>
            닫기
          </Button>
        </>
      }
    >
      <Box>
        <Stack direction="column" spacing={CONTENT_GAP.XSMALL}>
          <Typography variant="h5">{modalData?.partner?.instNm || ""}</Typography>
        </Stack>

        <SpaceBox gap={CONTENT_GAP.LARGE} />

        {/* <Box className="form_container"> */}
        <TextField
          error={reasonError.length > 0}
          helperText={reasonError}
          fullWidth
          multiline
          minRows={4}
          label="취소사유"
          placeholder="취소사유를 입력하여 주시기 바랍니다."
          value={loading ? "로딩 중..." : cancelReason}
          onChange={(e) => {
            setCancelReason(e.target.value);
            setReasonError("");
          }}
          disabled={loading || saving}
        />
        {/* </Box> */}
      </Box>
    </BaseModal>
  );
}
