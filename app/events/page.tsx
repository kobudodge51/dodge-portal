import Link from "next/link";
import type { Metadata } from "next";
import { db, isConfigured, safeList } from "@/lib/supabase";
import { EVENT_COLS, type EventRow } from "@/lib/types";
import { todayJST } from "@/lib/format";
import { EVENT_CATEGORIES, EVENT_CATEGORY_NOTE, BLOCKS, blockPrefNames } from "@/lib/prefectures";
import { NotConnected } from "@/components/Layout";
import PrefSelect from "@/components/PrefSelect";
import EventCalendar from "@/components/EventCalendar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "大会予定カレンダー" };

type SP = Promise<{ pref?: string; block?: string; cat?: string; m?: string; deleted?: string }>;

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


  // 絞り込み条件を保ったまま月を移動するリンク
  const qs = (target: string) => {
    const p = new URLSearchParams();
    if (sp.block) p.set("block", sp.block);
    if (sp.pref) p.set("pref", sp.pref);
    if (sp.cat) p.set("cat", sp.cat);
    p.set("m", target);
    return `/events?${p.toString()}`;
  };

  return (
    <>
      <div className="wrap section">
        <div className="board-tools">
          <h1 className="disp-head" style={{ margin: 0 }}><span>SCHEDULE</span>大会予定カレンダー</h1>
          <Link href="/events/new" className="btn btn-primary btn-sm">＋ 大会予定を投稿</Link>
        </div>
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

        <EventCalendar y={y} m={m} today={today} events={events} />

        <p className="small muted">※大会予定は、日本ドッジボール協会の公式サイトに掲載されている都道府県協会の情報と、閲覧者のみなさんからの投稿をもとにしています。協会のホームページがない都道府県や、年間の大会予定が掲載されていない都道府県の大会は入っていない場合があります。日程や参加条件は必ず主催者の発表をご確認ください。「確認済み」は運営が主催者の発表と照合した大会です。都道府県を選んだ場合は、ブロックより都道府県が優先されます。</p>
      </div>
    </>
  );
}
