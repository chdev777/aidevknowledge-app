import { useNavigate } from 'react-router-dom';
import { useUser } from '../../lib/firebase/use-user.js';
import { timeAgo } from '../../lib/utils/time.js';
import type { Question } from '../../types/question.js';

export function QARow({ q }: { q: Question }) {
  const nav = useNavigate();
  const author = useUser(q.createdBy);

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
            <span key={t} className="tag">
              <span className="tag-dot" />
              {t}
            </span>
          ))}
          {author.data && (
            <>
              <span className="dot-sep">·</span>
              <span>{author.data.name}</span>
            </>
          )}
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
