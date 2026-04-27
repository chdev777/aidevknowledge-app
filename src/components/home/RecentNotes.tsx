import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notesDb } from '../../lib/db/index.js';
import { EmptyState } from '../shared/EmptyState.js';
import { Spinner } from '../shared/Spinner.js';
import { timeAgo } from '../../lib/utils/time.js';
import type { Note } from '../../types/note.js';

export function RecentNotes() {
  const q = useQuery({
    queryKey: ['home', 'recentNotes'],
    queryFn: () => notesDb.findShared({ count: 3 }),
  });
  const items = q.data ?? [];

  return (
    <>
      <div className="section-title">最近の検証メモ</div>
      {q.isPending && <Spinner />}
      {q.data && items.length === 0 && (
        <EmptyState title="検証メモはまだありません" />
      )}
      {items.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {items.map((n) => (
            <NoteRow key={n.id} note={n} />
          ))}
        </div>
      )}
    </>
  );
}

function NoteRow({ note }: { note: Note }) {
  const nav = useNavigate();
  return (
    <div
      className="row"
      style={{ gridTemplateColumns: '1fr auto' }}
      onClick={() => nav(`/notes/${note.id}`)}
    >
      <div>
        <div className="row-title">{note.title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', margin: '4px 0 8px', lineHeight: 1.55 }}>
          <b style={{ color: 'var(--ink-2)', fontWeight: 500 }}>目的:</b> {note.purpose}
        </div>
        <div className="row-meta">
          {note.tags.slice(0, 3).map((t) => (
            <span key={t} className="tag"><span className="tag-dot" />{t}</span>
          ))}
          <span className="dot-sep">·</span>
          <span>{timeAgo(note.createdAt)}</span>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
          minWidth: 100,
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
          関連URL {note.links?.length ?? 0}
        </span>
      </div>
    </div>
  );
}
