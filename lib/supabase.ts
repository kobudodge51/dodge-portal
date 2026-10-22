import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function isConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// サーバー側専用。ブラウザには絶対に渡さない。
export function db(): SupabaseClient {
  if (!isConfigured()) throw new Error("Supabaseの設定（SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）がありません");
  if (!client) {
    // 「https://xxx.supabase.co/rest/v1/」のように後ろに余計な部分が付いていても動くようにする
    const url = new URL(process.env.SUPABASE_URL!.trim()).origin;
    client = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), {
      auth: { persistSession: false },
    });
  }
  return client;
}

// 読み込み失敗時も画面が壊れないようにするための補助
export async function safeList<T>(fn: () => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  if (!isConfigured()) return [];
  try {
    const { data, error } = await fn();
    if (error) {
      console.error(error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function safeOne<T>(fn: () => PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> {
  if (!isConfigured()) return null;
  try {
    const { data, error } = await fn();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}
