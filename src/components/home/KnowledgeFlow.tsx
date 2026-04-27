const STEPS = [
  { n: '01', t: '参考URLを共有', d: 'X・YouTube・GitHub等を登録し、なぜ共有したかを添える' },
  { n: '02', t: '質問・検証', d: 'Q&Aで疑問を投げ、実際に試した結果をメモに残す' },
  { n: '03', t: '試作アプリを公開', d: '社内URLとして共有し、利用範囲と注意事項を明示' },
  { n: '04', t: 'レビューで改善', d: '感想・改善提案・不具合・セキュリティ指摘を集約' },
];

export function KnowledgeFlow() {
  return (
    <div>
      <div className="section-title" style={{ marginBottom: 10 }}>
        ナレッジフロー
      </div>
      <div className="flow-diagram">
        {STEPS.map((s) => (
          <div key={s.n} className="flow-step">
            <div className="fs-num">{s.n}</div>
            <div className="fs-title">{s.t}</div>
            <div className="fs-desc">{s.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
