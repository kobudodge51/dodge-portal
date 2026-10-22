import Link from "next/link";
import type { EventRow, TeamRow, ThreadRow, ColumnRow } from "@/lib/types";
import { fmtDateShort, fmtDateTime, todayJST, excerpt } from "@/lib/format";

export function EventItem({ e }: { e: EventRow }) {
  const d = fmtDateShort(e.date_start);
  const past = (e.date_end || e.date_start) < todayJST();
  return (
    <li>
      <Link href={`/events/${e.id}`} className="event-row">
        <div className={past ? "date-chip past" : "date-chip"}>
          <b>{d.md}</b>
          <span>{d.w}曜</span>
        </div>
        <div>
          <p className="row-title">{e.title}</p>
          <div className="row-meta">
            <span className="tag tag-pref">{e.prefecture}</span>
            {e.category && <span className="tag">{e.category}</span>}
            {e.is_verified && <span className="tag tag-ok">確認済み</span>}
            {e.venue && <span>📍{e.venue}</span>}
          </div>
        </div>
      </Link>
    </li>
  );
}

export function TeamItem({ t }: { t: TeamRow }) {
  return (
    <Link href={`/teams/${t.id}`} className="card team-card">
      <h3>{t.team_name}</h3>
      <div className="row-meta">
        <span className="tag tag-pref">{t.prefecture}</span>
        {t.city && <span>{t.city}</span>}
        {t.category && <span className="tag">{t.category}</span>}
        {t.is_verified && <span className="tag tag-ok">確認済み</span>}
      </div>
      {t.description && <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>{excerpt(t.description, 60)}</p>}
    </Link>
  );
}

export function ThreadItem({ t }: { t: ThreadRow }) {
  return (
    <li>
      <Link href={`/board/${t.id}`} className="thread-row">
        <p className="row-title">{t.title}</p>
        <div className="row-meta">
          <span className="tag">{t.category}</span>
          {t.prefecture && <span className="tag tag-pref">{t.prefecture}</span>}
          <span>💬 {t.reply_count}</span>
          <span>{fmtDateTime(t.last_activity_at)}</span>
        </div>
      </Link>
    </li>
  );
}

export function ColumnItem({ c }: { c: ColumnRow }) {
  return (
    <Link href={`/columns/${c.id}`} className="card">
      <p className="small muted" style={{ margin: 0 }}>{c.published_at ? fmtDateTime(c.published_at).split(" ")[0] : ""}　{c.author}</p>
      <h3 style={{ marginTop: 4 }}>{c.title}</h3>
      <p className="small muted" style={{ margin: 0 }}>{excerpt(c.body, 70)}</p>
    </Link>
  );
}
