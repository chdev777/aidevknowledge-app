// Shared UI primitives: Sidebar, Topbar, Avatar, Tag, Badge, etc.
const { useState, useEffect, useMemo } = React;

const Avatar = ({ userId, size = "sm" }) => {
  const u = MOCK.usersById[userId];
  if (!u) return null;
  const initials = u.name.split(" ").map(s => s[0]).join("").slice(0, 2);
  return (
    <div className={`avatar ${size}`} title={u.name} style={{ background: u.color + "22", color: u.color, borderColor: u.color + "44" }}>
      {initials}
    </div>
  );
};

const Tag = ({ tagId, onClick }) => {
  const t = MOCK.tagsById[tagId];
  if (!t) return null;
  return (
    <span className="tag" data-type={t.type} onClick={(e) => { e.stopPropagation(); onClick && onClick(t); }}>
      <span className="tag-dot"></span>{t.name}
    </span>
  );
};

const StatusBadge = ({ status }) => (
  <span className="badge" data-status={status}>
    <span className="badge-dot"></span>{status}
  </span>
);

const Importance = ({ level }) => (
  <span className="importance" data-level={level}>
    <span className="importance-bars">
      <span className="importance-bar"></span>
      <span className="importance-bar"></span>
      <span className="importance-bar"></span>
    </span>
    {level}
  </span>
);

const timeAgo = (iso) => {
  const d = new Date(iso);
  const now = new Date("2026-04-24T10:00:00");
  const diff = (now - d) / 1000;
  if (diff < 60) return "たった今";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 時間前`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 日前`;
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
};

const sourceShort = (t) => ({
  "YouTube": "YT", "X": "X", "GitHub": "GH", "記事": "ART", "公式Docs": "DOC",
})[t] || "WEB";

// Sidebar nav
const NAV_ITEMS = [
  { id: "home", label: "ホーム", icon: "home" },
  { id: "links", label: "URL共有", icon: "link", count: 8 },
  { id: "qa", label: "Q&A", icon: "qa", count: 6 },
  { id: "notes", label: "検証メモ", icon: "note", count: 5 },
  { id: "apps", label: "作成アプリ", icon: "app", count: 5 },
];

const NAV_ITEMS_2 = [
  { id: "projects", label: "プロジェクト", icon: "project", count: 6 },
  { id: "tags", label: "タグ", icon: "tag", count: 23 },
  { id: "favorites", label: "お気に入り", icon: "star", count: 5 },
];

const NAV_ITEMS_ME = [
  { id: "mypage", label: "マイページ", icon: "user" },
];

const Sidebar = ({ page, onNav }) => (
  <aside className="sidebar">
    <div className="sidebar-brand">
      <div className="brand-mark">
        <div className="brand-logo"></div>
        <div>
          <div className="brand-name">ナレッジハブ</div>
          <div className="brand-sub">AI · APP · DEV</div>
        </div>
      </div>
    </div>

    <div className="sidebar-search">
      <div className="search-input">
        <Icon name="search" size={13} />
        <input placeholder="検索..." readOnly />
        <span className="search-kbd">⌘K</span>
      </div>
    </div>

    <div className="nav-section">
      <div className="nav-section-title">ワークスペース</div>
      {NAV_ITEMS.map(item => (
        <div key={item.id}
             className={`nav-item ${page === item.id ? "active" : ""}`}
             onClick={() => onNav(item.id)}>
          <Icon name={item.icon} size={14} />
          <span>{item.label}</span>
          {item.count !== undefined && <span className="nav-count">{item.count}</span>}
        </div>
      ))}
    </div>

    <div className="nav-section" style={{ paddingTop: 0 }}>
      <div className="nav-section-title">整理</div>
      {NAV_ITEMS_2.map(item => (
        <div key={item.id}
             className={`nav-item ${page === item.id ? "active" : ""}`}
             onClick={() => onNav(item.id)}>
          <Icon name={item.icon} size={14} />
          <span>{item.label}</span>
          {item.count !== undefined && <span className="nav-count">{item.count}</span>}
        </div>
      ))}
    </div>

    <div className="nav-section" style={{ paddingTop: 0 }}>
      <div className="nav-section-title">あなた</div>
      <div className={`nav-item ${page === "mypage" ? "active" : ""}`} onClick={() => onNav("mypage")}>
        <Icon name="user" size={14} />
        <span>マイページ</span>
      </div>
      <div className={`nav-item ${page === "admin" ? "active" : ""}`} onClick={() => onNav("admin")}>
        <Icon name="admin" size={14} />
        <span>設定</span>
      </div>
    </div>

    <div className="sidebar-foot">
      <Avatar userId="u1" size="sm" />
      <div className="user-meta">
        <div className="u-name">佐藤 健一</div>
        <div className="u-role">DX推進</div>
      </div>
    </div>
  </aside>
);

const Topbar = ({ crumbs, onCompose }) => (
  <div className="topbar">
    <div className="breadcrumbs">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="crumb-sep">/</span>}
          <span className={i === crumbs.length - 1 ? "crumb-current" : ""}>{c}</span>
        </React.Fragment>
      ))}
    </div>
    <div className="topbar-spacer"></div>
    <div className="topbar-actions">
      <button className="btn ghost sm"><Icon name="refresh" size={13} /></button>
      <button className="btn sm" onClick={() => onCompose("note")}>
        <Icon name="plus" size={13} />検証メモ
      </button>
      <button className="btn primary sm" onClick={() => onCompose("link")}>
        <Icon name="plus" size={13} />URLを共有
      </button>
    </div>
  </div>
);

Object.assign(window, { Avatar, Tag, StatusBadge, Importance, Sidebar, Topbar, timeAgo, sourceShort, NAV_ITEMS });
