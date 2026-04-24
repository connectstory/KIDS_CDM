import { SpaceBox } from "@/components/SpaceBox";
import { CONTENT_GAP } from "@/constants/types";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { Box, Stack, Button, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFaqDetail, deleteFaq } from "@/api/communityApi";
import { Helmet } from "react-helmet";

export default function FaqDetailView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  const { id } = useParams<{ id: string }>();

  const { data: faqData, isLoading } = useQuery({
    queryKey: ["faqDetail", id],
    queryFn: () => fetchFaqDetail(id!),
    enabled: !!id,
    refetchOnMount: "always",
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFaq(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faqList"] });
      await queryClient.invalidateQueries({ queryKey: ["faqDetail", id] });

      showAlert({ message: "삭제되었습니다.", severity: "success" });
      navigate(routes.COMMUNITY.FAQ.ADMIN_LIST);
    },
    onError: () => {
      showAlert({ message: "삭제 중 오류가 발생했습니다.", severity: "error" });
    },
  });

  const handleDelete = () => {
    if (!id) return;
    if (!globalThis.confirm("정말 삭제하시겠습니까?")) return;
    deleteMutation.mutate();
  };

  if (isLoading) {
    return <div className="py-12 text-center text-gray-600">로딩 중...</div>;
  }

  if (!faqData) {
    return <div className="py-12 text-center text-gray-600">게시물을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="w-full">
      <Helmet>
        <title>CDM - FAQ</title>
      </Helmet>
      {/* ===== 상단 제목 영역 ===== */}
      <div className="mb-4">
        <Typography variant="mainTitle">
          {/* 🔥 faqClsfNm(코드) 대신 faqSeNm(라벨) 사용 */}
          [ {faqData.faqSeNm} ] {faqData.faqTtl}
        </Typography>
      </div>

      {/* ===== 메타 + 내용 ===== */}
      <Box className="form_container">
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>등록자</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{faqData.rgtrId || "-"}</Typography>
            </Box>
          </Box>

          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>등록일시</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{faqData.regDt || "-"}</Typography>
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>조회수</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{faqData.pstInqCnt ?? 0}</Typography>
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>내용</Typography>
            </Box>
            <Box className="form_container-row-content">
              <div
                style={{ minHeight: "200px", paddingTop: "4px" }}
                dangerouslySetInnerHTML={{
                  __html: (faqData.faqAnsCn || "").replaceAll("\n", "<br />"),
                }}
              />
            </Box>
          </Box>
        </Stack>
      </Box>

      <SpaceBox gap={CONTENT_GAP.MEDIUM} />

      {/* ===== 하단 버튼 ===== */}
      <div className="w-full flex justify-end gap-1">
        <Button
          variant="contained"
          size="medium"
          onClick={() => navigate(`${routes.COMMUNITY.FAQ.ADMIN_WRITE}?faqSn=${id}`)}
        >
          수정
        </Button>

        <Button
          variant="contained"
          size="medium"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? "삭제 중..." : "삭제"}
        </Button>

        <Button
          variant="outlined"
          onClick={() => navigate(routes.COMMUNITY.FAQ.ADMIN_LIST)}
        >
          목록
        </Button>
      </div>
    </div>
  );
}