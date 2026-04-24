import CDMInfoReporting from "@/views/cdm/CDMInfoReporting.tsx";
import DisclosureCreate from "@/views/cdm/DisclosureCreate.tsx";
import DisclosureDetailAdmin from "@/views/cdm/DisclosureDetailAdmin.tsx";
import DisclosureDetailCustomer from "@/views/cdm/DisclosureDetailCustomer.tsx";
import DisclosureDetailWrapper from "@/views/cdm/DisclosureDetailWrapper.tsx";
import DisclosureEdit from "@/views/cdm/DisclosureEdit.tsx";
import DisclosureList from "@/views/cdm/DisclosureListAdmin.tsx";
import DisclosureListCustomer from "@/views/cdm/DisclosureListCustomer.tsx";
import DisclosureListWrapper from "@/views/cdm/DisclosureListWrapper.tsx";
import Upload from "@/views/cdm/DisclosureUpload";
import PartnerInformationWrite from "@/views/cdm/PartnerInformationWrite.tsx";
import UploadSummaryReportPie from "@/views/cdm/UploadSummaryReportPie.tsx";
import ValidateRuleCreateEdit from "@/views/cdm/ValidateRuleCreateEdit.tsx";
import ValidateRuleDetail from "@/views/cdm/ValidateRuleDetail.tsx";
import ValidateRuleList from "@/views/cdm/ValidateRuleList.tsx";
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

export const contentRoutes = [
  { path: "dashboard", element: <Dashboard />, handle: { title: "대시보드" } },
  { path: "partnerDashboard", element: <PartnerDashboard />, handle: { title: "대시보드" } },

  {
    path: "researches",
    handle: { title: "연구과제" },
    children: [
      { path: "owner", element: <ResearchOwner />, handle: { title: "과제 관리" } },
      { path: "owner/post", element: <ResearchWrite />, handle: { title: "과제 등록" } },
      { path: "partner", element: <ResearchPartner />, handle: { title: "과제 참여" } },
      { path: "setting", element: <ResearchSetting />, handle: { title: "계정 현황" } },
      { path: ":asmtSn/edit", element: <ResearchWrite />, handle: { title: "과제 수정" } },
      { path: ":role/:asmtSn", element: <ResearchDetail />, handle: { title: "과제 상세" } },
    ],
  },

  {
    path: "cdm",
    handle: { title: "CDM" },
    children: [
      { path: "DisclosureList", element: <DisclosureListWrapper />, handle: { title: "공시목록" } },
      { path: "DisclosureListAdmin", element: <DisclosureList />, handle: { title: "공시목록" } },
      { path: "DisclosureListCustomer", element: <DisclosureListCustomer />, handle: { title: "공시목록" } },
      { path: "DisclosureCreate", element: <DisclosureCreate />, handle: { title: "공시등록" } },
      { path: "DisclosureEdit", element: <DisclosureEdit />, handle: { title: "공시수정" } },
      { path: "DisclosureDetail", element: <DisclosureDetailWrapper />, handle: { title: "공시상세" } },
      { path: "DisclosureDetailAdmin", element: <DisclosureDetailAdmin />, handle: { title: "공시상세" } },
      { path: "DisclosureDetailCustomer", element: <DisclosureDetailCustomer />, handle: { title: "공시상세" } },
      { path: "PartnerInformationWrite", element: <PartnerInformationWrite />, handle: { title: "기관현황작성" } },
      { path: "ValidateRuleList", element: <ValidateRuleList />, handle: { title: "CDM 표준화 관리" } },
      { path: "ValidateRuleDetail", element: <ValidateRuleDetail />, handle: { title: "검증규칙상세" } },
      { path: "ValidateRuleCreateEdit", element: <ValidateRuleCreateEdit />, handle: { title: "검증규칙생성편집" } },
      { path: "CDMInfoReporting", element: <CDMInfoReporting />, handle: { title: "수집현황상세" } },
      { path: "UploadSummaryReportPie", element: <UploadSummaryReportPie />, handle: { title: "CDM 통계정보" } },
      { path: "DisclosureUpload", element: <Upload />, handle: { title: "CDM 데이터 업로드" } },
    ],
  },

  {
    path: "community",
    handle: { title: "참여마당" },
    children: [
      { path: ":boardType/admin/qnaAnswer/:id", element: <QnAAdminAnswer />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/qnaList", element: <QnAMemberList />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/qnaList", element: <QnAAdminList />, handle: { titleKey: "Board" } },
      { path: ":boardType/qnaWrite", element: <QnAWrite />, handle: { titleKey: "Board" } },
      { path: ":boardType/qnaWrite/:id", element: <QnAWrite />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/qnaDetail/:id", element: <QnAAdminDetail />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/qnaDetail/:id", element: <QnAMemberDetail />, handle: { titleKey: "Board" } },
      { path: ":boardType/privacy", element: <PrivacyConsent />, handle: { titleKey: "Board" } },

      { path: "taskproposal/proposalConsent", element: <ProposalConsent />, handle: { title: "과제제안" } },
      { path: "taskproposal/taskproposalWrite", element: <TaskproposalWrite />, handle: { title: "과제제안" } },
      { path: "taskproposal/taskproposalWrite/:id", element: <TaskproposalWrite />, handle: { title: "과제제안" } },
      { path: "taskproposal/member/taskproposalList", element: <TaskproposalMemberList />, handle: { title: "과제제안" } },
      {
        path: "taskproposal/member/taskproposalDetail/:id",
        element: <TaskproposalMemberDetail />,
        handle: { title: "과제제안" },
      },
      { path: "taskproposal/admin/taskproposalList", element: <TaskproposalAdminList />, handle: { title: "과제제안" } },
      { path: "taskproposal/admin/taskproposalDetail/:id", element: <TaskproposalAdminDetail />, handle: { title: "과제제안" } },
      { path: "taskproposal/admin/taskproposalAdminAnswer", element: <TaskproposalAdminAnswer />, handle: { title: "과제제안" } },

      { path: "faq/admin/faqWrite", element: <FaqAdminWrite />, handle: { title: "FAQ" } },
      { path: "faq/admin/faqDetail/:id", element: <FaqAdminDetail />, handle: { title: "FAQ" } },
      { path: "faq/admin/faqList", element: <FaqAdminList />, handle: { title: "FAQ" } },
      { path: "faq/member/faqList", element: <FaqMemberList />, handle: { title: "FAQ" } },

      { path: ":boardType/member/freeBoardList", element: <FreeBoardMemberList />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/freeboardWrite", element: <FreeBoardWrite />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/freeboardDetail/:id", element: <FreeBoardMemberDetail />, handle: { titleKey: "Board" } },

      { path: ":boardType/admin/freeBoardList", element: <FreeBoardAdminList />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/freeboardDetail/:id", element: <FreeBoardAdminDetail />, handle: { titleKey: "Board" } },

      { path: ":boardType/admin/list", element: <AdminBoardList />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/detail/:id", element: <AdminBoardDetail />, handle: { titleKey: "Board" } },
      { path: ":boardType/admin/write", element: <AdminBoardWrite />, handle: { titleKey: "Board" } },

      { path: ":boardType/member/list", element: <MemberBoardList />, handle: { titleKey: "Board" } },
      { path: ":boardType/member/detail/:id", element: <MemberBoardDetail />, handle: { titleKey: "Board" } },

      { path: "content/:boardType/admin/list", element: <AdminContentList />, handle: { titleKey: "Board" } },
      { path: "content/:boardType/member/list", element: <MemberContentList />, handle: { titleKey: "Board" } },
      { path: "content/:boardType/contentPreview", element: <ContentPreview />, handle: { titleKey: "Board" } },

      { path: "userGuide/siteMap", element: <SiteMap />, handle: { title: "사이트맵" } },
    ],
  },
];
