import type { Metadata } from "next";

export const metadata: Metadata = { title: "ホーム画面に追加する方法" };

export default function InstallPage() {
  return (
    <div className="wrap section install-page">
      <h1 className="disp-head"><span>ONE TAP</span>ホーム画面に追加する方法</h1>
      <p>ホーム画面に追加すると、アプリのようにワンタップで開けます。</p>
      <div className="install-grid">
        <section className="install-card">
          <h2>iPhone（Safari）</h2>
          <ol>
            <li>SafariでDODGE PORTALを開き、画面下の<b>共有ボタン</b>（四角から上向きの矢印）を押す</li>
            <li>メニューを下にずらして<b>「ホーム画面に追加」</b>を押す</li>
            <li>右上の<b>「追加」</b>を押して完了</li>
          </ol>
        </section>
        <section className="install-card">
          <h2>Android（Chrome）</h2>
          <ol>
            <li>ChromeでDODGE PORTALを開き、右上の<b>︙（その他）</b>を押す</li>
            <li><b>「ホーム画面に追加」</b>または<b>「アプリをインストール」</b>を押す</li>
            <li><b>「追加」</b>（または「インストール」）を押して完了</li>
          </ol>
        </section>
      </div>
      <p className="small muted">ボタンの名前や場所は、OSやブラウザのバージョンによって少し違うことがあります。</p>
    </div>
  );
}
