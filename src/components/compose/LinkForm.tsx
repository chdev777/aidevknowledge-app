import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { linksDb } from '../../lib/db/index.js';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { linkInputSchema } from '../../lib/schemas/link.js';
import {
  IMPORTANCE_VALUES,
  LINK_STATUS_VALUES,
  type Importance,
  type LinkStatus,
  type SourceType,
} from '../../types/link.js';
import type { Visibility } from '../../types/visibility.js';
import { detectSourceType, extractDomain, extractYoutubeVideoId, youtubeThumbnailUrl } from '../../lib/utils/url.js';
import { fetchOg, isOgEmpty, OgFetchError } from '../../lib/utils/og.js';
import { toAppError } from '../../lib/utils/error.js';
import { Spinner } from '../shared/Spinner.js';
import { TagInput } from './TagInput.js';
import { VisibilityRadio } from './VisibilityRadio.js';
import { useDraft } from './useDraft.js';
import { DraftRestoredBanner } from './DraftRestoredBanner.js';

interface DraftState {
  url: string;
  title: string;
  summary: string;
  userComment: string;
  importance: Importance;
  status: LinkStatus;
  tags: string[];
  thumbnailUrl: string;
  visibility: Visibility;
}

const INITIAL: DraftState = {
  url: '',
  title: '',
  summary: '',
  userComment: '',
  importance: '中',
  status: '未確認',
  tags: [],
  thumbnailUrl: '',
  visibility: 'private',
};

export function LinkForm({ onDone }: { onDone: (id: string) => void }) {
  const { fbUser } = useAuth();
  const qc = useQueryClient();
  const { value: draft, set: setDraft, clear: clearDraft, wasRestored } = useDraft<DraftState>('link', INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [metaInfo, setMetaInfo] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const set = <K extends keyof DraftState>(k: K, v: DraftState[K]) =>
    setDraft({ ...draft, [k]: v });

  const onUrlBlur = async () => {
    if (!draft.url) return;
    const ytId = extractYoutubeVideoId(draft.url);
    if (ytId && !draft.thumbnailUrl) {
      set('thumbnailUrl', youtubeThumbnailUrl(ytId));
    }
  };

  const fetchMeta = async () => {
    if (!draft.url) return;
    setFetching(true);
    setMetaInfo(null);
    setError(null);
    try {
      const og = await fetchOg(draft.url);
      if (isOgEmpty(og)) {
        setMetaInfo(
          'メタ情報が取得できませんでした。サイトが非ブラウザからのアクセスを制限しているか、未公開の可能性があります。タイトル等は手動で入力してください。',
        );
        return;
      }
      const filled: string[] = [];
      if (og.title && !draft.title) {
        set('title', og.title);
        filled.push('タイトル');
      }
      if (og.description && !draft.summary) {
        set('summary', og.description);
        filled.push('概要');
      }
      if (og.image && !draft.thumbnailUrl) {
        set('thumbnailUrl', og.image);
        filled.push('サムネイル');
      }
      setMetaInfo(
        filled.length > 0
          ? `取得しました: ${filled.join(' / ')}`
          : '既に入力済のため自動入力はスキップしました（取得自体は成功）',
      );
    } catch (e: unknown) {
      const msg = e instanceof OgFetchError ? e.message : '取得に失敗しました';
      setError(`メタ取得エラー: ${msg}`);
    } finally {
      setFetching(false);
    }
  };

  const m = useMutation({
    mutationFn: async () => {
      if (!fbUser) throw new Error('not signed in');
      const sourceType: SourceType = detectSourceType(draft.url);
      const parsed = linkInputSchema.parse({
        title: draft.title,
        url: draft.url,
        sourceType,
        domain: extractDomain(draft.url),
        summary: draft.summary,
        userComment: draft.userComment,
        importance: draft.importance,
        status: draft.status,
        tags: draft.tags,
        visibility: draft.visibility,
        thumbnailUrl: draft.thumbnailUrl || undefined,
      });
      const id = await linksDb.create(fbUser.uid, {
        title: parsed.title,
        url: parsed.url,
        sourceType: parsed.sourceType as SourceType,
        domain: parsed.domain,
        summary: parsed.summary,
        userComment: parsed.userComment,
        importance: parsed.importance as Importance,
        status: parsed.status as LinkStatus,
        tags: parsed.tags,
        visibility: parsed.visibility as Visibility,
        thumbnailUrl: parsed.thumbnailUrl,
      });
      return id;
    },
    onSuccess: async (id) => {
      clearDraft();
      await qc.invalidateQueries({ queryKey: ['links'] });
      await qc.invalidateQueries({ queryKey: ['home', 'recentLinks'] });
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
    <form onSubmit={onSubmit} className="compose-form">
      <DraftRestoredBanner visible={wasRestored} onDiscard={clearDraft} />
      <label className="auth-field">
        <span>URL</span>
        <input
          type="url"
          required
          value={draft.url}
          onChange={(e) => set('url', e.target.value)}
          onBlur={onUrlBlur}
          placeholder="https://..."
        />
        <button
          type="button"
          className="btn btn-ghost mono"
          onClick={fetchMeta}
          disabled={fetching || !draft.url}
        >
          {fetching ? <Spinner /> : 'メタ取得'}
        </button>
        {metaInfo && (
          <div
            className="mono"
            style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}
          >
            {metaInfo}
          </div>
        )}
      </label>

      <label className="auth-field">
        <span>タイトル</span>
        <input
          required
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          maxLength={200}
        />
      </label>

      <label className="auth-field">
        <span>概要</span>
        <textarea
          rows={2}
          value={draft.summary}
          onChange={(e) => set('summary', e.target.value)}
          maxLength={2000}
        />
      </label>

      <label className="auth-field">
        <span>共有コメント <em className="mono">なぜ参考になるか</em></span>
        <textarea
          rows={3}
          value={draft.userComment}
          onChange={(e) => set('userComment', e.target.value)}
          maxLength={2000}
        />
      </label>

      <div className="compose-row-2">
        <label className="auth-field">
          <span>重要度</span>
          <select
            value={draft.importance}
            onChange={(e) => set('importance', e.target.value as Importance)}
          >
            {IMPORTANCE_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field">
          <span>ステータス</span>
          <select
            value={draft.status}
            onChange={(e) => set('status', e.target.value as LinkStatus)}
          >
            {LINK_STATUS_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

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
          {m.isPending ? <Spinner /> : '登録'}
        </button>
      </div>
    </form>
  );
}
