/** PP / 관리자 `/auth/me/admin` 등에서 내려주는 메뉴 권한 항목 */
export interface MenuAuthItem {
  menuSn: number;
  menuNm: string;
  upMenuSn?: number | string | "";
  menuLv?: number;
  menuSeq?: number;
  taskSeCd?: string;
  menuUrl?: string;
}

export function parseMenuAuthList(raw: unknown): MenuAuthItem[] {
  if (!Array.isArray(raw)) return [];
  const out: MenuAuthItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const menuSn = Number(r.menuSn);
    if (Number.isNaN(menuSn)) continue;
    out.push({
      menuSn,
      menuNm: String(r.menuNm ?? ""),
      upMenuSn: r.upMenuSn as MenuAuthItem["upMenuSn"],
      menuLv: typeof r.menuLv === "number" ? r.menuLv : undefined,
      menuSeq: typeof r.menuSeq === "number" ? r.menuSeq : undefined,
      taskSeCd: typeof r.taskSeCd === "string" ? r.taskSeCd : undefined,
      menuUrl: typeof r.menuUrl === "string" ? r.menuUrl : undefined,
    });
  }
  return out;
}

export function parseMenuAuthMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}
