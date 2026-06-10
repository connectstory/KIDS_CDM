import { useEffect, useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { MSG, STRINGS } from "@/constants/string";
import { CONTENT_GAP, DISCLOSURE_PBLNT_STATUS_CODE, ROLE_TYPE as RoleType } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface.ts";
import { downloadFileViaProxy } from "@/api/commonApi";
import { DisclosureAPI } from "@/api/disclosureApi";
import type { RootState } from "@/store";
import {
  buildPath,
  formatFileSize,
  getDisclosureDetailAdminActionFlags,
  getDisclosurePblntStatusConfig,
  getFileExtension,
  isDeletedYn,
  isDisclosurePartnerUploadFileSeCd,
  isDisclosurePblntClosed,
} from "@/utils/common";
import { formatDate, formatDateTime } from "@/utils/dateUtils";
import { disclosureKeys } from "@/hooks/disclosure/disclosureQueryKeys";
import { useCloseDisclosure, useDeleteDisclosure, useUpdateDisclosureStatus } from "@/hooks/disclosure/useDisclosureMutations";
import { useDisclosureDetail, useDisclosureFiles, useDisclosurePartners } from "@/hooks/disclosure/useDisclosureQueries";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import FileContainer, { type FileData } from "@/components/FileContainer";
import Loader from "@/components/Loader";
import { SpaceBox } from "@/components/SpaceBox";
import { AppButton, AppStatusChip } from "@/components/ui";
import DisclosurePartnerSection from "./components/ContentDisclosurePartners";

export default function DisclosureDetailAdmin() {
  // 라우팅 파라미터
  const { pblntSn } = useParams<{ pblntSn: string }>();
  const pblntSnId = pblntSn ? Number(pblntSn) : NaN;

  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const confirmModal = useModal(ModalNames.CONFIRM);
  const queryClient = useQueryClient();
  const session = useSelector((state: RootState) => state.session);

  const { data: disclosure, isLoading, isError, refetch: refetchDisclosure } = useDisclosureDetail(pblntSn);

  // 파일 목록 조회
  const {
    data: fileList = [],
    isLoading: isLoadingFiles,
    isError: isErrorFiles,
    error: errorFiles,
  } = useDisclosureFiles(pblntSn, null);

  /** 참여기관 — 섹션과 동일 쿼리키·enabled(관리자)로 묶어 초기 로딩을 한 번에 맞춤 */
  const { isLoading: isLoadingPartners } = useDisclosurePartners(pblntSn, session.userType === RoleType.ADMIN);

  const deleteDisclosureMutation = useDeleteDisclosure();
  const closeDisclosureMutation = useCloseDisclosure();
  const updateDisclosureStatusMutation = useUpdateDisclosureStatus();

  // 파일 목록 데이터 변환 (파일명, 링크, 용량만 표시)
  const files: FileData[] = useMemo(() => {
    if (!Array.isArray(fileList)) {
      return [];
    }

    const mappedFiles = fileList
      .map((file: any) => {
        if (isDeletedYn(file.delYn)) return null;
        if (isDisclosurePartnerUploadFileSeCd(file.fileSeCd)) return null;

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
  }, [fileList]);

  /** 공시진행상태코드 (한 자리면 0패딩 후 상수와 비교) */
  const pblntStcdN = useMemo(() => {
    const raw = disclosure?.pblntStcd != null ? String(disclosure.pblntStcd).trim() : "";
    if (!raw) return "";
    return raw.length === 1 ? `0${raw}` : raw;
  }, [disclosure?.pblntStcd]);

  const {
    showStartButton: showDisclosureStartButton,
    showCloseButton: showDisclosureCloseButton,
    closeDisabledByStatus,
  } = useMemo(() => getDisclosureDetailAdminActionFlags(pblntStcdN), [pblntStcdN]);

  const disclosureCloseDisabled = closeDisabledByStatus || closeDisclosureMutation.isPending;
  const disclosureCancelDisabled =
    isDisclosurePblntClosed(disclosure?.pblntStcd) || deleteDisclosureMutation.isPending;

  // 파일 처리 핸들러
  // 파일 다운로드 핸들러
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

  // 공시 수정 핸들러
  const handleEditDisclosure = () => {
    if (!pblntSn) return;
    navigate(buildPath(routes.CDM.DISCLOSURE_EDIT, { pblntSn }));
  };

  // 공시 액션 핸들러 (Mutation)
  const handleDeleteDisclosure = async () => {
    if (!pblntSn) return;
    if (isDisclosurePblntClosed(disclosure?.pblntStcd)) {
      showAlert({ message: "마감된 공시는 취소할 수 없습니다.", severity: "warning" });
      return;
    }
    const result = await confirmModal.open({
      title: STRINGS.CONFIRM,
      message: MSG.CONFIRM_DELETE,
      width: "max-w-[30rem]",
    });
    if (!result) return;
    await deleteDisclosureMutation.mutateAsync(pblntSnId);
    navigate(routes.CDM.DISCLOSURES);
  };

  // 공시 마감 핸들러
  const handleCloseDisclosure = async () => {
    if (!pblntSn) return;
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
      await closeDisclosureMutation.mutateAsync({ pblntSn: pblntSnId });
      await refetchDisclosure();
      // 참여기관 목록은 하위 섹션에서 조회하므로 쿼리 invalidate로 갱신 트리거
      queryClient.invalidateQueries({ queryKey: disclosureKeys.partners(pblntSn), exact: true });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "공시마감 중 오류가 발생했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    }
  };

  // 공시 시작 핸들러
  const handleStartDisclosure = async () => {
    if (pblntStcdN === DISCLOSURE_PBLNT_STATUS_CODE.IN_PROGRESS) {
      showAlert({ message: "공시는 이미 진행중 상태입니다.", severity: "warning" });
      return;
    }
    if (pblntStcdN === DISCLOSURE_PBLNT_STATUS_CODE.CLOSED) {
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
    if (!pblntSn) {
      showAlert({ message: "공시일련번호가 없습니다.", severity: "error" });
      return;
    }
    const result = await confirmModal.open({
      title: STRINGS.CONFIRM,
      message: "공시를 진행중으로 변경하시겠습니까?",
      width: "max-w-[30rem]",
    });
    if (!result) return;
    try {
      await updateDisclosureStatusMutation.mutateAsync({
        pblntSn: pblntSnId,
        pblntStcd: DISCLOSURE_PBLNT_STATUS_CODE.IN_PROGRESS,
      });
      await refetchDisclosure();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "공시 상태 변경 중 오류가 발생했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    }
  };

  const disclosureStatusConfig = getDisclosurePblntStatusConfig(disclosure?.pblntStcd);

  /** 공시 상세 + 첨부파일 + 참여기관(관리자 조회) 초기 요청이 모두 끝난 뒤에 본문 표시 */
  const isBlockingInitialLoad = isLoading || (!!disclosure && (isLoadingFiles || isLoadingPartners));

  useEffect(() => {
    document.title = "공시정보 - CDM 데이터 업로드 등록 안내";
  }, []);

  useEffect(() => {
    if (pblntSn) return;
    navigate(routes.CDM.DISCLOSURES);
  }, [pblntSn, navigate, routes]);

  useEffect(() => {
    if (!pblntSn) return;
    if (isBlockingInitialLoad) return;
    if (!isError && disclosure) return;

    showAlert({ message: "CDM 업로드 공시를 찾을 수 없습니다.", severity: "error" });
    navigate(routes.CDM.DISCLOSURES);
  }, [pblntSn, isBlockingInitialLoad, isError, disclosure, showAlert, navigate, routes]);

  if (!pblntSn) {
    return null;
  }

  if (isBlockingInitialLoad) {
    return (
      <Box sx={{ position: "relative", minHeight: "400px" }}>
        <Loader isLoading={true} />
      </Box>
    );
  }

  if (isError || !disclosure) {
    return null;
  }

  return (
    <Box>
      <Helmet>
        <title>CDM - CDM 업로드 공시</title>
      </Helmet>
      {/* ==============================
          헤더
      ============================== */}
      <Box className="btn_container">
        <Stack direction="column" spacing={1}>
          <Typography variant="h2">{disclosure.ttlNm || "-"}</Typography>
        </Stack>
        <Stack className="btn_wrapper tbl_top" direction="row">
          <AppButton
            variant="outlined"
            size="medium"
            disabled={isDisclosurePblntClosed(disclosure?.pblntStcd)}
            onClick={handleEditDisclosure}
          >
            수정
          </AppButton>
          <AppButton variant="outlined" size="medium" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
            목록
          </AppButton>
        </Stack>
      </Box>
      <SpaceBox gap={CONTENT_GAP.LARGE} />

      {/* ==============================
          공시 내용
      ============================== */}

      <Box component="section" id="content-desc">
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            공시내용
          </Typography>
        </Box>

        <Box className="form_container">
          {/* ContentDesc 과제 내용 1: 등록기관 | 등록자 → 구분 | 작성자 */}
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
                <Typography variant="h6">{STRINGS.REGISTERED_BY}</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Typography variant="default">
                  {disclosure.rgtrNm != null && String(disclosure.rgtrNm).trim() !== "" ? String(disclosure.rgtrNm).trim() : "-"}
                </Typography>
              </Box>
            </Box>
          </Stack>

          {/* ContentDesc 과제 내용 2: 등록일시 */}
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">{STRINGS.REGISTERED_AT}</Typography>
              </Box>
              <Box className="form_container-row-content">
                <Typography variant="default">{formatDateTime(disclosure.regYmd)}</Typography>
              </Box>
            </Box>
          </Stack>

          {/* ContentDesc 과제 내용 3: 상태 → 진행상태 */}
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
          </Stack>

          {/* ContentDesc 과제 내용 4: 내용 */}
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">{STRINGS.CONTENT}</Typography>
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

          {/* ContentDesc 과제 내용 5: 연구기간 → 공시 기간 */}
          <Stack direction="row" className="form_container-row">
            <Box className="form_container-column">
              <Box className="form_container-row-label">
                <Typography variant="h6">공시 기간</Typography>
              </Box>
              <Box className="form_container-row-content" gap={1}>
                {disclosure.pblntBgngYmd && disclosure.pblntEndYmd ? (
                  <>
                    <Typography variant="default">{formatDate(disclosure.pblntBgngYmd)}</Typography>
                    <Typography variant="default">~</Typography>
                    <Typography variant="default">{formatDate(disclosure.pblntEndYmd)}</Typography>
                  </>
                ) : (
                  <Typography variant="default">-</Typography>
                )}
              </Box>
            </Box>
          </Stack>

          {/* ContentDesc 과제 내용 6: 첨부파일 */}
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

      <SpaceBox gap={CONTENT_GAP.SMALL} />

      {/* ==============================
          상태 버튼 (ResearchDetail 과제 액션 영역과 동일 패턴)
      ============================== */}
      <Box id="content-status-btn" className="btn_container btn_right">
        {showDisclosureStartButton && (
          <AppButton variant="contained" size="medium" onClick={handleStartDisclosure}>
            <i className="fa-regular fa-circle-check mr-2"></i>
            <Typography variant="default">공시 시작</Typography>
          </AppButton>
        )}
        {showDisclosureCloseButton && (
          <AppButton
            variant="contained"
            size="medium"
            color="error"
            disabled={disclosureCloseDisabled}
            onClick={handleCloseDisclosure}
          >
            <i className="fa-regular fa-circle-check mr-2"></i>
            <Typography variant="default">{closeDisclosureMutation.isPending ? "마감 처리 중..." : "공시 마감"}</Typography>
          </AppButton>
        )}
        <AppButton
          variant="containedGray"
          color="secondary"
          size="medium"
          onClick={handleDeleteDisclosure}
          disabled={disclosureCancelDisabled}
        >
          <i className="fa-solid fa-ban mr-2"></i>
          <Typography variant="default">공시 취소</Typography>
        </AppButton>
      </Box>

      <SpaceBox gap={CONTENT_GAP.XLARGE} />

      {/* ==============================
          참여기관
      ============================== */}
      <DisclosurePartnerSection skipInitialLoader />
    </Box>
  );
}
