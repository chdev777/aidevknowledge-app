// Compose modal — URL共有 / Q&A / 検証メモ / アプリ登録
const ComposeModal = ({ kind, onClose }) => {
  if (!kind) return null;

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const fetchPreview = () => {
    if (!url) return;
    setLoading(true);
    setPreview(null);
    setTimeout(() => {
      setLoading(false);
      const domain = (() => { try { return new URL(url.includes("://") ? url : "https://" + url).hostname.replace("www.", ""); } catch { return url; } })();
      const sourceType = domain.includes("youtube") ? "YouTube" : domain.includes("github") ? "GitHub" : domain.includes("x.com") || domain.includes("twitter") ? "X" : domain.includes("docs.") ? "公式Docs" : "記事";
      setPreview({
        title: "Open Graphから取得したタイトル（サンプル）",
        domain, sourceType,
        summary: "ページメタデータから自動抽出した概要。手動編集可能。"
      });
    }, 700);
  };

  const titles = { link: "URLを共有", qa: "質問を投稿", note: "検証メモを書く", app: "作成アプリを登録" };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{titles[kind]}</div>
          <button className="btn ghost sm" onClick={onClose}><Icon name="close" size={13}/></button>
        </div>
        <div className="modal-body">

          {kind === "link" && <>
            <div className="form-row">
              <label>URL</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
                <button className="btn sm" onClick={fetchPreview} disabled={!url || loading}>
                  {loading ? "取得中..." : "メタ取得"}
                </button>
              </div>
            </div>
            {(loading || preview) && (
              <div className="url-preview">
                {loading ? (
                  <div className="url-preview-loading">
                    <Icon name="refresh" size={12}/>Open Graphを取得中...
                  </div>
                ) : preview && (
                  <>
                    <div className="link-thumb" style={{ width: 48, height: 48 }}>
                      <span className="st-label">{sourceShort(preview.sourceType)}</span>
                    </div>
                    <div className="url-preview-ok">
                      <div className="url-preview-title">{preview.title}</div>
                      <div className="url-preview-domain">{preview.domain} · {preview.sourceType}</div>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="form-row">
              <label>概要</label>
              <textarea className="textarea" placeholder="ページの内容を一言で..." defaultValue={preview?.summary || ""}></textarea>
            </div>
            <div className="form-row">
              <label>共有コメント (なぜ共有したのか)</label>
              <textarea className="textarea" placeholder="どのプロジェクトで使えそうか、試した結果など..."></textarea>
            </div>
            <div className="form-row-grid">
              <div className="form-row">
                <label>種別</label>
                <select className="select" defaultValue={preview?.sourceType || ""}>
                  <option>YouTube</option><option>X</option><option>GitHub</option><option>記事</option><option>公式Docs</option>
                </select>
              </div>
              <div className="form-row">
                <label>重要度</label>
                <select className="select"><option>高</option><option>中</option><option>低</option></select>
              </div>
            </div>
            <div className="form-row-grid">
              <div className="form-row">
                <label>ステータス</label>
                <select className="select"><option>未確認</option><option>確認中</option><option>検証済み</option><option>採用候補</option><option>保留</option></select>
              </div>
              <div className="form-row">
                <label>プロジェクト</label>
                <select className="select">
                  <option value="">紐づけなし</option>
                  {MOCK.projects.map(p => <option key={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <label>タグ</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {MOCK.tags.slice(0, 10).map(t => <Tag key={t.id} tagId={t.id} />)}
                <span className="tag" style={{ cursor: "pointer" }}>+ 追加</span>
              </div>
            </div>
            <div className="form-row">
              <label>公開設定</label>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 4, display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer", fontSize: 12 }}>
                  <input type="radio" name="vis-l" defaultChecked />
                  <div>
                    <div style={{ fontWeight: 500, color: "var(--ink)", fontSize: 13 }}><Icon name="lock" size={11} style={{verticalAlign: "-1px"}}/> 非公開</div>
                    <div style={{ color: "var(--ink-3)", marginTop: 2 }}>自分だけが見られる</div>
                  </div>
                </label>
                <label style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 4, display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer", fontSize: 12 }}>
                  <input type="radio" name="vis-l" />
                  <div>
                    <div style={{ fontWeight: 500, color: "var(--ink)", fontSize: 13 }}><Icon name="globe" size={11} style={{verticalAlign: "-1px"}}/> 共有</div>
                    <div style={{ color: "var(--ink-3)", marginTop: 2 }}>DX推進・情報支援グループに公開</div>
                  </div>
                </label>
              </div>
            </div>
          </>}

          {kind === "qa" && <>
            <div className="form-row">
              <label>質問タイトル</label>
              <input className="input" placeholder="具体的に、一文で..." />
            </div>
            <div className="form-row">
              <label>本文</label>
              <textarea className="textarea" style={{ minHeight: 140 }} placeholder="背景、試したこと、期待する回答の粒度を記述..."></textarea>
            </div>
            <div className="form-row-grid">
              <div className="form-row">
                <label>プロジェクト</label>
                <select className="select">
                  <option value="">紐づけなし</option>
                  {MOCK.projects.map(p => <option key={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>タグ</label>
                <input className="input" placeholder="RAG, Dify..." />
              </div>
            </div>
          </>}

          {kind === "note" && <>
            <div className="form-row">
              <label>タイトル</label>
              <input className="input" placeholder="検証テーマ..." />
            </div>
            <div className="form-row">
              <label>目的 — 何を確認したかったか</label>
              <textarea className="textarea" placeholder="背景・仮説..."></textarea>
            </div>
            <div className="form-row">
              <label>試したこと — 設定・手順・条件</label>
              <textarea className="textarea" placeholder="使ったツール、パラメータ、データ..."></textarea>
            </div>
            <div className="form-row">
              <label>結果 — うまくいった点・課題</label>
              <textarea className="textarea" placeholder="数値・観察事実..."></textarea>
            </div>
            <div className="form-row">
              <label>結論 — 採用可否・今後の対応</label>
              <textarea className="textarea" placeholder="採用判断、次のアクション..."></textarea>
            </div>
            <div className="form-row">
              <label>プロジェクト</label>
              <select className="select">
                <option value="">紐づけなし</option>
                {MOCK.projects.map(p => <option key={p.id}>{p.name}</option>)}
              </select>
            </div>
          </>}

          {kind === "app" && <>
            <div className="form-row-grid">
              <div className="form-row">
                <label>アプリ名</label>
                <input className="input" placeholder="議事録要約アプリ..." />
              </div>
              <div className="form-row">
                <label>ステータス</label>
                <select className="select"><option>試作</option><option>検証中</option><option>利用中</option><option>改善中</option><option>停止中</option></select>
              </div>
            </div>
            <div className="form-row">
              <label>アプリURL</label>
              <input className="input" placeholder="https://apps.internal.example/..." />
            </div>
            <div className="form-row">
              <label>概要</label>
              <textarea className="textarea" placeholder="何をするアプリか..."></textarea>
            </div>
            <div className="form-row">
              <label>開発目的</label>
              <textarea className="textarea" placeholder="どの課題を解決するために作ったか..."></textarea>
            </div>
            <div className="form-row-grid">
              <div className="form-row">
                <label>使用技術</label>
                <input className="input" placeholder="Dify, Next.js, ..." />
              </div>
              <div className="form-row">
                <label>利用AI</label>
                <input className="input" placeholder="Claude 3.5 Sonnet, ..." />
              </div>
            </div>
            <div className="form-row-grid">
              <div className="form-row">
                <label>利用範囲</label>
                <select className="select"><option>個人検証</option><option>グループ内</option><option>関係者限定</option></select>
              </div>
              <div className="form-row">
                <label>プロジェクト</label>
                <select className="select">
                  <option value="">紐づけなし</option>
                  {MOCK.projects.map(p => <option key={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <label>注意事項 (入力禁止情報・既知の不具合など)</label>
              <textarea className="textarea"></textarea>
            </div>
          </>}
        </div>
        <div className="modal-foot">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-4)" }}>下書きは自動保存されます</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn sm" onClick={onClose}>キャンセル</button>
            <button className="btn primary sm" onClick={onClose}><Icon name="check" size={12}/>登録</button>
          </div>
        </div>
      </div>
    </div>
  );
};

window.ComposeModal = ComposeModal;
