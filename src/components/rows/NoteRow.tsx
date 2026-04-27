import { useNavigate } from 'react-router-dom';
import { useUser } from '../../lib/firebase/use-user.js';
import { timeAgo } from '../../lib/utils/time.js';
import type { Note } from '../../types/note.js';

export function NoteRow({ note }: { note: Note }) {
  const nav = useNavigate();
  const author = useUser(note.createdBy);

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
            <span key={t} className="tag">
              <span className="tag-dot" />
              {t}
            </span>
          ))}
          {author.data && (
            <>
              <span className="dot-sep">·</span>
              <span>{author.data.name}</span>
            </>
          )}
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
