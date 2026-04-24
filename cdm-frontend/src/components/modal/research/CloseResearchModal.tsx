import { useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { STRINGS } from "@/constants/string";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import { useCancelResearch, useCloseResearch } from "@/hooks/research/useResearchMutations";
import { useModal } from "@/hooks/useModal";
import BaseModal from "@/components/modal/BaseModal";

interface CloseResearchModalData {
  closeType: "cancel" | "new" | "analysis";
}

export default function CloseResearchModal() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.CloseResearch]);
  const { asmtSn } = useParams<{ asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;
  const confirmModal = useModal(ModalNames.CONFIRM);
  const closeResearchMutation = useCloseResearch();
  const cancelResearchMutation = useCancelResearch();

  const [content, setContent] = useState("");

  const modalData = modal?.open ? (modal.data as CloseResearchModalData) : null;

  // useEffect(() => {
  //   setCloseType(modalData?.closeType || "");
  // }, [modalData]);

  if (!modal?.open) return null;

  /**
   * 모달 닫기 핸들러
   * 모달을 닫고 결과를 반환하는 함수
   * @param result - 모달 결과 (성공 여부)
   */
  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.CloseResearch, result);
    dispatch(closeModal(ModalNames.CloseResearch));
    setContent("");
  };

  /**
   * 마감 제출 핸들러
   * 선택된 마감 유형으로 API를 호출하여 마감을 처리하는 함수
   */
  const isCancel = modalData?.closeType === "cancel";
  const isPending = isCancel ? cancelResearchMutation.isPending : closeResearchMutation.isPending;

  const handleSubmitCloseResearch = async () => {
    if (!asmtSnNumber) {
      return;
    }

    if (isPending) {
      return;
    }

    try {
      const result = await confirmModal.open({
        title: STRINGS.CONFIRM,
        message: `과제를 ${isCancel ? "취소" : "마감"}하시겠습니까?`,
      });

      if (!result) {
        return;
      }

      if (isCancel) {
        await cancelResearchMutation.mutateAsync({
          asmtSn: asmtSnNumber,
          data: { asmtClsCn: content },
        });
      } else {
        await closeResearchMutation.mutateAsync({
          asmtSn: asmtSnNumber,
          data: { asmtClsCn: content },
        });
      }

      handleClose(true);
    } catch (error) {
      console.error(`과제 ${isCancel ? "취소" : "마감"} 처리 중 오류 발생:`, error);
    }
  };

  return (
    <BaseModal
      open={modal.open}
      onClose={() => handleClose(false)}
      title={modalData?.closeType === "cancel" ? "연구과제 취소" : "연구과제 마감"}
      width="sm"
      fullWidth={true}
      footer={
        <>
          <Button variant="contained" onClick={() => handleSubmitCloseResearch()} disabled={isPending}>
            확인
          </Button>
          <Button variant="outlined" onClick={() => handleClose(false)} disabled={isPending}>
            취소
          </Button>
        </>
      }
    >
      <Box>
        <TextField
          fullWidth
          label={modalData?.closeType === "cancel" ? "취소 사유" : "마감 사유"}
          placeholder={
            modalData?.closeType === "cancel"
              ? "연구과제 취소 사유를 입력해주세요, (예: 신규 생성, 분석 취소)"
              : "연구과제 마감 사유를 입력해주세요"
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          multiline
          minRows={2}
          sx={{ mt: 1 }}
        />
      </Box>
    </BaseModal>
  );
}
