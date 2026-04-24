import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { BOARD_CONFIG } from "@/config/boardConfig";
import { fetchContentPreviewHtml } from "@/api/communityApi";
import { Helmet } from "react-helmet";

export default function ContentPreviewPage() {
  const [html, setHtml] = useState("");

  const { boardType } = useParams<{
    boardType: "buildInfo" | "analysisInfo" | "notice";
  }>();

  const config = BOARD_CONFIG[boardType!];

  // 미리보기 데이터 로딩
  useEffect(() => {
    if (!boardType) return;

    const preview = sessionStorage.getItem("PREVIEW_HTML");

    if (preview) {
      setHtml(preview);
    }
  }, [boardType]);

  const sessionPreviewHtml = useMemo(() => sessionStorage.getItem("PREVIEW_HTML"), []);

  const { data, isError } = useQuery({
    queryKey: ["contentPreviewHtml", boardType],
    queryFn: () => fetchContentPreviewHtml(boardType!),
    enabled: !!boardType && !sessionPreviewHtml,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (sessionPreviewHtml) return;
    if (!boardType) return;
    if (isError) {
      setHtml("<p>미리보기 데이터를 불러오지 못했습니다.</p>");
      return;
    }
    if (typeof data === "string") setHtml(data);
  }, [boardType, data, isError, sessionPreviewHtml]);

  // 🔹 미리보기 모드: 화면 이동 완전 차단
  useEffect(() => {
    const stop = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // 모든 링크 차단
    document.querySelectorAll("a").forEach((el) => el.addEventListener("click", stop));

    // 사이드바 / 헤더 전체 비활성화
    document.querySelectorAll("nav, aside, header, .sidebar, .menu").forEach((el) => {
      const h = el as HTMLElement;
      h.style.pointerEvents = "none";
      h.style.opacity = "0.6";
    });

    // 브라우저 이동 차단
    globalThis.addEventListener("popstate", stop);

    return () => {
      document.querySelectorAll("a").forEach((el) => el.removeEventListener("click", stop));
      globalThis.removeEventListener("popstate", stop);
    };
  }, []);

  return (
    <div>
      <Helmet>
        <title>CDM - 자료실</title>
      </Helmet>
      <div className="py-2">
        <h5>{config.description}</h5>
      </div>

      {/* 파란 구분선 */}
      <div className="my-4">
        <div className="border-b-2 border-blue-600 max-w-[980px]" />
      </div>

      <div className="mt-4 p-4 bg-transparent max-w-[980px]">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
