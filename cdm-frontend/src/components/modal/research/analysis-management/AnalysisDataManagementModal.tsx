import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, Divider, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import {
  AllCommunityModule,
  type ColDef,
  type FirstDataRenderedEvent,
  type GridApi,
  type ICellRendererParams,
  ModuleRegistry,
  type RowDataUpdatedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  AnalysisResultStatus,
  CONTENT_GAP,
  type PROGRESS_STATUS_TYPE,
  ProgressStatusType,
  RsltGroupStcdType,
} from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import type { AnalysisDataResponse } from "@/interfaces/researchInterface";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { getResearchAnalysisStatusConfig, isResearchCrudDisabled } from "@/utils/common";
import { formatDate } from "@/utils/dateUtils";
import { resolveModal } from "@/utils/modalPromise";
import { useAnalysisDataList, useResearchDetail } from "@/hooks/research/useResearchQueries";
import { SpaceBox } from "@/components/SpaceBox";
import BaseModal from "@/components/modal/BaseModal";
import AnalysisDataManagementDetail from "./AnalysisDataManagementDetail";
import AnalysisDataManagementWrite from "./AnalysisDataManagementWrite";
import Styles from "./AnalysisManagementModal.module.css";

ModuleRegistry.registerModules([AllCommunityModule]);

type ViewType = "none" | "write" | "detail";

export default function AnalysisDataManagementModal() {
  const dispatch = useDispatch();

  /* ------------------------------
   * 스토어
   * ------------------------------ */
  const session = useSelector((state: RootState) => state.session);
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.AnalysisDataManagement]);

  const [firstFetch, setFirstFetch] = useState<boolean>(false);
  const [currentViewType, setCurrentViewType] = useState<ViewType>("none");
  const [currentAnalysisDatas, setCurrentAnalysisDatas] = useState<AnalysisDataResponse | null>(null);
  const gridRef = useRef<AgGridReact<AnalysisDataResponse>>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const [analysisDatas, setAnalysisDatas] = useState<AnalysisDataResponse[]>([]);

  const selectGridRow = (asmtMetaRsltSn?: number) => {
    if (!gridRef.current?.api || !asmtMetaRsltSn) return;

    const rowNode = gridRef.current.api.getRowNode(asmtMetaRsltSn.toString());
    rowNode?.setSelected(true);
  };

  const syncGridSelection = (api: GridApi<AnalysisDataResponse>) => {
    if (!analysisDatas.length) return;

    const targetAsmtMetaRsltSn = currentAnalysisDatas?.asmtMetaRsltSn ?? analysisDatas[0]?.asmtMetaRsltSn;
    if (!targetAsmtMetaRsltSn) return;

    api.ensureIndexVisible(0);
    selectGridRow(targetAsmtMetaRsltSn);
  };

  /* ------------------------------
   * 연구과제 상세 조회
   * ------------------------------ */
  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;
  const { data: research } = useResearchDetail(asmtSnNumber);
  const isCrudDisabled = isResearchCrudDisabled(research?.asmtPrgrsSttsCd);
  const isResearchStatusRequestInvite = research?.asmtPrgrsSttsCd === ProgressStatusType.REQUEST_INVITE;
  const isWriteAllowed = research?.instId === session.instId && isResearchStatusRequestInvite;

  /* ------------------------------
   * 분석 DATASET 목록 조회
   * ------------------------------ */
  const { data: analysisDatasList, refetch } = useAnalysisDataList(
    research?.asmtSn ?? null,
    RsltGroupStcdType.ANALYSIS_DATA,
    undefined,
    !!research?.asmtSn && !!modal?.open
  );

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
   * 분석 DATASET 목록 설정
   * ------------------------------ */
  useEffect(() => {
    if (analysisDatasList) {
      const newAnalysisDatas = analysisDatasList;
      setAnalysisDatas([...newAnalysisDatas]); // 중요: 새 레퍼런스
      setFirstFetch(false);
    }
  }, [analysisDatasList]);

  /* ------------------------------
   * 분석 DATASET 목록 첫 번째 항목 선택 및 detail 모드로 전환
   * ------------------------------ */
  useEffect(() => {
    if (firstFetch) return;

    if (analysisDatas.length > 0) {
      setFirstFetch(true);
      // 첫 번째 항목 선택 및 detail 모드로 전환
      const firstData = analysisDatas[0];
      setCurrentAnalysisDatas(firstData);
      setCurrentViewType("detail");
    } else {
      // 데이터가 없으면 write 모드로 전환
      if (isWriteAllowed) {
        setCurrentViewType("write");
      } else {
        setCurrentViewType("none");
      }

      setCurrentAnalysisDatas(null);
    }
  }, [analysisDatas]);

  /* ------------------------------
   * 분석 DATASET 목록 ag-grid 강제 새로고침
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
  }, [currentViewType]);

  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.AnalysisDataManagement, result);
    dispatch(closeModal(ModalNames.AnalysisDataManagement));
  };

  /* ------------------------------
   * 분석 DATASET 행 클릭 시 상세 화면 표시
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

  const handleSaveSuccess = async ({ isEditMode }: { isEditMode: boolean }) => {
    if (isEditMode) {
      // 수정 모드에서 저장 성공 시 상세 화면으로 복귀
      if (currentAnalysisDatas) {
        setCurrentViewType("detail");
      }
    } else {
      // 생성 모드에서 저장 성공 시 목록 새로고침 후 첫 번째 항목 선택
      await refetch();
      setFirstFetch(false);
    }
  };

  const colDefs = useMemo<ColDef<AnalysisDataResponse>[]>(
    () => [
      {
        headerName: "분석 DATASET 이력",
        field: "regDt",
        flex: 1,
        headerClass: "ag-left-aligned-header",
        cellRenderer: (params: ICellRendererParams<AnalysisDataResponse>) => {
          // pinned row인 경우 버튼 렌더링
          if (params.node.rowPinned === "top") {
            if (isCrudDisabled) {
              return null;
            }
            return (
              <Box className="w-full h-full flex justify-center items-center">
                <Button
                  variant="contained"
                  color="primary"
                  // 활성화 조건:
                  // - 연구과제 상태가 '참여요청'이고(REQUEST_INVITE), 마감/취소가 아니며, 본인 기관일 때만 가능
                  // - 목록이 비었으면 활성
                  // - 목록에 '검토완료'(COMPLETED) 또는 '보완요청'(REQUEST_MODIFY)이 있으면 활성
                  // - 그 외 케이스는 비활성
                  disabled={
                    !isWriteAllowed ||
                    !(
                      analysisDatas.length === 0 ||
                      analysisDatas.some(
                        (d) =>
                          d.asmtMetaRsltSttsCd === AnalysisResultStatus.COMPLETED ||
                          d.asmtMetaRsltSttsCd === AnalysisResultStatus.REQUEST_MODIFY
                      )
                    )
                  }
                  onClick={() => {
                    setCurrentAnalysisDatas(null);
                    setCurrentViewType("write");
                  }}
                >
                  DATASET 등록
                </Button>
              </Box>
            );
          }

          let status: PROGRESS_STATUS_TYPE = params.data?.asmtMetaRsltSttsCd as PROGRESS_STATUS_TYPE;
          if (params.data?.asmtMetaRsltSttsCd === AnalysisResultStatus.COMPLETED) {
            if (params.data?.opinionList && params.data?.opinionList.length > 0) {
              // 의견 개수가 있다면 마지막 의견 상태를 이용해서 상태 표시 처리
              const lastOpinion = params.data?.opinionList[params.data?.opinionList.length - 1];
              status = lastOpinion?.utlzAgreSeCd as PROGRESS_STATUS_TYPE;
            }
          }

          const statusConfig = getResearchAnalysisStatusConfig(status);

          return (
            <Stack direction="row" className="ag-cell-center-vertical" spacing={CONTENT_GAP.SMALL}>
              <Chip size="small" label={statusConfig?.label} sx={statusConfig?.chipStyle ?? {}} />
              <Typography variant="default">{formatDate(params.data?.regDt)}</Typography>
            </Stack>
          );
        },
      },
    ],
    [analysisDatas, isCrudDisabled, isWriteAllowed]
  );

  /**
   * 고정된 상단 행 데이터
   * 테이블 상단에 고정되어 표시되는 "DATASET 등록" 버튼이 있는 행 (CRUD 불가 시 비움)
   */
  const pinnedTopRowData = useMemo(() => (isCrudDisabled ? [] : [{ isButtonRow: true }]), [isCrudDisabled]);

  /* ------------------------------
   * 오류로 모달 종료
   * ------------------------------ */
  if (!modal?.open) return null;

  return (
    <BaseModal open={modal.open} onClose={() => handleClose(false)} title="분석 DATASET 관리" width="lg">
      <Box>
        <Box>
          <Typography variant="subtitle">{research?.asmtNm || ""}</Typography>
        </Box>

        <SpaceBox gap={CONTENT_GAP.LARGE} />

        <Box className={Styles.analysis_container}>
          <Box className={`ag-theme-cdm ${Styles.analysis_container_left}`}>
            <div className="tbl_info">
              <div className="total">
                <p className="cases">
                  전체<span className="count">{analysisDatas.length}</span>건
                </p>
              </div>
            </div>
            <AgGridReact
              ref={gridRef}
              rowData={analysisDatas}
              pinnedTopRowData={pinnedTopRowData}
              columnDefs={colDefs}
              rowHeight={42}
              rowSelection={{
                mode: "singleRow",
                checkboxes: false, // 왼쪽 체크박스 컬럼 제거
                enableClickSelection: true, // 행 클릭으로 선택 가능
              }}
              overlayNoRowsTemplate={"<span>등록된 분석 DATASET이 없습니다.</span>"}
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
              onFirstDataRendered={(event: FirstDataRenderedEvent<AnalysisDataResponse>) => {
                syncGridSelection(event.api);
              }}
              onRowDataUpdated={(event: RowDataUpdatedEvent<AnalysisDataResponse>) => {
                syncGridSelection(event.api);
              }}
            />
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box ref={rightContainerRef} className={Styles.analysis_container_right}>
            {/* 분석 데이터셋 미등록 상태 */}
            {"none" === currentViewType && (
              <Box className="w-full h-full flex justify-center items-center">
                <div className="text-center">
                  <div className="flex flex-col items-center justify-center m-auto h-[120px] w-[120px] p-14 bg-gray-100 rounded-full ">
                    <i className="fa-solid fa-file-arrow-up text-7xl text-gray-300"></i>
                  </div>
                  <SpaceBox gap={CONTENT_GAP.LARGE} />
                  <Typography variant="h5">분석결과가 없습니다.</Typography>
                  <SpaceBox gap={CONTENT_GAP.XSMALL} />
                  <Typography variant="description">
                    {research?.instId !== session.instId
                      ? "분석 DATASET이 등록되면 알림을 받으실 수 있습니다."
                      : "분석 DATASET을 작성하고 자료를 첨부해주세요."}
                  </Typography>
                </div>
              </Box>
            )}
            {/* 분석 데이터셋 작성 모드 */}
            {"write" === currentViewType &&
              (!isWriteAllowed ? (
                <>
                  <Box className="w-full h-full flex justify-center items-center">
                    <div className="text-center">
                      <div className="flex flex-col items-center justify-center m-auto h-[120px] w-[120px] p-14 bg-gray-100 rounded-full ">
                        <i className="fa-solid fa-circle-exclamation text-7xl text-gray-300"></i>
                      </div>
                      <SpaceBox gap={CONTENT_GAP.LARGE} />
                      <Typography variant="h6">분석 DATASET을 등록할 수 없습니다.</Typography>
                      <SpaceBox gap={CONTENT_GAP.XSMALL} />
                      <Typography variant="description">
                        연구과제 상태가 참여요청인 경우에만 분석 DATASET을 등록할 수 있습니다.
                      </Typography>
                    </div>
                  </Box>
                </>
              ) : (
                <>
                  <AnalysisDataManagementWrite
                    asmtMetaRsltSn={currentAnalysisDatas ? currentAnalysisDatas.asmtMetaRsltSn : undefined}
                    onConfirm={handleSaveSuccess}
                    onCancel={currentAnalysisDatas ? handleCancelEdit : undefined}
                  />
                </>
              ))}
            {/* 분석 데이터셋 상세 모드 */}
            {"detail" === currentViewType && currentAnalysisDatas && (
              <AnalysisDataManagementDetail
                asmtMetaRsltSn={currentAnalysisDatas.asmtMetaRsltSn}
                onConfirm={() => {
                  refetch();
                }}
                onEdit={handleEditAnalysis}
              />
            )}
          </Box>
        </Box>
      </Box>
    </BaseModal>
  );
}
