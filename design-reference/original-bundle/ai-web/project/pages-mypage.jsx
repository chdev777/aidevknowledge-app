// ==========================================================
// My Page — 本人用の登録情報管理
// ==========================================================

const VisBadge = ({ v, onClick }) => (
  <span className="vis-badge" data-vis={v} onClick={onClick}>
    <Icon name={v === "shared" ? "globe" : "lock"} size={10}/>
    {v === "shared" ? "共有中" : "非公開"}
  </span>
);

const ConfirmDialog = ({ title, body, confirmLabel, onConfirm, onClose, primary }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="confirm" onClick={e => e.stopPropagation()}>
      <div className="confirm-head"><div className="confirm-title">{title}</div></div>
      <div className="confirm-body">{body}</div>
      <div className="confirm-foot">
        <button className="btn sm" onClick={onClose}>キャンセル</button>
        <button className={`btn sm ${primary ? "primary" : ""}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

const MyPage = ({ onOpen, onCompose }) => {
  const me = MOCK.currentUser;
  const user = MOCK.usersById[me];
  const [tab, setTab] = useState("urls");
  const [vis, setVis] = useState("all");
  const [confirm, setConfirm] = useState(null);
  // mutable visibility state (simulate toggle)
  const [vState, setVState] = useState(() => {
    const init = {};
    [...MOCK.links, ...MOCK.questions, ...MOCK.notes, ...MOCK.apps].forEach(x => {
      if (x.author === me) init[x.id] = x.visibility || "shared";
    });
    return init;
  });

  const myLinks = MOCK.links.filter(l => l.author === me);
  const myQs = MOCK.questions.filter(q => q.author === me);
  const myNotes = MOCK.notes.filter(n => n.author === me);
  const myApps = MOCK.apps.filter(a => a.author === me);

  const countVis = (arr, v) => arr.filter(x => (vState[x.id] || x.visibility) === v).length;

  const toggleVis = (id, nextVis) => {
    setConfirm({
      title: nextVis === "shared" ? "この情報を共有しますか？" : "この情報を非公開にしますか？",
      body: nextVis === "shared"
        ? "共有すると、DX推進担当者・情報支援グループのメンバーが閲覧できます。"
        : "非公開にすると、他の利用者は本文もコメントも閲覧できなくなります。再共有した場合、以前のコメントは再表示されます。",
      confirmLabel: nextVis === "shared" ? "共有する" : "非公開にする",
      primary: nextVis === "shared",
      onConfirm: () => { setVState({ ...vState, [id]: nextVis }); setConfirm(null); },
    });
  };

  const filterByVis = (arr) => {
    if (vis === "all") return arr;
    return arr.filter(x => (vState[x.id] || x.visibility) === vis);
  };

  const TABS = [
    { id: "urls", label: "自分のURL", count: myLinks.length, icon: "link" },
    { id: "qs", label: "自分の質問", count: myQs.length, icon: "qa" },
    { id: "notes", label: "自分の検証メモ", count: myNotes.length, icon: "note" },
    { id: "apps", label: "自分の作成アプリ", count: myApps.length, icon: "app" },
    { id: "comments", label: "コメント履歴", count: MOCK.myCommentHistory.length, icon: "message" },
    { id: "favorites", label: "お気に入り", count: MOCK.favorites.length, icon: "star" },
    { id: "drafts", label: "下書き", count: MOCK.drafts.length, icon: "draft" },
  ];

  const renderRow = (item, kind) => {
    const v = vState[item.id] || item.visibility;
    const nextV = v === "shared" ? "private" : "shared";
    const title = item.title || item.name;
    return (
      <div key={item.id} className="me-row">
        <div className="me-row-icon">
          {kind === "link" && sourceShort(item.sourceType)}
          {kind === "qa" && "Q&A"}
          {kind === "note" && "NOTE"}
          {kind === "app" && "APP"}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="me-row-title" onClick={() => onOpen(kind === "qa" ? "qa" : kind, item.id)}>{title}</div>
          <div className="me-row-meta">
            <VisBadge v={v} />
            {item.tags && item.tags.slice(0, 3).map(t => <Tag key={t} tagId={t} />)}
            {item.project && <span>· {MOCK.projectsById[item.project]?.name}</span>}
            <span>· {timeAgo(item.createdAt)}</span>
            {kind === "qa" && <span>· 回答 {item.answers}</span>}
            {kind === "app" && <span>· <StatusBadge status={item.status} /></span>}
          </div>
        </div>
        <div className="me-actions">
          <button className="btn xs" onClick={() => onOpen(kind === "qa" ? "qa" : kind, item.id)}>詳細</button>
          <button className="btn xs"><Icon name="edit" size={11}/>編集</button>
          <button className="btn xs" onClick={() => toggleVis(item.id, nextV)}>
            <Icon name={nextV === "shared" ? "globe" : "lock"} size={11}/>
            {nextV === "shared" ? "共有する" : "非公開にする"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="me-header">
        <div className="me-avatar" style={{ background: user.color + "22", color: user.color, borderColor: user.color + "44" }}>
          {user.name.split(" ").map(s => s[0]).join("").slice(0, 2)}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>MY PAGE</div>
          <div className="me-name">{user.name} <span style={{ color: "var(--ink-3)", fontSize: 14, fontWeight: 400 }}>さん</span></div>
          <div className="me-role">{user.role} · @{user.handle}</div>
          <div className="me-email">{user.handle}@example.ac.jp</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="btn sm" onClick={() => onCompose("link")}><Icon name="plus" size={12}/>URLを登録</button>
          <button className="btn sm" onClick={() => onCompose("note")}><Icon name="plus" size={12}/>検証メモを書く</button>
          <button className="btn sm" onClick={() => onCompose("app")}><Icon name="plus" size={12}/>作成アプリを登録</button>
        </div>
      </div>

      <div className="section-title">自分の登録状況</div>
      <div className="me-stats">
        <div className="me-stat">
          <div className="me-stat-label">登録URL</div>
          <div className="me-stat-value">{myLinks.length}<span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>件</span></div>
          <div className="me-stat-split">
            <span className="sp-shared">共有 {countVis(myLinks, "shared")}</span>
            <span className="sp-private">非公開 {countVis(myLinks, "private")}</span>
          </div>
        </div>
        <div className="me-stat">
          <div className="me-stat-label">質問</div>
          <div className="me-stat-value">{myQs.length}<span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>件</span></div>
          <div className="me-stat-split">
            <span>未回答 {myQs.filter(q => q.status === "未回答").length}</span>
            <span>回答済 {myQs.filter(q => q.status === "回答あり").length}</span>
          </div>
        </div>
        <div className="me-stat">
          <div className="me-stat-label">検証メモ</div>
          <div className="me-stat-value">{myNotes.length}<span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>件</span></div>
          <div className="me-stat-split">
            <span className="sp-shared">共有 {countVis(myNotes, "shared")}</span>
            <span className="sp-private">非公開 {countVis(myNotes, "private")}</span>
          </div>
        </div>
        <div className="me-stat">
          <div className="me-stat-label">作成アプリ</div>
          <div className="me-stat-value">{myApps.length}<span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>件</span></div>
          <div className="me-stat-split">
            <span className="sp-shared">共有 {countVis(myApps, "shared")}</span>
            <span className="sp-private">非公開 {countVis(myApps, "private")}</span>
          </div>
        </div>
        <div className="me-stat">
          <div className="me-stat-label">コメント</div>
          <div className="me-stat-value">{MOCK.myCommentHistory.length}<span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>件</span></div>
          <div className="me-stat-split">
            <span>下書き {MOCK.drafts.length}</span>
          </div>
        </div>
      </div>

      <div className="me-tabs">
        {TABS.map(t => (
          <div key={t.id} className={`me-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={12}/>
            {t.label}
            <span className="me-tab-count">{t.count}</span>
          </div>
        ))}
      </div>

      {["urls", "notes", "apps"].includes(tab) && (
        <div className="me-filter">
          <div className="vis-switch">
            <button className={vis === "all" ? "active" : ""} onClick={() => setVis("all")}>すべて</button>
            <button className={vis === "shared" ? "active" : ""} onClick={() => setVis("shared")}>共有中</button>
            <button className={vis === "private" ? "active" : ""} onClick={() => setVis("private")}>非公開</button>
          </div>
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--line)" }}>
        {tab === "urls" && filterByVis(myLinks).map(l => renderRow(l, "link"))}
        {tab === "qs" && myQs.map(q => renderRow(q, "qa"))}
        {tab === "notes" && filterByVis(myNotes).map(n => renderRow(n, "note"))}
        {tab === "apps" && filterByVis(myApps).map(a => renderRow(a, "app"))}
        {tab === "comments" && MOCK.myCommentHistory.map(c => (
          <div key={c.id} className="me-row">
            <div className="me-row-icon"><Icon name="message" size={12}/></div>
            <div style={{ minWidth: 0 }}>
              <div className="me-row-meta" style={{ marginBottom: 4 }}>
                <span className="comment-type" data-ctype={c.type}>{c.type}</span>
                <span>on</span>
                <b style={{ color: "var(--ink)", fontWeight: 500 }}>{c.appName}</b>
                <span>· {timeAgo(c.createdAt)}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{c.body}</div>
            </div>
            <div className="me-actions">
              <button className="btn xs" onClick={() => onOpen("app", c.appId)}>開く</button>
            </div>
          </div>
        ))}
        {tab === "favorites" && MOCK.favorites.map(id => {
          if (id.startsWith("l")) { const l = MOCK.linksById[id]; return l && <LinkRow key={id} link={l} onOpen={() => onOpen("link", id)} />; }
          if (id.startsWith("n")) { const n = MOCK.notesById[id]; return n && <NoteRow key={id} n={n} onOpen={() => onOpen("note", id)} />; }
          if (id.startsWith("q")) { const q = MOCK.questionsById[id]; return q && <QARow key={id} q={q} onOpen={() => onOpen("qa", id)} />; }
          if (id.startsWith("app")) { const a = MOCK.appsById[id]; return a && <AppRow key={id} a={a} onOpen={() => onOpen("app", id)} />; }
          return null;
        })}
        {tab === "drafts" && MOCK.drafts.map(d => (
          <div key={d.id} className="me-row">
            <div className="me-row-icon"><Icon name="draft" size={12}/></div>
            <div style={{ minWidth: 0 }}>
              <div className="me-row-title">{d.title}</div>
              <div className="me-row-meta">
                <span className="vis-badge" data-vis="private"><Icon name="draft" size={10}/>下書き</span>
                <span>· {d.kind === "link" ? "URL" : d.kind === "note" ? "検証メモ" : "質問"}</span>
                <span>· 更新 {timeAgo(d.updatedAt)}</span>
              </div>
            </div>
            <div className="me-actions">
              <button className="btn xs" onClick={() => onCompose(d.kind)}><Icon name="edit" size={11}/>編集を続ける</button>
              <button className="btn xs">破棄</button>
            </div>
          </div>
        ))}
      </div>

      {confirm && <ConfirmDialog {...confirm} onClose={() => setConfirm(null)} />}
    </div>
  );
};

Object.assign(window, { MyPage, VisBadge, ConfirmDialog });
