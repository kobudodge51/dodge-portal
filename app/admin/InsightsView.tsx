import { loadInsightData, buildInsights } from "@/lib/insights";

export default async function InsightsView() {
  const groups = buildInsights(await loadInsightData());
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  const warns = groups.flatMap((g) => g.items.filter((i) => i.level === "warn"));
  return (
    <div>
      <p className="small muted">全{total}項目。アクセス記録は直近90日分、日付・時間はすべて日本時間です。</p>
      {warns.length > 0 && (
        <div className="notice-box" style={{ marginBottom: 20 }}>
          <b>いま確認したい項目（{warns.length}件）</b>
          <ul style={{ margin: "6px 0 0", paddingLeft: "1.2em" }}>
            {warns.map((w, i) => (
              <li key={i}>{w.label}：{w.value} — {w.note}</li>
            ))}
          </ul>
        </div>
      )}
      <nav className="chips">
        {groups.map((g, i) => (
          <a key={g.title} href={`#ins-${i}`} className="chip">{g.title}（{g.items.length}）</a>
        ))}
      </nav>
      {groups.map((g, i) => (
        <section key={g.title} id={`ins-${i}`} style={{ marginBottom: 28 }}>
          <h2>{g.title}</h2>
          <div className="insight-grid">
            {g.items.map((it, j) => (
              <div key={j} className={`insight insight-${it.level}`}>
                <p className="insight-label">{it.label}</p>
                <p className="insight-value">{it.value}</p>
                <p className="insight-note">{it.note}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
