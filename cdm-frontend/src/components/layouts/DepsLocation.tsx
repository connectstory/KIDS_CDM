import { useMatches, useParams } from "react-router-dom";
import { BOARD_CONFIG } from "@/config/boardConfig";
import { getBreadcrumbs } from "@/utils/menuUtils";

interface RouteHandle {
  title?: string;
  titleKey?: string;
}

interface DepsLocationProps {
  title?: string;
}

export default function DepsLocation({ title = "페이지 제목" }: DepsLocationProps) {
  const matches = useMatches() as Array<{ handle?: RouteHandle }>;
  const params = useParams();
  const breadcrumbs = getBreadcrumbs(matches, params, BOARD_CONFIG);

  return (
    <div className="potal-location">
      <div className="local">
        <span className="home">
          <span className="blind">홈</span>
        </span>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={index} className={isLast ? "current" : "route"}>
              {crumb.label}
            </span>
          );
        })}
      </div>
      <div className="page_path">
        <h2 className="tit">{title}</h2>
      </div>
    </div>
  );
}
