import { createHmac, timingSafeEqual } from "node:crypto";
import { sha } from "./security";
import { getSetting } from "./settings";
import type { ReviewType } from "./review";

// LINE公式アカウント（Messaging API）で管理者に通知する
const API = "https://api.line.me/v2/bot";
export const ADMIN_KEY = "line_admin_user_id";

export const lineReady = () => Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET);

export function siteUrl() {
  const u = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  return u.replace(/\/$/, "");
}

// LINEとサイトを結びつけるための6けたの番号（管理者パスワードから作るので外からは分からない）
export function linkCode() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  const n = parseInt(sha("line-link:" + pw + (process.env.IP_SALT || "")).slice(0, 10), 16) % 1000000;
  return String(n).padStart(6, "0");
}

export function verifySignature(body: string, signature: string | null) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  const given = Buffer.from(signature, "base64");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function call(path: string, payload: unknown) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`LINE ${path} ${res.status} ${await res.text().catch(() => "")}`);
}

export const lineReply = (replyToken: string, text: string) => call("/message/reply", { replyToken, messages: [{ type: "text", text: text.slice(0, 4900) }] });

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export type Notice = { kind: string; title: string; body?: string; review?: { type: ReviewType; id: string }; link?: string };

// 管理者のLINEに通知を送る（設定されていなければ何もしない・失敗しても投稿は止めない）
export async function notifyAdmin(n: Notice) {
  try {
    if (!lineReady()) return;
    const to = await getSetting(ADMIN_KEY);
    if (!to) return;
    const base = siteUrl();
    const buttons: unknown[] = [];
    if (n.review) {
      const d = `t=${n.review.type}&id=${n.review.id}`;
      buttons.push(
        { type: "button", style: "primary", color: "#1fa463", height: "sm", action: { type: "postback", label: "OK", data: `a=ok&${d}`, displayText: "OK" } },
        { type: "button", style: "primary", color: "#d93a5b", height: "sm", action: { type: "postback", label: "NG（非表示）", data: `a=ng&${d}`, displayText: "NG" } },
      );
      if (base) buttons.push({ type: "button", style: "secondary", height: "sm", action: { type: "uri", label: "サイトで確認する", uri: `${base}/admin/review/${n.review.type}/${n.review.id}` } });
    } else if (base && n.link) {
      buttons.push({ type: "button", style: "secondary", height: "sm", action: { type: "uri", label: "管理画面を開く", uri: base + n.link } });
    }
    const bubble = {
      type: "bubble",
      size: "kilo",
      header: { type: "box", layout: "vertical", backgroundColor: "#0c1028", paddingAll: "12px", contents: [{ type: "text", text: `DODGE PORTAL｜${n.kind}`, color: "#22d3ee", size: "xs", weight: "bold" }] },
      body: {
        type: "box", layout: "vertical", spacing: "sm", contents: [
          { type: "text", text: cut(n.title || "（タイトルなし）", 80), weight: "bold", size: "md", wrap: true },
          ...(n.body ? [{ type: "text", text: cut(n.body, 300), size: "sm", color: "#555555", wrap: true }] : []),
        ],
      },
      ...(buttons.length ? { footer: { type: "box", layout: "vertical", spacing: "sm", contents: buttons } } : {}),
    };
    await call("/message/push", { to, messages: [{ type: "flex", altText: cut(`【${n.kind}】${n.title}`, 300), contents: bubble }] });
  } catch (e) {
    console.error("LINE通知に失敗", e);
  }
}
