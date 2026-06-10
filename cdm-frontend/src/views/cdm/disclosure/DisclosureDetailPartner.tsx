import { useCallback, useEffect, useMemo } from "react";
import { Alert, Box, Fade, Stack, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types";
import { downloadFileViaProxy } from "@/api/commonApi";
import { DisclosureAPI } from "@/api/disclosureApi";
import type { RootState } from "@/store";
import {
  formatDate,
  formatDateTime,
  getDisclosurePblntStatusConfig,
  isDeletedYn,
  isDisclosurePartnerUploadFileSeCd,
} from "@/utils/common";
import { DISCLOSURE_FILE_SE_CD } from "@/constants/types";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import FileContainer, { type FileData } from "@/components/FileContainer";
import Loader from "@/components/Loader";
import { SpaceBox } from "@/components/SpaceBox";
import { AppButton, AppStatusChip } from "@/components/ui";
import styles from "./DisclosureDetailPartner.module.scss";
import { ContentDisclosurePartnerCustomerProgressPanel } from "./components/ContentDisclosurePartner";

/**
 * localStorage 접근이 거부되거나(비활성·쿼터 등) 예외가 나면 로깅한 뒤 폴백합니다 (CWE-390).
 */
function readLocalStorageString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("[DisclosureDetailCustomer] localStorage.getItem 실패", { key, error });
    return null;
  }
}

// DisclosureDetailCustomer — 협력기관(참여기관) 전용 공시 상세 페이지
export default function DisclosureDetailCustomer() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { pblntSn: pblntSnFromRoute } = useParams<{ pblntSn: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { showAlert } = useGlobalAlert();
  const queryClient = useQueryClient();
  // --- 세션(Redux): 기관 식별 ---
  const session = useSelector((state: RootState) => state.session);
  const mbrId = session.mbrId || "";
  const instId = session.instId || "";

  // --- 공시일련번호 `pblntSn` 확정 (우선순위: path param > legacy query > localStorage) ---
  const pblntSnFromUrl = searchParams.get("pblntSn");
  const pblntSnFromStorage = readLocalStorageString("pblntSn");
  const pblntSn = pblntSnFromRoute || pblntSnFromUrl || pblntSnFromStorage;
  /** 숫자 공시 PK (라우팅/스토리지에서 문자열로 들어오므로 필요 시만 변환) */
  const pblntSnId = useMemo(() => (pblntSn ? Number(pblntSn) : NaN), [pblntSn]);

  // --- React Query: 공시 상세 (`DisclosureAPI.getDisclosureById`) ---
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["disclosure", pblntSn],
    queryFn: () => DisclosureAPI.getDisclosureById(String(pblntSn!)),
    enabled: !!pblntSn,
    staleTime: 0,
    refetchOnMount: "always" as const,
  });

  /** API 응답 본문의 공시 단건 */
  const disclosure = response?.data?.data;

  /** 공시 상태(`pblntStcd`)에 따라 협력기관 제출·버튼 허용 여부 및 경고 문구 */
  const partnerSubmissionAllowed = useMemo(
    () => DisclosureAPI.isPartnerSubmissionAllowed(disclosure?.pblntStcd),
    [disclosure?.pblntStcd]
  );
  const partnerSubmissionBlockedMessage = useMemo(
    () => DisclosureAPI.getPartnerSubmissionBlockedMessage(disclosure?.pblntStcd),
    [disclosure?.pblntStcd]
  );

  // --- React Query: 참여기관 목록 (`getPartnersByPblntSn`) — 상세 로드 후에만 실행 ---
  const { data: partners = [], error: partnersError } = useQuery({
    queryKey: ["disclosure-partners", pblntSn],
    queryFn: async () => {
      if (!pblntSn) {
        return [];
      }

      try {
        const response = await DisclosureAPI.getPartnersByPblntSn(String(pblntSn));

        // 응답 데이터가 배열인지 확인
        const partnersData = response.data?.data;
        if (Array.isArray(partnersData)) {
          return partnersData;
        } else {
          return [];
        }
      } catch (error: unknown) {
        console.error("[DisclosureDetailCustomer] 참여기관 목록 조회 실패", error);
        return [];
      }
    },
    enabled: !!pblntSn && !isLoading && !!disclosure,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always" as const,
  });
  /** 그리드 필터: 세션 `instId` 우선, 없으면 `mbrId`로 기관 매칭 */
  const filterInstId = instId || mbrId;

  /** 본인 소속 기관과 `instId`가 일치하는 참여기관 행만 (협력기관 화면은 자기 행만) */
  const myPartner = useMemo(() => {
    if (!Array.isArray(partners) || !filterInstId) return [];
    const normalize = (value: unknown) => {
      if (value == null) return "";
      const str = typeof value === "string" ? value : String(value);
      return str.trim();
    };
    const target = normalize(filterInstId);
    return partners.filter((p: any) => normalize(p.instId) === target);
  }, [partners, filterInstId]);

  /** 첫 번째 본인 행의 `ptcpInstSn` — 파일 목록 쿼리 키·CDM 파일 매핑에 사용 */
  const currentPtcpInstSn: number | null = useMemo(() => {
    if (myPartner.length > 0) return myPartner[0].ptcpInstSn ?? null;
    return null;
  }, [myPartner]);

  // --- React Query: 공시 첨부파일 (`getFilesByPblntSn`) — CDM(08) 존재 여부로 등록유형 잠금 판단 ---
  const {
    data: filesResponse,
    isLoading: isLoadingFiles,
    isError: isErrorFiles,
    error: errorFiles,
  } = useQuery({
    queryKey: ["disclosure-files", pblntSn, currentPtcpInstSn],
    queryFn: async () => {
      const res = await DisclosureAPI.getFilesByPblntSn(
        String(pblntSn!),
        currentPtcpInstSn != null ? String(currentPtcpInstSn) : null
      );
      return res;
    },
    enabled: !!pblntSn && !!disclosure,
    staleTime: 0,
    refetchOnMount: "always" as const,
  });

  /** ptcpInstSn → 해당 기관에 CDM 업로드 파일(fileSeCd 08)이 있는지 */
  const cdmUploadByPtcpInstSn = useMemo(() => {
    const list = filesResponse?.data?.data;
    const m = new Map<number, boolean>();
    if (!Array.isArray(list)) return m;
    list.forEach((f: any) => {
      if (isDeletedYn(f.delYn ?? f.del_yn)) return;
      if (String(f.fileSeCd ?? f.file_se_cd ?? "").trim() !== DISCLOSURE_FILE_SE_CD.CDM) return;
      const sn = f.ptcpInstSn != null ? Number(f.ptcpInstSn) : NaN;
      if (!Number.isNaN(sn)) m.set(sn, true);
    });
    return m;
  }, [filesResponse?.data?.data]);

  /**
   * hasCdmUploadForPtcpInstSn — 특정 참여기관에 CDM 파일(fileSeCd 08)이 있는지
   * @param ptcpInstSn 참여기관 일련번호
   */
  const hasCdmUploadForPtcpInstSn = useCallback(
    (ptcpInstSn?: number | null) => {
      if (ptcpInstSn == null) return false;
      return cdmUploadByPtcpInstSn.get(Number(ptcpInstSn)) === true;
    },
    [cdmUploadByPtcpInstSn]
  );

  /**
   * 라우트 `location.key` 변경 시 — 재진입 시 그리드/상세가 stale하지 않도록 disclosure·partners 강제 갱신
   * (같은 라우트에서 컴포넌트가 remount 되지 않는 케이스 대비)
   */
  useEffect(() => {
    if (Number.isNaN(pblntSnId)) return;
    queryClient.invalidateQueries({ queryKey: ["disclosure", pblntSn], exact: true });
    queryClient.invalidateQueries({ queryKey: ["disclosure-partners", pblntSn], exact: true });
    queryClient.refetchQueries({ queryKey: ["disclosure", pblntSn], exact: true });
    queryClient.refetchQueries({ queryKey: ["disclosure-partners", pblntSn], exact: true });
  }, [location.key, pblntSn, pblntSnId, queryClient]);

  /** 동일하게 `location.key` 변경 시 첨부파일 쿼리만 재조회 */
  useEffect(() => {
    if (Number.isNaN(pblntSnId) || currentPtcpInstSn == null) return;
    queryClient.refetchQueries({
      queryKey: ["disclosure-files", pblntSn, currentPtcpInstSn],
      exact: true,
    });
  }, [location.key, pblntSn, pblntSnId, currentPtcpInstSn, queryClient]);

  /** 참여기관 목록 쿼리 실패 시 토스트 */
  useEffect(() => {
    if (partnersError) {
      const message =
        partnersError instanceof Error
          ? partnersError.message
          : (partnersError as any)?.response?.data?.message || "진행상태를 불러오는 중 오류가 발생했습니다.";
      showAlert({ message, severity: "error" });
    }
  }, [partnersError, showAlert]);

  /** 첨부파일 목록 표시용: 바이트 → 읽기 쉬운 문자열 */
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

  const getFileExtension = (fileName: string): string => {
    if (!fileName) return "";
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot === -1) return "";
    return fileName.substring(lastDot + 1).toUpperCase();
  };

  /** 다운로드/표시용: 경로·UUID 접미사 등 제거해 파일명 라벨 정리 */
  const cleanAttachmentFileName = (rawName: string): string => {
    if (!rawName) return "";
    let name = String(rawName).trim();

    // URL/경로 형태가 섞인 경우 방어
    if (name.includes("?")) name = name.split("?")[0].trim();
    if (name.includes("#")) name = name.split("#")[0].trim();
    name = name.replaceAll("\\", "/");
    if (name.includes("/")) name = name.substring(name.lastIndexOf("/") + 1).trim();

    // 이미 괄호/대괄호로 부가정보가 붙어있다면 제거 (우리는 별도 suffix를 붙임)
    name = name.replace(/\s*(\([^)]*\)|\[[^\]]*\])\s*$/g, "").trim();

    // 저장파일명에 붙는 UUID/타임스탬프류 제거: base_(digits|uuid).ext, base-(digits|uuid).ext
    // 예) 보고서_20260101123000.pdf → 보고서.pdf
    // 예) 보고서_8da9f68f-a83e-4181-8995-7b5d9caed1e2.pdf → 보고서.pdf
    name = name.replace(/([_-])(\d{8,14}|[0-9a-fA-F]{8,}(?:-[0-9a-fA-F]{4,}){2,}|[0-9a-fA-F]{32})\.(\w{1,10})$/g, ".$3");

    return name;
  };

  /**
   * files — 고객용 첨부파일 카드 데이터 (삭제 버튼 없음, DRB·CDM 행 제외, 다운로드는 atchFileId UUID)
   * 소스: `filesResponse.data.data`
   */
  const files: FileData[] = (() => {
    if (!filesResponse?.data?.data || !Array.isArray(filesResponse.data.data)) {
      return [];
    }

    const fileList = filesResponse.data.data;

    const mappedFiles = fileList
      .map((file: any) => {
        if (isDeletedYn(file.delYn)) return null;
        if (isDisclosurePartnerUploadFileSeCd(file.fileSeCd)) return null;

        const strgFileNm =
          (file.strgFileNm && String(file.strgFileNm).trim()) || (file.strgfilenm && String(file.strgfilenm).trim()) || "";
        const atchFileSn = file.atchFileSn != null ? String(file.atchFileSn).trim() : "";
        // 다운로드 API는 첨부파일 ID(UUID) 기준
        const atchFileId =
          (file.atchFileId != null ? String(file.atchFileId).trim() : "") ||
          (file.atchfileid != null ? String(file.atchfileid).trim() : "") ||
          (file.atch_file_id != null ? String(file.atch_file_id).trim() : "");
        if (!atchFileId) return null;

        // 표시용 파일명은 원본(atchFileSn) 우선, 없으면 저장명(strgFileNm)에서 불필요 문자열 제거
        const rawLabel = atchFileSn || strgFileNm || atchFileId;
        const cleanedLabel = cleanAttachmentFileName(rawLabel);
        const baseLabel = cleanedLabel || rawLabel;
        const ext = getFileExtension(baseLabel);
        const fileSeCd = file.fileSeCd || "";
        const fileSize = file.fileSz || null;

        const displayName = baseLabel;

        return {
          name: displayName,
          ext: ext || fileSeCd,
          size: formatFileSize(fileSize),
          showDeleteButton: false,
          // onClick 다운로드 파라미터로 atch_file_id(UUID)만 전달
          atchFileSn: atchFileId,
          downloadAs: baseLabel,
        } as FileData & { atchFileSn: string };
      })
      .filter((file: FileData | null) => file !== null) as FileData[];

    return mappedFiles;
  })();

  /** FileContainer onClick — 공통 `/common/file/download/{atchFileId}` (연구·게시판과 동일) */
  const handleFileDownload = async (file: FileData) => {
    try {
      const fileWithSn = file as FileData & { atchFileSn?: string; downloadAs?: string };
      const atchFileId =
        (fileWithSn.atchFileSn && fileWithSn.atchFileSn.trim()) ||
        ((file as FileData).atchFileId && String((file as FileData).atchFileId).trim()) ||
        "";
      const fileNm = fileWithSn.downloadAs || file.name || atchFileId;

      if (!atchFileId) {
        showAlert({ message: "다운로드할 파일 ID를 찾을 수 없습니다.", severity: "error" });
        return;
      }

      await downloadFileViaProxy(atchFileId, fileNm);
      showAlert({ message: "파일 다운로드가 시작되었습니다.", severity: "success" });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "파일 다운로드 중 오류가 발생했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    }
  };

  const disclosureStatusConfig = getDisclosurePblntStatusConfig(disclosure?.pblntStcd);

  // ========== 렌더 분기: 공시번호 없음 / 로딩 / 에러 ==========
  if (Number.isNaN(pblntSnId)) {
    return (
      <Fade in timeout={280}>
        <Box className={styles.root} sx={{ py: 5, textAlign: "center" }}>
          <Stack spacing={2} alignItems="center">
            <Typography color="text.secondary">공시일련번호가 없습니다.</Typography>
            <Typography variant="body2" color="text.secondary">
              공시목록에서 공시를 선택하거나, URL 경로에 공시번호를 포함해주세요.
            </Typography>
            <AppButton variant="outlined" size="medium" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
              목록으로 이동
            </AppButton>
          </Stack>
        </Box>
      </Fade>
    );
  }

  /** 상세 쿼리 로딩 스켈레톤 */
  if (isLoading) {
    return (
      <Box sx={{ position: "relative", minHeight: "400px" }}>
        <Loader isLoading={true} />
      </Box>
    );
  }

  /** 상세 조회 실패 또는 데이터 없음 */
  if (isError || !disclosure) {
    return (
      <Fade in timeout={280}>
        <Box className={styles.root} sx={{ py: 5, textAlign: "center" }}>
          <Stack spacing={2} alignItems="center">
            <Typography color="error">{error instanceof Error ? error.message : "공시 정보를 불러올 수 없습니다."}</Typography>
            <AppButton variant="outlined" size="medium" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
              목록으로
            </AppButton>
          </Stack>
        </Box>
      </Fade>
    );
  }

  // ========== 본문: 공시 상세 + 첨부 + 진행상태 그리드 ==========
  return (
    <Fade in timeout={280}>
      <Box className={styles.root}>
        <Helmet>
          <title>CDM - CDM 업로드 공시</title>
        </Helmet>
        {/* ==============================
          헤더 (ResearchDetail / DisclosureDetailAdmin 과 동일 레이아웃)
      ============================== */}
        <Box className="btn_container">
          <Stack direction="column" spacing={1}>
            <Typography variant="mainTitle">{disclosure.ttlNm || "-"}</Typography>
            <Typography variant="h6">공시번호: {disclosure.pblntSn}</Typography>
          </Stack>
          <Stack className="btn_wrapper tbl_top" direction="row">
            <AppButton variant="outlined" size="medium" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
              목록
            </AppButton>
          </Stack>
        </Box>

        <SpaceBox gap={CONTENT_GAP.LARGE} />

        {/* ==============================
          공시내용
      ============================== */}
        <Box component="section" id="content-desc" className={styles.section}>
          <Box className="sub_path">
            <Typography className="tit" variant="h5">
              공시내용
            </Typography>
          </Box>
          <Box className="form_container">
            {/* 공시 내용 1 */}
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography variant="h6">구분</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography variant="default">
                    {DisclosureAPI.convertType(disclosure.pblntDvcd ?? disclosure.pblntSeCd) || "-"}
                  </Typography>
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography variant="h6">공시 기간</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography variant="default">
                    {disclosure.pblntBgngYmd && disclosure.pblntEndYmd
                      ? `${formatDate(disclosure.pblntBgngYmd)} ~ ${formatDate(disclosure.pblntEndYmd)}`
                      : "-"}
                  </Typography>
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
                  <AppStatusChip
                    size="small"
                    label={disclosureStatusConfig?.label ?? DisclosureAPI.convertStatus(disclosure.pblntStcd)}
                    chipStyle={disclosureStatusConfig?.chipStyle ?? {}}
                  />
                </Box>
              </Box>
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography variant="h6">작성자</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography variant="default">{disclosure.rgtrNm || disclosure.rgtrId || "-"}</Typography>
                </Box>
              </Box>
            </Stack>

            {/* 공시 내용 3 */}
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography variant="h6">등록일시</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Typography variant="default">{formatDateTime(disclosure.regYmd)}</Typography>
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
                    component="div"
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

            {/* 공시 내용 5: 첨부파일 — `DisclosureDetailAdmin`과 동일 레이아웃 (DRB·CDM 제외는 `files` 매핑) */}
            <Stack direction="row" className="form_container-row">
              <Box className="form_container-column">
                <Box className="form_container-row-label">
                  <Typography variant="h6">첨부파일</Typography>
                </Box>
                <Box className="form_container-row-content">
                  <Box className="w-full">
                    {isLoadingFiles ? (
                      <Box sx={{ position: "relative", minHeight: 220 }}>
                        <Loader isLoading={true} />
                      </Box>
                    ) : isErrorFiles ? (
                      <Typography variant="default" color="error">
                        파일 목록을 불러오는 중 오류가 발생했습니다:{" "}
                        {errorFiles instanceof Error ? errorFiles.message : "알 수 없는 오류"}
                      </Typography>
                    ) : files.length > 0 ? (
                      <FileContainer files={files} showDeleteButton={false} onClick={handleFileDownload} />
                    ) : (
                      <Typography variant="default">등록된 파일이 없습니다.</Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>

        <SpaceBox gap={CONTENT_GAP.XLARGE} />

        {/* ==============================
          진행상태
      ============================== */}
        <Box component="section" id="content-partner-progress" className={styles.section}>
          <Box className="sub_path">
            <Typography className="tit" variant="h5">
              진행상태
            </Typography>
          </Box>
          {!partnerSubmissionAllowed && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {partnerSubmissionBlockedMessage}
            </Alert>
          )}
          <ContentDisclosurePartnerCustomerProgressPanel
            pblntSn={String(pblntSn)}
            pblntSnId={pblntSnId}
            pblntStcd={disclosure?.pblntStcd}
            rowData={myPartner}
            partnerSubmissionAllowed={partnerSubmissionAllowed}
            hasCdmUploadForPtcpInstSn={hasCdmUploadForPtcpInstSn}
            cdmUploadByPtcpInstSnSize={cdmUploadByPtcpInstSn.size}
            registrationSyncDependency={filesResponse?.data?.data}
          />
        </Box>
      </Box>
    </Fade>
  );
}
