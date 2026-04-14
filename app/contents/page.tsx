"use client";

// 컨텐츠 리스트 페이지
import Link from "next/link";
import { CONTENTS } from "@/src/lib/contents";
import { useT } from "@/src/components/LocaleProvider";
import { AdSlot } from "@/src/components/AdSlot";

export default function ContentsPage() {
  const t = useT();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1
          className="text-2xl sm:text-3xl font-extrabold tracking-tight"
          style={{ color: "var(--fg)" }}
        >
          {t("contents.title")}
        </h1>
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          {t("app.tagline")}
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CONTENTS.map((c) => (
          <article
            key={c.id}
            className="flex flex-col gap-4 p-5"
            style={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 flex items-center justify-center text-2xl shrink-0"
                style={{
                  background: "var(--bg-soft)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {c.emoji}
              </div>
              <div className="flex flex-col">
                <h2
                  className="font-bold text-lg leading-tight"
                  style={{ color: "var(--fg)" }}
                >
                  {c.title}
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--fg-muted)" }}
                >
                  {c.description}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/contents/${c.id}`}
                className="flex-1 h-11 inline-flex items-center justify-center font-semibold text-sm"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                {t("contents.join")} →
              </Link>
              <Link
                href={`/contents/${c.id}/results`}
                aria-label={t("contents.results")}
                className="w-11 h-11 inline-flex items-center justify-center text-lg"
                style={{
                  background: "var(--bg-soft)",
                  color: "var(--fg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                📊
              </Link>
            </div>
          </article>
        ))}
      </section>

      <AdSlot slot="3154952035" />
    </div>
  );
}
