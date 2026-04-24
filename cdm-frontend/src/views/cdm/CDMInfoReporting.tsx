import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { CONTENT_GAP } from "@/constants/types.ts";
import { DisclosureAPI } from "@/api/disclosureApi";
import type { RootState } from "@/store";
import { setPblntSn } from "@/store/sessionSlice";
import { SpaceBox } from "@/components/SpaceBox.tsx";
import CDMInfoReportingContent from "./CDMInfoReportingContent.tsx";

export default function CDMInfoReporting() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const session = useSelector((state: RootState) => state.session);

  const pblntSnFromUrl = searchParams.get("pblntSn");
  const pblntSnFromStore = session.pblntSn;
  const pblntSnFromStorage = localStorage.getItem("pblntSn");
  const pblntSn = pblntSnFromUrl || (pblntSnFromStore != null ? String(pblntSnFromStore) : null) || pblntSnFromStorage;
  const pblntSnNumber = pblntSn ? parseInt(pblntSn, 10) : null;

  useEffect(() => {
    if (pblntSnNumber == null || Number.isNaN(pblntSnNumber)) return;

    let cancelled = false;
    DisclosureAPI.getDisclosureById(pblntSnNumber)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data;
        if (data == null) {
          clearStalePblntSn();
          return;
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 404 || status === 400) {
          clearStalePblntSn();
        }
      });

    function clearStalePblntSn() {
      try {
        localStorage.removeItem("pblntSn");
      } catch {
        /* ignore */
      }
      dispatch(setPblntSn(undefined));
      if (pblntSnFromUrl) {
        const next = new URLSearchParams(searchParams);
        next.delete("pblntSn");
        setSearchParams(next, { replace: true });
      }
      queryClient.removeQueries({
        predicate: (q) => {
          const key = q.queryKey as unknown[];
          const first = key[0];
          const second = key[1];
          if (first === "disclosure-partners" && second === pblntSnNumber) return true;
          if (first === "upload-stats-all" && second === pblntSnNumber) return true;
          if (first === "upload-stats-all-partners" && second === pblntSnNumber) return true;
          if (first === "upload-stats" && second === pblntSnNumber) return true;
          if (first === "catalog" && second === pblntSnNumber) return true;
          if (first === "partner-information" && second === pblntSnNumber) return true;
          if (first === "cdm-catalog" && second === pblntSnNumber) return true;
          return false;
        },
      });
    }

    return () => {
      cancelled = true;
    };
  }, [pblntSnNumber, pblntSnFromUrl, dispatch, queryClient, searchParams, setSearchParams]);

  return (
    <div>
      <Helmet>
        <title>CDM - CDM 업로드 공시</title>
      </Helmet>

      <SpaceBox gap={CONTENT_GAP.XLARGE} />
      <section>
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            업로드현황
          </Typography>
        </Box>
      </section>
      <CDMInfoReportingContent />
    </div>
  );
}
