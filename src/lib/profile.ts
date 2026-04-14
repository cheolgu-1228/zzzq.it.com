// 사용자 프로필 localStorage 관리
// 메인 페이지에서 저장 → 다른 페이지에서 읽어 투표/댓글에 사용
export type UserProfile = {
  country: string;
  gender: "male" | "female" | "other";
  ageGroup: "10s" | "20s" | "30s" | "40s" | "50s+";
  nickname: string;
};

const KEY = "zzzq.profile.v1";

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(p: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
