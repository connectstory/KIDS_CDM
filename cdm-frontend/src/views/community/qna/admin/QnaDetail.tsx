import { Box, Button, Link, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types";
import { deleteQna, deleteQnaAnswer, fetchQnaAnswer, fetchQnaDetail } from "@/api/communityApi";
import { downloadFileViaProxy } from "@/api/commonApi";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { SpaceBox } from "@/components/SpaceBox";
import { BOARD_CONFIG } from "@/config/boardConfig";
import { Helmet } from "react-helmet";

const BOARD_BBS_ID: Record<string, string> = {
  qna: "BBS0000001",
  researchProject: "BBS0000002",
};

export default function QnaDetailView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();
  const { id, boardType } = useParams<{ id: string; boardType: string }>();

  const bbsId = boardType ? BOARD_BBS_ID[boardType] : undefined;

  const onFileClick = (atchFileId: string, fileNm: string) => {
    downloadFileViaProxy(atchFileId, fileNm);
  };

  /* =========================
     질문 상세
  ========================= */
  const { data: qnaData, isLoading } = useQuery({
    queryKey: ["qnaDetail", bbsId, id],
    queryFn: () => fetchQnaDetail(id!, bbsId),
    enabled: !!id,
    refetchOnMount: "always",
  });

  /* =========================
     답변 상세 (없을 수도 있음)
  ========================= */
  const { data: ansData } = useQuery({
    queryKey: ["qnaAnswer", id],
    queryFn: () => fetchQnaAnswer(id!),
    enabled: !!id,
    retry: false,
  });

  /* =========================
     질문 삭제 - deleteQna 사용 (답변 있으면 함께 삭제는 백엔드에서 처리)
  ========================= */
  const deleteQnaMutation = useMutation({
    mutationFn: () =>
      deleteQna({
        ansSn: ansData?.ansSn,
        qstnSn: id!,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["qnaList", boardType],
        exact: false,
        refetchType: "all",
      });

      showAlert({ message: "삭제되었습니다.", severity: "success" });
      navigate(`${routes.COMMUNITY.ROOT}/${boardType}/admin/qna/list`);
    },
    onError: () => {
      showAlert({ message: "삭제 중 오류가 발생했습니다.", severity: "error" });
    },
  });

  /* =========================
     답변 삭제
  ========================= */
  const deleteAnswerMutation = useMutation({
    mutationFn: () =>
      deleteQnaAnswer({
        ansSn: ansData?.ansSn,
        qstnSn: id!,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["qnaAnswer", id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["qnaList", boardType],
        exact: false,
        refetchType: "all",
      });

      showAlert({ message: "답변이 삭제되었습니다.", severity: "success" });
    },
    onError: () => {
      showAlert({
        message: "답변 삭제 중 오류가 발생했습니다.",
        severity: "error",
      });
    },
  });

  const formatDateTime = (value: string) => {
    if (!value) return "";
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  if (isLoading) return <div className="py-12 text-center text-gray-600">로딩 중...</div>;

  if (!qnaData) return <div className="py-12 text-center text-gray-600">게시물을 찾을 수 없습니다.</div>;

  return (
    <div className="w-full">
      <Helmet>
        <title>{`CDM - ${BOARD_CONFIG[boardType as keyof typeof BOARD_CONFIG]?.title ?? 'Q&A'}`}</title>
      </Helmet>
      {/* ===== 질문 제목 ===== */}
      <div className="mb-4">
        <Typography variant="mainTitle">{qnaData.pstTtl}</Typography>
      </div>

      {/* ===== 질문 메타 + 내용 ===== */}
      <Box className="form_container">
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>질문자</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{qnaData.qstnrNm || "-"}</Typography>
            </Box>
          </Box>

          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>등록일자</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{qnaData.regDt || "-"}</Typography>
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>조회수</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{qnaData.pstInqCnt ?? 0}</Typography>
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>질문 내용</Typography>
            </Box>
            <Box className="form_container-row-content">
              <div style={{ minHeight: "200px", paddingTop: "4px", whiteSpace: "pre-line" }}>{qnaData.pstCn}</div>
            </Box>
          </Box>
        </Stack>

        {/* 첨부파일 */}
        {qnaData.fileList && qnaData.fileList.length > 0 && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography>첨부파일</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Stack spacing={1}>
                  {qnaData.fileList?.map((file: any) => (
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
        {!ansData && (
          <Button variant="contained" onClick={() => navigate(`${routes.COMMUNITY.ROOT}/${boardType}/admin/qna/answer/${id}`)}>
            답변등록
          </Button>
        )}

        <Button
          variant="contained"
          color="error"
          onClick={() => {
            if (!globalThis.confirm("질문을 삭제하시겠습니까?")) return;
            deleteQnaMutation.mutate();
          }}
        >
          삭제
        </Button>

        <Button variant="outlined" onClick={() => navigate(`${routes.COMMUNITY.ROOT}/${boardType}/admin/qna/list`)}>
          목록
        </Button>
      </div>

      {/* ===== 답변 ===== */}
      {ansData && (
        <>
          <Box>
            <Box className="sub_path">
              <Typography className="tit" variant="h5">
                답변
              </Typography>
            </Box>
          </Box>

          <Box className="form_container">
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>답변자</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{ansData.ansNm || "-"}</Typography>
                </Box>
              </Box>

              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>등록일자</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{formatDateTime(ansData.regDt) || "-"}</Typography>
                </Box>
              </Box>
            </Stack>

            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>답변 내용</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <div style={{ minHeight: "200px", paddingTop: "4px", whiteSpace: "pre-line" }}>{ansData.ansCn}</div>
                </Box>
              </Box>
            </Stack>

            {ansData.fileList && ansData.fileList.length > 0 && (
              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography>첨부파일</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <Stack spacing={1}>
                      {ansData.fileList?.map((file: any) => (
                        <Box key={file.atchFileId} className="file_item">
                          <Link
                            component="button"
                            onClick={() => downloadFileViaProxy(file.atchFileId, file.fileNm)}
                            className="file_name"
                            underline="always"
                          >
                            {file.fileNm} ({Math.round(file.fileSz / 1024)} KB)
                          </Link>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            )}
          </Box>

          <SpaceBox gap={CONTENT_GAP.MEDIUM} />

          {/* ===== 답변 하단 버튼 ===== */}
          <div className="w-full flex justify-end gap-1">
            <Button variant="contained" onClick={() => navigate(`${routes.COMMUNITY.ROOT}/${boardType}/admin/qna/answer/${id}`)}>
              답변수정
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (!globalThis.confirm("답변을 삭제하시겠습니까?")) return;
                deleteAnswerMutation.mutate();
              }}
            >
              답변삭제
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
