import Link from "next/link";
import type { Metadata } from "next";
import { JOSHI_SOGO as J } from "@/lib/specials";

export const metadata: Metadata = { title: "メニュー" };

const GROUPS: { title: string; items: { href: string; label: string; note?: string }[] }[] = [
  {
    title: "さがす・読む",
    items: [
      { href: "/events", label: "大会予定カレンダー" },
      { href: "/board", label: "交流掲示板" },
      { href: "/saved", label: "保存した話題", note: "この端末に保存" },
      { href: "/teams", label: "登録チーム", note: "日本協会の公開情報" },
      { href: "/columns", label: "ドッジボールコラム" },
      { href: "/associations", label: "都道府県協会・地域から探す" },
      { href: `/special/${J.slug}`, label: `${J.edition} 全日本女子総合選手権`, note: "特設ページ" },
    ],
  },
  {
    title: "投稿する",
    items: [
      { href: "/board/new", label: "話題を投稿する" },
      { href: "/events/new", label: "大会予定を投稿する" },
      { href: "/columns/submit", label: "コラムを寄稿する" },
    ],
  },
  {
    title: "このサイトについて",
    items: [
      { href: "/install", label: "ホーム画面に追加する方法" },
      { href: "/guidelines", label: "投稿ルール" },
      { href: "/terms", label: "利用規約" },
      { href: "/privacy", label: "プライバシーポリシー" },
      { href: "/contact", label: "お問い合わせ・削除依頼" },
    ],
  },
];

export default function MenuPage() {
  return (
    <div className="wrap section menu-page">
      <h1 className="disp-head"><span>MENU</span>メニュー</h1>
      {GROUPS.map((g) => (
        <section key={g.title} className="menu-group">
          <h2>{g.title}</h2>
          <ul>
            {g.items.map((i) => (
              <li key={i.href}>
                <Link href={i.href}>
                  <span>{i.label}</span>
                  {i.note && <small>{i.note}</small>}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
