// Root app — routing + modal + tweak state
const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "amber",
  "density": "comfortable"
}/*EDITMODE-END*/;

const App = () => {
  const [page, setPage] = useStateApp("home");
  const [detail, setDetail] = useStateApp(null); // {type, id}
  const [compose, setCompose] = useStateApp(null); // kind
  const [tweaksOpen, setTweaksOpen] = useStateApp(false);
  const tweaks = useTweaks ? useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];
  const [t, setT] = tweaks;

  useEffectApp(() => {
    document.body.dataset.theme = t.theme;
    document.body.dataset.accent = t.accent;
    document.body.dataset.density = t.density;
  }, [t.theme, t.accent, t.density]);

  useEffectApp(() => {
    const handler = (e) => {
      if (e.data?.type === "__activate_edit_mode") setTweaksOpen(true);
      if (e.data?.type === "__deactivate_edit_mode") setTweaksOpen(false);
    };
    window.addEventListener("message", handler);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  const openDetail = (type, id) => setDetail({ type, id });
  const backToList = () => setDetail(null);

  const navTo = (p) => { setDetail(null); setPage(p); };

  const crumbs = (() => {
    const map = { home: ["ホーム"], links: ["URL共有"], qa: ["Q&A"], notes: ["検証メモ"], apps: ["作成アプリ"], projects: ["プロジェクト"], tags: ["タグ"], favorites: ["お気に入り"], mypage: ["マイページ"], admin: ["管理"] };
    const base = map[page] || ["ホーム"];
    if (detail) {
      const t = detail.type;
      const name = {
        link: MOCK.linksById[detail.id]?.title,
        qa: MOCK.questionsById[detail.id]?.title,
        note: MOCK.notesById[detail.id]?.title,
        app: MOCK.appsById[detail.id]?.name,
        project: MOCK.projectsById[detail.id]?.name,
      }[t];
      return [...base, name || "詳細"];
    }
    return base;
  })();

  const renderPage = () => {
    if (detail) {
      if (detail.type === "link") return <LinkDetail id={detail.id} onBack={backToList} onOpen={openDetail} />;
      if (detail.type === "qa") return <QADetail id={detail.id} onBack={backToList} />;
      if (detail.type === "note") return <NoteDetail id={detail.id} onBack={backToList} onOpen={openDetail} />;
      if (detail.type === "app") return <AppDetail id={detail.id} onBack={backToList} onOpen={openDetail} />;
      if (detail.type === "project") return <ProjectDetail id={detail.id} onBack={backToList} onOpen={openDetail} />;
    }
    switch (page) {
      case "home": return <HomePage onNav={navTo} onCompose={setCompose} onOpen={openDetail} />;
      case "links": return <LinksPage onOpen={openDetail} onCompose={setCompose} />;
      case "qa": return <QAPage onOpen={openDetail} onCompose={setCompose} />;
      case "notes": return <NotesPage onOpen={openDetail} onCompose={setCompose} />;
      case "apps": return <AppsPage onOpen={openDetail} onCompose={setCompose} />;
      case "projects": return <ProjectsPage onOpen={openDetail} />;
      case "tags": return <TagsPage />;
      case "favorites": return <FavoritesPage onOpen={openDetail} />;
      case "mypage": return <MyPage onOpen={openDetail} onCompose={setCompose} />;
      case "admin": return (
        <div className="page">
          <div className="page-header">
            <div>
              <div className="page-eyebrow">08 · Admin</div>
              <h1 className="page-title">管理</h1>
              <div className="page-sub">ユーザー・タグ・投稿の管理。</div>
            </div>
          </div>
          <div style={{ color: "var(--ink-3)", padding: 40, textAlign: "center", border: "1px dashed var(--line)", borderRadius: 6 }}>
            管理者権限が必要なセクションです。
          </div>
        </div>
      );
      default: return <HomePage onNav={navTo} onCompose={setCompose} onOpen={openDetail} />;
    }
  };

  return (
    <div className="app">
      <Sidebar page={page} onNav={navTo} />
      <div className="main">
        <Topbar crumbs={crumbs} onCompose={setCompose} />
        {renderPage()}
      </div>
      {compose && <ComposeModal kind={compose} onClose={() => setCompose(null)} />}

      {tweaksOpen && (
        <TweaksPanel title="Tweaks">
          <TweakSection title="外観">
            <TweakRadio label="テーマ" value={t.theme} options={[{value: "light", label: "ライト"}, {value: "dark", label: "ダーク"}]} onChange={v => setT({ theme: v })} />
            <TweakRadio label="アクセント" value={t.accent} options={[{value: "amber", label: "アンバー"}, {value: "indigo", label: "インディゴ"}, {value: "forest", label: "フォレスト"}]} onChange={v => setT({ accent: v })} />
            <TweakRadio label="情報密度" value={t.density} options={[{value: "comfortable", label: "標準"}, {value: "compact", label: "コンパクト"}]} onChange={v => setT({ density: v })} />
          </TweakSection>
        </TweaksPanel>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
