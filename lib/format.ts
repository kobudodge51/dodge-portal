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
