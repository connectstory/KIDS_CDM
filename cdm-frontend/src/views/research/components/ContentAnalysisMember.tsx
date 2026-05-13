/**
 * 기관 데이터 분석결과 목록 표시 컴포넌트
 * 관리자 권한으로 각 참여기관의 분석결과 목록을 표시하는 컴포넌트
 *
 * 표시 정보:
 * - 기관명
 * - 분석결과 상태
 * - 등록일시
 * - 분석결과 관리 버튼
 */
import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useParams } from "react-router-dom";
import {
  CDM_UPLOAD_TYPE as CdmUploadType,
  PARTICIPATION_CDM_STATUS as ParticipationCdmStatus,
  RSLT_GROUP_STCD_TYPE as RsltGroupStcdType,
} from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import type { OrgAnalysisDataResponse } from "@/interfaces/researchInterface";
import { getResearchAnalysisStatusConfig } from "@/utils/common";
import { formatDateTime } from "@/utils/dateUtils";
import { useOrgAnalysisDataList, useResearchPartners } from "@/hooks/research/useResearchQueries";
import { useModal } from "@/hooks/useModal";
import Loader from "@/components/Loader";
import { AppButton, AppStatusChip } from "@/components/ui";
import overlayStyles from "./ResearchOverlay.module.scss";

/** 테이블 행 데이터 타입 */
interface PartnerAnalysisRow {
  asmtPtcpInstSn: number;
  instId: string;
  instNm: string | null;
  asmtMetaRsltSttsCd: string | null;
  regDt: string | null;
}

export default function ContentAnalysisMember() {
  const orgDataManagementModal = useModal(ModalNames.OrgDataManagement);

  /* ------------------------------
   * URL param
   * ------------------------------ */
  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;

  /* ------------------------------
   * 기관 데이터 목록 조회 (Non-CDM 기관)
   * ------------------------------ */
  const { data: partners = [], isLoading, isError } = useOrgAnalysisDataList(asmtSnNumber, RsltGroupStcdType.ANALYSIS_ORG, true);

  // 참여기관 목록 조회
  const { data: researchPartners = [] } = useResearchPartners(asmtSnNumber);

  /** 기관 데이터 분석(비-CDM 업로드) 대상 참여기관 수 */
  const orgAnalysisEligiblePartnerCount = useMemo(() => {
    let eligible = researchPartners.filter((p) => p.ptcpPrgrsSttsCd !== ParticipationCdmStatus.NOT_PARTICIPATING);
    eligible = eligible.filter((p) => p.uldTypeCd === null || p.uldTypeCd !== CdmUploadType.CDM);
    return eligible.length;
  }, [researchPartners]);

  const isOrgAnalysisSectionUnavailable = orgAnalysisEligiblePartnerCount === 0;

  /* ------------------------------
   * 테이블 행 데이터
   * ------------------------------ */
  const rowData: PartnerAnalysisRow[] = useMemo(
    () =>
      partners.map((p: OrgAnalysisDataResponse) => ({
        asmtPtcpInstSn: p.asmtPtcpInstSn,
        instId: p.instId,
        instNm: p.instNm,
        asmtMetaRsltSttsCd: p.asmtMetaRsltSttsCd,
        regDt: p.regDt,
      })),
    [partners]
  );

  /* ------------------------------
   * 테이블 컬럼 정의
   * ------------------------------ */
  const colDefs = useMemo<ColDef<PartnerAnalysisRow>[]>(
    () =>
      [
        {
          headerName: "기관명",
          field: "instNm",
          flex: 1,
          minWidth: 200,
        },
        {
          headerName: "분석결과 상태",
          headerClass: "ag-header-center",
          field: "asmtMetaRsltSttsCd",
          width: 130,
          cellStyle: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          },
          cellRenderer: (p: ICellRendererParams<PartnerAnalysisRow>) => {
            const statusConfig = getResearchAnalysisStatusConfig(p.value);
            return <AppStatusChip size="small" label={statusConfig?.label ?? "-"} chipStyle={statusConfig?.chipStyle ?? {}} />;
          },
        },
        {
          headerName: "등록일시",
          headerClass: "ag-header-center",
          field: "regDt",
          width: 190,
          cellStyle: { textAlign: "center" },
          valueFormatter: (params) => (params.value ? formatDateTime(params.value) : "-"),
        },
        {
          headerName: "",
          field: "ptcpInstSn",
          width: 140,
          cellStyle: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          },
          cellRenderer: (p: ICellRendererParams<PartnerAnalysisRow>) => {
            return (
              <AppButton
                variant="containedLight"
                size="small"
                onClick={() => {
                  orgDataManagementModal.open({
                    data: {
                      asmtPtcpInstSn: p.data?.asmtPtcpInstSn,
                      instId: p.data?.instId,
                      instNm: p.data?.instNm,
                    },
                  });
                }}
              >
                분석결과 관리
              </AppButton>
            );
          },
        },
      ] as ColDef<PartnerAnalysisRow>[],
    [orgDataManagementModal]
  );

  if (isLoading) {
    return (
      <Box sx={{ position: "relative", minHeight: 200 }}>
        <Loader isLoading={true} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ py: 2, textAlign: "center" }}>
        <Typography color="text.secondary">참여기관 분석결과 조회에 실패했습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      {/* 사용불가 오버레이 */}
      {isOrgAnalysisSectionUnavailable && (
        <Box className={overlayStyles.unavailableOverlay}>
          <Box>
            <Typography component="p" variant="h6">
              현황 업로드 참여기관이 없습니다,
            </Typography>
            <Typography component="p" variant="h6" className="pt-1">
              기관 데이터 분석결과는 참여기관이 자체 분석한 데이터를 기반으로 분석됩니다.
            </Typography>
          </Box>
        </Box>
      )}
      <Box className="ag-theme-cdm w-full" sx={{ minHeight: 222, maxHeight: 350, overflow: "auto" }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={colDefs}
          domLayout="autoHeight"
          rowHeight={42}
          overlayNoRowsTemplate={`<span style="padding:8px;">참여기관이 없습니다.</span>`}
        />
      </Box>
    </Box>
  );
}
