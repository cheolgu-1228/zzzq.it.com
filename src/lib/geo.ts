// IP 기반 국가 감지
// - 무료 공개 API (https://get.geojs.io, CORS 허용, API 키 불필요)
// - 실패/타임아웃 시 undefined 반환 → 호출부에서 조용히 무시
// - 브라우저에서만 호출 (서버 환경에서는 요청자 IP가 아닌 서버 IP가 잡힘)

const ENDPOINT = "https://get.geojs.io/v1/ip/country.json";
const TIMEOUT_MS = 3500;

// 우리가 알고 있는 국가 코드만 허용. 그 외는 "OTHER"로 취급
import { COUNTRIES } from "./countries";

export async function detectCountry(signal?: AbortSignal): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;

  // 타임아웃 처리용 AbortController 결합
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const combined = signal
    ? mergeSignals(signal, ctrl.signal)
    : ctrl.signal;

  try {
    const res = await fetch(ENDPOINT, { signal: combined, cache: "no-store" });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { country?: string };
    const code = (data.country ?? "").toUpperCase();
    if (!code) return undefined;
    const known = COUNTRIES.some((c) => c.code === code);
    return known ? code : "OTHER";
  } catch {
    return undefined;
  } finally {
    window.clearTimeout(timer);
  }
}

// 두 AbortSignal 중 하나라도 abort되면 abort되는 결합 시그널
function mergeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (a.aborted || b.aborted) ctrl.abort();
  else {
    a.addEventListener("abort", onAbort, { once: true });
    b.addEventListener("abort", onAbort, { once: true });
  }
  return ctrl.signal;
}
