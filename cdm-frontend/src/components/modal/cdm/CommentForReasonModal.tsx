/**
 * 거부사유 등록 모달 컴포넌트
 * 참여기관의 거부사유를 등록하는 모달
 *
 * 주요 기능:
 * - 기관 정보 표시 (기관명, 기관상태)
 * - 처리구분 선택 (참여취소/참여승인)
 * - 거부사유 입력
 * - 저장 및 취소
 */
import { useState } from "react";
import { Box, Button, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { MSG } from "@/constants/string";
import { CONTENT_GAP } from "@/constants/types";
import type { DisclosurePartnerResponse } from "@/interfaces/disclosureInterface.ts";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import { SpaceBox } from "@/components/SpaceBox";
import BaseModal from "@/components/modal/BaseModal";

interface CommentForReasonModalData {
  partner: DisclosurePartnerResponse;
  /** 협력기관 화면 참여거부: 처리구분 숨김, 사유 입력 위주 */
  partnerRefuseOnly?: boolean;
}

export default function CommentForReasonModal() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.CommentForReason]);

  const [processType, setProcessType] = useState<string>("04"); // 04: 참여취소, 기본값
  const [reason, setReason] = useState<string>("");
  const [reasonError, setReasonError] = useState<string>("");

  if (!modal?.open) return null;

  const modalData = modal.data as CommentForReasonModalData | undefined;
  const partnerRefuseOnly = modalData?.partnerRefuseOnly === true;

  /**
   * 상태 코드 포맷팅 함수
   */
  const formatStatus = (status: string | null | undefined): string => {
    if (!status) return "-";
    const statusMap: Record<string, string> = {
      "01": "참여요청",
      "02": "진행중",
      "03": "완료",
      "04": "참여취소",
      "05": "등록",
      "06": "참여재요청",
      "07": "등록재요청",
    };
    return statusMap[status] || status;
  };

  /**
   * 모달 닫기 핸들러
   * 모달을 닫고 결과를 반환하는 함수
   * @param result - 모달 결과 (성공 여부)
   */
  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.CommentForReason, result);
    dispatch(closeModal(ModalNames.CommentForReason));
    // 상태 초기화
    setProcessType("04");
    setReason("");
    setReasonError("");
  };

  /**
   * 저장 핸들러
   * 거부사유를 검증하고 저장하는 함수
   */
  const handleSave = () => {
    // 필수 데이터 검증
    if (!modalData?.partner) {
      return;
    }

    if (!reason.trim()) {
      setReasonError(MSG.CONTENT_REQUIRED);
      return;
    }

    // 저장 로직은 호출하는 곳에서 처리하도록 result와 함께 데이터 반환
    const result = {
      ptcpInstSn: modalData.partner.ptcpInstSn,
      processType: partnerRefuseOnly ? "04" : processType, // 참여거부는 항상 04(참여취소)
      reason: reason.trim(),
    };

    resolveModal(ModalNames.CommentForReason, result);
    dispatch(closeModal(ModalNames.CommentForReason));

    // 상태 초기화
    setProcessType("04");
    setReason("");
    setReasonError("");
  };

  return (
    <BaseModal
      open={modal.open}
      onClose={() => handleClose(false)}
      title={modal.title || (partnerRefuseOnly ? "참여거부 사유 입력" : "거부사유 등록")}
      width="sm"
      fullWidth={true}
      footer={
        <>
          <Button variant="outlined" onClick={() => handleClose(false)}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ backgroundColor: "#f39800", "&:hover": { backgroundColor: "#e68900" } }}
          >
            {partnerRefuseOnly ? "확인" : "저장"}
          </Button>
        </>
      }
    >
      <Box>
        {/* 기관정보 섹션 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ color: "#f39800", fontWeight: "bold", mb: 1 }}>
            기관정보
          </Typography>
          <Box
            sx={{
              border: "1px solid #cfcfcf",
              padding: "10px",
              backgroundColor: "#f7f7f7",
              borderRadius: "4px",
            }}
          >
            {/* 기관명 */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography variant="body2" sx={{ width: "80px", fontSize: "13px", color: "#555" }}>
                기관명
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={modalData?.partner?.instNm || ""}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#fff",
                    fontSize: "13px",
                  },
                }}
              />
            </Box>

            {/* 기관상태 (+ 관리자용 처리구분) */}
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                flexDirection: partnerRefuseOnly ? "column" : "row",
                alignItems: partnerRefuseOnly ? "stretch" : "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flex: partnerRefuseOnly ? undefined : 1,
                  width: partnerRefuseOnly ? "100%" : undefined,
                }}
              >
                <Typography variant="body2" sx={{ width: "80px", fontSize: "13px", color: "#555", flexShrink: 0 }}>
                  기관상태
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formatStatus(modalData?.partner?.uldInstPrgrsSttsStcd || null)}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#fff",
                      fontSize: "13px",
                    },
                  }}
                />
              </Box>
              {!partnerRefuseOnly && (
                <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <Typography variant="body2" sx={{ width: "80px", fontSize: "13px", color: "#555" }}>
                    처리구분
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={processType}
                    onChange={(e) => setProcessType(e.target.value)}
                    sx={{
                      fontSize: "13px",
                      backgroundColor: "#fff",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#cfcfcf",
                      },
                    }}
                  >
                    <MenuItem value="04">참여취소</MenuItem>
                    <MenuItem value="02">참여승인</MenuItem>
                  </Select>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        <SpaceBox gap={CONTENT_GAP.SMALL} />

        {/* 사유정보 섹션 */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "#333" }}>
            {partnerRefuseOnly ? "참여거부 사유" : "사유"}
            {partnerRefuseOnly ? " (필수)" : ""}
          </Typography>
          <TextField
            error={reasonError.length > 0}
            helperText={reasonError}
            fullWidth
            multiline
            rows={5}
            autoFocus={partnerRefuseOnly}
            placeholder={partnerRefuseOnly ? "참여를 거부하는 사유를 입력해 주세요." : "사유정보를 입력하여 주시기 바랍니다."}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setReasonError("");
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "13px",
              },
            }}
          />
        </Box>
      </Box>
    </BaseModal>
  );
}
