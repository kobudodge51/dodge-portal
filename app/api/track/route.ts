import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db, isConfigured } from "@/lib/supabase";
import { sha } from "@/lib/security";
import { todayJST } from "@/lib/format";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|headless|lighthouse|curl|wget|python|axios/i;

export async function POST(req: Request) {
  if (!isConfigured()) return new NextResponse(null, { status: 204 });
  try {
    const h = await headers();
    const ua = h.get("user-agent") || "";
    if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });
    const { p, r } = (await req.json()) as { p?: string; r?: string };
    const path = String(p || "").slice(0, 200);
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null, { status: 204 });

    const host = h.get("host") || "";
    let ref = "";
    try {
      const u = new URL(String(r || ""));
      if (u.host && u.host !== host) ref = u.host.replace(/^www\./, "").slice(0, 100);
    } catch {
      ref = "";
    }
    const device = /iPad|Tablet/i.test(ua) ? "タブレット" : /Mobi|Android|iPhone/i.test(ua) ? "スマホ" : "PC";
    const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim();
    // 訪問者は「その日だけ有効な記号」にして保存（日をまたぐと別人扱い・元に戻せない）
    const visitor = sha(`${ip}|${ua}|${todayJST()}|${process.env.IP_SALT || ""}`).slice(0, 16);

    await db().from("portal_pageviews").insert({ path, ref: ref || null, device, visitor });
  } catch {
    /* 記録失敗は無視 */
  }
  return new NextResponse(null, { status: 204 });
}
