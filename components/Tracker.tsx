"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// ページが表示されるたびに、どのページが見られたかだけを記録する（Cookieは使わない）
export default function Tracker() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.startsWith("/admin") || path.startsWith("/api")) return;
    try {
      const body = JSON.stringify({ p: path, r: document.referrer || "" });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      else fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
    } catch {
      /* 記録できなくてもサイトの表示には影響させない */
    }
  }, [path]);
  return null;
}
