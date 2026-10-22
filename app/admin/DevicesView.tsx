import { db, safeList } from "@/lib/supabase";
import { fmtDateTime, excerpt } from "@/lib/format";
import { adminBlock, adminUnblock, adminHideDevice } from "@/app/actions";
import ConfirmButton from "@/components/ConfirmButton";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

type Device = {
  id: string;
  posts: number;
  hidden: number;
  reportsReceived: number;
  reportsFiled: number;
  rejected: Record<string, number>;
  last: string;
  sample: string;
  blocked: boolean;
  score: number;
};

const REJ_LABEL: Record<string, string> = { contact: "連絡先", ng: "禁止ワード", links: "リンク過多", rate: "連続投稿", bot: "ボット", blocked: "停止中に試行" };

export default async function DevicesView({ show }: { show: string }) {
  const [events, threads, replies, reports, logs, blocks] = await Promise.all([
    safeList<Row>(() => db().from("portal_events").select("ip_hash,title,is_hidden,report_count,created_at").limit(20000)),
    safeList<Row>(() => db().from("portal_threads").select("ip_hash,title,is_hidden,report_count,created_at").limit(20000)),
    safeList<Row>(() => db().from("portal_replies").select("ip_hash,body,is_hidden,report_count,created_at").limit(50000)),
    safeList<Row>(() => db().from("portal_reports").select("ip_hash,created_at").limit(20000)),
    safeList<Row>(() => db().from("portal_post_logs").select("ip_hash,kind,created_at").like("kind", "rejected%").limit(50000)),
    safeList<Row>(() => db().from("portal_blocks").select("ip_hash,reason,created_at").limit(5000)),
  ]);

  const map = new Map<string, Device>();
  const get = (id: string) => {
    if (!map.has(id)) map.set(id, { id, posts: 0, hidden: 0, reportsReceived: 0, reportsFiled: 0, rejected: {}, last: "", sample: "", blocked: false, score: 0 });
    return map.get(id)!;
  };
  const touch = (dv: Device, at: string) => {
    if (at > dv.last) dv.last = at;
  };
  for (const r of [...events, ...threads, ...replies]) {
    if (!r.ip_hash) continue;
    const dv = get(r.ip_hash);
    dv.posts++;
    if (r.is_hidden) dv.hidden++;
    dv.reportsReceived += r.report_count ?? 0;
    if (!dv.sample) dv.sample = r.title ?? excerpt(r.body ?? "", 40);
    touch(dv, r.created_at);
  }
  for (const r of reports) if (r.ip_hash) { const dv = get(r.ip_hash); dv.reportsFiled++; touch(dv, r.created_at); }
  for (const l of logs) {
    if (!l.ip_hash) continue;
    const dv = get(l.ip_hash);
    const k = String(l.kind).replace("rejected:", "");
    dv.rejected[k] = (dv.rejected[k] ?? 0) + 1;
    touch(dv, l.created_at);
  }
  for (const b of blocks) get(b.ip_hash).blocked = true;
  for (const dv of map.values()) {
    const rej = Object.values(dv.rejected).reduce((a, b) => a + b, 0);
    dv.score = dv.hidden * 5 + dv.reportsReceived * 2 + rej + (dv.reportsFiled >= 10 ? 3 : 0);
  }

  let list = [...map.values()];
  if (show === "all") list.sort((a, b) => (b.last > a.last ? 1 : -1));
  else if (show === "blocked") list = list.filter((d) => d.blocked);
  else list = list.filter((d) => d.score > 0 || d.blocked).sort((a, b) => b.score - a.score);
  list = list.slice(0, 200);

  return (
    <div>
      <p className="small muted">
        会員登録のないサイトなので、「端末」は投稿時の接続情報を元に戻せない形に変えた記号（8文字）で区別しています。同じ人でも、スマホとPC、自宅と外出先では別の端末として表示されることがあります。
      </p>
      <div className="chips">
        <a href="/admin?tab=devices" className={show === "" ? "chip on" : "chip"}>要注意（警告あり）</a>
        <a href="/admin?tab=devices&show=blocked" className={show === "blocked" ? "chip on" : "chip"}>投稿停止中</a>
        <a href="/admin?tab=devices&show=all" className={show === "all" ? "chip on" : "chip"}>すべて</a>
      </div>
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr><th>端末</th><th>警告度</th><th>投稿</th><th>非表示</th><th>受けた通報</th><th>出した通報</th><th>はじかれた投稿</th><th>最終活動</th><th>操作</th></tr>
          </thead>
          <tbody>
            {list.map((dv) => (
              <tr key={dv.id} style={dv.blocked ? { background: "#fdecee" } : undefined}>
                <td><b>{dv.id.slice(0, 8)}</b>{dv.blocked && <><br /><span className="tag" style={{ color: "var(--danger)" }}>投稿停止中</span></>}{dv.sample && <><br /><span className="small muted">例：{dv.sample}</span></>}</td>
                <td><span className={dv.score >= 10 ? "tag tag-pref" : dv.score > 0 ? "tag tag-court" : "tag"}>{dv.score}</span></td>
                <td>{dv.posts}</td>
                <td>{dv.hidden}</td>
                <td>{dv.reportsReceived}</td>
                <td>{dv.reportsFiled}</td>
                <td className="small">{Object.entries(dv.rejected).map(([k, v]) => `${REJ_LABEL[k] ?? k} ${v}`).join("・") || "—"}</td>
                <td className="small">{dv.last ? fmtDateTime(dv.last) : "—"}</td>
                <td>
                  <div className="admin-actions">
                    {dv.blocked ? (
                      <form action={adminUnblock}><input type="hidden" name="ip_hash" value={dv.id} /><button className="btn btn-outline btn-sm">停止を解除</button></form>
                    ) : (
                      <form action={adminBlock}><input type="hidden" name="ip_hash" value={dv.id} /><ConfirmButton label="投稿を停止" message="この端末からの投稿・返信を停止します。よろしいですか？" /></form>
                    )}
                    {dv.posts > dv.hidden && (
                      <form action={adminHideDevice}><input type="hidden" name="ip_hash" value={dv.id} /><ConfirmButton className="btn btn-outline btn-sm" label="投稿をすべて非表示" message="この端末の投稿をすべて非表示にします。よろしいですか？" /></form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="empty">{show === "blocked" ? "投稿停止中の端末はありません。" : show === "all" ? "まだ記録がありません。" : "警告が上がっている端末はありません。"}</p>}
      </div>
      <p className="small muted">警告度＝非表示の投稿×5＋受けた通報×2＋はじかれた投稿の数（通報を10件以上出している端末は＋3）。</p>
    </div>
  );
}
