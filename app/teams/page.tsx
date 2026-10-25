import Link from "next/link";
import type { Metadata } from "next";
import { db, isConfigured, safeList } from "@/lib/supabase";
import { TEAM_COLS, type TeamRow } from "@/lib/types";
import { PREFECTURES, TEAM_CATEGORIES, TEAM_CATEGORY_LABEL, BLOCKS, blockPrefNames } from "@/lib/prefectures";
import { JDBA_URL } from "@/lib/associations";
import { TeamItem } from "@/components/Items";
import { PageHead, NotConnected } from "@/components/Layout";
import PrefSelect from "@/components/PrefSelect";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "登録チーム一覧" };

type SP = Promise<{ pref?: string; block?: string; cat?: string }>;

export default async function TeamsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const teams = await safeList<TeamRow>(() => {
    let q = db().from("portal_teams").select(TEAM_COLS).eq("is_hidden", false);
    if (sp.pref) q = q.eq("prefecture", sp.pref);
    else if (sp.block && (BLOCKS as readonly string[]).includes(sp.block)) q = q.in("prefecture", blockPrefNames(sp.block));
    if (sp.cat) q = q.eq("category", sp.cat);
    return q.order("team_name").limit(2000);
  });

  const order = PREFECTURES.map((p) => p.name);
  const groups = new Map<string, TeamRow[]>();
  for (const t of teams) groups.set(t.prefecture, [...(groups.get(t.prefecture) ?? []), t]);
  const sorted = [...groups.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));

  return (
    <>
      <PageHead
        kicker="TEAMS"
        title="登録チーム一覧"
        lead="日本ドッジボール協会に登録し、公式サイトでの公開を希望しているチームを、都道府県別にまとめています（2026年度）。"
      />
      <div className="wrap section">
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
            部門
            <select name="cat" defaultValue={sp.cat ?? ""}>
              <option value="">すべて</option>
              {TEAM_CATEGORIES.map((c) => <option key={c} value={c}>{TEAM_CATEGORY_LABEL[c]}（{c}）</option>)}
            </select>
          </label>
          <button className="btn btn-outline btn-sm" type="submit">絞り込む</button>
        </form>
        <p className="small muted" style={{ marginTop: -4 }}>
          ※日本ドッジボール協会の登録区分ではファイター（S-1）と中学生（U-15）が分かれていないため、U-15のチームもファイター（S-1）と同じ色のバッジで表示しています。
        </p>
        {teams.length === 0 && <p className="empty">登録チームの情報は準備中です。</p>}
        {sorted.map(([pref, list]) => (
          <section key={pref} style={{ marginBottom: 28 }}>
            <h2>{pref}<span className="small muted" style={{ fontFamily: "var(--body)", marginLeft: 8 }}>{list.length}チーム</span></h2>
            <div className="card-grid">{list.map((t) => <TeamItem key={t.id} t={t} />)}</div>
          </section>
        ))}
        <p className="small muted">
          ※掲載内容は<a href={JDBA_URL} target="_blank" rel="noopener noreferrer">日本ドッジボール協会</a>の公式サイトに掲載されている情報をもとにしています。最新の登録状況は協会の発表をご確認ください。掲載内容の誤りは<Link href="/contact">お問い合わせ</Link>からお知らせください。
        </p>
      </div>
    </>
  );
}
