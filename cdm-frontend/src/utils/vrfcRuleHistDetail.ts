/**
 * TB_CM_E_TBL_ULD_STATS_HIST + tb_cm_m_vrfc 조인 응답에서 룰 마스터 상세 필드 추출
 * (camelCase / snake_case 혼용 대비)
 */
export type VrfcRuleHistDetail = {
  vrfcTblNm?: string | null;
  vrfcColNm?: string | null;
  vrfcRulNm?: string | null;
  rfrncNm?: string | null;
  rfrncDtlNm?: string | null;
  esntlYn?: string | null;
  rfrncTblNm?: string | null;
  rfrncColNm?: string | null;
  fkNm?: string | null;
  stdTrmId?: string | null;
  rulAplcnNm?: string | null;
  unitNm?: string | null;
  scpSeqNm?: string | null;
  prmCrtrNm?: string | null;
  vrblCn?: string | null;
  vrblDtlCn?: string | null;
  vrblRsltCn?: string | null;
  levlSeq?: string | number | null;
};

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

function asLevlSeq(v: unknown): string | number | null | undefined {
  if (v == null || v === "") return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return undefined;
    const n = Number(t);
    return Number.isFinite(n) ? n : t;
  }
  return undefined;
}

export function pickVrfcRuleHistDetailFromRow(r: Record<string, unknown> | null | undefined): VrfcRuleHistDetail {
  if (!r || typeof r !== "object") return {};
  const x = r as Record<string, unknown>;
  return {
    vrfcTblNm: str(x.vrfcTblNm ?? x.vrfctblnm ?? x.vrfc_tbl_nm),
    vrfcColNm: str(x.vrfcColNm ?? x.vrfccolnm ?? x.vrfc_col_nm),
    vrfcRulNm: str(x.vrfcRulNm ?? x.vrfcrulnm ?? x.vrfc_rul_nm),
    rfrncNm: str(x.rfrncNm ?? x.rfrncnm ?? x.rfrnc_nm),
    rfrncDtlNm: str(x.rfrncDtlNm ?? x.rfrncdtlnm ?? x.rfrnc_dtl_nm),
    esntlYn: str(x.esntlYn ?? x.esntlyn ?? x.esntl_yn),
    rfrncTblNm: str(x.rfrncTblNm ?? x.rfrnctblnm ?? x.rfrnc_tbl_nm),
    rfrncColNm: str(x.rfrncColNm ?? x.rfrnccolnm ?? x.rfrnc_col_nm),
    fkNm: str(x.fkNm ?? x.fknm ?? x.fk_nm),
    stdTrmId: str(x.stdTrmId ?? x.stdtrmid ?? x.std_trm_id),
    rulAplcnNm: str(x.rulAplcnNm ?? x.rulaplcnnm ?? x.rul_aplcn_nm),
    unitNm: str(x.unitNm ?? x.unitnm ?? x.unit_nm),
    scpSeqNm: str(x.scpSeqNm ?? x.scpseqnm ?? x.scp_seq_nm),
    prmCrtrNm: str(x.prmCrtrNm ?? x.prmcrtrnm ?? x.prm_crtr_nm),
    vrblCn: str(x.vrblCn ?? x.vrblcn ?? x.vrbl_cn),
    vrblDtlCn: str(x.vrblDtlCn ?? x.vrbldtlcn ?? x.vrbl_dtl_cn),
    vrblRsltCn: str(x.vrblRsltCn ?? x.vrblrsltcn ?? x.vrbl_rslt_cn),
    levlSeq: asLevlSeq(x.levlSeq ?? x.levlseq ?? x.levl_seq),
  };
}

const EMPTY_CELL = "—";

function displayCellValue(v: unknown): string {
  if (v == null) return EMPTY_CELL;
  const s = String(v).trim();
  return s === "" ? EMPTY_CELL : s;
}

/** 상세 패널에 표시할 라벨·값 쌍 — 라벨은 API 필드명(camelCase)만 사용, 값 없으면 — (전 항목 항상 출력) */
export function vrfcRuleHistDetailEntries(d: VrfcRuleHistDetail): { label: string; value: string }[] {
  const pairs: { colCamel: string; v: unknown }[] = [
    { colCamel: "levlSeq", v: d.levlSeq },
    { colCamel: "vrfcTblNm", v: d.vrfcTblNm },
    { colCamel: "vrfcColNm", v: d.vrfcColNm },
    { colCamel: "vrfcRulNm", v: d.vrfcRulNm },
    { colCamel: "rfrncNm", v: d.rfrncNm },
    { colCamel: "rfrncDtlNm", v: d.rfrncDtlNm },
    { colCamel: "esntlYn", v: d.esntlYn },
    { colCamel: "rfrncTblNm", v: d.rfrncTblNm },
    { colCamel: "rfrncColNm", v: d.rfrncColNm },
    { colCamel: "fkNm", v: d.fkNm },
    { colCamel: "stdTrmId", v: d.stdTrmId },
    { colCamel: "rulAplcnNm", v: d.rulAplcnNm },
    { colCamel: "unitNm", v: d.unitNm },
    { colCamel: "scpSeqNm", v: d.scpSeqNm },
    { colCamel: "prmCrtrNm", v: d.prmCrtrNm },
    { colCamel: "vrblCn", v: d.vrblCn },
    { colCamel: "vrblDtlCn", v: d.vrblDtlCn },
    { colCamel: "vrblRsltCn", v: d.vrblRsltCn },
  ];
  return pairs.map(({ colCamel, v }) => ({
    label: colCamel,
    value: displayCellValue(v),
  }));
}

/** 상세 패널 표시 가능 — 마스터 조인 유무와 관계없이 항상 전 컬럼 행이 있으므로 true */
export function hasVrfcRuleHistDetail(_d: VrfcRuleHistDetail): boolean {
  return true;
}
