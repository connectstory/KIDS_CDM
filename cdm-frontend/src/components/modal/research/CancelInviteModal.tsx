import { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { MSG, STRINGS } from "@/constants/string";
import { CONTENT_GAP } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import type { ResearchPartnerResponse } from "@/interfaces/researchInterface";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import { useCancelInvitePartner } from "@/hooks/research/useResearchMutations";
import { useResearchDetail } from "@/hooks/research/useResearchQueries";
import { useModal } from "@/hooks/useModal";
import { SpaceBox } from "@/components/SpaceBox";
import BaseModal from "@/components/modal/BaseModal";

interface CancelInviteModalData {
  partner: ResearchPartnerResponse;
}

export default function CancelInviteModal() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.CancelInvite]);
  const { asmtSn } = useParams<{ asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;
  const { data: research } = useResearchDetail(asmtSnNumber);
  const confirmModal = useModal(ModalNames.CONFIRM);
  const cancelInviteMutation = useCancelInvitePartner();

  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  if (!modal?.open) return null;

  const modalData = modal.data as CancelInviteModalData | undefined;

  /**
   * 모달 닫기 핸들러
   * 모달을 닫고 결과를 반환하는 함수
   * @param result - 모달 결과 (성공 여부)
   */
  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.CancelInvite, result);
    dispatch(closeModal(ModalNames.CancelInvite));
  };

  /**
   * 참여취소 제출 핸들러
   * 참여취소 사유를 검증하고 API를 호출하여 참여취소를 처리하는 함수
   */
  const handleSubmitCancelInvite = async () => {
    // 필수 데이터 검증
    if (!research || !modalData?.partner) {
      return;
    }

    if (!description.trim()) {
      setDescriptionError(MSG.CONTENT_REQUIRED);
      return;
    }

    // 이미 제출 중인 경우 중복 제출 방지
    if (cancelInviteMutation.isPending) {
      return;
    }

    try {
      // 확인 모달 표시
      const result = await confirmModal.open({
        title: STRINGS.WARNING,
        message: MSG.CONFIRM_CANCEL_INVITE,
      });

      if (!result) {
        return;
      }

      // API 호출 (에러 처리는 mutation의 onError에서 자동 처리됨)
      await cancelInviteMutation.mutateAsync({
        asmtSn: asmtSnNumber!,
        asmtPtcpInstSn: modalData.partner.asmtPtcpInstSn,
        data: {
          asmtPtcpRtrcnRsn: description.trim(),
        },
      });

      // 성공 시 모달 닫기 (onSuccess에서 alert는 자동 표시됨)
      handleClose(true);
    } catch (error) {
      // 에러는 mutation의 onError에서 자동 처리됨
      console.error("참여취소 처리 중 오류 발생:", error);
    }
  };

  return (
    <BaseModal
      open={modal.open}
      onClose={() => handleClose(false)}
      title="참여취소"
      width="sm"
      fullWidth={true}
      footer={
        <>
          <Button variant="contained" onClick={() => handleSubmitCancelInvite()} disabled={cancelInviteMutation.isPending}>
            확인
          </Button>
          <Button variant="outlined" onClick={() => handleClose(false)} disabled={cancelInviteMutation.isPending}>
            취소
          </Button>
        </>
      }
    >
      {/* 메시지 출력 */}
      <Box>
        <Box>
          <Typography variant="h5">{modalData?.partner?.instNm || ""}</Typography>
        </Box>

        <SpaceBox gap={CONTENT_GAP.MEDIUM} />

        <Box>
          <TextField
            error={descriptionError.length > 0}
            helperText={descriptionError}
            fullWidth
            multiline
            rows={4}
            label="참여취소 사유"
            placeholder={MSG.CONTENT_REQUIRED}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setDescriptionError("");
            }}
          />
        </Box>
      </Box>
    </BaseModal>
  );
}
