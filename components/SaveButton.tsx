"use client";

import { useEffect, useState } from "react";

// 話題の「保存」（この端末のブラウザに保存。ログイン不要）
export type SavedTopic = { id: string; title: string; at: number };
const KEY = "dp-saved";

export function readSaved(): SavedTopic[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function writeSaved(list: SavedTopic[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    /* 保存できない環境 */
  }
}

export default function SaveButton({ id, title }: { id: string; title: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => setSaved(readSaved().some((s) => s.id === id)), [id]);
  const toggle = () => {
    const list = readSaved().filter((s) => s.id !== id);
    if (!saved) list.unshift({ id, title, at: Date.now() });
    writeSaved(list);
    setSaved(!saved);
  };
  return (
    <button type="button" className={saved ? "save-btn on" : "save-btn"} onClick={toggle} aria-pressed={saved} aria-label={saved ? "保存を外す" : "あとで読むために保存する"}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
    </button>
  );
}
