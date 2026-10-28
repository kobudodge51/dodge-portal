import Link from "next/link";
import type { ThreadRow } from "@/lib/types";
import { BOARD_CATEGORY_DOT } from "@/lib/prefectures";
import { fmtAgo } from "@/lib/format";
import SaveButton from "./SaveButton";

// 掲示板の1行（カテゴリの点・タイトル・返信数・保存）
export default function TopicRow({ t }: { t: ThreadRow }) {
  return (
    <div className="topic">
      <Link href={`/board/${t.id}`} className="topic-main">
        <span className="topic-meta" style={{ ["--dot" as string]: BOARD_CATEGORY_DOT[t.category] ?? "#aab2d8" }}>{t.category}<small>・{fmtAgo(t.last_activity_at)}</small></span>
        <span className="topic-title">{t.title}</span>
      </Link>
      <span className="topic-count"><b>{t.reply_count}</b><small>返信</small></span>
      <SaveButton id={t.id} title={t.title} />
    </div>
  );
}
