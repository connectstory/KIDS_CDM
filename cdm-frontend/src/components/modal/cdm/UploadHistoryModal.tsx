/**
 * 기관 CDM 업로드 이력 조회 모달
 * - 기관정보, 업로드 이력(총건수/오류건수/오류율), CDM 버전·수정일·업데이트 주기
 */
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { DisclosureAPI, type StatusInfoHistoryItem, type UploadStatsHistoryItem } from "@/api/disclosureApi";
import BaseModal from "@/components/modal/BaseModal";

function formatDate(v: string | undefined): string {
  if (!v) return "-";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d
      .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
      .replace(/\. /g, ".")
      .replace(".", ". ");
  } catch {
    return String(v);
  }
}

/** 세 자리마다 콤마(천 단위 구분) 표기 */
function formatNumber(n: number, fractionDigits?: number): string {
  if (fractionDigits != null) {
    return Number(n).toLocaleString("ko-KR", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }
  return Number(n).toLocaleString("ko-KR");
}

export interface UploadHistoryModalProps {
  open: boolean;
  onClose: () => void;
  pblntSn: number | null;
  ptcpInstSn: number | null;
  /** 기관명 */
  instNm?: string;
  /** 기관 연락처 */
  instContact?: string;
  /** 기관 관리자 */
  instManager?: string;
  /** CDM 버전 (테이블2용, 없으면 조회) */
  verInfoNm?: string;
  lastUpdtYmd?: string;
  updtCycleCnt?: number | string;
}

export default function UploadHistoryModal({
  open,
  onClose,
  pblntSn,
  ptcpInstSn,
  instNm = "-",
  instContact = "-",
  instManager = "-",
  verInfoNm,
  lastUpdtYmd,
  updtCycleCnt,
}: UploadHistoryModalProps) {
  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ["upload-stats-history", pblntSn, ptcpInstSn],
    queryFn: () => DisclosureAPI.getUploadStatsHistory(pblntSn!, ptcpInstSn!),
    enabled: open && pblntSn != null && ptcpInstSn != null,
  });

  const { data: statusInfoHistoryRes, isLoading: statusInfoHistoryLoading } = useQuery({
    queryKey: ["status-info-history", pblntSn, ptcpInstSn],
    queryFn: () => DisclosureAPI.getStatusInfoHistory(pblntSn!, ptcpInstSn!),
    enabled: open && !!pblntSn && !!ptcpInstSn,
  });

  const { data: partnerInfoRes } = useQuery({
    queryKey: ["partner-information", pblntSn, ptcpInstSn],
    queryFn: () => DisclosureAPI.getPartnerInformation(pblntSn!, ptcpInstSn!),
    enabled: open && !!pblntSn && !!ptcpInstSn,
  });

  const partnerInfo = partnerInfoRes?.data?.data as
    | { verInfoNm?: string; lastUpdtYmd?: string; updtCycleCnt?: number; instContact?: string; instManager?: string }
    | undefined;
  const displayInstContact = partnerInfo?.instContact ?? instContact ?? "-";
  const displayInstManager = partnerInfo?.instManager ?? instManager ?? "-";
  const historyList: UploadStatsHistoryItem[] = (
    Array.isArray(historyRes?.data?.data) ? historyRes.data.data : []
  ) as UploadStatsHistoryItem[];
  const statusInfoHistoryList: StatusInfoHistoryItem[] = (
    Array.isArray(statusInfoHistoryRes?.data?.data) ? statusInfoHistoryRes.data.data : []
  ) as StatusInfoHistoryItem[];
  const ver = verInfoNm ?? partnerInfo?.verInfoNm;
  const lastYmd = lastUpdtYmd ?? partnerInfo?.lastUpdtYmd;
  const cycle = updtCycleCnt ?? partnerInfo?.updtCycleCnt;
  const lastYmdFormatted = lastYmd ? `${lastYmd.slice(0, 4)}.${lastYmd.slice(4, 6)}.${lastYmd.slice(6, 8)}` : "-";

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="기관 CDM 업로드 이력 조회"
      fullWidth
      width="md"
      footer={
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
          <Button variant="contained" color="primary" onClick={onClose}>
            닫기
          </Button>
        </Box>
      }
    >
      <Box sx={{ px: 0 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          기관정보
        </Typography>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mb: 2, "& td": { py: 0.5, pr: 2 } }}>
          <tbody>
            <tr>
              <td style={{ width: 120, color: "#666" }}>기관명</td>
              <td>{instNm}</td>
            </tr>
            <tr>
              <td style={{ color: "#666" }}>기관 연락처</td>
              <td>{displayInstContact}</td>
            </tr>
            <tr>
              <td style={{ color: "#666" }}>기관 관리자</td>
              <td>{displayInstManager}</td>
            </tr>
          </tbody>
        </Box>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          업로드 이력
        </Typography>
        <Table size="small" sx={{ mb: 2, "& th, & td": { border: "1px solid #e0e0e0" } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell>번호</TableCell>
              <TableCell>등록일자</TableCell>
              <TableCell>등록자</TableCell>
              <TableCell>총건수</TableCell>
              <TableCell>오류건수</TableCell>
              <TableCell>오류율</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historyLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  조회 중…
                </TableCell>
              </TableRow>
            ) : historyList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  이력이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              historyList.map((row, idx) => (
                <TableRow key={row.uldStatsSn ?? idx}>
                  <TableCell>{formatNumber(historyList.length - idx)}</TableCell>
                  <TableCell>{formatDate(row.regDt)}</TableCell>
                  <TableCell>{row.rgtrNm ?? row.rgtrId ?? "-"}</TableCell>
                  <TableCell>{row.uldNocs != null ? `${formatNumber(row.uldNocs)} 건` : "-"}</TableCell>
                  <TableCell>{row.errNocs != null ? `${formatNumber(row.errNocs)} 건` : "-"}</TableCell>
                  <TableCell sx={{ color: row.errRt != null && row.errRt > 0 ? "error.main" : undefined }}>
                    {row.errRt != null ? `${formatNumber(row.errRt, 2)}%` : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          현황정보 입력이력
        </Typography>
        <Table size="small" sx={{ "& th, & td": { border: "1px solid #e0e0e0" } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell>번호</TableCell>
              <TableCell>등록일자</TableCell>
              <TableCell>등록자</TableCell>
              <TableCell>CDM 버전</TableCell>
              <TableCell>최종 수정 일자</TableCell>
              <TableCell>업데이트 주기</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statusInfoHistoryLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  조회 중…
                </TableCell>
              </TableRow>
            ) : statusInfoHistoryList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  이력이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              statusInfoHistoryList.map((row, idx) => {
                const lastYmd = row.lastUpdtYmd
                  ? `${row.lastUpdtYmd.slice(0, 4)}.${row.lastUpdtYmd.slice(4, 6)}.${row.lastUpdtYmd.slice(6, 8)}`
                  : "-";
                const cycleVal =
                  row.updtCycleCnt != null
                    ? typeof row.updtCycleCnt === "number"
                      ? formatNumber(row.updtCycleCnt)
                      : String(row.updtCycleCnt)
                    : "수시";
                return (
                  <TableRow key={`${row.pblntSn}-${idx}`}>
                    <TableCell>{formatNumber(statusInfoHistoryList.length - idx)}</TableCell>
                    <TableCell>{formatDate(row.regDt)}</TableCell>
                    <TableCell>{row.rgtrNm ?? row.rgtrId ?? "-"}</TableCell>
                    <TableCell>{row.verInfoNm ?? "-"}</TableCell>
                    <TableCell>{lastYmd}</TableCell>
                    <TableCell>{cycleVal}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Box>
    </BaseModal>
  );
}
