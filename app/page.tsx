"use client";

// 메인 페이지 — 프로필 입력 (국가/성별/연령대/닉네임) 후 /contents로 이동
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { COUNTRIES, getCountry } from "@/src/lib/countries";
import { saveProfile, loadProfile, type UserProfile } from "@/src/lib/profile";
import { detectCountry } from "@/src/lib/geo";
import { useT } from "@/src/components/LocaleProvider";
import { AdSlot } from "@/src/components/AdSlot";

const GENDERS: UserProfile["gender"][] = ["male", "female", "other"];
const AGES: UserProfile["ageGroup"][] = ["10s", "20s", "30s", "40s", "50s+"];

export default function HomePage() {
  const router = useRouter();
  const t = useT();
  const [country, setCountry] = useState<string>("");
  const [gender, setGender] = useState<UserProfile["gender"] | "">("");
  const [ageGroup, setAgeGroup] = useState<UserProfile["ageGroup"] | "">("");
  const [nickname, setNickname] = useState<string>("");
  // IP로 감지된 국가 (드롭다운 최상단 + "감지됨" 뱃지 표시용)
  const [detected, setDetected] = useState<string | null>(null);

  // 1) 저장 프로필 프리필
  // 2) 저장값이 없으면 IP 기반 국가 감지 → 기본 선택값으로 채움
  useEffect(() => {
    const p = loadProfile();
    if (p) {
      setCountry(p.country);
      setGender(p.gender);
      setAgeGroup(p.ageGroup);
      setNickname(p.nickname);
      return;
    }
    const ctrl = new AbortController();
    detectCountry(ctrl.signal).then((code) => {
      if (!code) return;
      setDetected(code);
      // 사용자가 그 사이에 이미 직접 선택했다면 덮어쓰지 않음
      setCountry((prev) => prev || code);
    });
    return () => ctrl.abort();
  }, []);

  // 감지된 국가를 목록 최상단으로 끌어올린 정렬 목록
  const orderedCountries = useMemo(() => {
    if (!detected) return COUNTRIES;
    const top = COUNTRIES.find((c) => c.code === detected);
    if (!top) return COUNTRIES;
    return [top, ...COUNTRIES.filter((c) => c.code !== detected)];
  }, [detected]);

  const valid =
    country && gender && ageGroup && nickname.trim().length >= 1;

  const onStart = () => {
    if (!valid) return;
    saveProfile({
      country,
      gender: gender as UserProfile["gender"],
      ageGroup: ageGroup as UserProfile["ageGroup"],
      nickname: nickname.trim(),
    });
    router.push("/contents");
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8">
      {/* 헤드라인 */}
      <section className="text-center flex flex-col gap-2">
        <h1
          className="text-2xl sm:text-3xl font-extrabold tracking-tight"
          style={{ color: "var(--fg)" }}
        >
          {t("home.title")}
        </h1>
        <p className="text-sm sm:text-base" style={{ color: "var(--fg-muted)" }}>
          {t("home.subtitle")}
        </p>
      </section>

      {/* 입력 카드 */}
      <section
        className="flex flex-col gap-5 p-5 sm:p-6"
        style={{
          background: "var(--card)",
          border: "1px solid var(--card-border)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        {/* 국가 */}
        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--fg)" }}
            >
              {t("home.country")}
            </span>
            {detected && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
                style={{
                  background: "var(--bg-soft)",
                  color: "var(--accent)",
                  border: "1px solid var(--card-border)",
                  borderRadius: 999,
                }}
                title={`Detected from your network: ${getCountry(detected).name}`}
              >
                📍 {getCountry(detected).flag} detected
              </span>
            )}
          </div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-11 px-3 rounded-[var(--radius-sm)] text-base"
            style={{
              background: "var(--bg-soft)",
              color: "var(--fg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <option value="" disabled>
              {t("home.selectCountry")}
            </option>
            {orderedCountries.map((c, idx) => (
              <option key={c.code} value={c.code}>
                {idx === 0 && detected ? "📍 " : ""}
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </label>

        {/* 성별 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            {t("home.gender")}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map((g) => (
              <OptionButton
                key={g}
                active={gender === g}
                onClick={() => setGender(g)}
              >
                {t(`gender.${g}`)}
              </OptionButton>
            ))}
          </div>
        </div>

        {/* 연령대 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            {t("home.age")}
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {AGES.map((a) => (
              <OptionButton
                key={a}
                active={ageGroup === a}
                onClick={() => setAgeGroup(a)}
              >
                {t(`age.${a}`)}
              </OptionButton>
            ))}
          </div>
        </div>

        {/* 닉네임 */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            {t("home.nickname")}
          </span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 24))}
            placeholder={t("home.nicknamePlaceholder")}
            className="h-11 px-3 rounded-[var(--radius-sm)] text-base"
            style={{
              background: "var(--bg-soft)",
              color: "var(--fg)",
              border: "1px solid var(--card-border)",
            }}
          />
        </label>

        {/* Start 버튼 */}
        <button
          type="button"
          disabled={!valid}
          onClick={onStart}
          className="h-12 mt-1 text-base font-bold tracking-wide transition-all disabled:opacity-40"
          style={{
            background: "var(--accent)",
            color: "#fff",
            borderRadius: "var(--radius-sm)",
            boxShadow: valid ? "var(--shadow)" : "none",
          }}
        >
          {t("home.start")} →
        </button>
      </section>

      <AdSlot slot="8365869931" />
    </div>
  );
}

// 선택 버튼 (성별/연령대 공통)
function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 text-sm font-semibold transition-all"
      style={{
        background: active ? "var(--accent)" : "var(--bg-soft)",
        color: active ? "#fff" : "var(--fg)",
        border: `1px solid ${active ? "var(--accent)" : "var(--card-border)"}`,
        borderRadius: "var(--radius-sm)",
        boxShadow: active ? "var(--shadow-soft)" : "none",
      }}
    >
      {children}
    </button>
  );
}
