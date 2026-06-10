import { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { MSG, STRINGS } from "@/constants/string";
import { CONTENT_GAP, DISCLOSURE_PARTNER_PROGRESS_STATUS } from "@/constants/types";
import type { DisclosurePartnerResponse } from "@/interfaces/disclosureInterface.ts";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { closeModal } from "@/store/modalSlice";
import { formatDateTime } from "@/utils/dateUtils";
import { resolveModal } from "@/utils/modalPromise";
import { disclosureKeys } from "@/hooks/disclosure/disclosureQueryKeys";
import { useRequestDisclosurePartnerStatus, useUpdateDisclosureCancelReason } from "@/hooks/disclosure/useDisclosureMutations";
import { type DisclosureCancelReasonView, useDisclosureCancelReason } from "@/hooks/disclosure/useDisclosureQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import Loader from "@/components/Loader";
import { SpaceBox } from "@/components/SpaceBox";
import BaseModal from "@/components/modal/BaseModal";

export interface CancelReasonViewModalData {
  partner: DisclosurePartnerResponse;
  pblntSn: number;
  /** true: 사유 입력 후 참여취소(04)를 모달에서 PUT /progress 로 처리 */
  initialWithdraw?: boolean;
  successMessage?: string;
}

export default function CancelReasonViewModal() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const modal = useSelector((state: any) => state.modal.modals[ModalNames.CancelReasonView]);
  const modalData = modal?.data as CancelReasonViewModalData | undefined;
  const { showAlert } = useGlobalAlert();

  const reasonNoun = "취소사유";

  const [cancelReason, setCancelReason] = useState<string>("");
  const [originalCancelReason, setOriginalCancelReason] = useState<string>("");
  const [reasonError, setReasonError] = useState<string>("");

  const pblntSn = useMemo(() => modalData?.pblntSn ?? null, [modalData?.pblntSn]);
  const ptcpInstSn = useMemo(() => modalData?.partner?.ptcpInstSn ?? null, [modalData?.partner?.ptcpInstSn]);
  const initialWithdraw = modalData?.initialWithdraw === true;

  const reasonQuery = useDisclosureCancelReason(
    pblntSn,
    ptcpInstSn,
    Boolean(modal?.open && pblntSn && ptcpInstSn && !initialWithdraw)
  );
  const reasonView: DisclosureCancelReasonView = reasonQuery.data ?? {
    cancelReason: "",
    rgtrId: "",
    rgtrNm: "",
    regDt: "",
    canEdit: true,
  };
  const loading = reasonQuery.isFetching;
  const isLoadError = reasonQuery.isError;
  const loadError = reasonQuery.error;

  const canEditReason = initialWithdraw || reasonView.canEdit;

  const updateCancelReasonMutation = useUpdateDisclosureCancelReason();
  const requestProgressMutation = useRequestDisclosurePartnerStatus();
  const saving = updateCancelReasonMutation.isPending;
  const withdrawing = requestProgressMutation.isPending;

  useEffect(() => {
    if (!modal?.open) {
      setCancelReason("");
      setOriginalCancelReason("");
      setReasonError("");
      return;
    }
    if (initialWithdraw) {
      setCancelReason("");
      setOriginalCancelReason("");
      setReasonError("");
      return;
    }
    setCancelReason(reasonView.cancelReason || "");
    setOriginalCancelReason(reasonView.cancelReason || "");
    setReasonError("");
  }, [modal?.open, initialWithdraw, reasonView.cancelReason]);

  useEffect(() => {
    if (!modal?.open) return;
    if (!isLoadError) return;
    const errorMessage = (loadError as any)?.response?.data?.message || loadError?.message || "알 수 없는 오류";
    showAlert({ message: `${reasonNoun}를 불러오는 중 오류가 발생했습니다: ${errorMessage}`, severity: "error" });
  }, [isLoadError, loadError, modal?.open, reasonNoun, showAlert]);

  const handleClose = () => {
    setCancelReason("");
    setOriginalCancelReason("");
    setReasonError("");
    resolveModal(ModalNames.CancelReasonView, null);
    dispatch(closeModal(ModalNames.CancelReasonView));
  };

  const handleInitialWithdraw = async () => {
    if (!modalData?.partner || !modalData?.pblntSn) {
      return;
    }
    if (!cancelReason.trim()) {
      setReasonError(MSG.CONTENT_REQUIRED);
      return;
    }
    setReasonError("");
    try {
      await requestProgressMutation.mutateAsync({
        pblntSn: modalData.pblntSn,
        ptcpInstSn: modalData.partner.ptcpInstSn,
        status: DISCLOSURE_PARTNER_PROGRESS_STATUS.CANCELLED,
        reason: cancelReason.trim(),
        successMessage: modalData.successMessage ?? "처리되었습니다.",
      });
      await queryClient.refetchQueries({ queryKey: disclosureKeys.partners(modalData.pblntSn) });
      resolveModal(ModalNames.CancelReasonView, null);
      dispatch(closeModal(ModalNames.CancelReasonView));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "알 수 없는 오류";
      setReasonError(errorMessage);
    }
  };

  const handleSaveEdit = async () => {
    if (!modalData?.partner || !modalData?.pblntSn) {
      return;
    }
    if (!canEditReason) {
      return;
    }
    if (!cancelReason.trim()) {
      setReasonError(MSG.CONTENT_REQUIRED);
      return;
    }
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
        successMessage: `${reasonNoun}가 수정되었습니다.`,
      });

      setOriginalCancelReason(cancelReason.trim());
      await queryClient.refetchQueries({ queryKey: disclosureKeys.partners(modalData.pblntSn) });
      resolveModal(ModalNames.CancelReasonView, null);
      dispatch(closeModal(ModalNames.CancelReasonView));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "알 수 없는 오류";
      setReasonError(errorMessage);
    }
  };

  const handlePrimary = () => {
    if (initialWithdraw) {
      void handleInitialWithdraw();
    } else {
      void handleSaveEdit();
    }
  };

  const primaryDisabled = initialWithdraw
    ? withdrawing || loading || !cancelReason.trim()
    : !canEditReason || saving || loading || !cancelReason.trim() || cancelReason.trim() === originalCancelReason;

  const showPrimary = initialWithdraw || canEditReason;
  const modalTitle = useMemo(() => (initialWithdraw ? "취소사유 등록" : "취소사유 조회"), [initialWithdraw]);
  const sectionTitle = initialWithdraw ? reasonNoun : `${STRINGS.CANCEL_INVITE} ${STRINGS.INFO}`;

  if (!modal?.open) return null;

  return (
    <BaseModal
      open={modal.open}
      onClose={handleClose}
      title={modalTitle}
      width="md"
      fullWidth={true}
      footer={
        <>
          {showPrimary ? (
            <Button variant="contained" onClick={handlePrimary} disabled={primaryDisabled}>
              {STRINGS.CONFIRM}
            </Button>
          ) : null}
          <Button variant="outlined" onClick={handleClose}>
            닫기
          </Button>
        </>
      }
    >
      <Box>
        <Stack direction="column" spacing={CONTENT_GAP.XSMALL}>
          <Typography variant="subtitle">{modalData?.partner?.instNm || ""}</Typography>
        </Stack>

        <SpaceBox gap={CONTENT_GAP.LARGE} />

        {loading && !initialWithdraw && (
          <Box sx={{ position: "relative", minHeight: 200 }}>
            <Loader isLoading={true} />
          </Box>
        )}

        {(!loading || initialWithdraw) && (
          <Box>
            <Box className="sub_path">
              <Typography className="tit" variant="h5">
                {sectionTitle}
              </Typography>
            </Box>

            <Box className="form_container">
              {!initialWithdraw && (
                <Stack direction="row" className="form_container-row">
                  <Box className="form_container-column">
                    <Box className="form_container-row-label">
                      <Typography variant="h6">{STRINGS.REGISTERED_BY}</Typography>
                    </Box>
                    <Box className="form_container-row-content">
                      <Typography variant="default">{reasonView.rgtrNm || reasonView.rgtrId || "-"}</Typography>
                    </Box>
                  </Box>
                  <Box className="form_container-column">
                    <Box className="form_container-row-label">
                      <Typography variant="h6">{STRINGS.REGISTERED_AT}</Typography>
                    </Box>
                    <Box className="form_container-row-content">
                      <Typography variant="default">{formatDateTime(reasonView.regDt) || "-"}</Typography>
                    </Box>
                  </Box>
                </Stack>
              )}

              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography variant="h6">{STRINGS.CONTENT}</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    {canEditReason ? (
                      <TextField
                        error={reasonError.length > 0}
                        helperText={reasonError}
                        fullWidth
                        multiline
                        minRows={4}
                        placeholder={`${reasonNoun}를 입력하여 주시기 바랍니다.`}
                        value={cancelReason}
                        onChange={(e) => {
                          setCancelReason(e.target.value);
                          setReasonError("");
                        }}
                        disabled={saving || withdrawing}
                        size="small"
                      />
                    ) : (
                      <Typography component="pre" variant="default">
                        {cancelReason || "-"}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        )}
      </Box>
    </BaseModal>
  );
}
