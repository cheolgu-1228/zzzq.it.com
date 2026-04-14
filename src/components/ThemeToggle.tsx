"use client";

// 헤더에 항상 노출되는 테마 전환 토글 (아이콘 3개)
import { useTheme, type ThemeId } from "./ThemeProvider";

const OPTIONS: { id: ThemeId; label: string; icon: string }[] = [
  { id: "cute", label: "Cute", icon: "🌸" },
  { id: "digital", label: "Digital", icon: "⚡" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex items-center gap-1 p-1 rounded-full border"
      style={{
        background: "var(--bg-soft)",
        borderColor: "var(--card-border)",
      }}
    >
      {OPTIONS.map((o) => {
        const active = theme === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            onClick={() => setTheme(o.id)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-lg transition-all"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "#fff" : "var(--fg-muted)",
              boxShadow: active ? "var(--shadow-soft)" : "none",
              transform: active ? "scale(1.08)" : "scale(1)",
            }}
          >
            <span aria-hidden>{o.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
