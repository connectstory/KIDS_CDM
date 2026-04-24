import { Box, Button, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { BOARD_CONFIG, type BoardType } from "@/config/boardConfig";
import { CONTENT_GAP } from "@/constants/types";
import { deleteBoard, fetchBoardDetail } from "@/api/communityApi";
import { downloadFileViaProxy } from "@/api/commonApi";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { SpaceBox } from "@/components/SpaceBox";
import { Helmet } from "react-helmet";

export default function BuildInfoDetailView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { boardType, id } = useParams<{
    boardType: BoardType;
    id: string;
  }>();

  const bbsId = boardType ? BOARD_CONFIG[boardType]?.bbsId || "" : "";

  const { showAlert } = useGlobalAlert();
  const onFileClick = (atchFileId: string, fileNm: string) => {
    downloadFileViaProxy(atchFileId, fileNm);
  };

  // =========================
  // React Query
  // =========================
  const { data: boardData, isLoading } = useQuery({
    queryKey: ["adminBoardDetail", boardType, id],
    queryFn: () =>
      fetchBoardDetail({
        bbsId: bbsId,
        pstSn: id!,
      }),
    enabled: !!boardType && !!id,
    refetchOnMount: "always",
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBoard,
    onSuccess: () => {
      showAlert({
        message: "게시글이 삭제되었습니다.",
        severity: "success",
      });
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["adminBoardList", boardType],
      });
      navigate(`${routes.COMMUNITY.ROOT}/${boardType}/admin/list`);
    },
    onError: (e) => {
      console.error("삭제 오류:", e);
      showAlert({
        message: "게시글 삭제 중 오류가 발생했습니다.",
        severity: "error",
      });
    },
  });

  const handleDelete = () => {
    if (!id || !boardType) return;

    if (!globalThis.confirm("정말 삭제하시겠습니까?")) {
      return;
    }

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
        <title>{`CDM - ${BOARD_CONFIG[boardType!]?.title ?? ''}`}</title>
      </Helmet>
      {/* ===== 상단 제목 영역 (연구과제 상세 스타일) ===== */}
      <div className="mb-4">
        <Typography variant="mainTitle">{boardData.pstTtl}</Typography>
      </div>

      {/* ===== 내용 테이블 ===== */}
      <Box className="form_container">
        {/* 등록자 / 등록일시 */}
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
              <Typography>등록일시</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{boardData.regDt || "-"}</Typography>
            </Box>
          </Box>
        </Stack>

        {/* 조회수 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column" sx={{ width: "50%" }}>
            <Box className="form_container-row-label">
              <Typography>조회수</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{boardData.pstInqCnt ?? 0}</Typography>
            </Box>
          </Box>
        </Stack>

        {/* 공지기간 - 공지사항 게시판일 때만 표시 */}
        {boardType === "notice" && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography>공지기간</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Typography>
                  {(() => {
                    const bgng = boardData.fixBgngYmd;
                    const end = boardData.fixEndYmd;
                    if (!bgng && !end) return "-";
                    const format = (ymd?: string) =>
                      ymd?.length === 8 ? `${ymd.substring(0, 4)}-${ymd.substring(4, 6)}-${ymd.substring(6, 8)}` : "";
                    return `${format(bgng)} ~ ${format(end)}`;
                  })()}
                </Typography>
              </Box>
            </Box>
          </Stack>
        )}

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
                  __html: (boardData.pstCn || "").replaceAll("\n", "<br />"),
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

      {/* ===== 하단 버튼 ===== */}
      <div className="w-full flex justify-end gap-1">
        <Button
          variant="contained"
          size="medium"
          onClick={() => navigate(`${routes.COMMUNITY.ROOT}/${boardType}/admin/write?pstSn=${id}`)}
        >
          수정
        </Button>

        <Button variant="contained" size="medium" onClick={handleDelete} disabled={deleteMutation.isPending}>
          삭제
        </Button>

        <Button variant="outlined" onClick={() => navigate(`${routes.COMMUNITY.ROOT}/${boardType}/admin/list`)}>
          목록
        </Button>
      </div>
    </div>
  );
}
