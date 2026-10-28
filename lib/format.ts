const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

export function todayJST() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${y}年${m}月${d}日（${WEEK[w]}）`;
}

export function fmtDateShort(iso: string) {
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  const [y] = iso.split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { md: `${m}/${d}`, w: WEEK[w] };
}

export function fmtDateTime(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  const s = d.toISOString();
  return `${s.slice(0, 4)}/${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))} ${s.slice(11, 16)}`;
}

export function excerpt(text: string, n = 80) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

// 「3分前」「2時間前」「昨日」などの短い表記
export function fmtAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  if (d === 1) return "昨日";
  if (d < 30) return `${d}日前`;
  return fmtDateTime(iso).split(" ")[0];
}
