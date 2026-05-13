import { Box, Button, Link, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types";
import { deleteAsmtPrp, deleteAsmtPrpAnswer, fetchAsmtPrpAnswer, fetchAsmtPrpDetail } from "@/api/communityApi";
import { downloadFileViaProxy } from "@/api/commonApi";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { SpaceBox } from "@/components/SpaceBox";
import { Helmet } from "react-helmet";

export default function TaskproposalDetailView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  const onFileClick = (atchFileId: string, fileNm: string) => {
    downloadFileViaProxy(atchFileId, fileNm);
  };

  /* =========================
     상세 조회
  ========================= */
  const { data: proposalData, isLoading } = useQuery({
    queryKey: ["asmtPrpDetail", id],
    queryFn: () => fetchAsmtPrpDetail(id!),
    enabled: !!id,
    refetchOnMount: "always",
  });

  const { data: answerData } = useQuery({
    queryKey: ["asmtPrpAnswer", id],
    queryFn: () => fetchAsmtPrpAnswer(id!),
    enabled: !!id,
    retry: false,
  });

  const answer = answerData?.[0];

  /* =========================
     질문 삭제
  ========================= */
  const deleteProposalMutation = useMutation({
    mutationFn: () =>
      deleteAsmtPrp({
        ansSn: answer?.ansSn,
        asmtPrpSn: id!,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["asmtPrpList"],
        exact: false,
        refetchType: "all",
      });

      showAlert({ message: "삭제되었습니다.", severity: "success" });
      navigate(`${routes.COMMUNITY.ROOT}/proposal/admin/list`);
    },
    onError: () => {
      showAlert({ message: "삭제 중 오류가 발생했습니다.", severity: "error" });
    },
  });

  /* =========================
     답변 삭제
  ========================= */
  const deleteAnswerMutation = useMutation({
    mutationFn: () => deleteAsmtPrpAnswer(answer!.ansSn),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["asmtPrpAnswer", id],
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

  /* =========================
     유틸
  ========================= */
  const formatDateTime = (value: string) => {
    if (!value) return "";
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  if (isLoading) return <div className="py-12 text-center text-gray-600">로딩 중...</div>;
  if (!proposalData) return <div className="py-12 text-center text-gray-600">게시물을 찾을 수 없습니다.</div>;

  const answerWriter = answer?.ansNm || answer?.rgtrId || "관리자";
  const answerDate = answer?.regDt || "";
  const answerContent = answer?.ansCn || "";

  return (
    <div className="w-full">
      <Helmet>
        <title>CDM - 과제제안</title>
      </Helmet>
      {/* ===== 제목 ===== */}
      <div className="mb-4">
        <Typography variant="mainTitle">{proposalData.tpcTtlNm}</Typography>
      </div>

      {/* ===== 제안 메타 ===== */}
      <Box className="form_container">
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>제안자</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{proposalData.asmtPrpsrNm || "-"}</Typography>
            </Box>
          </Box>

          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>등록일자</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{proposalData.regDt || "-"}</Typography>
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>공개여부</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{proposalData.rlsYn === "Y" ? "공개" : "비공개"}</Typography>
            </Box>
          </Box>
        </Stack>

        {/* 제안내용 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>제안내용</Typography>
            </Box>
            <Box className="form_container-row-content">
              <div style={{ minHeight: "120px" }} className="whitespace-pre-wrap">
                {proposalData.asmtPrpCn || "-"}
              </div>
            </Box>
          </Box>
        </Stack>

        {/* 기대효과 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>기대효과</Typography>
            </Box>
            <Box className="form_container-row-content">
              <div style={{ minHeight: "120px" }} className="whitespace-pre-wrap">
                {proposalData.asmtExptEfctCn || "-"}
              </div>
            </Box>
          </Box>
        </Stack>

        {/* 기타설명 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>기타설명</Typography>
            </Box>
            <Box className="form_container-row-content">
              <div style={{ minHeight: "120px" }} className="whitespace-pre-wrap">
                {proposalData.asmtEtcExplnCn || "-"}
              </div>
            </Box>
          </Box>
        </Stack>

        {/* 주의할점 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>주의할점</Typography>
            </Box>
            <Box className="form_container-row-content">
              <div style={{ minHeight: "120px" }} className="whitespace-pre-wrap">
                {proposalData.asmtCutnMttrCn || "-"}
              </div>
            </Box>
          </Box>
        </Stack>

        {/* 첨부파일 */}
        {proposalData.fileList && proposalData.fileList.length > 0 && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography>첨부파일</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Stack spacing={1}>
                  {proposalData.fileList?.map((file: any) => (
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
        {!answer && (
          <Button
            variant="contained"
            onClick={() => navigate(`${routes.COMMUNITY.ROOT}/proposal/admin/answer?asmtPrpSn=${id}`)}
          >
            답변등록
          </Button>
        )}

        <Button
          variant="contained"
          color="error"
          onClick={() => {
            if (!globalThis.confirm("해당 제안을 삭제하시겠습니까?")) return;
            deleteProposalMutation.mutate();
          }}
          disabled={deleteProposalMutation.isPending}
        >
          삭제
        </Button>

        <Button variant="outlined" onClick={() => navigate(`${routes.COMMUNITY.ROOT}/proposal/admin/list`)}>
          목록
        </Button>
      </div>

      {/* ===== 답변 ===== */}
      {answer && (
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
                  <Typography>{answerWriter || "-"}</Typography>
                </Box>
              </Box>

              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>등록일자</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{formatDateTime(answerDate) || "-"}</Typography>
                </Box>
              </Box>
            </Stack>

            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>답변 내용</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <div
                    style={{
                      minHeight: "200px",
                      paddingTop: "4px",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {answerContent}
                  </div>
                </Box>
              </Box>
            </Stack>

            {answer?.fileList && answer.fileList.length > 0 && (
              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography>첨부파일</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <Stack spacing={1}>
                      {answer.fileList?.map((file: any) => (
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

          {/* ===== 하단 버튼 ===== */}
          <div className="w-full flex justify-end gap-1">
            <Button
              variant="contained"
              onClick={() =>
                navigate(
                  `${routes.COMMUNITY.ROOT}/proposal/admin/answer?asmtPrpSn=${id}&ansSn=${answer?.ansSn}`
                )
              }
            >
              답변수정
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (!globalThis.confirm("등록된 답변을 삭제하시겠습니까?")) return;
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
