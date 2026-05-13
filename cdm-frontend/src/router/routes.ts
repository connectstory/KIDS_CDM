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
        DISCLOSURES: `${AD}${CDM}/disclosures`,
        DISCLOSURE_CREATE: `${AD}${CDM}/disclosures/create`,
        DISCLOSURE_EDIT: `${AD}${CDM}/disclosures/:pblntSn/edit`,
        DISCLOSURE_DETAIL: `${AD}${CDM}/disclosures/:pblntSn`,
        UPLOAD: `${AD}${CDM}/disclosures/upload`,
        UPLOAD_SUMMARY: `${AD}${CDM}/summary`,
        UPLOAD_SUMMARY_PIE: `${AD}${CDM}/summary/pie`,
        VALIDATE_RULE_LIST: `${AD}${CDM}/validators`,
        VALIDATE_RULE_DETAIL: `${AD}${CDM}/validators/:vrfcSn`,
        VALIDATE_RULE_CREATE: `${AD}${CDM}/validators/new`,
        VALIDATE_RULE_EDIT: `${AD}${CDM}/validators/:vrfcSn/edit`,
        INFO: `${AD}${CDM}/info`,
        INFO_REPORTING: `${AD}${CDM}/summary`,
        PARTNER_INFO_WRITE: `${AD}${CDM}/partner/information`,
      },

      COMMUNITY: {
        ROOT: `${AD}${COMMUNITY}`,
        QNA: {
          MEMBER_LIST: `${AD}${COMMUNITY}/qna/member/qna/list`,
          ADMIN_LIST: `${AD}${COMMUNITY}/qna/admin/qna/list`,
          WRITE: `${AD}${COMMUNITY}/qna/qna/write`,
          PRIVACY: `${AD}${COMMUNITY}/qna/privacy`,
          ADMIN_DETAIL: `${AD}${COMMUNITY}/qna/admin/qna/detail`,
          MEMBER_DETAIL: `${AD}${COMMUNITY}/qna/member/qna/detail`,
          ADMIN_ANSWER: `${AD}${COMMUNITY}/qna/admin/qna/answer`,
        },
        FAQ: {
          ADMIN_LIST: `${AD}${COMMUNITY}/faq/admin/list`,
          ADMIN_WRITE: `${AD}${COMMUNITY}/faq/admin/write`,
          ADMIN_DETAIL: `${AD}${COMMUNITY}/faq/admin/detail`,
          MEMBER_LIST: `${AD}${COMMUNITY}/faq/member/list`,
        },
        FREEBOARD: {
          MEMBER_LIST: `${AD}${COMMUNITY}/freeboard/member/freeboard/list`,
          MEMBER_WRITE: `${AD}${COMMUNITY}/freeboard/member/freeboard/write`,
          MEMBER_DETAIL: `${AD}${COMMUNITY}/freeboard/member/freeboard/detail`,
          ADMIN_LIST: `${AD}${COMMUNITY}/freeboard/admin/freeboard/list`,
          ADMIN_DETAIL: `${AD}${COMMUNITY}/freeboard/admin/freeboard/detail`,
        },
        PROPOSAL: {
          ROOT: `${AD}${COMMUNITY}/proposal`,
          CONSENT: `${AD}${COMMUNITY}/proposal/consent`,
          WRITE: `${AD}${COMMUNITY}/proposal/write`,
          MEMBER_LIST: `${AD}${COMMUNITY}/proposal/member/list`,
          MEMBER_DETAIL: `${AD}${COMMUNITY}/proposal/member/detail`,
          ADMIN_LIST: `${AD}${COMMUNITY}/proposal/admin/list`,
          ADMIN_DETAIL: `${AD}${COMMUNITY}/proposal/admin/detail`,
          ADMIN_ANSWER: `${AD}${COMMUNITY}/proposal/admin/answer`,
        },
        SITE_MAP: `${AD}${COMMUNITY}/guides/site-map`,
      },
    },

    MB: {
      ROOT: MB,
      LOGIN: `${MB}/login`,
      PARTNER_DASHBOARD: `${MB}/partner/dashboard`,

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
        DISCLOSURES: `${MB}${CDM}/disclosures`,
        DISCLOSURE_CREATE: `${MB}${CDM}/disclosures/create`,
        DISCLOSURE_EDIT: `${MB}${CDM}/disclosures/:pblntSn/edit`,
        DISCLOSURE_DETAIL: `${MB}${CDM}/disclosures/:pblntSn`,
        UPLOAD: `${MB}${CDM}/disclosures/upload`,
        UPLOAD_SUMMARY: `${MB}${CDM}/summary`,
        UPLOAD_SUMMARY_PIE: `${MB}${CDM}/summary/pie`,
        VALIDATE_RULE_LIST: `${MB}${CDM}/validators`,
        VALIDATE_RULE_DETAIL: `${MB}${CDM}/validators/:vrfcSn`,
        VALIDATE_RULE_CREATE: `${MB}${CDM}/validators/new`,
        VALIDATE_RULE_EDIT: `${MB}${CDM}/validators/:vrfcSn/edit`,
        INFO: `${MB}${CDM}/info`,
        INFO_REPORTING: `${MB}${CDM}/summary`,
        PARTNER_INFO_WRITE: `${MB}${CDM}/partner/information`,
      },

      COMMUNITY: {
        ROOT: `${MB}${COMMUNITY}`,
        QNA: {
          MEMBER_LIST: `${MB}${COMMUNITY}/qna/member/qna/list`,
          ADMIN_LIST: `${MB}${COMMUNITY}/qna/admin/qna/list`,
          WRITE: `${MB}${COMMUNITY}/qna/qna/write`,
          PRIVACY: `${MB}${COMMUNITY}/qna/privacy`,
          ADMIN_DETAIL: `${MB}${COMMUNITY}/qna/admin/qna/detail`,
          MEMBER_DETAIL: `${MB}${COMMUNITY}/qna/member/qna/detail`,
          ADMIN_ANSWER: `${MB}${COMMUNITY}/qna/admin/qna/answer`,
        },
        FAQ: {
          ADMIN_LIST: `${MB}${COMMUNITY}/faq/admin/list`,
          ADMIN_WRITE: `${MB}${COMMUNITY}/faq/admin/write`,
          ADMIN_DETAIL: `${MB}${COMMUNITY}/faq/admin/detail`,
          MEMBER_LIST: `${MB}${COMMUNITY}/faq/member/list`,
        },
        FREEBOARD: {
          MEMBER_LIST: `${MB}${COMMUNITY}/freeboard/member/freeboard/list`,
          MEMBER_WRITE: `${MB}${COMMUNITY}/freeboard/member/freeboard/write`,
          MEMBER_DETAIL: `${MB}${COMMUNITY}/freeboard/member/freeboard/detail`,
          ADMIN_LIST: `${MB}${COMMUNITY}/freeboard/admin/freeboard/list`,
          ADMIN_DETAIL: `${MB}${COMMUNITY}/freeboard/admin/freeboard/detail`,
        },
        PROPOSAL: {
          ROOT: `${MB}${COMMUNITY}/proposal`,
          CONSENT: `${MB}${COMMUNITY}/proposal/consent`,
          WRITE: `${MB}${COMMUNITY}/proposal/write`,
          MEMBER_LIST: `${MB}${COMMUNITY}/proposal/member/list`,
          MEMBER_DETAIL: `${MB}${COMMUNITY}/proposal/member/detail`,
          ADMIN_LIST: `${MB}${COMMUNITY}/proposal/admin/list`,
          ADMIN_DETAIL: `${MB}${COMMUNITY}/proposal/admin/detail`,
          ADMIN_ANSWER: `${MB}${COMMUNITY}/proposal/admin/answer`,
        },
        SITE_MAP: `${MB}${COMMUNITY}/guides/site-map`,
      },
    },
  },
} as const;
