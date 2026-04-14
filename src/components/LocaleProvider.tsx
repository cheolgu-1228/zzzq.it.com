"use client";

// 전역 로케일 프로바이더
// - localStorage에 선택값 저장
// - 페이지 부팅 시 저장값 / 브라우저 언어로 초기화
// - useT() 훅으로 컴포넌트들이 현재 로케일 기준 번역을 받음
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  RTL_LOCALES,
  translate,
  type Locale,
} from "@/src/lib/i18n";

const STORAGE_KEY = "zzzq.locale.v1";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (path: string) => string;
};

const LocaleCtx = createContext<Ctx | null>(null);

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const langs = navigator.languages ?? [navigator.language];
  for (const l of langs) {
    const code = l.toLowerCase().slice(0, 2);
    if ((LOCALES as readonly string[]).includes(code)) return code as Locale;
  }
  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // 저장값 복원 또는 브라우저 언어 감지
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && (LOCALES as readonly string[]).includes(saved)) {
        setLocaleState(saved);
        return;
      }
    } catch {
      /* ignore */
    }
    setLocaleState(detectBrowserLocale());
  }, []);

  // html lang / dir 속성 동기화
  // - lang: 접근성/SEO + CSS 폰트 스위치 (globals.css의 html[lang="xx"])
  // - dir: 아랍어 등 RTL 로케일에서 "rtl" 설정 (Tailwind logical properties/네이티브 레이아웃 반전)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", locale);
    root.setAttribute("dir", RTL_LOCALES.has(locale) ? "rtl" : "ltr");
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      setLocale,
      t: (path: string) => translate(locale, path),
    }),
    [locale, setLocale],
  );

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}

// 편의 훅: 번역 함수만 필요한 컴포넌트용
export function useT() {
  return useLocale().t;
}
