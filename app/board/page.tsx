import Link from "next/link";
import type { Metadata } from "next";
import { db, isConfigured, safeList } from "@/lib/supabase";
import { THREAD_COLS, type ThreadRow } from "@/lib/types";
import { BOARD_CATEGORIES } from "@/lib/prefectures";
import { ThreadItem } from "@/components/Items";
import { PageHead, NotConnected } from "@/components/Layout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "交流掲示板" };

type SP = Promise<{ cat?: string; deleted?: string }>;

export default async function BoardPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const threads = await safeList<ThreadRow>(() => {
    let q = db().from("portal_threads").select(THREAD_COLS).eq("is_hidden", false);
    if (sp.cat) q = q.eq("category", sp.cat);
    return q.order("last_activity_at", { ascending: false }).limit(100);
  });

  return (
    <>
      <PageHead
        kicker="COMMUNITY"
        title="交流掲示板"
        lead="ドッジボールの疑問・大会の情報・指導や練習方法など、みんなで知恵を出し合う交流の場です。誰かを特定できる投稿はできません。"
        action={<Link href="/board/new" className="btn btn-primary">＋ スレッドを立てる</Link>}
      />
      <div className="wrap section">
        {sp.deleted && <p className="banner-ok">投稿を削除しました。</p>}
        {!isConfigured() && <NotConnected />}
        <div className="chips">
          <Link href="/board" className={!sp.cat ? "chip on" : "chip"}>すべて</Link>
          {BOARD_CATEGORIES.map((c) => (
            <Link key={c} href={`/board?cat=${encodeURIComponent(c)}`} className={sp.cat === c ? "chip on" : "chip"}>{c}</Link>
          ))}
        </div>
        {threads.length ? <ul className="list">{threads.map((t) => <ThreadItem key={t.id} t={t} />)}</ul> : <p className="empty">まだスレッドがありません。</p>}
      </div>
    </>
  );
}
