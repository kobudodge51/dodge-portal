"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// スマホのトップにだけ出す、閉じられる小さな「ホーム画面に追加」案内
export default function InstallHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
      if (!standalone && localStorage.getItem("dp-install-hint") !== "off") setShow(true);
    } catch {
      setShow(false);
    }
  }, []);
  if (!show) return null;
  const close = () => {
    setShow(false);
    try {
      localStorage.setItem("dp-install-hint", "off");
    } catch {
      /* noop */
    }
  };
  return (
    <div className="install-hint">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>
      <p>ホーム画面に追加すると、次からワンタップで開けます。<Link href="/install">追加のしかた</Link></p>
      <button type="button" onClick={close} aria-label="案内を閉じる">×</button>
    </div>
  );
}
