import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { loadReviewItem, REVIEW_TYPES, REVIEW_LABEL, type ReviewType } from "@/lib/review";
import { adminLogin, adminReview } from "@/app/actions";
import ActionForm from "@/components/ActionForm";
import { PageHead } from "@/components/Layout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "投稿の確認", robots: { index: false, follow: false } };

type P = { params: Promise<{ type: string; id: string }>; searchParams: Promise<{ done?: string }> };

const OK_LABEL: Record<ReviewType, string> = { event: "OK（公開・確認済みにする）", thread: "OK（公開のまま）", reply: "OK（公開のまま）", column: "OK（コラムを掲載する）", report: "OK（問題なし・表示に戻す）" };
const NG_LABEL: Record<ReviewType, string> = { event: "NG（非表示にする）", thread: "NG（非表示にする）", reply: "NG（非表示にする）", column: "NG（掲載しない）", report: "NG（対象を非表示にする）" };

export default async function ReviewPage({ params, searchParams }: P) {
  const { type, id } = await params;
  if (!REVIEW_TYPES.includes(type as ReviewType)) notFound();
  const t = type as ReviewType;

  if (!(await isAdmin())) {
    return (
      <>
        <PageHead kicker="ADMIN" title="管理者ログイン" lead="LINEのお知らせの内容を確認するには、管理者パスワードでログインしてください。" />
        <div className="form-card" style={{ maxWidth: 420 }}>
          <ActionForm action={adminLogin} submitLabel="ログインして確認する">
            <input type="hidden" name="next" value={`/admin/review/${t}/${id}`} />
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
  const item = await loadReviewItem(t, id);
  return (
    <>
      <PageHead kicker="ADMIN" title={`${REVIEW_LABEL[t]}の確認`} />
      <div className="wrap section" style={{ maxWidth: 760 }}>
        {sp.done && <p className="banner-ok">{sp.done}</p>}
        {!item ? (
          <p className="empty">この投稿は見つかりませんでした（削除済みの可能性があります）。</p>
        ) : (
          <div className="panel" style={{ paddingBottom: 16 }}>
            <p className="small muted" style={{ margin: 0 }}>現在の状態：<b style={{ color: "var(--text)" }}>{item.status}</b>{item.extra ? `　${item.extra}` : ""}</p>
            <h2 style={{ marginTop: 8 }}>{item.title}</h2>
            <p className="prose" style={{ whiteSpace: "pre-wrap" }}>{item.body}</p>
            {item.link && <p className="small"><Link href={item.link} target="_blank">サイト上の表示を見る →</Link></p>}
            <div className="review-actions">
              <form action={adminReview}>
                <input type="hidden" name="type" value={t} />
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="decision" value="ok" />
                <button className="btn btn-ok" type="submit">{OK_LABEL[t]}</button>
              </form>
              <form action={adminReview}>
                <input type="hidden" name="type" value={t} />
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="decision" value="ng" />
                <button className="btn btn-ng" type="submit">{NG_LABEL[t]}</button>
              </form>
            </div>
          </div>
        )}
        <p className="small" style={{ marginTop: 16 }}><Link href="/admin">管理者ページへ</Link></p>
      </div>
    </>
  );
}
