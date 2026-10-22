import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header, Footer, SITE_NAME, SITE_TAGLINE } from "@/components/Layout";

export const metadata: Metadata = {
  title: { default: `${SITE_NAME}｜${SITE_TAGLINE}`, template: `%s｜${SITE_NAME}` },
  description: "全国の都道府県ドッジボール協会、大会予定、登録チーム、ドッジボールコラム、交流掲示板をまとめたドッジボールのポータルサイトです。",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0d1b3e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
