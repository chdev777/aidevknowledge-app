import { useQuery } from '@tanstack/react-query';
import { commentsDb } from '../../lib/db/index.js';
import type { CommentTargetType } from '../../types/comment.js';
import { Spinner } from '../shared/Spinner.js';
import { EmptyState } from '../shared/EmptyState.js';
import { CommentTypeBadge } from './CommentTypeBadge.js';
import { Markdown } from '../shared/Markdown.js';

interface Props {
  targetType: CommentTargetType;
  targetId: string;
}

export function CommentList({ targetType, targetId }: Props) {
  const q = useQuery({
    queryKey: ['comments', targetType, targetId],
    queryFn: () => commentsDb.findByTarget(targetType, targetId, { count: 50 }),
  });

  if (q.isPending) return <div className="section-loading"><Spinner /></div>;
  if (!q.data || q.data.length === 0) {
    return <EmptyState title="まだコメントはありません" />;
  }

  return (
    <ul className="comment-list">
      {q.data.map((c) => (
        <li key={c.id} className="comment-item">
          <div className="comment-head">
            <CommentTypeBadge value={c.type} />
            <span className="comment-author mono">@{c.createdBy.slice(0, 6)}</span>
            <time className="comment-time mono">
              {c.createdAt.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
            </time>
          </div>
          <div className="comment-body">
            <Markdown>{c.body}</Markdown>
          </div>
        </li>
      ))}
    </ul>
  );
}
