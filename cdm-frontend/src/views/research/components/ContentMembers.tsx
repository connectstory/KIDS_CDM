import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useParams } from "react-router-dom";
import { STRINGS } from "@/constants/string";
import { CdmUploadType, ParticipationStatus } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import type { ResearchPartnerResponse } from "@/interfaces/researchInterface";
import { CdmUploadStatus, getCdmParticipationStatusConfig, getOrgParticipationStatusConfig } from "@/utils/common";
import { useResearchPartners } from "@/hooks/research/useResearchQueries";
import { useModal } from "@/hooks/useModal";
import Loader from "@/components/Loader";
import { AppButton, AppStatusChip } from "@/components/ui";

/** 참여진행상태 정렬: 미참여(02)는 항상 마지막(오름차순 기준; desc는 그리드가 반전) */
function participationProgressStatusSortRank(code: string | null | undefined): number {
  const c = (code ?? "").trim();
  if (c === ParticipationStatus.NOT_PARTICIPATING) return 10_000;
  const n = Number.parseInt(c, 10);
  return Number.isNaN(n) ? 9_000 : n;
}

export default function ContentMembersView() {
  // 컴포넌트 hook
  const partnerDetailModal = useModal(ModalNames.PartnerDetail);
  // URL param
  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();

  /* ------------------------------
   * React Query로 데이터 조회
   * ------------------------------ */
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;
  const { data: partners = [], isLoading, isError, refetch } = useResearchPartners(asmtSnNumber);

  type PartnerRow = {
    instId: string;
    asmtPtcpInstSn: number;
    ptcpPrgrsSttsCd: string;
    instNm: string | null;
    uldTypeCd: string | null;
    /** IRB/DRB 파일 존재 여부 (irbFiles 존재 시 true) */
    hasIrbFiles: boolean;
    /** 통합분석(rslt_group 02) 결과제외(utlz 08) 의견 존재 */
    exceptionYn: boolean;
    /** 메타(rslt_group 04) 활용 미동의(asmt_opnn_stts_cd 02) 의견 존재 */
    utilizationNonConsentYn: boolean;
    detail: string;
  };

  /* ------------------------------
   * 테이블 행 데이터
   * ------------------------------ */
  const rowData: PartnerRow[] = useMemo(
    () =>
      partners.map((p: ResearchPartnerResponse) => ({
        instId: p.instId,
        asmtPtcpInstSn: p.asmtPtcpInstSn,
        ptcpPrgrsSttsCd: p.ptcpPrgrsSttsCd,
        instNm: p.instNm,
        uldTypeCd: p.uldTypeCd,
        hasIrbFiles: (p.irbFiles?.length ?? 0) > 0,
        exceptionYn: (p.opnnAgreCnt ?? 0) > 0,
        utilizationNonConsentYn: (p.opnnNotUseCnt ?? 0) > 0,
        detail: "",
      })),
    [partners]
  );

  /* ------------------------------
   * 테이블 컬럼 정의
   * ------------------------------ */
  const colDefs = useMemo<ColDef<PartnerRow>[]>(
    () =>
      [
        {
          headerName: "상태",
          headerClass: "ag-header-center",
          field: "ptcpPrgrsSttsCd",
          width: 130,
          initialSort: "asc",
          comparator: (valueA, valueB, nodeA, nodeB) => {
            const codeA = nodeA?.data?.ptcpPrgrsSttsCd ?? valueA;
            const codeB = nodeB?.data?.ptcpPrgrsSttsCd ?? valueB;
            return (
              participationProgressStatusSortRank(codeA == null ? undefined : String(codeA)) -
              participationProgressStatusSortRank(codeB == null ? undefined : String(codeB))
            );
          },
          cellStyle: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center" as const,
            textAlign: "center" as const,
          },
          cellRenderer: (p: ICellRendererParams<PartnerRow>) => {
            const statusConfig =
              p.data?.uldTypeCd === CdmUploadType.CDM
                ? getCdmParticipationStatusConfig(p.value)
                : getOrgParticipationStatusConfig(p.value);
            return (
              <AppStatusChip
                size="small"
                label={statusConfig?.label ?? (p.value as string) ?? ""}
                chipStyle={statusConfig?.chipStyle ?? {}}
              />
            );
          },
        },
        {
          headerName: "기관명",
          field: "instNm",
          flex: 1,
          minWidth: 200,
        },
        {
          headerName: "데이터 업로드 상태",
          field: "uldTypeCd",
          width: 140,
          cellStyle: { textAlign: "center" as const },
          cellRenderer: (p: ICellRendererParams<PartnerRow>) => {
            const uploadStatus = CdmUploadStatus[p.value as keyof typeof CdmUploadStatus] ?? "-";
            return <Typography variant="default">{uploadStatus}</Typography>;
          },
        },
        {
          headerName: "IRB/DRB",
          headerClass: "ag-header-center",
          field: "hasIrbFiles",
          width: 110,
          cellStyle: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center" as const,
            textAlign: "center" as const,
          },
          cellRenderer: (p: ICellRendererParams<PartnerRow>) => {
            const hasIrbFiles = p.value as boolean;
            if (hasIrbFiles) {
              return STRINGS.REGISTERED;
            }

            return STRINGS.NOT_REGISTERED;
          },
        },
        {
          headerName: "통합분석결과 제외",
          headerClass: "ag-header-center",
          field: "exceptionYn",
          width: 135,
          cellStyle: { textAlign: "center" as const },
          cellRenderer: (p: ICellRendererParams<PartnerRow>) => {
            const exceptionYn = p.value as boolean;
            if (exceptionYn) {
              return (
                <Typography variant="default" color="error">
                  제외
                </Typography>
              );
            } else {
              return <Typography variant="default">-</Typography>;
            }
          },
        },
        // {
        //   headerName: "활용 미동의",
        //   headerClass: "ag-header-center",
        //   field: "utilizationNonConsentYn",
        //   width: 100,
        //   cellStyle: { textAlign: "center" as const },
        //   cellRenderer: (p: ICellRendererParams<PartnerRow>) => {
        //     const nonConsent = p.value as boolean;
        //     if (nonConsent) {
        //       return (
        //         <Typography variant="default" color="error">
        //           미동의
        //         </Typography>
        //       );
        //     }
        //     return <Typography variant="default">-</Typography>;
        //   },
        // },
        {
          headerName: "상세",
          headerClass: "ag-header-center",
          field: "detail",
          width: 100,
          cellStyle: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center" as const,
            textAlign: "center" as const,
          },
          cellRenderer: (p: ICellRendererParams<PartnerRow>) => {
            return (
              <AppButton
                variant="outlined"
                size="small"
                onClick={() => {
                  partnerDetailModal.open({
                    data: {
                      partner: p.data,
                    },
                  });
                }}
              >
                상세
              </AppButton>
            );
          },
        },
      ] as ColDef<PartnerRow>[],
    []
  );

  if (isLoading) {
    return (
      <Box sx={{ position: "relative", minHeight: 220 }}>
        <Loader isLoading={true} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ py: 3, textAlign: "center" }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          참여기관 조회에 실패했습니다.
        </Typography>
        <AppButton variant="outlined" size="small" onClick={() => void refetch()}>
          다시 시도
        </AppButton>
      </Box>
    );
  }

  return (
    <Box className="ag-theme-cdm w-full" style={{ maxHeight: 350, overflow: "auto" }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        domLayout="autoHeight"
        overlayNoRowsTemplate={`<span style="padding:8px;">참여기관이 없습니다.</span>`}
      />
    </Box>
  );
}
