import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionsDb } from '../../lib/db/index.js';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { questionInputSchema } from '../../lib/schemas/question.js';
import type { QuestionStatus } from '../../types/question.js';
import type { Visibility } from '../../types/visibility.js';
import { toAppError } from '../../lib/utils/error.js';
import { Spinner } from '../shared/Spinner.js';
import { TagInput } from './TagInput.js';
import { VisibilityRadio } from './VisibilityRadio.js';
import { useDraft } from './useDraft.js';
import { DraftRestoredBanner } from './DraftRestoredBanner.js';

interface DraftState {
  title: string;
  body: string;
  tags: string[];
  visibility: Visibility;
}

const INITIAL: DraftState = {
  title: '',
  body: '',
  tags: [],
  visibility: 'private',
};

export function QuestionForm({ onDone }: { onDone: (id: string) => void }) {
  const { fbUser } = useAuth();
  const qc = useQueryClient();
  const { value: draft, set: setDraft, clear: clearDraft, wasRestored } = useDraft<DraftState>('question', INITIAL);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof DraftState>(k: K, v: DraftState[K]) =>
    setDraft({ ...draft, [k]: v });

  const m = useMutation({
    mutationFn: async () => {
      if (!fbUser) throw new Error('not signed in');
      const parsed = questionInputSchema.parse({
        title: draft.title,
        body: draft.body,
        status: '未回答',
        tags: draft.tags,
        visibility: draft.visibility,
      });
      const id = await questionsDb.create(fbUser.uid, {
        title: parsed.title,
        body: parsed.body,
        status: parsed.status as QuestionStatus,
        tags: parsed.tags,
        visibility: parsed.visibility as Visibility,
      });
      return id;
    },
    onSuccess: async (id) => {
      clearDraft();
      await qc.invalidateQueries({ queryKey: ['questions'] });
      await qc.invalidateQueries({ queryKey: ['home', 'unansweredQuestions'] });
      onDone(id);
    },
    onError: (err) => setError(toAppError(err).userMessage),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    m.mutate();
  };

  return (
    <form className="compose-form" onSubmit={onSubmit}>
      <DraftRestoredBanner visible={wasRestored} onDiscard={clearDraft} />
      <label className="auth-field">
        <span>タイトル</span>
        <input
          required
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          maxLength={200}
          placeholder="質問タイトル"
        />
      </label>
      <label className="auth-field">
        <span>本文</span>
        <textarea
          rows={6}
          required
          value={draft.body}
          onChange={(e) => set('body', e.target.value)}
          placeholder="状況・試したこと・期待する結果..."
        />
      </label>
      <div className="auth-field">
        <span>タグ</span>
        <TagInput value={draft.tags} onChange={(t) => set('tags', t)} />
      </div>
      <VisibilityRadio
        value={draft.visibility}
        onChange={(v) => set('visibility', v)}
      />
      {error && <div className="auth-error">{error}</div>}
      <div className="compose-foot">
        <span className="mono compose-draft-hint">下書きは自動保存されます</span>
        <button type="submit" className="btn btn-primary" disabled={m.isPending}>
          {m.isPending ? <Spinner /> : '質問する'}
        </button>
      </div>
    </form>
  );
}
