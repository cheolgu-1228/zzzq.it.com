"use client";

// 결과 페이지 공통 댓글 섹션
// 닉네임은 localStorage 프로필에서 가져오고, Supabase에 저장/조회
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/src/lib/supabase";
import { loadProfile } from "@/src/lib/profile";
import { getCountry } from "@/src/lib/countries";
import { useT } from "./LocaleProvider";

type Comment = {
  id: string;
  nickname: string;
  country: string | null;
  comment: string;
  created_at: string;
};

const PAGE_SIZE = 20;

export function CommentsSection({ contentId }: { contentId: string }) {
  const t = useT();
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data } = await supabase
      .from("comments")
      .select("id, nickname, country, comment, created_at")
      .eq("content_id", contentId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    setComments((data ?? []) as Comment[]);
    setLoading(false);
  }, [contentId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const onSubmit = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const profile = loadProfile();
    if (!profile) {
      alert("Please set up your profile on the home page first.");
      return;
    }
    setSending(true);
    const supabase = getSupabase();
    await supabase.from("comments").insert({
      content_id: contentId,
      nickname: profile.nickname,
      country: profile.country,
      comment: text.slice(0, 500),
    });
    setInput("");
    setSending(false);
    fetchComments();
  };

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
      <h2 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
        💬 {t("results.comments")}
      </h2>

      {/* 입력 */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 500))}
          placeholder={t("results.writeComment")}
          className="flex-1 h-11 px-3 text-sm"
          style={{
            background: "var(--bg-soft)",
            color: "var(--fg)",
            border: "1px solid var(--card-border)",
            borderRadius: "var(--radius-sm)",
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={sending || input.trim().length === 0}
          className="h-11 px-4 text-sm font-bold disabled:opacity-40"
          style={{
            background: "var(--accent)",
            color: "#fff",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {t("results.send")}
        </button>
      </div>

      {/* 리스트 */}
      <div className="flex flex-col gap-2 mt-1">
        {loading ? (
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Loading…
          </p>
        ) : comments.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            No comments yet.
          </p>
        ) : (
          comments.map((c) => {
            const flag = getCountry(c.country).flag;
            const when = new Date(c.created_at).toLocaleString();
            return (
              <div
                key={c.id}
                className="flex flex-col gap-1 p-3"
                style={{
                  background: "var(--bg-soft)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--fg)" }}
                  >
                    {flag} {c.nickname}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {when}
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed break-words"
                  style={{ color: "var(--fg)" }}
                >
                  {c.comment}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
