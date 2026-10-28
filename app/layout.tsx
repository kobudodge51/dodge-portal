import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header, Footer, SITE_NAME, SITE_TAGLINE } from "@/components/Layout";
import Tracker from "@/components/Tracker";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: { default: `${SITE_NAME}｜${SITE_TAGLINE}`, template: `%s｜${SITE_NAME}` },
  description: "全国の都道府県ドッジボール協会、大会予定、登録チーム、ドッジボールコラム、交流掲示板をまとめたドッジボールのポータルサイトです。",
  applicationName: "ドッジポータル",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ドッジポータル", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }] },
};

// 白・黒の選択を、画面が出る前に反映する（ちらつき防止）
const THEME_INIT = `try{if(localStorage.getItem("dp-theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#070919" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=BIZ+UDPGothic:wght@400;700&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <BottomNav />
        <Tracker />
      </body>
    </html>
  );
}
