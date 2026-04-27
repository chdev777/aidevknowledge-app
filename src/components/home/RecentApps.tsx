import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appsDb } from '../../lib/db/index.js';
import { EmptyState } from '../shared/EmptyState.js';
import { Spinner } from '../shared/Spinner.js';
import type { AiApp } from '../../types/app.js';

export function RecentApps() {
  const q = useQuery({
    queryKey: ['home', 'recentApps'],
    queryFn: () => appsDb.findShared({ count: 3 }),
  });
  const items = q.data ?? [];

  return (
    <>
      <div className="section-title" style={{ marginTop: 32 }}>
        共有された作成アプリ <span className="section-count">({items.length})</span>
        <RouterLink to="/apps" className="section-more">すべて見る →</RouterLink>
      </div>
      {q.isPending && <Spinner />}
      {q.data && items.length === 0 && (
        <EmptyState title="作成アプリはまだありません" />
      )}
      {items.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {items.map((a) => (
            <AppRow key={a.id} app={a} />
          ))}
        </div>
      )}
    </>
  );
}

function AppRow({ app }: { app: AiApp }) {
  const nav = useNavigate();
  return (
    <div
      className="row"
      style={{ gridTemplateColumns: 'auto 1fr auto', gap: 18 }}
      onClick={() => nav(`/apps/${app.id}`)}
    >
      <div className="app-icon" style={{ width: 42, height: 42, fontSize: 16 }}>
        {app.name.slice(0, 1)}
      </div>
      <div>
        <div className="row-title">{app.name}</div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--ink-3)',
            margin: '2px 0 8px',
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {app.summary}
        </div>
        <div className="row-meta">
          <span className="mono">{app.aiModel}</span>
          <span className="dot-sep">·</span>
          <span className="mono">{app.usageScope}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span className="badge" data-status={app.status}>
          <span className="badge-dot" />
          {app.status}
        </span>
      </div>
    </div>
  );
}
