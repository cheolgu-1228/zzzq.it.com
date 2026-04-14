"use client";

// Google AdSense 광고 슬롯
// - 프로덕션: 실제 <ins class="adsbygoogle"> 렌더 + adsbygoogle.push() 호출
// - 개발/프리뷰: 시각적 placeholder로 폴백 (로컬에서는 AdSense가 정상 동작하지 않음)
// - 각 슬롯은 AdSense 대시보드에서 발급받은 data-ad-slot 값을 전달받음
//   (예: <AdSlot slot="1234567890" />)
// - slot 생략 시 반응형 자동 광고 슬롯으로 동작
import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADSENSE_ENABLED } from "@/src/lib/ads";

type Props = {
  /** AdSense 대시보드에서 발급한 광고 단위 ID (data-ad-slot) */
  slot?: string;
  /** 광고 포맷 — 기본 'auto'(반응형) */
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  /** 전체 너비 반응형 여부 */
  fullWidth?: boolean;
  className?: string;
  /** placeholder 라벨 (개발 환경 전용) */
  label?: string;
};

// window.adsbygoogle 타입 선언 (any 회피)
declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({
  slot,
  format = "auto",
  fullWidth = true,
  className = "",
  label,
}: Props) {
  const pushed = useRef(false);

  // 프로덕션에서만 adsbygoogle.push 호출 (StrictMode 중복 방지)
  useEffect(() => {
    if (!ADSENSE_ENABLED) return;
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      // AdSense 스크립트 미로딩 등 — 조용히 무시
      console.warn("[AdSlot] adsbygoogle push failed", e);
    }
  }, []);

  // 개발 환경: 시각적 placeholder
  if (!ADSENSE_ENABLED) {
    return (
      <div
        className={`w-full flex items-center justify-center text-xs tracking-wide uppercase ${className}`}
        style={{
          minHeight: 90,
          background:
            "repeating-linear-gradient(45deg, var(--bg-soft), var(--bg-soft) 8px, var(--bg) 8px, var(--bg) 16px)",
          color: "var(--fg-muted)",
          border: "1px dashed var(--card-border)",
          borderRadius: "var(--radius-sm)",
        }}
        data-ad-slot={slot ?? "preview"}
      >
        {label ?? `Ad · ${slot ?? "preview"}`}
      </div>
    );
  }

  // 프로덕션: 실제 AdSense 광고 단위
  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: "block", minHeight: 90 }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={fullWidth ? "true" : "false"}
    />
  );
}
