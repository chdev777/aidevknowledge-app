import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesDb } from '../../lib/db/index.js';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { noteInputSchema } from '../../lib/schemas/note.js';
import type { Visibility } from '../../types/visibility.js';
import { toAppError } from '../../lib/utils/error.js';
import { Spinner } from '../shared/Spinner.js';
import { TagInput } from './TagInput.js';
import { VisibilityRadio } from './VisibilityRadio.js';
import { useDraft } from './useDraft.js';
import { DraftRestoredBanner } from './DraftRestoredBanner.js';

interface DraftState {
  title: string;
  purpose: string;
  tried: string;
  result: string;
  conclusion: string;
  tags: string[];
  visibility: Visibility;
}

const INITIAL: DraftState = {
  title: '',
  purpose: '',
  tried: '',
  result: '',
  conclusion: '',
  tags: [],
  visibility: 'private',
};

export function NoteForm({ onDone }: { onDone: (id: string) => void }) {
  const { fbUser } = useAuth();
  const qc = useQueryClient();
  const { value: draft, set: setDraft, clear: clearDraft, wasRestored } = useDraft<DraftState>('note', INITIAL);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof DraftState>(k: K, v: DraftState[K]) =>
    setDraft({ ...draft, [k]: v });

  const m = useMutation({
    mutationFn: async () => {
      if (!fbUser) throw new Error('not signed in');
      const parsed = noteInputSchema.parse({
        title: draft.title,
        purpose: draft.purpose,
        tried: draft.tried,
        result: draft.result,
        conclusion: draft.conclusion,
        tags: draft.tags,
        links: [],
        visibility: draft.visibility,
      });
      const id = await notesDb.create(fbUser.uid, {
        title: parsed.title,
        purpose: parsed.purpose,
        tried: parsed.tried,
        result: parsed.result,
        conclusion: parsed.conclusion,
        tags: parsed.tags,
        links: parsed.links,
        visibility: parsed.visibility as Visibility,
        attachments: [],
      });
      return id;
    },
    onSuccess: async (id) => {
      clearDraft();
      await qc.invalidateQueries({ queryKey: ['notes'] });
      await qc.invalidateQueries({ queryKey: ['home', 'recentNotes'] });
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
        <input required value={draft.title} onChange={(e) => set('title', e.target.value)} />
      </label>
      <label className="auth-field">
        <span>目的 <em className="mono">何を確認したかったか</em></span>
        <textarea rows={2} value={draft.purpose} onChange={(e) => set('purpose', e.target.value)} />
      </label>
      <label className="auth-field">
        <span>試したこと <em className="mono">設定・手順・条件</em></span>
        <textarea rows={4} value={draft.tried} onChange={(e) => set('tried', e.target.value)} />
      </label>
      <label className="auth-field">
        <span>結果 <em className="mono">うまくいった点・課題</em></span>
        <textarea rows={3} value={draft.result} onChange={(e) => set('result', e.target.value)} />
      </label>
      <label className="auth-field">
        <span>結論 <em className="mono">採用可否・今後の対応</em></span>
        <textarea rows={2} value={draft.conclusion} onChange={(e) => set('conclusion', e.target.value)} />
      </label>
      <div className="auth-field">
        <span>タグ</span>
        <TagInput value={draft.tags} onChange={(t) => set('tags', t)} />
      </div>
      <VisibilityRadio value={draft.visibility} onChange={(v) => set('visibility', v)} />
      {error && <div className="auth-error">{error}</div>}
      <div className="compose-foot">
        <span className="mono compose-draft-hint">下書きは自動保存されます</span>
        <button type="submit" className="btn btn-primary" disabled={m.isPending}>
          {m.isPending ? <Spinner /> : 'メモを保存'}
        </button>
      </div>
    </form>
  );
}
