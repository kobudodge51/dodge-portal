"use client";

import { useEffect } from "react";

// 画面の表示中に問題が起きたときの案内（サイト更新の直後に古い画面のまま操作した場合など）
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="detail" style={{ textAlign: "center", padding: "64px 16px" }}>
      <h1 style={{ fontSize: "1.5rem" }}>画面を読み込み直してください</h1>
      <p className="muted">サイトが更新された直後などに、古い画面のまま操作すると表示できないことがあります。</p>
      <div className="page-head-action" style={{ justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>再読み込みする</button>
        <button className="btn btn-ghost" onClick={() => reset()}>もう一度試す</button>
      </div>
    </div>
  );
}
