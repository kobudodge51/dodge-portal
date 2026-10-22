import Link from "next/link";
import { notFound } from "next/navigation";
import { db, safeOne } from "@/lib/supabase";
import type { ColumnRow } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return safeOne<ColumnRow>(() => db().from("portal_columns").select("*").eq("id", id).eq("is_published", true).single());
}

export async function generateMetadata({ params }: P) {
  const c = await load((await params).id);
  return { title: c ? c.title : "コラム" };
}

// 「## 見出し」の行を見出しに、空行で段落を分ける簡単な書式
function Body({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="column-body">
      {blocks.map((b, i) =>
        b.startsWith("## ") ? <h2 key={i}>{b.slice(3).trim()}</h2> : <p key={i}>{b}</p>
      )}
    </div>
  );
}

export default async function ColumnDetail({ params }: P) {
  const c = await load((await params).id);
  if (!c) notFound();
  return (
    <article className="detail">
      <p className="small"><Link href="/columns">← コラム一覧</Link></p>
      <p className="kicker" style={{ color: "var(--ball)" }}>COLUMN</p>
      <h1 style={{ fontSize: "1.7rem" }}>{c.title}</h1>
      <p className="small muted">{c.author}　{c.published_at ? fmtDateTime(c.published_at).split(" ")[0] : ""}</p>
      <hr style={{ border: 0, borderTop: "3px solid var(--ink)", margin: "16px 0 24px" }} />
      <Body text={c.body} />
    </article>
  );
}
