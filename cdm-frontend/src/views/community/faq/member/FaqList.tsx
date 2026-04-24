import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CONTENT_GAP } from "@/constants/types";
import type { FaqItem } from "@/interfaces/communityInterface";
import axios from "@/api/axios";
import { fetchFaqList } from "@/api/communityApi";
import { fetchCommonCodes } from "@/api/commonApi";
import { SearchArea } from "@/components/SearchArea";
import { SpaceBox } from "@/components/SpaceBox";
import { Helmet } from "react-helmet";


function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").trim();
}

export default function FaqView() {
  const [activeCategory, setActiveCategory] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // 검색 (폼 / 적용값 – 버튼 클릭 시에만 필터 반영)
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchType, setSearchType] = useState("title");
  const [searchKeywordError, setSearchKeywordError] = useState(false);
  const [appliedSearchKeyword, setAppliedSearchKeyword] = useState("");
  const [appliedSearchType, setAppliedSearchType] = useState("title");

  /* =========================
     공통코드 조회 (CMCMM00005)
  ========================= */
  const { data: commonCodes = [] } = useQuery({
    queryKey: ["commonCodes", "CMCMM00005"],
    queryFn: () => fetchCommonCodes("CMCMM00005"),
    staleTime: Infinity,
  });

  const faqCategoryMap = useMemo<Record<string, string>>(
    () => Object.fromEntries(commonCodes.map((c) => [c.code, c.name])),
    [commonCodes]
  );

  /* =========================
     React Query (keepPreviousData로 리패치 시 깜빡임 방지)
  ========================= */
  const { data, isLoading } = useQuery({
    queryKey: ["faqListUser", { page: 1, pageSize: "1000" }],
    queryFn: () => fetchFaqList({ page: 1, pageSize: "1000" }),
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const faqList = data?.list ?? [];

  /* =========================
     카테고리 그룹핑
  ========================= */
  const grouped: Record<string, FaqItem[]> = {};

  faqList.forEach((item: FaqItem) => {
    const displayCategory = faqCategoryMap[item.faqSeCd] ?? "기타";
    if (!grouped[displayCategory]) {
      grouped[displayCategory] = [];
    }
    grouped[displayCategory].push(item);
  });

  const categories = Object.values(faqCategoryMap);
  const currentCategory = activeCategory || categories[0];
  const rawCurrentFaqList = grouped[currentCategory] || [];

  // 적용된 검색어로 클라이언트 필터 (검색타입: 제목/내용/작성자)
  const keyword = appliedSearchKeyword.trim().toLowerCase();
  const currentFaqList = keyword
    ? rawCurrentFaqList.filter((faq) => {
        const title = (faq.faqTtl ?? "").toLowerCase();
        const content = stripHtml(faq.faqAnsCn ?? "").toLowerCase();
        const writer = (faq.rgtrId ?? "").toLowerCase();
        if (appliedSearchType === "title") return title.includes(keyword);
        if (appliedSearchType === "content") return content.includes(keyword);
        if (appliedSearchType === "writer") return writer.includes(keyword);
        return title.includes(keyword) || content.includes(keyword) || writer.includes(keyword);
      })
    : rawCurrentFaqList;

  /* =========================
     검색 (버튼 클릭 시에만 적용)
  ========================= */
  const handleSearch = () => {
    const k = searchKeyword.trim();
    const valid = k.length === 0 || k.length >= 2;
    setSearchKeywordError(k.length > 0 && !valid);
    setAppliedSearchKeyword(valid ? k : "");
    setAppliedSearchType(searchType);
  };

  const handleResetFilter = () => {
    setSearchKeyword("");
    setSearchType("title");
    setSearchKeywordError(false);
    setAppliedSearchKeyword("");
    setAppliedSearchType("title");
  };

  /* =========================
     조회수 증가
  ========================= */
  const increaseFaqViewCount = async (faqSn: string) => {
    const key = `FAQ_VIEWED_${faqSn}`;
    if (sessionStorage.getItem(key)) return;

    try {
      await axios.post("/api/community/faq/increaseViewCount", null, {
        params: { faqSn },
      });
      sessionStorage.setItem(key, "Y");
    } catch (e) {
      console.error("FAQ 조회수 증가 실패", e);
    }
  };

  // 최초 로딩 시에만 로딩 UI (keepPreviousData로 리패치 시 깜빡임 방지)
  if (isLoading && !data) {
    return <div className="py-12 text-center">로딩 중...</div>;
  }

  return (
    <div className="w-full">
      <Helmet>
        <title>CDM - FAQ</title>
      </Helmet>
      <div className="py-2">
        <h5>자주 묻는 질문에 대한 답변입니다. 더 궁금하신 점이 있으면 Q&A에 질문해주세요.</h5>
      </div>

      {/* 검색 영역 */}
      <SearchArea
        searchType={searchType}
        onSearchTypeChange={setSearchType}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={(v) => {
          setSearchKeyword(v);
          setSearchKeywordError(false);
        }}
        searchKeywordError={searchKeywordError}
        searchKeywordHelperText={searchKeywordError ? "두자 이상 입력해주세요" : undefined}
        onSearch={handleSearch}
        onReset={handleResetFilter}
      />

      <SpaceBox gap={CONTENT_GAP.SMALL} />

      {/* 탭 헤더 영역 */}
      <div className="mt-5">
        <ul className="flex border-b border-gray-300">
          {categories.map((cat, idx) => {
            const isActive = currentCategory === cat;
            return (
              <li key={cat} className="flex-1">
                <button
                  onClick={() => {
                    setActiveCategory(cat);
                    setOpenIndex(null);
                  }}
                  className={`
                    w-full h-12 font-semibold relative flex items-center justify-center
                    border-t border-l border-gray-300
                    ${idx === categories.length - 1 ? "border-r" : ""} 
                    ${
                      isActive
                        ? "bg-white text-blue-600 font-bold z-20"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-b-transparent"
                    }
                  `}
                >
                  {cat}

                  {/* 활성화된 탭일 때 하단 border-b를 덮어버리는 흰색 막대 */}
                  {isActive && <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white z-30" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <SpaceBox gap={CONTENT_GAP.MEDIUM} />

      {/* FAQ 목록 영역 */}
      <div className="mt-4 border-t border-gray-200">
        {currentFaqList.length > 0 ? (
          currentFaqList.map((faq, index) => (
            <div key={faq.faqSn} className="border-b border-gray-200">
              <button
                onClick={() => {
                  const willOpen = openIndex !== index;
                  setOpenIndex(willOpen ? index : null);
                  if (willOpen) {
                    increaseFaqViewCount(faq.faqSn);
                  }
                }}
                className="w-full px-6 py-5 text-left"
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white mr-4 flex items-center justify-center font-bold">
                    Q
                  </span>
                  <div className={`font-medium ${openIndex === index ? "text-blue-700" : ""}`}>{faq.faqTtl}</div>
                </div>
              </button>

              {openIndex === index && (
                <div className="bg-gray-50 px-6 py-5 flex items-start border-t border-gray-100">
                  <span className="w-8 h-8 rounded-full bg-emerald-500 text-white mr-4 flex-shrink-0 flex items-center justify-center font-bold">
                    A
                  </span>
                  <div className="text-gray-700 whitespace-pre-line pt-1" dangerouslySetInnerHTML={{ __html: faq.faqAnsCn }} />
                </div>
              )}
            </div>
          ))
        ) : (
          /* 데이터가 없을 때 표시될 영역 */
          <div className="py-20 text-center border-b border-gray-200">
            <p className="text-gray-500 font-medium">데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
