import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../shared/EmptyState.js';
import { Icon } from '../shared/Icon.js';
import type { ComposeKind } from '../compose/ComposeModal.js';

const KINDS: ComposeKind[] = ['link', 'question', 'note', 'app'];

const KIND_LABELS: Record<ComposeKind, string> = {
  link: 'URL共有',
  question: 'Q&A',
  note: '検証メモ',
  app: '作成アプリ',
};

interface DraftEntry {
  kind: ComposeKind;
  preview: string;
  raw: Record<string, unknown>;
}

function loadDrafts(): DraftEntry[] {
  const drafts: DraftEntry[] = [];
  for (const kind of KINDS) {
    try {
      const raw = localStorage.getItem(`aidev:draft:${kind}`);
      if (!raw) continue;
      const data = JSON.parse(raw) as Record<string, unknown>;
      const preview = pickPreview(data);
      if (!preview) continue;
      drafts.push({ kind, preview, raw: data });
    } catch {
      /* ignore parse errors */
    }
  }
  return drafts;
}

function pickPreview(data: Record<string, unknown>): string {
  // 各 kind の主要フィールドを順に試す
  const candidates = ['title', 'name', 'url', 'body', 'purpose', 'summary'];
  for (const key of candidates) {
    const v = data[key];
    if (typeof v === 'string' && v.trim().length > 0) {
      return v.trim().slice(0, 80);
    }
  }
  return '';
}

export function MyDrafts() {
  const [drafts, setDrafts] = useState<DraftEntry[]>(() => loadDrafts());
  const [, setParams] = useSearchParams();

  // 他タブからの変更を反映
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('aidev:draft:')) setDrafts(loadDrafts());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const resume = (kind: ComposeKind) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('compose', kind);
      return next;
    });
  };

  const discard = (kind: ComposeKind) => {
    if (!window.confirm(`${KIND_LABELS[kind]} の下書きを破棄しますか？`)) return;
    try {
      localStorage.removeItem(`aidev:draft:${kind}`);
    } catch {
      /* ignore */
    }
    setDrafts(loadDrafts());
  };

  if (drafts.length === 0) {
    return (
      <EmptyState
        title="下書きはありません"
        description="投稿フォームを途中で閉じると、入力内容が自動保存されてここに表示されます。"
      />
    );
  }

  return (
    <div style={{ borderTop: '1px solid var(--line)' }}>
      {drafts.map((d) => (
        <div key={d.kind} className="me-row">
          <div className="me-row-icon">{KIND_LABELS[d.kind]}</div>
          <div style={{ minWidth: 0 }}>
            <div className="me-row-title">{d.preview || '（無題の下書き）'}</div>
            <div className="me-row-meta">
              <span className="mono">{d.kind}</span>
              <span>· 自動保存済み</span>
            </div>
          </div>
          <div className="me-actions">
            <button type="button" className="btn xs btn-primary" onClick={() => resume(d.kind)}>
              <Icon name="arrow" size={11} />
              編集を再開
            </button>
            <button
              type="button"
              className="btn xs btn-destructive"
              onClick={() => discard(d.kind)}
            >
              破棄
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
