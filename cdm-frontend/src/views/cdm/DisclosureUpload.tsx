// import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { Alert, CircularProgress, Dialog, DialogContent, DialogTitle } from "@mui/material";
// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { Helmet } from "react-helmet";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { extractApiErrorMessage, extractMessageFromApiBody } from "@/api/axios";
// import { DisclosureAPI } from "@/api/disclosureApi";
// import type { RootState } from "@/store";
// import { cdmTableDisplayName } from "@/utils/cdmTableUtils";
// import {
//   type VrfcRuleHistDetail,
//   hasVrfcRuleHistDetail,
//   pickVrfcRuleHistDetailFromRow,
//   vrfcRuleHistDetailEntries,
// } from "@/utils/vrfcRuleHistDetail";
// import { useIsAdminCmShell } from "@/hooks/useCmRoutes";
// import { useGlobalAlert } from "@/hooks/useGlobalAlert";
// import FileContainer, { type FileData } from "@/components/FileContainer";
// import UploadHistoryModal from "@/components/modal/cdm/UploadHistoryModal";

// /** 2차 통계 행에서 유효성 룰 상세 행(uld_rul_sn 있음) 여부 */
// function getVrfcRuleIdFromRow(tbl: any): number | null {
//   const v = tbl?.vrfcRuleId ?? tbl?.vrfcruleid ?? tbl?.uld_rul_sn ?? tbl?.vrfc_rul_sn;
//   if (v == null || v === "") return null;
//   const n = Number(v);
//   return Number.isFinite(n) ? n : null;
// }

// function getUldVrfcGrpSnFromRow(tbl: any): number | null {
//   const v = tbl?.uldVrfcGrpSn ?? tbl?.uldvrfcgrpsn ?? tbl?.uld_vrfc_sn;
//   if (v == null || v === "") return null;
//   const n = Number(v);
//   return Number.isFinite(n) ? n : null;
// }

// /** tb_cm_e_tbl_uld_stats_hist.uld_rul_type_nm — VL=유효성, FN=필드명 일관성 등 */
// function getVrfcRuleTpCdFromRow(tbl: any): string | null {
//   const v = tbl?.vrfcRuleTpCd ?? tbl?.vrfcrultpcd ?? tbl?.uld_rul_type_nm ?? tbl?.vrfc_rul_type_nm;
//   if (v == null || v === "") return null;
//   return String(v).trim();
// }

// // 업로드 통계 인터페이스
// interface UploadStats {
//   totalCount: number;
//   errorCount: number;
//   errorRate: number;
//   /** 업로드 용량 (KB 단위, 리포팅 표시용) */
//   uldCpct?: number | null;
//   /** API 원본(유효성 룰별 행 포함) — 유효성 건수 클릭 시 팝업용 */
//   rawTblUldStatsHistList?: unknown[];
//   tableStats: Array<{
//     no: number;
//     tableName: string;
//     /** 매칭용 원본 테이블명 */
//     errTblNmRaw: string;
//     uldVrfcGrpSn: number | null;
//     totalCount: number;
//     errorCount: number;
//     completeness: number;
//     uniqueness: number;
//     validity: number;
//     accuracy: number;
//     errorRate: number;
//   }>;
// }

// /** 세 자리마다 콤마(천 단위 구분) 표기 */
// function formatNumber(n: number, fractionDigits?: number): string {
//   if (fractionDigits != null) {
//     return Number(n).toLocaleString("ko-KR", {
//       minimumFractionDigits: fractionDigits,
//       maximumFractionDigits: fractionDigits,
//     });
//   }
//   return Number(n).toLocaleString("ko-KR");
// }

// /** 용량 표시: 1GB 미만은 MB, 이상은 GB (메가 단위까지 표시) */
// function formatCapacity(bytesOrMb: number, unit: "bytes" | "mb"): string {
//   const mb = unit === "bytes" ? bytesOrMb / (1024 * 1024) : bytesOrMb;
//   if (mb >= 1024) {
//     return `${formatNumber(mb / 1024, 2)} GB`;
//   }
//   return `${formatNumber(mb, 2)} MB`;
// }

// /** 테이블 행: 오류율(%) = (5항목 오류건수 합 ÷ 총건수) × 100 */
// function tableErrorRatePercent(stat: {
//   totalCount: number;
//   errorCount: number;
//   completeness: number;
//   uniqueness: number;
//   validity: number;
//   accuracy: number;
// }): number {
//   const t = stat.totalCount ?? 0;
//   if (t <= 0) return 0;
//   const sum =
//     (stat.errorCount ?? 0) + (stat.completeness ?? 0) + (stat.uniqueness ?? 0) + (stat.validity ?? 0) + (stat.accuracy ?? 0);
//   return (sum / t) * 100;
// }

// function createSecureEntryId(): string {
//   const randomUuid = globalThis.crypto?.randomUUID?.();
//   if (randomUuid) {
//     return `${Date.now()}-${randomUuid}`;
//   }

//   const bytes = new Uint8Array(16);
//   globalThis.crypto?.getRandomValues?.(bytes);
//   const randomHex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
//   return `${Date.now()}-${randomHex}`;
// }

// export default function DisclosureUpload() {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   // const routes = useCmRoutes();
//   const { showAlert } = useGlobalAlert();
//   const isAdminShell = useIsAdminCmShell();

//   // 사용자 정보 가져오기
//   const session = useSelector((state: RootState) => state.session);
//   const mbrId = session.userNo || localStorage.getItem("mbrId") || "";
//   const instId = session.instId || "";

//   // 공시일련번호 가져오기 (우선순위: URL 파라미터 > Redux 스토어 > localStorage)
//   const pblntSnParam = searchParams.get("pblntSn");
//   const pblntSnFromStore = ""; //session.pblntSn;
//   const pblntSnFromStorage = localStorage.getItem("pblntSn");
//   const [pblntSn, setPblntSn] = useState<number | null>(
//     pblntSnParam
//       ? parseInt(pblntSnParam, 10)
//       : pblntSnFromStore
//         ? pblntSnFromStore
//         : pblntSnFromStorage
//           ? parseInt(pblntSnFromStorage, 10)
//           : null
//   );

//   // 로그인한 사용자의 기관과 연결된 공시 조회
//   const { data: userDisclosure } = useQuery({
//     queryKey: ["user-disclosure", instId, mbrId, isAdminShell],
//     queryFn: async () => {
//       // 기관 ID가 있으면 해당 기관이 참여하는 공시 조회
//       // 없으면 mbrId를 사용 (협력기관의 경우)
//       const filterInstId = instId || mbrId;

//       if (!filterInstId) {
//         return null;
//       }

//       const searchParams: any = {
//         page: 1,
//         length: 1,
//         instIdList: [filterInstId], // 자신의 기관이 참여하는 공시만 조회
//       };

//       try {
//         const response = await DisclosureAPI.getDisclosures(searchParams);
//         const disclosures = response.data?.data || [];

//         if (disclosures.length > 0) {
//           const disclosure = disclosures[0];
//           return disclosure;
//         } else {
//           // 공시가 없으면 전체 공시 중 최신 공시 조회 (관리자용)
//           if (isAdminShell) {
//             const allResponse = await DisclosureAPI.getDisclosures({ page: 1, length: 1 });
//             return allResponse.data?.data?.[0] || null;
//           }
//           return null;
//         }
//       } catch {
//         return null;
//       }
//     },
//     enabled: !pblntSn && (!!instId || !!mbrId), // pblntSn이 없고, instId 또는 mbrId가 있을 때만 조회
//     retry: false,
//   });

//   // 사용자 공시로 pblntSn 설정
//   useEffect(() => {
//     if (!pblntSn && userDisclosure?.pblntSn) {
//       setPblntSn(userDisclosure.pblntSn);
//     }
//   }, [pblntSn, userDisclosure]);

//   // Redux 스토어의 공시번호가 변경되면 업데이트
//   useEffect(() => {
//     if (pblntSnFromStore && pblntSnFromStore !== pblntSn) {
//       setPblntSn(pblntSnFromStore);
//     }
//   }, [pblntSnFromStore, pblntSn]);

//   // 파일 입력 ref
//   const drbFileInputRef = useRef<HTMLInputElement>(null);
//   const cdmFileInputRef = useRef<HTMLInputElement>(null);

//   // DRB 파일 상태
//   const [drbFileName, setDrbFileName] = useState<string>("");
//   const [drbFile, setDrbFile] = useState<File | null>(null);

//   // CDM 다중 파일 목록 상태
//   const [uploadType, setUploadType] = useState<"OMOP" | "SENTINEL">("OMOP");

//   /** OMOP 슬롯: ResearchServiceImpl CDM_TABLES_ORDER(FK 고려)과 맞춤. vital_signs는 SENTINEL 전용. */
//   const OMOP_TABLE_OPTIONS = [
//     { value: "person", label: "환자정보 (person)" },
//     { value: "observation_period", label: "관찰기간 (observation_period)" },
//     { value: "visit_occurrence", label: "방문정보 (visit_occurrence)" },
//     { value: "condition_occurrence", label: "진단정보 (condition_occurrence)" },
//     { value: "drug_exposure", label: "약물정보 (drug_exposure)" },
//     { value: "procedure_occurrence", label: "시술정보 (procedure_occurrence)" },
//     { value: "measurement", label: "검사결과 (measurement)" },
//     { value: "observation", label: "관찰정보 (observation)" },
//     { value: "death", label: "사망정보 (death)" },
//   ];

//   const SENTINEL_TABLE_OPTIONS = [
//     { value: "demographic", label: "인구통계 (demographic)" },
//     { value: "enrollment", label: "등록/가입 (enrollment)" },
//     { value: "encounter", label: "방문/진료 (encounter)" },
//     { value: "diagnosis", label: "진단 (diagnosis)" },
//     { value: "dispensing", label: "처방/조제 (dispensing)" },
//     { value: "laboratory_result", label: "검사결과 (laboratory_result)" },
//     { value: "procedure", label: "처치/시술 (procedure)" },
//     { value: "vital_signs", label: "활력징후 (vital_signs)" },
//   ];

//   const CDM_TABLE_OPTIONS = uploadType === "SENTINEL" ? SENTINEL_TABLE_OPTIONS : OMOP_TABLE_OPTIONS;

//   interface CdmFileEntry {
//     id: string;
//     tableName: string;
//     file: File;
//     fileName: string;
//   }

//   const [cdmFileList, setCdmFileList] = useState<CdmFileEntry[]>([]);
//   const [selectedTable, setSelectedTable] = useState<string>("");
//   const addedCdmTables = useMemo(() => new Set(cdmFileList.map((entry) => entry.tableName)), [cdmFileList]);

//   useEffect(() => {
//     setSelectedTable("");
//     setCdmFileList([]);
//   }, [uploadType]);

//   // 검증 진행 상태
//   const [isValidating, setIsValidating] = useState(false);
//   const [validateTaskId, setValidateTaskId] = useState<string | null>(null);
//   const [validateTotalBytes, setValidateTotalBytes] = useState<number | null>(null);
//   const [validateProgress, setValidateProgress] = useState<{
//     status: string;
//     currentTable: string | null;
//     completedCount: number;
//     totalCount: number;
//     elapsedMs: number;
//     estimatedRemainingMs: number;
//     results: Array<{ tableName: string; totalRows: number; errorCount: number; errorRate: number }>;
//   } | null>(null);
//   /** 검증 진행 모달 표시 여부. false면 백그라운드 모드(팝업 숨김, 폴링 계속) */
//   const [validateModalVisible, setValidateModalVisible] = useState(true);
//   /** 검증 상태 폴링 실패 시 서버 사유 알림 1회만 */
//   const validatePollErrorNotifiedRef = useRef(false);

//   /** 용량(MB) 기준 예상 검증 소요 시간(초). 1MB당 약 20초 가정 */
//   const VALIDATE_SECONDS_PER_MB = 20;
//   const validateEstimatedSeconds =
//     validateTotalBytes != null ? Math.max(30, Math.ceil((validateTotalBytes / (1024 * 1024)) * VALIDATE_SECONDS_PER_MB)) : null;

//   // 업로드 결과 통계 상태
//   const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
//   const [validityRuleModal, setValidityRuleModal] = useState<{
//     open: boolean;
//     tableLabel: string;
//     /** 기본: 유효성 검증. 일관성 필드명 룰은 "일관성 검증 — 필드명 룰별" */
//     dialogTitle?: string;
//     rules: { ruleId: number; count: number; detail: VrfcRuleHistDetail }[];
//   }>({ open: false, tableLabel: "", rules: [] });
//   /** 룰 상세 패널: 한 번에 하나만 펼침 */
//   const [validityRuleExpandedId, setValidityRuleExpandedId] = useState<number | null>(null);
//   const [consistencyModal, setConsistencyModal] = useState<{
//     open: boolean;
//     tableLabel: string;
//     loading: boolean;
//     errorMessage?: string;
//     missingFields: string[];
//     matchedFields: string[];
//   }>({ open: false, tableLabel: "", loading: false, missingFields: [], matchedFields: [] });
//   /** 등록완료 시 올린 파일(DRB+CDM) 총 용량(바이트). 용량 표시용 */
//   const [uploadedTotalBytes, setUploadedTotalBytes] = useState<number | null>(null);
//   const [historyModalOpen, setHistoryModalOpen] = useState(false);
//   const [isConfirmingUpload, setIsConfirmingUpload] = useState(false);
//   const [isUploadConfirmed, setIsUploadConfirmed] = useState(false);

//   const queryClient = useQueryClient();

//   // 파일 크기 포맷팅 함수
//   const formatFileSize = (bytes: number | null | undefined): string => {
//     if (!bytes || bytes === 0) return "0 Bytes";
//     const k = 1024;
//     const sizes = ["Bytes", "KB", "MB", "GB"];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
//   };

//   // 파일 확장자 추출 함수
//   const getFileExtension = (fileName: string): string => {
//     if (!fileName) return "";
//     const lastDot = fileName.lastIndexOf(".");
//     return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : "";
//   };

//   // 현재 공시일련번호 계산
//   const currentPblntSn = pblntSn || userDisclosure?.pblntSn;

//   // 공시 상세 조회 (공시제목 표시용)
//   const { data: disclosureDetailResponse, isError: isDisclosureDetailError } = useQuery({
//     queryKey: ["disclosure-detail", currentPblntSn],
//     queryFn: () => DisclosureAPI.getDisclosureById(currentPblntSn!),
//     enabled: !!currentPblntSn,
//     retry: false,
//   });
//   const displayTitle = disclosureDetailResponse?.data?.data?.ttlNm || userDisclosure?.ttlNm || "없음";
//   const pblntStcdForPartnerGate = disclosureDetailResponse?.data?.data?.pblntStcd;
//   const partnerUploadBlocked = !isAdminShell && !DisclosureAPI.isPartnerSubmissionAllowed(pblntStcdForPartnerGate);
//   const partnerUploadBlockedMessage = DisclosureAPI.getPartnerSubmissionBlockedMessage(pblntStcdForPartnerGate);

//   // 삭제된 공시(404)인 경우 pblntSn 초기화 → userDisclosure로 새 공시 자동 선택
//   useEffect(() => {
//     if (!currentPblntSn || !isDisclosureDetailError) return;
//     setPblntSn(null);
//     try {
//       localStorage.removeItem("pblntSn");
//     } catch {
//       /* ignore */
//     }
//     // dispatch(setPblntSnAction(undefined));
//     queryClient.invalidateQueries({ queryKey: ["user-disclosure", instId, mbrId] });
//   }, [currentPblntSn, isDisclosureDetailError, dispatch, queryClient, instId, mbrId]);

//   // 파일 다운로드 핸들러 (첨부파일 단일 방식: atchFileId(UUID) 사용 시 404 방지)
//   const handleFileDownload = async (file: FileData & { atchFileSn?: string; atchFileId?: string }) => {
//     const downloadParam = file.atchFileId ?? file.atchFileSn;
//     if (!downloadParam || !currentPblntSn) return;

//     try {
//       const response = await DisclosureAPI.downloadFile(downloadParam);
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute("download", file.name);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
//     } catch {
//       showAlert({
//         message: "파일 다운로드 중 오류가 발생했습니다.",
//         severity: "error",
//       });
//     }
//   };

//   const openValidityRuleBreakdown = (stat: UploadStats["tableStats"][number]) => {
//     const raw = (uploadStats?.rawTblUldStatsHistList ?? []) as any[];
//     const rules = raw
//       .filter((r) => {
//         if (getVrfcRuleIdFromRow(r) == null) return false;
//         const tp = getVrfcRuleTpCdFromRow(r);
//         if (tp === "FN") return false;
//         const tnm = String(r.errTblNm ?? r.err_tbl_nm ?? "").trim();
//         if (tnm !== stat.errTblNmRaw.trim()) return false;
//         if (stat.uldVrfcGrpSn != null) {
//           const g = getUldVrfcGrpSnFromRow(r);
//           if (g !== stat.uldVrfcGrpSn) return false;
//         }
//         return true;
//       })
//       .map((r) => ({
//         ruleId: getVrfcRuleIdFromRow(r)!,
//         count: Number(r.vrfcRuleErrNocs ?? r.vrfc_rul_err_nocs ?? 0) || 0,
//         detail: pickVrfcRuleHistDetailFromRow(r as Record<string, unknown>),
//       }))
//       .sort((a, b) => a.ruleId - b.ruleId);
//     setValidityRuleExpandedId(null);
//     setValidityRuleModal({ open: true, tableLabel: stat.tableName, dialogTitle: undefined, rules });
//   };

//   /** 일관성(필드명) 룰 상세 — tb_cm_m_vrfc field name consistency, uld_rul_type_nm=FN */
//   const openConsistencyFieldNameRuleBreakdown = (stat: UploadStats["tableStats"][number]) => {
//     const raw = (uploadStats?.rawTblUldStatsHistList ?? []) as any[];
//     const rules = raw
//       .filter((r) => {
//         if (getVrfcRuleIdFromRow(r) == null) return false;
//         if (getVrfcRuleTpCdFromRow(r) !== "FN") return false;
//         const tnm = String(r.errTblNm ?? r.err_tbl_nm ?? "").trim();
//         if (tnm !== stat.errTblNmRaw.trim()) return false;
//         if (stat.uldVrfcGrpSn != null) {
//           const g = getUldVrfcGrpSnFromRow(r);
//           if (g !== stat.uldVrfcGrpSn) return false;
//         }
//         return true;
//       })
//       .map((r) => ({
//         ruleId: getVrfcRuleIdFromRow(r)!,
//         count: Number(r.vrfcRuleErrNocs ?? r.vrfc_rul_err_nocs ?? 0) || 0,
//         detail: pickVrfcRuleHistDetailFromRow(r as Record<string, unknown>),
//       }))
//       .sort((a, b) => a.ruleId - b.ruleId);
//     setValidityRuleExpandedId(null);
//     setValidityRuleModal({
//       open: true,
//       tableLabel: stat.tableName,
//       dialogTitle: "일관성 검증 — 필드명 룰별",
//       rules,
//     });
//   };

//   const onConsistencyMetricClick = (stat: UploadStats["tableStats"][number]) => {
//     const raw = (uploadStats?.rawTblUldStatsHistList ?? []) as any[];
//     const hasFnDetail = raw.some((r) => {
//       if (getVrfcRuleIdFromRow(r) == null) return false;
//       if (getVrfcRuleTpCdFromRow(r) !== "FN") return false;
//       const tnm = String(r.errTblNm ?? r.err_tbl_nm ?? "").trim();
//       if (tnm !== stat.errTblNmRaw.trim()) return false;
//       if (stat.uldVrfcGrpSn != null) {
//         const g = getUldVrfcGrpSnFromRow(r);
//         if (g !== stat.uldVrfcGrpSn) return false;
//       }
//       return true;
//     });
//     if (hasFnDetail) {
//       openConsistencyFieldNameRuleBreakdown(stat);
//       return;
//     }
//     void openConsistencyHeaderDetail(stat);
//   };

//   const openConsistencyHeaderDetail = async (stat: UploadStats["tableStats"][number]) => {
//     if (!currentPblntSn || currentPtcpInstSn == null) {
//       showAlert({ message: "공시 또는 참여기관 정보가 없습니다.", severity: "warning" });
//       return;
//     }
//     const errTbl = String(stat.errTblNmRaw ?? "").trim();
//     if (!errTbl) return;
//     setConsistencyModal({
//       open: true,
//       tableLabel: stat.tableName,
//       loading: true,
//       errorMessage: undefined,
//       missingFields: [],
//       matchedFields: [],
//     });
//     try {
//       const res = await DisclosureAPI.getConsistencyHeaderDetail(currentPblntSn, currentPtcpInstSn, errTbl);
//       const d = res.data?.data as
//         | {
//             missingFields?: string[];
//             matchedFields?: string[];
//             error?: string;
//           }
//         | undefined;
//       if (d?.error) {
//         setConsistencyModal((m) => ({ ...m, loading: false, errorMessage: d.error }));
//         return;
//       }
//       setConsistencyModal((m) => ({
//         ...m,
//         loading: false,
//         missingFields: Array.isArray(d?.missingFields) ? d.missingFields : [],
//         matchedFields: Array.isArray(d?.matchedFields) ? d.matchedFields : [],
//       }));
//     } catch (e: unknown) {
//       const errMsg = extractApiErrorMessage(e, "일관성 헤더 상세를 불러오지 못했습니다.");
//       setConsistencyModal((m) => ({
//         ...m,
//         loading: false,
//         errorMessage: errMsg,
//       }));
//     }
//   };

//   // 재업로드 핸들러
//   const handleReUpload = async () => {
//     if (partnerUploadBlocked) {
//       showAlert({ message: partnerUploadBlockedMessage, severity: "warning" });
//       return;
//     }
//     if (await shouldAbortDueToUldPrgrs()) return;
//     if (!currentPblntSn || !currentPtcpInstSn) {
//       showAlert({ message: "공시 또는 참여기관 정보가 없습니다.", severity: "warning" });
//       return;
//     }
//     if (!window.confirm("업로드 내역을 모두 삭제하고 처음부터 다시 업로드하시겠습니까?")) return;

//     try {
//       await DisclosureAPI.resetUploadData(currentPblntSn, currentPtcpInstSn);

//       // 프론트엔드 상태 초기화
//       setUploadStats(null);
//       setIsUploadConfirmed(false);
//       setIsConfirmingUpload(false);
//       setDrbFile(null);
//       setDrbFileName("");
//       setCdmFileList([]);
//       setSelectedTable("");
//       setIsValidating(false);
//       setValidateTaskId(null);
//       setValidateTotalBytes(null);
//       setValidateProgress(null);

//       // 서버 데이터 리프레시
//       queryClient.invalidateQueries({ queryKey: ["upload-stats"] });
//       queryClient.invalidateQueries({ queryKey: ["disclosure-files"] });

//       showAlert({ message: "업로드 내역이 초기화되었습니다.", severity: "success" });
//     } catch (e: unknown) {
//       showAlert({
//         message: `업로드 초기화 실패: ${extractApiErrorMessage(e, "업로드 초기화 중 오류가 발생했습니다.")}`,
//         severity: "error",
//       });
//     }
//   };

//   // 업로드 확정 핸들러
//   const handleUploadConfirm = async () => {
//     const currentPblntSn = pblntSn || userDisclosure?.pblntSn;

//     if (!currentPblntSn) {
//       showAlert({
//         message: "공시일련번호가 없습니다.",
//         severity: "error",
//       });
//       return;
//     }

//     if (!currentPblntSn) {
//       // 로그인 여부 확인
//       // const hasLoginInfo = !!(instId || mbrId);
//       // const hasPartners = partners && Array.isArray(partners) && partners.length > 0;

//       // let errorMessage = "";
//       // if (!hasLoginInfo) {
//       //   // 로그인 정보가 없음
//       //   errorMessage = "로그인이 필요합니다. 로그인 후 다시 시도해주세요.";
//       // } else if (!hasPartners) {
//       //   // 참여기관 목록이 없음
//       //   errorMessage = "참여기관 목록을 불러올 수 없습니다. 공시 정보를 확인해주세요.";
//       // } else {
//       //   // 로그인은 되어 있지만 자신의 기관이 참여기관 목록에 없음
//       //   errorMessage = "자신의 기관이 이 공시에 참여하지 않았습니다. 관리자에게 문의하여 참여기관으로 추가해주세요.";
//       // }

//       // showAlert({
//       //   message: errorMessage,
//       //   severity: "error",
//       // });
//       return;
//     }

//     if (!uploadStats) {
//       showAlert({
//         message: "업로드 결과가 없습니다. 먼저 파일을 업로드해주세요.",
//         severity: "warning",
//       });
//       return;
//     }

//     if (isConfirmingUpload || isUploadConfirmed) {
//       return;
//     }

//     const confirmMessage = "업로드를 확정하시겠습니까? 확정 후에는 수정할 수 없습니다.";

//     if (!window.confirm(confirmMessage)) {
//       return;
//     }

//     const goToDisclosureDetail = () => {
//       // dispatch(setPblntSnAction(currentPblntSn));
//       // const detailPath = isAdminShell ? routes.CDM.DISCLOSURE_DETAIL_ADMIN : routes.CDM.DISCLOSURE_DETAIL_CUSTOMER;
//       // navigate(`${detailPath}?pblntSn=${currentPblntSn}`);
//     };

//     try {
//       setIsConfirmingUpload(true);

//       await DisclosureAPI.confirmUploadStats(currentPblntSn, currentPtcpInstSn!);

//       setIsUploadConfirmed(true);

//       // 업로드 확정 성공 시 참여기관 상태를 완료(05)로 변경
//       // if (currentPtcpInstSn) {
//       //   try {
//       //     await DisclosureAPI.requestPartnerStatus(currentPblntSn, currentPtcpInstSn, "05");

//       //     // 모든 참여기관 완료 확인 및 공시 상태 완료로 업데이트
//       //     try {
//       //       const checkResult = await DisclosureAPI.checkAndCompleteDisclosure(currentPblntSn);
//       //       const resultData = checkResult.data?.data;

//       //       if (resultData?.allCompleted && resultData?.statusUpdated) {
//       //         showAlert({
//       //           message: "업로드가 확정되었고, 모든 참여기관의 업로드가 완료되어 공시 상태가 완료로 변경되었습니다.",
//       //           severity: "success",
//       //         });

//       //         // 공시 상세 정보 및 목록 갱신
//       //         queryClient.invalidateQueries({ queryKey: ["disclosure", currentPblntSn] });
//       //         queryClient.invalidateQueries({ queryKey: ["user-disclosure", instId, mbrId] });
//       //         queryClient.invalidateQueries({ queryKey: ["disclosures-customer"] });
//       //         queryClient.invalidateQueries({ queryKey: ["disclosures"] });
//       //         queryClient.invalidateQueries({ queryKey: ["disclosure-partners", currentPblntSn] });
//       //         goToDisclosureDetail();
//       //         return;
//       //       } else if (resultData?.allCompleted && !resultData?.statusUpdated) {
//       //         showAlert({
//       //           message: "업로드가 확정되었습니다. 모든 참여기관이 완료 상태입니다.",
//       //           severity: "success",
//       //         });
//       //         // 화면 갱신
//       //         queryClient.invalidateQueries({ queryKey: ["disclosure-partners", currentPblntSn] });
//       //       } else {
//       //         const incompleteCount = resultData?.incompletePartners?.length || 0;
//       //         showAlert({
//       //           message: `업로드가 확정되었습니다. 아직 완료되지 않은 참여기관이 ${incompleteCount}개 있습니다.`,
//       //           severity: "info",
//       //         });
//       //         // 화면 갱신
//       //         queryClient.invalidateQueries({ queryKey: ["disclosure-partners", currentPblntSn] });
//       //       }
//       //     } catch (checkError: any) {
//       //       // 완료 체크 실패해도 업로드 확정은 성공했으므로 경고만 표시
//       //       showAlert({
//       //         message: "업로드가 확정되었지만 공시 완료 체크에 실패했습니다.",
//       //         severity: "warning",
//       //       });
//       //       // 화면 갱신
//       //       queryClient.invalidateQueries({ queryKey: ["disclosure-partners", currentPblntSn] });
//       //     }
//       //   } catch (statusError: any) {
//       //     // 상태 변경 실패해도 업로드 확정은 성공했으므로 경고만 표시
//       //     showAlert({
//       //       message: "업로드가 확정되었지만 상태 변경에 실패했습니다.",
//       //       severity: "warning",
//       //     });
//       //     goToDisclosureDetail();
//       //     return;
//       //   }
//       // }

//       showAlert({
//         message: "업로드가 확정되었습니다.",
//         severity: "success",
//       });
//       goToDisclosureDetail();
//     } catch (error: unknown) {
//       showAlert({
//         message: `업로드 확정 실패: ${extractApiErrorMessage(error, "업로드 확정 중 오류가 발생했습니다.")}`,
//         severity: "error",
//       });
//       setIsUploadConfirmed(false);
//     } finally {
//       setIsConfirmingUpload(false);
//     }
//   };

//   // 파일 삭제 핸들러 (atchFileId(UUID) 사용, 커뮤니티와 동일)
//   const handleFileDelete = async (file: FileData) => {
//     if (!currentPblntSn) {
//       showAlert({ message: "공시일련번호가 없습니다.", severity: "error" });
//       return;
//     }

//     const fileWithId = file as FileData & { atchFileId?: string };
//     const atchFileId = fileWithId.atchFileId;

//     if (!atchFileId || atchFileId.trim() === "") {
//       showAlert({ message: "파일 ID를 찾을 수 없습니다.", severity: "error" });
//       return;
//     }

//     if (!window.confirm(`파일 "${file.name}"을(를) 삭제하시겠습니까?`)) {
//       return;
//     }

//     try {
//       await DisclosureAPI.deleteFile(currentPblntSn, atchFileId);
//       showAlert({ message: "파일이 삭제되었습니다.", severity: "success" });
//       // 파일 input value 초기화 → 삭제 후 새 파일 선택 시 목록에 정상 반영되도록
//       if (drbFileInputRef.current) drbFileInputRef.current.value = "";
//       // 파일 목록 쿼리 무효화 (숫자/문자열 키 모두 무효화)
//       const pblntSnForInvalidation = currentPblntSn != null ? String(currentPblntSn) : "";
//       queryClient.invalidateQueries({
//         predicate: (query) =>
//           query.queryKey[0] === "disclosure-files" &&
//           query.queryKey[1] != null &&
//           String(query.queryKey[1]) === pblntSnForInvalidation,
//       });
//     } catch (error: unknown) {
//       showAlert({
//         message: extractApiErrorMessage(error, "파일 삭제 중 오류가 발생했습니다."),
//         severity: "error",
//       });
//     }
//   };

//   // 참여기관일련번호 조회
//   // const {
//   //   data: partners = [],
//   //   isLoading: isLoadingPartners,
//   //   error: partnersError,
//   // } = useQuery({
//   //   queryKey: ["disclosure-partners", pblntSn || userDisclosure?.pblntSn],
//   //   queryFn: async () => {
//   //     const currentPblntSn = pblntSn || userDisclosure?.pblntSn;
//   //     if (!currentPblntSn) {
//   //       return [];
//   //     }

//   //     try {
//   //       const response = await DisclosureAPI.getPartnersByPblntSn(currentPblntSn);

//   //       // 응답 데이터가 배열인지 확인
//   //       const partnersData = response.data?.data;
//   //       if (Array.isArray(partnersData)) {
//   //         return partnersData;
//   //       } else {
//   //         return [];
//   //       }
//   //     } catch (error: any) {
//   //       // 에러가 발생해도 빈 배열을 반환하여 컴포넌트가 계속 작동하도록 함
//   //       return [];
//   //     }
//   //   },
//   //   enabled: !!(pblntSn || userDisclosure?.pblntSn),
//   //   retry: false,
//   // });

//   // const partnersList = Array.isArray(partners) ? partners : [];

//   // 자신의 기관에 해당하는 참여기관일련번호 찾기
//   const currentPtcpInstSn = useMemo(() => {
//     // 참여기관 목록의 매칭 기준은 instId이어야 함 (mbrId로 fallback하면 다른 기관과 잘못 매칭될 수 있음)
//     const filterInstId = instId?.trim();

//     if (!filterInstId) {
//       return null;
//     }

//     // if (!Array.isArray(partnersList) || partnersList.length === 0) {
//     //   return null;
//     // }

//     // 1단계: 정확 매칭 (trim + 대소문자 무시)
//     // const target = filterInstId.trim().toUpperCase();
//     // const partner = partnersList.find((p: any) => {
//     //   if (!p.instId) return false;
//     //   return String(p.instId).trim().toUpperCase() === target;
//     // });

//     // 매칭 결과 로그
//     // if (partner) {
//     //   return partner.ptcpInstSn;
//     // }

//     return null;
//   }, [partnersList, instId, mbrId]);

//   // const myPartner = useMemo(
//   //   () =>
//   //     (Array.isArray(partnersList) && currentPtcpInstSn != null
//   //       ? partnersList.find((p: any) => p.ptcpInstSn === currentPtcpInstSn)
//   //       : null) as { instNm?: string } | undefined,
//   //   [partnersList, currentPtcpInstSn]
//   // );

//   /** TB_CM_M_ULD_PRST.uld_prgrs_yn — 서버 기준 백그라운드 업로드/검증 진행 */
//   const { data: uldPrgrsYn = "N" } = useQuery({
//     queryKey: ["uld-prgrs-yn", currentPblntSn, currentPtcpInstSn],
//     queryFn: async () => {
//       const res = await DisclosureAPI.getUldPrgrsYn(currentPblntSn!, currentPtcpInstSn!);
//       const api = res.data as { data?: { uldPrgrsYn?: string } };
//       const yn = api?.data?.uldPrgrsYn;
//       return yn === "Y" ? "Y" : "N";
//     },
//     enabled: !!currentPblntSn && currentPtcpInstSn != null,
//     refetchInterval: (q) => (q.state.data === "Y" ? 3000 : false),
//   });

//   /** 테이블·파일·DRB 저장 잠금 (서버 플래그 Y 또는 로컬 검증 중) */
//   const fileControlsLocked = partnerUploadBlocked || uldPrgrsYn === "Y" || isValidating;
//   /** 등록완료: 진행중일 때만 비활성 (Y일 때는 클릭해 확인 후 강제 해제 가능) */
//   const registerCompleteDisabled = partnerUploadBlocked || isValidating;

//   /** 서버에 uld_prgrs_yn=Y 인 경우 확인 후 강제 N. true면 호출부에서 중단 */
//   const shouldAbortDueToUldPrgrs = useCallback(
//     async (ptcpInstSnForCheck?: number | null): Promise<boolean> => {
//       const ptcpInstSn = ptcpInstSnForCheck ?? currentPtcpInstSn;
//       if (!currentPblntSn || ptcpInstSn == null) return false;
//       const res = await DisclosureAPI.getUldPrgrsYn(currentPblntSn, ptcpInstSn);
//       const api = res.data as { data?: { uldPrgrsYn?: string } };
//       const yn = api?.data?.uldPrgrsYn;
//       if (yn !== "Y") return false;
//       const cancel = window.confirm("백그라운드 업로드/검증 작업이 진행중입니다. 취소하시겠습니까?");
//       if (!cancel) return true;
//       await DisclosureAPI.clearUldPrgrsYn(currentPblntSn, ptcpInstSn);
//       await queryClient.invalidateQueries({ queryKey: ["uld-prgrs-yn", currentPblntSn, ptcpInstSn] });
//       return false;
//     },
//     [currentPblntSn, currentPtcpInstSn, queryClient]
//   );

//   // 업로드된 파일 목록 조회 — 본인(참여기관) 업로드만 표시. ptcpInstSn 있을 때만 요청해 다른 협력사 파일이 섞이지 않도록 함.
//   const { data: filesResponse } = useQuery({
//     queryKey: ["disclosure-files", currentPblntSn, currentPtcpInstSn],
//     queryFn: () => DisclosureAPI.getFilesByPblntSn(currentPblntSn!, currentPtcpInstSn ?? undefined),
//     enabled: !!currentPblntSn && currentPtcpInstSn != null,
//     retry: false,
//   });

//   // 파일 목록 데이터 변환 (DRB와 CDM 파일 구분)
//   const existingFiles = useMemo(() => {
//     if (!filesResponse?.data?.data || !Array.isArray(filesResponse.data.data)) {
//       return { drbFiles: [], cdmFiles: [] };
//     }

//     const fileList = filesResponse.data.data;
//     const drbFiles: FileData[] = [];
//     const cdmFiles: FileData[] = [];

//     fileList.forEach((file: any) => {
//       // 삭제된 파일 제외
//       const delYn = file.delYn;
//       if (delYn === "Y" || delYn === "y") return;

//       // 표시명: file_cn(atchFileSn)이 비어있으면 file_nm(strgFileNm) 사용 (로컬 업로드 시 원본명이 file_nm에 저장됨)
//       const atchFileSnVal = file.atchFileSn != null ? String(file.atchFileSn).trim() : "";
//       const strgFileNm = file.strgFileNm || "";
//       const originalName = atchFileSnVal !== "" ? String(file.atchFileSn) : strgFileNm || "";
//       const atchFileId = file.atchFileId || "";
//       const savedFileName = strgFileNm && strgFileNm.trim() !== "" ? strgFileNm : originalName;
//       if (!savedFileName || (typeof savedFileName === "string" && savedFileName.trim() === "")) {
//         return;
//       }

//       const fileSeCd = file.fileSeCd || "";
//       const fileSize = file.fileSz || null;
//       const ext = getFileExtension(savedFileName);

//       const fileData: FileData & { atchFileSn?: string; atchFileId?: string } = {
//         name: originalName, // 표시용(원본파일명)
//         ext: ext || fileSeCd,
//         size: formatFileSize(fileSize),
//         showDeleteButton: true,
//         atchFileSn: savedFileName, // 다운로드용(저장파일명 strgFileNm)
//         atchFileId: atchFileId || undefined, // 삭제용(UUID, 커뮤니티와 동일)
//       };

//       // 파일 구분 코드에 따라 분류 (코드모음 그룹ID 0013: 07=DRB, 08=CDM)
//       if (fileSeCd === "07") {
//         // DRB 파일
//         drbFiles.push(fileData);
//       } else if (fileSeCd === "08") {
//         // CDM 파일
//         cdmFiles.push(fileData);
//       }
//     });

//     return { drbFiles, cdmFiles };
//   }, [filesResponse]);

//   /** 서버에 이미 업로드된 파일(DRB+CDM) 총 용량(바이트). 업로드/검증 전에도 용량 표시용 */
//   const existingTotalBytes = useMemo(() => {
//     const list = filesResponse?.data?.data;
//     if (!Array.isArray(list)) return 0;
//     return list.reduce((acc: number, f: any) => {
//       const delYn = f?.delYn;
//       if (delYn === "Y" || delYn === "y") return acc;
//       const sz = f?.fileSz;
//       const n = typeof sz === "number" ? sz : sz != null ? Number(sz) : 0;
//       return acc + (Number.isFinite(n) && n > 0 ? n : 0);
//     }, 0);
//   }, [filesResponse]);

//   // 기존 업로드 통계 조회 (협력기관 화면: 공시번호·기관일련번호 모두 필수 — 다른 공시/다른 기관 데이터와 섞이지 않도록)
//   const {
//     data: uploadStatsResponse,
//     isLoading: isLoadingUploadStats,
//     error: uploadStatsError,
//   } = useQuery({
//     queryKey: ["upload-stats", currentPblntSn, currentPtcpInstSn],
//     queryFn: async () => {
//       if (!currentPblntSn || currentPtcpInstSn == null) {
//         return null;
//       }

//       const response = await DisclosureAPI.getUploadStats(currentPblntSn, currentPtcpInstSn);
//       const result = response.data?.data || null;
//       return result;
//     },
//     enabled: !!currentPblntSn && currentPtcpInstSn != null,
//     retry: false,
//   });

//   // 업로드 통계 조회 상태 로깅
//   useEffect(() => {}, [isLoadingUploadStats, uploadStatsResponse, uploadStatsError, currentPblntSn, currentPtcpInstSn]);

//   // 조회된 업로드 통계를 상태로 변환
//   useEffect(() => {
//     if (uploadStatsResponse) {
//       const uldStatsHist = uploadStatsResponse.uldStatsHist;
//       const tblUldStatsHistList = uploadStatsResponse.tblUldStatsHistList || [];
//       const rawTblList = Array.isArray(tblUldStatsHistList) ? tblUldStatsHistList : [];
//       const summaryRowsOnly = rawTblList.filter((tbl: any) => getVrfcRuleIdFromRow(tbl) == null);

//       const tableStats = summaryRowsOnly.map((tbl: any, index: number) => {
//         const errRaw = String(tbl.errTblNm ?? tbl.errtblNm ?? tbl.err_tbl_nm ?? "");
//         return {
//           no: summaryRowsOnly.length - index,
//           tableName: cdmTableDisplayName(errRaw),
//           errTblNmRaw: errRaw,
//           uldVrfcGrpSn: getUldVrfcGrpSnFromRow(tbl),
//           totalCount: Number(tbl.uldNocs ?? tbl.uld_nocs) || 0,
//           errorCount: Number(tbl.errNocs ?? tbl.err_nocs) || 0,
//           completeness: Number(tbl.vrfcFnlErrNocs ?? tbl.vrfc_fnl_err_nocs) || 0,
//           uniqueness: Number(tbl.vrfcUnqErrNocs ?? tbl.vrfc_unq_err_nocs) || 0,
//           validity: Number(tbl.vrfcVldErrNocs ?? tbl.vrfc_vld_err_nocs) || 0,
//           accuracy: Number(tbl.vrfcNmlErrNocs ?? tbl.vrfc_nml_err_nocs) || 0,
//           errorRate: (tbl.errRt ?? tbl.err_rt) != null ? parseFloat(String(tbl.errRt ?? tbl.err_rt)) : 0,
//         };
//       });

//       // 1차 통계가 있으면 사용, 없으면 2차 테이블별 통계를 집계 (camel/snake_case 응답 모두 처리)
//       const uNocs = uldStatsHist != null ? ((uldStatsHist as any).uldNocs ?? (uldStatsHist as any).uld_nocs) : undefined;
//       const eNocs = uldStatsHist != null ? ((uldStatsHist as any).errNocs ?? (uldStatsHist as any).err_nocs) : undefined;
//       let aggTotal = uNocs != null ? Number(uNocs) || 0 : 0;
//       let aggError = eNocs != null ? Number(eNocs) || 0 : 0;
//       const uldCpct =
//         uldStatsHist != null
//           ? Number((uldStatsHist as any).uldCpct ?? (uldStatsHist as any).uldcpct ?? (uldStatsHist as any).uld_cpct) || null
//           : null;

//       if (aggTotal === 0 && tableStats.length > 0) {
//         aggTotal = tableStats.reduce((sum, t) => sum + t.totalCount, 0);
//       }
//       if (tableStats.length > 0) {
//         aggError = tableStats.reduce(
//           (sum, t) =>
//             sum + (t.errorCount ?? 0) + (t.completeness ?? 0) + (t.uniqueness ?? 0) + (t.validity ?? 0) + (t.accuracy ?? 0),
//           0
//         );
//       }
//       /* 상단 붉은 오류율: 표시 중인 총건수·오류건수만으로 계산 */
//       const aggRate = aggTotal > 0 ? (aggError / aggTotal) * 100 : 0;

//       const stats: UploadStats = {
//         totalCount: aggTotal,
//         errorCount: aggError,
//         errorRate: aggRate,
//         uldCpct: uldCpct ?? undefined,
//         rawTblUldStatsHistList: rawTblList,
//         tableStats,
//       };

//       // 1차 통계가 없어도 2차 통계가 있으면 표시
//       if (uldStatsHist || stats.tableStats.length > 0) {
//         setUploadStats(stats);
//       }
//     }
//   }, [uploadStatsResponse]);

//   // DRB 파일 찾기 버튼 클릭 핸들러
//   const handleDrbFileClick = () => {
//     if (fileControlsLocked) return;
//     drbFileInputRef.current?.click();
//   };

//   // CDM 파일 찾기 버튼 클릭 핸들러
//   const handleCdmFileClick = () => {
//     if (fileControlsLocked) return;
//     if (!selectedTable) {
//       showAlert({ message: "CDM 테이블을 먼저 선택해주세요.", severity: "warning" });
//       return;
//     }
//     cdmFileInputRef.current?.click();
//   };

//   // CDM 테이블 선택 핸들러 (이미 추가된 테이블은 중복 선택 차단)
//   const handleCdmTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const nextTable = e.target.value;
//     if (!nextTable) {
//       setSelectedTable("");
//       return;
//     }
//     if (addedCdmTables.has(nextTable)) {
//       showAlert({ message: "이미등록된 테이블입니다.", severity: "warning" });
//       setSelectedTable("");
//       return;
//     }
//     setSelectedTable(nextTable);
//   };

//   // DRB 파일 선택 핸들러 (선택 후 value 초기화해 동일 파일 재선택 시에도 onChange 발생)
//   const handleDrbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (fileControlsLocked) {
//       e.target.value = "";
//       return;
//     }
//     const file = e.target.files?.[0];
//     if (file) {
//       setDrbFile(file);
//       setDrbFileName(file.name);
//     }
//     e.target.value = "";
//   };

//   // CDM 파일 선택 핸들러 → 다중파일 목록에 추가
//   const handleCdmFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (fileControlsLocked) {
//       if (cdmFileInputRef.current) cdmFileInputRef.current.value = "";
//       return;
//     }
//     const file = e.target.files?.[0];
//     if (!file) {
//       if (cdmFileInputRef.current) cdmFileInputRef.current.value = "";
//       return;
//     }
//     const nameLower = file.name.toLowerCase();
//     const isCsv =
//       nameLower.endsWith(".csv") ||
//       file.type === "text/csv" ||
//       file.type === "application/csv" ||
//       file.type === "text/comma-separated-values";
//     if (!isCsv) {
//       showAlert({ message: "CDM 데이터는 CSV 파일만 선택할 수 있습니다.", severity: "warning" });
//       if (cdmFileInputRef.current) cdmFileInputRef.current.value = "";
//       return;
//     }
//     if (!selectedTable) {
//       if (cdmFileInputRef.current) cdmFileInputRef.current.value = "";
//       return;
//     }
//     if (addedCdmTables.has(selectedTable)) {
//       showAlert({ message: "이미등록된 테이블입니다.", severity: "warning" });
//       setSelectedTable("");
//       if (cdmFileInputRef.current) cdmFileInputRef.current.value = "";
//       return;
//     }
//     const entry: CdmFileEntry = {
//       id: createSecureEntryId(),
//       tableName: selectedTable,
//       file,
//       fileName: file.name,
//     };
//     setCdmFileList((prev) => [...prev, entry]);
//     setSelectedTable("");
//     if (cdmFileInputRef.current) cdmFileInputRef.current.value = "";
//   };

//   // CDM 파일 목록에서 삭제
//   const handleCdmFileRemove = (id: string) => {
//     setCdmFileList((prev) => prev.filter((f) => f.id !== id));
//   };

//   useEffect(() => {
//     validatePollErrorNotifiedRef.current = false;
//   }, [validateTaskId]);

//   // 검증 폴링
//   useEffect(() => {
//     if (!isValidating || !validateTaskId || !currentPblntSn) return;
//     const poll = setInterval(async () => {
//       try {
//         const res = await DisclosureAPI.cdmValidateStatus(currentPblntSn, validateTaskId);
//         const p = res.data?.data;
//         if (!p) return;
//         setValidateProgress(p);

//         if (p.status === "DONE" || p.status === "ERROR" || p.status === "NOT_FOUND") {
//           clearInterval(poll);
//           setIsValidating(false);
//           setValidateTotalBytes(null);
//           await queryClient.invalidateQueries({ queryKey: ["uld-prgrs-yn", currentPblntSn, currentPtcpInstSn] });

//           if (p.status === "DONE") {
//             showAlert({ message: "CDM 검증이 완료되었습니다.", severity: "success" });
//             // 업로드 결과 정보 즉시 갱신: invalidate 후 refetch로 최신 통계 반영
//             await queryClient.invalidateQueries({ queryKey: ["upload-stats", currentPblntSn, currentPtcpInstSn] });
//             await queryClient.refetchQueries({ queryKey: ["upload-stats", currentPblntSn, currentPtcpInstSn] });
//           } else if (p.status === "NOT_FOUND") {
//             showAlert({
//               message: "CDM 검증 작업을 찾을 수 없습니다. 세션 만료 또는 서버 재시작이 있었을 수 있습니다.",
//               severity: "error",
//             });
//           } else {
//             showAlert({ message: `CDM 검증 오류: ${p.errorMessage || "알 수 없는 오류"}`, severity: "error" });
//           }
//         } else if (p.status && p.status !== "RUNNING") {
//           clearInterval(poll);
//           setIsValidating(false);
//           setValidateTotalBytes(null);
//           await queryClient.invalidateQueries({ queryKey: ["uld-prgrs-yn", currentPblntSn, currentPtcpInstSn] });
//           showAlert({
//             message: `CDM 검증이 비정상 상태(${p.status})로 종료되었습니다.`,
//             severity: "error",
//           });
//         }
//       } catch (e: unknown) {
//         if (!validatePollErrorNotifiedRef.current) {
//           validatePollErrorNotifiedRef.current = true;
//           showAlert({
//             message: `검증 상태 조회 실패: ${extractApiErrorMessage(e, "네트워크 오류")}`,
//             severity: "warning",
//           });
//         }
//       }
//     }, 3000);
//     return () => clearInterval(poll);
//   }, [isValidating, validateTaskId, currentPblntSn, currentPtcpInstSn, queryClient, showAlert]);

//   const formatTime = (seconds: number) => {
//     const m = Math.floor(seconds / 60);
//     const s = seconds % 60;
//     return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
//   };

//   // 파일저장 버튼 핸들러 (DRB 파일만 업로드)
//   const handleFileSave = async () => {
//     if (fileControlsLocked) return;
//     const currentPblntSn = pblntSn || userDisclosure?.pblntSn;

//     if (!currentPblntSn) {
//       showAlert({ message: "공시를 찾을 수 없습니다.", severity: "error" });
//       return;
//     }

//     try {
//       if (drbFile) {
//         await DisclosureAPI.uploadFiles(currentPblntSn, [drbFile], "07", currentPtcpInstSn ?? undefined);
//         setDrbFile(null);
//         setDrbFileName("");
//         const pblntSnStr = String(currentPblntSn);
//         queryClient.invalidateQueries({
//           predicate: (q) => q.queryKey[0] === "disclosure-files" && String(q.queryKey[1]) === pblntSnStr,
//         });
//         showAlert({ message: "DRB 파일이 업로드되었습니다.", severity: "success" });
//       } else {
//         showAlert({ message: "업로드할 DRB 파일을 선택해주세요.", severity: "warning" });
//       }
//     } catch (error: unknown) {
//       showAlert({
//         message: `DRB 파일 업로드 실패: ${extractApiErrorMessage(error, "파일 업로드 오류")}`,
//         severity: "error",
//       });
//     }
//   };

//   // 등록완료 버튼 핸들러: CDM 파일 업로드 + 검증 시작
//   const handleRegisterComplete = async () => {
//     const effectivePblntSn = pblntSn || userDisclosure?.pblntSn;
//     if (!effectivePblntSn) {
//       showAlert({ message: "공시일련번호가 없습니다.", severity: "error" });
//       return;
//     }

//     // 클릭 시점에 partnersList와 instId를 기준으로 ptcpInstSn을 다시 확정한다.
//     // (이전 렌더에서 currentPtcpInstSn이 stale일 경우를 방지)
//     const resolvedPtcpInstSn = (() => {
//       const targetInstId = instId?.trim();
//       if (!targetInstId) return null;
//       if (!Array.isArray(partnersList) || partnersList.length === 0) return null;

//       const target = targetInstId.toUpperCase();
//       const partner = partnersList.find((p: any) => {
//         const pInstId = p?.instId;
//         if (!pInstId) return false;
//         return String(pInstId).trim().toUpperCase() === target;
//       });
//       return partner?.ptcpInstSn ?? null;
//     })();

//     if (partnerUploadBlocked) {
//       showAlert({ message: partnerUploadBlockedMessage, severity: "warning" });
//       return;
//     }
//     if (await shouldAbortDueToUldPrgrs()) return;

//     const hasExistingDrb = existingFiles.drbFiles.length > 0 || !!drbFile;
//     if (!hasExistingDrb) {
//       showAlert({ message: "DRB 파일을 먼저 업로드해주세요.", severity: "error" });
//       return;
//     }

//     if (cdmFileList.length === 0 && existingFiles.cdmFiles.length === 0) {
//       showAlert({ message: "CDM 파일을 추가해주세요.", severity: "warning" });
//       return;
//     }

//     if (!resolvedPtcpInstSn) {
//       showAlert({ message: "참여기관 정보를 확인할 수 없습니다.", severity: "error" });
//       return;
//     }

//     try {
//       // 올린 파일 총 용량 저장 (DRB + CDM, 표시용)
//       const drbBytes = drbFile?.size ?? 0;
//       const cdmBytes = cdmFileList.reduce((acc, e) => acc + (e.file?.size ?? 0), 0);
//       setUploadedTotalBytes(drbBytes + cdmBytes);

//       // 1) DRB 파일이 아직 업로드 안됐으면 업로드
//       if (drbFile) {
//         await DisclosureAPI.uploadFiles(effectivePblntSn, [drbFile], "07", resolvedPtcpInstSn ?? undefined);
//         setDrbFile(null);
//         setDrbFileName("");
//       }

//       // 2) CDM 파일 업로드 + storedName 수집
//       const tableFileMap: Array<{ tableName: string; storedName: string }> = [];

//       for (const entry of cdmFileList) {
//         try {
//           const uploadRes = await DisclosureAPI.uploadCsvTmp(
//             effectivePblntSn,
//             [entry.file],
//             "08",
//             resolvedPtcpInstSn ?? undefined
//           );
//           const uploadedRows = uploadRes.data?.data || [];
//           const storedFilename = uploadedRows[0]?.storedFilename;
//           if (!storedFilename) {
//             const serverMsg = extractMessageFromApiBody(uploadRes.data);
//             showAlert({
//               message: serverMsg
//                 ? `${entry.file.name}: ${serverMsg}`
//                 : `${entry.file.name} 업로드 결과를 확인할 수 없습니다. (서버 응답에 저장 파일명 없음)`,
//               severity: "error",
//             });
//             return;
//           }
//           tableFileMap.push({ tableName: entry.tableName, storedName: storedFilename });
//         } catch (csvErr: unknown) {
//           showAlert({
//             message: `CSV 임시 저장 실패 (${entry.file.name}): ${extractApiErrorMessage(csvErr, "요청 실패")}`,
//             severity: "error",
//           });
//           return;
//         }
//       }

//       // 파일 목록 갱신
//       const pblntSnStr = String(effectivePblntSn);
//       queryClient.invalidateQueries({
//         predicate: (q) => q.queryKey[0] === "disclosure-files" && String(q.queryKey[1]) === pblntSnStr,
//       });

//       if (tableFileMap.length === 0) {
//         showAlert({ message: "업로드된 CDM 파일이 없습니다.", severity: "warning" });
//         return;
//       }

//       if (resolvedPtcpInstSn == null) {
//         showAlert({ message: "참여기관을 확인할 수 없습니다. 검증을 진행할 수 없습니다.", severity: "warning" });
//         return;
//       }

//       const totalBytes = cdmFileList.reduce((acc, e) => acc + (e.file?.size ?? 0), 0);
//       setValidateTotalBytes(totalBytes);

//       // 3) 검증 API 호출 (총 용량 전달 → 백엔드가 저장해 조회 시 용량 표시)
//       const validateRes = await DisclosureAPI.cdmValidate(effectivePblntSn, {
//         ptcpInstSn: resolvedPtcpInstSn,
//         tables: tableFileMap,
//         totalUploadBytes: drbBytes + cdmBytes,
//       });

//       const taskId = validateRes.data?.data?.taskId;
//       if (!taskId) {
//         const serverMsg = extractMessageFromApiBody(validateRes.data);
//         showAlert({
//           message: serverMsg ? `검증 시작 실패: ${serverMsg}` : "검증 시작에 실패했습니다. (taskId 없음)",
//           severity: "error",
//         });
//         return;
//       }

//       await queryClient.invalidateQueries({ queryKey: ["uld-prgrs-yn", effectivePblntSn, resolvedPtcpInstSn] });

//       // 4) 폴링 시작 + 진행 모달 표시
//       setValidateTaskId(taskId);
//       setValidateProgress(null);
//       setIsValidating(true);
//       setValidateModalVisible(true);
//       setCdmFileList([]);
//     } catch (error: unknown) {
//       showAlert({
//         message: `등록완료 실패: ${extractApiErrorMessage(error, "등록 처리 오류")}`,
//         severity: "error",
//       });
//     }
//   };

//   return (
//     <>
//       <Helmet>
//         <title>CDM - CDM 업로드 공시</title>
//       </Helmet>
//       <style>{`
//     .partner-information-write {
//       font-family: Arial, Helvetica, sans-serif;
//       background: #f5f6f8;
//       padding: 20px;
//       color: #333;
//     }

//     h2 {
//       margin-bottom: 8px;
//     }

//     .section {
//       background: #fff;
//       border: 1px solid #ddd;
//       margin-bottom: 20px;
//     }

//     .section-header {
//       padding: 10px 14px;
//       font-weight: bold;
//       border-bottom: 1px solid #ddd;
//       background: #fafafa;
//     }

//     table {
//       width: 100%;
//       border-collapse: collapse;
//     }

//     th, td {
//       border: 1px solid #e1e1e1;
//       padding: 8px 10px;
//       font-size: 13px;
//     }

//     th {
//       background: #f0f2f5;
//       text-align: left;
//       width: 180px;
//     }

//     .file-row {
//       display: flex;
//       gap: 8px;
//       align-items: center;
//     }

//     input[type="text"] {
//       flex: 1;
//       padding: 6px;
//       border: 1px solid #ccc;
//     }

//     .btn {
//       padding: 6px 12px;
//       border: 1px solid #c3c3c3;
//       background: #fff;
//       cursor: pointer;
//       font-size: 12px;
//       border-radius: 4px;
//     }

//     .btn.primary {
//       background: #ff8c42;
//       color: #fff;
//       border-color: #ff8c42;
//     }

//     .btn.gray {
//       background: #f2f2f2;
//     }

//     .btn-group {
//       display: flex;
//       gap: 8px;
//       justify-content: flex-end;
//       padding: 10px;
//     }

//     .highlight {
//       border: 2px dotted red;
//       padding: 10px;
//     }

//     .summary {
//       display: flex;
//       gap: 30px;
//       padding: 10px;
//       font-size: 13px;
//     }

//     .error-rate {
//       color: red;
//       font-weight: bold;
//     }

//     .right-actions {
//       display: flex;
//       gap: 8px;
//       justify-content: flex-end;
//       padding: 10px;
//     }
//     `}</style>

//       {partnerUploadBlocked && (
//         <Alert severity="warning" sx={{ mb: 2 }}>
//           {partnerUploadBlockedMessage}
//         </Alert>
//       )}
//       {!partnerUploadBlocked && uldPrgrsYn === "Y" && (
//         <Alert severity="info" sx={{ mb: 2 }}>
//           백그라운드 업로드/검증이 진행 중입니다. 테이블 선택·파일 찾기·DRB 저장·등록완료는 완료까지 사용할 수 없습니다.
//         </Alert>
//       )}

//       <div className="section">
//         <div className="section-header">CDM 업로드 정보</div>
//         <table>
//           <tbody>
//             <tr>
//               <th>공시일련번호</th>
//               <td>{pblntSn || userDisclosure?.pblntSn || "없음"}</td>
//             </tr>
//             <tr>
//               <th>공시제목</th>
//               <td>{displayTitle}</td>
//             </tr>
//             <tr>
//               <th>기관명</th>
//               <td>{myPartner?.instNm || localStorage.getItem("instNm") || "없음"}</td>
//             </tr>
//             <tr>
//               <th>DRB 첨부파일</th>
//               <td>
//                 <div>
//                   <div className="file-row">
//                     <button type="button" className="btn" onClick={handleDrbFileClick} disabled={fileControlsLocked}>
//                       파일 찾기
//                     </button>
//                     <input
//                       key="drb-file-input"
//                       ref={drbFileInputRef}
//                       type="file"
//                       style={{ display: "none" }}
//                       onChange={handleDrbFileChange}
//                     />
//                     <input type="text" value={drbFileName} readOnly placeholder="파일을 선택하세요" />
//                     <button type="button" className="btn primary" onClick={handleFileSave} disabled={fileControlsLocked}>
//                       DRB 파일저장
//                     </button>
//                   </div>
//                   {existingFiles.drbFiles.length > 0 && (
//                     <div style={{ marginTop: "10px" }}>
//                       <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>업로드된 DRB 파일:</div>
//                       <FileContainer
//                         files={existingFiles.drbFiles}
//                         showDeleteButton={true}
//                         onClick={handleFileDownload}
//                         onDelete={handleFileDelete}
//                       />
//                     </div>
//                   )}
//                 </div>
//               </td>
//             </tr>
//             <tr>
//               <th>CDM 첨부파일</th>
//               <td>
//                 <div>
//                   <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
//                     <div style={{ fontSize: "12px", color: "#666", minWidth: "90px" }}>업로드 타입</div>
//                     <label style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
//                       <input
//                         type="radio"
//                         name="uploadType"
//                         value="OMOP"
//                         checked={uploadType === "OMOP"}
//                         onChange={() => setUploadType("OMOP")}
//                         disabled={fileControlsLocked}
//                       />
//                       OMOP
//                     </label>
//                     <label style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
//                       <input
//                         type="radio"
//                         name="uploadType"
//                         value="SENTINEL"
//                         checked={uploadType === "SENTINEL"}
//                         onChange={() => setUploadType("SENTINEL")}
//                         disabled={fileControlsLocked}
//                       />
//                       Sentinel
//                     </label>
//                   </div>
//                   <div className="file-row">
//                     <select
//                       value={selectedTable}
//                       onChange={handleCdmTableChange}
//                       disabled={fileControlsLocked}
//                       style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px", minWidth: "200px" }}
//                     >
//                       <option value="">-- 테이블 선택 --</option>
//                       {CDM_TABLE_OPTIONS.map((opt) => (
//                         <option key={opt.value} value={opt.value}>
//                           {opt.label}
//                         </option>
//                       ))}
//                     </select>
//                     <button type="button" className="btn" onClick={handleCdmFileClick} disabled={fileControlsLocked}>
//                       파일 찾기
//                     </button>
//                     <input
//                       ref={cdmFileInputRef}
//                       type="file"
//                       style={{ display: "none" }}
//                       onChange={handleCdmFileChange}
//                       accept=".csv,text/csv,application/csv"
//                     />
//                   </div>

//                   {cdmFileList.length > 0 && (
//                     <div style={{ marginTop: "10px" }}>
//                       <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
//                         추가된 CDM 파일 ({cdmFileList.length}개):
//                       </div>
//                       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                         <thead>
//                           <tr>
//                             <th style={{ width: "40px", textAlign: "center" }}>#</th>
//                             <th>테이블명</th>
//                             <th>파일명</th>
//                             <th style={{ width: "60px", textAlign: "center" }}>삭제</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {cdmFileList.map((entry, idx) => (
//                             <tr key={entry.id}>
//                               <td style={{ textAlign: "center" }}>{idx + 1}</td>
//                               <td>
//                                 {CDM_TABLE_OPTIONS.find((o) => o.value === entry.tableName)?.label ||
//                                   cdmTableDisplayName(entry.tableName)}
//                               </td>
//                               <td>{entry.fileName}</td>
//                               <td style={{ textAlign: "center" }}>
//                                 <button
//                                   type="button"
//                                   className="btn"
//                                   style={{ padding: "2px 8px", fontSize: "11px", color: "red", border: "1px solid #ddd" }}
//                                   onClick={() => handleCdmFileRemove(entry.id)}
//                                   disabled={fileControlsLocked}
//                                 >
//                                   X
//                                 </button>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </div>
//               </td>
//             </tr>
//           </tbody>
//         </table>

//         <div className="btn-group">
//           <button type="button" className="btn gray" onClick={() => setHistoryModalOpen(true)}>
//             이력조회
//           </button>
//           <button className="btn gray" onClick={() => navigate("../DisclosureList")}>
//             목록
//           </button>
//           <button
//             className="btn primary"
//             onClick={handleRegisterComplete}
//             disabled={registerCompleteDisabled}
//             style={{
//               opacity: registerCompleteDisabled ? 0.5 : 1,
//               cursor: registerCompleteDisabled ? "not-allowed" : "pointer",
//             }}
//           >
//             등록완료
//           </button>
//         </div>
//       </div>

//       <div className="section-header">CDM 업로드 결과 정보</div>

//       <div className="summary">
//         <div>총건수 : {formatNumber(uploadStats?.totalCount ?? 0)}건</div>
//         <div>오류건수 : {formatNumber(uploadStats?.errorCount ?? 0)}건</div>
//         <div>
//           오류율 :{" "}
//           <span className="error-rate">{uploadStats?.errorRate != null ? formatNumber(uploadStats.errorRate, 2) : "0.00"}%</span>
//         </div>
//         <div>
//           용량 :{" "}
//           {uploadedTotalBytes != null && uploadedTotalBytes > 0
//             ? formatCapacity(uploadedTotalBytes, "bytes")
//             : existingTotalBytes > 0
//               ? formatCapacity(existingTotalBytes, "bytes")
//               : uploadStats?.uldCpct != null
//                 ? formatCapacity(uploadStats.uldCpct, "mb")
//                 : "-"}
//         </div>
//       </div>

//       <table>
//         <thead>
//           <tr>
//             <th style={{ textAlign: "center" }}>번호</th>
//             <th style={{ textAlign: "center" }}>테이블명</th>
//             <th style={{ textAlign: "center" }}>총 건수</th>
//             <th style={{ textAlign: "center" }}>일관성(건)</th>
//             <th style={{ textAlign: "center" }}>완전성(건)</th>
//             <th style={{ textAlign: "center" }}>유일성(건)</th>
//             <th style={{ textAlign: "center" }}>유효성(건)</th>
//             <th style={{ textAlign: "center" }}>정확성(건)</th>
//             <th style={{ textAlign: "center" }}>오류율(%)</th>
//           </tr>
//         </thead>
//         <tbody>
//           {uploadStats?.tableStats && uploadStats.tableStats.length > 0 ? (
//             uploadStats.tableStats.map((stat) => {
//               const pct = tableErrorRatePercent(stat);
//               return (
//                 <tr key={stat.no}>
//                   <td style={{ textAlign: "center" }}>{formatNumber(stat.no)}</td>
//                   <td>{cdmTableDisplayName(stat.tableName)}</td>
//                   <td>{formatNumber(stat.totalCount)}</td>
//                   <td
//                     style={{
//                       textAlign: "center",
//                       ...((stat.errorCount ?? 0) > 0 ? { cursor: "pointer", textDecoration: "underline", color: "#1565c0" } : {}),
//                     }}
//                     onClick={() => {
//                       if ((stat.errorCount ?? 0) <= 0) return;
//                       onConsistencyMetricClick(stat);
//                     }}
//                     title={(stat.errorCount ?? 0) > 0 ? "클릭하여 일관성 룰별 상세(필드명) 또는 CSV 헤더 분석 보기" : undefined}
//                   >
//                     {formatNumber(stat.errorCount ?? 0)}
//                   </td>
//                   <td style={{ textAlign: "center" }}>{formatNumber(stat.completeness ?? 0)}</td>
//                   <td style={{ textAlign: "center" }}>{formatNumber(stat.uniqueness ?? 0)}</td>
//                   <td
//                     style={{
//                       textAlign: "center",
//                       ...(stat.validity > 0 ? { cursor: "pointer", textDecoration: "underline", color: "#1565c0" } : {}),
//                     }}
//                     onClick={() => {
//                       if ((stat.validity ?? 0) <= 0) return;
//                       openValidityRuleBreakdown(stat);
//                     }}
//                     title={stat.validity > 0 ? "클릭하여 유효성 룰별 오류 건수 보기" : undefined}
//                   >
//                     {formatNumber(stat.validity ?? 0)}
//                   </td>
//                   <td style={{ textAlign: "center" }}>{formatNumber(stat.accuracy ?? 0)}</td>
//                   <td style={{ textAlign: "center" }}>{formatNumber(pct, 2)}%</td>
//                 </tr>
//               );
//             })
//           ) : (
//             <tr>
//               <td colSpan={9} style={{ textAlign: "center", padding: "20px" }}>
//                 업로드 결과가 없습니다. 파일을 업로드해주세요.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//       <div className="right-actions">
//         <button
//           className="btn gray"
//           onClick={handleReUpload}
//           disabled={partnerUploadBlocked || isValidating}
//           style={{
//             opacity: partnerUploadBlocked || isValidating ? 0.5 : 1,
//             cursor: partnerUploadBlocked || isValidating ? "not-allowed" : "pointer",
//           }}
//         >
//           재업로드
//         </button>
//         <button
//           type="button"
//           className="btn primary"
//           onClick={(e) => {
//             e.preventDefault();
//             e.stopPropagation();
//             handleUploadConfirm();
//           }}
//           disabled={
//             !uploadStats || isConfirmingUpload || isUploadConfirmed || partnerUploadBlocked || isValidating || uldPrgrsYn === "Y"
//           }
//           style={{
//             cursor:
//               !uploadStats ||
//               isConfirmingUpload ||
//               isUploadConfirmed ||
//               partnerUploadBlocked ||
//               isValidating ||
//               uldPrgrsYn === "Y"
//                 ? "not-allowed"
//                 : "pointer",
//             opacity:
//               !uploadStats ||
//               isConfirmingUpload ||
//               isUploadConfirmed ||
//               partnerUploadBlocked ||
//               isValidating ||
//               uldPrgrsYn === "Y"
//                 ? 0.5
//                 : 1,
//           }}
//         >
//           {isUploadConfirmed ? "마감" : isConfirmingUpload ? "확정 중..." : "업로드 확정"}
//         </button>
//       </div>

//       {/* CDM 검증 진행 상태 모달 */}
//       {isValidating && validateModalVisible && (
//         <div
//           style={{
//             position: "fixed",
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             backgroundColor: "rgba(0,0,0,0.5)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 9999,
//           }}
//         >
//           <div
//             style={{
//               background: "#fff",
//               borderRadius: "12px",
//               padding: "32px 40px",
//               minWidth: "480px",
//               maxWidth: "560px",
//               boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
//             }}
//           >
//             <h3 style={{ margin: "0 0 20px", fontSize: "18px", textAlign: "center" }}>CDM 데이터 검증 진행중</h3>

//             {/* 업로드 파일 용량 및 예상 소요 시간 */}
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 marginBottom: "16px",
//                 padding: "10px 12px",
//                 background: "#f8f9fa",
//                 borderRadius: "8px",
//                 fontSize: "13px",
//                 color: "#555",
//               }}
//             >
//               <span>
//                 <span style={{ color: "#888" }}>업로드 파일 용량: </span>
//                 <strong>
//                   {validateTotalBytes != null
//                     ? validateTotalBytes >= 1024 * 1024
//                       ? `${(validateTotalBytes / (1024 * 1024)).toFixed(2)} MB`
//                       : `${(validateTotalBytes / 1024).toFixed(2)} KB`
//                     : "-"}
//                 </strong>
//               </span>
//               <span>
//                 <span style={{ color: "#888" }}>예상 소요 시간: </span>
//                 <strong>{validateEstimatedSeconds != null ? `약 ${formatTime(validateEstimatedSeconds)}` : "-"}</strong>
//               </span>
//             </div>

//             {/* 프로그레스 바 (경과시간 기준 진행, 완료 시 100%) */}
//             {/* {(() => {
//               const totalEstimated = initialRemainingSeconds ?? validateEstimatedSeconds ?? 1;
//               const progressByTime = totalEstimated > 0 ? Math.min(100, (elapsedSeconds / totalEstimated) * 100) : 0;
//               const progressPercent = validateProgress?.status === "DONE" ? 100 : progressByTime;
//               const progressLabel =
//                 validateProgress?.status === "DONE"
//                   ? "완료"
//                   : initialRemainingSeconds != null
//                     ? `${Math.round(progressPercent)}% (경과 ${formatTime(elapsedSeconds)} / 약 ${formatTime(totalEstimated)})`
//                     : validateProgress
//                       ? `${validateProgress.completedCount} / ${validateProgress.totalCount}`
//                       : "0%";
//               return (
//                 <div
//                   style={{
//                     background: "#e9ecef",
//                     borderRadius: "8px",
//                     height: "24px",
//                     overflow: "hidden",
//                     marginBottom: "16px",
//                   }}
//                 >
//                   <div
//                     style={{
//                       height: "100%",
//                       borderRadius: "8px",
//                       background: "linear-gradient(90deg, #ff8c42, #ff6b1a)",
//                       width: `${progressPercent}%`,
//                       transition: "width 0.5s ease",
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       color: "#fff",
//                       fontSize: "12px",
//                       fontWeight: "bold",
//                     }}
//                   >
//                     {progressLabel}
//                   </div>
//                 </div>
//               );
//             })()} */}

//             {/* 현재 처리중 테이블 */}
//             <div style={{ textAlign: "center", marginBottom: "12px", fontSize: "14px" }}>
//               {validateProgress?.currentTable ? (
//                 <>
//                   <span style={{ color: "#666" }}>처리중: </span>
//                   <strong>
//                     {CDM_TABLE_OPTIONS.find((o) => o.value === validateProgress.currentTable)?.label ||
//                       validateProgress.currentTable}
//                   </strong>
//                 </>
//               ) : validateProgress?.status === "DONE" ? (
//                 <span style={{ color: "#28a745", fontWeight: "bold" }}>검증 완료</span>
//               ) : (
//                 <span style={{ color: "#666" }}>검증 준비중...</span>
//               )}
//             </div>

//             {/* 완료된 테이블 목록 */}
//             {validateProgress && validateProgress.results.length > 0 && (
//               <div style={{ marginTop: "12px", maxHeight: "150px", overflowY: "auto", fontSize: "12px" }}>
//                 <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                   <thead>
//                     <tr style={{ background: "#f8f9fa" }}>
//                       <th style={{ padding: "4px 8px", textAlign: "left" }}>테이블</th>
//                       <th style={{ padding: "4px 8px", textAlign: "right" }}>행수</th>
//                       <th style={{ padding: "4px 8px", textAlign: "right" }}>오류</th>
//                       <th style={{ padding: "4px 8px", textAlign: "right" }}>오류율</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {validateProgress.results.map((r, i) => (
//                       <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
//                         <td style={{ padding: "4px 8px" }}>{cdmTableDisplayName(r.tableName)}</td>
//                         <td style={{ padding: "4px 8px", textAlign: "right" }}>{r.totalRows.toLocaleString()}</td>
//                         <td style={{ padding: "4px 8px", textAlign: "right", color: r.errorCount > 0 ? "red" : "inherit" }}>
//                           {r.errorCount.toLocaleString()}
//                         </td>
//                         <td style={{ padding: "4px 8px", textAlign: "right" }}>{r.errorRate.toFixed(1)}%</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}

//             {/* 애니메이션 인디케이터 */}
//             {validateProgress?.status !== "DONE" && (
//               <div style={{ textAlign: "center", marginTop: "16px", color: "#999", fontSize: "12px" }}>
//                 <span style={{ animation: "pulse 1.5s infinite" }}>검증이 진행중입니다. 기다려주세요.....</span>
//               </div>
//             )}

//             {/* 닫기 / 취소 / 백그라운드로 전환 버튼 */}
//             <div
//               style={{
//                 display: "flex",
//                 gap: "10px",
//                 justifyContent: "flex-end",
//                 marginTop: "24px",
//                 paddingTop: "16px",
//                 borderTop: "1px solid #eee",
//               }}
//             >
//               <button
//                 type="button"
//                 onClick={() => {
//                   setValidateModalVisible(false);
//                   showAlert({
//                     message: "검증은 백그라운드에서 계속됩니다. 완료 후 통계가 갱신됩니다.",
//                     severity: "info",
//                   });
//                 }}
//                 style={{
//                   padding: "8px 16px",
//                   fontSize: "14px",
//                   borderRadius: "6px",
//                   border: "1px solid #dc3545",
//                   background: "#fff",
//                   color: "#dc3545",
//                   cursor: "pointer",
//                 }}
//               >
//                 닫기
//               </button>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setValidateModalVisible(false);
//                   showAlert({ message: "검증이 백그라운드에서 진행됩니다. 완료 시 알림이 표시됩니다.", severity: "info" });
//                 }}
//                 style={{
//                   padding: "8px 16px",
//                   fontSize: "14px",
//                   borderRadius: "6px",
//                   border: "1px solid #ff8c42",
//                   background: "#ff8c42",
//                   color: "#fff",
//                   cursor: "pointer",
//                 }}
//               >
//                 백그라운드로 전환
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <Dialog
//         open={consistencyModal.open}
//         onClose={() => setConsistencyModal((m) => ({ ...m, open: false }))}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle>일관성 — CSV 헤더 ({consistencyModal.tableLabel})</DialogTitle>
//         <DialogContent>
//           {consistencyModal.loading ? (
//             <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
//               <CircularProgress size={28} />
//             </div>
//           ) : consistencyModal.errorMessage ? (
//             <p style={{ padding: "8px 0", color: "#c62828" }}>{consistencyModal.errorMessage}</p>
//           ) : (
//             <>
//               <p style={{ fontSize: "13px", color: "#555", marginBottom: 12 }}>
//                 기대 필드명 대비 CSV 헤더에 <strong>없음</strong>(불일치)과 <strong>있음</strong>(일치)입니다.
//               </p>
//               <div style={{ marginBottom: 16 }}>
//                 <div style={{ fontWeight: 600, marginBottom: 6, color: "#c62828" }}>불일치 (CSV에 없는 기대 필드)</div>
//                 {consistencyModal.missingFields.length === 0 ? (
//                   <p style={{ fontSize: "13px", color: "#666" }}>없음</p>
//                 ) : (
//                   <ul style={{ margin: 0, paddingLeft: 20, fontSize: "13px" }}>
//                     {consistencyModal.missingFields.map((f) => (
//                       <li key={f}>{f}</li>
//                     ))}
//                   </ul>
//                 )}
//               </div>
//               <div>
//                 <div style={{ fontWeight: 600, marginBottom: 6, color: "#2e7d32" }}>일치 (CSV 헤더와 매칭)</div>
//                 {consistencyModal.matchedFields.length === 0 ? (
//                   <p style={{ fontSize: "13px", color: "#666" }}>없음</p>
//                 ) : (
//                   <ul style={{ margin: 0, paddingLeft: 20, fontSize: "13px" }}>
//                     {consistencyModal.matchedFields.map((f) => (
//                       <li key={f}>{f}</li>
//                     ))}
//                   </ul>
//                 )}
//               </div>
//             </>
//           )}
//         </DialogContent>
//       </Dialog>

//       <Dialog
//         open={validityRuleModal.open}
//         onClose={() => {
//           setValidityRuleExpandedId(null);
//           setValidityRuleModal((m) => ({ ...m, open: false }));
//         }}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle>
//           {(validityRuleModal.dialogTitle ?? "유효성 검증 — 룰별 오류") + " (" + validityRuleModal.tableLabel + ")"}
//         </DialogTitle>
//         <DialogContent>
//           {validityRuleModal.rules.length === 0 ? (
//             <p style={{ padding: "8px 0" }}>
//               저장된 룰별 상세가 없습니다. DB 컬럼 반영 전 데이터이거나, 해당 검증에서 룰별 집계가 없는 경우입니다.
//             </p>
//           ) : (
//             <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
//               <thead>
//                 <tr>
//                   <th style={{ textAlign: "left", padding: "8px 4px", borderBottom: "1px solid #ddd" }}>룰 번호</th>
//                   <th style={{ textAlign: "right", padding: "8px 4px", borderBottom: "1px solid #ddd" }}>오류 건수</th>
//                   <th style={{ textAlign: "center", padding: "8px 4px", borderBottom: "1px solid #ddd", width: 88 }}>상세</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {validityRuleModal.rules.map((r) => {
//                   const expanded = validityRuleExpandedId === r.ruleId;
//                   const entries = vrfcRuleHistDetailEntries(r.detail);
//                   const canExpand = hasVrfcRuleHistDetail(r.detail);
//                   return (
//                     <Fragment key={r.ruleId}>
//                       <tr>
//                         <td style={{ padding: "6px 4px" }}>{r.ruleId}</td>
//                         <td style={{ textAlign: "right", padding: "6px 4px" }}>{formatNumber(r.count)}</td>
//                         <td style={{ textAlign: "center", padding: "6px 4px", verticalAlign: "middle" }}>
//                           {canExpand ? (
//                             <button
//                               type="button"
//                               className="btn gray"
//                               style={{ padding: "4px 10px", fontSize: "12px", minWidth: 64 }}
//                               onClick={() => setValidityRuleExpandedId((prev) => (prev === r.ruleId ? null : r.ruleId))}
//                             >
//                               {expanded ? "접기" : "상세"}
//                             </button>
//                           ) : (
//                             <span style={{ fontSize: "12px", color: "#888" }}>—</span>
//                           )}
//                         </td>
//                       </tr>
//                       {expanded && canExpand ? (
//                         <tr>
//                           <td
//                             colSpan={3}
//                             style={{ padding: "0 4px 12px", background: "#fafafa", borderBottom: "1px solid #eee" }}
//                           >
//                             <dl
//                               style={{
//                                 margin: 8,
//                                 display: "grid",
//                                 gridTemplateColumns: "minmax(100px, 140px) 1fr",
//                                 gap: "6px 12px",
//                                 fontSize: "13px",
//                               }}
//                             >
//                               {entries.map((e) => (
//                                 <Fragment key={`${r.ruleId}-${e.label}`}>
//                                   <dt style={{ margin: 0, color: "#555", fontWeight: 600 }}>{e.label}</dt>
//                                   <dd style={{ margin: 0, wordBreak: "break-word" }}>{e.value}</dd>
//                                 </Fragment>
//                               ))}
//                             </dl>
//                           </td>
//                         </tr>
//                       ) : null}
//                     </Fragment>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </DialogContent>
//       </Dialog>

//       <UploadHistoryModal
//         open={historyModalOpen}
//         onClose={() => setHistoryModalOpen(false)}
//         pblntSn={currentPblntSn ?? null}
//         ptcpInstSn={currentPtcpInstSn}
//         instNm={myPartner?.instNm || localStorage.getItem("instNm") || undefined}
//         instContact={localStorage.getItem("instContact") || undefined}
//         instManager={localStorage.getItem("instManager") || undefined}
//       />
//     </>
//   );
// }
