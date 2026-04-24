/**
 * CDM 임시 테이블 접두사 (tb_cm_i_tmpr_*).
 * 업로드 시 tmp 접두사 테이블에 적재 후 검증 완료 시 접두사 없는 본 테이블로 이관하며,
 * 모든 화면에서는 이관된 테이블명(접두사 없음)으로 표기한다.
 */
const TMP_TABLE_PREFIX = "tb_cm_i_tmpr_";

/**
 * 물리 테이블명(예: tb_cm_i_tmpr_person)을 화면 표시용 이름(예: person)으로 변환한다.
 * 접두사 tb_cm_i_tmpr_ 가 있으면 제거하고, 없으면 그대로 반환.
 */
export function cdmTableDisplayName(physicalName: string | null | undefined): string {
  if (physicalName == null || typeof physicalName !== "string") return "";
  const s = physicalName.trim();
  if (s.toLowerCase().startsWith(TMP_TABLE_PREFIX.toLowerCase()))
    return s.slice(TMP_TABLE_PREFIX.length);
  return s;
}

/**
 * TB_CM_D_ULD_PRD_SCL `trsf_se_cd` / `tbl_se_cd` 비교용.
 * 참여기관 정보 조회 API는 MyBatis Map을 그대로 내려 JDBC 타입이 숫자(2, 1, 11)로 직렬화될 수 있어
 * `"02"`, `"01"` 문자열과 맞지 않는 문제를 방지한다.
 */
export function normalizeCdmSeCode(v: unknown): string {
  if (v == null || v === "") return "";
  const s = String(v).trim();
  if (s === "") return "";
  const n = parseInt(s, 10);
  if (!Number.isNaN(n) && n >= 0 && n < 100) return String(n).padStart(2, "0");
  if (s.length === 1 && /^\d$/.test(s)) return `0${s}`;
  return s;
}
