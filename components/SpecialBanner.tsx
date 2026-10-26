import Link from "next/link";
import { JOSHI_SOGO as J } from "@/lib/specials";

// トップページの特設ページ案内
export default function SpecialBanner({ today }: { today: string }) {
  if (today > J.date) return null;
  const a = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  const b = Date.UTC(+J.date.slice(0, 4), +J.date.slice(5, 7) - 1, +J.date.slice(8, 10));
  const left = Math.round((b - a) / 86400000);
  return (
    <div className="wrap">
      <Link href={`/special/${J.slug}`} className="sp-banner">
        <span className="sp-tag">SPECIAL</span>
        <span className="sp-body">
          <span className="sp-title">{J.edition} 全日本<b>女子</b>総合ドッジボール選手権</span>
          <span className="sp-meta">12.13 SUN｜{J.venue}｜全国の予選会まとめ</span>
        </span>
        <span className="sp-count">{left > 0 ? <>あと<b>{left}</b>日</> : <b>本日</b>}</span>
        <span className="sp-go" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
