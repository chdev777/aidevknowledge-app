import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notesDb } from '../../lib/db/index.js';
import { EmptyState } from '../shared/EmptyState.js';
import { Spinner } from '../shared/Spinner.js';

export function RecentNotes() {
  const q = useQuery({
    queryKey: ['home', 'recentNotes'],
    queryFn: () => notesDb.findShared({ count: 3 }),
  });

  return (
    <section className="home-section">
      <div className="section-head">
        <h2 className="section-title">最近の検証メモ</h2>
        <Link to="/notes" className="section-more mono">すべて見る →</Link>
      </div>
      {q.isPending && <div className="section-loading"><Spinner /></div>}
      {q.data && q.data.length === 0 && <EmptyState title="検証メモはまだありません" />}
      {q.data && q.data.length > 0 && (
        <ul className="home-list">
          {q.data.map((n) => (
            <li key={n.id} className="home-list-item">
              <Link to={`/notes/${n.id}`} className="home-list-link">
                <div className="home-list-title">{n.title}</div>
                <div className="home-list-sub">{n.purpose}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
