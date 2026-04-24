import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, Divider, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { AllCommunityModule, type ColDef, type ICellRendererParams, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { AnalysisResultStatus, CONTENT_GAP, type PROGRESS_STATUS_TYPE, RsltGroupStcdType } from "@/constants/types";
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
import Styles from "./AnalysisManagementModal.module.css";
import OrgDataManagementDetail from "./OrgDataManagementDetail";
import OrgDataManagementWrite from "./OrgDataManagementWrite";

ModuleRegistry.registerModules([AllCommunityModule]);

type ViewType = "none" | "write" | "detail";

/** 모달에 전달되는 데이터 타입 */
interface OrgDataManagementModalData {
  asmtPtcpInstSn?: number;
  instId?: string;
  instNm?: string;
}

export default function OrgDataManagementModal() {
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.OrgDataManagement]);
  const [firstFetch, setFirstFetch] = useState<boolean>(false);
  const [currentViewType, setCurrentViewType] = useState<ViewType>("none");
  const [currentAnalysisDatas, setCurrentAnalysisDatas] = useState<AnalysisDataResponse | null>(null);
  const gridRef = useRef<AgGridReact<AnalysisDataResponse>>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const [analysisDatas, setAnalysisDatas] = useState<AnalysisDataResponse[]>([]);
  const [newlyCreatedAsmtMetaRsltSn, setNewlyCreatedAsmtMetaRsltSn] = useState<number | null>(null);
  const session = useSelector((state: RootState) => state.session);

  /* ------------------------------
   * 연구과제 상세 조회
   * ------------------------------ */
  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;
  const { data: research } = useResearchDetail(asmtSnNumber);
  const isCrudDisabled = isResearchCrudDisabled(research?.asmtPrgrsSttsCd);

  /* ------------------------------
   * 기관 데이터 목록 조회
   * ------------------------------ */
  const modalData = modal?.data as OrgDataManagementModalData | undefined;
  const { data: analysisDatasList, refetch } = useAnalysisDataList(
    research?.asmtSn ?? null,
    RsltGroupStcdType.ANALYSIS_ORG,
    modalData?.instId ?? undefined,
    !!research?.asmtSn && !!modal?.open
  );

  /* ------------------------------
   * 모달이 열릴 때 상태 초기화
   * ------------------------------ */
  useEffect(() => {
    if (modal?.open) {
      setNewlyCreatedAsmtMetaRsltSn(null);
      setCurrentAnalysisDatas(null);
      setCurrentViewType("none");
    }
  }, [modal?.open]);

  /* ------------------------------
   * 기관 데이터 목록 설정
   * ------------------------------ */
  useEffect(() => {
    if (analysisDatasList) {
      const newAnalysisDatas = analysisDatasList;
      setAnalysisDatas([...newAnalysisDatas]); // 중요: 새 레퍼런스
      setFirstFetch(false);
    }
  }, [analysisDatasList]);

  /* ------------------------------
   * 새로 등록된 데이터 선택
   * ------------------------------ */
  useEffect(() => {
    if (!newlyCreatedAsmtMetaRsltSn || analysisDatas.length === 0) return;

    const targetId = newlyCreatedAsmtMetaRsltSn;
    const newData = analysisDatas.find((data) => data.asmtMetaRsltSn === targetId);
    if (!newData) return;

    setCurrentAnalysisDatas(newData);
    setCurrentViewType("detail");

    // "첫 항목 선택" 로직이 refetch 이후 덮어쓰지 않도록 보장
    setFirstFetch(true);
    setNewlyCreatedAsmtMetaRsltSn(null); // 초기화

    // ag-grid에서 해당 데이터 행 선택
    setTimeout(() => {
      if (gridRef.current?.api) {
        gridRef.current.api.forEachNode((node) => {
          if (!node.rowPinned && node.data?.asmtMetaRsltSn === targetId) {
            node.setSelected(true);
          }
        });
      }
    }, 50);
  }, [analysisDatas, newlyCreatedAsmtMetaRsltSn]);

  /* ------------------------------
   * 기관 데이터 목록 첫 번째 항목 선택 및 detail 모드로 전환
   * ------------------------------ */
  useEffect(() => {
    if (firstFetch) return;
    if (newlyCreatedAsmtMetaRsltSn) return; // 새로 등록된 데이터가 있으면 이 로직 스킵

    if (analysisDatas.length > 0) {
      setFirstFetch(true);
      // 첫 번째 항목 선택 및 detail 모드로 전환
      const firstData = analysisDatas[0];
      setCurrentAnalysisDatas(firstData);
      setCurrentViewType("detail");

      // ag-grid에서 첫 번째 데이터 행 선택
      setTimeout(() => {
        if (gridRef.current?.api && firstData?.asmtMetaRsltSn) {
          gridRef.current.api.forEachNode((node) => {
            if (!node.rowPinned && node.data?.asmtMetaRsltSn === firstData.asmtMetaRsltSn) {
              node.setSelected(true);
              return;
            }
          });
        }
      }, 50);
    } else {
      // 연구과제 등록자
      if (research?.instId === session.instId) {
        if (analysisDatas.length > 0) {
          setCurrentViewType("detail");
        }
      } else {
        setCurrentViewType("write");
      }

      setCurrentAnalysisDatas(null);
    }
  }, [analysisDatas, firstFetch, research?.instId, session.instId, newlyCreatedAsmtMetaRsltSn]);

  /* ------------------------------
   * 기관 데이터 목록 ag-grid 강제 새로고침
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

  /* ------------------------------
   * 테이블 컬럼 정의
   * ag-grid에서 사용할 컬럼 설정을 정의
   * 기관 데이터 이력과 상태를 표시하는 컬럼
   * ------------------------------ */
  const colDefs = useMemo<ColDef<AnalysisDataResponse>[]>(
    () => [
      {
        headerName: "기관 데이터 이력",
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
                  onClick={() => {
                    setCurrentAnalysisDatas(null);
                    setCurrentViewType("write");
                  }}
                >
                  기관 데이터 등록
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
    [analysisDatas]
  );

  /* ------------------------------
   * 테이블 상단에 고정되어 표시되는 "기관 데이터 등록" 버튼이 있는 행
   * ------------------------------ */
  const pinnedTopRowData = useMemo(() => [{ isButtonRow: true }], []);

  /* ------------------------------
   * 테이블 상단에 고정되어 표시되는 "기관 데이터 등록" 버튼이 있는 행
   * ------------------------------ */
  const isPinnedTopRow = useMemo(() => {
    return research?.instId !== session.instId && !!research?.asmtPrcp && !isCrudDisabled;
  }, [isCrudDisabled, research?.instId, research?.asmtPrcp, session.instId]);

  /* ------------------------------
   * 모달 닫기
   * ------------------------------ */
  const handleClose = (result: boolean) => {
    resolveModal(ModalNames.OrgDataManagement, result);
    dispatch(closeModal(ModalNames.OrgDataManagement));
  };

  /* ------------------------------
   * 기관 데이터 행 클릭 시 상세 화면 표시
   * ------------------------------ */
  const handleClickAnalysis = (data: AnalysisDataResponse) => {
    setCurrentViewType("detail");
    setCurrentAnalysisDatas(data);
  };

  /* ------------------------------
   * 기관 데이터 수정 모드로 전환
   * ------------------------------ */
  const handleEditAnalysis = () => {
    if (currentAnalysisDatas) {
      setCurrentViewType("write");
      // currentAnalysisDatas는 유지하여 수정할 데이터 정보 전달
    }
  };

  /* ------------------------------
   * 기관 데이터 수정 취소
   * ------------------------------ */
  const handleCancelEdit = () => {
    if (currentAnalysisDatas) {
      setCurrentViewType("detail");
    }
  };

  /* ------------------------------
   * 기관 데이터 저장 성공 시 처리
   * ------------------------------ */
  const handleSaveSuccess = async ({ isEditMode, asmtMetaRsltSn }: { isEditMode: boolean; asmtMetaRsltSn?: number }) => {
    if (!isEditMode) {
      // 생성 모드: 새로 만들어진 항목 id로 detail + 리스트 선택을 동기화
      if (asmtMetaRsltSn) {
        setNewlyCreatedAsmtMetaRsltSn(asmtMetaRsltSn);
      }
      await refetch();
      return;
    }

    // 수정 모드에서 저장 성공 시 상세 화면으로 복귀
    if (currentAnalysisDatas) {
      setCurrentViewType("detail");
      // currentAnalysisDatas는 유지하여 같은 항목의 상세 화면 표시
      // Detail 컴포넌트의 useQuery가 자동으로 최신 데이터를 가져옴
    } else {
      setFirstFetch(false);
    }
  };

  /* ------------------------------
   * 오류로 모달 종료
   * ------------------------------ */
  if (!modal?.open) return null;

  return (
    <BaseModal open={modal.open} onClose={() => handleClose(false)} title="기관 데이터 분석결과 관리" width="lg">
      <Box>
        <Box>
          <Typography variant="subtitle">{research?.asmtNm || ""}</Typography>
          <SpaceBox gap={CONTENT_GAP.XSMALL}></SpaceBox>
          {/* <Typography variant="default">{research?.instNm || ""}</Typography> */}
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
              pinnedTopRowData={isPinnedTopRow ? pinnedTopRowData : []}
              columnDefs={colDefs}
              rowHeight={42}
              rowSelection={{
                mode: "singleRow",
                checkboxes: false, // 왼쪽 체크박스 컬럼 제거
                enableClickSelection: true, // 행 클릭으로 선택 가능
              }}
              overlayNoRowsTemplate={"<span>등록된 기관 데이터가 없습니다.</span>"}
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
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box ref={rightContainerRef} className={Styles.analysis_container_right}>
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
                    {research?.instId === session.instId
                      ? "참여기괸이 분석한 결과가 없습니다. 분석결과가 등록되면 알림을 받으실 수 있습니다."
                      : "분석결과를 작성하고 자료를 첨부해주세요."}
                  </Typography>
                </div>
              </Box>
            )}
            {isCrudDisabled ? (
              "write" === currentViewType ? (
                <Box className="w-full h-full flex justify-center items-center">
                  <div className="text-center">
                    <div className="flex flex-col items-center justify-center m-auto h-[120px] w-[120px] p-14 bg-gray-100 rounded-full ">
                      <i className="fa-solid fa-circle-exclamation text-7xl text-gray-300"></i>
                    </div>
                    <SpaceBox gap={CONTENT_GAP.LARGE} />
                    <Typography variant="h6">기관 데이터를 등록할 수 없습니다.</Typography>
                    <SpaceBox gap={CONTENT_GAP.XSMALL} />
                    <Typography variant="description">
                      연구과제가 마감 또는 취소된 상태에서는 기관 데이터를 등록할 수 없습니다.
                    </Typography>
                  </div>
                </Box>
              ) : null
            ) : (
              "write" === currentViewType && (
                <OrgDataManagementWrite
                  asmtMetaRsltSn={currentAnalysisDatas ? currentAnalysisDatas.asmtMetaRsltSn : undefined}
                  onConfirm={handleSaveSuccess}
                  onCancel={currentAnalysisDatas ? handleCancelEdit : undefined}
                />
              )
            )}
            {"detail" === currentViewType && currentAnalysisDatas && (
              <OrgDataManagementDetail
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
