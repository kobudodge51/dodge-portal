import Link from "next/link";
import { notFound } from "next/navigation";
import { db, safeList, safeOne } from "@/lib/supabase";
import { THREAD_COLS, type ThreadRow, type ReplyRow } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import PostTools from "@/components/PostTools";
import ActionForm from "@/components/ActionForm";
import { createReply } from "@/app/actions";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return safeOne<ThreadRow>(() => db().from("portal_threads").select(THREAD_COLS).eq("id", id).eq("is_hidden", false).single());
}

export async function generateMetadata({ params }: P) {
  const t = await load((await params).id);
  return { title: t ? t.title : "交流掲示板" };
}

export default async function ThreadPage({ params }: P) {
  const t = await load((await params).id);
  if (!t) notFound();
  const replies = await safeList<ReplyRow>(() =>
    db().from("portal_replies").select("id,thread_id,body,poster_name,created_at").eq("thread_id", t.id).eq("is_hidden", false).order("created_at").limit(1000)
  );

  return (
    <article className="detail">
      <p className="small"><Link href="/board">← 交流掲示板</Link></p>
      <div className="row-meta" style={{ marginBottom: 8 }}>
        <span className="tag">{t.category}</span>
        {t.prefecture && <span className="tag tag-pref">{t.prefecture}</span>}
      </div>
      <h1 style={{ fontSize: "1.5rem" }}>{t.title}</h1>
      <p className="reply-head">1. {t.poster_name}　{fmtDateTime(t.created_at)}</p>
      <p className="prose">{t.body}</p>
      <PostTools type="thread" id={t.id} />

      <h2 style={{ marginTop: 32 }}>返信（{replies.length}）</h2>
      {replies.map((r, i) => (
        <div className="reply" key={r.id} id={`r${i + 2}`}>
          <p className="reply-head">{i + 2}. {r.poster_name}　{fmtDateTime(r.created_at)}</p>
          <p className="prose" style={{ marginBottom: 0 }}>{r.body}</p>
          <PostTools type="reply" id={r.id} />
        </div>
      ))}

      <h2 style={{ marginTop: 32 }}>返信する</h2>
      <ActionForm action={createReply} submitLabel="返信する" poster agree>
        <input type="hidden" name="thread_id" value={t.id} />
        <label className="field">
          <span>本文</span>
          <textarea name="body" required maxLength={1500} style={{ minHeight: 100 }} />
        </label>
      </ActionForm>
    </article>
  );
}
