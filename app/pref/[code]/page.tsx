import Link from "next/link";
import { notFound } from "next/navigation";
import { db, safeList } from "@/lib/supabase";
import { EVENT_COLS, TEAM_COLS, THREAD_COLS, type EventRow, type TeamRow, type ThreadRow } from "@/lib/types";
import { prefByCode } from "@/lib/prefectures";
import { ASSOCIATIONS } from "@/lib/associations";
import { todayJST } from "@/lib/format";
import { PageHead } from "@/components/Layout";
import { EventItem, TeamItem, ThreadItem } from "@/components/Items";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: P) {
  const p = prefByCode((await params).code);
  return { title: p ? `${p.name}のドッジボール情報` : "都道府県" };
}

export default async function PrefPage({ params }: P) {
  const p = prefByCode((await params).code);
  if (!p) notFound();
  const today = todayJST();
  const [events, teams, threads] = await Promise.all([
    safeList<EventRow>(() => db().from("portal_events").select(EVENT_COLS).eq("is_hidden", false).eq("prefecture", p.name).gte("date_start", today).order("date_start").limit(20)),
    safeList<TeamRow>(() => db().from("portal_teams").select(TEAM_COLS).eq("is_hidden", false).eq("prefecture", p.name).order("team_name").limit(100)),
    safeList<ThreadRow>(() => db().from("portal_threads").select(THREAD_COLS).eq("is_hidden", false).eq("prefecture", p.name).order("last_activity_at", { ascending: false }).limit(10)),
  ]);
  const assoc = ASSOCIATIONS[p.name];

  return (
    <>
      <PageHead
        kicker={p.block}
        title={`${p.name}のドッジボール`}
        action={
          assoc ? (
            <a href={assoc} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">{p.name}ドッジボール協会 公式HP ↗</a>
          ) : (
            <span className="small" style={{ color: "#c9d3ee" }}>協会ホームページの情報はまだありません</span>
          )
        }
      />
      <div className="wrap section">
        <div className="section-head">
          <h2>これからの大会</h2>
          <Link href={`/events?pref=${encodeURIComponent(p.name)}`}>過去の大会も見る →</Link>
        </div>
        {events.length ? <ul className="list">{events.map((e) => <EventItem key={e.id} e={e} />)}</ul> : <p className="empty">予定されている大会はまだ投稿されていません。<Link href="/events/new">投稿する</Link></p>}
      </div>
      <div className="wrap section">
        <div className="section-head">
          <h2>登録チーム</h2>
          <Link href={`/teams?pref=${encodeURIComponent(p.name)}`}>一覧で見る →</Link>
        </div>
        {teams.length ? <div className="card-grid">{teams.map((t) => <TeamItem key={t.id} t={t} />)}</div> : <p className="empty">登録チームの情報は準備中です。</p>}
      </div>
      <div className="wrap section">
        <div className="section-head">
          <h2>{p.name}の話題</h2>
          <Link href="/board/new">スレッドを立てる →</Link>
        </div>
        {threads.length ? <ul className="list">{threads.map((t) => <ThreadItem key={t.id} t={t} />)}</ul> : <p className="empty">まだスレッドがありません。</p>}
      </div>
    </>
  );
}
