import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase/client.js';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { Icon, type IconName } from '../shared/Icon.js';
import { Avatar } from './Avatar.js';
import { CHANGELOG } from '../../lib/data/changelog.js';
import { filterChangelog, unreadCount } from '../../lib/utils/changelog.js';
import { getLastSeen } from '../../lib/utils/announcements-storage.js';

interface NavDef {
  to: string;
  label: string;
  icon: IconName;
  countKey?: 'links' | 'questions' | 'notes' | 'apps';
  end?: boolean;
  disabled?: boolean;
}

const PRIMARY: NavDef[] = [
  { to: '/', label: 'ホーム', icon: 'home', end: true },
  { to: '/links', label: 'URL共有', icon: 'link', countKey: 'links' },
  { to: '/qa', label: 'Q&A', icon: 'qa', countKey: 'questions' },
  { to: '/notes', label: '検証メモ', icon: 'note', countKey: 'notes' },
  { to: '/apps', label: '作成アプリ', icon: 'app', countKey: 'apps' },
];

const ORGANIZE: NavDef[] = [
  { to: '/projects', label: 'プロジェクト', icon: 'project' },
  { to: '/tags', label: 'タグ', icon: 'tag' },
  { to: '/favorites', label: 'お気に入り', icon: 'star' },
];

async function countShared(col: string): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(db, col), where('visibility', '==', 'shared')),
  );
  return snap.data().count;
}

export function Sidebar() {
  const { profile } = useAuth();
  const counts = useQuery({
    queryKey: ['sidebar', 'counts'],
    queryFn: async () => ({
      links: await countShared('links'),
      questions: await countShared('questions'),
      notes: await countShared('notes'),
      apps: await countShared('apps'),
    }),
    staleTime: 5 * 60_000,
  });

  // お知らせ未読件数。route 切替時に再評価したいので location.pathname を依存に
  const [announcementsUnread, setAnnouncementsUnread] = useState(0);
  useEffect(() => {
    const update = () => {
      const isAdmin = profile?.role === '管理者';
      const visible = filterChangelog(CHANGELOG, isAdmin);
      setAnnouncementsUnread(unreadCount(visible, getLastSeen()));
    };
    update();
    // /announcements 訪問後に lastSeen が更新される。 storage event 同タブでは飛ばないため、
    // フォーカス復帰や route 変更で再評価する。簡易的に focus と pathname 変化に乗せる。
    window.addEventListener('focus', update);
    return () => window.removeEventListener('focus', update);
  }, [profile?.role, profile?.id]);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <div className="brand-logo" />
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
        {PRIMARY.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={14} style={{ flexShrink: 0 }} />
            <span>{item.label}</span>
            {item.countKey && counts.data && (
              <span className="nav-count">{counts.data[item.countKey]}</span>
            )}
          </NavLink>
        ))}
      </div>

      <div className="nav-section" style={{ paddingTop: 0 }}>
        <div className="nav-section-title">整理</div>
        {ORGANIZE.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={14} style={{ flexShrink: 0 }} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="nav-section" style={{ paddingTop: 0 }}>
        <div className="nav-section-title">あなた</div>
        <NavLink
          to="/announcements"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={() => setAnnouncementsUnread(0)}
        >
          <Icon name="message" size={14} style={{ flexShrink: 0 }} />
          <span>お知らせ</span>
          {announcementsUnread > 0 && (
            <span className="nav-count">{announcementsUnread}</span>
          )}
        </NavLink>
        <NavLink
          to="/me"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon name="user" size={14} style={{ flexShrink: 0 }} />
          <span>マイページ</span>
        </NavLink>
        {profile?.role === '管理者' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon name="admin" size={14} style={{ flexShrink: 0 }} />
            <span>管理</span>
          </NavLink>
        )}
      </div>

      {profile && (
        <div className="sidebar-foot">
          <Avatar user={profile} size="sm" />
          <div className="user-meta">
            <div className="u-name">{profile.name}</div>
            <div className="u-role">{profile.role}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
