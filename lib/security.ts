import { createHash, timingSafeEqual } from "crypto";
import { headers } from "next/headers";
import { db } from "./supabase";

const salt = () => process.env.IP_SALT || "dodge-portal-default-salt";

export function sha(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

// 投稿者のIPアドレスはそのまま保存せず、元に戻せない形に変換して保存する
export async function getIpHash() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || h.get("x-real-ip") || "unknown").split(",")[0].trim();
  return sha(ip + salt()).slice(0, 32);
}

export function hashDeleteKey(key: string) {
  return sha("delkey:" + key + salt());
}

export function checkDeleteKey(key: string, hash: string | null) {
  if (!hash || !key) return false;
  const a = Buffer.from(hashDeleteKey(key));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

// 禁止ワード（必要に応じて追加してください）
const NG_WORDS = ["死ね", "しね", "殺す", "ころす", "きもい", "キモい", "うざい", "ウザい", "消えろ", "ブス", "カス", "ゴミ"];

const PHONE = /0\d{1,4}[-ー－‐\s]?\d{1,4}[-ー－‐\s]?\d{3,4}/;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const URL_RE = /https?:\/\//g;

export type CheckResult = { ok: true } | { ok: false; error: string };

// 本文のチェック（個人の連絡先・禁止ワード・リンクの貼りすぎ）
export function checkText(...texts: (string | null | undefined)[]): CheckResult {
  const all = texts.filter(Boolean).join("\n");
  if (EMAIL.test(all)) return { ok: false, error: "メールアドレスは書き込めません。連絡先は主催者・チームのホームページやSNSのURLを入力してください。" };
  if (PHONE.test(all)) return { ok: false, error: "電話番号は書き込めません。連絡先は主催者・チームのホームページやSNSのURLを入力してください。" };
  const ng = NG_WORDS.find((w) => all.includes(w));
  if (ng) return { ok: false, error: "利用規約に反する可能性のある言葉が含まれています。表現を見直してください。" };
  const links = all.match(URL_RE)?.length ?? 0;
  if (links > 3) return { ok: false, error: "本文に貼れるリンクは3つまでです。" };
  return { ok: true };
}

export function cleanUrl(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  if (!/^https?:\/\/[^\s]+$/.test(s)) return "INVALID";
  return s.slice(0, 500);
}

export function str(form: FormData, key: string, max = 2000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

// 連続投稿の防止：10分間に5件、1日に30件まで
export async function rateLimit(ipHash: string, kind: string): Promise<CheckResult> {
  const supa = db();
  const tenMin = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const oneDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: c10 } = await supa.from("portal_post_logs").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).not("kind", "like", "rejected%").gte("created_at", tenMin);
  if ((c10 ?? 0) >= 5) return { ok: false, error: "短時間に投稿が集中しています。10分ほど時間をおいてから投稿してください。" };
  const { count: cDay } = await supa.from("portal_post_logs").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).not("kind", "like", "rejected%").gte("created_at", oneDay);
  if ((cDay ?? 0) >= 30) return { ok: false, error: "本日の投稿上限に達しました。明日以降に投稿してください。" };
  await supa.from("portal_post_logs").insert({ ip_hash: ipHash, kind });
  return { ok: true };
}

// ボット対策：人には見えない入力欄に何か入っていたら機械の投稿とみなす
export function isBot(form: FormData) {
  return String(form.get("website_hp") ?? "").length > 0;
}
