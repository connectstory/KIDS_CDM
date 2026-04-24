import { useEffect, useState } from "react";
import { Box, Button, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { koKR } from "@mui/x-date-pickers/locales";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/ko";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { STRINGS } from "@/constants/string";
import { CONTENT_GAP } from "@/constants/types";
import type { DisclosureCreateRequest, DisclosureUpdateRequest } from "@/interfaces/disclosureInterface.ts";
import { DisclosureAPI } from "@/api/disclosureApi";
import type { RootState } from "@/store";
import { setPblntSn } from "@/store/sessionSlice";
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

export default function DisclosureCreate() {
  const routes = useCmRoutes();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showAlert } = useGlobalAlert();

  const appTarget = import.meta.env.VITE_APP_TARGET as "admin" | "partner" | undefined;
  const isPartner = appTarget === "partner";

  // 사용자 정보 가져오기
  const session = useSelector((state: RootState) => state.session);
  const instId = session.instId || "";
  
  // 관리자 여부 확인
  const isAdmin = session.userType === "A";

  const pblntSn = searchParams.get("pblntSn");
  const pblntSnNumber = pblntSn ? parseInt(pblntSn, 10) : null;
  const isEditMode = !!pblntSnNumber;

  // 수정 모드일 때 기존 데이터 조회
  const { data: detailResponse, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["disclosure", pblntSnNumber],
    queryFn: () => DisclosureAPI.getDisclosureById(pblntSnNumber!),
    enabled: isEditMode && !!pblntSnNumber,
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
    pblntStcd: "01", // 기본값: 등록
  });

  const [startDate, setStartDate] = useState<Dayjs | null>(today);
  const [endDate, setEndDate] = useState<Dayjs | null>(today);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<FileData[]>([]);
  // 파일 업로드 시 서버로 전송할 File 객체들
  const [fileObjects, setFileObjects] = useState<File[]>([]);

  // 권한 검증: 관리자만 접근 가능
  useEffect(() => {
    if (!isAdmin) {
      showAlert({ message: "공시는 관리자만 생성/수정할 수 있습니다.", severity: "error" });
      navigate(routes.CDM.ROOT);
    }
  }, [isAdmin, showAlert, navigate, routes.CDM.ROOT]);

  // 수정 모드일 때 기존 데이터로 폼 초기화
  useEffect(() => {
    if (isEditMode && detailResponse?.data?.data) {
      const disclosure = detailResponse.data.data;
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
  }, [isEditMode, detailResponse]);

  // 등록 Mutation
  const createMutation = useMutation({
    mutationFn: (data: DisclosureCreateRequest) => DisclosureAPI.createDisclosure(data),
    onSuccess: async (response) => {
      const pblntSn = response.data?.data?.pblntSn;

      // 협력기관인 경우 자신의 기관을 참여기관으로 자동 추가
      if (isPartner && pblntSn && instId) {
        try {
          await DisclosureAPI.addPartners(pblntSn, { instIds: [instId] });
          queryClient.invalidateQueries({ queryKey: ["disclosure-partners", pblntSn] });
        } catch {
          // 참여기관 추가 실패는 경고만 표시하고 계속 진행
        }
      }

      // 파일이 있으면 업로드
      if (pblntSn && fileObjects.length > 0) {
        try {
          // DRB 파일과 일반 파일 분리
          const drbFiles: File[] = [];
          const normalFiles: File[] = [];

          fileObjects.forEach((file) => {
            if (isDRBFile(file.name)) {
              drbFiles.push(file);
            } else {
              normalFiles.push(file);
            }
          });

          // DRB 파일 업로드 (파일구분코드: 07=DRB)
          if (drbFiles.length > 0) {
            await DisclosureAPI.uploadFiles(pblntSn, drbFiles, "07");
          }

          // 공시등록 파일 업로드 (파일구분코드: 06=공시등록)
          if (normalFiles.length > 0) {
            await DisclosureAPI.uploadFiles(pblntSn, normalFiles, "06");
          }

          // 파일 목록 쿼리 무효화
          queryClient.invalidateQueries({ queryKey: ["disclosure-files", pblntSn] });

          const fileTypeMessage =
            drbFiles.length > 0 && normalFiles.length > 0
              ? "공시, DRB 파일 및 일반 파일이 성공적으로 등록되었습니다."
              : drbFiles.length > 0
                ? "공시 및 DRB 파일이 성공적으로 등록되었습니다."
                : "공시 및 파일이 성공적으로 등록되었습니다.";

          showAlert({ message: fileTypeMessage, severity: "success" });
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || error?.message || "파일 업로드 중 오류가 발생했습니다.";
          showAlert({
            message: `공시는 등록되었으나 파일 업로드 중 오류가 발생했습니다: ${errorMessage}`,
            severity: "warning",
          });
        }
      } else {
        showAlert({ message: "공시가 성공적으로 등록되었습니다.", severity: "success" });
      }

      queryClient.invalidateQueries({ queryKey: ["disclosures"] });
      queryClient.invalidateQueries({ queryKey: ["disclosure", pblntSn] });
      if (pblntSn) {
        dispatch(setPblntSn(pblntSn));
        try {
          localStorage.setItem("pblntSn", String(pblntSn));
        } catch {
          /* ignore */
        }
        navigate(`${routes.CDM.DISCLOSURE_DETAIL}?pblntSn=${pblntSn}`);
      } else {
        navigate(routes.CDM.DISCLOSURES);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "공시 등록 중 오류가 발생했습니다.";
      showAlert({ message: errorMessage, severity: "error" });
    },
  });

  // 수정 Mutation
  const updateMutation = useMutation({
    mutationFn: (data: DisclosureUpdateRequest) => DisclosureAPI.updateDisclosure(pblntSnNumber!, data),
    onSuccess: async () => {
      // 파일이 있으면 업로드
      if (pblntSnNumber && fileObjects.length > 0) {
        try {
          // DRB 파일과 일반 파일 분리
          const drbFiles: File[] = [];
          const normalFiles: File[] = [];

          fileObjects.forEach((file) => {
            if (isDRBFile(file.name)) {
              drbFiles.push(file);
            } else {
              normalFiles.push(file);
            }
          });

          // DRB 파일 업로드 (파일구분코드: 07=DRB)
          if (drbFiles.length > 0) {
            await DisclosureAPI.uploadFiles(pblntSnNumber, drbFiles, "07");
          }

          // 공시등록 파일 업로드 (파일구분코드: 06=공시등록)
          if (normalFiles.length > 0) {
            await DisclosureAPI.uploadFiles(pblntSnNumber, normalFiles, "06");
          }

          // 파일 목록 쿼리 무효화
          queryClient.invalidateQueries({ queryKey: ["disclosure-files", pblntSnNumber] });

          const fileTypeMessage =
            drbFiles.length > 0 && normalFiles.length > 0
              ? "공시, DRB 파일 및 일반 파일이 성공적으로 수정되었습니다."
              : drbFiles.length > 0
                ? "공시 및 DRB 파일이 성공적으로 수정되었습니다."
                : "공시 및 파일이 성공적으로 수정되었습니다.";

          showAlert({ message: fileTypeMessage, severity: "success" });
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || error?.message || "파일 업로드 중 오류가 발생했습니다.";
          showAlert({
            message: `공시는 수정되었으나 파일 업로드 중 오류가 발생했습니다: ${errorMessage}`,
            severity: "warning",
          });
        }
      } else {
        showAlert({ message: "공시가 성공적으로 수정되었습니다.", severity: "success" });
      }

      queryClient.invalidateQueries({ queryKey: ["disclosures"] });
      queryClient.invalidateQueries({ queryKey: ["disclosure", pblntSnNumber] });
      navigate(`${routes.CDM.DISCLOSURE_DETAIL}?pblntSn=${pblntSnNumber}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "공시 수정 중 오류가 발생했습니다.";
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
  const formatFileSize = (bytes: number): string => {
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
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot === -1) return "";
    return fileName.substring(lastDot + 1).toUpperCase();
  };

  // DRB 파일 여부 확인 함수
  const isDRBFile = (fileName: string): boolean => {
    const upperFileName = fileName.toUpperCase();
    return upperFileName.includes("DRB") || upperFileName.includes("IRB");
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

      const isDRB = isDRBFile(file.name);
      if (!isDRB && !isAllowedDisclosureAttachment(file.name)) {
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
  const handleSave = () => {
    if (!validateForm()) {
      showAlert({ message: "입력 정보를 확인해주세요.", severity: "error" });
      return;
    }

    if (isEditMode) {
      // 수정 모드
      const updateData: DisclosureUpdateRequest = {
        ttlNm: formData.ttlNm,
        pblntDvcd: formData.pblntDvcd,
        pblntCn: formData.pblntCn,
        pblntBgngYmd: formData.pblntBgngYmd,
        pblntEndYmd: formData.pblntEndYmd,
        pblntStcd: formData.pblntStcd || "2",
      };
      updateMutation.mutate(updateData);
    } else {
      // 등록 모드
      createMutation.mutate(formData);
    }
  };

  useEffect(() => {
    document.title = isEditMode ? "CDM 데이터 수정 업로드 안내" : "CDM 데이터 등록 업로드 안내";
  }, [isEditMode]);

  return (
    <div className="">
      <Helmet>
        <title>CDM - CDM 업로드 공시</title>
      </Helmet>
      {/* ==============================
          헤더 (수정 모드일 때만 표시)
      ============================== */}
      {isEditMode && pblntSnNumber && (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Stack direction="column" spacing={1}>
              <Typography variant="h2">{detailResponse?.data?.data?.ttlNm || "공시 수정"}</Typography>
              <Typography variant="body1">공시일련번호: {pblntSnNumber}</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
                목록
              </Button>
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
              <span>
                공시명<span className="px-1 text-red-500">*</span>
              </span>
            </Box>
            <Box className="form_container-row-content">
              <TextField
                variant="outlined"
                placeholder="공시명을 입력하세요"
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
                InputProps={{
                  inputComponent: "textarea" as never, // ⭐ 핵심
                }}
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

        {/* 첨부파일 */}
        <Stack direction="row" className="form_container-row">
          <Box className="form_container-column">
            <Box className="form_container-row-label">
              <span>첨부파일</span>
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
      <div className="flex justify-end gap-2">
        <Button variant="outlined" size="medium" onClick={() => navigate(routes.CDM.DISCLOSURES)}>
          목록
        </Button>
        <Button
          variant="contained"
          size="medium"
          onClick={handleSave}
          disabled={createMutation.isPending || updateMutation.isPending || isLoadingDetail}
        >
          {createMutation.isPending || updateMutation.isPending
            ? "저장 중..."
            : isLoadingDetail
              ? "로딩 중..."
              : isEditMode
                ? "수정"
                : "저장"}
        </Button>
      </div>
    </div>
  );
}
