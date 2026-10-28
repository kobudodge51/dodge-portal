import type { Metadata } from "next";
import NewTopicForm from "@/components/NewTopicForm";
import { createThread } from "@/app/actions";
import { BOARD_CATEGORIES, BOARD_CATEGORY_DOT } from "@/lib/prefectures";

export const metadata: Metadata = { title: "話題を投稿する" };

export default function NewThreadPage() {
  return (
    <div className="form-card" style={{ maxWidth: 640 }}>
      <h1 className="disp-head"><span>NEW TOPIC</span>話題を投稿する</h1>
      <NewTopicForm action={createThread} categories={BOARD_CATEGORIES} dots={BOARD_CATEGORY_DOT} />
    </div>
  );
}
