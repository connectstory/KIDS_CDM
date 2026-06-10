// import CDMInfoReporting from "@/views/cdm/CDMInfoReporting.tsx";
// import DisclosureDetailCustomer from "@/views/cdm/DisclosureDetailCustomer.tsx";
// import Upload from "@/views/cdm/DisclosureUpload";
import PartnerInformationWrite from "@/views/cdm/PartnerInformationWrite.tsx";
import UploadSummaryReportPie from "@/views/cdm/UploadSummaryReportPie.tsx";
import ValidateRuleCreateEdit from "@/views/cdm/ValidateRuleCreateEdit.tsx";
import ValidateRuleDetail from "@/views/cdm/ValidateRuleDetail.tsx";
import ValidateRuleList from "@/views/cdm/ValidateRuleList.tsx";
import DisclosureCreate from "@/views/cdm/disclosure/DisclosureCreate.tsx";
import DisclosureDetail from "@/views/cdm/disclosure/DisclosureDetail";
import DisclosureEdit from "@/views/cdm/disclosure/DisclosureEdit.tsx";
import DisclosureList from "@/views/cdm/disclosure/DisclosureListAdmin";
import DisclosureListPartner from "@/views/cdm/disclosure/DisclosureListPartner";
import AdminBoardDetail from "@/views/community/board/admin/BoardDetail.tsx";
import AdminBoardList from "@/views/community/board/admin/BoardList.tsx";
import AdminBoardWrite from "@/views/community/board/admin/BoardWrite.tsx";
import MemberBoardDetail from "@/views/community/board/member/BoardDetail.tsx";
import MemberBoardList from "@/views/community/board/member/BoardList.tsx";
import ContentPreview from "@/views/community/content/ContentPreview.tsx";
import AdminContentList from "@/views/community/content/admin/ContentList.tsx";
import MemberContentList from "@/views/community/content/member/ContentList.tsx";
import FaqAdminDetail from "@/views/community/faq/admin/FaqDetail.tsx";
import FaqAdminList from "@/views/community/faq/admin/FaqList.tsx";
import FaqAdminWrite from "@/views/community/faq/admin/FaqWrite.tsx";
import FaqMemberList from "@/views/community/faq/member/FaqList.tsx";
import FreeBoardAdminDetail from "@/views/community/freeboard/admin/FreeboardDetail.tsx";
import FreeBoardAdminList from "@/views/community/freeboard/admin/FreeboardList.tsx";
import FreeBoardMemberDetail from "@/views/community/freeboard/member/FreeboardDetail.tsx";
import FreeBoardMemberList from "@/views/community/freeboard/member/FreeboardList.tsx";
import FreeBoardWrite from "@/views/community/freeboard/member/FreeboardWrite.tsx";
import PrivacyConsent from "@/views/community/qna/PrivacyConsent.tsx";
import QnAWrite from "@/views/community/qna/QnaWrite.tsx";
import QnAAdminAnswer from "@/views/community/qna/admin/QnaAnswer.tsx";
import QnAAdminDetail from "@/views/community/qna/admin/QnaDetail.tsx";
import QnAAdminList from "@/views/community/qna/admin/QnaList.tsx";
import QnAMemberDetail from "@/views/community/qna/member/QnaDetail.tsx";
import QnAMemberList from "@/views/community/qna/member/QnaList.tsx";
import ProposalConsent from "@/views/community/taskproposal/ProposalConsent.tsx";
import TaskproposalWrite from "@/views/community/taskproposal/TaskproposalWrite.tsx";
import TaskproposalAdminAnswer from "@/views/community/taskproposal/admin/TaskproposalAnswer.tsx";
import TaskproposalAdminDetail from "@/views/community/taskproposal/admin/TaskproposalDetail.tsx";
import TaskproposalAdminList from "@/views/community/taskproposal/admin/TaskproposalList.tsx";
import TaskproposalMemberDetail from "@/views/community/taskproposal/member/TaskproposalDetail.tsx";
import TaskproposalMemberList from "@/views/community/taskproposal/member/TaskproposalList.tsx";
import SiteMap from "@/views/community/userGuide/SiteMap.tsx";
import Dashboard from "@/views/dashboard/DashboardView.tsx";
import PartnerDashboard from "@/views/dashboard/PartnerDashboardView.tsx";
import ResearchOwner from "@/views/research/ResearchAdmin.tsx";
import ResearchDetail from "@/views/research/ResearchDetail.tsx";
import ResearchPartner from "@/views/research/ResearchPartner.tsx";
import ResearchSetting from "@/views/research/ResearchSetting.tsx";
import ResearchWrite from "@/views/research/ResearchWrite.tsx";

export const adminContentRoutes = [
  { path: "dashboard", element: <Dashboard />, handle: { title: "대시보드" } },

  {
    path: "disclosures",
    handle: { title: "CDM" },
    children: [
      { index: true, element: <DisclosureList />, handle: { title: "공시목록" } },
      { path: "create", element: <DisclosureCreate />, handle: { title: "공시등록" } },
      // { path: ":pblntSn/upload", element: <Upload />, handle: { title: "CDM 데이터 업로드" } },
      { path: ":pblntSn/edit", element: <DisclosureEdit />, handle: { title: "공시수정" } },
      { path: ":pblntSn", element: <DisclosureDetail />, handle: { title: "공시상세" } },
      { path: "validators/new", element: <ValidateRuleCreateEdit />, handle: { title: "검증규칙생성편집" } },
      { path: "validators/:vrfcSn/edit", element: <ValidateRuleCreateEdit />, handle: { title: "검증규칙생성편집" } },
      { path: "validators/:vrfcSn", element: <ValidateRuleDetail />, handle: { title: "검증규칙상세" } },
      { path: "validators", element: <ValidateRuleList />, handle: { title: "CDM 표준화 관리" } },
      // { path: ":pblntSn/summary", element: <CDMInfoReporting />, handle: { title: "수집현황상세" } },
      { path: "summary/pie", element: <UploadSummaryReportPie />, handle: { title: "CDM 통계정보" } },
    ],
  },

  {
    path: "researches",
    handle: { title: "연구과제" },
    children: [
      { path: "owner", element: <ResearchOwner />, handle: { title: "과제 관리" } },
      { path: "owner/create", element: <ResearchWrite />, handle: { title: "과제 등록" } },
      { path: "partner", element: <ResearchPartner />, handle: { title: "과제 참여" } },
      { path: "setting", element: <ResearchSetting />, handle: { title: "계정 현황" } },
      { path: ":asmtSn/edit", element: <ResearchWrite />, handle: { title: "과제 수정" } },
      { path: ":role/:asmtSn", element: <ResearchDetail />, handle: { title: "과제 상세" } },
    ],
  },

  {
    path: "community",
    handle: { title: "참여마당" },
    children: [
      { path: "proposal/consent", element: <ProposalConsent />, handle: { title: "과제제안" } },
      { path: "proposal/write/:id", element: <TaskproposalWrite />, handle: { title: "과제제안" } },
      { path: "proposal/write", element: <TaskproposalWrite />, handle: { title: "과제제안" } },
      { path: "proposal/member/detail/:id", element: <TaskproposalMemberDetail />, handle: { title: "과제제안" } },
      { path: "proposal/member/list", element: <TaskproposalMemberList />, handle: { title: "과제제안" } },
      { path: "proposal/admin/detail/:id", element: <TaskproposalAdminDetail />, handle: { title: "과제제안" } },
      { path: "proposal/admin/list", element: <TaskproposalAdminList />, handle: { title: "과제제안" } },
      { path: "proposal/admin/answer", element: <TaskproposalAdminAnswer />, handle: { title: "과제제안" } },

      { path: "faq/admin/write", element: <FaqAdminWrite />, handle: { title: "FAQ" } },
      { path: "faq/admin/detail/:id", element: <FaqAdminDetail />, handle: { title: "FAQ" } },
      { path: "faq/admin/list", element: <FaqAdminList />, handle: { title: "FAQ" } },
      { path: "faq/member/list", element: <FaqMemberList />, handle: { title: "FAQ" } },

      { path: ":boardType/admin/qna/answer/:id", element: <QnAAdminAnswer />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/qna/list", element: <QnAMemberList />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/qna/list", element: <QnAAdminList />, handle: { titleKey: "Board" } },
      { path: ":boardType/qna/create/:id", element: <QnAWrite />, handle: { titleKey: "Board" } },
      { path: ":boardType/qna/create", element: <QnAWrite />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/qna/detail/:id", element: <QnAAdminDetail />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/qna/detail/:id", element: <QnAMemberDetail />, handle: { titleKey: "Board" } },
      { path: ":boardType/privacy", element: <PrivacyConsent />, handle: { titleKey: "Board" } },

      { path: ":boardType/member/freeboard/list", element: <FreeBoardMemberList />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/freeboard/write", element: <FreeBoardWrite />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/freeboard/detail/:id", element: <FreeBoardMemberDetail />, handle: { titleKey: "Board" } },

      { path: ":boardType/admin/freeboard/list", element: <FreeBoardAdminList />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/freeboard/detail/:id", element: <FreeBoardAdminDetail />, handle: { titleKey: "Board" } },

      { path: ":boardType/admin/list", element: <AdminBoardList />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/detail/:id", element: <AdminBoardDetail />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/write", element: <AdminBoardWrite />, handle: { titleKey: "Board" } },

      { path: ":boardType/member/list", element: <MemberBoardList />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/detail/:id", element: <MemberBoardDetail />, handle: { titleKey: "Board" } },

      { path: "content/:boardType/admin/list", element: <AdminContentList />, handle: { titleKey: "Board" } },
      { path: "content/:boardType/member/list", element: <MemberContentList />, handle: { titleKey: "Board" } },
      { path: "content/:boardType/contentPreview", element: <ContentPreview />, handle: { titleKey: "Board" } },

      { path: "guides/site-map", element: <SiteMap />, handle: { title: "사이트맵" } },
    ],
  },
];

export const partnerContentRoutes = [
  { path: "partner/dashboard", element: <PartnerDashboard />, handle: { title: "대시보드" } },

  {
    path: "disclosures",
    handle: { title: "CDM" },
    children: [
      { index: true, element: <DisclosureListPartner />, handle: { title: "공시목록" } },
      { path: ":pblntSn", element: <DisclosureDetail />, handle: { title: "공시상세" } },
      { path: "validators/new", element: <ValidateRuleCreateEdit />, handle: { title: "검증규칙생성편집" } },
      { path: "validators/:vrfcSn/edit", element: <ValidateRuleCreateEdit />, handle: { title: "검증규칙생성편집" } },
      { path: "validators/:vrfcSn", element: <ValidateRuleDetail />, handle: { title: "검증규칙상세" } },
      { path: "validators", element: <ValidateRuleList />, handle: { title: "CDM 표준화 관리" } },
      // { path: ":pblntSn/summary", element: <CDMInfoReporting />, handle: { title: "수집현황상세" } },
      // { path: ":pblntSn/upload", element: <Upload />, handle: { title: "CDM 데이터 업로드" } },
      { path: "partner/information", element: <PartnerInformationWrite />, handle: { title: "기관현황작성" } },
    ],
  },

  {
    path: "researches",
    handle: { title: "연구과제" },
    children: [
      { path: "owner", element: <ResearchOwner />, handle: { title: "과제 관리" } },
      { path: "owner/create", element: <ResearchWrite />, handle: { title: "과제 등록" } },
      { path: "partner", element: <ResearchPartner />, handle: { title: "과제 참여" } },
      { path: ":asmtSn/edit", element: <ResearchWrite />, handle: { title: "과제 수정" } },
      { path: ":role/:asmtSn", element: <ResearchDetail />, handle: { title: "과제 상세" } },
    ],
  },

  {
    path: "community",
    handle: { title: "참여마당" },
    children: [
      { path: "proposal/consent", element: <ProposalConsent />, handle: { title: "과제제안" } },
      { path: "proposal/write/:id", element: <TaskproposalWrite />, handle: { title: "과제제안" } },
      { path: "proposal/write", element: <TaskproposalWrite />, handle: { title: "과제제안" } },
      { path: "proposal/member/detail/:id", element: <TaskproposalMemberDetail />, handle: { title: "과제제안" } },
      { path: "proposal/member/list", element: <TaskproposalMemberList />, handle: { title: "과제제안" } },
      { path: "proposal/admin/detail/:id", element: <TaskproposalAdminDetail />, handle: { title: "과제제안" } },
      { path: "proposal/admin/list", element: <TaskproposalAdminList />, handle: { title: "과제제안" } },
      { path: "proposal/admin/answer", element: <TaskproposalAdminAnswer />, handle: { title: "과제제안" } },

      { path: "faq/admin/write", element: <FaqAdminWrite />, handle: { title: "FAQ" } },
      { path: "faq/admin/detail/:id", element: <FaqAdminDetail />, handle: { title: "FAQ" } },
      { path: "faq/admin/list", element: <FaqAdminList />, handle: { title: "FAQ" } },
      { path: "faq/member/list", element: <FaqMemberList />, handle: { title: "FAQ" } },

      { path: ":boardType/admin/qna/answer/:id", element: <QnAAdminAnswer />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/qna/list", element: <QnAMemberList />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/qna/list", element: <QnAAdminList />, handle: { titleKey: "Board" } },
      { path: ":boardType/qna/create/:id", element: <QnAWrite />, handle: { titleKey: "Board" } },
      { path: ":boardType/qna/create", element: <QnAWrite />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/qna/detail/:id", element: <QnAAdminDetail />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/qna/detail/:id", element: <QnAMemberDetail />, handle: { titleKey: "Board" } },
      { path: ":boardType/privacy", element: <PrivacyConsent />, handle: { titleKey: "Board" } },

      { path: ":boardType/member/freeboard/list", element: <FreeBoardMemberList />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/freeboard/write", element: <FreeBoardWrite />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/freeboard/detail/:id", element: <FreeBoardMemberDetail />, handle: { titleKey: "Board" } },

      { path: ":boardType/admin/freeboard/list", element: <FreeBoardAdminList />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/freeboard/detail/:id", element: <FreeBoardAdminDetail />, handle: { titleKey: "Board" } },

      { path: ":boardType/admin/list", element: <AdminBoardList />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/detail/:id", element: <AdminBoardDetail />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/write", element: <AdminBoardWrite />, handle: { titleKey: "Board" } },

      { path: ":boardType/member/list", element: <MemberBoardList />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/detail/:id", element: <MemberBoardDetail />, handle: { titleKey: "Board" } },

      { path: "content/:boardType/admin/list", element: <AdminContentList />, handle: { titleKey: "Board" } },
      { path: "content/:boardType/member/list", element: <MemberContentList />, handle: { titleKey: "Board" } },
      { path: "content/:boardType/contentPreview", element: <ContentPreview />, handle: { titleKey: "Board" } },

      { path: "guides/site-map", element: <SiteMap />, handle: { title: "사이트맵" } },
    ],
  },
];
