"use client";

// 컨텐츠 참여 페이지 — 초능력 토너먼트
// params가 Promise라는 점에 유의 (Next 16)
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getContent } from "@/src/lib/contents";
import { loadProfile } from "@/src/lib/profile";
import { getSupabase } from "@/src/lib/supabase";
import { useT } from "@/src/components/LocaleProvider";
import { Confetti } from "@/src/components/Confetti";

type Match = { a: string; b: string; winner?: string };
type Round = { name: string; matches: Match[] };

// Fisher-Yates 셔플
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// 16개 후보 → 8경기로 분할
function buildInitialRound(candidates: string[]): Round {
  const shuffled = shuffle(candidates);
  const matches: Match[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({ a: shuffled[i], b: shuffled[i + 1] });
  }
  return { name: "round16", matches };
}

const ROUND_LABEL_KEY: Record<string, string> = {
  round16: "tournament.round16",
  quarter: "tournament.quarter",
  semi: "tournament.semi",
  final: "tournament.final",
};

export default function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useT();
  const content = getContent(id);

  // 토너먼트 전체 진행 상태
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [pickedSide, setPickedSide] = useState<"a" | "b" | null>(null);
  const [champion, setChampion] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // 초기 16강 생성
  useEffect(() => {
    if (!content?.candidates) return;
    setRounds([buildInitialRound(content.candidates)]);
    setCurrentRoundIdx(0);
    setCurrentMatchIdx(0);
    setPickedSide(null);
    setChampion(null);
    setSaved(false);
  }, [content]);

  const currentRound = rounds[currentRoundIdx];
  const currentMatch = currentRound?.matches[currentMatchIdx];

  const totalPicksInRound = currentRound?.matches.length ?? 0;

  // 선택 액션 — 애니메이션 후 다음 매치로 이동
  const handlePick = (side: "a" | "b") => {
    if (pickedSide || !currentMatch) return;
    setPickedSide(side);
    const winner = side === "a" ? currentMatch.a : currentMatch.b;

    window.setTimeout(() => {
      // 승자 기록
      setRounds((prev) => {
        const next = prev.map((r) => ({
          ...r,
          matches: r.matches.map((m) => ({ ...m })),
        }));
        next[currentRoundIdx].matches[currentMatchIdx].winner = winner;
        return next;
      });

      // 다음 매치로
      if (currentMatchIdx + 1 < totalPicksInRound) {
        setCurrentMatchIdx((i) => i + 1);
        setPickedSide(null);
        return;
      }

      // 라운드 종료 — 다음 라운드 생성 or 우승 확정
      setRounds((prev) => {
        const winners = prev[currentRoundIdx].matches.map(
          (m) => m.winner ?? (m.a === winner ? winner : m.a),
        );
        // 현재 라운드의 마지막 매치였으니 winner 보정
        winners[currentMatchIdx] = winner;

        if (winners.length === 1) {
          // 우승!
          setChampion(winners[0]);
          return prev;
        }

        const nextName =
          winners.length === 8
            ? "quarter"
            : winners.length === 4
              ? "semi"
              : "final";

        const nextMatches: Match[] = [];
        for (let i = 0; i < winners.length; i += 2) {
          nextMatches.push({ a: winners[i], b: winners[i + 1] });
        }
        return [...prev, { name: nextName, matches: nextMatches }];
      });

      setCurrentMatchIdx(0);
      setCurrentRoundIdx((i) => i + 1);
      setPickedSide(null);
    }, 650);
  };

  // 우승 확정 시 Supabase에 저장
  useEffect(() => {
    if (!champion || saved || !content) return;
    const profile = loadProfile();
    const quarter = rounds.find((r) => r.name === "quarter");
    const semi = rounds.find((r) => r.name === "semi");
    const finalRound = rounds.find((r) => r.name === "final");
    const runnerUp =
      finalRound && finalRound.matches[0]
        ? finalRound.matches[0].a === champion
          ? finalRound.matches[0].b
          : finalRound.matches[0].a
        : null;

    const supabase = getSupabase();
    (async () => {
      // tournament_results 저장
      await supabase.from("tournament_results").insert({
        content_id: content.id,
        winner: champion,
        runner_up: runnerUp,
        semi_finals: semi?.matches ?? null,
        quarter_finals: quarter?.matches ?? null,
        country: profile?.country ?? null,
        gender: profile?.gender ?? null,
        age_group: profile?.ageGroup ?? null,
        nickname: profile?.nickname ?? null,
      });
      // 우승자에 대한 간단 votes 레코드도 추가 (바 차트 집계용)
      await supabase.from("votes").insert({
        content_id: content.id,
        choice: champion,
        country: profile?.country ?? null,
        gender: profile?.gender ?? null,
        age_group: profile?.ageGroup ?? null,
        nickname: profile?.nickname ?? null,
      });
      setSaved(true);
    })();
  }, [champion, saved, content, rounds]);

  // 미니맵: 라운드별 남은 후보 수 시각화
  const miniMap = useMemo(() => {
    return rounds.map((r, idx) => ({
      name: r.name,
      total: r.matches.length * 2,
      done:
        idx < currentRoundIdx
          ? r.matches.length * 2
          : idx === currentRoundIdx
            ? currentMatchIdx * 2 + (pickedSide ? 1 : 0)
            : 0,
    }));
  }, [rounds, currentRoundIdx, currentMatchIdx, pickedSide]);

  if (!content) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p style={{ color: "var(--fg)" }}>Content not found.</p>
      </div>
    );
  }

  // 우승 화면
  if (champion) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 flex flex-col gap-6 items-center text-center relative">
        <Confetti />
        <div className="text-5xl sm:text-6xl">🏆</div>
        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight zq-animate-slide"
          style={{ color: "var(--fg)" }}
        >
          {t("tournament.winner")}
        </h1>
        <div
          className="text-2xl sm:text-3xl font-bold px-6 py-4 zq-animate-picked"
          style={{
            background: "var(--card)",
            color: "var(--accent)",
            border: "2px solid var(--accent)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--glow)",
          }}
        >
          {champion}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-4">
          <button
            type="button"
            onClick={() => router.push(`/contents/${content.id}/results`)}
            className="flex-1 h-12 font-bold"
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow)",
            }}
          >
            {t("tournament.viewResults")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!content.candidates) return;
              setRounds([buildInitialRound(content.candidates)]);
              setCurrentRoundIdx(0);
              setCurrentMatchIdx(0);
              setPickedSide(null);
              setChampion(null);
              setSaved(false);
            }}
            className="flex-1 h-12 font-semibold"
            style={{
              background: "var(--bg-soft)",
              color: "var(--fg)",
              border: "1px solid var(--card-border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {t("tournament.playAgain")}
          </button>
        </div>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p style={{ color: "var(--fg-muted)" }}>Loading…</p>
      </div>
    );
  }

  // 진행 중 화면
  const roundLabel = t(ROUND_LABEL_KEY[currentRound.name] ?? "");

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-6">
      {/* 상단 진행 정보 */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            {roundLabel}
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--fg-muted)" }}
          >
            {t("tournament.progress")} {currentMatchIdx + 1}/{totalPicksInRound}
          </span>
        </div>
        {/* 미니 대진표 */}
        <div className="flex gap-1.5">
          {miniMap.map((m, idx) => {
            const pct = m.total === 0 ? 0 : (m.done / m.total) * 100;
            return (
              <div
                key={idx}
                className="flex-1 h-1.5 overflow-hidden"
                style={{
                  background: "var(--bg-soft)",
                  borderRadius: 99,
                }}
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: "var(--accent)",
                  }}
                />
              </div>
            );
          })}
        </div>
      </header>

      {/* VS 대결 */}
      <section className="flex flex-col items-center gap-4">
        <PickCard
          label={currentMatch.a}
          side="a"
          picked={pickedSide}
          onPick={handlePick}
          accent="var(--accent)"
        />
        <div
          key={`${currentRoundIdx}-${currentMatchIdx}`}
          className="text-2xl font-black tracking-wider zq-animate-vs"
          style={{
            color: "var(--accent-2)",
            textShadow: "var(--shadow-soft)",
          }}
        >
          VS
        </div>
        <PickCard
          label={currentMatch.b}
          side="b"
          picked={pickedSide}
          onPick={handlePick}
          accent="var(--accent-3)"
        />
      </section>

      <p
        className="text-center text-xs"
        style={{ color: "var(--fg-muted)" }}
      >
        {t("tournament.pickOne")}
      </p>
    </div>
  );
}

function PickCard({
  label,
  side,
  picked,
  onPick,
  accent,
}: {
  label: string;
  side: "a" | "b";
  picked: "a" | "b" | null;
  onPick: (s: "a" | "b") => void;
  accent: string;
}) {
  const state =
    picked == null ? "idle" : picked === side ? "picked" : "lost";

  const cls =
    state === "picked"
      ? "zq-animate-picked"
      : state === "lost"
        ? "zq-animate-out"
        : "zq-animate-slide";

  return (
    <button
      type="button"
      onClick={() => onPick(side)}
      disabled={picked !== null}
      className={`w-full max-w-sm h-28 sm:h-32 text-lg sm:text-xl font-extrabold tracking-tight transition-transform ${cls}`}
      style={{
        background: "var(--card)",
        color: "var(--fg)",
        border: `2px solid ${state === "picked" ? accent : "var(--card-border)"}`,
        borderRadius: "var(--radius)",
        boxShadow: state === "picked" ? "var(--glow)" : "var(--shadow-soft)",
      }}
    >
      {label}
    </button>
  );
}
