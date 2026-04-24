import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { CONTENT_GAP } from "@/constants/types";
import type { AnalysisDataResponse } from "@/interfaces/researchInterface";
import { getResearchAnalysisStatusConfig } from "@/utils/common";
import { formatDate } from "@/utils/dateUtils";

import { analysisHasBlockingReviewInProgress } from "./cdmAnalysisGridHelpers";

type ShowAlert = (args: { message: string; severity: "warning" | "error" | "info" | "success" }) => void;

export function buildCdmAnalysisColumnDefs(options: {
  analysisDatas: AnalysisDataResponse[];
  showAlert: ShowAlert;
  onClickNewRegister: () => void;
}): ColDef<AnalysisDataResponse>[] {
  const { analysisDatas, showAlert, onClickNewRegister } = options;

  return [
    {
      headerName: "분석 데이터 이력",
      field: "regDt",
      flex: 1,
      headerClass: "ag-left-aligned-header",
      cellRenderer: (params: ICellRendererParams<AnalysisDataResponse>) => {
        if (params.node.rowPinned === "top") {
          const blocked = analysisHasBlockingReviewInProgress(analysisDatas);

          return (
            <Box className="w-full h-full flex justify-center items-center">
              <Button
                variant="contained"
                color="primary"
                disabled={blocked}
                onClick={() => {
                  if (analysisHasBlockingReviewInProgress(analysisDatas)) {
                    showAlert({
                      message: '"결과제출, 검토요청, 검토진행" 중인 이력이 존재합니다, 검토 요청 마감 후 등록 가능합니다.',
                      severity: "warning",
                    });
                    return;
                  }
                  onClickNewRegister();
                }}
              >
                분석 데이터 등록
              </Button>
            </Box>
          );
        }

        const statusConfig = getResearchAnalysisStatusConfig(params.data?.asmtMetaRsltSttsCd);

        return (
          <Stack direction="row" className="ag-cell-center-vertical" spacing={CONTENT_GAP.SMALL}>
            <Chip size="small" label={statusConfig?.label} sx={statusConfig?.chipStyle ?? {}} />
            <Typography variant="default">{formatDate(params.data?.regDt)}</Typography>
          </Stack>
        );
      },
    },
  ];
}
