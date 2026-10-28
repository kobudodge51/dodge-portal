"use client";

import { useEffect, useState } from "react";

// 白い画面／黒い画面の切り替え（選んだ色はこの端末に保存）
export default function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    setLight(document.documentElement.dataset.theme === "light");
  }, []);
  const toggle = () => {
    const next = !light;
    setLight(next);
    if (next) document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("dp-theme", next ? "light" : "dark");
    } catch {
      /* 保存できない環境では、その場だけ切り替え */
    }
  };
  return (
    <button type="button" className={`theme-toggle${light ? " is-light" : ""}`} onClick={toggle} aria-label={light ? "黒い画面に切り替える" : "白い画面に切り替える"} title={light ? "黒い画面にする" : "白い画面にする"}>
      {light ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      )}
    </button>
  );
}
