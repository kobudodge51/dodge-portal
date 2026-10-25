import Link from "next/link";
import { notFound } from "next/navigation";
import { db, safeOne } from "@/lib/supabase";
import { EVENT_COLS, type EventRow } from "@/lib/types";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { prefByName } from "@/lib/prefectures";
import { ASSOCIATIONS } from "@/lib/associations";
import PostTools from "@/components/PostTools";
import CategoryTags from "@/components/CategoryTags";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ id: string }>; searchParams: Promise<{ posted?: string }> };

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return safeOne<EventRow>(() => db().from("portal_events").select(EVENT_COLS).eq("id", id).eq("is_hidden", false).single());
}

export async function generateMetadata({ params }: P) {
  const e = await load((await params).id);
  return { title: e ? `${e.title}（${e.prefecture}）` : "大会予定" };
}

export default async function EventDetail({ params, searchParams }: P) {
  const e = await load((await params).id);
  if (!e) notFound();
  const sp = await searchParams;
  const pref = prefByName(e.prefecture);
  const assoc = ASSOCIATIONS[e.prefecture];

  return (
    <article className="detail">
      {sp.posted && <p className="banner-ok">投稿しました！ありがとうございます。</p>}
      <p className="small"><Link href="/events">← 大会予定一覧</Link></p>
      <div className="row-meta" style={{ marginBottom: 8 }}>
        <span className="tag tag-pref">{e.prefecture}</span>
        <CategoryTags value={e.category} withNote />
        {e.is_verified && <span className="tag tag-ok">運営確認済み</span>}
      </div>
      <h1 style={{ fontSize: "1.6rem" }}>{e.title}</h1>
      <table className="detail-table">
        <tbody>
          <tr><th>開催日</th><td>{fmtDate(e.date_start)}{e.date_end && e.date_end !== e.date_start ? ` 〜 ${fmtDate(e.date_end)}` : ""}</td></tr>
          {e.venue && <tr><th>会場</th><td>{e.venue}</td></tr>}
          {e.organizer && <tr><th>主催</th><td>{e.organizer}</td></tr>}
          {e.url && <tr><th>詳細ページ</th><td><a href={e.url} target="_blank" rel="noopener noreferrer nofollow ugc">{e.url}</a></td></tr>}
          {assoc && <tr><th>{e.prefecture}協会</th><td><a href={assoc} target="_blank" rel="noopener noreferrer">公式ホームページ</a></td></tr>}
        </tbody>
      </table>
      {e.description && <p className="prose">{e.description}</p>}
      <p className="small muted">投稿者：{e.poster_name}　投稿日時：{fmtDateTime(e.created_at)}</p>
      <p className="notice-box">掲載内容は投稿によるものです。日程・参加条件・申込方法は必ず主催者の発表をご確認ください。</p>
      {pref && <p className="small"><Link href={`/pref/${pref.code}`}>{e.prefecture}のドッジボール情報をもっと見る →</Link></p>}
      <PostTools type="event" id={e.id} />
    </article>
  );
}
