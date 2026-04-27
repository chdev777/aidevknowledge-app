import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { answersDb, questionsDb } from '../../lib/db/index.js';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { answerInputSchema } from '../../lib/schemas/question.js';
import { toAppError } from '../../lib/utils/error.js';
import { StatusBadge } from '../../components/shared/StatusBadge.js';
import { TagList } from '../../components/shared/Tag.js';
import { VisibilityBadge } from '../../components/shared/VisibilityBadge.js';
import { Markdown } from '../../components/shared/Markdown.js';
import { Spinner } from '../../components/shared/Spinner.js';
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

  if (questionQ.isPending) {
    return (
      <div className="page">
        <div className="section-loading"><Spinner /></div>
      </div>
    );
  }
  if (questionQ.error || !questionQ.data) {
    return <ForbiddenPage />;
  }

  const question = questionQ.data;
  const answers = answersQ.data ?? [];
  const isQuestionOwner = fbUser?.uid === question.createdBy;

  return (
    <div className="page">
      <header className="page-head">
        <div className="row-meta">
          <StatusBadge value={question.status} />
          <span className="mono">回答 {question.answerCount}</span>
          <VisibilityBadge value={question.visibility} />
        </div>
        <h1 className="page-title">{question.title}</h1>
      </header>

      <section className="page-section">
        <div className="prose"><Markdown>{question.body}</Markdown></div>
        <TagList names={question.tags} />
      </section>

      <section className="page-section">
        <h2 className="section-title">回答 ({answers.length})</h2>
        <ul className="answer-list">
          {answers.map((a) => (
            <AnswerItem
              key={a.id}
              answer={a}
              questionId={id}
              isQuestionOwner={isQuestionOwner}
              onChanged={() => {
                qc.invalidateQueries({ queryKey: ['answers', id] });
                qc.invalidateQueries({ queryKey: ['question', id] });
              }}
            />
          ))}
        </ul>
      </section>

      <section className="page-section">
        <h2 className="section-title">回答する</h2>
        <AnswerComposer
          questionId={id}
          onPosted={() => {
            qc.invalidateQueries({ queryKey: ['answers', id] });
            qc.invalidateQueries({ queryKey: ['question', id] });
          }}
        />
      </section>

      <div className="page-foot">
        <Link to="/qa" className="btn">← 一覧に戻る</Link>
      </div>
    </div>
  );
}

function AnswerItem({
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
  const [voted, setVoted] = useState<'up' | 'down' | null>(null); // ローカルstateで二重投票防止

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
    <li className={`answer-item ${answer.accepted ? 'is-accepted' : ''}`}>
      <div className="answer-vote">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={voteUp}
          aria-label="支持する"
          disabled={!fbUser}
        >
          ▲
        </button>
        <span className="mono answer-vote-count">{answer.votes}</span>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={voteDown}
          aria-label="支持を撤回"
          disabled={!fbUser}
        >
          ▼
        </button>
      </div>
      <div className="answer-body">
        <div className="answer-head">
          <span className="mono answer-author">@{answer.createdBy.slice(0, 6)}</span>
          {answer.accepted && <span className="mono accepted-mark">採用</span>}
          <time className="mono answer-time">
            {answer.createdAt.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
          </time>
          {isQuestionOwner && !answer.accepted && (
            <button type="button" className="btn btn-ghost mono" onClick={accept}>
              採用する
            </button>
          )}
        </div>
        <div className="prose"><Markdown>{answer.body}</Markdown></div>
      </div>
    </li>
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
    onSuccess: async () => {
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
    <form className="comment-composer" onSubmit={onSubmit}>
      <textarea
        rows={4}
        className="comment-composer-body"
        value={body}
        placeholder="回答を入力（markdown 可）"
        onChange={(e) => setBody(e.target.value)}
      />
      {error && <div className="auth-error">{error}</div>}
      <div className="comment-composer-foot">
        <button type="submit" className="btn btn-primary" disabled={m.isPending || !body.trim()}>
          {m.isPending ? <Spinner /> : '回答を投稿'}
        </button>
      </div>
    </form>
  );
}
