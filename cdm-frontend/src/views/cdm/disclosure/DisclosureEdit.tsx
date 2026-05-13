import { useEffect, useMemo, useState } from "react";
import { Box, Fade, MenuItem, Select, Stack, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { koKR } from "@mui/x-date-pickers/locales";
import { useQueryClient } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/ko";
import { Helmet } from "react-helmet";
import { useNavigate, useParams } from "react-router-dom";
import { STRINGS } from "@/constants/string";
import { CONTENT_GAP } from "@/constants/types";
import type { DisclosureCreateRequest, DisclosureUpdateRequest } from "@/interfaces/disclosureInterface";
import { DisclosureAPI } from "@/api/disclosureApi";
import { buildPath, formatFileSize, getFileExtension } from "@/utils/common";
import { formatDateFromYYYYMMDD, formatDateToYYYYMMDD, validateDateRange } from "@/utils/dateUtils";
import {
  DISCLOSURE_ATTACHMENT_EXTENSIONS,
  DISCLOSURE_ATTACHMENT_REJECT_MSG,
  isAllowedDisclosureAttachment,
} from "@/utils/disclosureAttachment";
import { disclosureKeys } from "@/hooks/disclosure/disclosureQueryKeys";
import { useUpdateDisclosure, useUploadDisclosureFiles } from "@/hooks/disclosure/useDisclosureMutations";
import { useDisclosureDetail, useDisclosureFiles } from "@/hooks/disclosure/useDisclosureQueries";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import FileContainer, { type FileData } from "@/components/FileContainer";
import FileDropZone from "@/components/FileDropzone";
import Loader from "@/components/Loader";
import { SpaceBox } from "@/components/SpaceBox";
import { AppButton, AppTextField } from "@/components/ui";

export default function DisclosureEdit() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const queryClient = useQueryClient();

  const { pblntSn } = useParams<{ pblntSn: string }>();
  const pblntSnId = pblntSn ? Number(pblntSn) : NaN;
  const hasValidPblntSn = !!pblntSn && !Number.isNaN(pblntSnId);

  const { data: disclosure, isLoading: isLoadingDetail, isError: isDetailError } = useDisclosureDetail(pblntSn);
  const {
    data: rawFileList = [],
    isLoading: isLoadingFiles,
    isError: isErrorFiles,
    error: errorFiles,
  } = useDisclosureFiles(pblntSn, null);

  const updateDisclosure = useUpdateDisclosure();
  const uploadDisclosureFiles = useUploadDisclosureFiles();

  // 오늘 날짜를 기본값으로 설정
  const today = dayjs();
  const todayStr = formatDateToYYYYMMDD(today.format("YYYY-MM-DD"));

  const [formData, setFormData] = useState<DisclosureCreateRequest>({
    ttlNm: "",
    pblntDvcd: "02",
    pblntCn: "",
    pblntBgngYmd: todayStr,
    pblntEndYmd: todayStr,
    pblntStcd: "01",
  });

  const [startDate, setStartDate] = useState<Dayjs | null>(today);
  const [endDate, setEndDate] = useState<Dayjs | null>(today);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newFiles, setNewFiles] = useState<FileData[]>([]);
  const [newFileObjects, setNewFileObjects] = useState<File[]>([]);

  useEffect(() => {
    if (!disclosure) return;
    setFormData({
      ttlNm: disclosure.ttlNm || "",
      pblntDvcd: disclosure.pblntDvcd || "02",
      pblntCn: disclosure.pblntCn || "",
      pblntBgngYmd: disclosure.pblntBgngYmd || "",
      pblntEndYmd: disclosure.pblntEndYmd || "",
      pblntStcd: disclosure.pblntStcd || "01",
    });
    if (disclosure.pblntBgngYmd) setStartDate(dayjs(formatDateFromYYYYMMDD(disclosure.pblntBgngYmd)));
    if (disclosure.pblntEndYmd) setEndDate(dayjs(formatDateFromYYYYMMDD(disclosure.pblntEndYmd)));
  }, [disclosure]);

  const existingFiles: FileData[] = useMemo(() => {
    if (!Array.isArray(rawFileList)) return [];
    return rawFileList
      .map((file: any) => {
        const delYn = file.delYn;
        if (delYn === "Y" || delYn === "y") return null;

        const strgFileNm =
          (file.strgFileNm && String(file.strgFileNm).trim()) || (file.strgfilenm && String(file.strgfilenm).trim()) || "";
        const atchFileSn =
          (file.atchFileSn && String(file.atchFileSn).trim()) || (file.atchfilesn && String(file.atchfilesn).trim()) || "";
        const atchFileId =
          (file.atchFileId && String(file.atchFileId).trim()) || (file.atchfileid && String(file.atchfileid).trim()) || "";

        const originalName = atchFileSn !== "" ? atchFileSn : strgFileNm;
        const downloadParam = atchFileId !== "" ? atchFileId : strgFileNm !== "" ? strgFileNm : originalName;
        if (!originalName || String(originalName).trim() === "") return null;

        const ext = getFileExtension(originalName);
        const fileSeCd = file.fileSeCd || "";
        const fileSize = file.fileSz || null;

        return {
          name: originalName,
          ext: ext || fileSeCd,
          size: formatFileSize(fileSize),
          showDeleteButton: true,
          atchFileSn: downloadParam,
          downloadAs: originalName,
          atchFileId: atchFileId || undefined,
        } as FileData & { atchFileSn: string; downloadAs?: string; atchFileId?: string };
      })
      .filter((f: FileData | null) => f !== null) as FileData[];
  }, [rawFileList]);

  const handleStartDateChange = (date: Dayjs | null) => {
    setStartDate(date);
    if (date) {
      setFormData((prev) => ({ ...prev, pblntBgngYmd: formatDateToYYYYMMDD(date.format("YYYY-MM-DD")) }));
      if (errors.pblntBgngYmd) setErrors((prev) => ({ ...prev, pblntBgngYmd: "" }));
      return;
    }
    setFormData((prev) => ({ ...prev, pblntBgngYmd: "" }));
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    setEndDate(date);
    if (date) {
      setFormData((prev) => ({ ...prev, pblntEndYmd: formatDateToYYYYMMDD(date.format("YYYY-MM-DD")) }));
      if (errors.pblntEndYmd || errors.dateRange) setErrors((prev) => ({ ...prev, pblntEndYmd: "", dateRange: "" }));
      return;
    }
    setFormData((prev) => ({ ...prev, pblntEndYmd: "" }));
  };

  const onFileDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      if (newFiles.some((f) => f.name === file.name) || existingFiles.some((f) => f.name === file.name)) {
        showAlert({ message: `이미 추가된 파일입니다: ${file.name}`, severity: "warning" });
        return;
      }
      if (!isAllowedDisclosureAttachment(file.name)) {
        showAlert({ message: DISCLOSURE_ATTACHMENT_REJECT_MSG, severity: "warning" });
        return;
      }
      const fileData: FileData = {
        name: file.name,
        ext: getFileExtension(file.name),
        size: formatFileSize(file.size),
        showDeleteButton: true,
      };
      setNewFiles((prev) => [...prev, fileData]);
      setNewFileObjects((prev) => [...prev, file]);
    });
  };

  const onNewFileDelete = (file: FileData) => {
    setNewFiles((prev) => prev.filter((f) => f.name !== file.name));
    setNewFileObjects((prev) => prev.filter((f) => f.name !== file.name));
  };

  const handleExistingFileDownload = async (file: FileData) => {
    try {
      const fileWithSn = file as FileData & { atchFileSn?: string; downloadAs?: string };
      const downloadFileName = fileWithSn.atchFileSn || file.name;
      if (!downloadFileName || downloadFileName.trim() === "" || downloadFileName === "파일") {
        showAlert({ message: "파일명을 찾을 수 없습니다.", severity: "error" });
        return;
      }

      if (!pblntSn) {
        showAlert({ message: "공시번호가 없습니다.", severity: "error" });
        return;
      }
      const response = await DisclosureAPI.downloadFile(downloadFileName, pblntSn);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileWithSn.downloadAs || file.name || downloadFileName;
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

  const handleExistingFileDelete = async (file: FileData) => {
    if (!hasValidPblntSn || !pblntSn) {
      showAlert({ message: "공시번호가 올바르지 않습니다.", severity: "error" });
      return;
    }
    const fileWithId = file as FileData & { atchFileId?: string };
    const atchFileId = fileWithId.atchFileId;
    if (!atchFileId || atchFileId.trim() === "") {
      showAlert({ message: "파일 ID를 찾을 수 없습니다.", severity: "error" });
      return;
    }
    if (!window.confirm(`파일 "${file.name}"을(를) 삭제하시겠습니까?`)) return;

    try {
      await DisclosureAPI.deleteFile(pblntSnId, atchFileId);
      showAlert({ message: "파일이 삭제되었습니다.", severity: "success" });
      queryClient.invalidateQueries({ queryKey: disclosureKeys.files(pblntSn, null) });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "파일 삭제 중 오류가 발생했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.ttlNm.trim()) newErrors.ttlNm = "공시명을 입력해주세요.";
    if (!formData.pblntDvcd) newErrors.pblntDvcd = "구분을 선택해주세요.";
    if (!formData.pblntBgngYmd) newErrors.pblntBgngYmd = "공시 시작일자를 선택해주세요.";
    if (!formData.pblntEndYmd) newErrors.pblntEndYmd = "공시 종료일자를 선택해주세요.";
    if (formData.pblntBgngYmd && formData.pblntEndYmd && !validateDateRange(formData.pblntBgngYmd, formData.pblntEndYmd)) {
      newErrors.dateRange = "종료일자는 시작일자 이후여야 합니다.";
    }
    if (!formData.pblntCn.trim()) newErrors.pblntCn = "내용을 입력해주세요.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!hasValidPblntSn || !pblntSn) {
      showAlert({ message: "공시번호가 올바르지 않습니다.", severity: "error" });
      return;
    }
    if (!validateForm()) {
      showAlert({ message: "입력 정보를 확인해주세요.", severity: "error" });
      return;
    }

    const updateData: DisclosureUpdateRequest = {
      ttlNm: formData.ttlNm,
      pblntDvcd: formData.pblntDvcd,
      pblntCn: formData.pblntCn,
      pblntBgngYmd: formData.pblntBgngYmd,
      pblntEndYmd: formData.pblntEndYmd,
      pblntStcd: formData.pblntStcd || "01",
    };

    await updateDisclosure.mutateAsync({ pblntSn: pblntSnId, data: updateData });

    if (newFileObjects.length > 0) {
      try {
        await uploadDisclosureFiles.mutateAsync({ pblntSn: pblntSnId, files: newFileObjects, fileSeCd: "06" });
        showAlert({ message: "공시 및 파일이 성공적으로 수정되었습니다.", severity: "success" });
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "파일 업로드 중 오류가 발생했습니다.";
        showAlert({ message: `공시는 수정되었으나 파일 업로드 중 오류가 발생했습니다: ${errorMessage}`, severity: "warning" });
      }
    } else {
      showAlert({ message: "공시가 성공적으로 수정되었습니다.", severity: "success" });
    }

    navigate(buildPath(routes.CDM.DISCLOSURE_DETAIL, { pblntSn }));
  };

  useEffect(() => {
    document.title = "CDM - 공시 수정";
  }, []);

  if (!pblntSn) {
    navigate(routes.CDM.DISCLOSURES);
    return null;
  }

  return (
    <Box>
      <Helmet>
        <title>CDM - 공시 수정</title>
      </Helmet>

      {isLoadingDetail && (
        <Box sx={{ position: "relative", minHeight: 480 }}>
          <Loader isLoading={true} />
        </Box>
      )}

      {!isLoadingDetail && isDetailError && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography color="text.secondary">공시 정보를 불러오지 못했습니다.</Typography>
        </Box>
      )}

      {!isLoadingDetail && !isDetailError && (
        <Fade in timeout={280}>
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Stack direction="column" spacing={1}>
                <Typography variant="h2">{disclosure?.ttlNm || "공시 수정"}</Typography>
              </Stack>
            </Box>

            <SpaceBox gap={CONTENT_GAP.LARGE} />

            <Box className="form_container">
              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography className="required">공시명</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <AppTextField
                      variant="outlined"
                      placeholder="공시명을 입력하세요"
                      label="공시명"
                      value={formData.ttlNm}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ttlNm: e.target.value }))}
                      error={!!errors.ttlNm}
                      helperText={errors.ttlNm}
                      fullWidth
                    />
                  </Box>
                </Box>
              </Stack>

              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography className="required">구분</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <Select
                      value={formData.pblntDvcd || "02"}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pblntDvcd: e.target.value }))}
                      error={!!errors.pblntDvcd}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="01">정기</MenuItem>
                      <MenuItem value="02">비정기</MenuItem>
                    </Select>
                    {errors.pblntDvcd && (
                      <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                        {errors.pblntDvcd}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography className="required">공시 기간</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale="ko"
                      localeText={koKR.components.MuiLocalizationProvider.defaultProps.localeText}
                    >
                      <DatePicker
                        label={STRINGS["START_DATE"]}
                        format="YYYY년 MM월 DD일"
                        slotProps={{
                          textField: {
                            size: "small",
                            sx: { width: 190 },
                            placeholder: "",
                            error: !!errors.pblntBgngYmd || !!errors.dateRange,
                            helperText: errors.pblntBgngYmd || errors.dateRange,
                          },
                          calendarHeader: { format: "YYYY년 M월" },
                        }}
                        value={startDate}
                        onChange={handleStartDateChange}
                        maxDate={endDate ?? undefined}
                      />
                      <Box component="span" className="px-2 leading-[2.5]">
                        -
                      </Box>
                      <DatePicker
                        label={STRINGS["END_DATE"]}
                        format="YYYY년 MM월 DD일"
                        slotProps={{
                          textField: {
                            size: "small",
                            sx: { width: 190 },
                            placeholder: "",
                            error: !!errors.pblntEndYmd || !!errors.dateRange,
                            helperText: errors.pblntEndYmd || errors.dateRange,
                          },
                          calendarHeader: { format: "YYYY년 M월" },
                        }}
                        value={endDate}
                        onChange={handleEndDateChange}
                        minDate={startDate ?? undefined}
                      />
                    </LocalizationProvider>
                  </Box>
                </Box>
              </Stack>

              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography className="required">내용</Typography>
                  </Box>
                  <Box className="form_container-row-content" sx={{ alignItems: "stretch" }}>
                    <AppTextField
                      variant="outlined"
                      placeholder="공시 내용을 입력하세요"
                      label="내용"
                      value={formData.pblntCn}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pblntCn: e.target.value }))}
                      multiline
                      error={!!errors.pblntCn}
                      helperText={errors.pblntCn}
                      fullWidth
                      slotProps={{
                        input: { inputComponent: "textarea" },
                        htmlInput: {
                          rows: 10,
                          style: {
                            resize: "vertical",
                            minHeight: 200,
                            maxHeight: 600,
                            overflow: "auto",
                            boxSizing: "border-box",
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Stack>

              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography>기존 첨부파일</Typography>
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
                      ) : existingFiles.length > 0 ? (
                        <FileContainer
                          files={existingFiles}
                          showDeleteButton={true}
                          onClick={handleExistingFileDownload}
                          onDelete={handleExistingFileDelete}
                        />
                      ) : (
                        <Typography variant="default">등록된 파일이 없습니다.</Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Stack>

              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography>첨부파일 추가</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <Box className="w-full">
                      {newFiles.length > 0 && (
                        <FileContainer files={newFiles} showDeleteButton={true} onDelete={onNewFileDelete} />
                      )}
                      <SpaceBox gap={CONTENT_GAP.SMALL} />
                      <FileDropZone onDrop={onFileDrop} acceptExtensions={[...DISCLOSURE_ATTACHMENT_EXTENSIONS]} />
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </Box>

            <SpaceBox gap={CONTENT_GAP.MEDIUM} />

            <Box className="btn_container btn_right">
              <AppButton variant="outlined" size="medium" onClick={() => navigate(-1)}>
                취소
              </AppButton>
              <AppButton
                variant="contained"
                size="medium"
                onClick={handleSave}
                disabled={updateDisclosure.isPending || uploadDisclosureFiles.isPending || isLoadingDetail || isDetailError}
              >
                {updateDisclosure.isPending || uploadDisclosureFiles.isPending ? "저장 중..." : "수정"}
              </AppButton>
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
}
