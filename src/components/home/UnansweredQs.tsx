import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { questionsDb } from '../../lib/db/index.js';
import { EmptyState } from '../shared/EmptyState.js';
import { Spinner } from '../shared/Spinner.js';

export function UnansweredQs() {
  const q = useQuery({
    queryKey: ['home', 'unansweredQuestions'],
    queryFn: () => questionsDb.findUnanswered({ count: 5 }),
  });

  return (
    <section className="home-section">
      <div className="section-head">
        <h2 className="section-title">未回答の質問</h2>
        <Link to="/qa" className="section-more mono">すべて見る →</Link>
      </div>
      {q.isPending && <div className="section-loading"><Spinner /></div>}
      {q.data && q.data.length === 0 && (
        <EmptyState title="未回答の質問はありません" />
      )}
      {q.data && q.data.length > 0 && (
        <ul className="home-list">
          {q.data.map((item) => (
            <li key={item.id} className="home-list-item">
              <Link to={`/qa/${item.id}`} className="home-list-link">
                <div className="home-list-meta mono">未回答</div>
                <div className="home-list-title">{item.title}</div>
                <div className="home-list-sub">{item.body.slice(0, 120)}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
