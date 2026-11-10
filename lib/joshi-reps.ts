// 第13回 全日本女子総合 代表チーム一覧（初期データ）
// 代表チーム名は管理者ページ「女子総合」タブから上書きできる（portal_settings の joshi_reps）
// 出典：日本ドッジボール協会 大会要項・前回（第12回）出場チーム、各都道府県協会の大会予定

export type RepRow = {
  id: string;
  div: "D-1G" | "S-1G";
  area: string; // 都道府県名 またはブロック名
  block: string; // 表示用のブロック
  slots: number; // 枠数の目安（前回実績・要項から）
  qual?: string; // 代表を決める大会
  qualPref?: string; // 大会の開催都道府県（大会ページへのリンク用）
  date?: string; // 代表決定戦の日付
  teams?: string; // 決まった代表チーム（「、」区切り）
  note?: string; // 決定時期などの補足
};

export const PREF_NOTE = "県協会の推薦で決定（時期は未発表）";

// D-1G：都道府県協会の推薦で32チーム（＋日本協会推薦）
export const D1G_ROWS: RepRow[] = [
  { id: "d-hokkaido", div: "D-1G", area: "北海道", block: "北海道", slots: 1 },
  { id: "d-miyagi", div: "D-1G", area: "宮城県", block: "東北", slots: 1, qual: "第13回 全日本女子総合 宮城県大会", qualPref: "宮城県", date: "2026-10-24" },
  { id: "d-fukushima", div: "D-1G", area: "福島県", block: "東北", slots: 1 },
  { id: "d-ibaraki", div: "D-1G", area: "茨城県", block: "関東", slots: 1 },
  { id: "d-tochigi", div: "D-1G", area: "栃木県", block: "関東", slots: 1 },
  { id: "d-saitama", div: "D-1G", area: "埼玉県", block: "関東", slots: 1 },
  { id: "d-chiba", div: "D-1G", area: "千葉県", block: "関東", slots: 1 },
  { id: "d-tokyo", div: "D-1G", area: "東京都", block: "関東", slots: 1, qual: "第29回 ガールズカップ IN TOKYO（D-1G 東京代表決定戦）", qualPref: "東京都", date: "2026-11-03" },
  { id: "d-kanagawa", div: "D-1G", area: "神奈川県", block: "関東", slots: 2, qual: "第32回 神奈川県ドッジボール選手権大会", qualPref: "神奈川県", date: "2026-10-04" },
  { id: "d-niigata", div: "D-1G", area: "新潟県", block: "北信越", slots: 1, qual: "第13回 全日本女子総合 新潟県大会", qualPref: "新潟県", date: "2026-10-18" },
  { id: "d-toyama", div: "D-1G", area: "富山県", block: "北信越", slots: 1 },
  { id: "d-ishikawa", div: "D-1G", area: "石川県", block: "北信越", slots: 1 },
  { id: "d-fukui", div: "D-1G", area: "福井県", block: "北信越", slots: 1, qual: "第13回 全日本女子総合 福井県大会", qualPref: "福井県", date: "2026-10-31" },
  { id: "d-nagano", div: "D-1G", area: "長野県", block: "北信越", slots: 1 },
  { id: "d-gifu", div: "D-1G", area: "岐阜県", block: "東海", slots: 1 },
  { id: "d-shizuoka", div: "D-1G", area: "静岡県", block: "東海", slots: 1, qual: "第13回 全日本女子総合 静岡県予選会", qualPref: "静岡県", date: "2026-09-26" },
  { id: "d-aichi", div: "D-1G", area: "愛知県", block: "東海", slots: 2, qual: "第13回 全日本女子総合 愛知県予選", qualPref: "愛知県", date: "2026-10-25" },
  { id: "d-mie", div: "D-1G", area: "三重県", block: "東海", slots: 1, qual: "第13回 全日本女子総合 三重県大会", qualPref: "三重県", date: "2026-10-31", teams: "心華" },
  { id: "d-shiga", div: "D-1G", area: "滋賀県", block: "関西", slots: 1, note: "開催県" },
  { id: "d-kyoto", div: "D-1G", area: "京都府", block: "関西", slots: 1, qual: "あやべオープン大会／京都府予選会", qualPref: "京都府", date: "2026-11-08" },
  { id: "d-osaka", div: "D-1G", area: "大阪府", block: "関西", slots: 1 },
  { id: "d-hyogo", div: "D-1G", area: "兵庫県", block: "関西", slots: 1, qual: "第25回フレンドリー大会 兼 兵庫県大会", qualPref: "兵庫県", date: "2026-09-13" },
  { id: "d-nara", div: "D-1G", area: "奈良県", block: "関西", slots: 1 },
  { id: "d-wakayama", div: "D-1G", area: "和歌山県", block: "関西", slots: 1 },
  { id: "d-tottori", div: "D-1G", area: "鳥取県", block: "中国", slots: 1 },
  { id: "d-shimane", div: "D-1G", area: "島根県", block: "中国", slots: 1 },
  { id: "d-okayama", div: "D-1G", area: "岡山県", block: "中国", slots: 1 },
  { id: "d-hiroshima", div: "D-1G", area: "広島県", block: "中国", slots: 1 },
  { id: "d-yamaguchi", div: "D-1G", area: "山口県", block: "中国", slots: 1 },
  { id: "d-shikoku", div: "D-1G", area: "四国各県", block: "四国", slots: 1 },
  { id: "d-fukuoka", div: "D-1G", area: "福岡県", block: "九州・沖縄", slots: 1, qual: "福岡県女子小学生ドッジボール選手権", qualPref: "福岡県", date: "2026-09-20" },
  { id: "d-nagasaki", div: "D-1G", area: "長崎県", block: "九州・沖縄", slots: 1 },
  { id: "d-kagoshima", div: "D-1G", area: "鹿児島県", block: "九州・沖縄", slots: 1 },
  { id: "d-kyushu-other", div: "D-1G", area: "九州・沖縄のほかの県", block: "九州・沖縄", slots: 1 },
  { id: "d-jdba", div: "D-1G", area: "日本協会推薦", block: "全国", slots: 1, note: "日本協会が決定（時期は未発表）" },
];

// S-1G：各ブロックのシニアチャンピオンシップ女子の部から2チーム＋開催ブロック1＋参加数の多い予選から追加（計20）
export const S1G_ROWS: RepRow[] = [
  { id: "s-hokkaido", div: "S-1G", area: "北海道", block: "北海道", slots: 0, note: "前回は出場なし・予選情報なし" },
  { id: "s-tohoku", div: "S-1G", area: "東北ブロック", block: "東北", slots: 2, note: "予選の日程は未発表" },
  { id: "s-kanto", div: "S-1G", area: "関東ブロック", block: "関東", slots: 2, qual: "2026シニアチャンピオンシップ in 関東", qualPref: "神奈川県", date: "2026-08-30" },
  { id: "s-hokushinetsu", div: "S-1G", area: "北信越ブロック", block: "北信越", slots: 2, qual: "2026シニアチャンピオンシップ in 北信越（女子総合 北信越予選）", qualPref: "長野県", date: "2026-11-03" },
  { id: "s-tokai", div: "S-1G", area: "東海ブロック", block: "東海", slots: 2, qual: "2026シニアチャンピオンシップ in 東海（S-1Gの部）", qualPref: "愛知県", date: "2026-10-25" },
  { id: "s-kansai", div: "S-1G", area: "関西ブロック（開催ブロック枠＋1）", block: "関西", slots: 3, qual: "全日本女子総合選手権 関西ブロック予選", qualPref: "奈良県", date: "2026-10-17" },
  { id: "s-chugoku", div: "S-1G", area: "中国ブロック", block: "中国", slots: 2, qual: "シニアチャンピオンシップ in 中国（S-1G）", qualPref: "広島県", date: "2026-11-01" },
  { id: "s-shikoku", div: "S-1G", area: "四国ブロック", block: "四国", slots: 2, note: "予選の日程は未発表" },
  { id: "s-kyushu", div: "S-1G", area: "九州ブロック", block: "九州・沖縄", slots: 2, qual: "シニアチャンピオンシップ in 九州（S-1G）", qualPref: "福岡県", date: "2026-09-20" },
  { id: "s-extra", div: "S-1G", area: "追加枠（参加数の多い予選から）", block: "全国", slots: 3, note: "日本協会が決定（時期は未発表）" },
];

export const ALL_REP_ROWS = [...D1G_ROWS, ...S1G_ROWS];

export type RepOverride = Record<string, { teams?: string; note?: string }>;

export function parseOverrides(raw: string | null): RepOverride {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as RepOverride) : {};
  } catch {
    return {};
  }
}

export function mergeRows(rows: RepRow[], ov: RepOverride): RepRow[] {
  return rows.map((r) => {
    const o = ov[r.id];
    if (!o) return r;
    return { ...r, teams: o.teams !== undefined ? o.teams : r.teams, note: o.note ? o.note : r.note };
  });
}

// 状態の表示（決定／○月○日に決定予定／結果確認中／未発表）
export function repStatus(r: RepRow, today: string): { label: string; tone: "done" | "soon" | "check" | "tbd" } {
  if (r.teams && r.teams.trim()) return { label: "決定", tone: "done" };
  if (r.date) {
    const md = `${+r.date.slice(5, 7)}/${+r.date.slice(8, 10)}`;
    if (r.date >= today) return { label: `${md} 決定予定`, tone: "soon" };
    return { label: `${md} 大会終了・結果確認中`, tone: "check" };
  }
  return { label: r.note || PREF_NOTE, tone: "tbd" };
}
