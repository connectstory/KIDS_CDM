import { useEffect, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { MSG } from "@/constants/string";
import type { DisclosurePartnerResponse } from "@/interfaces/disclosureInterface.ts";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { DisclosureAPI } from "@/api/disclosureApi";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
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
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [reasonError, setReasonError] = useState<string>("");

  useEffect(() => {
    if (modal?.open && modalData?.partner && modalData?.pblntSn) {
      loadCancelReason();
    } else {
      setCancelReason("");
    }
  }, [modal?.open, modalData?.partner?.ptcpInstSn, modalData?.pblntSn]);

  const loadCancelReason = async () => {
    if (!modalData?.partner || !modalData?.pblntSn) return;

    setLoading(true);
    try {
      const response = await DisclosureAPI.getCancelReason(modalData.pblntSn, modalData.partner.ptcpInstSn);
      const reason = response.data?.data?.cancelReason || "";
      if (reason) {
        setCancelReason(reason);
        setOriginalCancelReason(reason);
      } else {
        setCancelReason("");
        setOriginalCancelReason("");
      }
    } catch (error: any) {
      // 404 에러인 경우 취소사유가 없는 것으로 처리
      if (error?.response?.status === 404) {
        setCancelReason("");
        setOriginalCancelReason("");
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || "알 수 없는 오류";
        showAlert({ message: `취소사유를 불러오는 중 오류가 발생했습니다: ${errorMessage}`, severity: "error" });
        setCancelReason("");
        setOriginalCancelReason("");
      }
    } finally {
      setLoading(false);
    }
  };

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

    setSaving(true);
    setReasonError("");

    try {
      await DisclosureAPI.updateCancelReason(modalData.pblntSn, modalData.partner.ptcpInstSn, cancelReason.trim());

      setOriginalCancelReason(cancelReason.trim());
      showAlert({ message: "취소사유가 수정되었습니다.", severity: "success" });
      //창닫기
      resolveModal(ModalNames.CancelReasonView, null);
      dispatch(closeModal(ModalNames.CancelReasonView));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "알 수 없는 오류";
      setReasonError(errorMessage);
      showAlert({ message: `취소사유 수정 중 오류가 발생했습니다: ${errorMessage}`, severity: "error" });
    } finally {
      setSaving(false);
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
            sx={{ backgroundColor: "#f39800", "&:hover": { backgroundColor: "#e68900" } }}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
          <Button variant="outlined" onClick={handleClose}>
            닫기
          </Button>
        </>
      }
    >
      <Box>
        {/* 기관정보 - 간소화 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontSize: "13px", color: "#666", mb: 0.5 }}>
            {modalData?.partner?.instNm || ""}
          </Typography>
        </Box>

        {/* 취소사유 */}
        <TextField
          error={reasonError.length > 0}
          helperText={reasonError}
          fullWidth
          multiline
          rows={5}
          placeholder="취소사유를 입력하여 주시기 바랍니다."
          value={loading ? "로딩 중..." : cancelReason}
          onChange={(e) => {
            setCancelReason(e.target.value);
            setReasonError("");
          }}
          disabled={loading || saving}
          sx={{
            "& .MuiOutlinedInput-root": {
              fontSize: "13px",
              backgroundColor: "#fff",
            },
          }}
        />
      </Box>
    </BaseModal>
  );
}
