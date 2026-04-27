import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { linksDb } from '../../lib/db/index.js';
import { EmptyState } from '../shared/EmptyState.js';
import { Spinner } from '../shared/Spinner.js';

export function RecentLinks() {
  const q = useQuery({
    queryKey: ['home', 'recentLinks'],
    queryFn: () => linksDb.findShared({ count: 5 }),
  });

  return (
    <section className="home-section">
      <div className="section-head">
        <h2 className="section-title">最近共有された URL</h2>
        <RouterLink to="/links" className="section-more mono">
          すべて見る →
        </RouterLink>
      </div>
      {q.isPending && <div className="section-loading"><Spinner /></div>}
      {q.data && q.data.length === 0 && (
        <EmptyState
          title="まだ共有されたURLはありません"
          description="ホームから「URLを共有」で投稿できます"
        />
      )}
      {q.data && q.data.length > 0 && (
        <ul className="home-list">
          {q.data.map((l) => (
            <li key={l.id} className="home-list-item">
              <RouterLink to={`/links/${l.id}`} className="home-list-link">
                <div className="home-list-meta mono">
                  {l.sourceType} · {l.domain}
                </div>
                <div className="home-list-title">{l.title}</div>
                <div className="home-list-sub">{l.userComment || l.summary}</div>
              </RouterLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
