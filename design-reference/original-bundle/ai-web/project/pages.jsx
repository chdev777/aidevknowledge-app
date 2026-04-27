// ==========================================================
// Page: URL共有一覧, Q&A, 検証メモ, 作成アプリ, プロジェクト, タグ
// ==========================================================

const FilterBar = ({ filters, value, onChange, groupLabel }) => (
  <div className="filter-bar">
    {groupLabel && <span className="filter-group-label">{groupLabel}</span>}
    {filters.map(f => (
      <div key={f.key}
           className={`filter-chip ${value === f.key ? "active" : ""}`}
           onClick={() => onChange(f.key)}>
        {f.label}
        {f.count !== undefined && <span className="chip-count">{f.count}</span>}
      </div>
    ))}
  </div>
);

// ---------- URL共有一覧 ----------
const LinksPage = ({ onOpen, onCompose }) => {
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState("list");

  const filtered = MOCK.links.filter(l =>
    (source === "all" || l.sourceType === source) &&
    (status === "all" || l.status === status)
  );

  const sources = [
    { key: "all", label: "すべて", count: MOCK.links.length },
    { key: "YouTube", label: "YouTube", count: MOCK.links.filter(l => l.sourceType === "YouTube").length },
    { key: "X", label: "X", count: MOCK.links.filter(l => l.sourceType === "X").length },
    { key: "GitHub", label: "GitHub", count: MOCK.links.filter(l => l.sourceType === "GitHub").length },
    { key: "記事", label: "記事", count: MOCK.links.filter(l => l.sourceType === "記事").length },
    { key: "公式Docs", label: "公式Docs", count: MOCK.links.filter(l => l.sourceType === "公式Docs").length },
  ];
  const statuses = [
    { key: "all", label: "すべて" },
    { key: "未確認", label: "未確認" },
    { key: "確認中", label: "確認中" },
    { key: "検証済み", label: "検証済み" },
    { key: "採用候補", label: "採用候補" },
    { key: "保留", label: "保留" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">01 · Links</div>
          <h1 className="page-title">URL共有</h1>
          <div className="page-sub">外部の参考情報を、なぜ共有したのか・何に使えそうかと共に蓄積する。</div>
        </div>
        <div className="page-header-actions">
          <button className="btn sm"><Icon name="sort" size={13}/>新しい順</button>
          <button className="btn primary sm" onClick={() => onCompose("link")}>
            <Icon name="plus" size={13}/>URLを共有
          </button>
        </div>
      </div>

      <FilterBar filters={sources} value={source} onChange={setSource} groupLabel="種別" />
      <FilterBar filters={statuses} value={status} onChange={setStatus} groupLabel="ステータス" />

      <div style={{ borderTop: "1px solid var(--line)", marginTop: 14 }}>
        {filtered.map(l => <LinkRow key={l.id} link={l} onOpen={() => onOpen("link", l.id)} />)}
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>該当するURLはありません</div>}
      </div>
    </div>
  );
};

// ---------- URL Detail ----------
const LinkDetail = ({ id, onBack, onOpen }) => {
  const l = MOCK.linksById[id];
  if (!l) return null;
  const author = MOCK.usersById[l.author];
  const project = l.project ? MOCK.projectsById[l.project] : null;

  return (
    <div className="page">
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 16 }}>
        ← URL共有に戻る
      </button>
      <div className="detail-layout">
        <div>
          <div className="detail-eyebrow">{l.sourceType} · {l.domain}</div>
          <h1 className="detail-title">{l.title}</h1>
          <div className="detail-meta">
            <Avatar userId={l.author} size="sm" />
            <span>{author.name}</span>
            <span className="dot-sep">·</span>
            <span>{timeAgo(l.createdAt)}</span>
            <span className="dot-sep">·</span>
            <StatusBadge status={l.status} />
            <Importance level={l.importance} />
          </div>

          <a href="#" onClick={(e) => e.preventDefault()} className="btn" style={{ marginBottom: 22 }}>
            <Icon name="ext" size={13} />
            {l.url}
          </a>

          <div style={{ marginBottom: 26 }}>
            <div className="section-title">概要</div>
            <div className="prose">{l.summary}</div>
          </div>

          <div style={{ marginBottom: 26 }}>
            <div className="section-title">共有コメント</div>
            <div className="card" style={{ padding: 18 }}>
              <div className="prose" style={{ margin: 0 }}>{l.userComment}</div>
            </div>
          </div>

          <div>
            <div className="section-title">タグ</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {l.tags.map(t => <Tag key={t} tagId={t} />)}
            </div>
          </div>
        </div>

        <div className="detail-aside">
          <div className="aside-section">
            <div className="aside-label">ステータス</div>
            <div className="aside-value"><StatusBadge status={l.status} /></div>
          </div>
          <div className="aside-section">
            <div className="aside-label">重要度</div>
            <div className="aside-value"><Importance level={l.importance} /></div>
          </div>
          <div className="aside-section">
            <div className="aside-label">共有者</div>
            <div className="aside-value" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar userId={l.author} size="sm" /> {author.name}
            </div>
          </div>
          {project && (
            <div className="aside-section">
              <div className="aside-label">プロジェクト</div>
              <div className="aside-value" style={{ cursor: "pointer" }} onClick={() => onOpen("project", project.id)}>
                <span style={{ display: "inline-block", width: 8, height: 8, background: project.color, borderRadius: 2, marginRight: 6 }}></span>
                {project.name}
              </div>
            </div>
          )}
          <div className="aside-section">
            <div className="aside-label">作成日時</div>
            <div className="aside-value mono" style={{ fontSize: 12 }}>
              {new Date(l.createdAt).toLocaleString("ja-JP")}
            </div>
          </div>
          <div className="aside-section">
            <button className="btn sm" style={{ width: "100%" }}><Icon name="star" size={13}/>お気に入り</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Q&A一覧 ----------
const QAPage = ({ onOpen, onCompose }) => {
  const [filter, setFilter] = useState("all");
  const filters = [
    { key: "all", label: "すべて", count: MOCK.questions.length },
    { key: "未回答", label: "未回答", count: MOCK.questions.filter(q => q.status === "未回答").length },
    { key: "回答あり", label: "回答あり", count: MOCK.questions.filter(q => q.status === "回答あり").length },
  ];
  const list = MOCK.questions.filter(q => filter === "all" || q.status === filter);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">02 · Questions</div>
          <h1 className="page-title">Q&A</h1>
          <div className="page-sub">AIアプリ開発に関する疑問を投稿し、回答を蓄積する。</div>
        </div>
        <div className="page-header-actions">
          <button className="btn primary sm" onClick={() => onCompose("qa")}>
            <Icon name="plus" size={13}/>質問する
          </button>
        </div>
      </div>
      <FilterBar filters={filters} value={filter} onChange={setFilter} />
      <div style={{ borderTop: "1px solid var(--line)", marginTop: 14 }}>
        {list.map(q => <QARow key={q.id} q={q} onOpen={() => onOpen("qa", q.id)} />)}
      </div>
    </div>
  );
};

// ---------- Q&A Detail ----------
const QADetail = ({ id, onBack }) => {
  const q = MOCK.questionsById[id];
  if (!q) return null;
  const answers = MOCK.answersByQ[id] || [];
  const author = MOCK.usersById[q.author];

  return (
    <div className="page">
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 16 }}>← Q&A一覧に戻る</button>
      <div className="detail-layout">
        <div>
          <div className="detail-eyebrow">QUESTION · #{q.id.toUpperCase()}</div>
          <h1 className="detail-title">{q.title}</h1>
          <div className="detail-meta">
            <Avatar userId={q.author} size="sm" />
            <span>{author.name}</span>
            <span className="dot-sep">·</span>
            <span>{timeAgo(q.createdAt)}</span>
            <span className="dot-sep">·</span>
            <span>{q.views} views</span>
            <span className="dot-sep">·</span>
            <StatusBadge status={q.status} />
          </div>
          <div className="prose" style={{ marginBottom: 24 }}>{q.body}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 30 }}>
            {q.tags.map(t => <Tag key={t} tagId={t} />)}
          </div>

          <div className="section-title">
            回答 <span className="section-count">({answers.length})</span>
          </div>

          {answers.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", border: "1px dashed var(--line)", borderRadius: 6 }}>
              まだ回答がありません。最初の回答を投稿してください。
            </div>
          )}

          {answers.map(a => {
            const au = MOCK.usersById[a.author];
            return (
              <div key={a.id} className={`answer-block ${a.accepted ? "accepted" : ""}`}>
                <div className="vote-col">
                  <button className="vote-btn"><Icon name="chevron" size={12} style={{transform: "rotate(-90deg)"}}/></button>
                  <div className="vote-count">{a.votes}</div>
                  <button className="vote-btn"><Icon name="chevron" size={12} style={{transform: "rotate(90deg)"}}/></button>
                </div>
                <div>
                  <div className="answer-header">
                    <Avatar userId={a.author} size="sm" />
                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>{au.name}</span>
                    <span className="dot-sep">·</span>
                    <span>{timeAgo(a.createdAt)}</span>
                    {a.accepted && <span className="accepted-mark"><Icon name="check" size={10}/> 採用回答</span>}
                  </div>
                  <div className="answer-body">{a.body}</div>
                </div>
              </div>
            );
          })}

          <div className="composer" style={{ marginTop: 24 }}>
            <textarea placeholder="回答を入力..."></textarea>
            <div className="composer-foot">
              <span className="composer-hint">Markdown対応 · ⌘ + Enter で投稿</span>
              <button className="btn primary sm"><Icon name="send" size={12}/>投稿</button>
            </div>
          </div>
        </div>

        <div className="detail-aside">
          <div className="aside-section">
            <div className="aside-label">ステータス</div>
            <div className="aside-value"><StatusBadge status={q.status} /></div>
          </div>
          <div className="aside-section">
            <div className="aside-label">質問者</div>
            <div className="aside-value" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar userId={q.author} size="sm" /> {author.name}
            </div>
          </div>
          <div className="aside-section">
            <div className="aside-label">回答 / 閲覧</div>
            <div className="aside-value mono">{q.answers} / {q.views}</div>
          </div>
          {q.project && (
            <div className="aside-section">
              <div className="aside-label">プロジェクト</div>
              <div className="aside-value">
                <span style={{ display: "inline-block", width: 8, height: 8, background: MOCK.projectsById[q.project].color, borderRadius: 2, marginRight: 6 }}></span>
                {MOCK.projectsById[q.project].name}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- 検証メモ一覧 ----------
const NotesPage = ({ onOpen, onCompose }) => (
  <div className="page">
    <div className="page-header">
      <div>
        <div className="page-eyebrow">03 · Notes</div>
        <h1 className="page-title">検証メモ</h1>
        <div className="page-sub">実際に試した結果を、目的・方法・結果・結論の構造で蓄積する。</div>
      </div>
      <div className="page-header-actions">
        <button className="btn primary sm" onClick={() => onCompose("note")}><Icon name="plus" size={13}/>メモを書く</button>
      </div>
    </div>
    <div style={{ borderTop: "1px solid var(--line)" }}>
      {MOCK.notes.map(n => <NoteRow key={n.id} n={n} onOpen={() => onOpen("note", n.id)} />)}
    </div>
  </div>
);

// ---------- 検証メモ詳細 ----------
const NoteDetail = ({ id, onBack, onOpen }) => {
  const n = MOCK.notesById[id];
  if (!n) return null;
  const author = MOCK.usersById[n.author];
  return (
    <div className="page">
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 16 }}>← 検証メモに戻る</button>
      <div className="detail-layout">
        <div>
          <div className="detail-eyebrow">VERIFICATION NOTE · #{n.id.toUpperCase()}</div>
          <h1 className="detail-title">{n.title}</h1>
          <div className="detail-meta">
            <Avatar userId={n.author} size="sm" />
            <span>{author.name}</span>
            <span className="dot-sep">·</span>
            <span>{timeAgo(n.createdAt)}</span>
            {n.project && <>
              <span className="dot-sep">·</span>
              <span>{MOCK.projectsById[n.project].name}</span>
            </>}
          </div>
          <div className="note-fields">
            <div className="note-field">
              <div className="note-field-label">目的</div>
              <div className="note-field-value">{n.purpose}</div>
            </div>
            <div className="note-field">
              <div className="note-field-label">試したこと</div>
              <div className="note-field-value">{n.tried}</div>
            </div>
            <div className="note-field">
              <div className="note-field-label">結果</div>
              <div className="note-field-value">{n.result}</div>
            </div>
            <div className="note-field">
              <div className="note-field-label">結論</div>
              <div className="note-field-value" style={{ color: "var(--ink)" }}>{n.conclusion}</div>
            </div>
          </div>

          <div style={{ marginTop: 26 }}>
            <div className="section-title">関連URL</div>
            <div style={{ borderTop: "1px solid var(--line-2)" }}>
              {n.relatedLinks.map(lid => {
                const l = MOCK.linksById[lid];
                return l && <LinkRow key={lid} link={l} onOpen={() => onOpen("link", l.id)} />;
              })}
            </div>
          </div>
        </div>

        <div className="detail-aside">
          <div className="aside-section">
            <div className="aside-label">作成者</div>
            <div className="aside-value" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar userId={n.author} size="sm" /> {author.name}
            </div>
          </div>
          <div className="aside-section">
            <div className="aside-label">タグ</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {n.tags.map(t => <Tag key={t} tagId={t} />)}
            </div>
          </div>
          {n.project && (
            <div className="aside-section">
              <div className="aside-label">プロジェクト</div>
              <div className="aside-value">
                <span style={{ display: "inline-block", width: 8, height: 8, background: MOCK.projectsById[n.project].color, borderRadius: 2, marginRight: 6 }}></span>
                {MOCK.projectsById[n.project].name}
              </div>
            </div>
          )}
          <div className="aside-section">
            <div className="aside-label">作成日時</div>
            <div className="aside-value mono" style={{ fontSize: 12 }}>{new Date(n.createdAt).toLocaleString("ja-JP")}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- 作成アプリ一覧 ----------
const AppsPage = ({ onOpen, onCompose }) => {
  const [status, setStatus] = useState("all");
  const filters = [
    { key: "all", label: "すべて", count: MOCK.apps.length },
    { key: "試作", label: "試作" },
    { key: "検証中", label: "検証中" },
    { key: "利用中", label: "利用中" },
    { key: "改善中", label: "改善中" },
  ];
  const list = MOCK.apps.filter(a => status === "all" || a.status === status);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">04 · Apps</div>
          <h1 className="page-title">作成アプリ</h1>
          <div className="page-sub">担当者が作成したAIアプリと、関係者からのコメント・レビューを集約する。</div>
        </div>
        <div className="page-header-actions">
          <button className="btn primary sm" onClick={() => onCompose("app")}><Icon name="plus" size={13}/>アプリを登録</button>
        </div>
      </div>
      <FilterBar filters={filters} value={status} onChange={setStatus} groupLabel="ステータス" />
      <div style={{ borderTop: "1px solid var(--line)", marginTop: 14 }}>
        {list.map(a => <AppRow key={a.id} a={a} onOpen={() => onOpen("app", a.id)} />)}
      </div>
    </div>
  );
};

// ---------- 作成アプリ詳細 ----------
const AppDetail = ({ id, onBack, onOpen }) => {
  const a = MOCK.appsById[id];
  const [commentType, setCommentType] = useState("感想");
  const [newComments, setNewComments] = useState([]);
  const [draft, setDraft] = useState("");
  if (!a) return null;
  const author = MOCK.usersById[a.author];
  const project = a.project ? MOCK.projectsById[a.project] : null;
  const comments = [...(MOCK.commentsByApp[id] || []), ...newComments];
  const types = ["感想", "改善提案", "不具合報告", "活用アイデア", "技術メモ", "セキュリティ指摘"];

  const submit = () => {
    if (!draft.trim()) return;
    setNewComments([{
      id: "nc" + Date.now(), author: "u1", type: commentType,
      createdAt: new Date().toISOString(), body: draft
    }, ...newComments]);
    setDraft("");
  };

  return (
    <div className="page">
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 16 }}>← 作成アプリ一覧に戻る</button>

      <div className="app-hero">
        <div className="app-icon">{a.name.slice(0, 1)}</div>
        <div>
          <div className="detail-eyebrow">APPLICATION</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 2 }}>{a.name}</div>
          <a className="app-url" href="#" onClick={e => e.preventDefault()}>
            <Icon name="ext" size={12}/> {a.url}
          </a>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <StatusBadge status={a.status} />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 10 }}>
            <span><Icon name="eye" size={11} style={{verticalAlign: "-2px"}}/> {a.stats.views}</span>
            <span><Icon name="message" size={11} style={{verticalAlign: "-2px"}}/> {a.stats.comments}</span>
            <span><Icon name="heart" size={11} style={{verticalAlign: "-2px"}}/> {a.stats.likes}</span>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        <div>
          <div style={{ marginBottom: 24 }}>
            <div className="section-title">概要</div>
            <div className="prose">{a.summary}</div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div className="section-title">開発目的</div>
            <div className="prose">{a.purpose}</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div className="section-title">仕様</div>
            <div className="app-specs">
              <div className="app-spec"><div className="spec-label">利用AI</div><div className="spec-value mono">{a.aiModel}</div></div>
              <div className="app-spec"><div className="spec-label">ステータス</div><div className="spec-value"><StatusBadge status={a.status} /></div></div>
              <div className="app-spec"><div className="spec-label">使用技術</div><div className="spec-value">{a.technologies.join(" · ")}</div></div>
              <div className="app-spec"><div className="spec-label">利用範囲</div><div className="spec-value">{a.usageScope}</div></div>
            </div>
            {a.caution && (
              <div className="caution">
                <div className="caution-label">⚠ 注意事項</div>
                {a.caution}
              </div>
            )}
          </div>

          <div className="section-title">
            コメント・レビュー <span className="section-count">({comments.length})</span>
          </div>

          <div className="composer">
            <div className="composer-types">
              {types.map(t => (
                <span key={t}
                      className={`comment-type ${commentType === t ? "active" : ""}`}
                      data-ctype={t}
                      style={commentType === t ? { background: "var(--ink)", color: "var(--bg)", borderColor: "var(--ink)" } : { cursor: "pointer" }}
                      onClick={() => setCommentType(t)}>
                  {t}
                </span>
              ))}
            </div>
            <textarea placeholder={`${commentType}を入力...`} value={draft} onChange={e => setDraft(e.target.value)}></textarea>
            <div className="composer-foot">
              <span className="composer-hint">種別: {commentType} · ⌘ + Enter で投稿</span>
              <button className="btn primary sm" onClick={submit}><Icon name="send" size={12}/>投稿</button>
            </div>
          </div>

          <div className="comments-feed" style={{ marginTop: 16 }}>
            {comments.map(c => {
              const cu = MOCK.usersById[c.author];
              return (
                <div key={c.id} className="comment-item">
                  <Avatar userId={c.author} size="sm" />
                  <div>
                    <div className="comment-meta">
                      <span className="comment-author">{cu.name}</span>
                      <span className="comment-type" data-ctype={c.type}>{c.type}</span>
                      <span className="comment-time">{timeAgo(c.createdAt)}</span>
                    </div>
                    <div className="comment-body">{c.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="detail-aside">
          <div className="aside-section">
            <div className="aside-label">作成者</div>
            <div className="aside-value" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar userId={a.author} size="sm" /> {author.name}
            </div>
          </div>
          {project && (
            <div className="aside-section">
              <div className="aside-label">プロジェクト</div>
              <div className="aside-value" style={{ cursor: "pointer" }} onClick={() => onOpen("project", project.id)}>
                <span style={{ display: "inline-block", width: 8, height: 8, background: project.color, borderRadius: 2, marginRight: 6 }}></span>
                {project.name}
              </div>
            </div>
          )}
          <div className="aside-section">
            <div className="aside-label">タグ</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {a.tags.map(t => <Tag key={t} tagId={t} />)}
            </div>
          </div>
          <div className="aside-section">
            <div className="aside-label">作成日時</div>
            <div className="aside-value mono" style={{ fontSize: 12 }}>{new Date(a.createdAt).toLocaleString("ja-JP")}</div>
          </div>
          <div className="aside-section">
            <button className="btn primary sm" style={{ width: "100%" }}><Icon name="ext" size={12}/>アプリを開く</button>
            <button className="btn sm" style={{ width: "100%", marginTop: 6 }}><Icon name="heart" size={12}/>いいね</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- プロジェクト一覧 ----------
const ProjectsPage = ({ onOpen }) => (
  <div className="page">
    <div className="page-header">
      <div>
        <div className="page-eyebrow">05 · Projects</div>
        <h1 className="page-title">プロジェクト</h1>
        <div className="page-sub">URL・質問・検証メモ・作成アプリをプロジェクト単位でまとめて把握する。</div>
      </div>
    </div>
    <div className="project-grid">
      {MOCK.projects.map(p => (
        <div key={p.id} className="project-card" onClick={() => onOpen("project", p.id)}>
          <div className="project-card-head">
            <div className="project-swatch" style={{ background: p.color }}></div>
            <div className="project-name">{p.name}</div>
          </div>
          <div className="project-desc">{p.description}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <StatusBadge status={p.status} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>
              オーナー: {MOCK.usersById[p.owner].name}
            </span>
          </div>
          <div className="project-stats">
            <div className="project-stat"><div className="p-num">{p.links}</div><div className="p-lbl">URL</div></div>
            <div className="project-stat"><div className="p-num">{p.questions}</div><div className="p-lbl">質問</div></div>
            <div className="project-stat"><div className="p-num">{p.notes}</div><div className="p-lbl">メモ</div></div>
            <div className="project-stat"><div className="p-num">{p.apps}</div><div className="p-lbl">アプリ</div></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------- プロジェクト詳細 ----------
const ProjectDetail = ({ id, onBack, onOpen }) => {
  const p = MOCK.projectsById[id];
  if (!p) return null;
  const projectLinks = MOCK.links.filter(l => l.project === id);
  const projectQs = MOCK.questions.filter(q => q.project === id);
  const projectNotes = MOCK.notes.filter(n => n.project === id);
  const projectApps = MOCK.apps.filter(a => a.project === id);

  return (
    <div className="page">
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 16 }}>← プロジェクト一覧</button>
      <div className="page-header">
        <div>
          <div className="page-eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: p.color, borderRadius: 2 }}></span>
            PROJECT
          </div>
          <h1 className="page-title">{p.name}</h1>
          <div className="page-sub">{p.description}</div>
        </div>
        <div className="page-header-actions">
          <StatusBadge status={p.status} />
        </div>
      </div>

      {projectApps.length > 0 && <>
        <div className="section-title">このプロジェクトのアプリ <span className="section-count">({projectApps.length})</span></div>
        <div style={{ borderTop: "1px solid var(--line)", marginBottom: 30 }}>
          {projectApps.map(a => <AppRow key={a.id} a={a} onOpen={() => onOpen("app", a.id)} />)}
        </div>
      </>}

      {projectLinks.length > 0 && <>
        <div className="section-title">関連URL <span className="section-count">({projectLinks.length})</span></div>
        <div style={{ borderTop: "1px solid var(--line)", marginBottom: 30 }}>
          {projectLinks.map(l => <LinkRow key={l.id} link={l} onOpen={() => onOpen("link", l.id)} />)}
        </div>
      </>}

      {projectNotes.length > 0 && <>
        <div className="section-title">検証メモ <span className="section-count">({projectNotes.length})</span></div>
        <div style={{ borderTop: "1px solid var(--line)", marginBottom: 30 }}>
          {projectNotes.map(n => <NoteRow key={n.id} n={n} onOpen={() => onOpen("note", n.id)} />)}
        </div>
      </>}

      {projectQs.length > 0 && <>
        <div className="section-title">関連する質問 <span className="section-count">({projectQs.length})</span></div>
        <div style={{ borderTop: "1px solid var(--line)" }}>
          {projectQs.map(q => <QARow key={q.id} q={q} onOpen={() => onOpen("qa", q.id)} />)}
        </div>
      </>}
    </div>
  );
};

// ---------- タグ一覧 ----------
const TagsPage = () => {
  const grouped = {};
  MOCK.tags.forEach(t => { (grouped[t.type] = grouped[t.type] || []).push(t); });
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">06 · Tags</div>
          <h1 className="page-title">タグ</h1>
          <div className="page-sub">技術・ツール・用途・セキュリティなど、情報を分類する軸。</div>
        </div>
      </div>
      {Object.entries(grouped).map(([type, tags]) => (
        <div key={type} style={{ marginBottom: 30 }}>
          <div className="section-title">{type} <span className="section-count">({tags.length})</span></div>
          <div className="tag-grid">
            {tags.map(t => (
              <div key={t.id} className="tag-cell">
                <span className="tag-name">
                  <span className="tag-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: {
                    "技術": "oklch(0.68 0.10 250)", "ツール": "oklch(0.65 0.10 150)", "開発": "oklch(0.58 0.14 55)",
                    "用途": "oklch(0.72 0.12 85)", "セキュリティ": "oklch(0.55 0.12 20)"
                  }[type], display: "inline-block" }}></span>
                  {t.name}
                </span>
                <span className="tag-count">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------- Favorites ----------
const FavoritesPage = ({ onOpen }) => {
  const items = MOCK.favorites.map(id => {
    if (id.startsWith("l")) return { type: "link", data: MOCK.linksById[id] };
    if (id.startsWith("n")) return { type: "note", data: MOCK.notesById[id] };
    if (id.startsWith("q")) return { type: "qa", data: MOCK.questionsById[id] };
    if (id.startsWith("app")) return { type: "app", data: MOCK.appsById[id] };
    return null;
  }).filter(Boolean);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">07 · Favorites</div>
          <h1 className="page-title">お気に入り</h1>
          <div className="page-sub">あなたがピン留めしたURL・メモ・質問・アプリ。</div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--line)" }}>
        {items.map((it, i) => {
          if (it.type === "link") return <LinkRow key={i} link={it.data} onOpen={() => onOpen("link", it.data.id)} />;
          if (it.type === "note") return <NoteRow key={i} n={it.data} onOpen={() => onOpen("note", it.data.id)} />;
          if (it.type === "qa") return <QARow key={i} q={it.data} onOpen={() => onOpen("qa", it.data.id)} />;
          if (it.type === "app") return <AppRow key={i} a={it.data} onOpen={() => onOpen("app", it.data.id)} />;
        })}
      </div>
    </div>
  );
};

Object.assign(window, { LinksPage, LinkDetail, QAPage, QADetail, NotesPage, NoteDetail, AppsPage, AppDetail, ProjectsPage, ProjectDetail, TagsPage, FavoritesPage, FilterBar });
