import Link from "next/link";
import type { EventRow } from "@/lib/types";
import { EVENT_CATEGORIES, splitCategories } from "@/lib/prefectures";
import CategoryTags, { CATEGORY_TONE } from "@/components/CategoryTags";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
const pad = (n: number) => String(n).padStart(2, "0");
const ym = (y: number, m: number) => `${y}-${pad(m)}`;

// 月のカレンダー（PC：日付マスに全大会／スマホ：件数の丸）＋日ごとの一覧
export default function EventCalendar({ y, m, today, events }: { y: number; m: number; today: string; events: Pick<EventRow, "id" | "title" | "prefecture" | "venue" | "category" | "date_start">[] }) {
  const byDay = new Map<number, typeof events>();
  for (const e of events) {
    const d = Number(e.date_start.slice(8, 10));
    byDay.set(d, [...(byDay.get(d) ?? []), e]);
  }
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <>
        <div className="cal" role="table" aria-label={`${y}年${m}月の大会予定`}>
          {WEEK.map((w, i) => <div key={w} className={`cal-dow${i === 0 ? " sun" : i === 6 ? " sat" : ""}`} role="columnheader">{w}</div>)}
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} className="cal-cell empty" />;
            const list = byDay.get(d) ?? [];
            const iso = `${ym(y, m)}-${pad(d)}`;
            const dow = i % 7;
            return (
              <div key={iso} className={`cal-cell${dow === 0 || dow === 6 ? " wkend" : ""}${iso === today ? " today" : ""}${iso < today ? " past" : ""}${list.length ? " has" : ""}`} role="cell">
                <div className="cal-cell-head">
                  <span className={`cal-day${dow === 0 ? " sun" : dow === 6 ? " sat" : ""}`}>{d}</span>
                  {list.length > 1 && <span className="cal-n">{list.length}件</span>}
                </div>
                {list.length > 0 && <a href={`#d${d}`} className="cal-count" aria-label={`${d}日の大会 ${list.length}件`}>{list.length}</a>}
                <div className="cal-items">
                  {list.map((e) => {
                    const c = splitCategories(e.category)[0];
                    return (
                      <Link key={e.id} href={`/events/${e.id}`} className={`cal-ev ${c ? `ev-${CATEGORY_TONE[c]}` : ""}`} title={`${e.title}（${e.prefecture}${e.venue ? `・${e.venue}` : ""}）`}>
                        <span className="cal-ev-pref">{e.prefecture.replace(/(都|府|県)$/, "")}</span>
                        <span className="cal-ev-title">{e.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="cal-legend">
          <span className="muted small">色の見かた：</span>
          {EVENT_CATEGORIES.map((c) => <span key={c} className={`legend-item ev-${CATEGORY_TONE[c]}`}>{c}</span>)}
          <span className="legend-item">区分なし</span>
        </div>

        <h2 style={{ marginTop: 28 }}>{m}月の大会一覧</h2>
        {events.length === 0 && <p className="empty">この月の大会予定はまだありません。</p>}
        <div className="agenda">
          {[...byDay.entries()].map(([d, list]) => {
            const iso = `${ym(y, m)}-${pad(d)}`;
            const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
            return (
              <section key={d} id={`d${d}`} className={`agenda-day${iso < today ? " past" : ""}${iso === today ? " today" : ""}`}>
                <div className={`agenda-date${dow === 0 ? " sun" : dow === 6 ? " sat" : ""}`}>
                  <b>{d}</b><span>{WEEK[dow]}</span>
                </div>
                <ul className="agenda-list">
                  {list.map((e) => (
                    <li key={e.id}>
                      <Link href={`/events/${e.id}`} className="agenda-ev">
                        <span className="agenda-title">{e.title}</span>
                        <span className="agenda-meta">
                          <span className="tag tag-pref">{e.prefecture}</span>
                          <CategoryTags value={e.category} />
                          {e.venue && <span className="muted">{e.venue}</span>}
                          {iso < today && <span className="muted">終了</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
    </>
  );
}
