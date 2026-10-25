import Link from "next/link";
import type { Metadata } from "next";
import { db, isConfigured, safeList } from "@/lib/supabase";
import { EVENT_COLS, type EventRow } from "@/lib/types";
import { todayJST } from "@/lib/format";
import { EVENT_CATEGORIES, EVENT_CATEGORY_NOTE, BLOCKS, blockPrefNames, splitCategories } from "@/lib/prefectures";
import { EventItem } from "@/components/Items";
import { PageHead, NotConnected } from "@/components/Layout";
import PrefSelect from "@/components/PrefSelect";
import { CATEGORY_TONE } from "@/components/CategoryTags";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "大会予定カレンダー" };

type SP = Promise<{ pref?: string; block?: string; cat?: string; m?: string; deleted?: string }>;

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
const pad = (n: number) => String(n).padStart(2, "0");
const ym = (y: number, m: number) => `${y}-${pad(m)}`;
function shift(y: number, m: number, d: number) {
  const t = y * 12 + (m - 1) + d;
  return { y: Math.floor(t / 12), m: (t % 12) + 1 };
}

export default async function EventsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const today = todayJST();
  const [ty, tm] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
  const mm = /^(\d{4})-(\d{2})$/.exec(sp.m ?? "");
  const y = mm ? Number(mm[1]) : ty;
  const m = mm && Number(mm[2]) >= 1 && Number(mm[2]) <= 12 ? Number(mm[2]) : tm;
  const next = shift(y, m, 1);
  const prev = shift(y, m, -1);
  const start = `${ym(y, m)}-01`;
  const end = `${ym(next.y, next.m)}-01`;

  const events = await safeList<EventRow>(() => {
    let q = db().from("portal_events").select(EVENT_COLS).eq("is_hidden", false).gte("date_start", start).lt("date_start", end);
    if (sp.pref) q = q.eq("prefecture", sp.pref);
    else if (sp.block && (BLOCKS as readonly string[]).includes(sp.block)) q = q.in("prefecture", blockPrefNames(sp.block));
    if (sp.cat && EVENT_CATEGORIES.includes(sp.cat)) q = q.ilike("category", `%${sp.cat}%`);
    return q.order("date_start").order("prefecture").limit(1000);
  });

  // 日付ごとにまとめる
  const byDay = new Map<number, EventRow[]>();
  for (const e of events) {
    const d = Number(e.date_start.slice(8, 10));
    byDay.set(d, [...(byDay.get(d) ?? []), e]);
  }
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  // 絞り込み条件を保ったまま月を移動するリンク
  const qs = (target: string) => {
    const p = new URLSearchParams();
    if (sp.block) p.set("block", sp.block);
    if (sp.pref) p.set("pref", sp.pref);
    if (sp.cat) p.set("cat", sp.cat);
    p.set("m", target);
    return `/events?${p.toString()}`;
  };
  const MAX = 3;

  return (
    <>
      <PageHead
        kicker="SCHEDULE"
        title="大会予定カレンダー"
        lead="全国のドッジボール大会・交流会の予定です。各都道府県協会の発表や、閲覧者のみなさんからの投稿で作られています。"
        action={<Link href="/events/new" className="btn btn-primary">＋ 大会予定を投稿する</Link>}
      />
      <div className="wrap section">
        {sp.deleted && <p className="banner-ok">投稿を削除しました。</p>}
        {!isConfigured() && <NotConnected />}
        <form className="filters" method="get">
          <input type="hidden" name="m" value={ym(y, m)} />
          <label>
            ブロック
            <select name="block" defaultValue={sp.block ?? ""}>
              <option value="">すべて</option>
              {BLOCKS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
          <label>
            都道府県
            <PrefSelect name="pref" required={false} defaultValue={sp.pref ?? ""} emptyLabel="すべて" />
          </label>
          <label>
            大会区分
            <select name="cat" defaultValue={sp.cat ?? ""}>
              <option value="">すべて</option>
              {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}{EVENT_CATEGORY_NOTE[c] ? `（${EVENT_CATEGORY_NOTE[c]}）` : ""}</option>)}
            </select>
          </label>
          <button className="btn btn-outline btn-sm" type="submit">絞り込む</button>
        </form>

        <div className="cal-head">
          <Link href={qs(ym(prev.y, prev.m))} className="cal-nav" aria-label="前の月">← {prev.m}月</Link>
          <h2 className="cal-title">{y}年<b>{m}</b>月<span>{events.length}件</span></h2>
          <Link href={qs(ym(next.y, next.m))} className="cal-nav" aria-label="次の月">{next.m}月 →</Link>
        </div>
        {(y !== ty || m !== tm) && <p className="small" style={{ textAlign: "center", margin: "-6px 0 8px" }}><Link href={qs(ym(ty, tm))}>今月に戻る</Link></p>}

        <div className="cal" role="table" aria-label={`${y}年${m}月の大会予定`}>
          {WEEK.map((w, i) => <div key={w} className={`cal-dow${i === 0 ? " sun" : i === 6 ? " sat" : ""}`} role="columnheader">{w}</div>)}
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} className="cal-cell empty" />;
            const list = byDay.get(d) ?? [];
            const iso = `${ym(y, m)}-${pad(d)}`;
            const dow = i % 7;
            return (
              <div key={iso} className={`cal-cell${iso === today ? " today" : ""}${iso < today ? " past" : ""}${list.length ? " has" : ""}`} role="cell">
                <span className={`cal-day${dow === 0 ? " sun" : dow === 6 ? " sat" : ""}`}>{d}</span>
                {list.length > 0 && <a href={`#d${d}`} className="cal-count" aria-label={`${d}日の大会 ${list.length}件`}>{list.length}</a>}
                <div className="cal-items">
                  {list.slice(0, MAX).map((e) => {
                    const c = splitCategories(e.category)[0];
                    return (
                      <Link key={e.id} href={`/events/${e.id}`} className={`cal-ev ${c ? CATEGORY_TONE[c] : ""}`} title={`${e.title}（${e.prefecture}）`}>
                        <span className="cal-ev-pref">{e.prefecture.replace(/[都府県]$/, "")}</span>{e.title}
                      </Link>
                    );
                  })}
                  {list.length > MAX && <a href={`#d${d}`} className="cal-more">ほか{list.length - MAX}件</a>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="cal-legend">
          {EVENT_CATEGORIES.map((c) => <span key={c} className={`tag ${CATEGORY_TONE[c]}`}>{c}</span>)}
          <span className="tag">区分なし</span>
        </div>

        <h2 style={{ marginTop: 28 }}>{m}月の大会一覧</h2>
        {events.length === 0 && <p className="empty">この月の大会予定はまだありません。</p>}
        {[...byDay.entries()].map(([d, list]) => (
          <section key={d} id={`d${d}`} style={{ marginBottom: 14, scrollMarginTop: 80 }}>
            <ul className="list">{list.map((e) => <EventItem key={e.id} e={e} />)}</ul>
          </section>
        ))}
        <p className="small muted">※大会予定は、日本ドッジボール協会の公式サイトに掲載されている都道府県協会の情報と、閲覧者のみなさんからの投稿をもとにしています。協会のホームページがない都道府県や、年間の大会予定が掲載されていない都道府県の大会は入っていない場合があります。日程や参加条件は必ず主催者の発表をご確認ください。「確認済み」は運営が主催者の発表と照合した大会です。都道府県を選んだ場合は、ブロックより都道府県が優先されます。</p>
      </div>
    </>
  );
}
