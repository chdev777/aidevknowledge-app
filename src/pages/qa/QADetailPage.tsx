import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { answersDb, questionsDb } from '../../lib/db/index.js';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { useUser } from '../../lib/firebase/use-user.js';
import { Avatar } from '../../components/shell/Avatar.js';
import { Markdown } from '../../components/shared/Markdown.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { Icon } from '../../components/shared/Icon.js';
import { answerInputSchema } from '../../lib/schemas/question.js';
import { toAppError } from '../../lib/utils/error.js';
import { timeAgo } from '../../lib/utils/time.js';
import { ForbiddenPage } from '../ForbiddenPage.js';
import type { Answer } from '../../types/question.js';

export function QADetailPage() {
  const { id = '' } = useParams();
  const { fbUser } = useAuth();
  const qc = useQueryClient();

  const questionQ = useQuery({
    queryKey: ['question', id],
    queryFn: () => questionsDb.findById(id),
    enabled: !!id,
  });
  const answersQ = useQuery({
    queryKey: ['answers', id],
    queryFn: () => answersDb.listByQuestion(id),
    enabled: !!id,
  });
  const author = useUser(questionQ.data?.createdBy);

  if (questionQ.isPending) {
    return (
      <div className="page">
        <Spinner />
      </div>
    );
  }
  if (questionQ.error || !questionQ.data) return <ForbiddenPage />;

  const q = questionQ.data;
  const answers = answersQ.data ?? [];
  const isQuestionOwner = fbUser?.uid === q.createdBy;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['answers', id] });
    qc.invalidateQueries({ queryKey: ['question', id] });
  };

  return (
    <div className="page">
      <RouterLink to="/qa" className="btn ghost sm" style={{ marginBottom: 16 }}>
        ← Q&A一覧に戻る
      </RouterLink>

      <div className="detail-layout">
        <div>
          <div className="detail-eyebrow">QUESTION · #{id.toUpperCase()}</div>
          <h1 className="detail-title">{q.title}</h1>
          <div className="detail-meta">
            {author.data && <Avatar user={author.data} size="sm" />}
            {author.data && <span>{author.data.name}</span>}
            <span className="dot-sep">·</span>
            <span>{timeAgo(q.createdAt)}</span>
            <span className="dot-sep">·</span>
            <span className="badge" data-status={q.status}>
              <span className="badge-dot" />
              {q.status}
            </span>
          </div>

          <div className="prose" style={{ marginBottom: 24 }}>
            <Markdown>{q.body}</Markdown>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 30 }}>
            {q.tags.map((t) => (
              <span key={t} className="tag"><span className="tag-dot" />{t}</span>
            ))}
          </div>

          <div className="section-title">
            回答 <span className="section-count">({answers.length})</span>
          </div>

          {answers.length === 0 && (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--ink-3)',
                border: '1px dashed var(--line)',
                borderRadius: 6,
              }}
            >
              まだ回答がありません。最初の回答を投稿してください。
            </div>
          )}

          {answers.map((a) => (
            <AnswerBlock
              key={a.id}
              answer={a}
              questionId={id}
              isQuestionOwner={isQuestionOwner}
              onChanged={invalidate}
            />
          ))}

          <div style={{ marginTop: 24 }}>
            <AnswerComposer questionId={id} onPosted={invalidate} />
          </div>
        </div>

        <aside className="detail-aside">
          <div className="aside-section">
            <div className="aside-label">ステータス</div>
            <div className="aside-value">
              <span className="badge" data-status={q.status}>
                <span className="badge-dot" />
                {q.status}
              </span>
            </div>
          </div>
          <div className="aside-section">
            <div className="aside-label">質問者</div>
            <div className="aside-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {author.data && <Avatar user={author.data} size="sm" />}
              {author.data?.name ?? '—'}
            </div>
          </div>
          <div className="aside-section">
            <div className="aside-label">回答数</div>
            <div className="aside-value mono">{q.answerCount}</div>
          </div>
          <div className="aside-section">
            <div className="aside-label">作成日時</div>
            <div className="aside-value mono" style={{ fontSize: 12 }}>
              {q.createdAt.toLocaleString('ja-JP')}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AnswerBlock({
  answer,
  questionId,
  isQuestionOwner,
  onChanged,
}: {
  answer: Answer;
  questionId: string;
  isQuestionOwner: boolean;
  onChanged: () => void;
}) {
  const { fbUser } = useAuth();
  const author = useUser(answer.createdBy);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  const voteUp = async () => {
    if (voted === 'up') return;
    await answersDb.vote(questionId, answer.id, 1);
    setVoted('up');
    onChanged();
  };
  const voteDown = async () => {
    if (voted === 'down') return;
    await answersDb.vote(questionId, answer.id, -1);
    setVoted('down');
    onChanged();
  };
  const accept = async () => {
    await answersDb.setAccepted(questionId, answer.id, true);
    await questionsDb.setAcceptedAnswer(questionId, answer.id);
    onChanged();
  };

  return (
    <div className={`answer-block ${answer.accepted ? 'accepted' : ''}`}>
      <div className="vote-col">
        <button type="button" className="vote-btn" onClick={voteUp} disabled={!fbUser} aria-label="支持">
          ▲
        </button>
        <div className="vote-count">{answer.votes}</div>
        <button type="button" className="vote-btn" onClick={voteDown} disabled={!fbUser} aria-label="撤回">
          ▼
        </button>
      </div>
      <div>
        <div className="answer-header">
          {author.data && <Avatar user={author.data} size="sm" />}
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
            {author.data?.name ?? `@${answer.createdBy.slice(0, 6)}`}
          </span>
          <span className="dot-sep">·</span>
          <span>{timeAgo(answer.createdAt)}</span>
          {answer.accepted && (
            <span className="mono" style={{ marginLeft: 8 }}>採用</span>
          )}
          {isQuestionOwner && !answer.accepted && (
            <button type="button" className="btn xs" onClick={accept} style={{ marginLeft: 'auto' }}>
              採用する
            </button>
          )}
        </div>
        <div className="prose" style={{ marginTop: 6 }}>
          <Markdown>{answer.body}</Markdown>
        </div>
      </div>
    </div>
  );
}

function AnswerComposer({ questionId, onPosted }: { questionId: string; onPosted: () => void }) {
  const { fbUser } = useAuth();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: async () => {
      if (!fbUser) throw new Error('not signed in');
      const parsed = answerInputSchema.parse({ body });
      await answersDb.create(questionId, fbUser.uid, parsed.body);
    },
    onSuccess: () => {
      setBody('');
      onPosted();
    },
    onError: (err) => setError(toAppError(err).userMessage),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    m.mutate();
  };

  return (
    <form className="composer" onSubmit={onSubmit}>
      <textarea
        rows={4}
        value={body}
        placeholder="回答を入力（markdown 可）"
        onChange={(e) => setBody(e.target.value)}
      />
      {error && <div className="auth-error">{error}</div>}
      <div className="composer-foot">
        <span className="composer-hint">Markdown対応</span>
        <button type="submit" className="btn primary sm" disabled={m.isPending || !body.trim()}>
          <Icon name="plus" size={12} />
          投稿
        </button>
      </div>
    </form>
  );
}
