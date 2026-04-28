import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { PageHeader } from '../../components/shared/PageHeader.js';
import { Icon, type IconName } from '../../components/shared/Icon.js';
import { UsersTab } from './tabs/UsersTab.js';
import { TagsTab } from './tabs/TagsTab.js';
import { ModerationTab } from './tabs/ModerationTab.js';

type TabId = 'users' | 'tags' | 'moderation';

interface TabDef {
  id: TabId;
  label: string;
  icon: IconName;
}

const TABS: TabDef[] = [
  { id: 'users', label: 'ユーザー', icon: 'user' },
  { id: 'tags', label: 'タグ', icon: 'tag' },
  { id: 'moderation', label: 'モデレーション', icon: 'admin' },
];

function isTabId(v: string | null): v is TabId {
  return v === 'users' || v === 'tags' || v === 'moderation';
}

export function AdminPage() {
  const { profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const isAdmin = profile?.role === '管理者';

  const tabParam = params.get('tab');
  const tab: TabId = isTabId(tabParam) ? tabParam : 'users';
  const setTab = (id: TabId) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  if (!isAdmin) {
    return (
      <div className="page">
        <PageHeader eyebrow="08 · ADMIN" title="管理" subtitle="管理者専用エリア。" />
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            color: 'var(--ink-3)',
            border: '1px dashed var(--line)',
            borderRadius: 12,
            margin: '20px 0',
          }}
        >
          <div style={{ fontSize: 14, marginBottom: 6 }}>
            管理者権限が必要なセクションです。
          </div>
          <div style={{ fontSize: 12 }}>現在のロール: {profile?.role ?? '不明'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="08 · ADMIN"
        title="管理"
        subtitle="ユーザー・タグ・投稿を管理します。"
      />

      <div className="me-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`me-tab ${t.id === tab ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'tags' && <TagsTab />}
      {tab === 'moderation' && <ModerationTab />}
    </div>
  );
}
