import { ANALYSIS_RESULT_STATUS as AnalysisResultStatus } from "@/constants/types";
import type { AnalysisDataResponse } from "@/interfaces/researchInterface";

/** 결과제출·검토요청·검토진행 중인 이력이 있는지 (신규 등록 버튼 비활성·경고용) */
export function analysisHasBlockingReviewInProgress(analysisDatas: AnalysisDataResponse[]): boolean {
  return analysisDatas.some(
    (d) =>
      d.asmtMetaRsltSttsCd === AnalysisResultStatus.SUBMITTED ||
      d.asmtMetaRsltSttsCd === AnalysisResultStatus.REQUEST_REVIEW ||
      d.asmtMetaRsltSttsCd === AnalysisResultStatus.INPROGRESS_REVIEW
  );
}
