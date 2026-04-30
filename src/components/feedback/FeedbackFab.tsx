import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { feedbacksDb } from '../../lib/db/index.js';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { feedbackInputSchema } from '../../lib/schemas/feedback.js';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABEL,
  type FeedbackCategory,
} from '../../types/feedback.js';
import { toAppError } from '../../lib/utils/error.js';
import { logger } from '../../lib/utils/log.js';
import { Spinner } from '../shared/Spinner.js';

type FormState = 'editing' | 'sending' | 'sent' | 'error';

const SENT_AUTO_CLOSE_MS = 2500;

export function FeedbackFab() {
  const { profile } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('other');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<FormState>('editing');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // 展開時にテキストエリアフォーカス
  useEffect(() => {
    if (open && state === 'editing') {
      textareaRef.current?.focus();
    }
  }, [open, state]);

  // ESC / 外側クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (fabRef.current?.contains(target)) return;
      closePanel();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouseDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // sent → 自動クローズ
  useEffect(() => {
    if (state !== 'sent') return;
    const t = setTimeout(() => {
      setState('editing');
      setOpen(false);
      setMessage('');
      setError(null);
    }, SENT_AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [state]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('not signed in');
      const parsed = feedbackInputSchema.parse({
        category,
        message,
        currentView: loc.pathname,
      });
      await feedbacksDb.create(
        {
          uid: profile.id,
          userHandleSnap: profile.handle,
          userNameSnap: profile.name,
        },
        {
          category: parsed.category as FeedbackCategory,
          message: parsed.message,
          currentView: parsed.currentView,
        },
      );
    },
    onMutate: () => {
      setState('sending');
      setError(null);
    },
    onSuccess: () => {
      setState('sent');
    },
    onError: (err) => {
      logger.error('feedback create failed', { err: String(err) });
      setError(toAppError(err).userMessage);
      setState('error');
    },
  });

  function closePanel() {
    // 送信成功直後はリセット、それ以外は入力保持（次回開いた時に復元）
    if (state === 'sent') {
      setMessage('');
      setError(null);
      setState('editing');
    } else if (state === 'sending') {
      // 送信中は閉じるをブロック（多重送信回避）
      return;
    }
    setOpen(false);
    // A11y: 閉じた直後にトリガー要素（FAB）へフォーカスを戻す
    // requestAnimationFrame で React の DOM 更新後に遅延実行
    requestAnimationFrame(() => fabRef.current?.focus());
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || state === 'sending') return;
    submit.mutate();
  }

  if (!profile) return null;

  const counterClass = message.length > 800 ? 'feedback-counter warn' : 'feedback-counter';

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        className="feedback-fab"
        aria-label="フィードバックを送信"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '×' : '💬'}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="feedback-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-panel-title"
        >
          <div className="feedback-panel-head">
            <strong id="feedback-panel-title">フィードバック</strong>
            <button
              type="button"
              className="feedback-panel-close"
              aria-label="閉じる"
              onClick={closePanel}
              disabled={state === 'sending'}
            >
              ×
            </button>
          </div>

          {state === 'sent' ? (
            <div className="feedback-sent" role="status">
              <div className="feedback-sent-check" aria-hidden="true">✓</div>
              <div>
                <strong>フィードバックを送信しました</strong>
                <p className="feedback-sent-sub">ご協力ありがとうございます。</p>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="feedback-form">
              <div className="feedback-cat-group" role="radiogroup" aria-label="カテゴリ">
                {FEEDBACK_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={category === c}
                    className={`feedback-cat ${category === c ? 'active' : ''}`}
                    onClick={() => setCategory(c)}
                  >
                    {FEEDBACK_CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                className="feedback-message"
                placeholder="バグ報告 / 機能要望 / その他、自由にお書きください"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={5}
                disabled={state === 'sending'}
              />
              <div className={counterClass}>{message.length} / 1000</div>

              {state === 'error' && error && (
                <div className="auth-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary sm"
                disabled={!message.trim() || state === 'sending'}
              >
                {state === 'sending' ? <Spinner /> : '送信'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
