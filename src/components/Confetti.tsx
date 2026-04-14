"use client";

// 우승 확정 시 화면 상단에서 떨어지는 색종이 효과 (라이브러리 없이 CSS 애니메이션)
import { useMemo } from "react";
import { useTheme } from "./ThemeProvider";

type Piece = {
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  size: number;
  shape: "square" | "circle" | "heart";
};

export function Confetti({ count = 60 }: { count?: number }) {
  const { theme } = useTheme();

  const palette =
    theme === "cute"
      ? ["#ff7eb6", "#b18cff", "#ffd166", "#9ad17a", "#ffb8d9"]
      : theme === "digital"
        ? ["#c77dff", "#ff2ec4", "#00f0ff", "#39ff14", "#ffee00"]
        : ["#ffb300", "#ff3b30", "#2e9cff", "#30d158", "#ffffff"];

  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2.2 + Math.random() * 1.8,
      color: palette[i % palette.length],
      rotate: Math.random() * 360,
      size: 6 + Math.random() * 10,
      shape:
        theme === "cute"
          ? "heart"
          : Math.random() > 0.5
            ? "square"
            : "circle",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, theme]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none overflow-hidden z-50"
    >
      {pieces.map((p, idx) => (
        <span
          key={idx}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.shape === "heart" ? "transparent" : p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            transform: `rotate(${p.rotate}deg)`,
            animation: `zq-confetti-fall ${p.duration}s ${p.delay}s linear forwards`,
            color: p.color,
            fontSize: p.size * 1.4,
            lineHeight: 1,
          }}
        >
          {p.shape === "heart" ? "♥" : ""}
        </span>
      ))}
    </div>
  );
}
