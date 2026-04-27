import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appsDb } from '../../lib/db/index.js';
import { EmptyState } from '../shared/EmptyState.js';
import { Spinner } from '../shared/Spinner.js';
import { AppRow } from '../rows/AppRow.js';

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
