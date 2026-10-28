"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SaveButton, { readSaved, type SavedTopic } from "./SaveButton";

export default function SavedList() {
  const [list, setList] = useState<SavedTopic[] | null>(null);
  useEffect(() => setList(readSaved()), []);
  if (list === null) return null;
  if (list.length === 0) return <p className="empty">保存した話題はまだありません。掲示板の話題の右にある しおりマーク を押すと、ここに集まります。</p>;
  return (
    <div className="topic-list">
      {list.map((s) => (
        <div key={s.id} className="topic">
          <Link href={`/board/${s.id}`} className="topic-main"><span className="topic-title">{s.title}</span></Link>
          <SaveButton id={s.id} title={s.title} />
        </div>
      ))}
    </div>
  );
}
