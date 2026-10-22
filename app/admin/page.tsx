import Link from "next/link";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin";
import { db, isConfigured, safeList, safeOne } from "@/lib/supabase";
import { fmtDateTime, excerpt } from "@/lib/format";
import { adminLogin, adminLogout, adminSet, adminDelete, adminSaveColumn, adminAddTeam } from "@/app/actions";
import PrefSelect from "@/components/PrefSelect";
import { TEAM_CATEGORIES } from "@/lib/prefectures";
import ActionForm from "@/components/ActionForm";
import ConfirmButton from "@/components/ConfirmButton";
import { PageHead, NotConnected } from "@/components/Layout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "管理者ページ", robots: { index: false, follow: false } };

const TABS = [
  { key: "reports", label: "通報" },
  { key: "events", label: "大会予定" },
  { key: "teams", label: "登録チーム" },
  { key: "threads", label: "スレッド" },
  { key: "replies", label: "返信" },
  { key: "columns", label: "コラム" },
  { key: "contacts", label: "お問い合わせ" },
];

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function Toggle({ table, id, field, value, on, off }: { table: string; id: string; field: string; value: boolean; on: string; off: string }) {
  return (
    <form action={adminSet}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={value ? "false" : "true"} />
      <button className="btn btn-outline btn-sm" type="submit">{value ? on : off}</button>
    </form>
  );
}

function Del({ table, id }: { table: string; id: string }) {
  return (
    <form action={adminDelete}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <ConfirmButton label="削除" message="完全に削除します。元に戻せません。よろしいですか？" />
    </form>
  );
}

function summary(table: string, r: Row) {
  switch (table) {
    case "events":
      return <><b>{r.title}</b><br />{r.prefecture}／{r.date_start}{r.venue ? `／${r.venue}` : ""}</>;
    case "teams":
      return <><b>{r.team_name}</b><br />{r.prefecture}{r.city ? ` ${r.city}` : ""}</>;
    case "threads":
      return <><b>{r.title}</b><br />{excerpt(r.body, 80)}</>;
    case "replies":
      return <>{excerpt(r.body, 120)}<br /><Link href={`/board/${r.thread_id}`}>スレッドを開く</Link></>;
    default:
      return null;
  }
}

const VIEW: Record<string, string> = { events: "/events/", teams: "/teams/", threads: "/board/" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; edit?: string }> }) {
  if (!(await isAdmin())) {
    return (
      <>
        <PageHead kicker="ADMIN" title="管理者ログイン" />
        <div className="form-card" style={{ maxWidth: 420 }}>
          <ActionForm action={adminLogin} submitLabel="ログイン">
            <label className="field">
              <span>パスワード</span>
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
          </ActionForm>
        </div>
      </>
    );
  }

  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "reports";

  let rows: Row[] = [];
  if (tab === "reports") {
    rows = await safeList<Row>(() => db().from("portal_reports").select("*").eq("is_resolved", false).order("created_at", { ascending: false }).limit(200));
  } else if (tab === "contacts") {
    rows = await safeList<Row>(() => db().from("portal_contacts").select("*").order("created_at", { ascending: false }).limit(200));
  } else if (tab === "columns") {
    rows = await safeList<Row>(() => db().from("portal_columns").select("*").order("created_at", { ascending: false }).limit(200));
  } else {
    rows = await safeList<Row>(() => db().from(`portal_${tab}`).select("*").order("created_at", { ascending: false }).limit(200));
  }

  const editing = tab === "columns" && sp.edit && sp.edit !== "new"
    ? await safeOne<Row>(() => db().from("portal_columns").select("*").eq("id", sp.edit!).single())
    : null;

  return (
    <>
      <PageHead kicker="ADMIN" title="管理者ページ" action={<form action={adminLogout}><button className="btn btn-ghost btn-sm">ログアウト</button></form>} />
      <div className="wrap section">
        {!isConfigured() && <NotConnected />}
        <div className="chips">
          {TABS.map((t) => (
            <Link key={t.key} href={`/admin?tab=${t.key}`} className={t.key === tab ? "chip on" : "chip"}>{t.label}</Link>
          ))}
        </div>

        {tab === "reports" && (
          <div className="table-scroll">
            <table className="admin-table">
              <thead><tr><th>日時</th><th>種類</th><th>理由</th><th>補足</th><th>操作</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const href = r.target_type === "event" ? `/admin?tab=events` : r.target_type === "team" ? `/admin?tab=teams` : r.target_type === "thread" ? `/admin?tab=threads` : `/admin?tab=replies`;
                  return (
                    <tr key={r.id}>
                      <td>{fmtDateTime(r.created_at)}</td>
                      <td><Link href={href}>{r.target_type}</Link><br /><span className="muted small">{r.target_id.slice(0, 8)}</span></td>
                      <td>{r.reason}</td>
                      <td>{r.detail}</td>
                      <td><Toggle table="portal_reports" id={r.id} field="is_resolved" value={r.is_resolved} on="未対応に戻す" off="対応済みにする" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <p className="empty">未対応の通報はありません。</p>}
            <p className="small muted">通報された投稿は各タブで「通報数」が表示されます。非表示中の投稿は「公開に戻す」で再公開できます（通報数はリセットされます）。</p>
          </div>
        )}

        {tab === "teams" && (
          <details style={{ marginBottom: 20 }}>
            <summary className="btn btn-primary btn-sm">＋ 登録チームを追加する</summary>
            <div style={{ maxWidth: 640, marginTop: 12 }}>
              <ActionForm action={adminAddTeam} submitLabel="追加する">
                <label className="field"><span>チーム名</span><input name="team_name" required maxLength={60} /></label>
                <div className="row-2">
                  <label className="field"><span>都道府県</span><PrefSelect /></label>
                  <label className="field"><span>市区町村</span><input name="city" maxLength={30} /></label>
                </div>
                <label className="field">
                  <span>カテゴリ</span>
                  <select name="category" defaultValue=""><option value="">なし</option>{TEAM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
                </label>
                <div className="row-2">
                  <label className="field"><span>ホームページ</span><input name="website_url" type="url" /></label>
                  <label className="field"><span>SNS</span><input name="sns_url" type="url" /></label>
                </div>
              </ActionForm>
            </div>
          </details>
        )}

        {["events", "teams", "threads", "replies"].includes(tab) && (
          <div className="table-scroll">
            <table className="admin-table">
              <thead><tr><th>投稿日時</th><th>内容</th><th>投稿者</th><th>状態</th><th>操作</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={r.is_hidden ? { background: "#fdecee" } : undefined}>
                    <td>{fmtDateTime(r.created_at)}</td>
                    <td>{summary(tab, r)}{VIEW[tab] && !r.is_hidden && <><br /><Link href={VIEW[tab] + r.id}>ページを見る</Link></>}</td>
                    <td>{r.poster_name}<br /><span className="muted small">{(r.ip_hash ?? "").slice(0, 8)}</span></td>
                    <td>
                      {r.is_hidden ? <span className="tag" style={{ color: "var(--danger)" }}>非表示</span> : <span className="tag tag-ok">公開中</span>}
                      {r.report_count > 0 && <><br /><span className="small">通報 {r.report_count}件</span></>}
                      {r.is_verified && <><br /><span className="tag tag-ok">確認済み</span></>}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <Toggle table={`portal_${tab}`} id={r.id} field="is_hidden" value={r.is_hidden} on="公開に戻す" off="非表示にする" />
                        {(tab === "events" || tab === "teams") && <Toggle table={`portal_${tab}`} id={r.id} field="is_verified" value={r.is_verified} on="確認済みを外す" off="確認済みにする" />}
                        <Del table={`portal_${tab}`} id={r.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="empty">まだありません。</p>}
            <p className="small muted">投稿者欄の下の8文字は、同じ人の連続投稿を見分けるための記号です（IPアドレスそのものではありません）。</p>
          </div>
        )}

        {tab === "columns" && (
          <>
            {sp.edit ? (
              <div style={{ maxWidth: 760 }}>
                <h2>{editing ? "コラムを編集" : "新しいコラムを書く"}</h2>
                <ActionForm action={adminSaveColumn} submitLabel="保存する">
                  <input type="hidden" name="id" value={editing?.id ?? ""} />
                  <label className="field"><span>タイトル</span><input name="title" required maxLength={80} defaultValue={editing?.title ?? ""} /></label>
                  <label className="field"><span>筆者名</span><input name="author" maxLength={30} defaultValue={editing?.author ?? "DODGE PORTAL編集部"} /></label>
                  <label className="field">
                    <span>本文</span>
                    <textarea name="body" required style={{ minHeight: 400 }} defaultValue={editing?.body ?? ""} />
                    <small>行頭に「## 」で見出し、空行で段落が分かれます。</small>
                  </label>
                  <label className="check"><input type="checkbox" name="publish" defaultChecked={editing?.is_published ?? false} /><span>公開する（チェックを外すと下書き）</span></label>
                </ActionForm>
                <p className="small"><Link href="/admin?tab=columns">← コラム一覧に戻る</Link></p>
              </div>
            ) : (
              <>
                <p><Link href="/admin?tab=columns&edit=new" className="btn btn-primary btn-sm">＋ 新しいコラムを書く</Link></p>
                <div className="table-scroll">
                  <table className="admin-table">
                    <thead><tr><th>作成日時</th><th>タイトル</th><th>筆者</th><th>状態</th><th>操作</th></tr></thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id}>
                          <td>{fmtDateTime(r.created_at)}</td>
                          <td><b>{r.title}</b>{r.is_published && <><br /><Link href={`/columns/${r.id}`}>ページを見る</Link></>}</td>
                          <td>{r.author}</td>
                          <td>
                            {r.is_published ? <span className="tag tag-ok">公開中</span> : <span className="tag">非公開</span>}
                            {r.is_submission && <><br /><span className="tag tag-court">寄稿</span></>}
                          </td>
                          <td>
                            <div className="admin-actions">
                              <Link href={`/admin?tab=columns&edit=${r.id}`} className="btn btn-outline btn-sm">編集</Link>
                              <Del table="portal_columns" id={r.id} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length === 0 && <p className="empty">まだコラムはありません。</p>}
                </div>
              </>
            )}
          </>
        )}

        {tab === "contacts" && (
          <div className="table-scroll">
            <table className="admin-table">
              <thead><tr><th>日時</th><th>種別</th><th>内容</th><th>名前・返信先</th><th>操作</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={r.is_resolved ? { opacity: 0.55 } : undefined}>
                    <td>{fmtDateTime(r.created_at)}</td>
                    <td>{r.subject}</td>
                    <td className="prose">{r.body}</td>
                    <td>{r.name}<br />{r.reply_to}</td>
                    <td>
                      <div className="admin-actions">
                        <Toggle table="portal_contacts" id={r.id} field="is_resolved" value={r.is_resolved} on="未対応に戻す" off="対応済みにする" />
                        <Del table="portal_contacts" id={r.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="empty">お問い合わせはありません。</p>}
          </div>
        )}
      </div>
    </>
  );
}
