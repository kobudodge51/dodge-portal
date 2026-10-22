import Link from "next/link";
import { db, isConfigured, safeList } from "@/lib/supabase";
import { EVENT_COLS, THREAD_COLS, TEAM_COLS, type EventRow, type ThreadRow, type ColumnRow, type TeamRow } from "@/lib/types";
import { todayJST } from "@/lib/format";
import { BLOCKS, PREFECTURES } from "@/lib/prefectures";
import { EventItem, ThreadItem, ColumnItem, TeamItem } from "@/components/Items";
import Timer from "@/components/Timer";

export const dynamic = "force-dynamic";

async function count(table: string, hiddenFilter = true) {
  if (!isConfigured()) return 0;
  try {
    let q = db().from(table).select("id", { count: "exact", head: true });
    if (hiddenFilter) q = q.eq("is_hidden", false);
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// コートの上に4つのボール。それぞれのコーナーへのリンクになっている
function Court() {
  const balls = [
    { href: "/events", label: "大会予定", color: "var(--blue)", x: 150, y: 120 },
    { href: "/teams", label: "登録チーム", color: "var(--teal)", x: 196, y: 206 },
    { href: "/columns", label: "コラム", color: "var(--coral)", x: 360, y: 104 },
    { href: "/board", label: "交流掲示板", color: "var(--saffron)", x: 392, y: 204 },
  ];
  return (
    <svg className="court" viewBox="0 0 540 340" role="group" aria-label="サイトの主なコーナー">
      <rect x="10" y="10" width="520" height="320" rx="18" fill="#fff" stroke="var(--line)" />
      <g fill="none" stroke="var(--blue)" strokeWidth="2.5" opacity=".55">
        <rect x="40" y="38" width="460" height="264" rx="2" />
        <rect x="88" y="66" width="364" height="208" />
        <line x1="270" y1="66" x2="270" y2="274" />
        <line x1="40" y1="170" x2="88" y2="170" strokeDasharray="4 6" />
        <line x1="452" y1="170" x2="500" y2="170" strokeDasharray="4 6" />
      </g>
      <rect x="89.5" y="67.5" width="179" height="205" fill="var(--blue-soft)" opacity=".55" />
      <rect x="271.5" y="67.5" width="179" height="205" fill="var(--saffron-soft)" opacity=".55" />
      {balls.map((b) => (
        <a key={b.href} href={b.href} aria-label={b.label}>
          <circle className="ball" cx={b.x} cy={b.y} r="30" fill={b.color} />
          <path d={`M${b.x - 22} ${b.y - 12} Q${b.x} ${b.y + 6} ${b.x + 22} ${b.y - 12}`} stroke="#fff" strokeOpacity=".55" strokeWidth="2.5" fill="none" />
          <path d={`M${b.x - 22} ${b.y + 14} Q${b.x} ${b.y - 4} ${b.x + 22} ${b.y + 14}`} stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" />
          <circle cx={b.x - 10} cy={b.y - 12} r="6" fill="#fff" opacity=".35" />
          <text x={b.x} y={b.y + 52} textAnchor="middle" fontSize="15" fill="var(--ink)">{b.label}</text>
        </a>
      ))}
    </svg>
  );
}

export default async function Home() {
  const today = todayJST();
  const [events, threads, columns, teams, nEvents, nTeams, nThreads, nViews] = await Promise.all([
    safeList<EventRow>(() => db().from("portal_events").select(EVENT_COLS).eq("is_hidden", false).gte("date_start", today).order("date_start").limit(6)),
    safeList<ThreadRow>(() => db().from("portal_threads").select(THREAD_COLS).eq("is_hidden", false).order("last_activity_at", { ascending: false }).limit(6)),
    safeList<ColumnRow>(() => db().from("portal_columns").select("*").eq("is_published", true).order("published_at", { ascending: false }).limit(3)),
    safeList<TeamRow>(() => db().from("portal_teams").select(TEAM_COLS).eq("is_hidden", false).order("created_at", { ascending: false }).limit(6)),
    count("portal_events"),
    count("portal_teams"),
    count("portal_threads"),
    count("portal_pageviews", false),
  ]);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-inner">
          <div>
            <h1>
              <span>全国のドッジボールを、</span>
              <br />
              <span>ひとつのコートに。</span>
            </h1>
            <p className="hero-lead">大会予定、登録チーム、コラム、交流掲示板。47都道府県のドッジボール情報を、関わるみんなで集めていく場所です。</p>
            <div className="page-head-action">
              <Link href="/events" className="btn btn-primary">大会予定を見る</Link>
              <Link href="/events/new" className="btn btn-ghost">大会を投稿する</Link>
            </div>
            <div className="hero-stats">
              <div className="stat"><b>{nEvents}</b><span>掲載大会</span></div>
              <div className="stat"><b>{nTeams}</b><span>登録チーム</span></div>
              <div className="stat"><b>{nThreads}</b><span>スレッド</span></div>
              <div className="stat"><b>47</b><span>都道府県</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <Court />
            <div className="hero-timer">
              <Timer value={nViews} digits={6} label="これまでの閲覧数" />
            </div>
          </div>
        </div>
      </section>

      <div className="wrap bento">
        <section className="tile tile-wide tone-blue">
          <div className="section-head">
            <h2>これからの大会</h2>
            <Link href="/events">一覧を見る</Link>
          </div>
          {events.length ? (
            <ul className="list">{events.map((e) => <EventItem key={e.id} e={e} />)}</ul>
          ) : (
            <p className="empty">まだ大会予定がありません。<Link href="/events/new">大会を投稿する</Link></p>
          )}
        </section>

        <section className="tile tile-narrow tone-saffron">
          <div className="section-head">
            <h2>交流掲示板</h2>
            <Link href="/board">一覧を見る</Link>
          </div>
          {threads.length ? (
            <ul className="list">{threads.map((t) => <ThreadItem key={t.id} t={t} />)}</ul>
          ) : (
            <p className="empty">まだスレッドがありません。<Link href="/board/new">最初の話題を立てる</Link></p>
          )}
        </section>

        <section className="tile tile-full tile-soft tone-coral">
          <div className="section-head">
            <h2>ドッジボールコラム</h2>
            <Link href="/columns">一覧を見る</Link>
          </div>
          {columns.length ? (
            <div className="card-grid">{columns.map((c) => <ColumnItem key={c.id} c={c} />)}</div>
          ) : (
            <p className="empty">コラムは準備中です。<Link href="/columns/submit">コラムを寄稿する</Link></p>
          )}
        </section>

        <section className="tile tile-full tone-teal">
          <div className="section-head">
            <h2>登録チーム</h2>
            <Link href="/teams">一覧を見る</Link>
          </div>
          {teams.length ? (
            <div className="card-grid">{teams.map((t) => <TeamItem key={t.id} t={t} />)}</div>
          ) : (
            <p className="empty">登録チームの情報は準備中です。</p>
          )}
        </section>

        <section className="tile tile-full tone-ink">
          <div className="section-head">
            <h2>都道府県から探す</h2>
            <Link href="/associations">協会一覧を見る</Link>
          </div>
          {BLOCKS.map((b) => (
            <div key={b}>
              <p className="pref-block-label">{b}</p>
              <div className="pref-grid">
                {PREFECTURES.filter((p) => p.block === b).map((p) => (
                  <Link key={p.code} href={`/pref/${p.code}`}>{p.name}</Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
