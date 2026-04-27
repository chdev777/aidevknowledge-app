import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { linksDb } from '../../lib/db/index.js';
import { EmptyState } from '../shared/EmptyState.js';
import { Spinner } from '../shared/Spinner.js';
import { LinkRow } from '../rows/LinkRow.js';

export function RecentLinks() {
  const q = useQuery({
    queryKey: ['home', 'recentLinks'],
    queryFn: () => linksDb.findShared({ count: 4 }),
  });
  const items = q.data ?? [];

  return (
    <>
      <div className="section-title">
        最近共有されたURL <span className="section-count">({items.length})</span>
        <RouterLink to="/links" className="section-more">すべて見る →</RouterLink>
      </div>
      {q.isPending && <Spinner />}
      {q.data && items.length === 0 && (
        <EmptyState
          title="まだ共有されたURLはありません"
          description="ホームの「URLを共有」から投稿できます"
        />
      )}
      {items.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {items.map((l) => (
            <LinkRow key={l.id} link={l} />
          ))}
        </div>
      )}
    </>
  );
}
