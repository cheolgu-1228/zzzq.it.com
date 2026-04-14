"use client";

// 전역 테마 프로바이더
// - html[data-theme] 속성을 통해 CSS 변수 세트를 교체
// - localStorage에 선택값 저장, 앱 부팅 시 복원
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeId = "cute" | "digital" | "gaming";

const STORAGE_KEY = "zzzq.theme.v1";

type Ctx = {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 기본은 cute — 클라이언트 mount 후 localStorage 값으로 교체
  const [theme, setThemeState] = useState<ThemeId>("cute");

  // 초기 로드 시 저장된 테마 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (saved && ["cute", "digital", "gaming"].includes(saved)) {
        setThemeState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // 테마가 바뀔 때 html 속성 반영
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
