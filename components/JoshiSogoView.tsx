import Link from "next/link";
import type { EventRow } from "@/lib/types";
import { fmtDateShort } from "@/lib/format";
import { PREFECTURES } from "@/lib/prefectures";
import { JOSHI_SOGO as J } from "@/lib/specials";


// 予選会らしい大会を見分ける
const QUAL = /女子総合|ガールズカップ|S-1G|Ｓ-1Ｇ|S1G|女子小学生/;
const BLOCK = /ブロック|シニアチャンピオンシップ/;

const blockOf = (pref: string) => PREFECTURES.find((p) => p.name === pref)?.block ?? "";

function daysLeft(today: string, target: string) {
  const a = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  const b = Date.UTC(+target.slice(0, 4), +target.slice(5, 7) - 1, +target.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

function Qual({ e, today }: { e: EventRow; today: string }) {
  const d = fmtDateShort(e.date_start);
  const done = e.date_start < today;
  return (
    <li>
      <Link href={`/events/${e.id}`} className={`jq-item${done ? " done" : ""}`}>
        <span className="jq-date"><b>{d.md}</b><small>{d.w}</small></span>
        <span className="jq-main">
          <span className="jq-title">{e.title}</span>
          <span className="jq-meta">{e.prefecture}{e.venue ? `・${e.venue}` : ""}</span>
        </span>
        <span className={`jq-state${done ? "" : " up"}`}>{done ? "終了" : e.date_start === today ? "本日" : "これから"}</span>
      </Link>
    </li>
  );
}

export default function JoshiView({ events, today }: { events: EventRow[]; today: string }) {
  const left = daysLeft(today, J.date);
  const quals = events.filter((e) => QUAL.test(e.title));
  const blockQuals = quals.filter((e) => BLOCK.test(e.title));
  const prefQuals = quals.filter((e) => !BLOCK.test(e.title));
  const others = events.filter((e) => !QUAL.test(e.title) && e.date_start >= today).slice(0, 8);
  const doneCount = quals.filter((e) => e.date_start < today).length;
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(J.venue + " " + J.address.replace(/〒\S+\s/, ""))}`;

  return (
    <div className="joshi">
      <section className="jh">
        <div className="jh-glow" aria-hidden="true" />
        <div className="wrap jh-inner">
          <p className="jh-kicker">SPECIAL<span>特設ページ</span></p>
          <h1 className="jh-title">
            <small>{J.edition}</small>
            全日本<b>女子</b>総合<br />ドッジボール選手権
          </h1>
          <div className="jh-facts">
            <div><span>DATE</span><b>2026.12.13</b><em>SUN</em></div>
            <div><span>VENUE</span><b className="jh-venue">{J.venue}</b><em>滋賀県大津市</em></div>
            <div className="jh-count">
              <span>大会まで</span>
              {left > 0 ? <b>{left}<small>日</small></b> : left === 0 ? <b>本日</b> : <b className="small">終了</b>}
            </div>
          </div>
          <div className="jh-cats">
            <span className="jh-cat d1g"><b>D-1G</b>小学生女子</span>
            <span className="jh-cat s1g"><b>S-1G</b>中学生以上女子</span>
          </div>
        </div>
      </section>

      <div className="wrap section">
        <div className="j-grid">
          <section className="j-card">
            <h2 className="j-h">大会概要</h2>
            <dl className="j-dl">
              <dt>大会名</dt><dd>{J.edition}{J.name}</dd>
              <dt>開催日</dt><dd>{J.dateLabel}</dd>
              <dt>会場</dt><dd>{J.venue}<br /><span className="muted small">{J.address}</span><br /><a href={map} target="_blank" rel="noopener noreferrer" className="small">地図を開く →</a></dd>
              <dt>部門</dt><dd>D-1G（小学生女子）／S-1G（中学生以上女子）</dd>
            </dl>
            <p className="small muted" style={{ marginBottom: 0 }}>試合方式・タイムスケジュールなどの詳細は、日本ドッジボール協会から発表され次第ここに追記します。</p>
          </section>
          <section className="j-card j-card-accent">
            <h2 className="j-h">代表への道</h2>
            <div className="j-stats">
              <div><b>{quals.length}</b><span>予選・代表決定戦</span></div>
              <div><b>{doneCount}</b><span>終了</span></div>
              <div><b>{quals.length - doneCount}</b><span>これから</span></div>
            </div>
            <p className="small" style={{ margin: "10px 0 0" }}>全国の協会の大会予定から、県代表・ブロック代表を決める大会を集めました。日程は必ず各協会の発表をご確認ください。</p>
            <div className="j-links">
              <a href={J.official} target="_blank" rel="noopener noreferrer" className="btn btn-joshi btn-sm">日本協会の大会ページ</a>
              <a href={J.visitors} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">来場時のお願い</a>
            </div>
          </section>
        </div>

        <section className="j-section">
          <h2 className="j-h j-h-lg">ブロック予選<span>ブロック単位の代表決定戦（S-1Gなど）</span></h2>
          {blockQuals.length ? <ul className="jq-list">{blockQuals.map((e) => <Qual key={e.id} e={e} today={today} />)}</ul> : <p className="empty">掲載できるブロック予選はまだありません。</p>}
        </section>

        <section className="j-section">
          <h2 className="j-h j-h-lg">都道府県予選<span>県代表の決定戦</span></h2>
          {prefQuals.length ? (
            <div className="jq-blocks">
              {[...new Set(prefQuals.map((e) => blockOf(e.prefecture)))].map((b) => (
                <div key={b} className="jq-block">
                  <h3>{b}</h3>
                  <ul className="jq-list">{prefQuals.filter((e) => blockOf(e.prefecture) === b).map((e) => <Qual key={e.id} e={e} today={today} />)}</ul>
                </div>
              ))}
            </div>
          ) : <p className="empty">掲載できる都道府県予選はまだありません。</p>}
          <p className="small muted">※集めた大会予定の中から、大会名に「女子総合」「ガールズカップ」「S-1G」などが入っている大会を予選として表示しています。載っていない予選をご存じの方は<Link href="/events/new">大会予定の投稿</Link>（大会区分「ガールズ」を選択）か<Link href="/contact">お問い合わせ</Link>からお知らせください。</p>
        </section>

        {others.length > 0 && (
          <section className="j-section">
            <h2 className="j-h j-h-lg">これからの女子の大会<span>ガールズ区分のある大会</span></h2>
            <ul className="jq-list">{others.map((e) => <Qual key={e.id} e={e} today={today} />)}</ul>
            <p className="small"><Link href="/events?cat=%E3%82%AC%E3%83%BC%E3%83%AB%E3%82%BA">ガールズの大会をカレンダーで見る →</Link></p>
          </section>
        )}

        <p className="small muted">出典：<a href={J.official} target="_blank" rel="noopener noreferrer">日本ドッジボール協会「{J.edition}{J.name}」</a>（最終更新 {J.updated}）および各都道府県協会の大会予定。</p>
      </div>
    </div>
  );
}
