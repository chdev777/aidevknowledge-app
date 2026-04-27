import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { questionsDb } from '../../lib/db/index.js';
import { EmptyState } from '../shared/EmptyState.js';
import { Spinner } from '../shared/Spinner.js';
import { timeAgo } from '../../lib/utils/time.js';
import type { Question } from '../../types/question.js';

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

function QARow({ q }: { q: Question }) {
  const nav = useNavigate();
  return (
    <div className="qa-row" onClick={() => nav(`/qa/${q.id}`)}>
      <div className="qa-count">
        <div className={`num ${q.answerCount === 0 ? 'zero' : ''}`}>{q.answerCount}</div>
        <div className="lbl">回答</div>
      </div>
      <div className="qa-body">
        <div className="qa-title">{q.title}</div>
        <div className="qa-excerpt">{q.body}</div>
        <div className="qa-meta">
          {q.tags.map((t) => (
            <span key={t} className="tag"><span className="tag-dot" />{t}</span>
          ))}
          <span className="dot-sep">·</span>
          <span>{timeAgo(q.createdAt)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span className="badge" data-status={q.status}>
          <span className="badge-dot" />
          {q.status}
        </span>
      </div>
    </div>
  );
}
