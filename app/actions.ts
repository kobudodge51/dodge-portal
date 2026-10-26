"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { db, isConfigured } from "@/lib/supabase";
import { checkDeleteKey, checkText, cleanUrl, getIpHash, hashDeleteKey, isBot, rateLimit, str } from "@/lib/security";
import { isAdmin, setAdminCookie, clearAdminCookie, adminToken } from "@/lib/admin";
import { notifyAdmin, lineReady, ADMIN_KEY } from "@/lib/line";
import { applyReview, REVIEW_TYPES, type ReviewType } from "@/lib/review";
import { setSetting } from "@/lib/settings";
import { PREF_NAMES, EVENT_CATEGORIES, TEAM_CATEGORIES, BOARD_CATEGORIES, REPORT_REASONS } from "@/lib/prefectures";

export type FormState = { ok?: boolean; error?: string; message?: string };

const TABLES: Record<string, string> = { event: "portal_events", team: "portal_teams", thread: "portal_threads", reply: "portal_replies" };
const AUTO_HIDE_REPORTS = 3;

function notReady(): FormState | null {
  if (!isConfigured()) return { error: "現在、投稿を受け付けられません（データベース未接続）。" };
  return null;
}

function commonPoster(form: FormData) {
  const name = str(form, "poster_name", 20) || "名無しさん";
  const key = str(form, "delete_key", 20);
  return { poster_name: name, delete_key_hash: key ? hashDeleteKey(key) : null };
}

// 弾かれた投稿を記録する（管理者のインサイト・端末管理で使う）
async function logRejected(ipHash: string, reason: string) {
  try {
    await db().from("portal_post_logs").insert({ ip_hash: ipHash, kind: `rejected:${reason}` });
  } catch {
    /* 記録失敗は無視 */
  }
}

async function isBlocked(ipHash: string) {
  try {
    const { data } = await db().from("portal_blocks").select("ip_hash").eq("ip_hash", ipHash).maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

async function guard(form: FormData, kind: string, ...texts: string[]): Promise<{ error: string } | { ipHash: string }> {
  const nr = notReady();
  if (nr) return { error: nr.error! };
  const ipHash = await getIpHash();
  if (isBot(form)) {
    await logRejected(ipHash, "bot");
    return { error: "投稿できませんでした。" };
  }
  if (form.get("agree") !== "on") return { error: "利用規約と投稿ルールへの同意が必要です。" };
  if (await isBlocked(ipHash)) {
    await logRejected(ipHash, "blocked");
    return { error: "この端末からは現在投稿できません。お心当たりがない場合はお問い合わせください。" };
  }
  const c = checkText(...texts);
  if (!c.ok) {
    const reason = /メール|電話/.test(c.error) ? "contact" : /リンク/.test(c.error) ? "links" : "ng";
    await logRejected(ipHash, reason);
    return { error: c.error };
  }
  const r = await rateLimit(ipHash, kind);
  if (!r.ok) {
    await logRejected(ipHash, "rate");
    return { error: r.error };
  }
  return { ipHash };
}

// ───────── 大会予定 ─────────
export async function createEvent(_: FormState, form: FormData): Promise<FormState> {
  const title = str(form, "title", 80);
  const prefecture = str(form, "prefecture");
  const date_start = str(form, "date_start", 10);
  const date_end = str(form, "date_end", 10) || null;
  const venue = str(form, "venue", 80);
  const category = [...new Set(form.getAll("category").map(String))].filter((c) => EVENT_CATEGORIES.includes(c)).join(",");
  const organizer = str(form, "organizer", 60);
  const description = str(form, "description", 1500);
  const url = cleanUrl(str(form, "url", 500));

  if (!title) return { error: "大会名を入力してください。" };
  if (!PREF_NAMES.includes(prefecture)) return { error: "開催都道府県を選んでください。" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date_start)) return { error: "開催日を入力してください。" };
  if (date_end && date_end < date_start) return { error: "終了日は開催日より後にしてください。" };
  if (url === "INVALID") return { error: "URLは https:// から始まる形で入力してください。" };

  const g = await guard(form, "event", title, venue, organizer, description);
  if ("error" in g) return { error: g.error };

  const { data, error } = await db()
    .from("portal_events")
    .insert({ title, prefecture, date_start, date_end, venue, category: category || null, organizer, url, description, ...commonPoster(form), ip_hash: g.ipHash })
    .select("id")
    .single();
  if (error || !data) {
    console.error("insert failed", error);
    return { error: `保存に失敗しました。時間をおいて再度お試しください。（${error?.code ?? "no-data"}）` };
  }
  revalidatePath("/");
  after(() => notifyAdmin({ kind: "大会予定の投稿", title, body: [`${date_start}　${prefecture}`, venue, organizer && `主催：${organizer}`].filter(Boolean).join("\n"), review: { type: "event", id: data.id } }));
  redirect(`/events/${data.id}?posted=1`);
}

// ───────── 登録チーム（管理者のみ追加） ─────────
export async function adminAddTeam(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const team_name = str(form, "team_name", 60);
  const prefecture = str(form, "prefecture");
  const city = str(form, "city", 30);
  const category = str(form, "category");
  const website_url = cleanUrl(str(form, "website_url", 500));
  const sns_url = cleanUrl(str(form, "sns_url", 500));
  if (!team_name) return { error: "チーム名を入力してください。" };
  if (!PREF_NAMES.includes(prefecture)) return { error: "都道府県を選んでください。" };
  if (category && !TEAM_CATEGORIES.includes(category)) return { error: "カテゴリを選び直してください。" };
  if (website_url === "INVALID" || sns_url === "INVALID") return { error: "URLは https:// から始まる形で入力してください。" };
  const { error } = await db().from("portal_teams").insert({ team_name, prefecture, city, category: category || null, website_url, sns_url, poster_name: "運営", is_verified: true });
  if (error) {
    console.error("adminAddTeam", error);
    return { error: "保存に失敗しました：" + error.message };
  }
  revalidatePath("/admin");
  return { ok: true, message: `「${team_name}」を追加しました。` };
}

// ───────── 掲示板 ─────────
export async function createThread(_: FormState, form: FormData): Promise<FormState> {
  const title = str(form, "title", 60);
  const category = str(form, "category");
  const prefecture = str(form, "prefecture") || null;
  const body = str(form, "body", 2000);

  if (!title) return { error: "タイトルを入力してください。" };
  if (!BOARD_CATEGORIES.includes(category)) return { error: "カテゴリを選んでください。" };
  if (prefecture && !PREF_NAMES.includes(prefecture)) return { error: "都道府県を選び直してください。" };
  if (body.length < 5) return { error: "本文を5文字以上入力してください。" };

  const g = await guard(form, "thread", title, body);
  if ("error" in g) return { error: g.error };

  const { data, error } = await db()
    .from("portal_threads")
    .insert({ title, category, prefecture, body, ...commonPoster(form), ip_hash: g.ipHash })
    .select("id")
    .single();
  if (error || !data) {
    console.error("insert failed", error);
    return { error: `保存に失敗しました。時間をおいて再度お試しください。（${error?.code ?? "no-data"}）` };
  }
  after(() => notifyAdmin({ kind: "掲示板：新しいスレッド", title, body: `［${category}］${body}`, review: { type: "thread", id: data.id } }));
  redirect(`/board/${data.id}`);
}

export async function createReply(_: FormState, form: FormData): Promise<FormState> {
  const thread_id = str(form, "thread_id", 40);
  const body = str(form, "body", 1500);
  if (body.length < 2) return { error: "本文を入力してください。" };

  const g = await guard(form, "reply", body);
  if ("error" in g) return { error: g.error };

  const supa = db();
  const { data: th } = await supa.from("portal_threads").select("id, reply_count, is_hidden").eq("id", thread_id).single();
  if (!th || th.is_hidden) return { error: "このスレッドには返信できません。" };
  const { data: rep, error } = await supa.from("portal_replies").insert({ thread_id, body, ...commonPoster(form), ip_hash: g.ipHash }).select("id").single();
  if (error || !rep) return { error: "保存に失敗しました。時間をおいて再度お試しください。" };
  await supa.from("portal_threads").update({ reply_count: (th.reply_count ?? 0) + 1, last_activity_at: new Date().toISOString() }).eq("id", thread_id);
  revalidatePath(`/board/${thread_id}`);
  after(() => notifyAdmin({ kind: "掲示板：返信", title: "スレッドへの返信", body, review: { type: "reply", id: rep.id } }));
  return { ok: true, message: "返信を投稿しました。" };
}

// ───────── コラム寄稿 ─────────
export async function submitColumn(_: FormState, form: FormData): Promise<FormState> {
  const title = str(form, "title", 80);
  const author = str(form, "author", 30);
  const body = str(form, "body", 8000);
  if (!title || !author) return { error: "タイトルとペンネームを入力してください。" };
  if (body.length < 100) return { error: "本文は100文字以上で書いてください。" };

  const g = await guard(form, "column", title, author, body);
  if ("error" in g) return { error: g.error };

  const { data: col, error } = await db().from("portal_columns").insert({ title, author, body, is_published: false, is_submission: true, ip_hash: g.ipHash }).select("id").single();
  if (error || !col) return { error: "送信に失敗しました。時間をおいて再度お試しください。" };
  after(() => notifyAdmin({ kind: "コラムの寄稿（OKで掲載）", title, body: `ペンネーム：${author}\n${body}`, review: { type: "column", id: col.id } }));
  return { ok: true, message: "寄稿を受け付けました。運営が内容を確認のうえ、掲載する場合はコラム一覧に公開されます。" };
}

// ───────── 通報 ─────────
export async function reportItem(_: FormState, form: FormData): Promise<FormState> {
  const nr = notReady();
  if (nr) return nr;
  const target_type = str(form, "target_type", 10);
  const target_id = str(form, "target_id", 40);
  const reason = str(form, "reason", 40);
  const detail = str(form, "detail", 500);
  const table = TABLES[target_type];
  if (!table || !REPORT_REASONS.includes(reason)) return { error: "通報理由を選んでください。" };

  const supa = db();
  const ipHash = await getIpHash();
  // 同じ人が同じ投稿を何度も通報しても1回と数える
  const { count } = await supa.from("portal_reports").select("id", { count: "exact", head: true }).eq("target_id", target_id).eq("ip_hash", ipHash);
  if ((count ?? 0) > 0) return { ok: true, message: "通報を受け付け済みです。ご協力ありがとうございます。" };

  const { data: rp } = await supa.from("portal_reports").insert({ target_type, target_id, reason, detail, ip_hash: ipHash }).select("id").single();
  const { data: row } = await supa.from(table).select("report_count").eq("id", target_id).single();
  const next = (row?.report_count ?? 0) + 1;
  const patch: Record<string, unknown> = { report_count: next };
  // 「個人情報」「子どもの安全」の通報は1件で、それ以外は3件で自動的に非表示にする
  if (next >= AUTO_HIDE_REPORTS || reason === "個人情報が書かれている" || reason === "子どもの安全に関わる内容") patch.is_hidden = true;
  await supa.from(table).update(patch).eq("id", target_id);
  if (rp) after(() => notifyAdmin({ kind: patch.is_hidden ? "通報（自動で非表示中）" : "通報", title: reason, body: `${detail ? `補足：${detail}\n` : ""}通報数：${next}件\nOK＝問題なし（表示に戻す）／NG＝非表示`, review: { type: "report", id: rp.id } }));
  return { ok: true, message: "通報を受け付けました。運営が確認します。ご協力ありがとうございます。" };
}

// ───────── 投稿者による削除 ─────────
export async function deleteOwn(_: FormState, form: FormData): Promise<FormState> {
  const nr = notReady();
  if (nr) return nr;
  const target_type = str(form, "target_type", 10);
  const target_id = str(form, "target_id", 40);
  const key = str(form, "delete_key", 20);
  const table = TABLES[target_type];
  if (!table || !key) return { error: "削除キーを入力してください。" };

  const supa = db();
  const { data } = await supa.from(table).select("delete_key_hash").eq("id", target_id).single();
  if (!data || !checkDeleteKey(key, data.delete_key_hash)) return { error: "削除キーが違います。" };
  await supa.from(table).delete().eq("id", target_id);

  if (target_type === "reply") return { ok: true, message: "返信を削除しました。ページを再読み込みすると反映されます。" };
  const back = { event: "/events", team: "/teams", thread: "/board" }[target_type] ?? "/";
  redirect(back + "?deleted=1");
}

// ───────── お問い合わせ ─────────
export async function sendContact(_: FormState, form: FormData): Promise<FormState> {
  const nr = notReady();
  if (nr) return nr;
  if (isBot(form)) return { error: "送信できませんでした。" };
  const name = str(form, "name", 40);
  const reply_to = str(form, "reply_to", 120);
  const subject = str(form, "subject", 40);
  const body = str(form, "body", 3000);
  if (!subject || body.length < 5) return { error: "種別と内容を入力してください。" };
  const ipHash = await getIpHash();
  const r = await rateLimit(ipHash, "contact");
  if (!r.ok) return { error: r.error };
  const { error } = await db().from("portal_contacts").insert({ name, reply_to, subject, body, ip_hash: ipHash });
  if (error) return { error: "送信に失敗しました。時間をおいて再度お試しください。" };
  after(() => notifyAdmin({ kind: "お問い合わせ", title: subject, body: `${name ? `${name}さん\n` : ""}${body}`, link: "/admin?tab=contacts" }));
  return { ok: true, message: "お問い合わせを受け付けました。内容によっては返信できない場合があります。" };
}

// ───────── 管理者 ─────────
export async function adminLogin(_: FormState, form: FormData): Promise<FormState> {
  const pw = str(form, "password", 200);
  if (!process.env.ADMIN_PASSWORD) return { error: "ADMIN_PASSWORD が設定されていません。" };
  if (pw !== process.env.ADMIN_PASSWORD || !adminToken()) {
    await new Promise((r) => setTimeout(r, 800));
    return { error: "パスワードが違います。" };
  }
  await setAdminCookie();
  const next = str(form, "next", 200);
  redirect(/^\/admin(\/[\w\-/]*)?(\?[\w=&\-]*)?$/.test(next) ? next : "/admin");
}

export async function adminLogout() {
  await clearAdminCookie();
  redirect("/");
}

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("管理者のみ操作できます");
}

const ADMIN_TABLES = ["portal_events", "portal_teams", "portal_threads", "portal_replies", "portal_columns", "portal_reports", "portal_contacts"];

export async function adminSet(form: FormData) {
  await requireAdmin();
  const table = str(form, "table", 20);
  const id = str(form, "id", 40);
  const field = str(form, "field", 20);
  const value = str(form, "value", 10) === "true";
  if (!ADMIN_TABLES.includes(table) || !["is_hidden", "is_verified", "is_resolved"].includes(field)) return;
  const patch: Record<string, unknown> = { [field]: value };
  if (field === "is_hidden" && !value) patch.report_count = 0;
  await db().from(table).update(patch).eq("id", id);
  revalidatePath("/admin");
}

export async function adminDelete(form: FormData) {
  await requireAdmin();
  const table = str(form, "table", 20);
  const id = str(form, "id", 40);
  if (!ADMIN_TABLES.includes(table)) return;
  await db().from(table).delete().eq("id", id);
  revalidatePath("/admin");
}

export async function adminSaveColumn(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(form, "id", 40);
  const title = str(form, "title", 80);
  const author = str(form, "author", 30) || "DODGE PORTAL編集部";
  const body = str(form, "body", 20000);
  const publish = form.get("publish") === "on";
  if (!title || !body) return { error: "タイトルと本文を入力してください。" };
  const row: Record<string, unknown> = { title, author, body, is_published: publish };
  const supa = db();
  if (id) {
    const { data: cur } = await supa.from("portal_columns").select("published_at").eq("id", id).single();
    if (publish && !cur?.published_at) row.published_at = new Date().toISOString();
    await supa.from("portal_columns").update(row).eq("id", id);
  } else {
    if (publish) row.published_at = new Date().toISOString();
    await supa.from("portal_columns").insert(row);
  }
  revalidatePath("/columns");
  redirect("/admin?tab=columns");
}

// ───────── 端末の管理 ─────────
export async function adminBlock(form: FormData) {
  await requireAdmin();
  const ip_hash = str(form, "ip_hash", 64);
  const reason = str(form, "reason", 100) || "管理者による投稿停止";
  if (!ip_hash) return;
  await db().from("portal_blocks").upsert({ ip_hash, reason });
  revalidatePath("/admin");
}

export async function adminUnblock(form: FormData) {
  await requireAdmin();
  const ip_hash = str(form, "ip_hash", 64);
  if (!ip_hash) return;
  await db().from("portal_blocks").delete().eq("ip_hash", ip_hash);
  revalidatePath("/admin");
}

export async function adminHideDevice(form: FormData) {
  await requireAdmin();
  const ip_hash = str(form, "ip_hash", 64);
  if (!ip_hash) return;
  const supa = db();
  await Promise.all(["portal_events", "portal_threads", "portal_replies"].map((t) => supa.from(t).update({ is_hidden: true }).eq("ip_hash", ip_hash)));
  revalidatePath("/admin");
}

// ───────── 協会HPから集めた大会予定の取り込み ─────────
export async function adminImportEvents(_: FormState): Promise<FormState> {
  await requireAdmin();
  const list = (await import("@/data/events-import.json")).default as {
    date_start: string; title: string; prefecture: string; venue: string; category: string; organizer: string; url: string; description: string;
  }[];
  const supa = db();
  const { data: existing, error: e1 } = await supa.from("portal_events").select("id,title,date_start,category").gte("date_start", "2026-04-01").limit(5000);
  if (e1) return { error: "取り込みに失敗しました：" + e1.message };
  const have = new Map((existing ?? []).map((r) => [`${r.date_start}|${r.title}`, r]));
  const rows = list
    .filter((e) => !have.has(`${e.date_start}|${e.title}`))
    .map((e) => ({ ...e, poster_name: "運営（協会HPより）", is_verified: true }));
  // 登録済みの大会は、大会区分だけ最新の内容に直す
  let updated = 0;
  for (const e of list) {
    const cur = have.get(`${e.date_start}|${e.title}`);
    if (cur && cur.category !== e.category) {
      const { error } = await supa.from("portal_events").update({ category: e.category }).eq("id", cur.id);
      if (!error) updated++;
    }
  }
  if (rows.length === 0) {
    revalidatePath("/events");
    return { ok: true, message: `新しく追加する大会はありませんでした（全${list.length}件とも登録済み）。${updated ? `大会区分を${updated}件更新しました。` : ""}` };
  }
  const { error } = await supa.from("portal_events").insert(rows);
  if (error) return { error: "取り込みに失敗しました：" + error.message };
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/admin");
  return { ok: true, message: `${rows.length}件の大会を追加しました（登録済みの${list.length - rows.length}件はスキップ${updated ? `、大会区分を${updated}件更新` : ""}）。` };
}

// ───────── 日本ドッジボール協会の登録チームを取り込み ─────────
const JDBA_POSTER = "日本ドッジボール協会 公開情報";
export async function adminImportTeams(_: FormState): Promise<FormState> {
  await requireAdmin();
  // 日本ドッジボール協会の公開データ（2026年度）を読み取って保存したもの
  const data = (await import("@/data/teams-import.json")).default as { prefecture: string; team_name: string; city: string | null; category: string; website_url: string | null }[];
  const seen = new Set<string>();
  const teams = data.filter((t) => {
    const k = `${t.prefecture}|${t.team_name}|${t.category}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const failed: string[] = [];
  const supa = db();
  // 前回取り込んだ協会データを入れ替える（管理者が手で追加したチームは残す）
  const del = await supa.from("portal_teams").delete().eq("poster_name", JDBA_POSTER);
  if (del.error) return { error: "取り込みに失敗しました：" + del.error.message };
  const rows = teams.map((t) => ({
    team_name: t.team_name,
    prefecture: t.prefecture,
    city: t.city || null,
    category: t.category || null,
    website_url: t.website_url,
    description: null,
    poster_name: JDBA_POSTER,
    is_verified: true,
  }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supa.from("portal_teams").insert(rows.slice(i, i + 500));
    if (error) return { error: "取り込みに失敗しました：" + error.message };
  }
  revalidatePath("/");
  revalidatePath("/teams");
  revalidatePath("/admin");
  const byCat = ["D-1", "D-1G", "S-1", "S-1G"].map((c) => `${c} ${rows.filter((r) => r.category === c).length}`).join("・");
  return { ok: true, message: `${rows.length}チームを取り込みました（${byCat}）。${failed.length ? `読み込めなかった都道府県：${failed.join("・")}` : ""}` };
}

// ───────── 確認ページ・LINE連携 ─────────
export async function adminReview(form: FormData) {
  await requireAdmin();
  const type = str(form, "type", 10) as ReviewType;
  const id = str(form, "id", 40);
  const decision = str(form, "decision", 4);
  if (!REVIEW_TYPES.includes(type) || (decision !== "ok" && decision !== "ng")) return;
  const msg = await applyReview(type, id, decision);
  revalidatePath("/", "layout");
  redirect(`/admin/review/${type}/${id}?done=${encodeURIComponent(msg)}`);
}

export async function adminLineTest(_: FormState): Promise<FormState> {
  await requireAdmin();
  if (!lineReady()) return { error: "LINEの設定（LINE_CHANNEL_ACCESS_TOKEN と LINE_CHANNEL_SECRET）がまだです。" };
  await notifyAdmin({ kind: "テスト通知", title: "LINE通知のテストです", body: "このお知らせが届いていれば設定は完了です。", link: "/admin?tab=line" });
  return { ok: true, message: "テスト通知を送りました。LINEを確認してください（届かない場合は連携の手順をもう一度確認してください）。" };
}

export async function adminLineUnlink() {
  await requireAdmin();
  await setSetting(ADMIN_KEY, null);
  revalidatePath("/admin");
}
