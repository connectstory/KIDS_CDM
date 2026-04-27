import { useEffect, useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { ModalNames } from "@/interfaces/modalInterface";
import type { AsmtAccountRequest } from "@/interfaces/researchInterface";
import type { RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import { useCreateAsmtAccount, useUpdateAsmtAccount } from "@/hooks/research/useResearchMutations";
import BaseModal from "@/components/modal/BaseModal";

type vdiType = "vdi" | "db";

type AccountRowLike = {
  sqAsmtAccountSn: number;
  vdiName: string;
  vdiIp: string | null;
  vdiPort: string | null;
  vdiUse: string | null;
};

interface AsmtAccountModalData {
  vdiType: vdiType;
  editingAccount: AccountRowLike | null;
}

interface FormState {
  vdiName: string;
  vdiPw: string; // VDI: 비밀번호
  vdiIp: string;
  vdiPort: string;
  dbSchema: string; // DB: 스키마명
}

const initialForm: FormState = {
  vdiName: "",
  vdiPw: "",
  vdiIp: "",
  vdiPort: "",
  dbSchema: "",
};

/** IPv4 형식 검사 (각 옥텟 0~255) */
function isValidIPv4(value: string): boolean {
  if (!value?.trim()) return true;
  const octet = "(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)";
  const regex = new RegExp(`^(${octet}\\.){3}${octet}$`);
  return regex.test(value.trim());
}

export default function AsmtAccountModal() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.AsmtAccount]);

  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState<Record<string, string>>({});
  const [editingAccount, setEditingAccount] = useState<AccountRowLike | null>(null);

  const createMutation = useCreateAsmtAccount();
  const updateMutation = useUpdateAsmtAccount();

  useEffect(() => {
    if (!modal?.open) {
      return;
    }

    const data = modal.data as AsmtAccountModalData | undefined;
    const account = data?.editingAccount ?? null;
    const currentType: vdiType = data?.vdiType ?? "vdi";
    setEditingAccount(account);
    if (account) {
      setForm({
        vdiName: account.vdiName,
        vdiPw: "",
        vdiIp: account.vdiIp ?? "",
        vdiPort: account.vdiPort ?? "",
        dbSchema: currentType === "db" ? (account.vdiUse ?? "") : "",
      });
    } else {
      setForm(initialForm);
    }
    setFormError({});
  }, [modal?.open, modal?.data]);

  if (!modal?.open) return null;

  const data = modal.data as AsmtAccountModalData | undefined;
  const vdiType: vdiType = data?.vdiType ?? "vdi";

  const handleClose = (result: unknown = null) => {
    resolveModal(ModalNames.AsmtAccount, result);
    dispatch(closeModal(ModalNames.AsmtAccount));
  };

  const validateForm = (): boolean => {
    const err: Record<string, string> = {};
    if (!form.vdiName?.trim()) err.vdiName = "계정명을 입력하세요.";
    // if (vdiType === "vdi" && !editingAccount && !form.vdiPw?.trim()) {
    //   err.vdiPw = "비밀번호를 입력하세요.";
    // }
    if (vdiType === "db" && !form.dbSchema?.trim()) {
      err.dbSchema = "스키마를 입력하세요.";
    }
    if (vdiType === "vdi" && form.vdiIp?.trim() && !isValidIPv4(form.vdiIp))
      err.vdiIp = "올바른 IPv4 형식으로 입력하세요. (예: 192.168.0.1)";
    if (vdiType === "vdi" && form.vdiPort?.trim() && !/^\d+$/.test(form.vdiPort.trim()))
      err.vdiPort = "포트는 숫자만 입력하세요.";
    setFormError(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const payload: AsmtAccountRequest = {
      vdiType: vdiType,
      vdiName: form.vdiName.trim(),
      vdiIp: vdiType === "vdi" ? form.vdiIp.trim() || undefined : undefined,
      vdiPort: vdiType === "vdi" ? form.vdiPort.trim() || undefined : undefined,
    };

    // VDI: 비밀번호 사용, DB: 스키마를 vdiUse -> asmt_analysis_schema로 전송
    if (vdiType === "vdi") {
      // if (form.vdiPw?.trim()) {
      //   payload.vdiPw = form.vdiPw.trim();
      // }
    } else {
      if (form.dbSchema?.trim()) {
        payload.vdiUse = form.dbSchema.trim();
      }
    }

    if (editingAccount) {
      updateMutation.mutate({ sqAsmtAccountSn: editingAccount.sqAsmtAccountSn, payload }, { onSuccess: () => handleClose() });
    } else {
      // if (vdiType === "vdi" && !payload.vdiPw) {
      //   setFormError((e) => ({ ...e, vdiPw: "비밀번호를 입력하세요." }));
      //   return;
      // }
      if (vdiType === "db" && !payload.vdiUse) {
        setFormError((e) => ({ ...e, dbSchema: "스키마를 입력하세요." }));
        return;
      }
      createMutation.mutate({ data: payload }, { onSuccess: () => handleClose() });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const title = modal.title || (editingAccount ? "계정 수정" : "계정 등록");

  return (
    <BaseModal
      open={modal.open}
      onClose={() => handleClose(null)}
      title={title}
      width="sm"
      fullWidth
      footer={
        <>
          <Button variant="outlined" onClick={() => handleClose(null)}>
            취소
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
            {editingAccount ? "수정" : "등록"}
          </Button>
        </>
      }
    >
      <Box className="form_container">
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">계정명</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                variant="outlined"
                placeholder="계정명을 입력해주세요."
                label="계정명"
                value={form.vdiName}
                onChange={(e) => setForm((f) => ({ ...f, vdiName: e.target.value }))}
                error={!!formError.vdiName}
                helperText={formError.vdiName}
                fullWidth
                size="small"
              />
            </Box>
          </Box>
        </Stack>
        {/* {vdiType === "vdi" && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography className={editingAccount ? undefined : "required"}>비밀번호</Typography>
              </Box>
              <Box className="form_container-row-content">
                <TextField
                  variant="outlined"
                  type="password"
                  label="비밀번호"
                  placeholder="비밀번호를 입력해주세요."
                  value={form.vdiPw}
                  onChange={(e) => setForm((f) => ({ ...f, vdiPw: e.target.value }))}
                  error={!!formError.vdiPw}
                  helperText={formError.vdiPw}
                  fullWidth
                  size="small"
                  autoComplete="new-password"
                />
              </Box>
            </Box>
          </Stack>
        )} */}
        {vdiType === "db" && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography className="required">스키마</Typography>
              </Box>
              <Box className="form_container-row-content">
                <TextField
                  variant="outlined"
                  label="스키마"
                  placeholder="스키마명을 입력해주세요."
                  value={form.dbSchema}
                  onChange={(e) => setForm((f) => ({ ...f, dbSchema: e.target.value }))}
                  error={!!formError.dbSchema}
                  helperText={formError.dbSchema}
                  fullWidth
                  size="small"
                />
              </Box>
            </Box>
          </Stack>
        )}
        {vdiType === "vdi" && (
          <>
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>IP</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <TextField
                    variant="outlined"
                    placeholder="예: 192.168.0.1"
                    label="IP"
                    value={form.vdiIp}
                    onChange={(e) => {
                      const next = e.target.value;
                      setForm((f) => ({ ...f, vdiIp: next }));
                      setFormError((prev) => {
                        const rest = { ...prev };
                        delete rest.vdiIp;
                        if (!next.trim() || isValidIPv4(next)) return rest;
                        return { ...rest, vdiIp: "올바른 IPv4 형식으로 입력하세요. (예: 192.168.0.1)" };
                      });
                    }}
                    error={!!formError.vdiIp}
                    helperText={formError.vdiIp}
                    fullWidth
                    size="small"
                  />
                </Box>
              </Box>
            </Stack>
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>Port</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <TextField
                    variant="outlined"
                    placeholder="포트를 입력해주세요."
                    label="포트"
                    value={form.vdiPort}
                    onChange={(e) => setForm((f) => ({ ...f, vdiPort: e.target.value }))}
                    error={!!formError.vdiPort}
                    helperText={formError.vdiPort}
                    fullWidth
                    size="small"
                  />
                </Box>
              </Box>
            </Stack>
          </>
        )}
      </Box>
    </BaseModal>
  );
}
