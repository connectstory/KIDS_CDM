import { useMemo } from "react";
import { FormControl, MenuItem, Select } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useTranslation } from "react-i18next";

const RelatedSites = () => {
  const { t, i18n } = useTranslation();
  const langDep = i18n.resolvedLanguage ?? i18n.language;

  const GOV_SITES = useMemo(
    () => [
      { label: t("mfdsGoKr"), value: "https://www.mfds.go.kr" },
      { label: t("nedrugMfdsGoKr"), value: "https://nedrug.mfds.go.kr" },
      { label: t("mohwGoKr"), value: "https://www.mohw.go.kr" },
    ],
    [langDep, t]
  );

  const ORG_SITES = useMemo(
    () => [
      { label: t("kpanetOrKr"), value: "https://www.kpanet.or.kr" },
      { label: t("kpbmaOrKr"), value: "http://www.kpbma.or.kr" },
      { label: t("kodcOrKr"), value: "https://www.kodc.or.kr" },
    ],
    [langDep, t]
  );

  const handleSelect = (e: SelectChangeEvent) => {
    const url = e.target.value;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="footer_related">
      <div className="related_grid_container">
        {/* 정부 유관기관 셀렉트 */}
        <div className="related_grid_item">
          <FormControl fullWidth size="small">
            <Select
              value=""
              displayEmpty
              onChange={handleSelect}
              renderValue={(selected) => {
                if (selected === "") {
                  return <span className="placeholder_text">{t("goToRelGov")}</span>;
                }
                return selected;
              }}
            >
              <MenuItem value="" disabled>
                <em>{t("goToRelGov")}</em>
              </MenuItem>
              {GOV_SITES.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* 관련 단체 셀렉트 */}
        <div className="related_grid_item">
          <FormControl fullWidth size="small">
            <Select
              value=""
              displayEmpty
              onChange={handleSelect}
              renderValue={(selected) => {
                if (selected === "") {
                  return <span className="placeholder_text">{t("goToRelOrg")}</span>;
                }
                return selected;
              }}
            >
              <MenuItem value="" disabled>
                <em>{t("goToRelOrg")}</em>
              </MenuItem>
              {ORG_SITES.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>
    </div>
  );
};

export default RelatedSites;
