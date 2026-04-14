// Google AdSense 설정
// - client ID는 공개 정보이므로 하드코딩 OK (pub-XXXXXXXXXXXXXXXX)
// - 환경변수로 오버라이드 가능 (NEXT_PUBLIC_ADSENSE_CLIENT)
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-7165741643268554";

// AdSense 활성화 여부 (프로덕션에서만 실제 광고 로드, 개발 환경은 placeholder)
export const ADSENSE_ENABLED = process.env.NODE_ENV === "production";
