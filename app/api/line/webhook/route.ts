import { NextResponse } from "next/server";
import { verifySignature, lineReply, linkCode, ADMIN_KEY } from "@/lib/line";
import { getSetting, setSetting } from "@/lib/settings";
import { applyReview, REVIEW_TYPES, type ReviewType } from "@/lib/review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { userId?: string };
  message?: { type: string; text?: string };
  postback?: { data: string };
};

// LINE公式アカウントからの受け口（Webhook）
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-line-signature"))) return NextResponse.json({ ok: false }, { status: 401 });

  let events: LineEvent[] = [];
  try {
    events = (JSON.parse(raw).events ?? []) as LineEvent[];
  } catch {
    return NextResponse.json({ ok: true });
  }
  const admin = await getSetting(ADMIN_KEY);

  for (const ev of events) {
    const userId = ev.source?.userId;
    const token = ev.replyToken;
    if (!userId || !token) continue;
    try {
      if (ev.type === "message" && ev.message?.type === "text") {
        const text = (ev.message.text ?? "").normalize("NFKC").replace(/\s/g, "");
        const code = linkCode();
        if (code && text === code) {
          await setSetting(ADMIN_KEY, userId);
          await lineReply(token, "DODGE PORTALの管理者として連携しました。\nこれから投稿・通報・お問い合わせがあると、このトークにお知らせが届きます。\n「テスト」と送ると動作を確認できます。");
        } else if (userId === admin) {
          if (text === "テスト") await lineReply(token, "通知は正常に届いています。");
          else await lineReply(token, "お知らせが届いたら「OK」または「NG（非表示）」を押してください。\n「サイトで確認する」から内容を詳しく見ることもできます。");
        }
      } else if (ev.type === "postback" && ev.postback && userId === admin) {
        const p = new URLSearchParams(ev.postback.data);
        const a = p.get("a");
        const t = p.get("t") as ReviewType;
        const id = p.get("id") ?? "";
        if ((a === "ok" || a === "ng") && REVIEW_TYPES.includes(t)) {
          const msg = await applyReview(t, id, a);
          await lineReply(token, msg);
        }
      }
    } catch (e) {
      console.error("LINE webhook", e);
    }
  }
  return NextResponse.json({ ok: true });
}

// 動作確認用（ブラウザで開いたとき）
export async function GET() {
  return NextResponse.json({ ok: true, service: "DODGE PORTAL LINE webhook" });
}
