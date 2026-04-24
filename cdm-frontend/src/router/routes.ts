const ROOT = "";
const AD = `${ROOT}/cm`;
const MB = `${ROOT}/ucm`;
const CDM = "/cdm";
const RESEARCH = "/researches";
const COMMUNITY = "/community";

export const ROUTES = {
  ROOT: ROOT,

  CM: {
    ROOT: `${ROOT}`,

    AD: {
      ROOT: AD,
      LOGIN: `${AD}/login`,
      DASHBOARD: `${AD}/dashboard`,

      RESEARCH: {
        ROOT: `${AD}${RESEARCH}`,
        OWNER: `${AD}${RESEARCH}/owner`,
        PARTNER: `${AD}${RESEARCH}/partner`,
        SETTING: `${AD}${RESEARCH}/setting`,
        CREATE: `${AD}${RESEARCH}/owner/post`,
        EDIT: `${AD}${RESEARCH}/:asmtSn/edit`,
        DETAIL: `${AD}${RESEARCH}/:role/:asmtSn`,
      },

      CDM: {
        ROOT: `${AD}${CDM}`,
        DISCLOSURES: `${AD}${CDM}/DisclosureList`,
        DISCLOSURES_ADMIN: `${AD}${CDM}/DisclosureListAdmin`,
        DISCLOSURES_CUSTOMER: `${AD}${CDM}/DisclosureListCustomer`,
        DISCLOSURE_CREATE: `${AD}${CDM}/DisclosureCreate`,
        DISCLOSURE_EDIT: `${AD}${CDM}/DisclosureEdit`,
        DISCLOSURE_DETAIL: `${AD}${CDM}/DisclosureDetail`,
        DISCLOSURE_DETAIL_ADMIN: `${AD}${CDM}/DisclosureDetailAdmin`,
        DISCLOSURE_DETAIL_CUSTOMER: `${AD}${CDM}/DisclosureDetailCustomer`,
        UPLOAD: `${AD}${CDM}/DisclosureUpload`,
        UPLOAD_SUMMARY: `${AD}${CDM}/CDMInfoReporting`,
        UPLOAD_SUMMARY_PIE: `${AD}${CDM}/UploadSummaryReportPie`,
        VALIDATE_RULE_LIST: `${AD}${CDM}/ValidateRuleList`,
        VALIDATE_RULE_DETAIL: `${AD}${CDM}/ValidateRuleDetail`,
        VALIDATE_RULE_EDIT: `${AD}${CDM}/ValidateRuleCreateEdit`,
        INFO: `${AD}${CDM}/CDMInfo`,
        INFO_REPORTING: `${AD}${CDM}/CDMInfoReporting`,
        PARTNER_INFO_WRITE: `${AD}${CDM}/PartnerInformationWrite`,
      },

      COMMUNITY: {
        ROOT: `${AD}${COMMUNITY}`,
        QNA: {
          MEMBER_LIST: `${AD}${COMMUNITY}/qna/member/qnaList`,
          ADMIN_LIST: `${AD}${COMMUNITY}/qna/admin/qnaList`,
          WRITE: `${AD}${COMMUNITY}/qna/qnaWrite`,
          PRIVACY: `${AD}${COMMUNITY}/qna/privacy`,
          ADMIN_DETAIL: `${AD}${COMMUNITY}/qna/admin/qnaDetail`,
          MEMBER_DETAIL: `${AD}${COMMUNITY}/qna/member/qnaDetail`,
        },
        FAQ: {
          ADMIN_LIST: `${AD}${COMMUNITY}/faq/admin/faqList`,
          ADMIN_WRITE: `${AD}${COMMUNITY}/faq/admin/faqWrite`,
          ADMIN_DETAIL: `${AD}${COMMUNITY}/faq/admin/faqDetail`,
          MEMBER_LIST: `${AD}${COMMUNITY}/faq/member/faqList`,
        },
        FREEBOARD: {
          MEMBER_LIST: `${AD}${COMMUNITY}/freeboard/member/freeBoardList`,
          MEMBER_WRITE: `${AD}${COMMUNITY}/freeboard/member/freeboardWrite`,
          MEMBER_DETAIL: `${AD}${COMMUNITY}/freeboard/member/freeboardDetail`,
          ADMIN_LIST: `${AD}${COMMUNITY}/freeboard/admin/freeBoardList`,
          ADMIN_DETAIL: `${AD}${COMMUNITY}/freeboard/admin/freeboardDetail`,
        },
        SITE_MAP: `${AD}${COMMUNITY}/userGuide/siteMap`,
      },
    },

    MB: {
      ROOT: MB,
      LOGIN: `${MB}/login`,
      PARTNER_DASHBOARD: `${MB}/partnerDashboard`,

      RESEARCH: {
        ROOT: `${MB}${RESEARCH}`,
        OWNER: `${MB}${RESEARCH}/owner`,
        PARTNER: `${MB}${RESEARCH}/partner`,
        CREATE: `${MB}${RESEARCH}/owner/post`,
        EDIT: `${MB}${RESEARCH}/:asmtSn/edit`,
        DETAIL: `${MB}${RESEARCH}/:role/:asmtSn`,
      },

      CDM: {
        ROOT: `${MB}${CDM}`,
        DISCLOSURES: `${MB}${CDM}/DisclosureList`,
        DISCLOSURES_ADMIN: `${MB}${CDM}/DisclosureListAdmin`,
        DISCLOSURES_CUSTOMER: `${MB}${CDM}/DisclosureListCustomer`,
        DISCLOSURE_CREATE: `${MB}${CDM}/DisclosureCreate`,
        DISCLOSURE_EDIT: `${MB}${CDM}/DisclosureEdit`,
        DISCLOSURE_DETAIL: `${MB}${CDM}/DisclosureDetail`,
        DISCLOSURE_DETAIL_ADMIN: `${MB}${CDM}/DisclosureDetailAdmin`,
        DISCLOSURE_DETAIL_CUSTOMER: `${MB}${CDM}/DisclosureDetailCustomer`,
        UPLOAD: `${MB}${CDM}/DisclosureUpload`,
        UPLOAD_SUMMARY: `${MB}${CDM}/CDMInfoReporting`,
        UPLOAD_SUMMARY_PIE: `${MB}${CDM}/UploadSummaryReportPie`,
        VALIDATE_RULE_LIST: `${MB}${CDM}/ValidateRuleList`,
        VALIDATE_RULE_DETAIL: `${MB}${CDM}/ValidateRuleDetail`,
        VALIDATE_RULE_EDIT: `${MB}${CDM}/ValidateRuleCreateEdit`,
        INFO: `${MB}${CDM}/CDMInfo`,
        INFO_REPORTING: `${MB}${CDM}/CDMInfoReporting`,
        PARTNER_INFO_WRITE: `${MB}${CDM}/PartnerInformationWrite`,
      },

      COMMUNITY: {
        ROOT: `${MB}${COMMUNITY}`,
        QNA: {
          MEMBER_LIST: `${MB}${COMMUNITY}/qna/member/qnaList`,
          ADMIN_LIST: `${MB}${COMMUNITY}/qna/admin/qnaList`,
          WRITE: `${MB}${COMMUNITY}/qna/qnaWrite`,
          PRIVACY: `${MB}${COMMUNITY}/qna/privacy`,
          ADMIN_DETAIL: `${MB}${COMMUNITY}/qna/admin/qnaDetail`,
          MEMBER_DETAIL: `${MB}${COMMUNITY}/qna/member/qnaDetail`,
        },
        FAQ: {
          ADMIN_LIST: `${MB}${COMMUNITY}/faq/admin/faqList`,
          ADMIN_WRITE: `${MB}${COMMUNITY}/faq/admin/faqWrite`,
          ADMIN_DETAIL: `${MB}${COMMUNITY}/faq/admin/faqDetail`,
          MEMBER_LIST: `${MB}${COMMUNITY}/faq/member/faqList`,
        },
        FREEBOARD: {
          MEMBER_LIST: `${MB}${COMMUNITY}/freeboard/member/freeBoardList`,
          MEMBER_WRITE: `${MB}${COMMUNITY}/freeboard/member/freeboardWrite`,
          MEMBER_DETAIL: `${MB}${COMMUNITY}/freeboard/member/freeboardDetail`,
          ADMIN_LIST: `${MB}${COMMUNITY}/freeboard/admin/freeBoardList`,
          ADMIN_DETAIL: `${MB}${COMMUNITY}/freeboard/admin/freeboardDetail`,
        },
        SITE_MAP: `${MB}${COMMUNITY}/userGuide/siteMap`,
      },
    },
  },
} as const;
