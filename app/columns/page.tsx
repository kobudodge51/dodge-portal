import Link from "next/link";
import type { Metadata } from "next";
import { db, safeList } from "@/lib/supabase";
import type { ColumnRow } from "@/lib/types";
import { ColumnItem } from "@/components/Items";
import { PageHead } from "@/components/Layout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ドッジボールコラム" };

export default async function ColumnsPage() {
  const columns = await safeList<ColumnRow>(() => db().from("portal_columns").select("*").eq("is_published", true).order("published_at", { ascending: false }).limit(100));
  return (
    <>
      <PageHead
        kicker="COLUMN"
        title="ドッジボールコラム"
        lead="技術・指導・大会の振り返り・選手インタビューなど、ドッジボールをもっと深く楽しむための読みもの。"
        action={<Link href="/columns/submit" className="btn btn-ghost">コラムを寄稿する</Link>}
      />
      <div className="wrap section">
        {columns.length ? <div className="card-grid">{columns.map((c) => <ColumnItem key={c.id} c={c} />)}</div> : <p className="empty">コラムは準備中です。</p>}
      </div>
    </>
  );
}
