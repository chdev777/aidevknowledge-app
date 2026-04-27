import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appsDb } from '../../lib/db/index.js';
import { EmptyState } from '../shared/EmptyState.js';
import { Spinner } from '../shared/Spinner.js';

export function RecentApps() {
  const q = useQuery({
    queryKey: ['home', 'recentApps'],
    queryFn: () => appsDb.findShared({ count: 3 }),
  });

  return (
    <section className="home-section">
      <div className="section-head">
        <h2 className="section-title">作成アプリ</h2>
        <Link to="/apps" className="section-more mono">すべて見る →</Link>
      </div>
      {q.isPending && <div className="section-loading"><Spinner /></div>}
      {q.data && q.data.length === 0 && <EmptyState title="作成アプリはまだありません" />}
      {q.data && q.data.length > 0 && (
        <ul className="home-list">
          {q.data.map((a) => (
            <li key={a.id} className="home-list-item">
              <Link to={`/apps/${a.id}`} className="home-list-link">
                <div className="home-list-meta mono">{a.status}</div>
                <div className="home-list-title">{a.name}</div>
                <div className="home-list-sub">{a.summary}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
