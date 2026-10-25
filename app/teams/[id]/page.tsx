import Link from "next/link";
import { notFound } from "next/navigation";
import { db, safeOne } from "@/lib/supabase";
import { TEAM_COLS, type TeamRow } from "@/lib/types";
import { prefByName, TEAM_CATEGORY_LABEL } from "@/lib/prefectures";
import { JDBA_URL } from "@/lib/associations";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return safeOne<TeamRow>(() => db().from("portal_teams").select(TEAM_COLS).eq("id", id).eq("is_hidden", false).single());
}

export async function generateMetadata({ params }: P) {
  const t = await load((await params).id);
  return { title: t ? `${t.team_name}（${t.prefecture}）` : "登録チーム" };
}

export default async function TeamDetail({ params }: P) {
  const t = await load((await params).id);
  if (!t) notFound();
  const pref = prefByName(t.prefecture);
  return (
    <article className="detail">
      <p className="small"><Link href="/teams">← 登録チーム一覧</Link></p>
      <div className="row-meta" style={{ marginBottom: 8 }}>
        <span className="tag tag-pref">{t.prefecture}</span>
        {t.category && <span className="tag">{TEAM_CATEGORY_LABEL[t.category] ?? t.category}（{t.category}）</span>}
      </div>
      <h1 style={{ fontSize: "1.6rem" }}>{t.team_name}</h1>
      <table className="detail-table">
        <tbody>
          <tr><th>活動地域</th><td>{t.prefecture}{t.city ? ` ${t.city}` : ""}</td></tr>
          {t.website_url && <tr><th>ホームページ</th><td><a href={t.website_url} target="_blank" rel="noopener noreferrer nofollow">{t.website_url}</a></td></tr>}
          {t.sns_url && <tr><th>SNS</th><td><a href={t.sns_url} target="_blank" rel="noopener noreferrer nofollow">{t.sns_url}</a></td></tr>}
        </tbody>
      </table>
      {t.description && <p className="prose">{t.description}</p>}
      <p className="small muted">
        出典：<a href={JDBA_URL} target="_blank" rel="noopener noreferrer">日本ドッジボール協会 公式サイト</a>。掲載内容の誤りは<Link href="/contact">お問い合わせ</Link>からお知らせください。
      </p>
      {pref && <p className="small"><Link href={`/pref/${pref.code}`}>{t.prefecture}のドッジボール情報をもっと見る →</Link></p>}
    </article>
  );
}
