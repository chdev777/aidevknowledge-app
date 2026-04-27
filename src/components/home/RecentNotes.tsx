import { useQuery } from '@tanstack/react-query';
import { notesDb } from '../../lib/db/index.js';
import { EmptyState } from '../shared/EmptyState.js';
import { Spinner } from '../shared/Spinner.js';
import { NoteRow } from '../rows/NoteRow.js';

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
