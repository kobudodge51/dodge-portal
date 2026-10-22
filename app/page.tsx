import Link from "next/link";
import { db, isConfigured, safeList } from "@/lib/supabase";
import { EVENT_COLS, THREAD_COLS, type EventRow, type ThreadRow, type ColumnRow } from "@/lib/types";
import { todayJST, fmtDateShort, fmtDateTime } from "@/lib/format";
import { BLOCKS, PREFECTURES } from "@/lib/prefectures";
import { ThreadItem } from "@/components/Items";

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

export default async function Home() {
  const today = todayJST();
  const [events, threads, columns, nEvents, nTeams, nThreads, nColumns] = await Promise.all([
    safeList<EventRow>(() => db().from("portal_events").select(EVENT_COLS).eq("is_hidden", false).gte("date_start", today).order("date_start").limit(12)),
    safeList<ThreadRow>(() => db().from("portal_threads").select(THREAD_COLS).eq("is_hidden", false).order("last_activity_at", { ascending: false }).limit(5)),
    safeList<ColumnRow>(() => db().from("portal_columns").select("*").eq("is_published", true).order("published_at", { ascending: false }).limit(4)),
    count("portal_events", (q) => q.eq("is_hidden", false).gte("date_start", today)),
    count("portal_teams"),
    count("portal_threads"),
    count("portal_columns", (q) => q.eq("is_published", true)),
  ]);

  const gates = [
    { href: "/events", name: "大会予定", num: nEvents, unit: "件 開催予定", tone: "blue" },
    { href: "/teams", name: "登録チーム", num: nTeams, unit: "チーム", tone: "teal" },
    { href: "/columns", name: "コラム", num: nColumns, unit: "本", tone: "coral" },
    { href: "/board", name: "交流掲示板", num: nThreads, unit: "スレッド", tone: "saffron" },
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-court" aria-hidden="true" />
        <div className="wrap hero-inner hero-grid">
          <div>
            <h1 className="hero-title">
              <span>Dodge</span>
              <span className="g">Portal</span>
            </h1>
            <p className="hero-sub"><span>全国のドッジボールを、</span><span>ひとつのコートに。</span></p>
            <p className="hero-lead">大会予定・登録チーム・コラム・交流掲示板。47都道府県の情報が、ここに集まります。</p>
          </div>
          <nav className="gates" aria-label="コーナー">
            {gates.map((g) => (
              <Link key={g.href} href={g.href} className={`gate tone-${g.tone}`}>
                <span className="gate-name">{g.name}</span>
                <span><span className="gate-num">{g.num}</span><span className="gate-unit">{g.unit}</span></span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="fixtures" aria-label="これからの大会">
        <div className="wrap fixtures-inner">
          <span className="fixtures-label">次の大会</span>
          <div className="rail">
            {events.length ? (
              events.map((e) => {
                const d = fmtDateShort(e.date_start);
                return (
                  <Link key={e.id} href={`/events/${e.id}`} className="fixture">
                    <span className="fixture-date">{d.md}<small>{d.w}曜</small></span>
                    <span>
                      <span className="fixture-title">{e.title}</span>
                      <span className="fixture-meta">{e.prefecture}{e.venue ? `・${e.venue}` : ""}</span>
                    </span>
                  </Link>
                );
              })
            ) : (
              <Link href="/events/new" className="fixture" style={{ width: 300 }}>
                <span className="fixture-date">+<small>投稿</small></span>
                <span>
                  <span className="fixture-title">開催予定の大会を投稿してください</span>
                  <span className="fixture-meta">主催者・協会の発表済みの大会</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="wrap home-grid">
        <section className="panel tone-saffron">
          <div className="section-head">
            <h2>交流掲示板</h2>
            <Link href="/board/new">話題を立てる</Link>
          </div>
          {threads.length ? (
            <ul className="list">{threads.map((t) => <ThreadItem key={t.id} t={t} />)}</ul>
          ) : (
            <p className="empty">まだスレッドがありません。最初の話題を立ててみましょう。</p>
          )}
        </section>

        <section className="panel tone-coral">
          <div className="section-head">
            <h2>コラム</h2>
            <Link href="/columns">すべて見る</Link>
          </div>
          {columns.length ? (
            <ul className="list">
              {columns.map((c) => (
                <li key={c.id}>
                  <Link href={`/columns/${c.id}`} className="thread-row">
                    <p className="row-title">{c.title}</p>
                    <div className="row-meta"><span>{c.author}</span><span>{c.published_at ? fmtDateTime(c.published_at).split(" ")[0] : ""}</span></div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">コラムは準備中です。<Link href="/columns/submit">寄稿する</Link></p>
          )}
        </section>

        <section className="panel panel-find tone-teal">
          <div className="section-head">
            <h2>地域から探す</h2>
            <Link href="/associations">協会一覧</Link>
          </div>
          <form action="/pref/go" method="get">
            <label className="small muted" htmlFor="pref-go">都道府県を選ぶと、その地域の大会・チーム・話題をまとめて見られます。</label>
            <select id="pref-go" name="code" required defaultValue="" style={{ marginTop: 8 }}>
              <option value="" disabled>都道府県を選ぶ</option>
              {BLOCKS.map((b) => (
                <optgroup key={b} label={b}>
                  {PREFECTURES.filter((p) => p.block === b).map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                </optgroup>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" type="submit" style={{ width: "100%" }}>この地域を見る</button>
          </form>
        </section>
      </div>
    </>
  );
}
