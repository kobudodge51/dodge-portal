"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// スマホの下に固定するメニュー。真ん中の「＋」で、何を投稿するか選ぶ
const I = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  board: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z" />,
  events: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
};

export default function BottomNav() {
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const on = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));
  const item = (href: string, label: string, icon: React.ReactNode, active: boolean) => (
    <Link href={href} className={active ? "bn-item on" : "bn-item"} aria-current={active ? "page" : undefined}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
      {label}
    </Link>
  );
  if (path.startsWith("/admin")) return null;
  return (
    <>
      {open && (
        <>
          <div className="post-sheet-bg" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="post-sheet" role="dialog" aria-label="投稿する内容を選ぶ">
            <p>何を投稿しますか？</p>
            <Link href="/board/new"><i style={{ background: "#ff8a1f" }}>話</i>掲示板に話題を投稿<small>交流掲示板</small></Link>
            <Link href="/events/new"><i style={{ background: "#4c6bff" }}>大</i>大会予定を投稿<small>カレンダー</small></Link>
            <Link href="/columns/submit"><i style={{ background: "#ff2e88" }}>コ</i>コラムを寄稿<small>運営が確認</small></Link>
          </div>
        </>
      )}
      <nav className="bottom-nav" aria-label="メインメニュー（スマホ）">
        {item("/", "ホーム", I.home, on("/"))}
        {item("/board", "掲示板", I.board, on("/board"))}
        <button type="button" className="bn-post" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "投稿メニューを閉じる" : "投稿する"}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true" style={{ transform: open ? "rotate(45deg)" : undefined, transition: "transform .15s" }}><path d="M12 5v14M5 12h14" /></svg>
        </button>
        {item("/events", "大会", I.events, on("/events"))}
        {item("/menu", "メニュー", I.menu, on("/menu") || on("/teams") || on("/columns") || on("/associations") || on("/saved"))}
      </nav>
    </>
  );
}
