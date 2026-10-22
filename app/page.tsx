import Link from "next/link";
import { db, isConfigured, safeList } from "@/lib/supabase";
import { EVENT_COLS, THREAD_COLS, TEAM_COLS, type EventRow, type ThreadRow, type ColumnRow, type TeamRow } from "@/lib/types";
import { todayJST } from "@/lib/format";
import { BLOCKS, PREFECTURES } from "@/lib/prefectures";
import { EventItem, ThreadItem, ColumnItem, TeamItem } from "@/components/Items";

export const dynamic = "force-dynamic";

async function count(table: string) {
  if (!isConfigured()) return 0;
  try {
    const { count } = await db().from(table).select("id", { count: "exact", head: true }).eq("is_hidden", false);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function Home() {
  const today = todayJST();
  const [events, threads, columns, teams, nEvents, nTeams, nThreads] = await Promise.all([
    safeList<EventRow>(() => db().from("portal_events").select(EVENT_COLS).eq("is_hidden", false).gte("date_start", today).order("date_start").limit(6)),
    safeList<ThreadRow>(() => db().from("portal_threads").select(THREAD_COLS).eq("is_hidden", false).order("last_activity_at", { ascending: false }).limit(6)),
    safeList<ColumnRow>(() => db().from("portal_columns").select("*").eq("is_published", true).order("published_at", { ascending: false }).limit(3)),
    safeList<TeamRow>(() => db().from("portal_teams").select(TEAM_COLS).eq("is_hidden", false).order("created_at", { ascending: false }).limit(8)),
    count("portal_events"),
    count("portal_teams"),
    count("portal_threads"),
  ]);

  return (
    <>
      <section className="hero">
        <div className="hero-court" aria-hidden="true" />
        <div className="hero-ball" aria-hidden="true" />
        <div className="wrap hero-inner">
          <p className="kicker">ALL JAPAN DODGEBALL PORTAL</p>
          <h1>
            全国のドッジボールが、
            <br />
            <em>ここに集まる。</em>
          </h1>
          <p>大会予定、登録チーム、コラム、交流掲示板。47都道府県のドッジボール情報を、みんなでつくるポータルサイトです。</p>
          <div className="page-head-action">
            <Link href="/events/new" className="btn btn-primary">大会予定を投稿する</Link>
            <Link href="/board" className="btn btn-ghost">交流掲示板へ</Link>
          </div>
          <div className="hero-stats">
            <div className="stat"><b>{nEvents}</b><span>掲載大会</span></div>
            <div className="stat"><b>{nTeams}</b><span>登録チーム</span></div>
            <div className="stat"><b>{nThreads}</b><span>掲示板スレッド</span></div>
            <div className="stat"><b>47</b><span>都道府県</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid-2">
          <div>
            <div className="section-head">
              <h2>これからの大会</h2>
              <Link href="/events">すべて見る →</Link>
            </div>
            {events.length ? (
              <ul className="list">{events.map((e) => <EventItem key={e.id} e={e} />)}</ul>
            ) : (
              <p className="empty">まだ大会予定がありません。<Link href="/events/new">最初の大会を投稿する</Link></p>
            )}
          </div>
          <div>
            <div className="section-head">
              <h2>交流掲示板</h2>
              <Link href="/board">すべて見る →</Link>
            </div>
            {threads.length ? (
              <ul className="list">{threads.map((t) => <ThreadItem key={t.id} t={t} />)}</ul>
            ) : (
              <p className="empty">まだスレッドがありません。<Link href="/board/new">スレッドを立てる</Link></p>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>ドッジボールコラム</h2>
            <Link href="/columns">すべて見る →</Link>
          </div>
          {columns.length ? (
            <div className="card-grid">{columns.map((c) => <ColumnItem key={c.id} c={c} />)}</div>
          ) : (
            <p className="empty">コラムは準備中です。<Link href="/columns/submit">コラムを寄稿する</Link></p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>登録チーム</h2>
            <Link href="/teams">すべて見る →</Link>
          </div>
          {teams.length ? (
            <div className="card-grid">{teams.map((t) => <TeamItem key={t.id} t={t} />)}</div>
          ) : (
            <p className="empty">登録チームの情報は準備中です。</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>都道府県から探す</h2>
            <Link href="/associations">協会一覧 →</Link>
          </div>
          {BLOCKS.map((b) => (
            <div key={b} style={{ marginBottom: 12 }}>
              <p className="small muted" style={{ margin: "0 0 4px", fontWeight: 700 }}>{b}</p>
              <div className="pref-grid">
                {PREFECTURES.filter((p) => p.block === b).map((p) => (
                  <Link key={p.code} href={`/pref/${p.code}`}>{p.name}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
