import { Link } from "react-router-dom";
import { useCmRoutes } from "@/hooks/useCmRoutes";
import { Helmet } from "react-helmet";

export default function SiteMapView() {
  const routes = useCmRoutes();
  const root = routes.COMMUNITY.ROOT;

  return (
    <div className="w-full">
      <Helmet>
        <title>CDM - 사이트맵</title>
      </Helmet>
      {/* 사이트맵 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 사업개요 */}
        <section className="bg-white">
          <h3 className="px-4 py-3 bg-slate-400 text-white font-semibold">사업개요</h3>
          <ul className="px-4">
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={`${root}/content/background/admin/list`}>사업배경</Link>
            </li>
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={`${root}/content/objective/admin/list`}>사업목적</Link>
            </li>
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={`${root}/content/coordinationCenter/admin/list`}>협연센터</Link>
            </li>
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={`${root}/content/partnerInstitution/admin/list`}>협력기관</Link>
            </li>
          </ul>
        </section>

        {/* CDM이란 */}
        <section className="bg-white">
          <h3 className="px-4 py-3 bg-slate-400 text-white font-semibold">CDM이란</h3>
          <ul className="px-4">
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={`${root}/content/cdmDefinition/admin/list`}>CDM 정의</Link>
            </li>
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={`${root}/content/cdmStructure/admin/list`}>CDM 구조</Link>
            </li>
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={`${root}/content/cdmImplementation/admin/list`}>CDM 구축과정</Link>
            </li>
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={`${root}/content/informationSecurity/admin/list`}>정보보안</Link>
            </li>
          </ul>
        </section>

        {/* 구축·분석 */}
        <section className="bg-white">
          <h3 className="px-4 py-3 bg-slate-400 text-white font-semibold">CDM 통합정보</h3>
          <ul className="px-4">
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={`${root}/cdmOverview/admin/list`}>CDM 통합정보</Link>
            </li>
          </ul>
        </section>

        {/* 참여마당 */}
        <section className="bg-white">
          <h3 className="px-4 py-3 bg-slate-400 text-white font-semibold">참여마당</h3>
          <ul className="px-4">
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={`${root}/notice/admin/list`}>공지사항</Link>
            </li>
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={`${root}/pressRelease/admin/list`}>보도자료</Link>
            </li>
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={routes.COMMUNITY.QNA.ADMIN_LIST}>Q&amp;A</Link>
            </li>
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={routes.COMMUNITY.FAQ.ADMIN_LIST}>FAQ</Link>
            </li>
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={`${root}/taskproposal/admin/taskproposalList`}>과제제안</Link>
            </li>
          </ul>
        </section>

        {/* 이용안내 */}
        <section className="bg-white">
          <h3 className="px-4 py-3 bg-slate-400 text-white font-semibold">이용안내</h3>
          <ul className="px-4">
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to="">이용약관</Link>
            </li>
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to="">개인정보처리방침</Link>
            </li>
            <li className="flex items-center gap-2 py-2 border-b border-gray-200">
              <span className="w-1 h-1 bg-gray-400 inline-block"></span>
              <Link to={routes.COMMUNITY.SITE_MAP}>사이트맵</Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
