import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, Divider, Tab, Tabs, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  ANALYSIS_RESULT_STATUS as AnalysisResultStatus,
  CONTENT_GAP,
  PROGRESS_STATUS as ProgressStatusType,
  RSLT_GROUP_STCD_TYPE as RsltGroupStcdType,
} from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import type { AnalysisDataResponse } from "@/interfaces/researchInterface";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { getResearchAnalysisStatusConfig } from "@/utils/common";
import { formatDateTime } from "@/utils/dateUtils";
import { resolveModal } from "@/utils/modalPromise";
import { analysisDataKeys } from "@/hooks/research/researchQueryKeys";
import { useAnalysisDataList, useCheckAllStatusCompleted, useResearchDetail } from "@/hooks/research/useResearchQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import Loader from "@/components/Loader";
import { SpaceBox } from "@/components/SpaceBox";
import BaseModal from "@/components/modal/BaseModal";
import Styles from "./AnalysisManagementModal.module.scss";
import MetaDataManagementDetail from "./MetaDataManagementDetail";
import MetaDataManagementVote from "./MetaDataManagementVote";
import MetaDataManagementWrite from "./MetaDataManagementWrite";

type ViewType = "none" | "write" | "detail";

/** 모달에 전달되는 데이터 타입 */
interface MetaDataManagementModalData {
  asmtMetaRsltSn?: number; // 초기 표시할 분석 데이터 일련번호
}

export default function MetaDataManagementModal() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.MetaDataManagement]);
  const confirmModal = useModal(ModalNames.CONFIRM);
  const { showAlert } = useGlobalAlert();

  /* ------------------------------
   * 스토어
   * ------------------------------ */
  const session = useSelector((state: RootState) => state.session);

  /* ------------------------------
   * 컴포넌트 참조
   * ------------------------------ */
  const gridRef = useRef<AgGridReact<AnalysisDataResponse>>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);

  /* ------------------------------
   * 상태 변수
   * ------------------------------ */
  const [firstFetch, setFirstFetch] = useState<boolean>(false);
  const [currentViewType, setCurrentViewType] = useState<ViewType>("none");
  const [currentAnalysisDatas, setCurrentAnalysisDatas] = useState<AnalysisDataResponse | null>(null);
  const [analysisDatas, setAnalysisDatas] = useState<AnalysisDataResponse[]>([]);
  const rsltGroupStcd = RsltGroupStcdType.ANALYSIS_META;
  const [analysisTabIndex, setAnalysisTabIndex] = useState(0);
  const [newlyCreatedAsmtMetaRsltSn, setNewlyCreatedAsmtMetaRsltSn] = useState<number | null>(null);

  /* ------------------------------
   * 연구과제 상세 조회
   * ------------------------------ */
  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;
  const { data: research } = useResearchDetail(asmtSnNumber);
  const { refetch: refetchAllStatusCompleted } = useCheckAllStatusCompleted(asmtSnNumber, false);

  /* ------------------------------
   * 모달 데이터
   * ------------------------------ */
  const modalData = modal?.data as MetaDataManagementModalData | undefined;

  /* ------------------------------
   * 분석 데이터 목록 조회
   * ------------------------------ */
  const {
    data: analysisDatasList,
    refetch,
    isLoading: isLoadingAnalysisList,
    isError: isErrorAnalysisList,
  } = useAnalysisDataList(research?.asmtSn ?? null, rsltGroupStcd, undefined, !!research?.asmtSn && !!modal?.open);

  /* ------------------------------
   * 모달이 열릴 때 상태 초기화
   * ------------------------------ */
  useEffect(() => {
    if (modal?.open) {
      setCurrentAnalysisDatas(null);
      setCurrentViewType("none");
    }
  }, [modal?.open]);

  /* ------------------------------
   * 분석 데이터 목록 설정
   * ------------------------------ */
  useEffect(() => {
    if (analysisDatasList) {
      const newAnalysisDatas = analysisDatasList;
      setAnalysisDatas([...newAnalysisDatas]); // 중요: 새 레퍼런스
      setFirstFetch(false);
    }
  }, [analysisDatasList, showAlert]);

  /* ------------------------------
   * 새로 등록된 데이터 선택
   * ------------------------------ */
  useEffect(() => {
    if (newlyCreatedAsmtMetaRsltSn && analysisDatas.length > 0) {
      const newData = analysisDatas.find((data) => data.asmtMetaRsltSn === newlyCreatedAsmtMetaRsltSn);

      if (newData) {
        setCurrentAnalysisDatas(newData);
        setCurrentViewType("detail");
        setNewlyCreatedAsmtMetaRsltSn(null); // 초기화

        // ag-grid에서 해당 데이터 행 선택
        setTimeout(() => {
          if (gridRef.current?.api) {
            gridRef.current.api.forEachNode((node) => {
              if (!node.rowPinned && node.data?.asmtMetaRsltSn === newlyCreatedAsmtMetaRsltSn) {
                node.setSelected(true);
                return;
              }
            });
          }
        }, 50);
      }
    }
  }, [analysisDatas, newlyCreatedAsmtMetaRsltSn]);

  /* ------------------------------
   * 분석 데이터 목록 첫 번째 항목 선택 및 detail 모드로 전환
   * ------------------------------ */
  useEffect(() => {
    if (firstFetch) return;
    if (newlyCreatedAsmtMetaRsltSn) return; // 새로 등록된 데이터가 있으면 이 로직 스킵

    if (analysisDatas.length > 0) {
      setFirstFetch(true);

      // 모달 데이터에 asmtMetaRsltSn이 있으면 해당 항목 찾기, 없으면 첫 번째 항목 선택
      let targetData: AnalysisDataResponse | null = null;

      if (modalData?.asmtMetaRsltSn) {
        targetData = analysisDatas.find((data) => data.asmtMetaRsltSn === modalData.asmtMetaRsltSn) || null;
      }

      // 찾지 못했거나 모달 데이터가 없으면 첫 번째 항목 사용
      if (!targetData) {
        targetData = analysisDatas[0];
      }

      setCurrentAnalysisDatas(targetData);
      setCurrentViewType("detail");

      // ag-grid에서 해당 데이터 행 선택
      setTimeout(() => {
        if (gridRef.current?.api && targetData?.asmtMetaRsltSn) {
          gridRef.current.api.forEachNode((node) => {
            if (!node.rowPinned && node.data?.asmtMetaRsltSn === targetData.asmtMetaRsltSn) {
              node.setSelected(true);
              return;
            }
          });
        }
      }, 50);
    } else {
      // 데이터가 없으면 write 모드로 전환
      if (research?.instId === session.instId) {
        setCurrentViewType("write");
      } else {
        setCurrentViewType("none");
      }
      setCurrentAnalysisDatas(null);
    }
  }, [analysisDatas]);

  /* ------------------------------
   * 분석 데이터 목록 ag-grid 강제 새로고침
   * ------------------------------ */
  useEffect(() => {
    gridRef.current?.api?.refreshCells({ force: true });
  }, [analysisDatas]);

  /* ------------------------------
   * currentViewType 변경 시 오른쪽 컨테이너 스크롤 상단으로 이동
   * ------------------------------ */
  useEffect(() => {
    if (rightContainerRef.current) {
      rightContainerRef.current.scrollTop = 0;
    }
  }, [currentAnalysisDatas]);

  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.MetaDataManagement, result);
    dispatch(closeModal(ModalNames.MetaDataManagement));
  };

  /* ------------------------------
   * 분석 데이터 행 클릭 시 상세 화면 표시
   * ------------------------------ */
  const handleClickAnalysis = (data: AnalysisDataResponse) => {
    setCurrentViewType("detail");
    setCurrentAnalysisDatas(data);
  };

  const handleEditAnalysis = () => {
    if (currentAnalysisDatas) {
      setCurrentViewType("write");
      // currentAnalysisDatas는 유지하여 수정할 데이터 정보 전달
    }
  };

  const handleCancelEdit = () => {
    if (currentAnalysisDatas) {
      setCurrentViewType("detail");
    }
  };

  const handleSaveSuccess = async ({ isEditMode, asmtMetaRsltSn }: { isEditMode: boolean; asmtMetaRsltSn?: number }) => {
    if (!isEditMode) {
      // 생성 모드: 새로 등록된 데이터의 asmtMetaRsltSn 저장 후 목록 새로고침
      if (asmtMetaRsltSn) {
        setNewlyCreatedAsmtMetaRsltSn(asmtMetaRsltSn);
      }
      await refetch();
      // analysisDatas가 업데이트되면 useEffect에서 자동으로 새로 등록된 데이터를 선택함
    } else {
      // 수정 모드에서 저장 성공 시 상세 화면으로 복귀
      if (currentAnalysisDatas) {
        setCurrentViewType("detail");
        // currentAnalysisDatas는 유지하여 같은 항목의 상세 화면 표시
        // Detail 컴포넌트의 useQuery가 자동으로 최신 데이터를 가져옴
      }
    }
  };

  const handleAnalysisTabIndexChange = (event: React.SyntheticEvent, newValue: number) => {
    setAnalysisTabIndex(newValue);
  };

  const handleVoteStatusUpdated = async () => {
    const { data: updatedList } = await refetch();

    if (updatedList && currentAnalysisDatas?.asmtMetaRsltSn) {
      const updatedCurrent = updatedList.find((item) => item.asmtMetaRsltSn === currentAnalysisDatas.asmtMetaRsltSn);
      if (updatedCurrent) {
        setCurrentAnalysisDatas(updatedCurrent);
      }
    }

    if (!asmtSnNumber) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: analysisDataKeys.latest(asmtSnNumber, RsltGroupStcdType.ANALYSIS_CDM),
    });
    await queryClient.refetchQueries({
      queryKey: analysisDataKeys.latest(asmtSnNumber, RsltGroupStcdType.ANALYSIS_CDM),
    });
  };

  const validateAllStatusCompleted = async () => {
    const { data: isAllCompleted } = await refetchAllStatusCompleted();
    if (!isAllCompleted) {
      await confirmModal.open({
        title: STRINGS.CONFIRM,
        message: "통합 데이터 / 기관 데이터 분석결과가 검토완료 상태이어야 합니다.",
        width: "xs",
        fullWidth: true,
        data: {
          hiddenCancelButton: true,
        },
      });
      return false;
    }
    return true;
  };

  /* ------------------------------
   * 테이블 컬럼 정의
   * ag-grid에서 사용할 컬럼 설정을 정의
   * 분석 데이터 이력과 상태를 표시하는 컬럼
   * ------------------------------ */
  const colDefs = useMemo<ColDef<AnalysisDataResponse>[]>(
    () => [
      {
        headerName: "분석 데이터 이력",
        field: "regDt",
        flex: 1,
        headerClass: "ag-left-aligned-header",
        cellRenderer: (params: ICellRendererParams<AnalysisDataResponse>) => {
          // pinned row인 경우 버튼 렌더링
          if (params.node.rowPinned === "top") {
            return (
              <Box className="w-full h-full flex justify-center items-center">
                <Button
                  variant="contained"
                  color="primary"
                  disabled={analysisDatas.some(
                    (d) =>
                      d.asmtMetaRsltSttsCd === AnalysisResultStatus.SUBMITTED ||
                      d.asmtMetaRsltSttsCd === AnalysisResultStatus.REQUEST_REVIEW ||
                      d.asmtMetaRsltSttsCd === AnalysisResultStatus.INPROGRESS_REVIEW
                  )}
                  onClick={async () => {
                    const hasReviewInProgress = analysisDatas.some(
                      (d) =>
                        d.asmtMetaRsltSttsCd === AnalysisResultStatus.SUBMITTED ||
                        d.asmtMetaRsltSttsCd === AnalysisResultStatus.REQUEST_REVIEW ||
                        d.asmtMetaRsltSttsCd === AnalysisResultStatus.INPROGRESS_REVIEW
                    );
                    if (hasReviewInProgress) {
                      showAlert({
                        message: '"결과제출, 검토요청, 검토진행" 중인 이력이 존재합니다, 검토 요청 마감 후 등록 가능합니다.',
                        severity: "warning",
                      });
                      return;
                    }
                    try {
                      const isAllCompleted = await validateAllStatusCompleted();
                      if (!isAllCompleted) {
                        return;
                      }
                    } catch (error) {
                      console.error("전체 상태 체크 실패:", error);
                      await confirmModal.open({
                        title: "오류",
                        message: "상태 확인 중 오류가 발생했습니다.",
                        data: {
                          hiddenCancelButton: true,
                        },
                      });
                      return;
                    }
                    setCurrentAnalysisDatas(null);
                    setCurrentViewType("write");
                  }}
                >
                  분석 데이터 등록
                </Button>
              </Box>
            );
          }

          // 통계 계산
          // let completed = 0;
          // let requestModify = 0;
          // let exclude = 0;
          // let notRegistered = 0;
          // if (params.data && params.data.opinionList) {
          //   completed = params.data?.opinionList.filter((item) => item.utlzAgreSeCd === AnalysisResultStatus.COMPLETED).length;
          //   requestModify = params.data?.opinionList.filter((item) => item.utlzAgreSeCd === AnalysisResultStatus.REQUEST_MODIFY).length;
          //   exclude = params.data?.opinionList.filter((item) => item.utlzAgreSeCd === AnalysisResultStatus.EXCLUDED).length;
          //   notRegistered = params.data?.opinionList.length - completed - requestModify - exclude;
          // }

          // let status = convertResearchAnalysisStatus(params.data?.asmtMetaRsltSttsCd);

          // if (status !== ProgressStatusType.REQUEST_REVIEW) {
          //   if (notRegistered === 0) {
          //     if (exclude > 0) {
          //       status = convertResearchAnalysisStatus(AnalysisResultStatus.EXCLUDED);
          //     } else if (requestModify > 0) {
          //       status = convertResearchAnalysisStatus(AnalysisResultStatus.REQUEST_MODIFY);
          //     } else {
          //       status = convertResearchAnalysisStatus(AnalysisResultStatus.COMPLETED);
          //     }
          //   }
          // }
          const statusConfig = getResearchAnalysisStatusConfig(params.data?.asmtMetaRsltSttsCd);

          return (
            <Stack direction="row" className="ag-cell-center-vertical" spacing={CONTENT_GAP.SMALL}>
              <Chip size="small" label={statusConfig?.label} sx={statusConfig?.chipStyle ?? {}} />
              <Typography variant="default">{formatDateTime(params.data?.regDt)}</Typography>
            </Stack>
          );
        },
      },
    ],
    [analysisDatas, showAlert]
  );

  /* ------------------------------
   * 고정된 상단 행 데이터
   * 테이블 상단에 고정되어 표시되는 "분석 데이터 등록" 버튼이 있는 행
   * ------------------------------ */
  const pinnedTopRowData = useMemo(() => [{ isButtonRow: true }], []);

  /* ------------------------------
   * 오류로 모달 종료
   * ------------------------------ */
  if (!modal?.open) return null;

  return (
    <BaseModal open={modal.open} onClose={() => handleClose(false)} title="연구결과(메타분석) 관리" width="lg">
      <Box>
        <Box>
          <Typography variant="subtitle">{research?.asmtNm || ""}</Typography>
        </Box>

        <SpaceBox gap={CONTENT_GAP.LARGE} />

        <Stack direction="row" className={Styles.analysis_container}>
          <Box className={`ag-theme-cdm ${Styles.analysis_container_left}`}>
            <div className="tbl_info">
              <div className="total">
                <p className="cases">
                  전체<span className="count">{analysisDatas.length}</span>건
                </p>
              </div>
            </div>
            {isLoadingAnalysisList && (
              <Box sx={{ position: "relative", minHeight: 240 }}>
                <Loader isLoading={true} />
              </Box>
            )}
            {!isLoadingAnalysisList && isErrorAnalysisList && (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography color="text.secondary">목록을 불러오지 못했습니다.</Typography>
              </Box>
            )}
            {!isLoadingAnalysisList && !isErrorAnalysisList && (
              <AgGridReact
                ref={gridRef}
                rowData={analysisDatas}
                pinnedTopRowData={
                  research?.instId === session.instId &&
                  research?.asmtPrgrsSttsCd !== ProgressStatusType.COMPLETED &&
                  analysisDatas.length > 0
                    ? pinnedTopRowData
                    : []
                }
                columnDefs={colDefs}
                rowHeight={42}
                rowSelection={{
                  mode: "singleRow",
                  checkboxes: false, // 왼쪽 체크박스 컬럼 제거
                  enableClickSelection: true, // 행 클릭으로 선택 가능
                }}
                overlayNoRowsTemplate={"<span>등록된 분석 데이터가 없습니다.</span>"}
                getRowId={(params) => {
                  return params.data?.asmtMetaRsltSn?.toString() || "";
                }}
                getRowHeight={(params) => {
                  // pinned row는 다른 높이 설정 (예: 60px, 필요에 따라 조절 가능)
                  if (params.node.rowPinned === "top") {
                    return 50;
                  }
                  return 40;
                }}
                getRowStyle={(params) => {
                  // pinned row는 스타일 적용 안함
                  if (params.node.rowPinned === "top") {
                    return { cursor: "default" };
                  }
                  // currentAnalysisDatas와 일치하는 경우 배경색 적용
                  if (params.data && params.data.asmtMetaRsltSn === currentAnalysisDatas?.asmtMetaRsltSn) {
                    return {
                      cursor: "pointer",
                      backgroundColor: "var(--ag-row-hover-color)",
                    } as any;
                  }
                  return { cursor: "pointer" } as any;
                }}
                onRowClicked={(event) => {
                  // pinned row는 클릭 이벤트 무시
                  if (event.node.rowPinned === "top") {
                    return;
                  }
                  if (event.data) {
                    handleClickAnalysis(event.data);
                  }
                }}
              />
            )}
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box ref={rightContainerRef} className={Styles.analysis_container_right}>
            {"none" === currentViewType && (
              <Box className="w-full h-full flex justify-center items-center">
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      m: "auto",
                      height: 120,
                      width: 120,
                      p: 7,
                      bgcolor: "grey.100",
                      borderRadius: "50%",
                    }}
                  >
                    <Box
                      component="i"
                      className="fa-solid fa-file-arrow-up"
                      sx={{ fontSize: "4.5rem", color: "grey.400", lineHeight: 1 }}
                    />
                  </Box>
                  <SpaceBox gap={CONTENT_GAP.LARGE} />
                  <Typography variant="h5">분석결과가 없습니다.</Typography>
                  <SpaceBox gap={CONTENT_GAP.XSMALL} />
                  <Typography variant="description">
                    {research?.instId !== session.instId
                      ? "메타분석 결과가 없습니다. 메타분석 결과가 등록되면 알림을 받으실 수 있습니다."
                      : "메타분석 결과를 작성하고 자료를 첨부해주세요."}
                  </Typography>
                </Box>
              </Box>
            )}
            {"write" === currentViewType && (
              <MetaDataManagementWrite
                asmtMetaRsltSn={currentAnalysisDatas ? currentAnalysisDatas.asmtMetaRsltSn : undefined}
                onConfirm={handleSaveSuccess}
                onCancel={currentAnalysisDatas ? handleCancelEdit : undefined}
              />
            )}
            {"detail" === currentViewType && currentAnalysisDatas && (
              <Box className="w-full">
                <Box className="tab_container">
                  <Tabs value={analysisTabIndex} onChange={handleAnalysisTabIndexChange}>
                    <Tab label="분석 데이터 상세" />
                    {research?.instId === session.instId && <Tab label="분석결과 검토" />}
                  </Tabs>
                </Box>
                <Box className="tab_content">
                  {analysisTabIndex === 0 && (
                    <MetaDataManagementDetail
                      asmtMetaRsltSn={currentAnalysisDatas.asmtMetaRsltSn}
                      onConfirm={() => {
                        refetch();
                      }}
                      onEdit={handleEditAnalysis}
                    />
                  )}
                  {analysisTabIndex === 1 && (
                    <MetaDataManagementVote
                      asmtMetaRsltSn={currentAnalysisDatas.asmtMetaRsltSn}
                      asmtMetaRsltSttsCd={currentAnalysisDatas.asmtMetaRsltSttsCd}
                      onStatusUpdated={handleVoteStatusUpdated}
                    />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Stack>
      </Box>
    </BaseModal>
  );
}
