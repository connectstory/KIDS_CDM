import { LOCALE_KEY } from "@/constants/i18n/i18n";

export const SUPPORTED_LANGS = ["ko", "en", "ja", "zh"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const FALLBACK_LANG: SupportedLang = "ko";

export function normalizeLang(input?: string | null): SupportedLang | null {
  if (!input) return null;

  const lower = input.toLowerCase();

  // en-US, ko-KR 같은 케이스 처리: 앞 2글자만 사용
  const base = lower.split("-")[0];

  return (SUPPORTED_LANGS as readonly string[]).includes(base) ? (base as SupportedLang) : null;
}

export function detectBrowserLang(): SupportedLang {
  const saved = localStorage.getItem(LOCALE_KEY);
  const savedNorm = normalizeLang(saved);

  if (savedNorm) return savedNorm;

  // navigator.language: "en-US" 같은 값
  const navLang = typeof navigator !== "undefined" ? navigator.language : "";
  return normalizeLang(navLang) ?? FALLBACK_LANG;
}

export function getLangFromPathname(pathname: string): SupportedLang {
  const seg = pathname.split("/")[1]; // '' | 'ko' | 'en' | ...
  return normalizeLang(seg) ?? FALLBACK_LANG;
}

/**
 * 내부 라우팅용 경로에 현재 lang prefix를 강제 적용한다.
 * - "/notice"        -> "/ko/notice"
 * - "/ko/notice"     -> "/en/notice"   (현재 lang이 en이면)
 * - "/"              -> "/ko"
 * - "notice"         -> "/ko/notice"
 * - 외부 URL(http...)는 그대로 반환
 * old --> lang: SupportedLang
 */
export function langPath(input: string, lang: string): string {
  if (!input) return `/${lang}`;
  if (/^https?:\/\//i.test(input)) return input; // external

  // hash/query를 보존하기 위해 분리
  const [pathAndQuery, hash = ""] = input.split("#");
  const [pathOnly, query = ""] = pathAndQuery.split("?");

  // 절대/상대 정리
  const path = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  // "/"는 "/{lang}"로
  if (path === "/") {
    const out = `/${lang}`;
    return `${out}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
  }

  // 첫 세그먼트가 언어면 교체, 아니면 prefix
  const segs = path.split("/"); // ["", "ko", "notice"]
  const first = segs[1];
  const firstAsLang = normalizeLang(first);

  if (firstAsLang) {
    segs[1] = lang;
    const out = segs.join("/");
    return `${out}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
  }

  // 언어 세그먼트가 없으면 앞에 붙임
  const out = `/${lang}${path}`;
  return `${out}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}
