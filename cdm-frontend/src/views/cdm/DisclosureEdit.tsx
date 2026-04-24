import { useEffect, useState } from "react";
import { Box, Button, Chip, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { koKR } from "@mui/x-date-pickers/locales";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/ko";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { STRINGS } from "@/constants/string";
import { CONTENT_GAP } from "@/constants/types";
import type { DisclosureCreateRequest, DisclosureUpdateRequest } from "@/interfaces/disclosureInterface.ts";
import { DisclosureAPI } from "@/api/disclosureApi";
import type { RootState } from "@/store";
import { formatDateFromYYYYMMDD, formatDateToYYYYMMDD, validateDateRange } from "@/utils/dateUtils";
import {
  DISCLOSURE_ATTACHMENT_EXTENSIONS,
  DISCLOSURE_ATTACHMENT_REJECT_MSG,
  isAllowedDisclosureAttachment,
} from "@/utils/disclosureAttachment";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { useGlobalAlert } from "@/hooks/useGlobalAlert";
import FileContainer, { type FileData } from "@/components/FileContainer";
import FileDropZone from "@/components/FileDropzone";
import { SpaceBox } from "@/components/SpaceBox";

export default function DisclosureEdit() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  // Redux 스토어에서 공시번호 가져오기
  const session = useSelector((state: RootState) => state.session);
  
  // 관리자 여부 확인
  const isAdmin = session.userType === "A";

  // 공시번호 가져오기 (우선순위: URL 파라미터 > Redux 스토어 > localStorage)
  const pblntSnFromUrl = searchParams.get("pblntSn");
  const pblntSnFromStore = session.pblntSn;
  const pblntSnFromStorage = localStorage.getItem("pblntSn");

  const pblntSn = pblntSnFromUrl || (pblntSnFromStore ? pblntSnFromStore.toString() : null) || pblntSnFromStorage;
  const pblntSnNumber = pblntSn ? parseInt(pblntSn, 10) : null;

  // 권한 검증: 관리자만 접근 가능
  useEffect(() => {
    if (!isAdmin) {
      showAlert({ message: "공시는 관리자만 생성/수정할 수 있습니다.", severity: "error" });
      navigate(routes.CDM.ROOT);
    }
  }, [isAdmin, showAlert, navigate, routes.CDM.ROOT]);

  // 공시번호 소스 로깅
  useEffect(() => {
    if (pblntSnNumber) {
      const source = pblntSnFromUrl ? "URL 파라미터" : pblntSnFromStore ? "Redux 스토어" : "localStorage";
    }
  }, [pblntSnNumber, pblntSnFromUrl, pblntSnFromStore]);

  // 기존 데이터 조회
  const { data: detailResponse, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["disclosure", pblntSnNumber],
    queryFn: () => DisclosureAPI.getDisclosureById(pblntSnNumber!),
    enabled: !!pblntSnNumber,
  });

  // 기존 파일 목록 조회
  const {
    data: filesResponse,
    isLoading: isLoadingFiles,
    isError: isErrorFiles,
    error: errorFiles,
  } = useQuery({
    queryKey: ["disclosure-files", pblntSnNumber],
    queryFn: () => DisclosureAPI.getFilesByPblntSn(pblntSnNumber!, null),
    enabled: !!pblntSnNumber,
  });

  // 오늘 날짜를 기본값으로 설정
  const today = dayjs();
  const todayStr = formatDateToYYYYMMDD(today.format("YYYY-MM-DD"));

  const [formData, setFormData] = useState<DisclosureCreateRequest>({
    ttlNm: "",
    pblntDvcd: "02", // 기본값: 비정기 (코드값)
    pblntCn: "",
    pblntBgngYmd: todayStr, // 기본값: 오늘
    pblntEndYmd: todayStr, // 기본값: 오늘
    pblntStcd: "02", // 기본값: 진행중
  });

  const [startDate, setStartDate] = useState<Dayjs | null>(today);
  const [endDate, setEndDate] = useState<Dayjs | null>(today);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<FileData[]>([]);
  // 파일 업로드 시 서버로 전송할 File 객체들
  const [fileObjects, setFileObjects] = useState<File[]>([]);

  // 기존 데이터로 폼 초기화
  useEffect(() => {
    if (detailResponse?.data?.data) {
      const disclosure = detailResponse.data.data;
      setFormData({
        ttlNm: disclosure.ttlNm || "",
        pblntDvcd: disclosure.pblntDvcd || "02",
        pblntCn: disclosure.pblntCn || "",
        pblntBgngYmd: disclosure.pblntBgngYmd || "",
        pblntEndYmd: disclosure.pblntEndYmd || "",
        pblntStcd: disclosure.pblntStcd || "02",
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
  }, [detailResponse]);

  // 수정 Mutation
  const updateMutation = useMutation({
    mutationFn: (data: DisclosureUpdateRequest) => DisclosureAPI.updateDisclosure(pblntSnNumber!, data),
    onSuccess: async () => {
      // 파일이 있으면 업로드
      if (pblntSnNumber && fileObjects.length > 0) {
        try {
          await DisclosureAPI.uploadFiles(pblntSnNumber, fileObjects, "06");
          // 파일 목록 쿼리 무효화
          queryClient.invalidateQueries({ queryKey: ["disclosure-files", pblntSnNumber] });
          showAlert({ message: "공시 및 파일이 성공적으로 수정되었습니다.", severity: "success" });
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "공시는 수정되었으나 파일 업로드 중 오류가 발생했습니다.";

          // 파일 크기 제한 오류인 경우 특별한 메시지 표시
          if (
            errorMessage.includes("Maximum upload size") ||
            errorMessage.includes("exceeds its maximum permitted size") ||
            errorMessage.includes("1048576")
          ) {
            showAlert({
              message: "파일 크기가 너무 큽니다. 최대 50MB까지 업로드 가능합니다.",
              severity: "error",
            });
          } else {
            showAlert({
              message: `공시는 수정되었으나 파일 업로드 중 오류가 발생했습니다: ${errorMessage}`,
              severity: "warning",
            });
          }
        }
      } else {
        showAlert({ message: "공시가 성공적으로 수정되었습니다.", severity: "success" });
      }

      queryClient.invalidateQueries({ queryKey: ["disclosures"] });
      queryClient.invalidateQueries({ queryKey: ["disclosure", pblntSnNumber] });
      navigate(`${routes.CDM.DISCLOSURE_DETAIL}?pblntSn=${pblntSnNumber}`);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.response?.data?.error || error?.message || "공시 수정 중 오류가 발생했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    },
  });

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

  // 파일 크기 포맷팅 함수
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

  // 파일 확장자 추출 함수
  const getFileExtension = (fileName: string): string => {
    if (!fileName) return "";
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot === -1) return "";
    return fileName.substring(lastDot + 1).toUpperCase();
  };

  // 기존 파일 목록 데이터 변환
  const existingFiles: FileData[] = (() => {
    if (!filesResponse) {
      return [];
    }

    if (!filesResponse.data) {
      return [];
    }

    if (!filesResponse.data.data) {
      return [];
    }

    const fileList = filesResponse.data.data;

    // 배열이 아닌 경우 처리
    if (!Array.isArray(fileList)) {
      return [];
    }

    if (fileList.length === 0) {
      return [];
    }

    // 첫 번째 파일 데이터 구조 확인
    if (fileList.length > 0) {
    }

    const mappedFiles = fileList
      .map((file: any, index: number) => {
        // 삭제된 파일 제외 (delYn이 'Y' 또는 'y'인 경우만 제외, null이나 'N'은 포함)
        // MyBatis가 컬럼명을 소문자로 변환하므로 소문자 키도 확인
        const delYn = file.delYn;
        if (delYn === "Y" || delYn === "y") {
          return null;
        }

        const strgFileNm = file.strgFileNm || "";
        const atchFileId = file.atchFileId || "";
        // CA 업로드는 file_cn(atchFileSn)이 비어 있음 → file_nm(strgFileNm)으로 표시명 사용
        const originalName = file.atchFileSn && String(file.atchFileSn).trim() !== "" ? file.atchFileSn : strgFileNm;
        const downloadParam = atchFileId || (strgFileNm && strgFileNm.trim() !== "" ? strgFileNm : originalName);

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
          showDeleteButton: true,
          atchFileSn: downloadParam, // 다운로드용(저장파일명 strgFileNm)
          atchFileId: atchFileId || undefined, // 삭제용(UUID, 커뮤니티와 동일)
        } as FileData & { atchFileSn: string; atchFileId?: string };

        return fileData;
      })
      .filter((file: FileData | null) => file !== null) as (FileData & { atchFileSn: string; atchFileId?: string })[];

    return mappedFiles;
  })();

  // 파일 다운로드 핸들러
  const handleFileDownload = async (file: FileData) => {
    try {
      const fileWithSn = file as FileData & { atchFileSn?: string };
      const downloadFileName = fileWithSn.atchFileSn || file.name;

      if (!downloadFileName || downloadFileName.trim() === "" || downloadFileName === "파일") {
        showAlert({ message: "파일명을 찾을 수 없습니다.", severity: "error" });
        return;
      }

      const response = await DisclosureAPI.downloadFile(downloadFileName);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // 다운로드 파일명은 원본 파일명 사용 (표시된 파일명)
      const originalName = file.name; // 이미 원본 파일명으로 변환되어 있음
      link.download = originalName || downloadFileName;
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

  // 파일 삭제 핸들러 (atchFileId(UUID) 사용, 커뮤니티와 동일)
  const handleFileDelete = async (file: FileData) => {
    if (!pblntSnNumber) {
      showAlert({ message: "공시일련번호가 없습니다.", severity: "error" });
      return;
    }

    const fileWithId = file as FileData & { atchFileId?: string };
    const atchFileId = fileWithId.atchFileId;

    if (!atchFileId || atchFileId.trim() === "") {
      showAlert({ message: "파일 ID를 찾을 수 없습니다.", severity: "error" });
      return;
    }

    if (!window.confirm(`파일 "${file.name}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await DisclosureAPI.deleteFile(pblntSnNumber, atchFileId);
      showAlert({ message: "파일이 삭제되었습니다.", severity: "success" });
      // 파일 목록 쿼리 무효화하여 목록 갱신
      queryClient.invalidateQueries({ queryKey: ["disclosure-files", pblntSnNumber] });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.response?.data?.error || error?.message || "파일 삭제 중 오류가 발생했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    }
  };

  // 파일 업로드 핸들러
  const onFileDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      if (files.some((f) => f.name === file.name)) {
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
      newErrors.ttlNm = "제목을 입력해주세요.";
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
  const handleSave = () => {
    if (!pblntSnNumber) {
      showAlert({ message: "공시일련번호가 없습니다.", severity: "error" });
      return;
    }

    if (!validateForm()) {
      showAlert({ message: "입력 정보를 확인해주세요.", severity: "error" });
      return;
    }

    try {
      const updateData: DisclosureUpdateRequest = {
        ttlNm: formData.ttlNm.trim(),
        pblntDvcd: formData.pblntDvcd,
        pblntCn: formData.pblntCn.trim(),
        pblntBgngYmd: formData.pblntBgngYmd,
        pblntEndYmd: formData.pblntEndYmd,
        pblntStcd: formData.pblntStcd || "02",
      };

      updateMutation.mutate(updateData);
    } catch (error: any) {
      showAlert({
        message: `공시 수정 요청 생성 중 오류가 발생했습니다: ${error?.message || "알 수 없는 오류"}`,
        severity: "error",
      });
    }
  };

  useEffect(() => {
    document.title = "CDM 데이터 수정 업로드 안내";
  }, []);

  if (!pblntSnNumber) {
    return (
      <div className="p-10 text-center text-gray-500">
        <div>공시일련번호가 없습니다.</div>
        <div className="mt-4 text-sm">공시목록에서 공시를 선택하거나, URL에 ?pblntSn=번호 형식으로 공시번호를 추가해주세요.</div>
        <div className="mt-4">
          <Button variant="outlined" onClick={() => navigate(routes.CDM.ROOT)}>
            목록으로 이동
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingDetail) {
    return (
      <div>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ mt: 2 }} />
      </div>
    );
  }

  if (!detailResponse?.data?.data) {
    return (
      <div className="p-10 text-center text-red-500">
        공시 정보를 불러올 수 없습니다.
        <div className="mt-4">
          <Button variant="outlined" onClick={() => navigate(routes.CDM.ROOT)}>
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  const disclosure = detailResponse.data.data;

  return (
    <div className="">
      <Helmet>
        <title>CDM - CDM 업로드 공시</title>
      </Helmet>
      {/* ==============================
          헤더
      ============================== */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Stack direction="column" spacing={1}>
          <Typography variant="h2">{disclosure.ttlNm || "-"}</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body1">공시일련번호: {disclosure.pblntSn}</Typography>
            <Chip
              label={DisclosureAPI.convertStatus(disclosure.pblntStcd?.trim() || "")}
              size="small"
              color={
                DisclosureAPI.convertStatus(disclosure.pblntStcd?.trim() || "") === "마감"
                  ? "error"
                  : DisclosureAPI.convertStatus(disclosure.pblntStcd?.trim() || "") === "진행중"
                    ? "primary"
                    : "default"
              }
            />
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate(routes.CDM.ROOT)}>
            목록
          </Button>
        </Stack>
      </Box>

      <SpaceBox gap={CONTENT_GAP.LARGE} />

      {/* ==============================
          공시 수정 폼
      ============================== */}
      <Stack gap={CONTENT_GAP.MEDIUM}>
        <Stack direction="row" spacing={2}>
          <div className="subtitle_icon"></div>
          <Typography variant="h5">공시 수정</Typography>
        </Stack>
      </Stack>
      <Box className="form_container">
        {/* 공시 내용 1 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <span>
                제목<span className="px-1 text-red-500">*</span>
              </span>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                variant="outlined"
                size="small"
                placeholder="제목을 입력하세요"
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
              <span>
                구분<span className="px-1 text-red-500">*</span>
              </span>
            </Box>
            <Box className="form_container-row-content">
              <Select
                size="small"
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
              <span>
                공시 기간<span className="px-1 text-red-500">*</span>
              </span>
            </Box>
            <Box className="form_container-row-content">
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="ko"
                localeText={koKR.components.MuiLocalizationProvider.defaultProps.localeText}
              >
                <DatePicker
                  label={STRINGS["START_DATE"]}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: 180 },
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
                <span className="pl5 pr5">-</span>
                <DatePicker
                  label={STRINGS["END_DATE"]}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: 180 },
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
              <span>
                내용<span className="px-1 text-red-500">*</span>
              </span>
            </Box>
            <Box className="form_container-row-content" sx={{ alignItems: "stretch", overflow: "visible" }}>
              <TextField
                variant="outlined"
                placeholder="공시 내용을 입력하세요"
                value={formData.pblntCn}
                onChange={(e) => setFormData({ ...formData, pblntCn: e.target.value })}
                multiline
                rows={10}
                error={!!errors.pblntCn}
                helperText={errors.pblntCn}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    alignItems: "flex-start",
                  },
                  "& textarea": {
                    resize: "vertical", // ⭐ 드래그 가능
                    overflow: "auto",
                    boxSizing: "border-box",
                    maxHeight: "600px", // 선택 (안 넣어도 됨)
                  },
                }}
              />
            </Box>
          </Box>
        </Stack>

        {/* 기존 첨부파일 목록 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <span>기존 첨부파일</span>
            </Box>
            <Box className="form_container-row-content">
              {isLoadingFiles ? (
                <Typography variant="body2" color="text.secondary">
                  파일 목록을 불러오는 중...
                </Typography>
              ) : isErrorFiles ? (
                <Typography variant="body2" color="error">
                  파일 목록을 불러오는 중 오류가 발생했습니다:{" "}
                  {errorFiles instanceof Error ? errorFiles.message : "알 수 없는 오류"}
                </Typography>
              ) : existingFiles.length > 0 ? (
                <Box>
                  <FileContainer
                    files={existingFiles}
                    showDeleteButton={true}
                    onClick={handleFileDownload}
                    onDelete={handleFileDelete}
                  />
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      파일을 클릭하면 다운로드되고, X 버튼을 클릭하면 삭제됩니다.
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  등록된 파일이 없습니다.
                </Typography>
              )}
            </Box>
          </Box>
        </Stack>

        {/* 첨부파일 (새로 추가할 파일) */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <span>첨부파일 추가</span>
            </Box>
            <Box className="form_container-row-content">
              <FileDropZone onDrop={onFileDrop} acceptExtensions={[...DISCLOSURE_ATTACHMENT_EXTENSIONS]} />
              {files.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <FileContainer files={files} showDeleteButton={true} onDelete={onFileDelete} />
                </Box>
              )}
            </Box>
          </Box>
        </Stack>
      </Box>

      <SpaceBox gap={CONTENT_GAP.MEDIUM} />

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button variant="contained" size="medium" onClick={handleSave} disabled={updateMutation.isPending || isLoadingDetail}>
          {updateMutation.isPending ? "수정 중..." : isLoadingDetail ? "로딩 중..." : "수정"}
        </Button>
      </div>
    </div>
  );
}
