import { db, isConfigured } from "./supabase";

// サイト全体の設定値（portal_settings テーブル）を読み書きする
export async function getSetting(key: string): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const { data } = await db().from("portal_settings").select("value").eq("key", key).maybeSingle();
    return (data?.value as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function setSetting(key: string, value: string | null) {
  const supa = db();
  if (value === null) return supa.from("portal_settings").delete().eq("key", key);
  return supa.from("portal_settings").upsert({ key, value, updated_at: new Date().toISOString() });
}
