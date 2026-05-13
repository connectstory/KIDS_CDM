// config/menus.ts
import { ROUTES } from "@/router/routes";
import type { CollapsibleNavItem } from "@/components/tree-menu/collapsibleSideNav.types";

// ── 메뉴 타입 ─────────────────────────────────────────────────────────────────
export interface MenuItemType {
  id: string;
  label: string;
  path?: string;
  icon?: string;
  children?: MenuItemType[];
}

// // ── 메뉴 목록 ─────────────────────────────────────────────────────────────────
// export const menus: MenuItemType[] = [

//   // ══════════════════════════════════════════════════════════════════════════
//   // 포털 CDM (대국민)
//   // ══════════════════════════════════════════════════════════════════════════
//   {
//     id: "portal-1",
//     label: "사업개요",
//     children: [
//       { id: "portal-1-1", label: "사업배경", path: "/cm/community/content/background/member/list" },
//       { id: "portal-1-2", label: "사업목적", path: "/cm/community/content/objective/member/list" },
//       { id: "portal-1-3", label: "협연센터", path: "/cm/community/content/coordinationCenter/member/list" },
//       { id: "portal-1-4", label: "협력기관", path: "/cm/community/content/partnerInstitution/member/list" },
//     ],
//   },
//   {
//     id: "portal-2",
//     label: "CDM이란",
//     children: [
//       { id: "portal-2-1", label: "CDM 정의", path: "/cm/community/content/cdmDefinition/member/list" },
//       { id: "portal-2-2", label: "CDM 구조", path: "/cm/community/content/cdmStructure/member/list" },
//       { id: "portal-2-3", label: "CDM 구축과정", path: "/cm/community/content/cdmImplementation/member/list" },
//       { id: "portal-2-4", label: "정보보안", path: "/cm/community/content/informationSecurity/member/list" },
//     ],
//   },
//   {
//     id: "portal-3",
//     label: "CDM 통합정보",
//     path: "/cm/community/cdmOverview/member/list",
//   },
//   {
//     id: "portal-4",
//     label: "참여마당",
//     children: [
//       { id: "portal-4-1", label: "공지사항", path: "/cm/community/notice/member/list" },
//       { id: "portal-4-2", label: "보도자료", path: "/cm/community/pressRelease/member/list" },
//       { id: "portal-4-3", label: "FAQ", path: "/cm/community/faq/member/faqList" },
//       { id: "portal-4-4", label: "Q&A", path: "/cm/community/qna/member/qnaList" },
//       { id: "portal-4-5", label: "과제제안", path: "/cm/community/taskproposal/member/taskproposalList" },
//     ],
//   },

//   // ══════════════════════════════════════════════════════════════════════════
//   // 마이페이지 (협력기관)
//   // ══════════════════════════════════════════════════════════════════════════
//   {
//     id: "partner-1",
//     label: "협력기관 대시보드",
//     path: ROUTES.CM.PARTNER_DASHBOARD,
//     icon: "Dashboard",
//   },
//   {
//     id: "partner-2",
//     label: "CDM 업로드 관리",
//     children: [
//       { id: "partner-2-1", label: "공시목록", path: "/cm/cdm/DisclosureList" },
//       { id: "partner-2-2", label: "공시등록", path: "/cm/cdm/DisclosureCreate" },
//       { id: "partner-2-3", label: "공시 업로드", path: "/cm/cdm/DisclosureUpload" },
//       { id: "partner-2-4", label: "기관현황 작성", path: "/cm/cdm/PartnerInformationWrite" },
//       { id: "partner-2-5", label: "검증규칙 목록", path: "/cm/cdm/ValidateRuleList" },
//       { id: "partner-2-6", label: "검증규칙 상세", path: "/cm/cdm/ValidateRuleDetail" },
//       { id: "partner-2-7", label: "검증규칙 생성/편집", path: "/cm/cdm/ValidateRuleCreateEdit" },
//       { id: "partner-2-8", label: "수집현황상세", path: "/cm/cdm/CDMInfoReporting" },
//       { id: "partner-2-10", label: "업로드 결과-파이타입", path: "/cm/cdm/UploadSummaryReportPie" },
//     ],
//   },
//   {
//     id: "partner-3",
//     label: "연구과제관리",
//     children: [
//       { id: "partner-3-1", label: "과제 관리", path: ROUTES.CM.RESEARCH.OWNER },
//       { id: "partner-3-2", label: "과제 참여", path: ROUTES.CM.RESEARCH.PARTNER },
//     ],
//   },
//   {
//     id: "partner-4",
//     label: "알림센터",
//     children: [
//       { id: "partner-4-1", label: "공지사항", path: "/cm/community/notice/member/list" },
//       { id: "partner-4-2", label: "회의∙행사", path: "/cm/community/meetingEventInfo/member/list" },
//       { id: "partner-4-3", label: "CDM 통합정보", path: "/cm/community/cdmOverview/member/list" },
//     ],
//   },
//   {
//     id: "partner-5",
//     label: "자료실",
//     path: "/cm/community/resourceCenter/member/list",
//   },
//   {
//     id: "partner-6",
//     label: "커뮤니티",
//     children: [
//       { id: "partner-6-1", label: "연구과제", path: "/cm/community/researchProject/member/freeBoardList" },
//       { id: "partner-6-2", label: "과제제안", path: "/cm/community/taskproposal/member/taskproposalList" },
//       { id: "partner-6-3", label: "자유게시판", path: "/cm/community/freeboard/member/freeBoardList" },
//       { id: "partner-6-4", label: "Q&A", path: "/cm/community/qna/member/qnaList" },
//     ],
//   },

//   // ══════════════════════════════════════════════════════════════════════════
//   // 관리시스템 (관리자)
//   // ══════════════════════════════════════════════════════════════════════════
//   {
//     id: "admin-1",
//     label: "관리자 대시보드",
//     path: ROUTES.CM.DASHBOARD,
//     icon: "Dashboard",
//   },
//   {
//     id: "admin-2",
//     label: "CDM 관리",
//     children: [
//       { id: "admin-2-1", label: "공시목록", path: "/cm/cdm/DisclosureList" },
//       { id: "admin-2-2", label: "공시등록", path: "/cm/cdm/DisclosureCreate" },
//       { id: "admin-2-3", label: "공시 업로드", path: "/cm/cdm/DisclosureUpload" },
//       { id: "admin-2-4", label: "기관현황 작성", path: "/cm/cdm/PartnerInformationWrite" },
//       { id: "admin-2-5", label: "검증규칙 목록", path: "/cm/cdm/ValidateRuleList" },
//       { id: "admin-2-6", label: "검증규칙 상세", path: "/cm/cdm/ValidateRuleDetail" },
//       { id: "admin-2-7", label: "검증규칙 생성/편집", path: "/cm/cdm/ValidateRuleCreateEdit" },
//       { id: "admin-2-8", label: "수집현황상세", path: "/cm/cdm/CDMInfoReporting" },
//       { id: "admin-2-10", label: "업로드 결과-파이타입", path: "/cm/cdm/UploadSummaryReportPie" },
//     ],
//   },
//   {
//     id: "admin-3",
//     label: "연구과제관리",
//     children: [
//       { id: "admin-3-1", label: "과제 관리", path: ROUTES.CM.RESEARCH.OWNER },
//     ],
//   },
//   {
//     id: "admin-4",
//     label: "알림센터관리",
//     children: [
//       { id: "admin-4-1", label: "공지사항", path: "/cm/community/notice/admin/list" },
//       { id: "admin-4-2", label: "보도자료", path: "/cm/community/pressRelease/admin/list" },
//       { id: "admin-4-3", label: "회의∙행사", path: "/cm/community/meetingEventInfo/admin/list" },
//       { id: "admin-4-4", label: "CDM 통합정보", path: "/cm/community/cdmOverview/admin/list" },
//       { id: "admin-4-5", label: "자료실", path: "/cm/community/resourceCenter/admin/list" },
//       { id: "admin-4-6", label: "FAQ", path: "/cm/community/faq/admin/faqList" },
//     ],
//   },
//   {
//     id: "admin-5",
//     label: "커뮤니티관리",
//     children: [
//       { id: "admin-5-1", label: "연구과제", path: "/cm/community/researchProject/admin/freeBoardList" },
//       { id: "admin-5-2", label: "과제제안", path: "/cm/community/taskproposal/admin/taskproposalList" },
//       { id: "admin-5-3", label: "자유게시판", path: "/cm/community/freeboard/admin/freeBoardList" },
//       { id: "admin-5-4", label: "Q&A", path: "/cm/community/qna/admin/qnaList" },
//     ],
//   },
//   {
//     id: "admin-6",
//     label: "컨텐츠관리",
//     children: [
//       { id: "admin-6-1", label: "사업개요", path: "/cm/community/content/businessOverview/admin/list" },
//       { id: "admin-6-2", label: "CDM이란", path: "/cm/community/content/cdmIntroduction/admin/list" },
//     ],
//   },

// ];

// ── 메뉴 목록 ─────────────────────────────────────────────────────────────────
export const adminMenus: MenuItemType[] = [
  {
    id: "1",
    label: "대시보드",
    path: ROUTES.CM.AD.DASHBOARD,
    icon: "Dashboard",
  },
  {
    id: "2",
    label: "CDM 관리",
    children: [
      { id: "2-1", label: "CDM 업로드 공시", path: ROUTES.CM.AD.CDM.DISCLOSURES },
      { id: "2-2", label: "CDM 표준화 관리", path: ROUTES.CM.AD.CDM.VALIDATE_RULE_LIST },
      { id: "2-3", label: "CDM 통계", path: ROUTES.CM.AD.CDM.UPLOAD_SUMMARY_PIE },
    ],
  },
  {
    id: "3",
    label: "연구과제관리",
    children: [
      { id: "3-1", label: "과제 관리", path: ROUTES.CM.AD.RESEARCH.OWNER },
      { id: "3-2", label: "계정 현황", path: `${ROUTES.CM.AD.RESEARCH.ROOT}/setting` },
    ],
  },
  {
    id: "4",
    label: "알림센터관리",
    path: "/community",
    children: [
      { id: "4-1", label: "공지사항", path: `${ROUTES.CM.AD.ROOT}/community/notice/admin/list` },
      { id: "4-2", label: "보도자료", path: `${ROUTES.CM.AD.ROOT}/community/pressRelease/admin/list` },
      {
        id: "4-3",
        label: "회의/행사정보",
        path: `${ROUTES.CM.AD.ROOT}/community/meetingEventInfo/admin/list`,
      },
      {
        id: "4-4",
        label: "CDM 통합정보",
        path: `${ROUTES.CM.AD.ROOT}/community/cdmOverview/admin/list`,
      },
      { id: "4-5", label: "자료실", path: `${ROUTES.CM.AD.ROOT}/community/resourceCenter/admin/list` },
      { id: "4-6", label: "FAQ", path: ROUTES.CM.AD.COMMUNITY.FAQ.ADMIN_LIST },
    ],
  },
  {
    id: "5",
    label: "커뮤니티관리",
    path: "/community",
    children: [
      {
        id: "5-1",
        label: "연구과제",
        path: `${ROUTES.CM.AD.ROOT}/community/researchProject/admin/qna/list`,
      },
      {
        id: "5-2",
        label: "과제제안",
        path: ROUTES.CM.AD.COMMUNITY.PROPOSAL.ADMIN_LIST,
      },
      { id: "5-3", label: "자유게시판", path: ROUTES.CM.AD.COMMUNITY.FREEBOARD.ADMIN_LIST },
      { id: "5-4", label: "Q&A", path: ROUTES.CM.AD.COMMUNITY.QNA.ADMIN_LIST },
    ],
  },
];

export const potalMenus: CollapsibleNavItem[] = [
  {
    key: ROUTES.CM.MB.PARTNER_DASHBOARD,
    label: "대시보드",
  },
  {
    key: "2",
    label: "CDM 업로드 관리",
    children: [{ key: ROUTES.CM.MB.CDM.DISCLOSURES, label: "공시목록" }],
  },
  {
    key: "3",
    label: "연구과제관리",
    children: [
      { key: ROUTES.CM.MB.RESEARCH.OWNER, label: "과제 관리" },
      { key: ROUTES.CM.MB.RESEARCH.PARTNER, label: "과제 참여" },
    ],
  },
  {
    key: "4",
    label: "CDM 통합정보",
    children: [{ key: `${ROUTES.CM.MB.ROOT}/community/cdmOverview/member/list`, label: "CDM 통합정보" }],
  },
  {
    key: "5",
    label: "알림센터",
    children: [
      { key: `${ROUTES.CM.MB.ROOT}/community/notice/member/list`, label: "공지사항" },
      { key: `${ROUTES.CM.MB.ROOT}/community/meetingEventInfo/member/list`, label: "회의/행사정보" },
      { key: `${ROUTES.CM.MB.ROOT}/community/cdmOverview/member/list`, label: "CDM 통합정보" },
    ],
  },
  {
    key: "6",
    label: "자료실",
    children: [{ key: `${ROUTES.CM.MB.ROOT}/community/resourceCenter/member/list`, label: "자료실" }],
  },
  {
    key: "7",
    label: "커뮤니티",
    children: [
      { key: `${ROUTES.CM.MB.ROOT}/community/researchProject/member/qna/list`, label: "연구과제" },
      { key: ROUTES.CM.MB.COMMUNITY.PROPOSAL.MEMBER_LIST, label: "과제제안" },
      { key: ROUTES.CM.MB.COMMUNITY.FREEBOARD.MEMBER_LIST, label: "자유게시판" },
      { key: ROUTES.CM.MB.COMMUNITY.QNA.MEMBER_LIST, label: "Q&A" },
    ],
  },
];
