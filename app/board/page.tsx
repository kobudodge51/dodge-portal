import Link from "next/link";
import type { Metadata } from "next";
import { db, isConfigured, safeList, safeOne } from "@/lib/supabase";
import { THREAD_COLS, type ThreadRow } from "@/lib/types";
import { BOARD_CATEGORIES } from "@/lib/prefectures";
import { getSetting } from "@/lib/settings";
import { NotConnected } from "@/components/Layout";
import TopicRow from "@/components/TopicRow";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "交流掲示板" };

type SP = Promise<{ cat?: string; deleted?: string }>;

export default async function BoardPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const pickupId = await getSetting("pickup_thread");
  const [threads, pickup] = await Promise.all([
    safeList<ThreadRow>(() => {
      let q = db().from("portal_threads").select(THREAD_COLS).eq("is_hidden", false);
      if (sp.cat) q = q.eq("category", sp.cat);
      return q.order("last_activity_at", { ascending: false }).limit(100);
    }),
    pickupId ? safeOne<ThreadRow>(() => db().from("portal_threads").select(THREAD_COLS).eq("id", pickupId).eq("is_hidden", false).single()) : Promise.resolve(null),
  ]);

  return (
    <div className="wrap section" style={{ maxWidth: 860 }}>
      <div className="board-tools">
        <h1 className="disp-head" style={{ margin: 0 }}><span>BOARD</span>交流掲示板</h1>
        <Link href="/board/new" className="btn btn-primary btn-sm">＋ 話題を投稿</Link>
      </div>
      <p className="small muted" style={{ margin: "0 0 8px" }}>ドッジボールの疑問・指導や練習方法・ルールや用品など、みんなで知恵を出し合う場所です。誰かを特定できる投稿はできません。</p>
      {sp.deleted && <p className="banner-ok">投稿を削除しました。</p>}
      {!isConfigured() && <NotConnected />}
      <nav className="cat-tabs" aria-label="カテゴリ">
        <Link href="/board" className={!sp.cat ? "on" : ""}>すべて</Link>
        {BOARD_CATEGORIES.map((c) => (
          <Link key={c} href={`/board?cat=${encodeURIComponent(c)}`} className={sp.cat === c ? "on" : ""}>{c}</Link>
        ))}
      </nav>
      {pickup && !sp.cat && (
        <Link href={`/board/${pickup.id}`} className="pickup" style={{ marginBottom: 8 }}>
          <span><span className="pickup-label">今週のお題</span><span className="pickup-title">{pickup.title}</span></span>
        </Link>
      )}
      {threads.length ? (
        <div className="topic-list">{threads.map((t) => <TopicRow key={t.id} t={t} />)}</div>
      ) : (
        <p className="empty">まだ話題がありません。<Link href="/board/new">最初の話題を投稿する</Link></p>
      )}
    </div>
  );
}
