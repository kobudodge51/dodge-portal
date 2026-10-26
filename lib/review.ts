import { db } from "./supabase";

// LINEや確認ページからの「OK／NG」を反映する
export type ReviewType = "event" | "thread" | "reply" | "column" | "report";
export const REVIEW_TYPES: ReviewType[] = ["event", "thread", "reply", "column", "report"];
export const REVIEW_LABEL: Record<ReviewType, string> = { event: "大会予定", thread: "スレッド", reply: "返信", column: "コラム寄稿", report: "通報" };
const TABLE: Record<string, string> = { event: "portal_events", thread: "portal_threads", reply: "portal_replies", team: "portal_teams" };

export type ReviewItem = { type: ReviewType; id: string; title: string; body: string; status: string; link: string | null; extra?: string };

const isUuid = (id: string) => /^[0-9a-f-]{36}$/.test(id);

export async function loadReviewItem(type: ReviewType, id: string): Promise<ReviewItem | null> {
  if (!isUuid(id)) return null;
  const supa = db();
  if (type === "event") {
    const { data: r } = await supa.from("portal_events").select("*").eq("id", id).maybeSingle();
    if (!r) return null;
    return { type, id, title: r.title, body: [`${r.date_start}　${r.prefecture}`, r.venue, r.organizer && `主催：${r.organizer}`, r.url, r.description].filter(Boolean).join("\n"), status: r.is_hidden ? "非表示" : r.is_verified ? "公開中（確認済み）" : "公開中（未確認）", link: `/events/${id}`, extra: `投稿者：${r.poster_name}` };
  }
  if (type === "thread") {
    const { data: r } = await supa.from("portal_threads").select("*").eq("id", id).maybeSingle();
    if (!r) return null;
    return { type, id, title: r.title, body: r.body, status: r.is_hidden ? "非表示" : "公開中", link: `/board/${id}`, extra: `${r.category}／投稿者：${r.poster_name}` };
  }
  if (type === "reply") {
    const { data: r } = await supa.from("portal_replies").select("*").eq("id", id).maybeSingle();
    if (!r) return null;
    const { data: th } = await supa.from("portal_threads").select("title").eq("id", r.thread_id).maybeSingle();
    return { type, id, title: `「${th?.title ?? "スレッド"}」への返信`, body: r.body, status: r.is_hidden ? "非表示" : "公開中", link: `/board/${r.thread_id}`, extra: `投稿者：${r.poster_name}` };
  }
  if (type === "column") {
    const { data: r } = await supa.from("portal_columns").select("*").eq("id", id).maybeSingle();
    if (!r) return null;
    return { type, id, title: r.title, body: r.body, status: r.is_published ? "掲載中" : "未掲載", link: r.is_published ? `/columns/${id}` : null, extra: `ペンネーム：${r.author}` };
  }
  if (type === "report") {
    const { data: r } = await supa.from("portal_reports").select("*").eq("id", id).maybeSingle();
    if (!r) return null;
    const target = REVIEW_TYPES.includes(r.target_type) ? await loadReviewItem(r.target_type as ReviewType, r.target_id) : null;
    return {
      type, id,
      title: `通報：${r.reason}`,
      body: [r.detail && `補足：${r.detail}`, target ? `【対象の${REVIEW_LABEL[target.type]}】${target.title}\n${target.body}` : "対象の投稿は見つかりません（削除済み）"].filter(Boolean).join("\n\n"),
      status: `${r.is_resolved ? "対応済み" : "未対応"}／対象：${target?.status ?? "なし"}`,
      link: target?.link ?? null,
    };
  }
  return null;
}

// decision: "ok" = 問題なし（公開・掲載する）／"ng" = 非表示にする
export async function applyReview(type: ReviewType, id: string, decision: "ok" | "ng"): Promise<string> {
  if (!REVIEW_TYPES.includes(type) || !isUuid(id)) return "対象が見つかりませんでした。";
  const supa = db();
  if (type === "column") {
    const patch = decision === "ok" ? { is_published: true, published_at: new Date().toISOString() } : { is_published: false };
    const { error } = await supa.from("portal_columns").update(patch).eq("id", id);
    if (error) return "反映に失敗しました：" + error.message;
    return decision === "ok" ? "コラムを掲載しました。" : "コラムは掲載しません（未掲載のまま）。";
  }
  if (type === "report") {
    const { data: r } = await supa.from("portal_reports").select("*").eq("id", id).maybeSingle();
    if (!r) return "通報が見つかりませんでした。";
    const table = TABLE[r.target_type];
    if (table) {
      const patch = decision === "ok" ? { is_hidden: false, report_count: 0 } : { is_hidden: true };
      await supa.from(table).update(patch).eq("id", r.target_id);
    }
    // 同じ投稿への通報をまとめて対応済みにする
    await supa.from("portal_reports").update({ is_resolved: true }).eq("target_id", r.target_id);
    return decision === "ok" ? "問題なしとして、投稿を表示に戻しました。" : "通報された投稿を非表示にしました。";
  }
  const table = TABLE[type];
  const patch: Record<string, unknown> = decision === "ok" ? { is_hidden: false } : { is_hidden: true };
  if (type === "event" && decision === "ok") patch.is_verified = true;
  const { error } = await supa.from(table).update(patch).eq("id", id);
  if (error) return "反映に失敗しました：" + error.message;
  return decision === "ok" ? `${REVIEW_LABEL[type]}をOKにしました（公開中）。` : `${REVIEW_LABEL[type]}を非表示にしました。`;
}
