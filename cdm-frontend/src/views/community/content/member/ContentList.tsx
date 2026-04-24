import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BOARD_CONFIG } from "@/config/boardConfig";
import { fetchPublishedContent } from "@/api/communityApi";
import { Helmet } from "react-helmet";

type PublishedConts = {
  contsSn: number;
  contsTtl: string;
  contsCn: string;
  regDt: string;
};

export default function MemberContentListView() {
  const { boardType } = useParams<{
    boardType: "buildInfo" | "analysisInfo" | "notice";
  }>();

  const config = BOARD_CONFIG[boardType!];

  const { data: published, isLoading: loading } = useQuery({
    queryKey: ["publishedContent", boardType],
    queryFn: () => fetchPublishedContent(boardType!),
    enabled: !!boardType,
    refetchOnMount: "always",
  });

  return (
    <div>
      <Helmet>
        <title>CDM - 자료실</title>
      </Helmet>
      {/* 헤더 설명 */}
      <div className="py-2">
        <h5>{config.description}</h5>
      </div>

      {/* 파란 구분선 */}
      <div className="my-4">
        <div className="border-b-2 border-blue-600 max-w-[980px]" />
      </div>

      {/* 공개 컨텐츠 영역 */}
      <div className="mt-4 p-4 bg-transparent max-w-[980px]">
        {loading && <p className="text-gray-500">불러오는 중...</p>}

        {!loading && !published && <p className="text-gray-400">등록된 내용이 없습니다.</p>}

        {published && (
          <>
            <h3 className="text-lg font-semibold mb-2">{published.contsTtl}</h3>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: published.contsCn }} />
          </>
        )}
      </div>
    </div>
  );
}
