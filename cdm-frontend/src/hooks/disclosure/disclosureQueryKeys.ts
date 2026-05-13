const DISCLOSURE_ROOT = ["disclosure"] as const;
const DISCLOSURE_LIST_ROOT = ["disclosures"] as const;

export const disclosureKeys = {
  all: DISCLOSURE_ROOT,
  listBase: DISCLOSURE_LIST_ROOT,
  detail: (pblntSn: string | number | null | undefined) => ["disclosure", pblntSn] as const,
  files: (pblntSn: string | number | null | undefined, ptcpInstSn?: string | null) =>
    ["disclosure-files", pblntSn, ptcpInstSn ?? null] as const,
  partners: (pblntSn: string | number | null | undefined) => ["disclosure-partners", pblntSn] as const,
  cancelReason: (pblntSn: string | number | null | undefined, ptcpInstSn: string | number | null | undefined) =>
    ["disclosure-cancel-reason", pblntSn, ptcpInstSn] as const,
};
