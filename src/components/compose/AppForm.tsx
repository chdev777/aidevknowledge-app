import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appsDb } from '../../lib/db/index.js';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { appInputSchema } from '../../lib/schemas/app.js';
import { APP_STATUS_VALUES, USAGE_SCOPE_VALUES, type AppStatus, type UsageScope } from '../../types/app.js';
import type { Visibility } from '../../types/visibility.js';
import { toAppError } from '../../lib/utils/error.js';
import { Spinner } from '../shared/Spinner.js';
import { TagInput } from './TagInput.js';
import { VisibilityRadio } from './VisibilityRadio.js';
import { useDraft } from './useDraft.js';

interface DraftState {
  name: string;
  url: string;
  summary: string;
  purpose: string;
  technologies: string[];
  aiModel: string;
  usageScope: UsageScope;
  status: AppStatus;
  caution: string;
  tags: string[];
  visibility: Visibility;
}

const INITIAL: DraftState = {
  name: '',
  url: '',
  summary: '',
  purpose: '',
  technologies: [],
  aiModel: '',
  usageScope: '個人検証',
  status: '試作',
  caution: '',
  tags: [],
  visibility: 'private',
};

export function AppForm({ onDone }: { onDone: (id: string) => void }) {
  const { fbUser } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft, clearDraft] = useDraft<DraftState>('app', INITIAL);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof DraftState>(k: K, v: DraftState[K]) =>
    setDraft({ ...draft, [k]: v });

  const m = useMutation({
    mutationFn: async () => {
      if (!fbUser) throw new Error('not signed in');
      const parsed = appInputSchema.parse({
        name: draft.name,
        url: draft.url,
        summary: draft.summary,
        purpose: draft.purpose,
        technologies: draft.technologies,
        aiModel: draft.aiModel,
        usageScope: draft.usageScope,
        status: draft.status,
        caution: draft.caution,
        tags: draft.tags,
        visibility: draft.visibility,
      });
      const id = await appsDb.create(fbUser.uid, {
        name: parsed.name,
        url: parsed.url,
        summary: parsed.summary,
        purpose: parsed.purpose,
        technologies: parsed.technologies,
        aiModel: parsed.aiModel,
        usageScope: parsed.usageScope as UsageScope,
        status: parsed.status as AppStatus,
        caution: parsed.caution,
        tags: parsed.tags,
        visibility: parsed.visibility as Visibility,
      });
      return id;
    },
    onSuccess: async (id) => {
      clearDraft();
      await qc.invalidateQueries({ queryKey: ['apps'] });
      await qc.invalidateQueries({ queryKey: ['home', 'recentApps'] });
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
      <label className="auth-field">
        <span>アプリ名</span>
        <input required value={draft.name} onChange={(e) => set('name', e.target.value)} />
      </label>
      <label className="auth-field">
        <span>アプリURL</span>
        <input
          type="url"
          required
          value={draft.url}
          onChange={(e) => set('url', e.target.value)}
        />
      </label>
      <label className="auth-field">
        <span>概要 <em className="mono">何をするアプリか</em></span>
        <textarea rows={2} value={draft.summary} onChange={(e) => set('summary', e.target.value)} />
      </label>
      <label className="auth-field">
        <span>開発目的 <em className="mono">どの課題を解決するか</em></span>
        <textarea rows={2} value={draft.purpose} onChange={(e) => set('purpose', e.target.value)} />
      </label>
      <div className="auth-field">
        <span>使用技術 <em className="mono">Dify, Next.js, Python など</em></span>
        <TagInput value={draft.technologies} onChange={(t) => set('technologies', t)} placeholder="Enter で追加" />
      </div>
      <label className="auth-field">
        <span>利用AI <em className="mono">ChatGPT API / Claude / Gemini など</em></span>
        <input value={draft.aiModel} onChange={(e) => set('aiModel', e.target.value)} />
      </label>
      <div className="compose-row-2">
        <label className="auth-field">
          <span>利用範囲</span>
          <select value={draft.usageScope} onChange={(e) => set('usageScope', e.target.value as UsageScope)}>
            {USAGE_SCOPE_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field">
          <span>ステータス</span>
          <select value={draft.status} onChange={(e) => set('status', e.target.value as AppStatus)}>
            {APP_STATUS_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="auth-field">
        <span>注意事項 <em className="mono">入力禁止情報・既知の不具合</em></span>
        <textarea rows={2} value={draft.caution} onChange={(e) => set('caution', e.target.value)} />
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
          {m.isPending ? <Spinner /> : '登録'}
        </button>
      </div>
    </form>
  );
}
