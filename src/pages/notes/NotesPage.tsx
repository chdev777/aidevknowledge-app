import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notesDb } from '../../lib/db/index.js';
import { searchByFields } from '../../lib/utils/search.js';
import { PageHeader } from '../../components/shared/PageHeader.js';
import { NoteRow } from '../../components/rows/NoteRow.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { Icon } from '../../components/shared/Icon.js';

export function NotesPage() {
  const [, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const q = useQuery({
    queryKey: ['notes', 'shared'],
    queryFn: () => notesDb.findShared({ count: 200 }),
  });
  const filtered = useMemo(() => {
    if (!q.data) return [];
    return searchByFields(q.data, search, ['title', 'purpose', 'result', 'conclusion']);
  }, [q.data, search]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="03 · NOTES"
        title="検証メモ"
        subtitle="実際に試した結果を、目的・方法・結果・結論の構造で蓄積する。"
        actions={
          <button
            type="button"
            className="btn primary sm"
            onClick={() => setParams({ compose: 'note' })}
          >
            <Icon name="plus" size={13} />
            メモを書く
          </button>
        }
      />

      <div style={{ padding: '14px 0 0' }}>
        <input
          type="search"
          placeholder="タイトル・目的・結果・結論で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="list-search"
        />
      </div>

      {q.isPending && <Spinner />}
      {q.data && filtered.length === 0 && <EmptyState title="該当するメモはありません" />}

      {filtered.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 14 }}>
          {filtered.map((n) => (
            <NoteRow key={n.id} note={n} />
          ))}
        </div>
      )}
    </div>
  );
}
