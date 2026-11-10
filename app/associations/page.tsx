import Link from "next/link";
import type { Metadata } from "next";
import { BLOCKS, PREFECTURES } from "@/lib/prefectures";
import { ASSOCIATIONS, JDBA_URL, BLOCK_ASSOCIATIONS } from "@/lib/associations";
import { db, safeList } from "@/lib/supabase";
import { EVENT_COLS, type EventRow } from "@/lib/types";
import { todayJST, fmtDateShort } from "@/lib/format";
import { PageHead } from "@/components/Layout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ブロック・都道府県ドッジボール協会一覧" };

// ブロック単位の大会（大会名にブロック名が入っているもの）
const BLOCK_EVENT = (p: string) => new RegExp(p === "中国" ? "中国ブロック|in ?中国|中国大会" : p === "北海道" ? "北海道ブロック|全道|北海道大会|北海道選手権" : `${p}`);

export default async function AssociationsPage() {
  const today = todayJST();
  const events = await safeList<EventRow>(() =>
    db().from("portal_events").select(EVENT_COLS).eq("is_hidden", false).gte("date_start", "2026-04-01")
      .or(BLOCK_ASSOCIATIONS.map((b) => `title.ilike.%${b.pattern}%`).join(","))
      .order("date_start").limit(300)
  );
  return (
    <>
      <PageHead
        kicker="ASSOCIATIONS"
        title="ブロック・都道府県ドッジボール協会"
        lead="全国9ブロックと47都道府県のドッジボール協会のリンク集です。大会の正式な情報は各協会の発表をご確認ください。"
      />
      <div className="wrap section">
        <p>
          全国組織：<a href={JDBA_URL} target="_blank" rel="noopener noreferrer">一般財団法人 日本ドッジボール協会</a>
        </p>
        <h2 className="disp-head" style={{ fontSize: "1.1rem", marginTop: 18 }}><span>BLOCKS</span>ブロック（地域連盟・連絡会）</h2>
        <p className="small muted" style={{ marginTop: 0 }}>北海道から九州・沖縄まで9つのブロックの窓口と、ブロック単位の大会（ブロック選手権・シニアチャンピオンシップなど）です。ブロックの窓口ページがあるのは、北海道（北海道協会）・東海（愛知県協会HP内）・九州（Facebook）です。ほかのブロックは各県の協会が案内しています。</p>
        <div className="blocks" style={{ marginBottom: 22 }}>
          {BLOCK_ASSOCIATIONS.map((b) => {
            const re = BLOCK_EVENT(b.pattern);
            const list = events.filter((e) => re.test(e.title));
            const up = list.filter((e) => e.date_start >= today).slice(0, 5);
            const past = list.filter((e) => e.date_start < today).slice(-3).reverse();
            return (
              <div className="block" key={b.block}>
                <h3>{b.block}</h3>
                <div className="blk-body">
                  <p className="blk-name"><b>{b.name}</b>{b.url ? <a href={b.url} target="_blank" rel="noopener noreferrer" className="small">{b.urlLabel} ↗</a> : <span className="small muted">専用HPなし</span>}</p>
                  <p className="small muted" style={{ margin: "2px 0 6px" }}>{b.note}</p>
                  {up.length > 0 && <p className="blk-sub">これからの大会</p>}
                  {up.map((e) => { const d = fmtDateShort(e.date_start); return <Link key={e.id} href={`/events/${e.id}`} className="blk-ev"><span>{d.md}（{d.w}）</span>{e.title}</Link>; })}
                  {past.length > 0 && <p className="blk-sub">終わった大会（結果は大会ページのリンク先へ）</p>}
                  {past.map((e) => { const d = fmtDateShort(e.date_start); return <Link key={e.id} href={`/events/${e.id}`} className="blk-ev done"><span>{d.md}（{d.w}）</span>{e.title}</Link>; })}
                  {!list.length && <p className="small muted" style={{ margin: 0 }}>ブロック大会の予定はまだ見つかっていません。</p>}
                </div>
              </div>
            );
          })}
        </div>
        <h2 className="disp-head" style={{ fontSize: "1.1rem" }}><span>PREFECTURES</span>都道府県協会</h2>
        <div className="blocks">
          {BLOCKS.map((b) => (
            <div className="block" key={b}>
              <h3>{b}</h3>
              <ul>
                {PREFECTURES.filter((p) => p.block === b).map((p) => {
                  const url = ASSOCIATIONS[p.name];
                  return (
                    <li key={p.code}>
                      <Link href={`/pref/${p.code}`}>{p.name}</Link>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="small">協会HP ↗</a>
                      ) : (
                        <span className="small muted">HP情報なし</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 16 }}>
          リンク先が変わっている・新しいホームページができた場合は、<Link href="/contact">お問い合わせ</Link>からお知らせください。
        </p>
      </div>
    </>
  );
}
