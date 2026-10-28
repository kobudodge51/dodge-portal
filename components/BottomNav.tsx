"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// スマホの下に固定するメニュー（真ん中は投稿ボタン）
const I = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  board: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z" />,
  events: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
};

export default function BottomNav() {
  const path = usePathname() || "/";
  const on = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));
  const item = (href: string, label: string, icon: React.ReactNode, active: boolean) => (
    <Link href={href} className={active ? "bn-item on" : "bn-item"} aria-current={active ? "page" : undefined}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
      {label}
    </Link>
  );
  if (path.startsWith("/admin")) return null;
  return (
    <nav className="bottom-nav" aria-label="メインメニュー（スマホ）">
      {item("/", "ホーム", I.home, on("/"))}
      {item("/board", "掲示板", I.board, on("/board") && path !== "/board/new")}
      <Link href="/board/new" className="bn-post" aria-label="話題を投稿する">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </Link>
      {item("/events", "大会", I.events, on("/events"))}
      {item("/menu", "メニュー", I.menu, on("/menu") || on("/teams") || on("/columns") || on("/associations") || on("/saved"))}
    </nav>
  );
}
