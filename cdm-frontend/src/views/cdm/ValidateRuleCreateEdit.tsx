import { useEffect, useState } from "react";
import { Box, Button, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { STD_SE_CD_TYPE } from "@/constants/types";
import { fetchValidateRuleDetail, insertValidateRule, updateValidateRule } from "@/api/validateRuleApi.ts";
import { buildPath } from "@/utils/common";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";

const RULE_OPTIONS: Record<string, string[]> = {
  [STD_SE_CD_TYPE.ACCURACY]: [
    "date accuracy",
    "gender accuracy",
    "meas value range accuracy",
    "vital value range accuracy",
    "age accuracy",
  ],
  [STD_SE_CD_TYPE.COMPLETENESS]: ["completeness"],
  [STD_SE_CD_TYPE.UNIQUENESS]: ["local uniqueness", "global uniqueness"],
  [STD_SE_CD_TYPE.CONSISTENCY]: ["table name consistency", "field name consistency", "field type consistency"],
  [STD_SE_CD_TYPE.VALIDITY]: ["vocab validity"],
};

export default function ValidateRuleCreateEditView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  const { vrfcSn } = useParams<{ vrfcSn?: string }>();
  const isEditMode = Boolean(vrfcSn);

  const [stdSeCd, setStdSeCd] = useState<string>(STD_SE_CD_TYPE.ACCURACY);
  const [levlSeq, setLevlSeq] = useState("1");
  const [vrfcTblNm, setVrfcTblNm] = useState("");
  const [vrfcColNm, setVrfcColNm] = useState("");
  const [vrfcRulNm, setVrfcRulNm] = useState("");
  const [rfrncNm, setRfrncNm] = useState("");
  const [rfrncDtlNm, setRfrncDtlNm] = useState("");
  const [esntlYn, setEsntlYn] = useState("N");
  const [rfrncTblNm, setRfrncTblNm] = useState("");
  const [fkNm, setFkNm] = useState("");
  const [rfrncColNm, setRfrncColNm] = useState("");
  const [stdTrmId, setStdTrmId] = useState("");
  const [rulAplcnNm, setRulAplcnNm] = useState("");
  const [unitNm, setUnitNm] = useState("");
  const [scpSeqNm, setScpSeqNm] = useState("H");
  const [prmCrtrNm, setPrmCrtrNm] = useState("");
  const [vrblCn, setVrblCn] = useState("");
  const [vrblDtlCn, setVrblDtlCn] = useState("");
  const [vrblRsltCn, setVrblRsltCn] = useState("");

  const { data: detailData } = useQuery({
    queryKey: ["validateRuleDetail", vrfcSn],
    queryFn: () => fetchValidateRuleDetail({ vrfcSn: vrfcSn as string }),
    enabled: isEditMode && !!vrfcSn,
    retry: 1,
  });

  useEffect(() => {
    if (detailData) {
      setStdSeCd(detailData.stdSeCd || STD_SE_CD_TYPE.ACCURACY);
      setLevlSeq(detailData.levlSeq == null ? "1" : String(detailData.levlSeq));
      setVrfcTblNm(detailData.vrfcTblNm || "");
      setVrfcColNm(detailData.vrfcColNm || "");
      setVrfcRulNm(detailData.vrfcRulNm || "");
      setRfrncNm(detailData.rfrncNm || "");
      setRfrncDtlNm(detailData.rfrncDtlNm || "");
      setEsntlYn(detailData.esntlYn || "N");
      setRfrncTblNm(detailData.rfrncTblNm || "");
      setFkNm(detailData.fkNm || "");
      setRfrncColNm(detailData.rfrncColNm || "");
      setStdTrmId(detailData.stdTrmId || "");
      setRulAplcnNm(detailData.rulAplcnNm || "");
      setUnitNm(detailData.unitNm || "");
      setScpSeqNm(detailData.scpSeqNm || "H");
      setPrmCrtrNm(detailData.prmCrtrNm || "");
      setVrblCn(detailData.vrblCn || "");
      setVrblDtlCn(detailData.vrblDtlCn || "");
      setVrblRsltCn(detailData.vrblRsltCn || "");
    } else if (!isEditMode) {
      setStdSeCd(STD_SE_CD_TYPE.ACCURACY);
      setLevlSeq("1");
      setVrfcTblNm("");
      setVrfcColNm("");
      setVrfcRulNm("");
      setRfrncNm("");
      setRfrncDtlNm("");
      setEsntlYn("N");
      setRfrncTblNm("");
      setFkNm("");
      setRfrncColNm("");
      setStdTrmId("");
      setRulAplcnNm("");
      setUnitNm("");
      setScpSeqNm("H");
      setPrmCrtrNm("");
      setVrblCn("");
      setVrblDtlCn("");
      setVrblRsltCn("");
    }
  }, [detailData, isEditMode]);

  const saveMutation = useMutation({
    mutationFn: isEditMode ? (data: any) => updateValidateRule({ vrfcSn: vrfcSn as string, ...data }) : insertValidateRule,
    onSuccess: () => {
      showAlert({
        message: isEditMode ? "CDM 표준화 정보가 수정되었습니다." : "CDM 표준화 정보가 등록되었습니다.",
        severity: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["validateRuleList"] });
      if (isEditMode) queryClient.invalidateQueries({ queryKey: ["validateRuleDetail", vrfcSn] });
      navigate(routes.CDM.VALIDATE_RULE_LIST);
    },
    onError: () => {
      showAlert({
        message: isEditMode ? "CDM 표준화 정보 수정 중 오류가 발생했습니다." : "CDM 표준화 정보 등록 중 오류가 발생했습니다.",
        severity: "error",
      });
    },
  });

  const [koreanErrors, setKoreanErrors] = useState<Record<string, boolean>>({});

  const resetFields = () => {
    setLevlSeq("1");
    setVrfcTblNm("");
    setVrfcColNm("");
    setVrfcRulNm("");
    setRfrncNm("");
    setRfrncDtlNm("");
    setEsntlYn("N");
    setRfrncTblNm("");
    setFkNm("");
    setRfrncColNm("");
    setStdTrmId("");
    setRulAplcnNm("");
    setUnitNm("");
    setScpSeqNm("H");
    setPrmCrtrNm("");
    setVrblCn("");
    setVrblDtlCn("");
    setVrblRsltCn("");
    setKoreanErrors({});
  };

  // 영문, 숫자, 언더스코어, 특수문자만 허용 (한글 차단)
  const filterNonKorean = (field: string, value: string) => {
    const hasKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value);
    setKoreanErrors((prev) => ({ ...prev, [field]: hasKorean }));
    return value.replaceAll(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
  };
  const filterNumericOnly = (value: string) => value.replaceAll(/[^0-9.]/g, "");

  const isAccuracy = stdSeCd === STD_SE_CD_TYPE.ACCURACY; // 01 정확성
  const isUniqueness = stdSeCd === STD_SE_CD_TYPE.UNIQUENESS; // 03 유일성
  const isConsistency = stdSeCd === STD_SE_CD_TYPE.CONSISTENCY; // 04 일관성
  const isValidity = stdSeCd === STD_SE_CD_TYPE.VALIDITY; // 05 유효성

  // Ref(rfrnc_nm) 표시: 유일성·일관성·유효성
  const showRef = isUniqueness || isConsistency || isValidity;
  // Ref Detail(rfrnc_dtl_nm) 표시: 일관성·유효성
  const showRefDetail = isConsistency || isValidity;
  // 필수여부(esntl_yn) 표시: 일관성
  const showEsntl = isConsistency;

  const buildPayload = () => {
    const accuracyFields = isAccuracy
      ? { rfrncTblNm, fkNm, rfrncColNm, stdTrmId, rulAplcnNm, unitNm, scpSeqNm, prmCrtrNm, vrblCn, vrblDtlCn }
      : {
          rfrncTblNm: "",
          fkNm: "",
          rfrncColNm: "",
          stdTrmId: "",
          rulAplcnNm: "",
          unitNm: "",
          scpSeqNm: "",
          prmCrtrNm: "",
          vrblCn: "",
          vrblDtlCn: "",
        };

    return {
      stdSeCd,
      levlSeq: Number(levlSeq) || 1,
      vrfcTblNm,
      vrfcColNm,
      vrfcRulNm,
      ...accuracyFields,
      rfrncNm: showRef ? rfrncNm : "",
      rfrncDtlNm: showRefDetail ? rfrncDtlNm : "",
      esntlYn: showEsntl ? esntlYn : "N",
      vrblRsltCn,
    };
  };

  const handleSave = () => {
    if (!vrfcTblNm.trim()) {
      showAlert({ message: "테이블 명을 입력해 주세요.", severity: "warning" });
      return;
    }
    if (!vrfcColNm.trim()) {
      showAlert({ message: "컬럼 명을 입력해 주세요.", severity: "warning" });
      return;
    }
    saveMutation.mutate(buildPayload());
  };

  const pendingLabel = isEditMode ? "수정 중..." : "저장 중...";
  const idleLabel = isEditMode ? "수정" : "저장";
  const saveButtonLabel = saveMutation.isPending ? pendingLabel : idleLabel;

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
        {/* 구분 + Rule Level — 공통 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">구분</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Select
                value={stdSeCd}
                onChange={(e) => {
                  setStdSeCd(e.target.value);
                  resetFields();
                }}
                size="small"
                sx={{ minWidth: 200 }}
                readOnly={isEditMode}
                disabled={isEditMode}
              >
                <MenuItem value={STD_SE_CD_TYPE.ACCURACY}>정확성</MenuItem>
                <MenuItem value={STD_SE_CD_TYPE.COMPLETENESS}>완전성</MenuItem>
                <MenuItem value={STD_SE_CD_TYPE.UNIQUENESS}>유일성</MenuItem>
                <MenuItem value={STD_SE_CD_TYPE.CONSISTENCY}>일관성</MenuItem>
                <MenuItem value={STD_SE_CD_TYPE.VALIDITY}>유효성</MenuItem>
              </Select>
            </Box>
          </Box>
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography>Rule Level</Typography>
            </Box>
            <Box className="form_container-row-content">
              <Select value={levlSeq} onChange={(e) => setLevlSeq(e.target.value)} size="small" sx={{ minWidth: 120 }}>
                <MenuItem value="1">1</MenuItem>
                <MenuItem value="2">2</MenuItem>
              </Select>
            </Box>
          </Box>
        </Stack>

        {/* 테이블명 + 컬럼명 — 공통 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">테이블 명</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                size="small"
                value={vrfcTblNm}
                onChange={(e) => setVrfcTblNm(filterNonKorean("vrfcTblNm", e.target.value))}
                placeholder="테이블 명 입력 (영문만)"
                sx={{ width: "100%", maxWidth: 300 }}
                error={!!koreanErrors["vrfcTblNm"]}
                helperText={koreanErrors["vrfcTblNm"] ? "한글은 입력이 불가합니다." : ""}
                slotProps={{ htmlInput: { maxLength: 256 }, formHelperText: { sx: { color: "#c00000", fontWeight: 700 } } }}
              />
            </Box>
          </Box>
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <Typography className="required">컬럼 명</Typography>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                size="small"
                value={vrfcColNm}
                onChange={(e) => setVrfcColNm(filterNonKorean("vrfcColNm", e.target.value))}
                placeholder="컬럼 명 입력 (영문만)"
                sx={{ width: "100%", maxWidth: 300 }}
                error={!!koreanErrors["vrfcColNm"]}
                helperText={koreanErrors["vrfcColNm"] ? "한글은 입력이 불가합니다." : ""}
                slotProps={{ htmlInput: { maxLength: 256 }, formHelperText: { sx: { color: "#c00000", fontWeight: 700 } } }}
              />
            </Box>
          </Box>
        </Stack>

        {/* ── 정확성(01) 전용 필드 (기존 유지) ── */}
        {isAccuracy && (
          <>
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>참조 테이블 명</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <TextField
                    size="small"
                    value={rfrncTblNm}
                    onChange={(e) => setRfrncTblNm(filterNonKorean("rfrncTblNm", e.target.value))}
                    placeholder="참조 테이블 명 입력 (영문만)"
                    sx={{ width: "100%", maxWidth: 300 }}
                    error={!!koreanErrors["rfrncTblNm"]}
                    helperText={koreanErrors["rfrncTblNm"] ? "한글은 입력이 불가합니다." : ""}
                    slotProps={{ htmlInput: { maxLength: 256 }, formHelperText: { sx: { color: "#c00000", fontWeight: 700 } } }}
                  />
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>참조 컬럼 명</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <TextField
                    size="small"
                    value={rfrncColNm}
                    onChange={(e) => setRfrncColNm(filterNonKorean("rfrncColNm", e.target.value))}
                    placeholder="참조 컬럼 명 입력 (영문만)"
                    sx={{ width: "100%", maxWidth: 300 }}
                    error={!!koreanErrors["rfrncColNm"]}
                    helperText={koreanErrors["rfrncColNm"] ? "한글은 입력이 불가합니다." : ""}
                    slotProps={{ htmlInput: { maxLength: 256 }, formHelperText: { sx: { color: "#c00000", fontWeight: 700 } } }}
                  />
                </Box>
              </Box>
            </Stack>

            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>외래키 명</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <TextField
                    size="small"
                    value={fkNm}
                    onChange={(e) => setFkNm(filterNonKorean("fkNm", e.target.value))}
                    placeholder="외래키 명 입력 (영문만)"
                    sx={{ width: "100%", maxWidth: 300 }}
                    error={!!koreanErrors["fkNm"]}
                    helperText={koreanErrors["fkNm"] ? "한글은 입력이 불가합니다." : ""}
                    slotProps={{ htmlInput: { maxLength: 256 }, formHelperText: { sx: { color: "#c00000", fontWeight: 700 } } }}
                  />
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>표준 용어 ID</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <TextField
                    size="small"
                    value={stdTrmId}
                    onChange={(e) => setStdTrmId(e.target.value)}
                    placeholder="표준 용어 ID 입력"
                    slotProps={{ htmlInput: { maxLength: 256 } }}
                    sx={{ width: "100%", maxWidth: 300 }}
                  />
                </Box>
              </Box>
            </Stack>

            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>Rule</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Select
                    value={vrfcRulNm}
                    onChange={(e) => setVrfcRulNm(e.target.value)}
                    size="small"
                    displayEmpty
                    sx={{ minWidth: 260 }}
                  >
                    <MenuItem value="">
                      <em>선택</em>
                    </MenuItem>
                    {(RULE_OPTIONS[stdSeCd] ?? []).map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>조건 값 (field_value)</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <TextField
                    size="small"
                    value={rulAplcnNm}
                    onChange={(e) => setRulAplcnNm(e.target.value)}
                    placeholder="조건 값 입력"
                    slotProps={{ htmlInput: { maxLength: 256 } }}
                    sx={{ width: "100%", maxWidth: 300 }}
                  />
                </Box>
              </Box>
            </Stack>

            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>단위</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <TextField
                    size="small"
                    value={unitNm}
                    onChange={(e) => setUnitNm(e.target.value)}
                    placeholder="단위 입력"
                    slotProps={{ htmlInput: { maxLength: 256 } }}
                    sx={{ width: "100%", maxWidth: 200 }}
                  />
                </Box>
              </Box>
            </Stack>

            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>검색 필드</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <TextField
                    size="small"
                    value={vrblCn}
                    onChange={(e) => setVrblCn(e.target.value)}
                    placeholder="검색 필드 입력"
                    slotProps={{ htmlInput: { maxLength: 1000 } }}
                    sx={{ width: "100%", maxWidth: 500 }}
                  />
                </Box>
              </Box>
            </Stack>

            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>Range-order</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Select value={scpSeqNm} onChange={(e) => setScpSeqNm(e.target.value)} size="small" sx={{ minWidth: 120 }}>
                    <MenuItem value="H">H</MenuItem>
                    <MenuItem value="L">L</MenuItem>
                  </Select>
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography>임계치</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <TextField
                    size="small"
                    value={prmCrtrNm}
                    onChange={(e) => setPrmCrtrNm(filterNumericOnly(e.target.value))}
                    placeholder="임계치 입력 (숫자만)"
                    slotProps={{ htmlInput: { maxLength: 256 } }}
                    sx={{ width: "100%", maxWidth: 200 }}
                  />
                </Box>
              </Box>
            </Stack>
          </>
        )}

        {/* ── 완전성(02) · 유일성(03) · 일관성(04) · 유효성(05): Rule Select ── */}
        {!isAccuracy && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column" sx={{ width: "50%" }}>
              <Box className="form_container-row-label">
                <Typography>Rule</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Select
                  value={vrfcRulNm}
                  onChange={(e) => setVrfcRulNm(e.target.value)}
                  size="small"
                  displayEmpty
                  sx={{ minWidth: 260 }}
                >
                  <MenuItem value="">
                    <em>선택</em>
                  </MenuItem>
                  {(RULE_OPTIONS[stdSeCd] ?? []).map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
          </Stack>
        )}

        {/* ── 유일성(03) · 일관성(04) · 유효성(05) 공통: Ref ── */}
        {showRef && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography>참조</Typography>
              </Box>
              <Box className="form_container-row-content">
                <TextField
                  size="small"
                  value={rfrncNm}
                  onChange={(e) => setRfrncNm(e.target.value)}
                  placeholder="참조 입력"
                  slotProps={{ htmlInput: { maxLength: 256 } }}
                  sx={{ width: "100%" }}
                />
              </Box>
            </Box>
          </Stack>
        )}

        {/* ── 일관성(04) · 유효성(05) 공통: Ref Detail ── */}
        {showRefDetail && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography>참조 상세</Typography>
              </Box>
              <Box className="form_container-row-content">
                <TextField
                  size="small"
                  value={rfrncDtlNm}
                  onChange={(e) => setRfrncDtlNm(e.target.value)}
                  placeholder="참조 상세 입력"
                  slotProps={{ htmlInput: { maxLength: 256 } }}
                  sx={{ width: "100%" }}
                />
              </Box>
            </Box>
          </Stack>
        )}

        {/* ── 일관성(04) 전용: 필수여부 ── */}
        {showEsntl && (
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography>필수 여부</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Select value={esntlYn} onChange={(e) => setEsntlYn(e.target.value)} size="small" sx={{ minWidth: 120 }}>
                  <MenuItem value="Y">Y</MenuItem>
                  <MenuItem value="N">N</MenuItem>
                </Select>
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
              <TextField
                multiline
                rows={4}
                value={vrblRsltCn}
                onChange={(e) => setVrblRsltCn(e.target.value)}
                placeholder="내용을 입력하세요"
                slotProps={{ htmlInput: { maxLength: 1000 } }}
                sx={{ width: "100%" }}
              />
            </Box>
          </Box>
        </Stack>
      </Box>

      <div className="h-10" />

      <div className="flex justify-end gap-3 mb-12">
        <Button variant="contained" size="medium" onClick={handleSave} disabled={saveMutation.isPending}>
          {saveButtonLabel}
        </Button>
        <Button
          variant="outlined"
          size="medium"
          disabled={saveMutation.isPending}
          onClick={() =>
            isEditMode
              ? navigate(buildPath(routes.CDM.VALIDATE_RULE_DETAIL, { vrfcSn: vrfcSn as string }))
              : navigate(routes.CDM.VALIDATE_RULE_LIST + location.search)
          }
        >
          취소
        </Button>
      </div>
    </div>
  );
}
