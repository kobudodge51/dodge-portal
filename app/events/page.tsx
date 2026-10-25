import Link from "next/link";
import type { Metadata } from "next";
import { db, isConfigured, safeList } from "@/lib/supabase";
import { EVENT_COLS, type EventRow } from "@/lib/types";
import { todayJST } from "@/lib/format";
import { EVENT_CATEGORIES, EVENT_CATEGORY_NOTE, BLOCKS, blockPrefNames } from "@/lib/prefectures";
import { EventItem } from "@/components/Items";
import { PageHead, NotConnected } from "@/components/Layout";
import PrefSelect from "@/components/PrefSelect";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "大会予定一覧" };

type SP = Promise<{ pref?: string; block?: string; cat?: string; past?: string; deleted?: string }>;

export default async function EventsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const today = todayJST();
  const past = sp.past === "1";

  const events = await safeList<EventRow>(() => {
    let q = db().from("portal_events").select(EVENT_COLS).eq("is_hidden", false);
    if (sp.pref) q = q.eq("prefecture", sp.pref);
    else if (sp.block && (BLOCKS as readonly string[]).includes(sp.block)) q = q.in("prefecture", blockPrefNames(sp.block));
    if (sp.cat && EVENT_CATEGORIES.includes(sp.cat)) q = q.ilike("category", `%${sp.cat}%`);
    q = past ? q.lt("date_start", today).order("date_start", { ascending: false }) : q.gte("date_start", today).order("date_start");
    return q.limit(500);
  });

  // 月ごとにまとめる
  const groups = new Map<string, EventRow[]>();
  for (const e of events) {
    const key = `${e.date_start.slice(0, 4)}年${Number(e.date_start.slice(5, 7))}月`;
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  return (
    <>
      <PageHead
        kicker="SCHEDULE"
        title="大会予定一覧"
        lead="全国のドッジボール大会・交流会の予定です。各都道府県協会の発表や、閲覧者のみなさんからの投稿で作られています。"
        action={<Link href="/events/new" className="btn btn-primary">＋ 大会予定を投稿する</Link>}
      />
      <div className="wrap section">
        {sp.deleted && <p className="banner-ok">投稿を削除しました。</p>}
        {!isConfigured() && <NotConnected />}
        <form className="filters" method="get">
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
          <label>
            時期
            <select name="past" defaultValue={past ? "1" : ""}>
              <option value="">これから</option>
              <option value="1">終了した大会</option>
            </select>
          </label>
          <button className="btn btn-outline btn-sm" type="submit">絞り込む</button>
        </form>

        {events.length === 0 && <p className="empty">条件に合う大会がありません。</p>}
        {[...groups.entries()].map(([month, list]) => (
          <section key={month} style={{ marginBottom: 24 }}>
            <h2>{month}</h2>
            <ul className="list">{list.map((e) => <EventItem key={e.id} e={e} />)}</ul>
          </section>
        ))}
        <p className="small muted">※掲載内容は投稿者・各協会の情報をもとにしています。日程や参加条件は必ず主催者の発表をご確認ください。「確認済み」は運営が主催者の発表と照合した大会です。都道府県を選んだ場合は、ブロックより都道府県が優先されます。</p>
      </div>
    </>
  );
}
