import { useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { BOARD_CONFIG } from "@/config/boardConfig";
import { CONTENT_GAP } from "@/constants/types";
import { fetchBoardDetail, increaseViewCount } from "@/api/communityApi";
import { downloadFileViaProxy } from "@/api/commonApi";
import type { RootState } from "@/store";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { SpaceBox } from "@/components/SpaceBox";
import { Helmet } from "react-helmet";

export default function BuildInfoDetailView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();

  const { boardType, id } = useParams<{
    boardType: "buildInfo" | "analysisInfo" | "notice";
    id: string;
  }>();

  const config = BOARD_CONFIG[boardType!];
  const bbsId = boardType ? BOARD_CONFIG[boardType]?.bbsId || "" : "";
  const session = useSelector((state: RootState) => state.session);

  const onFileClick = (atchFileId: string, fileNm: string) => {
    downloadFileViaProxy(atchFileId, fileNm);
  };

  // =========================
  // React Query
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

  const increaseViewCountMutation = useMutation({
    mutationFn: increaseViewCount,
    onError: (e) => {
      // 조회수는 부가 로직 → 실패해도 화면에는 영향 없음
      console.warn("게시판 조회수 증가 실패", e);
    },
  });

  // 조회수 증가 (중복 방지)
  useEffect(() => {
    if (!id || !boardType) return;

    const mbrId = session.userNo;
    const viewKey = `BOARD_VIEW_${boardType}_${id}_${mbrId}`;

    if (!sessionStorage.getItem(viewKey)) {
      increaseViewCountMutation.mutate({ pstSn: id });
      sessionStorage.setItem(viewKey, "Y");
    }
  }, [id, boardType]);

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
        <Button variant="contained" size="medium" onClick={() => navigate(`${routes.COMMUNITY.ROOT}/${boardType}/member/list`)}>
          목록
        </Button>
      </div>

      {config.showKrdsNotice && (
        <div className="mt-4 mb-6 p-4 bg-amber-50 border border-amber-200 rounded text-gray-700 flex items-start space-x-3">
          <div className="text-amber-500 text-xl">⚠️</div>
          <p className="leading-relaxed text-base">
            이 페이지에 게시되는 CDM 이용 연구결과가 반드시 의약품과 이상사례 간의 인과관계가 있음을 의미하지는 않습니다.
          </p>
        </div>
      )}
    </div>
  );
}
