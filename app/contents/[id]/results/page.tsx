"use client";

// 결과 페이지 — Supabase에서 투표 데이터 조회 후 차트 렌더
import { use, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { getSupabase } from "@/src/lib/supabase";
import { getContent } from "@/src/lib/contents";
import { getCountry } from "@/src/lib/countries";
import { useT } from "@/src/components/LocaleProvider";
import { CommentsSection } from "@/src/components/CommentsSection";
import { AdSlot } from "@/src/components/AdSlot";

type Vote = {
  id: string;
  choice: string;
  country: string | null;
  nickname: string | null;
  created_at: string;
};

type TournamentResult = {
  winner: string;
  runner_up: string | null;
  semi_finals: unknown;
  quarter_finals: unknown;
  created_at: string;
};

// 테마와 무관하게 차트에서 쓸 팔레트 (CSS 변수 접근이 불가능한 recharts 내부 SVG용)
const PALETTE = [
  "#ff7eb6",
  "#b18cff",
  "#00f0ff",
  "#ffb300",
  "#39ff14",
  "#ff3b30",
  "#2e9cff",
  "#ffd166",
  "#c77dff",
  "#30d158",
];

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useT();
  const content = getContent(id);

  const [votes, setVotes] = useState<Vote[]>([]);
  const [tournaments, setTournaments] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = getSupabase();
      const [v, tr] = await Promise.all([
        supabase
          .from("votes")
          .select("id, choice, country, nickname, created_at")
          .eq("content_id", id)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("tournament_results")
          .select("winner, runner_up, semi_finals, quarter_finals, created_at")
          .eq("content_id", id)
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      setVotes((v.data ?? []) as Vote[]);
      setTournaments((tr.data ?? []) as TournamentResult[]);
      setLoading(false);
    })();
  }, [id]);

  // 항목별 투표 수 (바 차트)
  const byChoice = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of votes) {
      map.set(v.choice, (map.get(v.choice) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [votes]);

  // 국가별 참여 (파이 차트)
  const byCountry = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of votes) {
      const code = v.country ?? "OTHER";
      map.set(code, (map.get(code) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([code, value]) => ({
        name: `${getCountry(code).flag} ${getCountry(code).name}`,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [votes]);

  // 라운드별 승률 (토너먼트 결과 기반)
  // 각 라운드에서 각 후보가 이긴 횟수 합산 → 상위 후보 10개
  const byRound = useMemo(() => {
    type RoundMatch = { a: string; b: string; winner?: string };
    const agg: Record<string, { quarter: number; semi: number; final: number }> =
      {};
    const bump = (key: string, round: "quarter" | "semi" | "final") => {
      agg[key] = agg[key] ?? { quarter: 0, semi: 0, final: 0 };
      agg[key][round] += 1;
    };

    for (const tr of tournaments) {
      const q = Array.isArray(tr.quarter_finals)
        ? (tr.quarter_finals as RoundMatch[])
        : [];
      const s = Array.isArray(tr.semi_finals)
        ? (tr.semi_finals as RoundMatch[])
        : [];
      for (const m of q) if (m.winner) bump(m.winner, "quarter");
      for (const m of s) if (m.winner) bump(m.winner, "semi");
      if (tr.winner) bump(tr.winner, "final");
    }

    return Object.entries(agg)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.final + b.semi + b.quarter - (a.final + a.semi + a.quarter))
      .slice(0, 8);
  }, [tournaments]);

  const totalVotes = votes.length;
  const topPick = byChoice[0]?.name ?? "—";

  if (!content) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p style={{ color: "var(--fg)" }}>Content not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-5">
      {/* 헤더 */}
      <header className="flex flex-col gap-1">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          {t("results.title")}
        </span>
        <h1
          className="text-2xl sm:text-3xl font-extrabold leading-tight"
          style={{ color: "var(--fg)" }}
        >
          {content.title}
        </h1>
      </header>

      {/* 요약 카드 */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard label={t("results.totalVotes")} value={String(totalVotes)} />
        <StatCard label={t("results.topPick")} value={topPick} />
      </section>

      {loading ? (
        <p className="text-sm text-center" style={{ color: "var(--fg-muted)" }}>
          Loading…
        </p>
      ) : votes.length === 0 ? (
        <p
          className="text-sm text-center py-8"
          style={{ color: "var(--fg-muted)" }}
        >
          {t("results.empty")}
        </p>
      ) : (
        <>
          {/* 항목별 투표 수 바 차트 */}
          <ChartCard title={t("results.topPick")}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byChoice} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis type="number" stroke="var(--fg-muted)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="var(--fg-muted)"
                  fontSize={11}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderRadius: 8,
                    color: "var(--fg)",
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {byChoice.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 국가별 파이 차트 */}
          <ChartCard title={t("results.byCountry")}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={byCountry}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {byCountry.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    borderRadius: 8,
                    color: "var(--fg)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 라운드별 승 누적 */}
          {byRound.length > 0 && (
            <ChartCard title={t("results.byRound")}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byRound}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--card-border)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--fg-muted)"
                    fontSize={10}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="var(--fg-muted)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--card-border)",
                      borderRadius: 8,
                      color: "var(--fg)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="quarter" stackId="r" fill={PALETTE[2]} />
                  <Bar dataKey="semi" stackId="r" fill={PALETTE[1]} />
                  <Bar dataKey="final" stackId="r" fill={PALETTE[0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* 최근 투표 */}
          <ChartCard title={t("results.recent")}>
            <div className="flex flex-col gap-2">
              {votes.slice(0, 10).map((v) => {
                const flag = getCountry(v.country).flag;
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-2 text-sm py-1.5"
                    style={{
                      borderBottom: "1px dashed var(--card-border)",
                    }}
                  >
                    <span
                      className="truncate font-semibold"
                      style={{ color: "var(--fg)" }}
                    >
                      {flag} {v.nickname ?? "anon"}
                    </span>
                    <span
                      className="truncate"
                      style={{ color: "var(--accent)" }}
                    >
                      → {v.choice}
                    </span>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </>
      )}

      <AdSlot slot="9319858952" />

      <CommentsSection contentId={id} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col gap-1 p-4"
      style={{
        background: "var(--card)",
        border: "1px solid var(--card-border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <span
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: "var(--fg-muted)" }}
      >
        {label}
      </span>
      <span
        className="text-xl font-extrabold truncate"
        style={{ color: "var(--fg)" }}
      >
        {value}
      </span>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="flex flex-col gap-3 p-4 sm:p-5"
      style={{
        background: "var(--card)",
        border: "1px solid var(--card-border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <h2
        className="text-sm font-bold uppercase tracking-wider"
        style={{ color: "var(--fg-muted)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
