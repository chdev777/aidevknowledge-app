import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LinkForm } from './LinkForm.js';
import { QuestionForm } from './QuestionForm.js';
import { NoteForm } from './NoteForm.js';
import { AppForm } from './AppForm.js';

export type ComposeKind = 'link' | 'question' | 'note' | 'app';

const KINDS: ReadonlySet<ComposeKind> = new Set(['link', 'question', 'note', 'app']);

const TITLES: Record<ComposeKind, string> = {
  link: 'URL を共有',
  question: '質問する',
  note: '検証メモを書く',
  app: '作成アプリを登録',
};

/**
 * URL クエリパラメータ駆動のモーダル：
 *   ?compose=link で開く / ?compose=（空 or なし）で閉じる
 *   下書きは localStorage バックアップ（Form 側で管理）
 */
export function ComposeModal() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const compose = params.get('compose');

  const kind = useMemo<ComposeKind | null>(() => {
    if (!compose || !KINDS.has(compose as ComposeKind)) return null;
    return compose as ComposeKind;
  }, [compose]);

  const close = () => {
    const next = new URLSearchParams(params);
    next.delete('compose');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (!kind) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  if (!kind) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="compose-modal">
        <div className="compose-head">
          <h2 className="modal-title">{TITLES[kind]}</h2>
          <button type="button" className="btn btn-ghost" onClick={close}>
            閉じる
          </button>
        </div>
        <div className="compose-body">
          {kind === 'link' && (
            <LinkForm
              onDone={(id) => {
                close();
                navigate(`/links/${id}`);
              }}
            />
          )}
          {kind === 'question' && (
            <QuestionForm
              onDone={(id) => {
                close();
                navigate(`/qa/${id}`);
              }}
            />
          )}
          {kind === 'note' && (
            <NoteForm
              onDone={(id) => {
                close();
                navigate(`/notes/${id}`);
              }}
            />
          )}
          {kind === 'app' && (
            <AppForm
              onDone={(id) => {
                close();
                navigate(`/apps/${id}`);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
