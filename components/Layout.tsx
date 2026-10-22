import Link from "next/link";

export const SITE_NAME = "DODGE PORTAL";
export const SITE_TAGLINE = "全国のドッジボール情報が集まる場所";

const NAV = [
  { href: "/events", label: "大会予定" },
  { href: "/teams", label: "登録チーム" },
  { href: "/columns", label: "コラム" },
  { href: "/board", label: "交流掲示板" },
  { href: "/associations", label: "都道府県協会" },
];

export function Header() {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href="/" className="logo" aria-label={SITE_NAME}>
          <span className="logo-ball" aria-hidden="true" />
          <span className="logo-text">
            DODGE<b>PORTAL</b>
          </span>
        </Link>
        <nav className="nav" aria-label="メインメニュー">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-cols">
          <div>
            <p className="footer-logo">DODGE<b>PORTAL</b></p>
            <p className="muted">{SITE_TAGLINE}。掲載情報は利用者の投稿によるもので、正式な情報は各大会の主催者・各協会の発表をご確認ください。</p>
          </div>
          <ul className="footer-links">
            <li><Link href="/terms">利用規約</Link></li>
            <li><Link href="/guidelines">投稿ルール</Link></li>
            <li><Link href="/privacy">プライバシーポリシー</Link></li>
            <li><Link href="/contact">お問い合わせ・削除依頼</Link></li>
          </ul>
        </div>
        <p className="copy">© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>
    </footer>
  );
}

export function PageHead({ kicker, title, lead, action }: { kicker: string; title: string; lead?: string; action?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div className="wrap">
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {action && <div className="page-head-action">{action}</div>}
      </div>
    </div>
  );
}

export function NotConnected() {
  return <p className="notice-box">現在データベースに接続されていません。管理者の方は環境変数（SUPABASE_URL など）を設定してください。</p>;
}
