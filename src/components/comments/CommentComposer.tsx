import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsDb } from '../../lib/db/index.js';
import { commentInputSchema } from '../../lib/schemas/comment.js';
import { COMMENT_TYPES, type CommentTargetType, type CommentType } from '../../types/comment.js';
import type { Visibility } from '../../types/visibility.js';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { toAppError } from '../../lib/utils/error.js';
import { Spinner } from '../shared/Spinner.js';

interface Props {
  targetType: CommentTargetType;
  targetId: string;
  targetVisibility: Visibility;
}

export function CommentComposer({ targetType, targetId, targetVisibility }: Props) {
  const { fbUser } = useAuth();
  const qc = useQueryClient();
  const [type, setType] = useState<CommentType>('感想');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: async () => {
      if (!fbUser) throw new Error('not signed in');
      const parsed = commentInputSchema.parse({ targetType, targetId, type, body });
      await commentsDb.create(fbUser.uid, {
        targetType: parsed.targetType as CommentTargetType,
        targetId: parsed.targetId,
        type: parsed.type as CommentType,
        body: parsed.body,
        targetVisibility,
      });
    },
    onSuccess: async () => {
      setBody('');
      setError(null);
      await qc.invalidateQueries({ queryKey: ['comments', targetType, targetId] });
    },
    onError: (err) => setError(toAppError(err).userMessage),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    m.mutate();
  };

  return (
    <form className="comment-composer" onSubmit={onSubmit}>
      <div className="comment-composer-types">
        {COMMENT_TYPES.map((t) => (
          <label key={t} className="radio">
            <input
              type="radio"
              name="commentType"
              value={t}
              checked={type === t}
              onChange={() => setType(t)}
            />
            <span>{t}</span>
          </label>
        ))}
      </div>
      <textarea
        className="comment-composer-body"
        rows={3}
        value={body}
        placeholder="コメントを入力（Enter で改行、Ctrl+Enter で投稿）"
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            m.mutate();
          }
        }}
      />
      {error && <div className="auth-error">{error}</div>}
      <div className="comment-composer-foot">
        <button type="submit" className="btn btn-primary" disabled={m.isPending || !body.trim()}>
          {m.isPending ? <Spinner /> : '投稿'}
        </button>
      </div>
    </form>
  );
}
