import Link from "next/link";
import type { Metadata } from "next";
import { BLOCKS, PREFECTURES } from "@/lib/prefectures";
import { ASSOCIATIONS, JDBA_URL } from "@/lib/associations";
import { PageHead } from "@/components/Layout";

export const metadata: Metadata = { title: "都道府県ドッジボール協会一覧" };

export default function AssociationsPage() {
  return (
    <>
      <PageHead
        kicker="ASSOCIATIONS"
        title="都道府県ドッジボール協会"
        lead="全国47都道府県のドッジボール協会の公式ホームページへのリンク集です。大会の正式な情報は各協会の発表をご確認ください。"
      />
      <div className="wrap section">
        <p>
          全国組織：<a href={JDBA_URL} target="_blank" rel="noopener noreferrer">一般財団法人 日本ドッジボール協会</a>
        </p>
        <div className="blocks">
          {BLOCKS.map((b) => (
            <div className="block" key={b}>
              <h3>{b}</h3>
              <ul>
                {PREFECTURES.filter((p) => p.block === b).map((p) => {
                  const url = ASSOCIATIONS[p.name];
                  return (
                    <li key={p.code}>
                      <Link href={`/pref/${p.code}`}>{p.name}</Link>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="small">協会HP ↗</a>
                      ) : (
                        <span className="small muted">HP情報なし</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 16 }}>
          リンク先が変わっている・新しいホームページができた場合は、<Link href="/contact">お問い合わせ</Link>からお知らせください。
        </p>
      </div>
    </>
  );
}
