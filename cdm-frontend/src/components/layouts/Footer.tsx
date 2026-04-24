import ChevronRight from "@mui/icons-material/ChevronRight";
import { Box, Link as MuiLink, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { potalFooterLogo } from "@/config/images";
import RelatedSites from "./RelatedSites";

/** Portal paths aligned with the main KIDS site; adjust if deployment base differs. */
const PORTAL_PP = "/pp/ko";

const FOOTER_DIRECTIONS_HREF = `${PORTAL_PP}/cms/CmsPage/cms0028`;

type SnsKey = "blog" | "youtube" | "instagram" | "kakao" | "facebook";

const FOOTER_SNS_LINKS: Array<{ key: SnsKey; srKey: string; href: string }> = [
  { key: "blog", srKey: "footerSrSnsBlog", href: "https://blog.naver.com/drugsafe_official" },
  { key: "youtube", srKey: "footerSrSnsYoutube", href: "https://www.youtube.com/@drugsafe_official/featured" },
  { key: "instagram", srKey: "footerSrSnsInstagram", href: "https://www.instagram.com/drugsafe_official/" },
  { key: "kakao", srKey: "footerSrSnsKakao", href: "https://pf.kakao.com/_HxdIxgj" },
  { key: "facebook", srKey: "footerSrSnsFacebook", href: "https://www.facebook.com/drugsafeofficial/" },
];

type FooterMetaLink = {
  key: string;
  labelKey: string;
  href: string;
  target: string;
  pointLink?: boolean;
  rel?: string;
};

const FOOTER_META_LINKS: FooterMetaLink[] = [
  {
    key: "privacy",
    labelKey: "privacyPolicy",
    href: `${PORTAL_PP}/etc/PrivacyPolicy`,
    target: "TRMS_STT",
    pointLink: true,
  },
  { key: "terms", labelKey: "termsOfUse", href: `${PORTAL_PP}/etc/Terms`, target: "TRMS_STT" },
  { key: "cctv", labelKey: "cctvPolicy", href: `${PORTAL_PP}/etc/CctvPolicy`, target: "TRMS_STT" },
  {
    key: "kogl",
    labelKey: "koglLicense",
    href: "https://www.kogl.or.kr/info/licenseType1.do",
    target: "kogl",
    rel: "noopener noreferrer",
  },
];

export default function Footer() {
  const { t } = useTranslation();

  return (
    <Box component="footer" className="footer">
      <RelatedSites />
      <Box className="page-container" style={{ paddingTop: "35px", paddingBottom: "35px" }}>
        <Box className="footer-brand">
          <Box className="footer-logo-area">
            <Box className="footer-logo">
              <Link to="/" aria-label={t("kidsHomeAria")}>
                <img src={potalFooterLogo} alt={`KIDS ${t("kidsName")}`} />
              </Link>
            </Box>
          </Box>
          <Box className="footer-sns-area">
            <Box className="footer-sns-link">
              <Stack className="sns-group" direction="row">
                {FOOTER_SNS_LINKS.map((item) => (
                  <MuiLink
                    key={item.key}
                    href={item.href}
                    className={`sns-item ${item.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="always"
                  >
                    <Typography component="span" className="sr-only">
                      {t(item.srKey)}
                    </Typography>
                  </MuiLink>
                ))}
              </Stack>
            </Box>
          </Box>
        </Box>

        <Box className="footer-corporate-info">
          <Box className="info-txt-area">
            <Box className="info-txt">
              <Typography className="address" component="p">
                {t("kidsAddress")}
              </Typography>
              <Typography component="p">{`${t("bizRegNo")} 101-82-21134`}</Typography>
              <Typography component="p">{`${t("mainTel")} 02-2172-6700`}</Typography>
              <Typography component="p">{`${t("fax")} 02-2172-6701`}</Typography>
            </Box>
          </Box>
          <Box className="info-link-area">
            <Box className="info-link">
              <Stack className="link-group" direction="column" component="div">
                <MuiLink
                  href="#"
                  rel="noopener noreferrer"
                  underline="hover"
                  className="footer-info-link"
                  onClick={(e) => e.preventDefault()}
                >
                  {t("sitemap")}
                  <ChevronRight className="link-icon" fontSize="small" aria-hidden />
                </MuiLink>
                <MuiLink href={FOOTER_DIRECTIONS_HREF} rel="noopener noreferrer" underline="hover" className="footer-info-link">
                  {t("directions")}
                  <ChevronRight className="link-icon" fontSize="small" aria-hidden />
                </MuiLink>
              </Stack>
            </Box>
          </Box>
        </Box>

        <Box className="footer-meta-info">
          <Box className="meta-links">
            {FOOTER_META_LINKS.map((item) => (
              <MuiLink
                key={item.key}
                href={item.href}
                target={item.target}
                rel={item.rel}
                underline="always"
                className={`meta-item${item.pointLink ? " point-link" : ""}`}
              >
                {t(item.labelKey)}
                <Typography component="span" className="sr-only">
                  {t("footerSrMetaNewWin")}
                </Typography>
              </MuiLink>
            ))}
          </Box>
          <Box className="copyright">
            <Typography component="p">© Korea Institute of Drug Safety &amp; Risk Management. All rights reserved.</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
