import { NextResponse } from "next/server";
import { db, isConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 接続確認用：鍵の中身は出さず、鍵の「種類」と表が読めるかだけを返す
function keyKind(key: string | undefined) {
  if (!key) return "未設定";
  if (key.startsWith("sb_secret_")) return "secret（正しい）";
  if (key.startsWith("sb_publishable_")) return "publishable（間違い）";
  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64").toString());
      return payload.role === "service_role" ? "service_role（正しい）" : `${payload.role}（間違い）`;
    } catch {
      return "不明";
    }
  }
  return "不明";
}

export async function GET(req: Request) {
  const write = new URL(req.url).searchParams.get("write") === "1";
  const result: Record<string, unknown> = {
    configured: isConfigured(),
    url_host: process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).host.split(".")[0].slice(0, 4) + "…" : "未設定",
    key_kind: keyKind(process.env.SUPABASE_SERVICE_ROLE_KEY),
    admin_password: process.env.ADMIN_PASSWORD ? "設定済み" : "未設定",
    ip_salt: process.env.IP_SALT ? "設定済み" : "未設定",
  };
  if (isConfigured()) {
    const { error } = await db().from("portal_threads").select("id", { head: true, count: "exact" });
    result.tables = error ? `エラー: ${error.message}` : "OK";
    if (write) {
      const ins = await db().from("portal_threads").insert({ title: "health", category: "その他", body: "health check", is_hidden: true }).select("id").single();
      if (ins.error) result.write = `エラー: ${ins.error.code ?? ""} ${ins.error.message} ${ins.error.details ?? ""} ${ins.error.hint ?? ""}`;
      else {
        await db().from("portal_threads").delete().eq("id", ins.data.id);
        result.write = "OK";
      }
    }
  }
  return new NextResponse(JSON.stringify(result, null, 2), { headers: { "content-type": "application/json; charset=utf-8" } });
}
