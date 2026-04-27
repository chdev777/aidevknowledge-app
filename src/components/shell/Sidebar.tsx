import { NavLink } from 'react-router-dom';

const NAV_PRIMARY = [
  { to: '/', label: 'ホーム', end: true },
  { to: '/links', label: 'URL共有' },
  { to: '/qa', label: 'Q&A' },
  { to: '/notes', label: '検証メモ' },
  { to: '/apps', label: '作成アプリ' },
];

const NAV_SECONDARY = [{ to: '/me', label: 'マイページ' }];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <div className="brand-logo" />
          <div>
            <div className="brand-name">ナレッジ共有ハブ</div>
            <div className="brand-tag mono">AI app dev</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <div className="nav-group-label mono">ナレッジ</div>
          {NAV_PRIMARY.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-group">
          <div className="nav-group-label mono">マイ</div>
          {NAV_SECONDARY.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}
