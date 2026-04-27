/**
 * 「ナレッジが流れず、蓄積される」運用イメージ図
 * pages-home.jsx のフロー図を CSS のみで再現
 */
const STEPS = [
  { id: 1, label: 'URL を共有', sub: 'なぜ参考になるかを残す' },
  { id: 2, label: '関係者がコメント', sub: '使い所・気づき' },
  { id: 3, label: '検証メモを書く', sub: '目的 / 試したこと / 結果 / 結論' },
  { id: 4, label: '試作アプリを作る', sub: '実装 / レビュー / 改善' },
  { id: 5, label: 'ノウハウとして蓄積', sub: '検索・再利用' },
];

export function KnowledgeFlow() {
  return (
    <section className="kflow">
      <div className="section-head">
        <h2 className="section-title">ナレッジフロー</h2>
        <span className="section-sub mono">流れない / 蓄積される</span>
      </div>
      <ol className="kflow-track">
        {STEPS.map((s) => (
          <li key={s.id} className="kflow-step">
            <div className="kflow-num mono">0{s.id}</div>
            <div className="kflow-label">{s.label}</div>
            <div className="kflow-sub mono">{s.sub}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
