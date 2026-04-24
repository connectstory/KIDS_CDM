import { Box, Button, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StdSeCdType } from "@/constants/types";
import { deleteValidateRule, fetchValidateRuleDetail } from "@/api/validateRuleApi.ts";
import { convertStdSeCd } from "@/utils/common";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";

export default function ValidateRuleDetailView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  const [searchParams] = useSearchParams();
  const vrfcSn = searchParams.get("vrfcSn");

  const { data: ruleData, isLoading } = useQuery({
    queryKey: ["validateRuleDetail", vrfcSn],
    queryFn: () => fetchValidateRuleDetail({ vrfcSn: vrfcSn! }),
    enabled: !!vrfcSn,
    refetchOnMount: "always",
  });

  const deleteMutation = useMutation({
    mutationFn: deleteValidateRule,
    onSuccess: () => {
      showAlert({ message: "CDM 표준화 정보가 삭제되었습니다.", severity: "success" });
      queryClient.removeQueries({ queryKey: ["validateRuleList"] });
      const params = new URLSearchParams(globalThis.location.search);
      params.delete("vrfcSn");
      navigate(`${routes.CDM.VALIDATE_RULE_LIST}?${params.toString()}`);
    },
    onError: (e) => {
      showAlert({ message: "CDM 표준화 정보 삭제 중 오류가 발생했습니다.", severity: "error" });
    },
  });

  const handleDelete = () => {
    if (!vrfcSn) return;
    if (!globalThis.confirm("정말 삭제하시겠습니까?")) return;
    deleteMutation.mutate({ vrfcSn });
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!ruleData) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-gray-600">데이터를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const stdSeCd = ruleData.stdSeCd;
  const isAccuracy = stdSeCd === StdSeCdType.ACCURACY;
  const isUniqueness = stdSeCd === StdSeCdType.UNIQUENESS;
  const isConsistency = stdSeCd === StdSeCdType.CONSISTENCY;
  const isValidity = stdSeCd === StdSeCdType.VALIDITY;

  const showRef = isUniqueness || isConsistency || isValidity;
  const showRefDetail = isConsistency || isValidity;
  const showEsntl = isConsistency;

  return (
    <div className="w-full">
      <Helmet>
        <title>CDM - CDM 표준화 관리</title>
      </Helmet>
      <div className="mb-4">
        <Typography variant="mainTitle">CDM 표준화 관리</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          CDM 데이터의 표준화 규칙 관리 정보 입니다.
        </Typography>
      </div>

      <Box className="form_container">
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>구분</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{convertStdSeCd(ruleData.stdSeCd)}</Typography>
            </Box>
          </Box>
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>Rule Level</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{ruleData.levlSeq ?? "-"}</Typography>
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>테이블 명</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{ruleData.vrfcTblNm || "-"}</Typography>
            </Box>
          </Box>
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>컬럼 명</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{ruleData.vrfcColNm || "-"}</Typography>
            </Box>
          </Box>
        </Stack>

        {/* ── 정확성(01) 전용 ── */}
        {isAccuracy && (
          <>
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>참조 테이블 명</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{ruleData.rfrncTblNm || "-"}</Typography>
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>참조 컬럼 명</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{ruleData.rfrncColNm || "-"}</Typography>
                </Box>
              </Box>
            </Stack>
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>외래키 명</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{ruleData.fkNm || "-"}</Typography>
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>표준 용어 ID</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{ruleData.stdTrmId || "-"}</Typography>
                </Box>
              </Box>
            </Stack>
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>Rule</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{ruleData.vrfcRulNm || "-"}</Typography>
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>조건 값 (field_value)</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{ruleData.rulAplcnNm || "-"}</Typography>
                </Box>
              </Box>
            </Stack>
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>단위</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{ruleData.unitNm || "-"}</Typography>
                </Box>
              </Box>
            </Stack>
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>검색 필드</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{ruleData.vrblCn || "-"}</Typography>
                </Box>
              </Box>
            </Stack>
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>Range-order</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{ruleData.scpSeqNm || "-"}</Typography>
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>임계치</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography>{ruleData.prmCrtrNm || "-"}</Typography>
                </Box>
              </Box>
            </Stack>
          </>
        )}

        {/* ── 완전성(02) · 유일성(03) · 일관성(04) · 유효성(05): Rule ── */}
        {!isAccuracy && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography>Rule</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Typography>{ruleData.vrfcRulNm || "-"}</Typography>
              </Box>
            </Box>
          </Stack>
        )}

        {/* ── 유일성(03) · 일관성(04) · 유효성(05): Ref ── */}
        {showRef && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography>참조</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Typography>{ruleData.rfrncNm || "-"}</Typography>
              </Box>
            </Box>
          </Stack>
        )}

        {/* ── 일관성(04) · 유효성(05): Ref Detail ── */}
        {showRefDetail && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography>참조 상세</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Typography>{ruleData.rfrncDtlNm || "-"}</Typography>
              </Box>
            </Box>
          </Stack>
        )}

        {/* ── 일관성(04): 필수 여부 ── */}
        {showEsntl && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography>필수 여부</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Typography>{ruleData.esntlYn || "-"}</Typography>
              </Box>
            </Box>
          </Stack>
        )}

        {/* 내용 — 공통 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>내용</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{ruleData.vrblRsltCn || "-"}</Typography>
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>등록일시</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{ruleData.regDt || "-"}</Typography>
            </Box>
          </Box>
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>등록자</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Typography>{ruleData.rgtrId || "-"}</Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      <div className="w-full flex justify-end mt-8 mb-12">
        <Button variant="contained" size="medium" onClick={() => navigate(`${routes.CDM.VALIDATE_RULE_EDIT}?vrfcSn=${vrfcSn}`)}>
          수정
        </Button>
        <div className="pl5" />
        <Button variant="contained" color="error" size="medium" onClick={handleDelete} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? "삭제 중..." : "삭제"}
        </Button>
        <div className="pl5" />
        <Button variant="outlined" onClick={() => navigate(routes.CDM.VALIDATE_RULE_LIST + location.search)}>
          목록
        </Button>
      </div>
    </div>
  );
}
