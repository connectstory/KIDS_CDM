import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Divider, MenuItem, Select, Stack, Tab, Tabs } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AllCommunityModule, type ColDef, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types";
import { fetchContentDetail, fetchContentList, publishContent, saveContentDraft } from "@/api/communityApi";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import CdmPagination from "@/components/CdmPagination";
import CdmPaginationMove from "@/components/CdmPaginationMove";
import type { SmartEditorHandle } from "@/components/SmartEditor";
import SmartEditor from "@/components/SmartEditor";
import { SpaceBox } from "@/components/SpaceBox";
import { Helmet } from "react-helmet";

ModuleRegistry.registerModules([AllCommunityModule]);

type BoardRow = {
  rvsnNo: string;
  rgtrId: string;
  rlsYn: string;
  regDt: string;
};

function PublishCellRenderer(params: Readonly<{ data: BoardRow; onPublish: (rvsnNo: string) => void }>) {
  const isPublished = params.data.rlsYn === "Y";
  return (
    <Button
      variant={isPublished ? "contained" : "outlined"}
      color={isPublished ? "primary" : "inherit"}
      onClick={() => params.onPublish(params.data.rvsnNo)}
    >
      {isPublished ? "공개" : "비공개"}
    </Button>
  );
}

function DetailCellRenderer(params: Readonly<{ data: BoardRow; onDetail: (rvsnNo: string) => void }>) {
  return (
    <Button variant="outlined" onClick={() => params.onDetail(params.data.rvsnNo)}>
      상세보기
    </Button>
  );
}

function PreviewCellRenderer(params: Readonly<{ data: BoardRow; onPreview: (rvsnNo: string) => void }>) {
  return (
    <Button variant="contained" onClick={() => params.onPreview(params.data.rvsnNo)}>
      미리보기
    </Button>
  );
}

export default function AdminContentListView() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { boardType } = useParams(); // 🔥 boardType = bbsId
  const queryClient = useQueryClient();

  const [editorValue, setEditorValue] = useState("");
  const editorRef = useRef<SmartEditorHandle>(null);
  const [isDirty, setIsDirty] = useState(false);
  const { showAlert } = useGlobalAlert();

  const Q = {
    PAGE: "page",
    LENGTH: "length",
  } as const;

  type SearchState = {
    viewCount: string;
    currentPage: number;
  };

  const defaultSearchState: SearchState = {
    viewCount: "10",
    currentPage: 1,
  };

  const parseSearchParamsFromURL = (searchParams: URLSearchParams): SearchState => {
    const page = searchParams.get(Q.PAGE);
    const viewCount = searchParams.get(Q.LENGTH);

    return {
      viewCount: viewCount ?? defaultSearchState.viewCount,
      currentPage: page ? Math.max(1, Number.parseInt(page, 10) || 1) : defaultSearchState.currentPage,
    };
  };

  const buildURLSearchParams = (state: SearchState, pageOverride?: number): Record<string, string> => {
    const page = pageOverride ?? state.currentPage;
    return {
      [Q.PAGE]: String(page),
      [Q.LENGTH]: state.viewCount,
    };
  };

  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  const appliedState = useMemo(() => parseSearchParamsFromURL(urlSearchParams), [urlSearchParams]);
  const [paginationState, setPaginationState] = useState<SearchState>(() =>
    parseSearchParamsFromURL(new URLSearchParams(urlSearchParams))
  );

  useMemo(() => {
    setPaginationState(appliedState);
  }, [appliedState]);

  const { viewCount } = paginationState;

  const applySearchParams = (state: SearchState, pageOverride?: number) => {
    setUrlSearchParams(buildURLSearchParams(state, pageOverride), {
      replace: false,
    });
  };

  // boardType 변경 시 에디터 완전 초기화
  useEffect(() => {
    setEditorValue("");
    setIsDirty(false);

    // SmartEditor 내용도 직접 리셋
    setTimeout(() => {
      editorRef.current?.setContent("");
    }, 0);
  }, [boardType]);

  /* =======================
     📡 리비전 목록 로드
  ======================= */
  const { data } = useQuery({
    queryKey: ["adminContentList", boardType, appliedState.currentPage, appliedState.viewCount],
    queryFn: () =>
      fetchContentList({
        bbsId: boardType!,
        page: appliedState.currentPage,
        pageSize: appliedState.viewCount,
      }),
    enabled: !!boardType,
    refetchOnMount: "always",
  });

  const rowData: BoardRow[] = (data?.list as BoardRow[]) ?? [];
  const totalCount: number = data?.totalCount ?? 0;

  /* =======================
     🧠 버튼 기능
  ======================= */
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!editorRef.current) throw new Error("editor-not-ready");
      if (!boardType) throw new Error("boardType-not-ready");

      const content = await editorRef.current.getProcessedContent();
      return saveContentDraft(boardType, {
        contsCn: content,
        rgtrId: "admin",
        regPrgmId: "CMS",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminContentList", boardType] });
    },
    onError: (e) => {
      console.error(e);
      showAlert({ message: "임시저장 중 오류가 발생했습니다.", severity: "error" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ rvsnNo }: { rvsnNo: string }) => {
      if (!boardType) throw new Error("boardType-not-ready");
      return publishContent(boardType, rvsnNo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminContentList", boardType] });
      queryClient.invalidateQueries({ queryKey: ["publishedContent", boardType] });
    },
    onError: (e) => {
      console.error(e);
      showAlert({ message: "공개 처리 중 오류가 발생했습니다.", severity: "error" });
    },
  });

  const saveDraft = () => {
    saveDraftMutation.mutate();
  };

  const publish = (rvsnNo: string) => {
    publishMutation.mutate({ rvsnNo });
  };

  const preview = async () => {
    if (!editorRef.current) return;

    const html = await editorRef.current.getRawContent();
    sessionStorage.setItem("PREVIEW_HTML", html);

    globalThis.open(`${routes.COMMUNITY.ROOT}/content/${boardType}/contentPreview`, "preview", "width=1500,height=900");
  };

  const previewFromGrid = async (rvsnNo: string) => {
    try {
      if (!boardType) return;
      const data = await fetchContentDetail(boardType, rvsnNo);
      sessionStorage.setItem("PREVIEW_HTML", data.contsCn);

      globalThis.open(`${routes.COMMUNITY.ROOT}/content/${boardType}/contentPreview`, "preview", "width=1450,height=900");
    } catch (e) {
      console.error(e);
      showAlert({
        message: "미리보기 로딩 중 오류가 발생했습니다.",
        severity: "error",
      });
    }
  };

  const onEditorChange = (val: string) => {
    setEditorValue(val);
    setIsDirty(true);
  };

  const handleLoadRevision = async (rvsnNo: string) => {
    if (isDirty) {
      const ok = globalThis.confirm("작성 중인 내용이 사라집니다. 계속하시겠습니까?");
      if (!ok) return;
    }

    try {
      if (!boardType) return;
      const data = await fetchContentDetail(boardType, rvsnNo);
      editorRef.current?.setContent(data.contsCn);
      setIsDirty(false);
    } catch (e) {
      console.error(e);
      showAlert({
        message: "리비전 불러오기 중 오류가 발생했습니다.",
        severity: "error",
      });
    }
  };

  const defaultColDef: ColDef = {
    cellStyle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    headerClass: "ag-header-center",
  };

  const saveAndPublish = async () => {
    if (!editorRef.current) return;
    if (!boardType) return;

    try {
      const content = await editorRef.current.getProcessedContent();

      // 1️⃣ 임시저장
      const rvsnNo = await saveContentDraft(boardType, {
        contsCn: content,
        rgtrId: "admin",
        regPrgmId: "CMS",
      });

      if (!rvsnNo) {
        showAlert({
          message: "저장에 실패했습니다.",
          severity: "error",
        });
        return;
      }

      // 2️⃣ 공개 처리
      await publishContent(boardType, String(rvsnNo));

      queryClient.invalidateQueries({ queryKey: ["adminContentList", boardType] });
      queryClient.invalidateQueries({ queryKey: ["publishedContent", boardType] });
    } catch (e) {
      console.error(e);
      showAlert({
        message: "저장 중 오류가 발생했습니다.",
        severity: "error",
      });
    }
  };

  /* =======================
     📊 컬럼 정의
  ======================= */
  const colDefs: ColDef<BoardRow>[] = [
    { headerName: "No", valueGetter: "node.rowIndex + 1", flex: 0.5 },
    { headerName: "리비전 번호", field: "rvsnNo", flex: 2.5, cellStyle: { justifyContent: "flex-start" } },
    { headerName: "작성자", field: "rgtrId", flex: 1 },
    {
      headerName: "공개",
      flex: 1,
      cellRenderer: PublishCellRenderer,
      cellRendererParams: { onPublish: publish },
    },
    {
      headerName: "등록일",
      field: "regDt",
      flex: 1.8,
      valueFormatter: (p) => {
        if (!p.value) return "";
        const d = new Date(p.value);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} 00:00`;
      },
    },
    {
      headerName: "상세보기",
      flex: 1,
      cellRenderer: DetailCellRenderer,
      cellRendererParams: { onDetail: handleLoadRevision },
    },
    {
      headerName: "미리보기",
      flex: 1,
      cellRenderer: PreviewCellRenderer,
      cellRendererParams: { onPreview: previewFromGrid },
    },
  ];

  const businessOverviewTabs = [
    { label: "사업배경", key: "background" },
    { label: "사업목적", key: "objective" },
    { label: "협연센터", key: "coordinationCenter" },
    { label: "협력기관", key: "partnerInstitution" },
  ];

  const aboutCdmTabs = [
    { label: "CDM 정의", key: "cdmDefinition" },
    { label: "CDM 구조", key: "cdmStructure" },
    { label: "CDM 구축과정", key: "cdmImplementation" },
    { label: "정보보안", key: "informationSecurity" },
  ];

  let currentTabs = businessOverviewTabs;

  if (aboutCdmTabs.some((tab) => tab.key === boardType)) {
    currentTabs = aboutCdmTabs;
  }

  const currentTabIndex = currentTabs.findIndex((tab) => tab.key === boardType);

  return (
    <Box className="aggridguard-page">
      <Helmet>
        <title>CDM - 자료실</title>
      </Helmet>
      <Box>
        <Box className="tab_container">
          <Tabs
            value={currentTabIndex}
            onChange={(_, newValue) => {
              navigate(`${routes.COMMUNITY.ROOT}/content/${currentTabs[newValue].key}/admin/list`);
            }}
          >
            {currentTabs.map((tab) => (
              <Tab key={tab.key} label={tab.label} />
            ))}
          </Tabs>
        </Box>
      </Box>

      <SpaceBox gap={CONTENT_GAP.MEDIUM} />

      <SmartEditor ref={editorRef} value={editorValue} onChange={onEditorChange} height={450} />

      <Stack direction="row" spacing={1} py={2}>
        <Button variant="outlined" onClick={preview}>
          미리보기
        </Button>
        <Box flexGrow={1} />
        <Button variant="outlined" onClick={saveDraft}>
          임시저장
        </Button>
        <Button variant="contained" onClick={saveAndPublish}>
          저장
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* 리스트 정보 */}
      <div className="tbl_info">
        <div>
          전체 <span className="count">{totalCount}</span>건
        </div>

        <div className="view_count">
          <label htmlFor="viewCountSelect">조회건수</label>
          <Select
            inputProps={{ id: "viewCountSelect" }}
            value={viewCount}
            onChange={(e) => {
              const nextViewCount = e.target.value;
              const nextState: SearchState = { ...appliedState, viewCount: nextViewCount, currentPage: 1 };
              setPaginationState(nextState);
              applySearchParams(nextState, 1);
            }}
          >
            <MenuItem value="10">10개씩</MenuItem>
            <MenuItem value="30">30개씩</MenuItem>
            <MenuItem value="50">50개씩</MenuItem>
          </Select>
        </div>
      </div>

      {/* 그리드 */}
      <div className="ag-theme-cdm w-full aggridguard">
        <AgGridReact
          rowData={rowData}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          domLayout="autoHeight"
          loading={false}
          overlayNoRowsTemplate="<span style='padding: 20px; display: block;'>게시물이 존재하지 않습니다.</span>"
          rowHeight={44}
          headerHeight={44}
        />
      </div>

      <SpaceBox gap={CONTENT_GAP.MEDIUM} />

      {/* 페이징 */}
      <Stack direction="row" className="paging_wrap">
        <CdmPagination
          page={appliedState.currentPage}
          totalPages={Math.ceil(totalCount / Number(appliedState.viewCount))}
          onChange={(page) => {
            const nextState: SearchState = { ...appliedState, currentPage: page };
            setPaginationState(nextState);
            applySearchParams(nextState);
          }}
        />
        <CdmPaginationMove
          currentPage={appliedState.currentPage}
          totalPages={Math.ceil(totalCount / Number(appliedState.viewCount))}
          onPageChange={(page) => {
            const nextState: SearchState = { ...appliedState, currentPage: page };
            setPaginationState(nextState);
            applySearchParams(nextState);
          }}
        />
      </Stack>

      <div className="h-10" />
    </Box>
  );
}
