import { useCallback, useEffect, useMemo } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import dayjs from "dayjs";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types";
import type { DisclosurePartnerResponse } from "@/interfaces/disclosureInterface.ts";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import type { PartnerResponse } from "@/interfaces/researchInterface.ts";
import { DisclosureAPI } from "@/api/disclosureApi";
import type { RootState } from "@/store";
import { formatDateFromYYYYMMDD } from "@/utils/dateUtils";
import { useCmRoutes, useIsAdminCmShell } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import FileContainer, { type FileData } from "@/components/FileContainer";
import { SpaceBox } from "@/components/SpaceBox";

export default function DisclosureDetailAdmin() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();
  const confirmModal = useModal(ModalNames.CONFIRM);
  const addPartnersModal = useModal(ModalNames.AddPartners);
  const commentForReasonModal = useModal(ModalNames.CommentForReason);
  const cancelReasonViewModal = useModal(ModalNames.CancelReasonView);

  const isAdminShell = useIsAdminCmShell();

  const session = useSelector((state: RootState) => state.session);

  // 공시번호 가져오기 (우선순위: URL 파라미터 > Redux 스토어 > localStorage)
  const pblntSnFromUrl = searchParams.get("pblntSn");
  const pblntSnFromStore = session.pblntSn;
  const pblntSnFromStorage = localStorage.getItem("pblntSn");

  const pblntSn = pblntSnFromUrl || (pblntSnFromStore ? pblntSnFromStore.toString() : null) || pblntSnFromStorage;
  const pblntSnNumber = pblntSn ? parseInt(pblntSn, 10) : null;

  // 공시번호 소스 로깅
  useEffect(() => {
    if (pblntSnNumber) {
      const source = pblntSnFromUrl ? "URL 파라미터" : pblntSnFromStore ? "Redux 스토어" : "localStorage";
    }
  }, [pblntSnNumber, pblntSnFromUrl, pblntSnFromStore]);

  // 상세 조회
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["disclosure", pblntSnNumber],
    queryFn: () => DisclosureAPI.getDisclosureById(pblntSnNumber!),
    enabled: !!pblntSnNumber,
  });

  const disclosure = response?.data?.data;

  // 파일 목록 조회
  const {
    data: filesResponse,
    isLoading: isLoadingFiles,
    isError: isErrorFiles,
    error: errorFiles,
  } = useQuery({
    queryKey: ["disclosure-files", pblntSnNumber],
    queryFn: () => DisclosureAPI.getFilesByPblntSn(pblntSnNumber!, null),
    enabled: !!pblntSnNumber,
  });

  // 참여기관 목록 조회
  const {
    data: partners = [],
    isLoading: isLoadingPartners,
    refetch: refetchPartners,
    error: partnersError,
  } = useQuery({
    queryKey: ["disclosure-partners", pblntSnNumber],
    queryFn: async () => {
      if (!pblntSnNumber) {
        return [];
      }

      try {
        const response = await DisclosureAPI.getPartnersByPblntSn(pblntSnNumber);

        // 응답 데이터가 배열인지 확인
        const partnersData = response.data?.data;
        if (Array.isArray(partnersData)) {
          return partnersData;
        } else {
          return [];
        }
      } catch (error: any) {
        // 에러가 발생해도 빈 배열을 반환하여 컴포넌트가 계속 작동하도록 함
        return [];
      }
    },
    enabled: !!pblntSnNumber,
    retry: false,
  });

  // 참여기관 조회 상태 로깅
  useEffect(() => {}, [pblntSnNumber, isLoadingPartners, partners, partnersError]);

  // 참여취소 핸들러 (거부사유 모달 표시)
  const handlePartnerCancel = useCallback(
    async (ptcpInstSn?: number | null) => {
      if (!pblntSnNumber) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      if (!ptcpInstSn) {
        showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
        return;
      }

      // 참여기관 정보 찾기
      const partner = partners.find((p) => p.ptcpInstSn === ptcpInstSn);
      if (!partner) {
        showAlert({ message: "참여기관 정보를 찾을 수 없습니다.", severity: "error" });
        return;
      }

      try {
        // 거부사유 모달 열기
        const result = await commentForReasonModal.open({
          title: "거부사유 등록",
          data: {
            partner: partner,
          },
        });

        // 모달에서 저장 버튼을 클릭한 경우 (result가 객체이고 reason이 있는 경우)
        if (result && typeof result === "object" && "reason" in result && result.reason) {
          const modalResult = result as { ptcpInstSn: number; processType: string; reason: string };

          // 처리구분이 참여취소(04)인 경우에만 API 호출
          if (modalResult.processType === "04") {
            // 코드모음: 04=참여취소

            await DisclosureAPI.requestPartnerStatus(pblntSnNumber, modalResult.ptcpInstSn, "04", modalResult.reason);
            showAlert({ message: "참여가 취소되었습니다.", severity: "success" });

            // 목록을 즉시 다시 조회
            await queryClient.refetchQueries({ queryKey: ["disclosure-partners", pblntSnNumber] });
          }
        }
      } catch (error: any) {
        // 모달이 취소된 경우는 에러로 처리하지 않음
        if (error?.response || error?.message) {
          const message = error?.response?.data?.message || error?.message || "참여취소 중 오류가 발생했습니다.";
          showAlert({ message, severity: "error" });
        }
      }
    },
    [pblntSnNumber, partners, queryClient, showAlert, commentForReasonModal]
  );

  // 취소사유 조회 핸들러
  const handleViewCancelReason = useCallback(
    async (ptcpInstSn?: number | null) => {
      if (!pblntSnNumber) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      if (!ptcpInstSn) {
        showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
        return;
      }

      // 참여기관 정보 찾기
      const partner = partners.find((p) => p.ptcpInstSn === ptcpInstSn);
      if (!partner) {
        showAlert({ message: "참여기관 정보를 찾을 수 없습니다.", severity: "error" });
        return;
      }

      try {
        // 취소사유 조회 모달 열기
        await cancelReasonViewModal.open({
          title: "취소사유 조회",
          data: {
            partner: partner,
            pblntSn: pblntSnNumber,
          },
        });
      } catch (error: any) {
        // 모달이 취소된 경우는 에러로 처리하지 않음
        if (error?.response || error?.message) {
          const message = error?.response?.data?.message || error?.message || "취소사유 조회 중 오류가 발생했습니다.";
          showAlert({ message, severity: "error" });
        }
      }
    },
    [pblntSnNumber, partners, showAlert, cancelReasonViewModal]
  );

  // 재등록요청 핸들러
  const handleReregisterRequest = useCallback(
    async (ptcpInstSn?: number | null) => {
      if (!pblntSnNumber) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      if (!ptcpInstSn) {
        showAlert({ message: "참여기관번호가 없습니다.", severity: "error" });
        return;
      }

      try {
        // 코드모음: 07=등록재요청

        await DisclosureAPI.requestPartnerStatus(pblntSnNumber, ptcpInstSn, "07");
        showAlert({ message: "재등록요청이 완료되었습니다.", severity: "success" });

        // 목록을 즉시 다시 조회
        await queryClient.refetchQueries({ queryKey: ["disclosure-partners", pblntSnNumber] });
      } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "재등록요청 중 오류가 발생했습니다.";
        showAlert({ message, severity: "error" });
      }
    },
    [pblntSnNumber, queryClient, showAlert]
  );

  // 참여기관 ag-grid 컬럼 정의
  const partnerColDefs: ColDef<DisclosurePartnerResponse>[] = useMemo(
    () => [
      {
        headerName: "번호",
        headerClass: "ag-header-center",
        valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
        width: 70,
        cellStyle: { textAlign: "center" },
      },
      {
        headerName: "기관명",
        field: "instNm",
        wrapText: true,
        autoHeight: true,
        // width: 100,
        flex: 2,
        headerClass: "ag-header-center",
        cellStyle: { textAlign: "center" },
      },
      {
        headerName: "진행상태",
        headerClass: "ag-header-center",
        field: "uldInstPrgrsSttsStcd",
        // width: 100,
        flex: 1,
        cellStyle: { textAlign: "center" },
        valueFormatter: (params) => {
          if (!params.value) return "-";
          const statusMap: Record<string, string> = {
            "01": "참여요청", // 코드모음: 01=참여요청
            "02": "진행중", // 코드모음: 02=진행중
            "03": "완료", // 코드모음: 03=완료
            "04": "참여취소", // 코드모음: 04=참여취소
            "05": "등록완료", // 코드모음: 05=등록
            "06": "참여재요청", // 코드모음: 06=참여재요청
            "07": "등록재요청", // 코드모음: 07=등록재요청
          };
          return statusMap[params.value] || params.value;
        },
      },
      {
        headerName: "요청일시",
        headerClass: "ag-header-center",
        field: "ptcpDmndDt",
        // width: 150,
        wrapText: true,
        flex: 1,
        cellStyle: { textAlign: "center" },
        valueFormatter: (params) => {
          if (!params.value) return "-";
          return dayjs(params.value).format("YYYY.MM.DD HH:mm");
        },
      },
      {
        headerName: "확정일시",
        headerClass: "ag-header-center",
        field: "ptcpCfmtnDt",
        // width: 150,
        flex: 1,
        cellStyle: { textAlign: "center" },
        valueFormatter: (params) => {
          if (!params.value) return "-";
          return dayjs(params.value).format("YYYY.MM.DD HH:mm");
        },
      },
      {
        headerName: "취소일자",
        headerClass: "ag-header-center",
        field: "ptcpRtrcnDt",
        // width: 150,
        flex: 1,
        cellStyle: { textAlign: "center" },
        valueFormatter: (params) => {
          if (!params.value) return "-";
          return dayjs(params.value).format("YYYY.MM.DD HH:mm");
        },
      },
      {
        headerName: "등록유형\n(등록일자)",
        headerClass: "ag-header-center",
        field: "uldTypeCd",
        wrapText: true,
        autoHeight: true,
        flex: 2,
        cellStyle: { textAlign: "center" },
        valueFormatter: (params) => {
          if (!params.data) return "-";

          const normalizeStts = (raw: string | null | undefined): string => {
            if (raw == null || String(raw).trim() === "") return "";
            const s = String(raw).trim();
            return s.length === 1 ? `0${s}` : s;
          };

          // 참여취소(04): 등록유형 대신 "참여취소 (취소일시)" — 취소일은 ptcpRtrcnDt
          const stts = normalizeStts(params.data.uldInstPrgrsSttsStcd);
          if (stts === "04") {
            const rawCancel = params.data.ptcpRtrcnDt;
            let cancelDate = "";
            if (rawCancel != null && rawCancel !== "") {
                if (Array.isArray(rawCancel)) {
                  const [y, m, d, h = 0, min = 0] = rawCancel;
                  cancelDate = dayjs(new Date(y, (m ?? 1) - 1, d ?? 1, h, min)).format("YYYY.MM.DD HH:mm");
                } else {
                  cancelDate = dayjs(rawCancel).format("YYYY.MM.DD HH:mm");
                }
            }
            if (cancelDate) return `참여취소 (${cancelDate})`;
            return "참여취소";
          }

          // 등록유형: uld_type_cd 01=CDM 데이터 업로드, 02=현황등록, 없으면 대기중
          const uldTypeMap: Record<string, string> = {
            "01": "CDM",
            "02": "현황정보",
          };
          const rawType =
            params.data.uldTypeCd != null && String(params.data.uldTypeCd).trim() !== ""
              ? String(params.data.uldTypeCd).trim()
              : "";
          const uploadType = rawType ? uldTypeMap[rawType] || rawType : "대기중";

          // 등록일자: TB_CM_M_ULD_PRST.reg_dt (CDM/현황 등록 시점)
          let regDate = "";
          const rawRegDt = params.data.regDt;
          if (rawRegDt != null) {
            try {
              if (Array.isArray(rawRegDt)) {
                const [y, m, d, h = 0, min = 0] = rawRegDt;
                regDate = dayjs(new Date(y, (m ?? 1) - 1, d ?? 1, h, min)).format("YYYY.MM.DD HH:mm");
              } else {
                regDate = dayjs(rawRegDt).format("YYYY.MM.DD HH:mm");
              }
            } catch (e) {}
          }

          if (uploadType && regDate) return `${uploadType} (${regDate})`;
          return uploadType || regDate || "-";
        },
      },
      {
        headerName: "완료일자",
        headerClass: "ag-header-center",
        field: "ptcpCmptnDt",
        // width: 150,
        flex: 1,
        cellStyle: { textAlign: "center" },
        valueFormatter: (params) => {
          if (!params.value) return "-";
          return dayjs(params.value).format("YYYY.MM.DD HH:mm");
        },
      },
      {
        headerName: "재요청일자",
        headerClass: "ag-header-center",
        field: "ptcpRdmndDt",
        flex: 1,
        cellStyle: { textAlign: "center" },
        valueFormatter: (params) => {
          if (!params.value) return "-";
          return dayjs(params.value).format("YYYY.MM.DD HH:mm");
        },
      },
      {
        headerName: "비고",
        headerClass: "ag-header-center",
        field: "ptcpRdmndDt",
        flex: 1,
        cellStyle: { textAlign: "center" },
        cellClass: "ag-cell-center-vertical",
        cellRenderer: (params: ICellRendererParams<DisclosurePartnerResponse>) => {
          // 현재 상태에 따라 버튼 표시
          // 상태 코드를 안전하게 문자열로 변환
          const statusValue = params.data?.uldInstPrgrsSttsStcd;
          const currentStatus = statusValue ? (typeof statusValue === "string" ? statusValue : String(statusValue)) : "";
          // 서버가 "4"처럼 1자리로 내려오는 경우를 대비해 코드모양(2자리)로 정규화
          const normalizedStatus = currentStatus.length === 1 ? `0${currentStatus}` : currentStatus;

          // 상태 코드별 버튼 표시 로직 (코드모음 참고)
          // "01": 참여요청 → "참여취소" 버튼 표시
          // "02": 진행중 → "참여취소" 버튼 표시
          // "03": 완료 → 완료 표시
          // "04": 참여취소 → 취소사유 조회 버튼
          // "05": 등록 → 등록 표시
          // 기타: 버튼 없음

          if (normalizedStatus === "01" || normalizedStatus === "02") {
            // 요청 또는 확정 상태: 참여취소 (공시 마감 시 버튼 미표시)
            const isClosed = params.context?.isDisclosureClosed;
            if (isClosed) {
              return (
                <div
                  className="ag-cell-center-vertical"
                  style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                />
              );
            }
            return (
              <div
                className="ag-cell-center-vertical"
                style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => {
                    if (params.context?.onPartnerCancel) {
                      params.context.onPartnerCancel(params.data?.ptcpInstSn);
                    }
                  }}
                >
                  참여취소
                </Button>
              </div>
            );
          } else if (normalizedStatus === "03") {
            // 현황등록(uld_type 02) 완료: CDM 업로드 재요청과 동일하게 07(등록재요청) 처리
            const rawUldType = params.data?.uldTypeCd != null ? String(params.data.uldTypeCd).trim() : "";
            const normalizedUldType = rawUldType.length === 1 ? `0${rawUldType}` : rawUldType;
            const isCurrentInfoComplete = normalizedUldType === "02";

            if (isCurrentInfoComplete) {
              const isClosed = params.context?.isDisclosureClosed;
              if (isClosed) {
                return (
                  <div
                    className="ag-cell-center-vertical"
                    style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  />
                );
              }
              return (
                <div
                  className="ag-cell-center-vertical"
                  style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    onClick={() => {
                      if (params.context?.onReregisterRequest) {
                        params.context.onReregisterRequest(params.data?.ptcpInstSn);
                      }
                    }}
                  >
                    현황재요청
                  </Button>
                </div>
              );
            }

            // 그 외 완료(03): 비활성화된 버튼으로 완료 표시
            return (
              <div
                className="ag-cell-center-vertical"
                style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Button variant="outlined" size="small" color="success" disabled>
                  완료
                </Button>
              </div>
            );
          } else if (normalizedStatus === "04") {
            // 참여취소 상태: 취소사유 버튼 표시 (조회용, 공시마감 시에도 활성화)
            return (
              <div
                className="ag-cell-center-vertical"
                style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => {
                    if (params.context?.onViewCancelReason) {
                      params.context.onViewCancelReason(params.data?.ptcpInstSn);
                    }
                  }}
                >
                  취소사유
                </Button>
              </div>
            );
          } else if (normalizedStatus === "05") {
            // 등록완료 상태: 재요청 (공시 마감 시 버튼 미표시)
            const isClosed = params.context?.isDisclosureClosed;
            if (isClosed) {
              return (
                <div
                  className="ag-cell-center-vertical"
                  style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                />
              );
            }
            return (
              <div
                className="ag-cell-center-vertical"
                style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  onClick={() => {
                    if (params.context?.onReregisterRequest) {
                      params.context.onReregisterRequest(params.data?.ptcpInstSn);
                    }
                  }}
                >
                  재요청
                </Button>
              </div>
            );
          } else if (normalizedStatus === "06") {
            // 등록재요청 상태: 재요청 완료 표시
            return (
              <div
                className="ag-cell-center-vertical"
                style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Button variant="outlined" size="small" color="primary" disabled>
                  참여재요청 완료
                </Button>
              </div>
            );
          } else if (normalizedStatus === "07") {
            // 등록재요청 상태: 재요청 완료 표시
            return (
              <div
                className="ag-cell-center-vertical"
                style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Button variant="outlined" size="small" color="primary" disabled>
                  재요청완료
                </Button>
              </div>
            );
          } else {
            // 기타 상태: 버튼 없음
            return "-";
          }
        },
      },
    ],
    []
  );

  // 참여기관 모달 열기 핸들러
  const handleOpenPartnerModal = async () => {
    try {
      // 현재 참여기관 목록을 PartnerResponse 형식으로 변환
      const currentPartners: PartnerResponse[] = partners.map((p) => ({
        instId: p.instId,
        instNm: p.instNm,
        brno: p.instId || "", // brno가 필수이므로 instId를 사용
      }));

      const result = (await addPartnersModal.open({
        title: "참여기관 추가",
        data: { partners: currentPartners, pblntSn: pblntSnNumber ?? undefined },
      })) as PartnerResponse[];

      // 모달이 취소되었거나 결과가 없는 경우
      if (!result || !Array.isArray(result)) {
        return;
      }

      // 모달에서 선택한 모든 기관의 instId 목록 (TRIM 처리, instId 또는 brno 사용)
      const selectedInstIds = result
        .map((p) => {
          // instId가 있으면 instId 사용, 없으면 brno 사용
          const id = (p.instId || p.brno || "").trim();
          return id;
        })
        .filter((id) => id !== "");

      // 선택한 기관이 있는 경우에만 API 호출 (빈 배열도 허용 - 모든 기관 삭제)
      try {
        await DisclosureAPI.addPartners(pblntSnNumber!, { instIds: selectedInstIds });
        showAlert({ message: "참여기관이 성공적으로 동기화되었습니다.", severity: "success" });
        // 참여기관 목록 다시 조회
        await refetchPartners();
        queryClient.invalidateQueries({ queryKey: ["disclosure-partners", pblntSnNumber] });
      } catch (error: unknown) {
        console.error("[DisclosureDetailAdmin] 참여기관 동기화 실패", error);
        showAlert({ message: "참여기관 동기화 중 오류가 발생했습니다.", severity: "error" });
      }
    } catch (error: unknown) {
      if (error != null) {
        console.error("[DisclosureDetailAdmin] 참여기관 추가 모달 실패", error);
      }
    }
  };

  // 파일 크기 포맷팅 함수
  const formatFileSize = (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined || bytes === 0) return "-";
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  };

  // 파일 확장자 추출 함수
  const getFileExtension = (fileName: string): string => {
    if (!fileName) return "";
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot === -1) return "";
    return fileName.substring(lastDot + 1).toUpperCase();
  };

  // 코드 → 한글 매핑 (코드모음 그룹ID 0013: 파일구분코드, 0014: 업로드업무구분코드)
  const FILE_SE_CD_MAP: Record<string, string> = {
    "01": "IRB",
    "02": "통합분석결과",
    "03": "기관분석결과",
    "04": "연구결과",
    "05": "질의문",
    "06": "공시등록",
    "07": "DRB",
    "08": "CDM",
  };
  const ULD_TASK_SE_CD_MAP: Record<string, string> = {
    "01": "과제",
    "02": "과제결과",
    "03": "과제기관",
    "04": "공시",
    "05": "공시기관",
  };

  // 참여기관 ptcpInstSn → 기관명 매핑
  const instSnToNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(partners)) {
      partners.forEach((p: any) => {
        if (p.ptcpInstSn != null) {
          map[String(p.ptcpInstSn)] = p.instNm || `기관${p.ptcpInstSn}`;
        }
      });
    }
    return map;
  }, [partners]);

  /** 마감된 공시에서만 참여기관 추가 불가 — 등록·진행중 모두 추가 가능 */
  const isPartnerAddDisabled = useMemo(() => {
    const statusCode = disclosure?.pblntStcd != null ? String(disclosure.pblntStcd) : null;
    if (!statusCode) return true;
    return DisclosureAPI.convertStatus(statusCode) === "마감";
  }, [disclosure?.pblntStcd]);

  /** 공시 마감(03) — 기관목록 비고의 참여취소·재요청 등 조작 버튼 비활성화 (API가 숫자 3 등으로도 올 수 있어 convertStatus로 판별) */
  const isDisclosureClosed = useMemo(() => {
    const statusCode = disclosure?.pblntStcd != null ? String(disclosure.pblntStcd).trim() : "";
    if (!statusCode) return false;
    return DisclosureAPI.convertStatus(statusCode) === "마감";
  }, [disclosure?.pblntStcd]);

  // 파일 목록 데이터 변환 (파일명, 링크, 용량만 표시)
  const files: FileData[] = (() => {
    if (!filesResponse?.data?.data || !Array.isArray(filesResponse.data.data)) {
      return [];
    }

    const fileList = filesResponse.data.data;

    const mappedFiles = fileList
      .map((file: any) => {
        // 삭제된 파일 제외
        const delYn = file.delYn;
        if (delYn === "Y" || delYn === "y") return null;

        // CDM(08), DRB(07) 업로드 파일 제외 → 공시등록 첨부파일만 표시
        const fileSeCdRaw = file.fileSeCd || "";
        if (fileSeCdRaw === "07" || fileSeCdRaw === "08") return null;

        const strgFileNm =
          (file.strgFileNm && String(file.strgFileNm).trim()) || (file.strgfilenm && String(file.strgfilenm).trim()) || "";
        const atchFileSn =
          (file.atchFileSn && String(file.atchFileSn).trim()) || (file.atchfilesn && String(file.atchfilesn).trim()) || "";
        const atchFileId =
          (file.atchFileId && String(file.atchFileId).trim()) || (file.atchfileid && String(file.atchfileid).trim()) || "";
        // CA 업로드는 file_cn(atchFileSn)이 비어 있음 → file_nm(strgFileNm)으로 표시명 사용
        const originalName = atchFileSn !== "" ? atchFileSn : strgFileNm;
        // 다운로드는 UUID(atchFileId) 우선. 없으면 레거시 파일명(저장/원본)로 fallback.
        const downloadParam = atchFileId !== "" ? atchFileId : strgFileNm !== "" ? strgFileNm : originalName;

        if (!originalName || String(originalName).trim() === "") {
          return null;
        }

        const ext = getFileExtension(originalName);
        const fileSeCd = file.fileSeCd || "";
        const fileSize = file.fileSz || null;

        const fileData = {
          name: originalName,
          ext: ext || fileSeCd,
          size: formatFileSize(fileSize),
          showDeleteButton: false,
          atchFileSn: downloadParam,
          downloadAs: originalName,
        } as FileData & { atchFileSn: string };

        return fileData;
      })
      .filter((file: FileData | null) => file !== null) as FileData[];

    return mappedFiles;
  })();

  // 파일 다운로드 핸들러
  const handleFileDownload = async (file: FileData) => {
    try {
      // 다운로드 시 저장된 파일명(atchFileSn) 사용
      const fileWithSn = file as FileData & { atchFileSn?: string };
      const downloadFileName = fileWithSn.atchFileSn || file.name;

      if (!downloadFileName || downloadFileName.trim() === "" || downloadFileName === "파일") {
        showAlert({ message: "파일명을 찾을 수 없습니다.", severity: "error" });
        return;
      }

      const response = await DisclosureAPI.downloadFile(downloadFileName);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // 다운로드 파일명은 원본 파일명 사용 (표시된 파일명)
      const originalName = (file as FileData & { downloadAs?: string }).downloadAs || file.name;
      link.download = originalName || downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showAlert({ message: "파일 다운로드가 시작되었습니다.", severity: "success" });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "파일 다운로드 중 오류가 발생했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    }
  };

  // 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => DisclosureAPI.deleteDisclosure(id),
    onSuccess: () => {
      showAlert({ message: "공시가 성공적으로 삭제되었습니다.", severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["disclosures"] });
      navigate(routes.CDM.DISCLOSURES);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "공시 삭제 중 오류가 발생했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    },
  });

  const handleButtonClick = async (text: string) => {
    if (text === "수집현황상세") {
      navigate(routes.CDM.UPLOAD_SUMMARY);
      return;
    }
    if (text === "목록") {
      navigate(routes.CDM.DISCLOSURES);
      return;
    }

    if (text === "공시수정") {
      if (pblntSnNumber) {
        navigate(`${routes.CDM.DISCLOSURE_EDIT}?pblntSn=${pblntSnNumber}`);
      }
      return;
    }

    if (text === "공시삭제") {
      if (!pblntSnNumber) return;

      const result = await confirmModal.open({
        title: "삭제 확인",
        message: "정말 삭제하시겠습니까?",
        width: "max-w-[30rem]",
      });

      if (result) {
        deleteMutation.mutate(pblntSnNumber);
      }
      return;
    }

    if (text === "마감") {
      if (!pblntSnNumber) return;

      const statusCode = disclosure?.pblntStcd != null ? String(disclosure.pblntStcd) : null;
      if (DisclosureAPI.convertStatus(statusCode) === "마감") {
        showAlert({ message: "이미 마감 상태입니다.", severity: "warning" });
        return;
      }

      const result = await confirmModal.open({
        title: "마감 확인",
        message: "미등록 참여기관은 자동으로 참여취소 처리되며, 공시는 마감됩니다. 진행하시겠습니까?",
        width: "max-w-[30rem]",
      });

      if (!result) return;

      try {
        await DisclosureAPI.closeDisclosure(pblntSnNumber);
        showAlert({ message: "공시가 마감되었습니다.", severity: "success" });
        // 마감 직후 상세/파트너를 기다려 pblntStcd·비고 버튼 상태가 즉시 반영되게 함 (invalidate만 하면 그리드가 context 갱신을 안 할 수 있음)
        await queryClient.refetchQueries({ queryKey: ["disclosure", pblntSnNumber] });
        await queryClient.refetchQueries({ queryKey: ["disclosure-partners", pblntSnNumber] });
        queryClient.invalidateQueries({ queryKey: ["disclosure-files", pblntSnNumber] });
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "공시마감 중 오류가 발생했습니다.";
        showAlert({ message: errorMessage, severity: "error" });
      }
      return;
    }

    if (text === "참여기관 추가") {
      const statusCode = disclosure?.pblntStcd != null ? String(disclosure.pblntStcd) : null;
      if (!statusCode || DisclosureAPI.convertStatus(statusCode) === "마감") {
        showAlert({
          message: "마감된 공시에서는 참여기관을 추가할 수 없습니다.",
          severity: "warning",
        });
        return;
      }
      handleOpenPartnerModal();
      return;
    }

    if (text === "공시시작") {
      const statusCode = disclosure?.pblntStcd != null ? String(disclosure.pblntStcd) : null;
      const statusText = DisclosureAPI.convertStatus(statusCode);
      const isInProgress = statusText === "진행중";
      const isClosed = statusText === "마감";
      if (isInProgress) {
        showAlert({ message: "공시는 이미 진행중 상태입니다.", severity: "warning" });
        return;
      }
      if (isClosed) {
        showAlert({ message: "공시가 마감 상태이므로 공시시작을 수행할 수 없습니다.", severity: "warning" });
        return;
      }
      if (!disclosure) {
        showAlert({ message: "공시 정보를 불러오지 못했습니다.", severity: "error" });
        return;
      }
      const today = dayjs().format("YYYYMMDD");
      const startYmd = disclosure.pblntBgngYmd;
      if (!startYmd || startYmd > today) {
        showAlert({ message: "공시시작일자가 아직 도래하지 않아 공시를 시작할 수 없습니다.", severity: "warning" });
        return;
      }
      if (!pblntSnNumber) {
        showAlert({ message: "공시일련번호가 없습니다.", severity: "error" });
        return;
      }
      try {
        await DisclosureAPI.updateDisclosureStatus(pblntSnNumber, "02");
        showAlert({ message: "공시가 진행중 상태로 변경되었습니다.", severity: "success" });
        // 상세 재조회
        queryClient.invalidateQueries({ queryKey: ["disclosure", pblntSnNumber] });
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "공시 상태 변경 중 오류가 발생했습니다.";
        showAlert({ message: errorMessage, severity: "error" });
      }
    }
  };

  // 상태 코드를 텍스트로 변환
  const getStatusText = (statusCode: string | null | undefined): string => {
    if (!statusCode) return "알수없음";
    return DisclosureAPI.convertStatus(statusCode.trim());
  };

  // 상태 코드에 따른 Chip 색상
  const getStatusChipColor = (statusCode: string | null | undefined): "default" | "primary" | "success" | "error" | "warning" => {
    const status = getStatusText(statusCode);
    if (status === "마감") return "error";
    if (status === "진행중") return "primary";
    return "default";
  };

  useEffect(() => {
    document.title = "공시정보 - CDM 데이터 업로드 등록 안내";
  }, []);

  if (!pblntSnNumber) {
    return (
      <div className="p-10 text-center text-gray-500">
        <div>공시일련번호가 없습니다.</div>
        <div className="mt-4 text-sm">공시목록에서 공시를 선택하거나, URL에 ?pblntSn=번호 형식으로 공시번호를 추가해주세요.</div>
        <div className="mt-4">
          <Button variant="outlined" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
            목록으로 이동
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ mt: 2 }} />
      </div>
    );
  }

  if (isError || !disclosure) {
    return (
      <div className="p-10 text-center text-red-500">
        {error instanceof Error ? error.message : "공시 정보를 불러올 수 없습니다."}
        <div className="mt-4">
          <Button variant="outlined" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <Helmet>
        <title>CDM - CDM 업로드 공시</title>
      </Helmet>
      {/* ==============================
          헤더
      ============================== */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Stack direction="column" spacing={1}>
          <Typography variant="h2">{disclosure.ttlNm || "-"}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button variant="outlined" size="small" onClick={() => navigate(routes.CDM.DISCLOSURES)} sx={{ minWidth: "80px" }}>
            목록
          </Button>
        </Stack>
      </Box>
      <SpaceBox gap={CONTENT_GAP.LARGE} />

      {/* ==============================
          공시 내용
      ============================== */}

      <section id="content-desc">
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            공시내용
          </Typography>
        </Box>

        <div className="form_container">
          {/* 공시 내용 1 */}
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">구분</Typography>
              </Box>
              <Box className="form_container-row-content">
                {DisclosureAPI.convertType(disclosure.pblntDvcd ?? disclosure.pblntSeCd) || "-"}
              </Box>
            </Box>
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">공시 기간</Typography>
              </Box>
              <Box className="form_container-row-content">
                {disclosure.pblntBgngYmd && disclosure.pblntEndYmd
                  ? `${formatDateFromYYYYMMDD(disclosure.pblntBgngYmd)} ~ ${formatDateFromYYYYMMDD(disclosure.pblntEndYmd)}`
                  : "-"}
              </Box>
            </Box>
          </Stack>

          {/* 공시 내용 2 */}
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">진행상태</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Chip label={getStatusText(disclosure.pblntStcd)} size="small" color={getStatusChipColor(disclosure.pblntStcd)} />
              </Box>
            </Box>
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">작성자</Typography>
              </Box>
              <Box className="form_container-row-content">
                {disclosure.rgtrNm != null && String(disclosure.rgtrNm).trim() !== "" ? String(disclosure.rgtrNm).trim() : "-"}
              </Box>
            </Box>
          </Stack>

          {/* 공시 내용 3: 등록일시 */}
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">등록일시</Typography>
              </Box>
              <Box className="form_container-row-content">
                {disclosure.regYmd ? dayjs(disclosure.regYmd).format("YYYY.MM.DD HH:mm") : "-"}
              </Box>
            </Box>
          </Stack>

          {/* 공시 내용 4 */}
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">내용</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Box
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: disclosure.pblntCn?.replace(/\n/g, "<br/>") || "-",
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </div>
      </section>

      <SpaceBox gap={CONTENT_GAP.LARGE} />

      {/* 첨부파일 섹션 */}
      <section id="content-desc">
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            첨부파일
          </Typography>
        </Box>

        <div className="form_container">
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">파일 목록</Typography>
              </Box>
              <Box className="form_container-row-content">
                {isLoadingFiles ? (
                  <Typography variant="body2" color="text.secondary">
                    파일 목록을 불러오는 중...
                  </Typography>
                ) : isErrorFiles ? (
                  <Typography variant="body2" color="error">
                    파일 목록을 불러오는 중 오류가 발생했습니다:{" "}
                    {errorFiles instanceof Error ? errorFiles.message : "알 수 없는 오류"}
                  </Typography>
                ) : files.length > 0 ? (
                  <Box>
                    <FileContainer files={files} showDeleteButton={false} onClick={handleFileDownload} />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    등록된 파일이 없습니다.
                  </Typography>
                )}
              </Box>
            </Box>
          </Stack>
        </div>

        <SpaceBox gap={CONTENT_GAP.SMALL} />

        {/* 버튼 영역 - 관리자만 표시 */}
        {isAdminShell && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleButtonClick("공시삭제")}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "삭제 중..." : "공시삭제"}
            </Button>
            <Button
              variant="outlined"
              disabled={disclosure?.pblntStcd === "03" || disclosure?.pblntStcd === "3"}
              onClick={() => handleButtonClick("공시수정")}
            >
              공시수정
            </Button>
            <Button
              variant="outlined"
              disabled={(() => {
                const statusCode = disclosure?.pblntStcd != null ? String(disclosure.pblntStcd) : null;
                return DisclosureAPI.convertStatus(statusCode) === "마감";
              })()}
              onClick={() => handleButtonClick("마감")}
              color="error"
            >
              마감
            </Button>
          </div>
        )}
      </section>

      <SpaceBox gap={CONTENT_GAP.SMALL} />

      {/* ==============================
          참여기관
      ============================== */}
      <section id="content-desc">
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            참여기관
          </Typography>
        </Box>
        {/* 참여기관 추가 버튼 - 관리자만 표시 (마감 시에만 비활성화) */}
        {isAdminShell && (
          <div className="flex justify-end mb-2">
            <Button
              variant="contained"
              size="small"
              disabled={isPartnerAddDisabled}
              onClick={() => handleButtonClick("참여기관 추가")}
            >
              참여기관 추가
            </Button>
          </div>
        )}
        <div className="form_container">
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-content" sx={{ justifyContent: "center", py: 3 }}>
                {isLoadingPartners ? (
                  <Typography variant="body2" color="text.secondary">
                    참여기관 목록을 불러오는 중...
                  </Typography>
                ) : partnersError ? (
                  <Typography variant="body2" color="error">
                    참여기관 목록을 불러오는 중 오류가 발생했습니다:{" "}
                    {partnersError instanceof Error ? partnersError.message : "알 수 없는 오류"}
                  </Typography>
                ) : partners.length > 0 ? (
                  <div className="ag-theme-alpine" style={{ width: "100%" }}>
                    <AgGridReact
                      key={`partners-grid-${pblntSnNumber}-${String(disclosure?.pblntStcd ?? "")}-${isDisclosureClosed ? "c" : "o"}`}
                      rowData={partners}
                      columnDefs={partnerColDefs}
                      context={{
                        onPartnerCancel: handlePartnerCancel,
                        onViewCancelReason: handleViewCancelReason,
                        onReregisterRequest: handleReregisterRequest,
                        pblntDvcd: disclosure?.pblntDvcd ?? null,
                        isDisclosureClosed,
                      }}
                      domLayout="autoHeight"
                      headerHeight={42}
                      rowHeight={42}
                      getRowId={(params) => `${params.data.ptcpInstSn}-${params.data.pblntSn}`}
                    />
                  </div>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    등록된 참여기관이 없습니다.
                  </Typography>
                )}
              </Box>
            </Box>
          </Stack>
        </div>
      </section>
      <SpaceBox gap={CONTENT_GAP.SMALL} />

      <div className="flex justify-end gap-2">
        <Button variant="outlined" onClick={() => handleButtonClick("수집현황상세")}>
          수집현황상세
        </Button>
        <Button
          variant="contained"
          onClick={() => handleButtonClick("공시시작")}
          disabled={(() => {
            const statusCode = disclosure?.pblntStcd != null ? String(disclosure.pblntStcd) : null;
            const statusText = DisclosureAPI.convertStatus(statusCode);
            // 진행중(02)이거나 마감(03)이면 공시시작은 비활성화
            return statusText === "진행중" || statusText === "마감";
          })()}
        >
          공시시작
        </Button>
      </div>

      <SpaceBox gap={CONTENT_GAP.XSMALL} />

      <div className="text-gray-500 text-sm">※ 공지 및 참여기관 정보는 관리자 권한에서 편집 가능합니다.</div>
    </div>
  );
}
