import { lineReady, linkCode, siteUrl, ADMIN_KEY } from "@/lib/line";
import { getSetting } from "@/lib/settings";
import { adminLineTest, adminLineUnlink } from "@/app/actions";
import ActionForm from "@/components/ActionForm";

// 管理者ページ「LINE通知」タブ
export default async function LineView() {
  const ready = lineReady();
  const linked = await getSetting(ADMIN_KEY);
  const code = linkCode();
  const base = siteUrl() || "https://（サイトのアドレス）";
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 760 }}>
      <div className="panel" style={{ paddingBottom: 14 }}>
        <h2 style={{ marginTop: 0 }}>LINE通知の状態</h2>
        <table className="detail-table">
          <tbody>
            <tr><th>① LINEの鍵の設定</th><td>{ready ? "✅ 設定済み" : "❌ まだ（Vercelの環境変数 LINE_CHANNEL_ACCESS_TOKEN と LINE_CHANNEL_SECRET）"}</td></tr>
            <tr><th>② Webhook URL</th><td><code style={{ wordBreak: "break-all" }}>{base}/api/line/webhook</code></td></tr>
            <tr><th>③ あなたのLINEとの連携</th><td>{linked ? "✅ 連携済み" : "❌ まだ"}</td></tr>
            <tr><th>連携番号</th><td><b style={{ fontFamily: "var(--display)", fontSize: "1.6rem", letterSpacing: ".15em" }}>{code ?? "------"}</b><br /><span className="small muted">LINE公式アカウントを友だち追加し、この6けたの番号をトークで送ると連携されます。</span></td></tr>
          </tbody>
        </table>
      </div>
      <div className="panel" style={{ paddingBottom: 14 }}>
        <h2 style={{ marginTop: 0 }}>テスト</h2>
        <ActionForm action={adminLineTest} submitLabel="テスト通知を送る" compact />
        {linked && (
          <form action={adminLineUnlink} style={{ marginTop: 10 }}>
            <button className="btn btn-outline btn-sm" type="submit">LINEの連携を解除する</button>
          </form>
        )}
      </div>
      <div className="panel" style={{ paddingBottom: 14 }}>
        <h2 style={{ marginTop: 0 }}>通知が届くタイミング</h2>
        <ul className="small" style={{ margin: 0 }}>
          <li>大会予定の投稿／スレッド・返信の投稿／コラムの寄稿／通報 … 「OK」「NG（非表示）」のボタン付き</li>
          <li>お問い合わせ … 管理画面を開くボタン付き</li>
          <li>「OK」「NG」はLINEで押すだけで反映されます。「サイトで確認する」からはログインして内容を見てから選べます。</li>
        </ul>
      </div>
    </div>
  );
}
