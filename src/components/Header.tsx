"use client";

// 앱 공통 헤더 — 로고 + 테마 토글
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleToggle } from "./LocaleToggle";

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--bg) 85%, transparent)",
        borderBottom: "1px solid var(--card-border)",
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/zq_logo.png"
            alt="zzzQ.it"
            width={32}
            height={32}
            className="rounded-md"
            style={{ background: "var(--fg)", padding: 2 }}
          />
          <span
            className="font-bold tracking-tight text-lg"
            style={{ color: "var(--fg)" }}
          >
            zzzQ.it
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
