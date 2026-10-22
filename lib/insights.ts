// 管理者向けインサイト（約100項目）
// データベースから集めた記録を、数字と「読み解き」の一言にまとめる
import { db, safeList } from "./supabase";
import { PREFECTURES, BOARD_CATEGORIES, EVENT_CATEGORIES } from "./prefectures";
import { ASSOCIATIONS } from "./associations";
import { todayJST } from "./format";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export type Insight = { label: string; value: string; note: string; level: "good" | "warn" | "info" };
export type InsightGroup = { title: string; items: Insight[] };

const DAY = 86400000;
const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
const jst = (iso: string) => new Date(new Date(iso).getTime() + 9 * 3600000);
const hourOf = (iso: string) => jst(iso).getUTCHours();
const dowOf = (iso: string) => jst(iso).getUTCDay();
const dayOf = (iso: string) => jst(iso).toISOString().slice(0, 10);
const since = (rows: Row[], days: number, key = "created_at") => {
  const t = Date.now() - days * DAY;
  return rows.filter((r) => new Date(r[key]).getTime() >= t);
};
const between = (rows: Row[], fromDays: number, toDays: number) => {
  const a = Date.now() - fromDays * DAY;
  const b = Date.now() - toDays * DAY;
  return rows.filter((r) => {
    const x = new Date(r.created_at).getTime();
    return x >= a && x < b;
  });
};
const n = (v: number) => v.toLocaleString("ja-JP");
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const ratio = (a: number, b: number) => (b ? a / b : 0);
function countBy<T>(rows: T[], f: (r: T) => string | null | undefined) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = f(r);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
function change(cur: number, prev: number) {
  if (!prev && !cur) return { text: "±0", level: "info" as const };
  if (!prev) return { text: "新規", level: "good" as const };
  const d = Math.round(((cur - prev) / prev) * 100);
  return { text: `${d >= 0 ? "+" : ""}${d}%`, level: d >= 10 ? ("good" as const) : d <= -20 ? ("warn" as const) : ("info" as const) };
}
const uniqueDaily = (rows: Row[]) => new Set(rows.map((r) => `${dayOf(r.created_at)}|${r.visitor}`)).size;

function pageLabel(path: string) {
  if (path === "/") return "トップ";
  if (path.startsWith("/board/new")) return "スレッド作成";
  if (path.startsWith("/board/")) return "スレッド詳細";
  if (path === "/board") return "交流掲示板";
  if (path.startsWith("/events/new")) return "大会投稿";
  if (path.startsWith("/events/")) return "大会詳細";
  if (path === "/events") return "大会予定一覧";
  if (path.startsWith("/columns/submit")) return "コラム寄稿";
  if (path.startsWith("/columns/")) return "コラム記事";
  if (path === "/columns") return "コラム一覧";
  if (path.startsWith("/teams")) return "登録チーム";
  if (path.startsWith("/pref/")) return `都道府県（${PREFECTURES.find((p) => p.code === path.split("/")[2])?.name ?? "?"}）`;
  if (path === "/associations") return "都道府県協会";
  if (["/terms", "/privacy", "/guidelines", "/contact"].includes(path)) return "規約・お問い合わせ";
  return path;
}

export async function loadInsightData() {
  const ago90 = new Date(Date.now() - 90 * DAY).toISOString();
  const [pv, events, threads, replies, reports, columns, contacts, teams, logs, blocks] = await Promise.all([
    safeList<Row>(() => db().from("portal_pageviews").select("path,ref,device,visitor,created_at").gte("created_at", ago90).order("created_at", { ascending: false }).limit(100000)),
    safeList<Row>(() => db().from("portal_events").select("id,title,prefecture,date_start,date_end,category,url,is_hidden,is_verified,report_count,ip_hash,created_at").limit(20000)),
    safeList<Row>(() => db().from("portal_threads").select("id,title,category,prefecture,body,poster_name,delete_key_hash,ip_hash,is_hidden,report_count,reply_count,created_at").limit(20000)),
    safeList<Row>(() => db().from("portal_replies").select("id,thread_id,body,poster_name,delete_key_hash,ip_hash,is_hidden,report_count,created_at").limit(50000)),
    safeList<Row>(() => db().from("portal_reports").select("target_type,reason,is_resolved,ip_hash,created_at").limit(20000)),
    safeList<Row>(() => db().from("portal_columns").select("id,title,is_published,is_submission,published_at,created_at").limit(5000)),
    safeList<Row>(() => db().from("portal_contacts").select("subject,is_resolved,created_at").limit(5000)),
    safeList<Row>(() => db().from("portal_teams").select("prefecture,category,is_hidden,created_at").limit(10000)),
    safeList<Row>(() => db().from("portal_post_logs").select("ip_hash,kind,created_at").gte("created_at", ago90).limit(100000)),
    safeList<Row>(() => db().from("portal_blocks").select("ip_hash,created_at").limit(5000)),
  ]);
  return { pv, events, threads, replies, reports, columns, contacts, teams, logs, blocks };
}

export function buildInsights(d: Awaited<ReturnType<typeof loadInsightData>>): InsightGroup[] {
  const groups: InsightGroup[] = [];
  let cur: Insight[] = [];
  const start = (title: string) => {
    cur = [];
    groups.push({ title, items: cur });
  };
  const add = (label: string, value: string, note: string, level: Insight["level"] = "info") => cur.push({ label, value, note, level });
  const today = todayJST();

  // ─────────── アクセス ───────────
  start("アクセス");
  const pv = d.pv;
  const pvToday = pv.filter((r) => dayOf(r.created_at) === today);
  const yesterday = new Date(Date.now() + 9 * 3600000 - DAY).toISOString().slice(0, 10);
  const pvYest = pv.filter((r) => dayOf(r.created_at) === yesterday);
  const pv7 = since(pv, 7), pvPrev7 = between(pv, 14, 7), pv30 = since(pv, 30);
  add("今日の閲覧数", n(pvToday.length), pvToday.length ? "今日もサイトが見られています。" : "今日はまだ閲覧がありません。SNSやLINEでの告知が効果的です。", pvToday.length ? "good" : "warn");
  add("昨日の閲覧数", n(pvYest.length), `今日と比べて ${change(pvToday.length, pvYest.length).text}（今日はまだ途中です）。`);
  const c7 = change(pv7.length, pvPrev7.length);
  add("直近7日の閲覧数", n(pv7.length), `前の7日間と比べて ${c7.text}。`, c7.level);
  add("直近30日の閲覧数", n(pv30.length), `1日あたり平均 ${n(Math.round(pv30.length / 30))} 回見られています。`);
  add("直近90日の閲覧数", n(pv.length), "記録の保存期間（90日）全体の閲覧数です。");
  const uvToday = new Set(pvToday.map((r) => r.visitor)).size;
  add("今日の訪問者数", n(uvToday), "同じ人が何度見ても1人と数えます（日付が変わると別カウント）。");
  const uv7 = uniqueDaily(pv7), uvPrev7 = uniqueDaily(pvPrev7);
  const cu7 = change(uv7, uvPrev7);
  add("直近7日の訪問者数（延べ）", n(uv7), `前の7日間と比べて ${cu7.text}。`, cu7.level);
  const uv30 = uniqueDaily(pv30);
  add("直近30日の訪問者数（延べ）", n(uv30), `1日あたり平均 ${n(Math.round(uv30 / 30))} 人が訪れています。`);
  const ppv = ratio(pv30.length, uv30);
  add("1人あたりの閲覧ページ数", ppv ? ppv.toFixed(1) : "—", ppv >= 3 ? "複数のページを回遊してもらえています。" : ppv ? "1〜2ページで帰る人が多めです。関連ページへのリンクを増やすと回遊が増えます。" : "データがまだありません。", ppv >= 3 ? "good" : "info");
  const byDevice = countBy(pv30, (r) => r.device);
  const dev = (k: string) => byDevice.find((x) => x[0] === k)?.[1] ?? 0;
  add("スマホからの閲覧", pct(dev("スマホ"), pv30.length), dev("スマホ") > pv30.length / 2 ? "スマホ中心の利用です。スマホでの見やすさを最優先にしましょう。" : "PCからの閲覧も多めです。");
  add("PCからの閲覧", pct(dev("PC"), pv30.length), "指導者・運営者は事務作業のついでにPCで見る傾向があります。");
  add("タブレットからの閲覧", pct(dev("タブレット"), pv30.length), "少数でも、表示崩れがないか時々確認しましょう。");
  const byPage = countBy(pv30, (r) => pageLabel(r.path));
  ["1位", "2位", "3位", "4位", "5位"].forEach((rank, i) => {
    const x = byPage[i];
    add(`よく見られるページ ${rank}`, x ? x[0] : "—", x ? `${n(x[1])} 回（全体の ${pct(x[1], pv30.length)}）` : "データがまだありません。");
  });
  const byRef = countBy(pv30.filter((r) => r.ref), (r) => r.ref);
  ["1位", "2位", "3位"].forEach((rank, i) => {
    const x = byRef[i];
    add(`流入元 ${rank}`, x ? x[0] : "—", x ? `${n(x[1])} 回。ここからの紹介が効いています。` : "外部サイトからの流入はまだありません。");
  });
  const direct = pv30.filter((r) => !r.ref).length;
  add("直接アクセス・LINE等からの割合", pct(direct, pv30.length), "LINEのトークやブックマークから来た人は、流入元が記録されずここに入ります。");
  const byHour = Array.from({ length: 24 }, (_, h) => pv30.filter((r) => hourOf(r.created_at) === h).length);
  const maxH = byHour.indexOf(Math.max(...byHour)), minH = byHour.indexOf(Math.min(...byHour));
  add("最も見られる時間帯", pv30.length ? `${maxH}時台` : "—", pv30.length ? "お知らせやコラムの公開はこの時間の少し前が効果的です。" : "データがまだありません。");
  add("最も見られない時間帯", pv30.length ? `${minH}時台` : "—", "メンテナンスや大きな更新はこの時間帯がおすすめです。");
  const byDow = Array.from({ length: 7 }, (_, w) => pv30.filter((r) => dowOf(r.created_at) === w).length);
  const maxW = byDow.indexOf(Math.max(...byDow));
  add("最も見られる曜日", pv30.length ? `${WEEK[maxW]}曜日` : "—", "練習日・大会日の前後に見られる傾向があるかチェックしましょう。");
  const night = pv30.filter((r) => { const h = hourOf(r.created_at); return h >= 21 || h < 6; }).length;
  add("夜間（21〜6時）の閲覧割合", pct(night, pv30.length), "夜間の書き込みは荒れやすいので、通報の確認を朝の習慣にしましょう。");
  const share = (prefix: string) => pv30.filter((r) => r.path.startsWith(prefix)).length;
  add("掲示板ページの閲覧割合", pct(share("/board"), pv30.length), "交流の場としての関心の高さを示します。");
  add("大会予定ページの閲覧割合", pct(share("/events"), pv30.length), "大会情報への需要の高さを示します。");
  add("コラムの閲覧割合", pct(share("/columns"), pv30.length), "読みものへの関心度です。定期的な発行で伸ばせます。");
  add("都道府県ページの閲覧割合", pct(share("/pref"), pv30.length), "地元の情報を探しに来る人の割合です。");
  const byPref = countBy(pv30.filter((r) => r.path.startsWith("/pref/")), (r) => PREFECTURES.find((p) => p.code === r.path.split("/")[2])?.name);
  add("最も見られた都道府県", byPref[0]?.[0] ?? "—", byPref[0] ? `${n(byPref[0][1])} 回。この地域の大会情報を充実させると喜ばれます。` : "データがまだありません。");
  const topOf = (prefix: string, list: Row[], key: string) => {
    const c = countBy(pv30.filter((r) => r.path.startsWith(prefix) && r.path.length > prefix.length + 5), (r) => r.path.split("/")[2]);
    const hit = c[0] ? list.find((x) => x.id === c[0][0]) : null;
    return hit ? `${hit[key]}（${n(c[0][1])}回）` : "—";
  };
  add("最も見られたスレッド", topOf("/board/", d.threads, "title"), "関心の高い話題です。似たテーマのコラムを書くと読まれやすくなります。");
  add("最も見られた大会", topOf("/events/", d.events, "title"), "注目度の高い大会です。");
  add("最も見られたコラム", topOf("/columns/", d.columns, "title"), "反応の良い題材です。続編を検討しましょう。");
  const newViews = pv30.filter((r) => r.path === "/board/new" || r.path === "/events/new").length;
  const posts30 = since(d.threads, 30).length + since(d.events, 30).length;
  add("投稿画面から実際に投稿された割合", newViews ? pct(posts30, newViews) : "—", newViews && posts30 / newViews < 0.3 ? "投稿画面まで来ても投稿をやめる人が多めです。入力項目の多さを見直す余地があります。" : "投稿画面に来た人のうち、実際に投稿した割合です。");
  const byDay = countBy(pv30, (r) => dayOf(r.created_at));
  add("閲覧が最も多かった日", byDay[0] ? `${byDay[0][0].slice(5).replace("-", "/")}` : "—", byDay[0] ? `${n(byDay[0][1])} 回。この日に何があったか（告知・大会など）を振り返りましょう。` : "データがまだありません。");

  // ─────────── 交流掲示板 ───────────
  start("交流掲示板");
  const th = d.threads.filter((t) => t.title !== "health");
  const rp = d.replies;
  const th30 = since(th, 30), th7 = since(th, 7), rp30 = since(rp, 30);
  add("スレッドの総数", n(th.length), th.length ? "これまでに立てられたスレッドの数です。" : "まだスレッドがありません。運営から最初の話題を立てると、書き込みが始まりやすくなります。", th.length ? "info" : "warn");
  add("直近30日の新しいスレッド", n(th30.length), th30.length >= 10 ? "活発に話題が生まれています。" : "話題の数が少なめです。「みんな教えて！」の呼び水投稿が効果的です。", th30.length >= 10 ? "good" : "info");
  const cth = change(th7.length, between(th, 14, 7).length);
  add("直近7日の新しいスレッド", n(th7.length), `前の7日間と比べて ${cth.text}。`, cth.level);
  add("返信の総数", n(rp.length), "これまでに書き込まれた返信の数です。");
  const crp = change(since(rp, 7).length, between(rp, 14, 7).length);
  add("直近30日の返信", n(rp30.length), `直近7日は前週比 ${crp.text}。`, crp.level);
  const avgRep = ratio(rp.length, th.length);
  add("1スレッドあたりの平均返信数", th.length ? avgRep.toFixed(1) : "—", avgRep >= 3 ? "会話がよく続いています。" : "返信が少なめです。運営が積極的に返信すると活性化します。", avgRep >= 3 ? "good" : "info");
  const zero = th.filter((t) => !rp.some((r) => r.thread_id === t.id));
  add("返信がまだないスレッド", n(zero.length), zero.length ? "質問に答えが付かないと、投稿した人が離れてしまいます。優先して返信しましょう。" : "すべてのスレッドに返信が付いています。", zero.length ? "warn" : "good");
  add("返信ゼロの割合", pct(zero.length, th.length), "50%を超える場合は、話題選びや告知の見直しを検討しましょう。", ratio(zero.length, th.length) > 0.5 ? "warn" : "info");
  const repCount = countBy(rp, (r) => r.thread_id);
  const hot = repCount[0] ? th.find((t) => t.id === repCount[0][0]) : null;
  add("最も返信が多いスレッド", hot ? `${hot.title}（${repCount[0][1]}件）` : "—", "盛り上がった話題です。トップページで紹介するのも手です。");
  for (const cat of BOARD_CATEGORIES) {
    const k = th.filter((t) => t.category === cat).length;
    add(`カテゴリ「${cat}」`, `${n(k)} 件`, `全体の ${pct(k, th.length)}。`);
  }
  const catHot = countBy(th30, (t) => t.category)[0];
  add("直近30日で最も活発なカテゴリ", catHot ? catHot[0] : "—", catHot ? "今いちばん求められている話題の種類です。" : "データがまだありません。");
  add("都道府県を指定したスレッドの割合", pct(th.filter((t) => t.prefecture).length, th.length), "地域の話題がどれだけあるかの目安です。");
  const prefTh = countBy(th, (t) => t.prefecture)[0];
  add("スレッドが最も多い都道府県", prefTh ? `${prefTh[0]}（${prefTh[1]}件）` : "—", "交流が活発な地域です。");
  const firstReplyMins = th
    .map((t) => {
      const first = rp.filter((r) => r.thread_id === t.id).map((r) => new Date(r.created_at).getTime()).sort((a, b) => a - b)[0];
      return first ? (first - new Date(t.created_at).getTime()) / 60000 : null;
    })
    .filter((x): x is number => x !== null);
  const avgFirst = firstReplyMins.length ? firstReplyMins.reduce((a, b) => a + b, 0) / firstReplyMins.length : 0;
  add("最初の返信までの平均時間", firstReplyMins.length ? (avgFirst < 60 ? `${Math.round(avgFirst)}分` : `${(avgFirst / 60).toFixed(1)}時間`) : "—", avgFirst && avgFirst < 180 ? "返信が早く、質問しやすい雰囲気です。" : "返信まで時間がかかっています。");
  const allPosts = [...th, ...rp, ...d.events];
  const postHour = Array.from({ length: 24 }, (_, h) => allPosts.filter((r) => hourOf(r.created_at) === h).length);
  add("投稿が最も多い時間帯", allPosts.length ? `${postHour.indexOf(Math.max(...postHour))}時台` : "—", "この時間帯は通報も増えやすいので注意しましょう。");
  const postDow = Array.from({ length: 7 }, (_, w) => allPosts.filter((r) => dowOf(r.created_at) === w).length);
  add("投稿が最も多い曜日", allPosts.length ? `${WEEK[postDow.indexOf(Math.max(...postDow))]}曜日` : "—", "週ごとの活動リズムがわかります。");
  const avgLen = th.length + rp.length ? Math.round([...th, ...rp].reduce((a, r) => a + (r.body?.length ?? 0), 0) / (th.length + rp.length)) : 0;
  add("1投稿あたりの平均文字数", avgLen ? `${avgLen}文字` : "—", avgLen >= 80 ? "しっかり書き込まれています。" : "短い投稿が中心です。");
  add("「名無しさん」で投稿された割合", pct([...th, ...rp].filter((r) => r.poster_name === "名無しさん").length, th.length + rp.length), "ニックネームを付ける人が多いほど、会話が続きやすくなります。");
  add("削除キーを設定した投稿の割合", pct([...th, ...rp].filter((r) => r.delete_key_hash).length, th.length + rp.length), "低い場合、自分で消せず削除依頼が増える可能性があります。");
  const posters30 = new Set([...since(th, 30), ...rp30, ...since(d.events, 30)].map((r) => r.ip_hash).filter(Boolean));
  add("直近30日の投稿者数（端末）", n(posters30.size), "実際に書き込んでくれた端末の数です。");
  const perPoster = countBy([...since(th, 30), ...rp30, ...since(d.events, 30)], (r) => r.ip_hash);
  const repeat = perPoster.filter((x) => x[1] >= 2).length;
  add("2回以上投稿した端末", n(repeat), repeat ? "常連さんが育っています。" : "リピーターはまだいません。", repeat ? "good" : "info");
  add("1端末あたりの投稿数（30日）", posters30.size ? (perPoster.reduce((a, x) => a + x[1], 0) / posters30.size).toFixed(1) : "—", "特定の端末に偏りすぎていないかの目安です。");
  const top1 = perPoster[0]?.[1] ?? 0;
  const totalP = perPoster.reduce((a, x) => a + x[1], 0);
  add("最多投稿端末の占める割合", pct(top1, totalP), ratio(top1, totalP) > 0.5 && totalP >= 10 ? "1つの端末が投稿の半分以上を占めています。荒らしでないか確認しましょう。" : "投稿は複数の端末に分散しています。", ratio(top1, totalP) > 0.5 && totalP >= 10 ? "warn" : "info");

  // ─────────── 大会予定 ───────────
  start("大会予定");
  const ev = d.events;
  const upcoming = ev.filter((e) => e.date_start >= today && !e.is_hidden);
  const ym = today.slice(0, 7);
  const nextYm = (() => { const [y, m] = ym.split("-").map(Number); return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`; })();
  add("大会の総数", n(ev.length), "これまでに掲載された大会の数です。");
  add("これからの大会", n(upcoming.length), upcoming.length ? "開催予定の大会です。" : "開催予定の大会がありません。協会HPから拾って投稿すると呼び水になります。", upcoming.length ? "good" : "warn");
  add("今月の大会", n(ev.filter((e) => e.date_start.startsWith(ym)).length), "今月開催の大会数です。");
  add("来月の大会", n(ev.filter((e) => e.date_start.startsWith(nextYm)).length), "来月分が少なければ、各協会の発表を確認しましょう。");
  add("直近30日に投稿された大会", n(since(ev, 30).length), "大会情報の集まり具合です。");
  add("運営確認済みの割合", pct(ev.filter((e) => e.is_verified).length, ev.length), "確認済みが増えるほど、サイトの信頼性が上がります。");
  add("要項URL付きの割合", pct(ev.filter((e) => e.url).length, ev.length), "URLがある大会は、閲覧者が詳細を確かめやすくなります。");
  const evPref = countBy(ev, (e) => e.prefecture);
  add("大会が最も多い都道府県", evPref[0] ? `${evPref[0][0]}（${evPref[0][1]}件）` : "—", "情報が集まっている地域です。");
  const noEv = PREFECTURES.filter((p) => !ev.some((e) => e.prefecture === p.name)).length;
  add("大会情報がない都道府県", `${noEv} / 47`, noEv > 30 ? "多くの地域で情報が空白です。協会HPからの転記を進めましょう。" : "地域のカバー状況です。", noEv > 30 ? "warn" : "info");
  const evCat = countBy(ev, (e) => e.category);
  add("最も多い大会カテゴリ", evCat[0] ? `${evCat[0][0]}（${evCat[0][1]}件）` : "—", `カテゴリは全${EVENT_CATEGORIES.length}種類です。`);
  const evMonth = countBy(ev, (e) => `${Number(e.date_start.slice(5, 7))}月`);
  add("大会が最も多い月", evMonth[0]?.[0] ?? "—", "シーズンのピークです。この時期の前に告知を強化しましょう。");
  const lead = ev.map((e) => (new Date(e.date_start).getTime() - new Date(e.created_at).getTime()) / DAY).filter((x) => x >= 0);
  add("開催の何日前に投稿されたか（平均）", lead.length ? `${Math.round(lead.reduce((a, b) => a + b, 0) / lead.length)}日前` : "—", "早めの掲載ほど参加検討に役立ちます。");
  const weekend = ev.filter((e) => { const w = new Date(e.date_start).getUTCDay(); return w === 0 || w === 6; }).length;
  add("土日開催の割合", pct(weekend, ev.length), "ほとんどの大会が週末に集中する競技特性がわかります。");
  add("2日以上の大会", n(ev.filter((e) => e.date_end && e.date_end !== e.date_start).length), "宿泊を伴う大規模大会の目安です。");
  add("終了した大会", n(ev.filter((e) => (e.date_end || e.date_start) < today).length), "過去の大会記録として残っています。");

  // ─────────── 安全・通報 ───────────
  start("安全・通報");
  const rpts = d.reports;
  add("通報の総数", n(rpts.length), "これまでに寄せられた通報の数です。");
  const open = rpts.filter((r) => !r.is_resolved).length;
  add("未対応の通報", n(open), open ? "確認待ちの通報があります。「通報」タブで対応しましょう。" : "未対応の通報はありません。", open ? "warn" : "good");
  const cr = change(since(rpts, 7).length, between(rpts, 14, 7).length);
  add("直近30日の通報", n(since(rpts, 30).length), `直近7日は前週比 ${cr.text}。`, cr.level === "good" ? "warn" : "info");
  const reason = countBy(rpts, (r) => r.reason);
  add("最も多い通報理由", reason[0] ? `${reason[0][0]}（${reason[0][1]}件）` : "—", "投稿ルールの中で、特に周知すべき点がわかります。");
  const pi = rpts.filter((r) => r.reason === "個人情報が書かれている").length;
  add("個人情報に関する通報", n(pi), pi ? "自動で非表示にしています。内容を確認し、必要なら完全に削除しましょう。" : "個人情報の通報はありません。", pi ? "warn" : "good");
  const child = rpts.filter((r) => r.reason === "子どもの安全に関わる内容").length;
  add("子どもの安全に関する通報", n(child), child ? "最優先で確認してください。" : "該当する通報はありません。", child ? "warn" : "good");
  const hidden = [...ev, ...th, ...rp].filter((r) => r.is_hidden).length;
  add("非表示中の投稿", n(hidden), "通報や運営判断で隠している投稿の数です。");
  add("全投稿のうち非表示の割合", pct(hidden, ev.length + th.length + rp.length), "5%を超える場合は、投稿ルールの周知を強めましょう。", ratio(hidden, ev.length + th.length + rp.length) > 0.05 ? "warn" : "info");
  add("通報の対応完了率", pct(rpts.filter((r) => r.is_resolved).length, rpts.length), "通報にきちんと対応している証拠になります。");
  const rej = d.logs.filter((l) => String(l.kind).startsWith("rejected:"));
  const rej30 = since(rej, 30);
  add("自動ではじいた投稿（30日）", n(rej30.length), "禁止ワード・連絡先・連続投稿などで自動的に止めた件数です。");
  const rk = (k: string) => rej30.filter((l) => l.kind === `rejected:${k}`).length;
  add("連絡先（電話・メール）ではじいた数", n(rk("contact")), "個人情報の書き込みを未然に防いだ件数です。");
  add("禁止ワードではじいた数", n(rk("ng")), "多い場合は、禁止ワードの見直しや追加を検討しましょう。");
  add("リンクの貼りすぎではじいた数", n(rk("links")), "宣伝目的の投稿の目安です。");
  add("連続投稿制限が発動した数", n(rk("rate")), "短時間の大量投稿（荒らし）の目安です。");
  add("ボットと判定してはじいた数", n(rk("bot")), "機械的な自動投稿を止めた件数です。");
  add("投稿停止中の端末からの投稿試行", n(rk("blocked")), "ブロック後も書き込もうとしている端末があるかの目安です。");
  add("投稿停止中の端末", n(d.blocks.length), "「端末」タブで確認・解除できます。");
  const flagged = new Map<string, number>();
  for (const r of [...ev, ...th, ...rp]) if (r.ip_hash && (r.is_hidden || r.report_count > 0)) flagged.set(r.ip_hash, (flagged.get(r.ip_hash) ?? 0) + (r.is_hidden ? 2 : 0) + (r.report_count ?? 0));
  const watch = [...flagged.values()].filter((v) => v >= 3).length;
  add("要注意の端末", n(watch), watch ? "通報や非表示が重なっている端末です。「端末」タブで確認しましょう。" : "要注意の端末はありません。", watch ? "warn" : "good");
  const reporters = countBy(rpts, (r) => r.ip_hash);
  add("最も多く通報している端末の件数", reporters[0] ? `${reporters[0][1]}件` : "—", reporters[0] && reporters[0][1] >= 10 ? "1つの端末からの通報が多すぎます。通報の乱用の可能性もあります。" : "通報は分散しています。");

  // ─────────── コラム・チーム・お問い合わせ ───────────
  start("コラム・チーム・お問い合わせ");
  const pub = d.columns.filter((c) => c.is_published);
  add("公開中のコラム", n(pub.length), pub.length ? "読みものが増えるほど、検索からの訪問が増えます。" : "まだコラムがありません。最初の1本を公開しましょう。", pub.length ? "info" : "warn");
  const waiting = d.columns.filter((c) => c.is_submission && !c.is_published).length;
  add("確認待ちの寄稿", n(waiting), waiting ? "読者からの寄稿が届いています。「コラム」タブで確認しましょう。" : "確認待ちの寄稿はありません。", waiting ? "warn" : "info");
  add("直近30日に公開したコラム", n(pub.filter((c) => c.published_at && Date.now() - new Date(c.published_at).getTime() < 30 * DAY).length), "月2本以上を目安にすると、リピーターが育ちます。");
  add("寄稿から生まれたコラム", n(pub.filter((c) => c.is_submission).length), "読者参加型のコンテンツの数です。");
  add("登録チーム数", n(d.teams.filter((t) => !t.is_hidden).length), "掲載中の登録チームの数です。");
  const teamPrefs = new Set(d.teams.map((t) => t.prefecture)).size;
  add("登録チームがある都道府県", `${teamPrefs} / 47`, "チーム情報のカバー状況です。");
  add("協会HPのリンクがある都道府県", `${Object.values(ASSOCIATIONS).filter(Boolean).length} / 47`, "リンク切れがないか、半年に一度は確認しましょう。");
  add("お問い合わせの総数", n(d.contacts.length), "これまでに届いたお問い合わせです。");
  const openC = d.contacts.filter((c) => !c.is_resolved).length;
  add("未対応のお問い合わせ", n(openC), openC ? "返事を待っている人がいます。" : "すべて対応済みです。", openC ? "warn" : "good");
  add("削除依頼の件数", n(d.contacts.filter((c) => c.subject === "投稿の削除依頼").length), "削除依頼が増えたら、投稿ルールの見直しを検討しましょう。");

  return groups;
}
