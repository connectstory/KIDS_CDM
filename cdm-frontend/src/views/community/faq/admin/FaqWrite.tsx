import { MSG, STRINGS } from "@/constants/string";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFaqDetail, insertFaq, updateFaq } from "@/api/communityApi";
import { fetchCommonCodes } from "@/api/commonApi";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, useBlocker } from "react-router-dom";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { Helmet } from "react-helmet";

export default function FaqWriteView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const faqSn = searchParams.get("faqSn");

  const isEditMode = !!faqSn;
  const { showAlert } = useGlobalAlert();
  const isModalOpenRef = useRef(false);
  const confirmModal = useModal(ModalNames.CONFIRM);
  const [shouldBlock, setShouldBlock] = useState(true);
  const skipBlockRef = useRef(false);

  const [category, setCategory] = useState("01");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !skipBlockRef.current &&
      shouldBlock &&
      currentLocation.pathname !== nextLocation.pathname
  );

  const { data: commonCodes = [] } = useQuery({
    queryKey: ["commonCodes", "CMCMM00005"],
    queryFn: () => fetchCommonCodes("CMCMM00005"),
    staleTime: Infinity,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["faqDetail", faqSn],
    queryFn: () => fetchFaqDetail(faqSn!),
    enabled: isEditMode && !!faqSn,
  });

  useEffect(() => {
    if (!data) return;
    setCategory(data.faqSeCd || "01");
    setTitle(data.faqTtl || "");
    setContent(data.faqAnsCn || "");
  }, [data]);

  useEffect(() => {
    if (blocker.state === "blocked" && !isModalOpenRef.current && shouldBlock) {
      isModalOpenRef.current = true;
      const onConfirm = async () => {
        const result = await confirmModal.open({
          title: STRINGS.WARNING,
          message: MSG.UNSAVED_CONTENT_CONFIRM,
        });

        isModalOpenRef.current = false;
        if (result) {
          setShouldBlock(false);
          blocker.proceed();
        } else {
          blocker.reset();
        }
      };
      onConfirm();
    }
  }, [blocker, confirmModal, shouldBlock]);

  const saveMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return isEditMode ? updateFaq(formData) : insertFaq(formData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faqList"] });

      if (faqSn) {
        await queryClient.invalidateQueries({ queryKey: ["faqDetail", faqSn] });
      }

      showAlert({
        message: isEditMode ? "수정되었습니다." : "등록되었습니다.",
        severity: "success",
      });

      skipBlockRef.current = true;
      setShouldBlock(false);
      navigate(routes.COMMUNITY.FAQ.ADMIN_LIST);
    },
    onError: () => {
      showAlert({
        message: isEditMode ? "수정 중 오류가 발생했습니다." : "등록 중 오류가 발생했습니다.",
        severity: "error",
      });
    },
  });

  const handleSave = () => {
    if (!category) {
      showAlert({ message: "구분을 입력해주세요.", severity: "warning" });
      return;
    }

    if (!title.trim()) {
      showAlert({ message: "제목을 입력해주세요.", severity: "warning" });
      return;
    }

    const formData = new FormData();
    formData.append("bbsId", "faq");
    formData.append("faqClsfNm", category);
    formData.append("faqSeCd", category);
    formData.append("faqTtl", title);
    formData.append("faqAnsCn", content);

    if (isEditMode && faqSn) {
      formData.append("faqSn", faqSn);
    }

    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="py-12 text-center text-gray-600">로딩 중...</div>;
  }

  const pendingLabel = isEditMode ? "수정 중..." : "저장 중...";
  const idleLabel = isEditMode ? "수정" : "저장";
  const saveButtonLabel = saveMutation.isPending ? pendingLabel : idleLabel;

  return (
    <div>
      <Helmet>
        <title>CDM - FAQ</title>
      </Helmet>
      <div className="h-5"></div>

      <Box className="form_container">
        {/* 구분 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">구분</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Select
                fullWidth
                sx={{ maxWidth: "20rem" }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {commonCodes.map((c) => (
                  <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
        </Stack>

        {/* 제목 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">제목</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                variant="outlined"
                placeholder="제목을 입력하세요."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />
            </Box>
          </Box>
        </Stack>

        {/* 내용 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>내용</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                variant="outlined"
                placeholder="내용을 입력해주세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                multiline
                rows={6}
                fullWidth
              />
            </Box>
          </Box>
        </Stack>
      </Box>

      <div className="h-10"></div>

      <div className="flex justify-end gap-3">
        <Button
          variant="contained"
          size="medium"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveButtonLabel}
        </Button>

        <Button
          variant="outlined"
          size="medium"
          className="btn_outline"
          onClick={() => {
            skipBlockRef.current = true;
            setShouldBlock(false);
            navigate(routes.COMMUNITY.FAQ.ADMIN_LIST);
          }}
        >
          취소
        </Button>
      </div>
    </div>
  );
}