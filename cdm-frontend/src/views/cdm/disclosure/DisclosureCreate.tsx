import { useEffect, useState } from "react";
import { Box, Fade, MenuItem, Select, Stack, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { koKR } from "@mui/x-date-pickers/locales";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/ko";
import { Helmet } from "react-helmet";
import { useNavigate, useSearchParams } from "react-router-dom";
import { STRINGS } from "@/constants/string";
import { CONTENT_GAP, DISCLOSURE_FILE_SE_CD } from "@/constants/types";
import type { DisclosureCreateRequest, DisclosureUpdateRequest } from "@/interfaces/disclosureInterface";
import { buildPath, formatFileSize, getFileExtension } from "@/utils/common";
import { formatDateFromYYYYMMDD, formatDateToYYYYMMDD, validateDateRange } from "@/utils/dateUtils";
import {
  DISCLOSURE_ATTACHMENT_EXTENSIONS,
  DISCLOSURE_ATTACHMENT_REJECT_MSG,
  isAllowedDisclosureAttachment,
} from "@/utils/disclosureAttachment";
import { useCreateDisclosure, useUpdateDisclosure, useUploadDisclosureFiles } from "@/hooks/disclosure/useDisclosureMutations";
import { useDisclosureDetail } from "@/hooks/disclosure/useDisclosureQueries";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import FileContainer, { type FileData } from "@/components/FileContainer";
import FileDropZone from "@/components/FileDropzone";
import Loader from "@/components/Loader";
import { SpaceBox } from "@/components/SpaceBox";
import { AppButton, AppTextField } from "@/components/ui";

export default function DisclosureCreate() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const createDisclosure = useCreateDisclosure();
  const updateDisclosure = useUpdateDisclosure();
  const uploadDisclosureFiles = useUploadDisclosureFiles();

  const pblntSn = searchParams.get("pblntSn");
  const pblntSnId = pblntSn ? Number(pblntSn) : NaN;
  const isEditMode = !Number.isNaN(pblntSnId);

  const {
    data: disclosure,
    isLoading: isLoadingDetail,
    isError: isDetailError,
  } = useDisclosureDetail(isEditMode ? pblntSn : null);

  // 오늘 날짜를 기본값으로 설정
  const today = dayjs();
  const todayStr = formatDateToYYYYMMDD(today.format("YYYY-MM-DD"));

  const [formData, setFormData] = useState<DisclosureCreateRequest>({
    ttlNm: "",
    pblntDvcd: "02", // 기본값: 비정기 (코드값)
    pblntCn: "",
    pblntBgngYmd: todayStr, // 기본값: 오늘
    pblntEndYmd: todayStr, // 기본값: 오늘
    pblntStcd: "01", // 기본값: 등록
  });

  const [startDate, setStartDate] = useState<Dayjs | null>(today);
  const [endDate, setEndDate] = useState<Dayjs | null>(today);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<FileData[]>([]);
  // 파일 업로드 시 서버로 전송할 File 객체들
  const [fileObjects, setFileObjects] = useState<File[]>([]);

  // 수정 모드일 때 기존 데이터로 폼 초기화
  useEffect(() => {
    if (isEditMode && disclosure) {
      setFormData({
        ttlNm: disclosure.ttlNm || "",
        pblntDvcd: disclosure.pblntDvcd || "02",
        pblntCn: disclosure.pblntCn || "",
        pblntBgngYmd: disclosure.pblntBgngYmd || "",
        pblntEndYmd: disclosure.pblntEndYmd || "",
        pblntStcd: disclosure.pblntStcd || "01",
      });
      if (disclosure.pblntBgngYmd) {
        const dateStr = formatDateFromYYYYMMDD(disclosure.pblntBgngYmd);
        setStartDate(dayjs(dateStr));
      }
      if (disclosure.pblntEndYmd) {
        const dateStr = formatDateFromYYYYMMDD(disclosure.pblntEndYmd);
        setEndDate(dayjs(dateStr));
      }
    }
  }, [isEditMode, disclosure]);

  // 날짜 변경 핸들러
  const handleStartDateChange = (date: Dayjs | null) => {
    setStartDate(date);
    if (date) {
      setFormData({
        ...formData,
        pblntBgngYmd: formatDateToYYYYMMDD(date.format("YYYY-MM-DD")),
      });
      // 에러 초기화
      if (errors.pblntBgngYmd) {
        setErrors({ ...errors, pblntBgngYmd: "" });
      }
    } else {
      setFormData({
        ...formData,
        pblntBgngYmd: "",
      });
    }
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    setEndDate(date);
    if (date) {
      setFormData({
        ...formData,
        pblntEndYmd: formatDateToYYYYMMDD(date.format("YYYY-MM-DD")),
      });
      // 에러 초기화
      if (errors.pblntEndYmd || errors.dateRange) {
        setErrors({ ...errors, pblntEndYmd: "", dateRange: "" });
      }
    } else {
      setFormData({
        ...formData,
        pblntEndYmd: "",
      });
    }
  };

  // 파일 업로드 핸들러
  const onFileDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      // 중복 체크
      if (files.some((f) => f.name === file.name)) {
        showAlert({
          message: `이미 추가된 파일입니다: ${file.name}`,
          severity: "warning",
        });
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
      setFiles((prev) => [...prev, fileData]);
      setFileObjects((prev) => [...prev, file]);
    });
  };

  // 파일 삭제 핸들러
  const onFileDelete = (file: FileData) => {
    setFiles((prev) => prev.filter((f) => f.name !== file.name));
    setFileObjects((prev) => prev.filter((f) => f.name !== file.name));
  };

  // 유효성 검증
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ttlNm.trim()) {
      newErrors.ttlNm = "공시명을 입력해주세요.";
    }

    if (!formData.pblntDvcd) {
      newErrors.pblntDvcd = "구분을 선택해주세요.";
    }

    if (!formData.pblntBgngYmd) {
      newErrors.pblntBgngYmd = "공시 시작일자를 선택해주세요.";
    }

    if (!formData.pblntEndYmd) {
      newErrors.pblntEndYmd = "공시 종료일자를 선택해주세요.";
    }

    if (formData.pblntBgngYmd && formData.pblntEndYmd && !validateDateRange(formData.pblntBgngYmd, formData.pblntEndYmd)) {
      newErrors.dateRange = "종료일자는 시작일자 이후여야 합니다.";
    }

    if (!formData.pblntCn.trim()) {
      newErrors.pblntCn = "내용을 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장 버튼 클릭 핸들러
  const handleSave = async () => {
    if (!validateForm()) {
      showAlert({ message: "입력 정보를 확인해주세요.", severity: "error" });
      return;
    }

    const uploadAttachedIfAny = async (sn: number, mode: "create" | "update") => {
      if (fileObjects.length === 0) return;
      try {
        await uploadDisclosureFiles.mutateAsync({
          pblntSn: sn,
          files: fileObjects,
          fileSeCd: DISCLOSURE_FILE_SE_CD.DISCLOSURE_REGISTER,
        });
        showAlert({
          message: mode === "create" ? "공시 및 파일이 성공적으로 등록되었습니다." : "공시 및 파일이 성공적으로 수정되었습니다.",
          severity: "success",
        });
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || "파일 업로드 중 오류가 발생했습니다.";
        showAlert({
          message:
            mode === "create"
              ? `공시는 등록되었으나 파일 업로드 중 오류가 발생했습니다: ${errorMessage}`
              : `공시는 수정되었으나 파일 업로드 중 오류가 발생했습니다: ${errorMessage}`,
          severity: "warning",
        });
      }
    };

    if (isEditMode) {
      if (Number.isNaN(pblntSnId)) return;

      const updateData: DisclosureUpdateRequest = {
        ttlNm: formData.ttlNm,
        pblntDvcd: formData.pblntDvcd,
        pblntCn: formData.pblntCn,
        pblntBgngYmd: formData.pblntBgngYmd,
        pblntEndYmd: formData.pblntEndYmd,
        pblntStcd: formData.pblntStcd || "2",
      };
      await updateDisclosure.mutateAsync({
        pblntSn: pblntSnId,
        data: updateData,
      });

      if (fileObjects.length > 0) {
        await uploadAttachedIfAny(pblntSnId, "update");
      } else {
        showAlert({ message: "공시가 성공적으로 수정되었습니다.", severity: "success" });
      }
      navigate(buildPath(routes.CDM.DISCLOSURE_DETAIL, { pblntSn: pblntSnId }));
      return;
    }

    const { pblntSn: newSn } = await createDisclosure.mutateAsync(formData);

    if (fileObjects.length > 0) {
      await uploadAttachedIfAny(newSn, "create");
    } else {
      showAlert({ message: "공시가 성공적으로 등록되었습니다.", severity: "success" });
    }

    localStorage.setItem("pblntSn", String(newSn));
    navigate(buildPath(routes.CDM.DISCLOSURE_DETAIL, { pblntSn: newSn }));
  };

  const showForm = !isEditMode || (!isLoadingDetail && !isDetailError);

  return (
    <Box>
      <Helmet>
        <title>{isEditMode ? `CDM - 공시 수정` : `CDM - 공시 등록`}</title>
      </Helmet>

      {isEditMode && isLoadingDetail && (
        <Box sx={{ position: "relative", minHeight: 480 }}>
          <Loader isLoading={true} />
        </Box>
      )}

      {isEditMode && !isLoadingDetail && isDetailError && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography color="text.secondary">공시 정보를 불러오지 못했습니다.</Typography>
        </Box>
      )}

      {showForm && (
        <Fade in timeout={280}>
          <Box>
            {/* ==============================
                헤더 (수정 모드일 때만 표시)
            ============================== */}
            {isEditMode && (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Stack direction="column" spacing={1}>
                    <Typography variant="h2">{disclosure?.ttlNm || "공시 수정"}</Typography>
                    <Typography variant="body1">공시일련번호: {pblntSnId}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <AppButton variant="outlined" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
                      목록
                    </AppButton>
                  </Stack>
                </Box>
                <SpaceBox gap={CONTENT_GAP.LARGE} />
              </>
            )}

            {/* ==============================
                공시 내용
            ============================== */}
            <Box className="form_container">
              {/* 공시 내용 1 */}
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
                      onChange={(e) => setFormData({ ...formData, ttlNm: e.target.value })}
                      error={!!errors.ttlNm}
                      helperText={errors.ttlNm}
                      fullWidth
                    />
                  </Box>
                </Box>
              </Stack>

              {/* 공시 내용 2 */}
              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography className="required">구분</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <Select
                      value={formData.pblntDvcd || "02"}
                      onChange={(e) => setFormData({ ...formData, pblntDvcd: e.target.value })}
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
                          calendarHeader: {
                            format: "YYYY년 M월",
                          },
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
                          calendarHeader: {
                            format: "YYYY년 M월",
                          },
                        }}
                        value={endDate}
                        onChange={handleEndDateChange}
                        minDate={startDate ?? undefined}
                      />
                    </LocalizationProvider>
                  </Box>
                </Box>
              </Stack>

              {/* 공시 내용 3 */}
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
                      onChange={(e) => setFormData({ ...formData, pblntCn: e.target.value })}
                      multiline
                      error={!!errors.pblntCn}
                      helperText={errors.pblntCn}
                      fullWidth
                      slotProps={{
                        input: {
                          inputComponent: "textarea",
                        },
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

              {/* 첨부파일 */}
              <Stack direction="row" className="form_container-row">
                <Box className="form_container-column">
                  <Box className="form_container-row-label">
                    <Typography>첨부파일</Typography>
                  </Box>
                  <Box className="form_container-row-content">
                    <Box className="w-full">
                      {files.length > 0 && <FileContainer files={files} showDeleteButton={true} onDelete={onFileDelete} />}
                      <SpaceBox gap={CONTENT_GAP.SMALL}></SpaceBox>
                      <FileDropZone onDrop={onFileDrop} acceptExtensions={[...DISCLOSURE_ATTACHMENT_EXTENSIONS]} />
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </Box>

            <SpaceBox gap={CONTENT_GAP.MEDIUM} />

            {/* 저장 버튼 */}
            <Box className="btn_container btn_right">
              <AppButton variant="outlined" size="medium" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
                목록
              </AppButton>
              <AppButton
                variant="contained"
                size="medium"
                onClick={handleSave}
                disabled={
                  createDisclosure.isPending ||
                  updateDisclosure.isPending ||
                  uploadDisclosureFiles.isPending ||
                  (isEditMode && (isLoadingDetail || isDetailError))
                }
              >
                {createDisclosure.isPending || updateDisclosure.isPending || uploadDisclosureFiles.isPending
                  ? "저장 중..."
                  : isEditMode
                    ? "수정"
                    : "저장"}
              </AppButton>
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
}
