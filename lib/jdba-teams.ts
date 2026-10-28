// 日本ドッジボール協会の「都道府県協会」ページに表示される
// 「登録チーム紹介（公開希望チームのみ）」の元データを読み込む。
// 元データ：https://www.jdba-member.net/profile/profNN-2.js（NN＝都道府県番号 01〜47）
import { PREFECTURES } from "./prefectures";

export type JdbaTeam = { prefecture: string; team_name: string; kana: string; city: string; category: string; website_url: string | null };

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

// JSの document.write('…') の中身を取り出して、ひとつながりのHTMLにする
function jsToHtml(js: string) {
  const parts: string[] = [];
  const re = /document\.write(?:ln)?\(\s*(["'`])([\s\S]*?)\1\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(js))) parts.push(m[2]);
  const html = parts.length ? parts.join("") : js;
  return html.replace(/\\(["'\/])/g, "$1").replace(/\\n/g, "\n");
}

export function parseTeams(js: string, prefecture: string): JdbaTeam[] {
  const html = jsToHtml(js);
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const out: JdbaTeam[] = [];
  for (const tr of rows) {
    const cells = tr.match(/<td[\s\S]*?<\/td>/gi) ?? [];
    if (cells.length < 4) continue;
    const [name, kana, city, cat] = cells.slice(0, 4).map(decode);
    if (!name || name === "チーム名") continue;
    const href = (tr.match(/href=["']([^"']+)["']/i) ?? [])[1]?.trim() || null;
    out.push({
      prefecture,
      team_name: name.slice(0, 60),
      kana: kana.slice(0, 80),
      city: city.slice(0, 40),
      category: cat.replace(/\s/g, "").toUpperCase(),
      website_url: href && /^https?:\/\//.test(href) ? href.slice(0, 500) : null,
    });
  }
  return out;
}

export async function fetchAllJdbaTeams() {
  const results = await Promise.all(
    PREFECTURES.map(async (p, i) => {
      // 日本協会の番号は 15=山梨・16=新潟・17=富山・18=石川・19=福井（JIS番号と並びが違う）
      const JDBA_NO: Record<string, number> = { 山梨県: 15, 新潟県: 16, 富山県: 17, 石川県: 18, 福井県: 19 };
      const n = String(JDBA_NO[p.name] ?? i + 1).padStart(2, "0");
      try {
        const res = await fetch(`https://www.jdba-member.net/profile/prof${n}-2.js`, { cache: "no-store", headers: { "user-agent": "Mozilla/5.0 DODGE PORTAL" } });
        if (!res.ok) return { pref: p.name, teams: [] as JdbaTeam[], error: `HTTP ${res.status}` };
        const buf = await res.arrayBuffer();
        // 文字コードがShift_JISの場合にも対応
        let text = new TextDecoder("utf-8").decode(buf);
        if (text.includes("�")) text = new TextDecoder("shift_jis").decode(buf);
        return { pref: p.name, teams: parseTeams(text, p.name), error: null };
      } catch (e) {
        return { pref: p.name, teams: [] as JdbaTeam[], error: String(e) };
      }
    })
  );
  return results;
}
