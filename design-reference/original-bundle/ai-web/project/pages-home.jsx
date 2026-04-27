// ==========================================================
// Page: Home (dashboard)
// ==========================================================
const { useState: useStateH } = React;

const HeroAction = ({ icon, label, sub, onClick }) => (
  <button className="hero-action" onClick={onClick}>
    <div className="ha-ico"><Icon name={icon} size={14} /></div>
    <div style={{ minWidth: 0 }}>
      <div className="ha-label">{label}</div>
      <div className="ha-sub">{sub}</div>
    </div>
  </button>
);

const LinkRow = ({ link, onOpen }) => {
  const author = MOCK.usersById[link.author];
  const project = link.project ? MOCK.projectsById[link.project] : null;
  return (
    <div className="link-row" onClick={() => onOpen && onOpen(link)}>
      <div className="link-thumb" style={{ color: link.thumbnailAccent }}>
        <span className="st-label">{sourceShort(link.sourceType)}</span>
      </div>
      <div className="link-body">
        <div className="link-title">{link.title}</div>
        <div className="link-domain">{link.domain} · {link.sourceType}</div>
        <div className="link-summary">{link.summary}</div>
        <div className="link-meta">
          {link.tags.slice(0, 4).map(t => <Tag key={t} tagId={t} />)}
          {project && <span className="tag" data-type="用途"><span className="tag-dot" style={{background: project.color}}></span>{project.name}</span>}
        </div>
      </div>
      <div className="link-aside">
        <StatusBadge status={link.status} />
        <Importance level={link.importance} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
          <Avatar userId={link.author} size="sm" />
          {timeAgo(link.createdAt)}
        </div>
      </div>
    </div>
  );
};

const QARow = ({ q, onOpen }) => (
  <div className="qa-row" onClick={() => onOpen && onOpen(q)}>
    <div className="qa-count">
      <div className={`num ${q.answers === 0 ? "zero" : ""}`}>{q.answers}</div>
      <div className="lbl">回答</div>
    </div>
    <div className="qa-body">
      <div className="qa-title">{q.title}</div>
      <div className="qa-excerpt">{q.body}</div>
      <div className="qa-meta">
        {q.tags.map(t => <Tag key={t} tagId={t} />)}
        <span className="dot-sep">·</span>
        <span>{MOCK.usersById[q.author].name}</span>
        <span className="dot-sep">·</span>
        <span>{timeAgo(q.createdAt)}</span>
        <span className="dot-sep">·</span>
        <span>{q.views} views</span>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <StatusBadge status={q.status} />
    </div>
  </div>
);

const NoteRow = ({ n, onOpen }) => (
  <div className="row" style={{ gridTemplateColumns: "1fr auto" }} onClick={() => onOpen && onOpen(n)}>
    <div>
      <div className="row-title">{n.title}</div>
      <div style={{ fontSize: 12, color: "var(--ink-3)", margin: "4px 0 8px", lineHeight: 1.55 }}>
        <b style={{ color: "var(--ink-2)", fontWeight: 500 }}>目的:</b> {n.purpose}
      </div>
      <div className="row-meta">
        {n.tags.slice(0, 3).map(t => <Tag key={t} tagId={t} />)}
        <span className="dot-sep">·</span>
        <span>{MOCK.usersById[n.author].name}</span>
        <span className="dot-sep">·</span>
        <span>{timeAgo(n.createdAt)}</span>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, minWidth: 100 }}>
      {n.project && <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{MOCK.projectsById[n.project].name}</span>}
      <span style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>
        関連URL {n.relatedLinks.length}
      </span>
    </div>
  </div>
);

const AppRow = ({ a, onOpen }) => {
  const project = a.project ? MOCK.projectsById[a.project] : null;
  return (
    <div className="row" style={{ gridTemplateColumns: "auto 1fr auto", gap: 18 }} onClick={() => onOpen && onOpen(a)}>
      <div className="app-icon" style={{ width: 42, height: 42, fontSize: 16 }}>
        {a.name.slice(0, 1)}
      </div>
      <div>
        <div className="row-title">{a.name}</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", margin: "2px 0 8px", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {a.summary}
        </div>
        <div className="row-meta">
          <span className="mono">{a.aiModel}</span>
          <span className="dot-sep">·</span>
          {project && <span>{project.name}</span>}
          <span className="dot-sep">·</span>
          <span><Icon name="message" size={10} style={{verticalAlign: "middle"}} /> {a.stats.comments}</span>
          <span><Icon name="eye" size={10} style={{verticalAlign: "middle"}} /> {a.stats.views}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <StatusBadge status={a.status} />
      </div>
    </div>
  );
};

const FLOW_STEPS = [
  { n: "01", t: "参考URLを共有", d: "X・YouTube・GitHub等を登録し、なぜ共有したかを添える" },
  { n: "02", t: "質問・検証", d: "Q&Aで疑問を投げ、実際に試した結果をメモに残す" },
  { n: "03", t: "試作アプリを公開", d: "社内URLとして共有し、利用範囲と注意事項を明示" },
  { n: "04", t: "レビューで改善", d: "感想・改善提案・不具合・セキュリティ指摘を集約" },
];

const HomePage = ({ onNav, onCompose, onOpen }) => {
  const recentLinks = MOCK.links.slice(0, 4);
  const openQs = MOCK.questions.filter(q => q.status === "未回答").slice(0, 3);
  const recentNotes = MOCK.notes.slice(0, 3);
  const apps = MOCK.apps.slice(0, 3);

  return (
    <div className="page">
      <div className="home-hero">
        <div>
          <div className="hero-eyebrow">AI · APP · DEV KNOWLEDGE HUB</div>
          <h1 className="hero-title">
            流さない、<span className="accent">蓄積する</span>。<br />
            AIアプリ開発の実践知を組織に残す。
          </h1>
          <div className="hero-sub">
            DX推進と情報支援グループが、外部情報・質問・検証結果・作成アプリ・レビューを一元管理し、後から検索・再利用できるナレッジ基盤。
          </div>
          <div className="hero-actions">
            <HeroAction icon="link" label="URLを共有" sub="X · YouTube · 記事 · GitHub" onClick={() => onCompose("link")} />
            <HeroAction icon="qa" label="質問する" sub="疑問をチームに投げる" onClick={() => onCompose("qa")} />
            <HeroAction icon="note" label="検証メモを書く" sub="試した結果を残す" onClick={() => onCompose("note")} />
            <HeroAction icon="app" label="作成アプリを登録" sub="URLとレビューを集める" onClick={() => onCompose("app")} />
          </div>
        </div>

        <div>
          <div className="metric-grid">
            <div className="metric">
              <div className="metric-label">共有URL</div>
              <div className="metric-value">128</div>
              <div className="metric-delta up">+8 今週</div>
            </div>
            <div className="metric">
              <div className="metric-label">未回答</div>
              <div className="metric-value">3</div>
              <div className="metric-delta">要対応</div>
            </div>
            <div className="metric">
              <div className="metric-label">検証メモ</div>
              <div className="metric-value">47</div>
              <div className="metric-delta up">+3 今週</div>
            </div>
            <div className="metric">
              <div className="metric-label">作成アプリ</div>
              <div className="metric-value">12</div>
              <div className="metric-delta">5 検証中</div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="section-title" style={{ marginBottom: 10 }}>
              ナレッジフロー
            </div>
            <div className="flow-diagram">
              {FLOW_STEPS.map(s => (
                <div className="flow-step" key={s.n}>
                  <div className="fs-num">{s.n}</div>
                  <div className="fs-title">{s.t}</div>
                  <div className="fs-desc">{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="home-grid">
        <div>
          <div className="section-title">
            最近共有されたURL <span className="section-count">({recentLinks.length})</span>
            <a className="section-more" onClick={() => onNav("links")}>すべて見る →</a>
          </div>
          <div style={{ borderTop: "1px solid var(--line)" }}>
            {recentLinks.map(l => <LinkRow key={l.id} link={l} onOpen={(x) => onOpen("link", x.id)} />)}
          </div>

          <div className="section-title" style={{ marginTop: 32 }}>
            未回答の質問 <span className="section-count">({openQs.length})</span>
            <a className="section-more" onClick={() => onNav("qa")}>Q&Aへ →</a>
          </div>
          <div style={{ borderTop: "1px solid var(--line)" }}>
            {openQs.map(q => <QARow key={q.id} q={q} onOpen={(x) => onOpen("qa", x.id)} />)}
          </div>

          <div className="section-title" style={{ marginTop: 32 }}>
            共有された作成アプリ <span className="section-count">({apps.length})</span>
            <a className="section-more" onClick={() => onNav("apps")}>すべて見る →</a>
          </div>
          <div style={{ borderTop: "1px solid var(--line)" }}>
            {apps.map(a => <AppRow key={a.id} a={a} onOpen={(x) => onOpen("app", x.id)} />)}
          </div>
        </div>

        <div>
          <div className="section-title">最近の検証メモ</div>
          <div style={{ borderTop: "1px solid var(--line)" }}>
            {recentNotes.map(n => <NoteRow key={n.id} n={n} onOpen={(x) => onOpen("note", x.id)} />)}
          </div>

          <div className="section-title" style={{ marginTop: 32 }}>アクティビティ</div>
          <div className="activity-list">
            {MOCK.activity.map(a => {
              const user = MOCK.usersById[a.actor];
              const targetName = {
                link: MOCK.linksById[a.targetId]?.title,
                question: MOCK.questionsById[a.targetId]?.title,
                answer: MOCK.questionsById[a.targetId]?.title,
                note: MOCK.notesById[a.targetId]?.title,
                app: MOCK.appsById[a.targetId]?.name,
                comment: MOCK.appsById[a.targetId]?.name,
              }[a.type];
              const iconName = { link: "link", question: "qa", answer: "qa", note: "note", app: "app", comment: "message" }[a.type];
              return (
                <div key={a.id} className="activity-item">
                  <div className="activity-ico"><Icon name={iconName} size={11} /></div>
                  <div className="activity-text">
                    <b>{user.name}</b> が {a.verb}: <span style={{ color: "var(--ink-3)" }}>{targetName}</span>
                  </div>
                  <div className="activity-time">{timeAgo(a.at)}</div>
                </div>
              );
            })}
          </div>

          <div className="section-title" style={{ marginTop: 32 }}>プロジェクト</div>
          <div style={{ borderTop: "1px solid var(--line-2)" }}>
            {MOCK.projects.slice(0, 4).map(p => (
              <div key={p.id}
                   className="row"
                   style={{ gridTemplateColumns: "10px 1fr auto", padding: "10px 4px" }}
                   onClick={() => onOpen("project", p.id)}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: p.color }}></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                    {p.links} URL · {p.notes} メモ · {p.apps} アプリ
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { HomePage, LinkRow, QARow, NoteRow, AppRow });
