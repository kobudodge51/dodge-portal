import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/supabase";
import { PREF_NAMES } from "@/lib/prefectures";

// 一時的な取り込み口（取り込み完了後に削除する）。合言葉はハッシュのみ保存。
const TOKEN_HASH = "e395d9756da774f03ecb1cb8a12ccab90247096dfd72283fd49a55fa63bda317";
const CORS = { "access-control-allow-origin": "https://dodgeball.or.jp", "access-control-allow-headers": "content-type,x-token", "access-control-allow-methods": "POST,OPTIONS" };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

type In = { prefecture: string; team_name: string; kana?: string; city?: string; category?: string; website_url?: string | null };

export async function POST(req: Request) {
  const t = req.headers.get("x-token") || "";
  if (createHash("sha256").update(t).digest("hex") !== TOKEN_HASH) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: CORS });
  const body = (await req.json()) as { teams: In[] };
  const cats = ["D-1", "D-1G", "S-1", "S-1G"];
  const seen = new Set<string>();
  const rows = (body.teams || [])
    .filter((x) => PREF_NAMES.includes(x.prefecture) && x.team_name && cats.includes(String(x.category)))
    .filter((x) => { const k = x.prefecture + "|" + x.team_name + "|" + x.category; if (seen.has(k)) return false; seen.add(k); return true; })
    .map((x) => ({
      team_name: String(x.team_name).slice(0, 60),
      prefecture: x.prefecture,
      city: (x.city || "").slice(0, 40) || null,
      category: x.category,
      website_url: x.website_url && /^https?:\/\//.test(x.website_url) ? x.website_url.slice(0, 500) : null,
      description: x.kana ? "フリガナ：" + String(x.kana).slice(0, 80) : null,
      poster_name: "日本ドッジボール協会 公開情報",
      is_verified: true,
    }));
  if (rows.length < 300) return NextResponse.json({ error: "too few", n: rows.length }, { status: 400, headers: CORS });
  const supa = db();
  const del = await supa.from("portal_teams").delete().eq("poster_name", "日本ドッジボール協会 公開情報");
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500, headers: CORS });
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supa.from("portal_teams").insert(rows.slice(i, i + 500));
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  }
  return NextResponse.json({ ok: true, inserted: rows.length }, { headers: CORS });
}
