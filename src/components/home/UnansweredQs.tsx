import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { questionsDb } from '../../lib/db/index.js';
import { EmptyState } from '../shared/EmptyState.js';
import { Spinner } from '../shared/Spinner.js';
import { QARow } from '../rows/QARow.js';

export function UnansweredQs() {
  const q = useQuery({
    queryKey: ['home', 'unansweredQuestions'],
    queryFn: () => questionsDb.findUnanswered({ count: 3 }),
  });
  const items = q.data ?? [];

  return (
    <>
      <div className="section-title" style={{ marginTop: 32 }}>
        未回答の質問 <span className="section-count">({items.length})</span>
        <RouterLink to="/qa" className="section-more">Q&Aへ →</RouterLink>
      </div>
      {q.isPending && <Spinner />}
      {q.data && items.length === 0 && (
        <EmptyState title="未回答の質問はありません" />
      )}
      {items.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {items.map((qq) => (
            <QARow key={qq.id} q={qq} />
          ))}
        </div>
      )}
    </>
  );
}
