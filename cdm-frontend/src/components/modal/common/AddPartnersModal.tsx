import { useEffect, useMemo, useRef, useState } from "react";
import { CommonAPI } from "@/api";
import { DisclosureAPI } from "@/api/disclosureApi";
import { Box, Button, IconButton, InputBase, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AllCommunityModule, type ColDef, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useDispatch, useSelector } from "react-redux";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import type { PartnerResponse } from "@/interfaces/researchInterface";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import { resolveModal } from "@/utils/modalPromise";
import BaseModal from "@/components/modal/BaseModal";
import BaseModalStyles from "../BaseModal.module.css";
import AddPartnersModalStyles from "./AddPartnersModal.module.css";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";

ModuleRegistry.registerModules([AllCommunityModule]);

// instId 또는 brno 중 존재하는 값을 반환하는 헬퍼 함수
const getPartnerKey = (partner: PartnerResponse): string => {
  return partner.instId || partner.brno || "";
};

const MSG_ALREADY_IN_PROGRESS_DISCLOSURE = "이미 공시진행중입니다.";

function last10DigitsPadded(s: string): string | null {
  const d = s.replace(/\D/g, "");
  if (!d) return null;
  return d.slice(-10).padStart(10, "0");
}

/** 다른 진행중 공시에 배정된 기관인지 (백엔드 busy 키와 instId/brno 형식 차이 대비) */
function isInstBlockedForPicker(item: PartnerResponse, busyKeys: Set<string>): boolean {
  const key = getPartnerKey(item);
  const t = key.trim();
  if (!t) return false;
  if (busyKeys.has(t)) return true;
  const norm = last10DigitsPadded(t);
  if (norm == null) return false;
  for (const b of busyKeys) {
    const nb = last10DigitsPadded(b);
    if (nb != null && nb === norm) return true;
  }
  return false;
}

// 모달 데이터 타입 정의
interface AddPartnersModalData {
  partners?: PartnerResponse[]; // 오른쪽 초기값(기존 동작)
  lockInitial?: boolean; // true면 초기 파트너 잠금 (왼쪽 이동 불가)
  excludePartners?: PartnerResponse[]; // 왼쪽 후보에서 초기부터 제외(오른쪽에는 미표시)
  /** CDM 공시 상세 등: 있으면 다른 진행중 공시에 배정된 기관은 오른쪽으로 옮기지 못함 */
  pblntSn?: number;
}

export default function AddPartnersModal() {
  // ----------------------------------
  // 스토어 (Redux)
  // ----------------------------------
  const dispatch = useDispatch();
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.AddPartners]);
  const currentInstId = useSelector((s: RootState) => s.session.instId);
  const { showAlert } = useGlobalAlert();

  // ----------------------------------
  // 상태 변수 (useState)
  // ----------------------------------
  const [rightItems, setRightItems] = useState<PartnerResponse[]>([]);
  const [initialPartners, setInitialPartners] = useState<PartnerResponse[]>([]);
  const [excludedPartners, setExcludedPartners] = useState<PartnerResponse[]>([]);
  const [lockInitial, setLockInitial] = useState(false);
  const [pickerPblntSn, setPickerPblntSn] = useState<number | undefined>(undefined);
  const [searchLeft, setSearchLeft] = useState("");

  // ----------------------------------
  // ref
  // ----------------------------------
  const enterKeyPressedRef = useRef(false);

  // ----------------------------------
  // 협력기관 목록 조회
  // ----------------------------------
  const { data: allItems = [] } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const res = await CommonAPI.getPartners();
      return res.data.data || [];
    },
    enabled: !!modal?.open,
  });

  const { data: busyInstIdList = [] } = useQuery({
    queryKey: ["partner-picker-busy-inst-ids", pickerPblntSn],
    queryFn: async () => {
      const res = await DisclosureAPI.getPartnerPickerBusyInstIds(pickerPblntSn!);
      const list = res.data?.data;
      return Array.isArray(list) ? list : [];
    },
    enabled: Boolean(modal?.open && pickerPblntSn != null && pickerPblntSn > 0),
  });

  const busyInstKeySet = useMemo(() => {
    return new Set(busyInstIdList.map((s) => String(s).trim()).filter(Boolean));
  }, [busyInstIdList]);

  // ----------------------------------
  // 초기 데이터 세팅
  // ----------------------------------
  useEffect(() => {
    if (modal?.open) {
      // 모달이 열릴 때 전달된 데이터 파싱 (배열 또는 객체 형태 지원)
      const data = modal.data;
      let initial: PartnerResponse[] = [];
      let excluded: PartnerResponse[] = [];
      let lock = false;

      if (Array.isArray(data)) {
        // 기존 호환: 배열로 전달된 경우
        initial = data;
        setPickerPblntSn(undefined);
      } else if (data && typeof data === "object") {
        // 새로운 형식: { partners, lockInitial } 객체로 전달된 경우
        const modalData = data as AddPartnersModalData;
        initial = modalData.partners || [];
        excluded = modalData.excludePartners || [];
        lock = modalData.lockInitial || false;
        const sn = modalData.pblntSn;
        setPickerPblntSn(typeof sn === "number" && sn > 0 ? sn : undefined);
      }

      setInitialPartners(initial);
      setRightItems(initial);
      setExcludedPartners(excluded);
      setLockInitial(lock);
      setSearchLeft("");
      enterKeyPressedRef.current = false;
    }
  }, [modal?.open, modal?.data]);

  // ----------------------------------
  // 왼쪽 목록 필터링
  // ----------------------------------
  const excludedPartnerKeys = useMemo(() => {
    return new Set(excludedPartners.map((p) => getPartnerKey(p)));
  }, [excludedPartners]);

  const leftItems = useMemo(() => {
    return allItems.filter((item) => {
      const itemKey = getPartnerKey(item);
      if (excludedPartnerKeys.has(itemKey)) return false;
      // 왼쪽 목록에서 본인(현재 로그인 기관) 제외
      if (currentInstId && itemKey === currentInstId) return false;
      if (item.brno === "0000000000" || item.instId === "0000000000") return false;

      return !rightItems.some((r) => getPartnerKey(r) === itemKey);
    });
  }, [allItems, rightItems, excludedPartnerKeys, currentInstId]);

  // ----------------------------------
  // 왼쪽 목록 필터링
  // ----------------------------------
  const filteredLeft = useMemo(() => {
    return leftItems.filter((item) => item.instNm.toLowerCase().includes(searchLeft.toLowerCase()));
  }, [leftItems, searchLeft]);

  // ----------------------------------
  // AG Grid 왼쪽 컬럼 정의
  // ----------------------------------
  const leftColDefs = useMemo<ColDef<PartnerResponse>[]>(
    () => [
      {
        headerName: `기관명 (${filteredLeft.length})`,
        field: "instNm",
        flex: 1,
        cellStyle: { cursor: "pointer" } as any,
      },
      {
        headerName: "",
        width: 50,
        cellRenderer: () => <i className="fa-solid fa-chevron-right"></i>,
        cellStyle: {
          cursor: "pointer",
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center" as const,
        } as any,
      },
    ],
    [filteredLeft.length]
  );

  // ----------------------------------
  // 초기 파트너 키 Set (잠금 여부 확인용)
  // ----------------------------------
  const initialPartnerKeys = useMemo(() => {
    return new Set(initialPartners.map((p) => getPartnerKey(p)));
  }, [initialPartners]);

  // ----------------------------------
  // AG Grid 오른쪽 컬럼 정의
  // ----------------------------------
  const rightColDefs = useMemo<ColDef<PartnerResponse>[]>(
    () => [
      {
        headerName: `추가한 기관 (${rightItems.length})`,
        field: "instNm",
        flex: 1,
        cellStyle: { cursor: "pointer" } as any,
      },
      {
        headerName: "",
        width: 50,
        cellRenderer: (params: { data: PartnerResponse }) => {
          // lockInitial이 true이고 초기 파트너인 경우 화살표 숨김
          if (lockInitial && initialPartnerKeys.has(getPartnerKey(params.data))) {
            return null;
          }
          return <i className="fa-solid fa-chevron-left"></i>;
        },
        cellStyle: (params: { data: PartnerResponse | undefined }) => {
          // lockInitial이 true이고 초기 파트너인 경우 커서 변경
          if (params.data && lockInitial && initialPartnerKeys.has(getPartnerKey(params.data))) {
            return {
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              alignItems: "center" as const,
            } as any;
          }
          return {
            cursor: "pointer",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center" as const,
          } as any;
        },
      },
    ],
    [rightItems.length, lockInitial, initialPartnerKeys]
  );

  if (!modal?.open) return null;

  const moveToRight = (item: PartnerResponse) => {
    if (pickerPblntSn && busyInstKeySet.size > 0 && isInstBlockedForPicker(item, busyInstKeySet)) {
      showAlert({ message: MSG_ALREADY_IN_PROGRESS_DISCLOSURE, severity: "warning" });
      return;
    }
    setRightItems((prev) => {
      const itemKey = getPartnerKey(item);
      if (prev.some((v) => getPartnerKey(v) === itemKey)) return prev;
      return [...prev, item];
    });
  };

  const moveToLeft = (item: PartnerResponse) => {
    const itemKey = getPartnerKey(item);
    // lockInitial이 true이고 초기 파트너인 경우 이동 방지
    if (lockInitial && initialPartnerKeys.has(itemKey)) {
      return;
    }
    setRightItems((prev) => {
      return prev.filter((v) => getPartnerKey(v) !== itemKey);
    });
  };

  const moveAllToRight = () => {
    setRightItems((prev) => {
      const existingKeys = new Set(prev.map((v) => getPartnerKey(v)));
      const additions: PartnerResponse[] = [];
      let blocked = 0;
      for (const item of leftItems) {
        const k = getPartnerKey(item);
        if (existingKeys.has(k)) continue;
        if (pickerPblntSn && busyInstKeySet.size > 0 && isInstBlockedForPicker(item, busyInstKeySet)) {
          blocked++;
          continue;
        }
        additions.push(item);
        existingKeys.add(k);
      }
      if (blocked > 0) {
        queueMicrotask(() =>
          showAlert({ message: MSG_ALREADY_IN_PROGRESS_DISCLOSURE, severity: "warning" })
        );
      }
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  };

  const moveAllToLeft = () => {
    // lockInitial이 true인 경우 초기 파트너는 유지
    if (lockInitial) {
      setRightItems((prev) => prev.filter((v) => initialPartnerKeys.has(getPartnerKey(v))));
    } else {
      setRightItems([]);
    }
  };

  const handleCancel = () => {
    // 취소 시 원래 데이터를 반환
    resolveModal(ModalNames.AddPartners, initialPartners);
    dispatch(closeModal(ModalNames.AddPartners));
  };

  const handleConfirm = () => {
    // 확인 시 현재 rightItems를 반환
    resolveModal(ModalNames.AddPartners, rightItems);
    dispatch(closeModal(ModalNames.AddPartners));
  };

  const handleSearch = () => {
    // Enter 키가 이미 눌렸는지 확인
    if (enterKeyPressedRef.current) {
      return;
    }
    enterKeyPressedRef.current = true;

    // 검색은 이미 filteredLeft에서 자동으로 처리되므로
    // 여기서는 플래그만 리셋하기 위한 타이머 설정
    setTimeout(() => {
      enterKeyPressedRef.current = false;
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <BaseModal
      open={modal.open}
      onClose={handleCancel}
      title="참여기관 추가"
      width="md"
      footer={
        <>
          <Button variant="contained" onClick={handleConfirm}>
            확인
          </Button>
          <Button variant="outlined" onClick={handleCancel}>
            취소
          </Button>
        </>
      }
    >
      <Box className={BaseModalStyles.modal_content}>
        {/* 검색 */}
        <Box className={AddPartnersModalStyles.search_container}>
          <div className={AddPartnersModalStyles.full_width_spacer}>
            <Box component="form" className="search_wrapper" onSubmit={handleFormSubmit}>
              <InputBase
                className="w-full"
                placeholder="기관명 검색"
                inputProps={{ "aria-label": "기관명 검색" }}
                value={searchLeft}
                onChange={(e) => setSearchLeft(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <span className="w-[1px] h-6 mx-1 bg-gray-200" />
              <IconButton color="primary" aria-label="검색" onClick={handleSearch} type="button">
                <Typography variant="default">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </Typography>
              </IconButton>
            </Box>
          </div>
          <div className={AddPartnersModalStyles.min_width_spacer}></div>
          <div className={AddPartnersModalStyles.full_width_spacer}></div>
        </Box>

        <Box className={AddPartnersModalStyles.content_container}>
          {/* LEFT LIST */}
          <div className={AddPartnersModalStyles.list_container}>
            <div className={AddPartnersModalStyles.pt5} />

            <div className={`${AddPartnersModalStyles.grid_container} ag-theme-cdm`}>
              <AgGridReact
                rowData={filteredLeft}
                columnDefs={leftColDefs}
                domLayout="normal"
                getRowId={(params) => getPartnerKey(params.data)}
                animateRows={false}
                overlayNoRowsTemplate="<span style='font-size: 14px;'>검색된 기관이 없습니다.</span>"
                rowStyle={{ cursor: "pointer" }}
                onRowClicked={(event) => {
                  if (event.data) {
                    moveToRight(event.data);
                  }
                }}
              />
            </div>
          </div>

          {/* CENTER */}
          <div className={AddPartnersModalStyles.center_controls}>
            <Button variant="outlined" onClick={moveAllToRight}>
              <i className="fa-solid fa-angles-right"></i>
            </Button>

            <div className={AddPartnersModalStyles.spacer_h3} />

            <Button variant="outlined" onClick={moveAllToLeft}>
              <i className="fa-solid fa-angles-left"></i>
            </Button>
          </div>

          {/* RIGHT LIST */}
          <div className={AddPartnersModalStyles.list_container}>
            <div className={AddPartnersModalStyles.pt5} />
            <div className={`${AddPartnersModalStyles.grid_container} ag-theme-cdm`}>
              <AgGridReact
                rowData={rightItems}
                columnDefs={rightColDefs}
                domLayout="normal"
                getRowId={(params) => getPartnerKey(params.data)}
                animateRows={false}
                overlayNoRowsTemplate="<span style='font-size: 14px;'>추가된 기관이 없습니다.</span>"
                rowStyle={{ cursor: "pointer" }}
                onRowClicked={(event) => {
                  if (event.data) {
                    // lockInitial이 true이고 초기 파트너인 경우 클릭 무시
                    if (lockInitial && initialPartnerKeys.has(getPartnerKey(event.data))) {
                      return;
                    }
                    moveToLeft(event.data);
                  }
                }}
              />
            </div>
          </div>
        </Box>
      </Box>
    </BaseModal>
  );
}
