import { useMemo } from "react";
import { DisclosureAPI } from "@/api";
import { Box, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import type { RootState } from "@/store";

/** 진행상태 코드 — API가 "4"·4 등으로 줄 때도 공시상세·집계와 동일하게 2자리로 맞춤 */
function normalizePartnerProgressStatusCode(partner: Record<string, unknown> | null | undefined): string {
  if (!partner) return "";
  const raw = partner.uldInstPrgrsSttsStcd ?? (partner as { uld_inst_prgrs_stts_stcd?: unknown }).uld_inst_prgrs_stts_stcd;
  if (raw == null || String(raw).trim() === "") return "";
  const s = String(raw).trim();
  return s.length === 1 ? `0${s}` : s;
}

export default function UploadHeader() {
  const [searchParams] = useSearchParams();

  // 사용자 정보 가져오기
  const session = useSelector((state: RootState) => state.session);

  // 공시번호 가져오기 (우선순위: URL 파라미터 > Redux 스토어 > localStorage)
  const pblntSnFromUrl = searchParams.get("pblntSn");
  const pblntSnFromStore = session.pblntSn;
  const pblntSnFromStorage = localStorage.getItem("pblntSn");
  const pblntSn = pblntSnFromUrl || (pblntSnFromStore ? pblntSnFromStore.toString() : null) || pblntSnFromStorage;
  const pblntSnNumber = pblntSn ? parseInt(pblntSn, 10) : null;

  // 참여기관 목록 조회
  const { data: partners = [] } = useQuery({
    queryKey: ["disclosure-partners", pblntSnNumber],
    queryFn: async () => {
      if (!pblntSnNumber) {
        return [];
      }

      try {
        const response = await DisclosureAPI.getPartnersByPblntSn(pblntSnNumber);

        // 응답 데이터가 배열인지 확인
        const partnersData = response.data?.data;
        if (Array.isArray(partnersData)) {
          return partnersData;
        } else {
          return [];
        }
      } catch (error: any) {
        return [];
      }
    },
    enabled: !!pblntSnNumber,
    retry: false,
  });

  // 참여기관과 미참여기관 분리 (캐시/응답 형태로 배열이 아닐 수 있음)
  const partnersList = Array.isArray(partners) ? partners : [];

  const hasStatusInfo = (p: any) => {
    const v = p?.verInfoNm ?? p?.ver_info_nm ?? p?.verinfonm;
    const d = p?.lastUpdtYmd ?? p?.last_updt_ymd ?? p?.lastupdtymd;
    const c = p?.updtCycleCnt ?? p?.updt_cycle_cnt ?? p?.updtcyclecnt;
    return (v != null && String(v).trim() !== "") || (d != null && String(d).trim() !== "") || c != null;
  };

  const participatingPartners = useMemo(() => {
    const filtered = partnersList.filter((p: any) => {
      const norm = normalizePartnerProgressStatusCode(p as Record<string, unknown>);
      // 진행중·완료·참여취소(공시마감 등)·등록·재요청 계열은 참여로 간주 (코드 한 자리·숫자 타입 대응)
      const byStatus =
        norm === "02" ||
        norm === "03" ||
        norm === "04" ||
        norm === "05" ||
        norm === "06" ||
        norm === "07";
      const byStatusInfo = hasStatusInfo(p); // 현황정보를 등록한 기관도 참여기관에 포함
      return byStatus || byStatusInfo;
    });
    return filtered;
  }, [partnersList]);

  const nonParticipatingPartners = useMemo(() => {
    const participatingSet = new Set(participatingPartners.map((p: any) => p.ptcpInstSn));
    const filtered = partnersList.filter((p: any) => !participatingSet.has(p.ptcpInstSn));
    return filtered;
  }, [partnersList, participatingPartners]);

  return (
    <div className="form_container">
      {/* 과제 내용 1 */}
      <Stack direction="row" className="form_container-row">
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">참여기관 {"(" + participatingPartners.length + ")"}</Typography>
          </Box>
          <Box className="form_container-row-content">
            <Typography variant="default">
              {participatingPartners.length > 0
                ? participatingPartners.map((p: any) => p.instNm || p.instId || "").join(", ")
                : "-"}
            </Typography>
          </Box>
        </Box>
      </Stack>
      <Stack direction="row" className="form_container-row">
        <Box className="form_container-column">
          <Box className="form_container-row-label">
            <Typography variant="h6">미참여기관 {"(" + nonParticipatingPartners.length + ")"}</Typography>
          </Box>
          <Box className="form_container-row-content">
            <Typography variant="default">
              {nonParticipatingPartners.length > 0
                ? nonParticipatingPartners.map((p: any) => p.instNm || p.instId || "").join(", ")
                : "미참여기관이 없습니다."}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </div>
  );
}
