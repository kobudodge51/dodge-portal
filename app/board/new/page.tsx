import Link from "next/link";
import type { Metadata } from "next";
import NewTopicForm from "@/components/NewTopicForm";
import { createThread } from "@/app/actions";
import { BOARD_CATEGORIES, BOARD_CATEGORY_DOT } from "@/lib/prefectures";

export const metadata: Metadata = { title: "交流掲示板に話題を投稿" };

// 交流掲示板の中の「投稿フォーム」。一覧ページとは別物だとわかるよう、掲示板の中の1画面として見せる
export default function NewThreadPage() {
  return (
    <div className="form-card" style={{ maxWidth: 640, paddingTop: 8 }}>
      <Link href="/board" className="crumb">← 交流掲示板の一覧へ戻る</Link>
      <h1 className="disp-head" style={{ marginTop: 4 }}><span>BOARD</span>交流掲示板に話題を投稿</h1>
      <p className="small muted" style={{ marginTop: -6 }}>ここで書いた話題は、公開すると<Link href="/board">交流掲示板の一覧</Link>に並びます。</p>
      <NewTopicForm action={createThread} categories={BOARD_CATEGORIES} dots={BOARD_CATEGORY_DOT} />
    </div>
  );
}
