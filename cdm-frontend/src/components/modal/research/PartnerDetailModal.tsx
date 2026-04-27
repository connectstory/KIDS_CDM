import { useCallback, useEffect, useMemo, useState } from "react";
import { ResearchAPI, downloadFileViaProxy } from "@/api";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { STRINGS } from "@/constants/string";
import { CONTENT_GAP, type PROGRESS_STATUS_TYPE, ProgressStatusType } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import type { OpinionListResponse, ResearchPartnerResponse } from "@/interfaces/researchInterface";
import { type RootState } from "@/store";
import { closeModal } from "@/store/modalSlice";
import {
  CdmUploadStatus,
  convertCdmParticipationStatus,
  convertOrgParticipationStatus,
  formatFileSize,
  getCdmParticipationStatusConfig,
  getFileExtension,
  getOrgParticipationStatusConfig,
  isResearchCrudDisabled,
} from "@/utils/common";
import { formatDateTime } from "@/utils/dateUtils";
import { resolveModal } from "@/utils/modalPromise";
import {
  useOpinionByCondition,
  useResearchDetail,
  useResearchFiles,
  useResearchPartner,
} from "@/hooks/research/useResearchQueries";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import { useModal } from "@/hooks/useModal";
import FileContainer, { type FileData } from "@/components/FileContainer";
import FileDropZone from "@/components/FileDropzone";
import Loader from "@/components/Loader";
import { SpaceBox } from "@/components/SpaceBox";
import TextWithLineLimit from "@/components/TextWithLineLimit";
import BaseModal from "@/components/modal/BaseModal";

export interface PartnerDetailModalData {
  partner: ResearchPartnerResponse;
}

export default function PartnerDetailModal() {
  const dispatch = useDispatch();
  // const session = useSelector((state: RootState) => state.session);
  const modal = useSelector((s: RootState) => s.modal.modals[ModalNames.PartnerDetail]);
  const cancelInviteModal = useModal(ModalNames.CancelInvite);
  const irbViewModal = useModal(ModalNames.IrbView);
  const [files, setFiles] = useState<FileData[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { showAlert } = useGlobalAlert();

  // RESEARCH_PARTNER 파일구분코드 (백엔드 FileCodeType.RESEARCH_PARTNER)
  const PARTNER_FILE_SE_CD = "17";

  const { asmtSn } = useParams<{ role: string; asmtSn: string }>();
  const asmtSnNumber = asmtSn ? Number(asmtSn) : null;
  const {
    data: research,
    refetch: refetchResearch,
    isLoading: isLoadingResearch,
    isError: isErrorResearch,
  } = useResearchDetail(asmtSnNumber);
  const modalData = modal?.open ? (modal.data as PartnerDetailModalData) : null;

  const {
    data: partnerDetail,
    refetch: refetchPartner,
    isLoading: isLoadingPartner,
    isError: isErrorPartner,
  } = useResearchPartner(asmtSnNumber, modalData?.partner?.asmtPtcpInstSn);
  const {
    data: excludeOpinionList,
    refetch: refetchOpinion,
    isLoading: isLoadingOpinions,
    isError: isErrorOpinions,
  } = useOpinionByCondition(asmtSnNumber, modalData?.partner?.instId);

  const {
    data: partnerFiles = [],
    refetch: refetchPartnerFiles,
    isLoading: isLoadingPartnerFiles,
    isError: isErrorPartnerFiles,
  } = useResearchFiles(
    asmtSnNumber,
    PARTNER_FILE_SE_CD,
    "01",
    !!asmtSnNumber && !!modalData?.partner?.asmtPtcpInstSn,
    modalData?.partner?.asmtPtcpInstSn as number | undefined
  );

  /* 모달 마운트(열릴 때)마다 연구과제/참여기관/의견 목록 조회 갱신 */
  useEffect(() => {
    if (!modal?.open || asmtSnNumber == null) return;
    refetchResearch();
    refetchPartner();
    refetchOpinion();
  }, [modal?.open, asmtSnNumber, refetchResearch, refetchPartner, refetchOpinion]);

  const handleClose = useCallback(
    (result: boolean) => {
      resolveModal(ModalNames.PartnerDetail, result);
      dispatch(closeModal(ModalNames.PartnerDetail));
    },
    [dispatch]
  );

  type Row = OpinionListResponse;

  /**
   * 통합분석결과 제외 신청 이력 그리드 컬럼 (검토결과·신청내용·등록정보·이동)
   */
  const colDefs = useMemo<ColDef<Row>[]>(() => {
    const getRsltGroupCdLabel = (rsltGroupCd?: string | null) => {
      if (!rsltGroupCd) return "-";
      if (rsltGroupCd === "04") return "메타분석";
      if (rsltGroupCd === "02") return "통합분석";
      return rsltGroupCd;
    };

    return [
      {
        headerName: "분석 종류",
        headerClass: "ag-header-center",
        field: "rsltGroupCd",
        minWidth: 100,
        maxWidth: 100,
        cellStyle: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center" as const,
          textAlign: "center" as const,
        },
        cellRenderer: (params: ICellRendererParams<Row>) => {
          return <Typography variant="h6">{getRsltGroupCdLabel(params.data?.rsltGroupCd)}</Typography>;
        },
      },
      {
        headerName: "내용",
        field: "opnnIntgDmndCn",
        flex: 2,
        minWidth: 200,
        autoHeight: true,
        wrapText: true,
        cellRenderer: (params: ICellRendererParams<Row>) => (
          <TextWithLineLimit text={params.data?.opnnIntgDmndCn} maxLines={4} variant="description" />
        ),
      },
      {
        headerName: "등록자",
        field: "mdfrNm",
        flex: 1,
        valueFormatter: (params) => params.value || "-",
      },
      {
        headerName: "등록일시",
        field: "regDt",
        flex: 1,
        valueFormatter: (params) => (params.value ? formatDateTime(params.value) : "-"),
      },
      // {
      //   headerName: "",
      //   flex: 1,
      //   cellStyle: {
      //     display: "flex",
      //     justifyContent: "end",
      //     alignItems: "center" as const,
      //     textAlign: "center" as const,
      //   },
      //   cellRenderer: (params: ICellRendererParams<Row>) => (
      //     <Button
      //       variant="outlined"
      //       size="small"
      //       onClick={() => {
      //         if (params.data?.asmtMetaRsltSn) {
      //           // 기존 모달 닫기
      //           handleClose(false);
      //           // 새 모달 열기
      //           cdmDataManagementModal.open({
      //             data: {
      //               asmtMetaRsltSn: params.data.asmtMetaRsltSn,
      //             },
      //           });
      //         }
      //       }}
      //     >
      //       통합분석결과로 이동
      //     </Button>
      //   ),
      // },
    ];
  }, []);

  const rows: Row[] = excludeOpinionList ?? [];

  /** 참여요청(REQUEST_INVITE) 또는 참여취소(CANCEL_INVITE) 상태일 때 통합분석결과 제외 신청 이력·공유파일 섹션 숨김 */
  const hideSectionsStatuses: PROGRESS_STATUS_TYPE[] = [ProgressStatusType.REQUEST_INVITE, ProgressStatusType.CANCEL_INVITE];
  const isRequestOrCancelInviteStatus =
    partnerDetail &&
    (partnerDetail.uldTypeCd === CdmUploadStatus.CDM
      ? hideSectionsStatuses.includes(convertCdmParticipationStatus(partnerDetail.ptcpPrgrsSttsCd))
      : hideSectionsStatuses.includes(convertOrgParticipationStatus(partnerDetail.ptcpPrgrsSttsCd)));

  const isResearchClosed = isResearchCrudDisabled(research?.asmtPrgrsSttsCd);

  if (!modal?.open || !modalData) return null;

  const anyLoading = isLoadingResearch || isLoadingPartner || isLoadingOpinions || isLoadingPartnerFiles;
  const anyError = isErrorResearch || isErrorPartner || isErrorOpinions || isErrorPartnerFiles;

  // ------------------------------
  // 파일 업로드 핸들러
  // ------------------------------
  const handleFileDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const newFileDatas: FileData[] = acceptedFiles.map((file) => ({
      name: file.name,
      ext: getFileExtension(file.name),
      size: formatFileSize(file.size),
    }));
    setFiles((prev) => [...prev, ...newFileDatas]);
    setUploadFiles((prev) => [...prev, ...acceptedFiles]);
  };

  // ------------------------------
  // 파일 삭제 핸들러
  // ------------------------------
  const handleFileDelete = (fileToDelete: FileData) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileToDelete.name));
    setUploadFiles((prev) => prev.filter((f) => f.name !== fileToDelete.name));
  };

  // ------------------------------
  // 기존 공유파일 삭제 핸들러
  // ------------------------------
  const handleExistingPartnerFileDelete = async (file: FileData) => {
    if (!asmtSnNumber) {
      showAlert({ message: "연구과제 정보가 없습니다.", severity: "error" });
      return;
    }
    const asmtPtcpInstSn = modalData?.partner?.asmtPtcpInstSn as number | undefined;
    if (!asmtPtcpInstSn) {
      showAlert({ message: "참여기관 정보가 없습니다.", severity: "error" });
      return;
    }
    if (!file.atchFileId) {
      showAlert({ message: "파일 정보가 없습니다.", severity: "error" });
      return;
    }
    if (!window.confirm(`"${file.name}" 파일을 삭제하시겠습니까?`)) {
      return;
    }

    setSubmitting(true);
    try {
      await ResearchAPI.deletePartnerFile(asmtSnNumber, asmtPtcpInstSn, file.atchFileId);
      await refetchPartnerFiles();
      showAlert({ message: "공유파일이 삭제되었습니다.", severity: "success" });
    } catch {
      showAlert({ message: "공유파일 삭제에 실패했습니다.", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadPartnerFiles = async () => {
    if (!asmtSnNumber) {
      showAlert({ message: "연구과제 정보가 없습니다.", severity: "error" });
      return;
    }
    if (uploadFiles.length === 0) {
      showAlert({ message: "업로드할 파일을 추가해주세요.", severity: "warning" });
      return;
    }
    if (!modalData?.partner?.asmtPtcpInstSn) {
      showAlert({ message: "참여기관 정보가 없습니다.", severity: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await ResearchAPI.uploadPartnerFiles(asmtSnNumber, modalData.partner.asmtPtcpInstSn as number, uploadFiles);
      await refetchPartnerFiles();
      showAlert({ message: "공유파일이 업로드되었습니다.", severity: "success" });
      setUploadFiles([]);
      setFiles([]);
    } catch {
      showAlert({ message: "공유파일 업로드에 실패했습니다.", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleShowCancelInviteModal = async () => {
    const result = await cancelInviteModal.open({
      data: {
        partner: modalData?.partner,
      },
    });

    if (result) {
      handleClose(true);
    }
  };

  return (
    <BaseModal open={modal.open} onClose={() => handleClose(false)} title="참여기관 정보" width="md" fullWidth={true}>
      <Box>
        <Stack direction="column" spacing={CONTENT_GAP.XSMALL}>
          <Typography variant="subtitle">{research?.asmtNm || ""}</Typography>
          <Typography variant="default">{modalData?.partner.instNm || ""}</Typography>
        </Stack>

        <SpaceBox gap={CONTENT_GAP.LARGE} />

        {anyLoading && (
          <Box sx={{ position: "relative", minHeight: 320 }}>
            <Loader isLoading={true} />
          </Box>
        )}

        {!anyLoading && anyError && (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Typography color="text.secondary">정보를 불러오지 못했습니다.</Typography>
          </Box>
        )}

        {!anyLoading && !anyError && (
          <>
            {/* ==============================
              참여기관 정보
            ============================== */}

            {partnerDetail && (
          <Box>
            <Box className="sub_path">
              <Typography className="tit" variant="h5">
                {STRINGS.PARTNER} {STRINGS.INFO}
              </Typography>
            </Box>

            <Box className="form_container">
              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography variant="h6">{STRINGS.PARTNER_STATUS}</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    {partnerDetail.uldTypeCd === CdmUploadStatus.CDM ? (
                      <Chip
                        size="small"
                        label={getCdmParticipationStatusConfig(partnerDetail?.ptcpPrgrsSttsCd)?.label ?? ""}
                        sx={getCdmParticipationStatusConfig(partnerDetail?.ptcpPrgrsSttsCd)?.chipStyle ?? {}}
                      />
                    ) : (
                      <Chip
                        size="small"
                        label={getOrgParticipationStatusConfig(partnerDetail?.ptcpPrgrsSttsCd)?.label ?? ""}
                        sx={getOrgParticipationStatusConfig(partnerDetail?.ptcpPrgrsSttsCd)?.chipStyle ?? {}}
                      />
                    )}
                  </Box>
                </Box>
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography variant="h6">{STRINGS.JOIN_DATE}</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <Typography variant="default">{formatDateTime(partnerDetail.asmtPtcpAgreDt) || "-"}</Typography>
                  </Box>
                </Box>
              </Stack>
              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography variant="h6">{STRINGS.DATA_UPLOAD_STATUS}</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <Typography variant="default">
                      {partnerDetail.uldTypeCd ? CdmUploadStatus[partnerDetail.uldTypeCd as keyof typeof CdmUploadStatus] : "-"}
                    </Typography>
                  </Box>
                </Box>

                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography variant="h6">
                      {STRINGS.IRB}/{STRINGS.DRB}
                    </Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <Typography variant="default">
                      {(partnerDetail.irbFiles?.length ?? 0) > 0 ? (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            irbViewModal.open({
                              showHeaderCloseButton: true,
                              data: {
                                name: partnerDetail.instNm,
                                asmtSn: asmtSnNumber ?? undefined,
                                asmtPtcpInstSn: partnerDetail.asmtPtcpInstSn,
                              },
                            });
                          }}
                        >
                          {STRINGS.CHECK_INFO}
                        </Button>
                      ) : (
                        STRINGS.NOT_REGISTERED
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        )}

        <SpaceBox gap={CONTENT_GAP.XLARGE} />

        {/* ==============================
          참여취소 정보
        ============================== */}
        {partnerDetail && (
          <Box>
            <Box className="flex items-start justify-between pb-1">
              <Box className="sub_path">
                <Typography className="tit" variant="h5">
                  {STRINGS.CANCEL_INVITE} {STRINGS.INFO}
                </Typography>
              </Box>
              {/* {research?.instId === session.instId && !partnerDetail.asmtPtcpRtrcnId && ( */}
              {!partnerDetail.asmtPtcpRtrcnId && (
                <Button variant="outlined" color="primary" onClick={handleShowCancelInviteModal} disabled={isResearchClosed}>
                  참여취소
                </Button>
              )}
            </Box>
            <Box className="form_container">
              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography variant="h6">{STRINGS.REGISTERED_BY}</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <Typography variant="default">
                      {partnerDetail.asmtPtcpRtrcnNm || partnerDetail.asmtPtcpRtrcnId || "-"}
                    </Typography>
                  </Box>
                </Box>
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography variant="h6">{STRINGS.REGISTERED_AT}</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <Typography variant="default">{formatDateTime(partnerDetail.asmtPtcpRtrcnDt) || "-"}</Typography>
                  </Box>
                </Box>
              </Stack>
              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography variant="h6">{STRINGS.CONTENT}</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <Typography component="pre" variant="default">
                      {partnerDetail.asmtPtcpRtrcnRsn || "-"}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        )}

        {!isRequestOrCancelInviteStatus && (
          <>
            <SpaceBox gap={CONTENT_GAP.XLARGE} />

            {/* ==============================
              통합분석결과 제외 신청 이력
            ============================== */}
            <Box>
              <Stack direction="column" spacing={0.5}>
                <Box className="sub_path">
                  <Typography className="tit" variant="h5">
                    통합분석결과 제외/연구결과(메타분석) 활용미동의 신청 이력
                  </Typography>
                </Box>
                <Typography variant="description">
                  데이터 업로드 상태가 CDM인 참여기관이 통합분석결과에서 결과제외 및 연구결과(메타분석) 활용미동의를 신청한
                  이력입니다.
                </Typography>
              </Stack>

              <Box className="form_container">
                <div className="ag-theme-cdm w-full">
                  <AgGridReact<Row>
                    rowData={rows}
                    columnDefs={colDefs}
                    getRowId={(params) => String(params.data.opnnIntgRsltSn)}
                    detailRowHeight={150}
                    domLayout="autoHeight"
                    overlayNoRowsTemplate={`<span style="padding:8px;">데이터가 없습니다.</span>`}
                  />
                </div>
              </Box>
            </Box>

            <SpaceBox gap={CONTENT_GAP.XLARGE} />

            {/* ==============================
              공유파일
            ============================== */}
            <Box>
              <Box className="sub_path">
                <Typography className="tit" variant="h5">
                  공유파일
                </Typography>
              </Box>

              <Box>
                {/* 서버에 저장된 기존 공유파일 (해당 참여기관 기준) */}
                {partnerFiles.length > 0 && (
                  <>
                    <FileContainer
                      files={partnerFiles.map((f) => ({
                        name: f.fileNm,
                        ext: f.fileExtNm ?? getFileExtension(f.fileNm),
                        size: formatFileSize(f.fileSz ?? 0),
                        atchFileId: f.atchFileId,
                      }))}
                      showDeleteButton={!isResearchClosed}
                      onDelete={handleExistingPartnerFileDelete}
                      onClick={(file) => {
                        if (!file.atchFileId) return;
                        downloadFileViaProxy(file.atchFileId, file.name);
                      }}
                    />
                    <SpaceBox gap={CONTENT_GAP.XSMALL} />
                  </>
                )}

                {/* 현재 세션에서 추가한 파일 (업로드 대기 중) */}
                <FileContainer files={files} showDeleteButton={true} onDelete={handleFileDelete}></FileContainer>
                <SpaceBox gap={CONTENT_GAP.SMALL} />
                {/* 파일 업로드 영역 */}
                <FileDropZone onDrop={handleFileDrop} disabled={isResearchClosed} />
                <SpaceBox gap={CONTENT_GAP.SMALL} />
                <Button
                  variant="contained"
                  onClick={handleUploadPartnerFiles}
                  disabled={submitting || uploadFiles.length === 0 || isResearchClosed}
                >
                  {submitting ? "업로드 중..." : "업로드"}
                </Button>
              </Box>
            </Box>
          </>
            )}
          </>
        )}
      </Box>

      {/* <Loader isLoading={isLoadingPartnerDetail} /> */}

      <SpaceBox gap={CONTENT_GAP.LARGE} />
    </BaseModal>
  );
}
