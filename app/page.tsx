import Link from "next/link";
import { db, isConfigured, safeList, safeOne } from "@/lib/supabase";
import { EVENT_COLS, THREAD_COLS, type EventRow, type ThreadRow, type ColumnRow } from "@/lib/types";
import { todayJST, fmtDateShort, fmtDateTime } from "@/lib/format";
import { BLOCKS, PREFECTURES } from "@/lib/prefectures";
import { getSetting } from "@/lib/settings";
import SpecialBanner from "@/components/SpecialBanner";
import InstallHint from "@/components/InstallHint";

export const dynamic = "force-dynamic";

async function count(table: string, extra?: (q: any) => any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!isConfigured()) return 0;
  try {
    let q = db().from(table).select("id", { count: "exact", head: true });
    q = extra ? extra(q) : q.eq("is_hidden", false);
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// 日付（YYYY-MM-DD）に日数を足す
function addDays(iso: string, n: number) {
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n));
  return d.toISOString().slice(0, 10);
}
const short = (pref: string) => pref.replace(/(都|府|県)$/, "");

export default async function Home() {
  const today = todayJST();
  // 今週（月曜〜日曜）
  const dow = new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10))).getUTCDay();
  const weekStart = addDays(today, -((dow + 6) % 7));
  const weekEnd = addDays(weekStart, 6);
  const pickupId = await getSetting("pickup_thread");

  const [weekList, pastList, upcomingList, threads, columns, pickup, nEvents, nTeams, nThreads, nColumns] = await Promise.all([
    safeList<EventRow>(() => db().from("portal_events").select(EVENT_COLS).eq("is_hidden", false).gte("date_start", weekStart).lte("date_start", weekEnd).order("date_start").order("prefecture").limit(60)),
    safeList<EventRow>(() => db().from("portal_events").select(EVENT_COLS).eq("is_hidden", false).lt("date_start", today).order("date_start", { ascending: false }).limit(15)),
    safeList<EventRow>(() => db().from("portal_events").select(EVENT_COLS).eq("is_hidden", false).gte("date_start", today).order("date_start").limit(15)),
    safeList<ThreadRow>(() => db().from("portal_threads").select(THREAD_COLS).eq("is_hidden", false).order("last_activity_at", { ascending: false }).limit(5)),
    safeList<ColumnRow>(() => db().from("portal_columns").select("*").eq("is_published", true).order("published_at", { ascending: false }).limit(4)),
    pickupId ? safeOne<ThreadRow>(() => db().from("portal_threads").select(THREAD_COLS).eq("id", pickupId).eq("is_hidden", false).single()) : Promise.resolve(null),
    count("portal_events", (q) => q.eq("is_hidden", false).gte("date_start", today)),
    count("portal_teams"),
    count("portal_threads"),
    count("portal_columns", (q) => q.eq("is_published", true)),
  ]);

  // 今日をはさんだ前後の大会を合計15件（終わった大会は最大5件）
  const TOTAL = 15;
  let nPast = Math.min(5, pastList.length);
  const nUp = Math.min(TOTAL - nPast, upcomingList.length);
  nPast = Math.min(pastList.length, TOTAL - nUp);
  const near = [...pastList.slice(0, nPast).reverse(), ...upcomingList.slice(0, nUp)];
  const nextId = upcomingList[0]?.id;

  // 今週の大会（表示は8件まで）
  const WEEK_MAX = 8;
  const weekShown = weekList.slice(0, WEEK_MAX);
  const ws = fmtDateShort(weekStart);
  const we = fmtDateShort(weekEnd);

  const gates = [
    { href: "/events", name: "大会予定", num: nEvents, unit: "件", tone: "blue" },
    { href: "/teams", name: "登録チーム", num: nTeams, unit: "", tone: "teal" },
    { href: "/columns", name: "コラム", num: nColumns, unit: "本", tone: "coral" },
    { href: "/board", name: "掲示板", num: nThreads, unit: "", tone: "saffron" },
  ];

  return (
    <>
      <div className="wrap home-top">
        <div className="home-glow" aria-hidden="true" />
        <div className="home-hero">
          <h1 className="home-title">DODGE<span className="g">PORTAL</span></h1>
          <p className="home-copy">全国のドッジボールを、<span className="grad-t">ひとつのコートに。</span></p>
          <p className="home-lead">大会予定・登録チーム・コラム・交流掲示板。<br />47都道府県の情報が、ここに集まります。</p>
          <nav className="mini-gates" aria-label="コーナー">
            {gates.map((g) => (
              <Link key={g.href} href={g.href} className={`mini-gate tone-${g.tone}`}>
                <b>{g.name}</b>
                <em>{g.num}</em>{g.unit && <small>{g.unit}</small>}
              </Link>
            ))}
          </nav>
          <SpecialBanner today={today} />
          <InstallHint />
        </div>

        <section className="week-panel" aria-label="今週の大会">
          <div className="panel-bar">
            <h2><b>THIS WEEK</b>今週の大会<small>{ws.md}〜{we.md}・{weekList.length}大会</small></h2>
            <Link href="/events">カレンダー →</Link>
          </div>
          {weekShown.length ? (
            weekShown.map((e) => {
              const d = fmtDateShort(e.date_start);
              const cls = d.w === "土" ? "sat" : d.w === "日" ? "sun" : "";
              return (
                <Link key={e.id} href={`/events/${e.id}`} className={`wk-row${e.date_start < today ? " done" : ""}${e.date_start === today ? " today" : ""}`}>
                  <span className="wk-date">{d.md}<i className={cls}>{d.w}</i></span>
                  <span className="wk-title">{e.title}</span>
                  <span className="wk-pref">{short(e.prefecture)}</span>
                </Link>
              );
            })
          ) : (
            <p className="empty" style={{ padding: "8px 12px", margin: 0 }}>今週の大会予定はまだ登録されていません。</p>
          )}
          {weekList.length > WEEK_MAX && <Link href="/events" className="wk-more">ほか{weekList.length - WEEK_MAX}大会を見る →</Link>}
        </section>
      </div>

      <section className="near" aria-label="直近の大会">
        <div className="wrap">
          <div className="near-head">
            <h2><b>NEAR GAMES</b>直近の大会<small>きょうの前後{near.length}大会</small></h2>
            <Link href="/events">すべての大会予定 →</Link>
          </div>
          {near.length ? (
            <div className="month-grid">
              {near.map((e) => {
                const d = fmtDateShort(e.date_start);
                const done = e.date_start < today;
                return (
                  <Link key={e.id} href={`/events/${e.id}`} className={`mfix${done ? " done" : ""}${e.id === nextId ? " next" : ""}`}>
                    <span className="mfix-date">{d.md}<small>（{d.w}）{done ? " 終了" : e.date_start === today ? " 本日" : ""}</small>{e.id === nextId && <em className="mfix-next">NEXT</em>}</span>
                    <span className="mfix-title">{e.title}</span>
                    <span className="mfix-meta">{e.prefecture}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="empty small">大会予定はまだ登録されていません。<Link href="/events/new">大会予定を投稿する</Link></p>
          )}
        </div>
      </section>

      <div className="wrap home-panels">
        <section className="hp-panel tone-saffron">
          <div className="panel-bar">
            <h2><b>BOARD</b>交流掲示板</h2>
            <Link href="/board">すべて →</Link>
          </div>
          {pickup && (
            <div style={{ padding: "2px 10px 8px" }}>
              <Link href={`/board/${pickup.id}`} className="pickup">
                <span><span className="pickup-label">今週のお題</span><span className="pickup-title">{pickup.title}</span></span>
              </Link>
            </div>
          )}
          {threads.length ? (
            threads.map((t) => (
              <Link key={t.id} href={`/board/${t.id}`} className="hp-row"><span>{t.title}</span><small>返信{t.reply_count}</small></Link>
            ))
          ) : (
            <p className="empty">まだ話題がありません。<Link href="/board/new">最初の話題を投稿する</Link></p>
          )}
        </section>

        <section className="hp-panel tone-coral">
          <div className="panel-bar">
            <h2><b>COLUMN</b>コラム</h2>
            <Link href="/columns">すべて →</Link>
          </div>
          {columns.length ? (
            columns.map((c) => (
              <Link key={c.id} href={`/columns/${c.id}`} className="hp-row"><span>{c.title}</span><small>{c.published_at ? fmtDateTime(c.published_at).split(" ")[0] : ""}</small></Link>
            ))
          ) : (
            <p className="empty">コラムは準備中です。<Link href="/columns/submit">寄稿する</Link></p>
          )}
        </section>

        <section className="hp-panel tone-teal">
          <div className="panel-bar">
            <h2><b>AREA</b>地域から探す</h2>
            <Link href="/associations">協会一覧 →</Link>
          </div>
          <form action="/pref/go" method="get">
            <label className="small muted" htmlFor="pref-go">都道府県を選ぶと、その地域の大会・チーム・話題をまとめて見られます。</label>
            <select id="pref-go" name="code" required defaultValue="" style={{ marginTop: 6 }}>
              <option value="" disabled>都道府県を選ぶ</option>
              {BLOCKS.map((b) => (
                <optgroup key={b} label={b}>
                  {PREFECTURES.filter((p) => p.block === b).map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                </optgroup>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" type="submit" style={{ width: "100%", marginTop: 8 }}>この地域を見る</button>
          </form>
        </section>
      </div>

      <div className="wrap">
        <p className="source-note">※大会予定・登録チームは、日本ドッジボール協会の公式サイトに掲載されている都道府県協会の情報をもとにしています。協会のホームページがない都道府県や、年間の大会予定が掲載されていない都道府県の大会は入っていません。</p>
      </div>
    </>
  );
}
