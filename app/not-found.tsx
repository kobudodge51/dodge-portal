import Link from "next/link";

export default function NotFound() {
  return (
    <div className="detail" style={{ textAlign: "center", padding: "64px 16px" }}>
      <p className="kicker" style={{ color: "var(--ball)" }}>OUT!</p>
      <h1>ページが見つかりません</h1>
      <p className="muted">削除されたか、非表示になっている可能性があります。</p>
      <Link href="/" className="btn btn-primary">トップへ戻る</Link>
    </div>
  );
}
