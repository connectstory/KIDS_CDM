import { useEffect } from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { BOARD_CONFIG } from "@/config/boardConfig";
import { CONTENT_GAP } from "@/constants/types";
import { deleteBoard, fetchBoardDetail, increaseViewCount } from "@/api/communityApi";
import { downloadFileViaProxy } from "@/api/commonApi";
import type { RootState } from "@/store";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { SpaceBox } from "@/components/SpaceBox";
import { Helmet } from "react-helmet";
import FreeboardComment from "@/views/community/freeboard/components/FreeboardComment";

export default function MemberFreeBoardDetailView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const queryClient = useQueryClient();

  const { boardType, id } = useParams<{
    boardType: "researchProject" | "freeboard";
    id: string;
  }>();

  const bbsId = boardType ? BOARD_CONFIG[boardType]?.bbsId || "" : "";

  // 로그인한 사용자 mbrId
  const session = useSelector((state: RootState) => state.session);

  const currentMbrId = session.userNo;

  const onFileClick = (atchFileId: string, fileNm: string) => {
    downloadFileViaProxy(atchFileId, fileNm);
  };

  // =========================
  // React Query (상세)
  // =========================
  const { data: boardData, isLoading } = useQuery({
    queryKey: ["memberBoardDetail", boardType, id],
    queryFn: () =>
      fetchBoardDetail({
        bbsId: bbsId,
        pstSn: id!,
      }),
    enabled: !!boardType && !!id,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // 작성자 본인 여부
  const isAuthor = !!currentMbrId && !!boardData?.mdfrId && currentMbrId === boardData.mdfrId;

  const increaseViewCountMutation = useMutation({
    mutationFn: increaseViewCount,
    onError: (e) => {
      // 조회수는 부가 로직 → 실패해도 화면에는 영향 없음
      console.warn("조회수 증가 실패", e);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBoard,
    onSuccess: async () => {
      showAlert({ message: "삭제되었습니다.", severity: "success" });

      await queryClient.invalidateQueries({
        queryKey: ["memberBoardList", boardType],
      });

      navigate(`${routes.COMMUNITY.ROOT}/${boardType}/member/freeboard/list`);
    },
    onError: (error) => {
      console.error("삭제 오류:", error);
      showAlert({ message: "삭제 중 오류가 발생했습니다.", severity: "error" });
    },
  });

  // 조회수 증가 (중복 방지)
  useEffect(() => {
    if (!id || !boardType) return;

    const mbrId = session.mbrId;
    const viewKey = `BOARD_VIEW_freeboard_${id}_${mbrId}`;

    if (!sessionStorage.getItem(viewKey)) {
      increaseViewCountMutation.mutate({ pstSn: id });
      sessionStorage.setItem(viewKey, "Y");
    }
  }, [id]);

  const handleDelete = () => {
    if (!id || !boardType || !isAuthor) return;

    if (!globalThis.confirm("정말 삭제하시겠습니까?")) return;

    deleteMutation.mutate({
      bbsId: bbsId,
      pstSn: id,
    });
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!boardData) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-gray-600">게시물을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Helmet>
        <title>CDM - 자유게시판</title>
      </Helmet>
      <div className="mb-4">
        <Typography variant="mainTitle">{boardData.pstTtl || "제목 없음"}</Typography>
      </div>

      {/* ===== 메타 + 내용 ===== */}
      <Box className="form_container">
        {/* 등록자 / 등록일자 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>등록자</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{boardData.rgtrId || "-"}</Typography>
            </Box>
          </Box>

          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>등록일자</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{boardData.regDt ? boardData.regDt.substring(0, 10) : "-"}</Typography>
            </Box>
          </Box>
        </Stack>

        {/* 조회수 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>조회수</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{boardData.pstInqCnt ?? 0}</Typography>
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
              <div
                style={{ minHeight: "200px", paddingTop: "4px" }}
                dangerouslySetInnerHTML={{
                  __html: boardData.pstCn || "내용 없음",
                }}
              />
            </Box>
          </Box>
        </Stack>

        {/* 첨부파일 */}
        {boardData.fileList && boardData.fileList.length > 0 && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography>첨부파일</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Stack spacing={1}>
                  {boardData.fileList?.map((file) => (
                    <Box key={file.atchFileId} className="file_item">
                      <button
                        type="button"
                        className="file_name cursor-pointer text-blue-600 underline bg-transparent border-0 p-0"
                        onClick={() => onFileClick(file.atchFileId, file.fileNm)}
                      >
                        {file.fileNm} ({Math.round(file.fileSz / 1024)} KB)
                      </button>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Stack>
        )}
      </Box>

      <SpaceBox gap={CONTENT_GAP.MEDIUM} />

      {/* ===== 댓글 영역 ===== */}
      {bbsId && id && (
        <>
          <Divider sx={{ my: 2 }} />
          <FreeboardComment pstSn={Number(id)} bbsId={bbsId} />
          <SpaceBox gap={CONTENT_GAP.MEDIUM} />
        </>
      )}

      {/* ===== 하단 버튼 ===== */}
      <div className="w-full flex justify-end gap-1">
        <Button
          variant="contained"
          size="medium"
          disabled={!isAuthor}
          onClick={() => navigate(`${routes.COMMUNITY.ROOT}/${boardType}/member/freeboard/write?pstSn=${id}`)}
        >
          수정
        </Button>

        <Button
          variant="contained"
          size="medium"
          color="error"
          onClick={handleDelete}
          disabled={!isAuthor || deleteMutation.isPending}
        >
          삭제
        </Button>

        <Button
          variant="outlined"
          size="medium"
          onClick={() => navigate(`${routes.COMMUNITY.ROOT}/${boardType}/member/freeboard/list`)}
        >
          목록
        </Button>
      </div>
    </div>
  );
}
