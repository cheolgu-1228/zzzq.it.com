import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase 클라이언트 싱글톤
// NEXT_PUBLIC_ 접두사라 클라이언트/서버 모두에서 안전하게 import 가능
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다 (.env.local 확인)",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
