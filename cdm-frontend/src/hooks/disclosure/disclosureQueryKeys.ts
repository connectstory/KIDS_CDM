const DISCLOSURE_ROOT = ["disclosure"] as const;
const DISCLOSURE_LIST_ROOT = ["disclosures"] as const;

/** 모달·라우트에서 `pblntSn`이 number | string으로 섞여 쿼리 키가 갈라지지 않도록 통일 */
function pblntSnKeyPart(pblntSn: string | number | null | undefined) {
  if (pblntSn == null || pblntSn === "") return pblntSn;
  return String(pblntSn);
}

export const disclosureKeys = {
  all: DISCLOSURE_ROOT,
  listBase: DISCLOSURE_LIST_ROOT,
  detail: (pblntSn: string | number | null | undefined) => ["disclosure", pblntSnKeyPart(pblntSn)] as const,
  files: (pblntSn: string | number | null | undefined, ptcpInstSn?: string | null) =>
    ["disclosure-files", pblntSnKeyPart(pblntSn), ptcpInstSn ?? null] as const,
  partners: (pblntSn: string | number | null | undefined) => ["disclosure-partners", pblntSnKeyPart(pblntSn)] as const,
  cancelReason: (pblntSn: string | number | null | undefined, ptcpInstSn: string | number | null | undefined) =>
    ["disclosure-cancel-reason", pblntSn, ptcpInstSn] as const,
};
