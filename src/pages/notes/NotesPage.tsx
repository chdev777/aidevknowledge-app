import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notesDb } from '../../lib/db/index.js';
import { searchByFields } from '../../lib/utils/search.js';
import { TagList } from '../../components/shared/Tag.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { Spinner } from '../../components/shared/Spinner.js';

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
      <header className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">検証メモ</h1>
            <p className="page-subtitle">試した結果を「目的 / 試したこと / 結果 / 結論」で蓄積</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setParams({ compose: 'note' })}
          >
            ＋ メモを書く
          </button>
        </div>
      </header>

      <div className="list-toolbar">
        <input
          type="search"
          placeholder="タイトル・目的・結果・結論で検索"
          className="list-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {q.isPending && <div className="section-loading"><Spinner /></div>}
      {q.data && filtered.length === 0 && <EmptyState title="該当するメモはありません" />}

      <ul className="row-list">
        {filtered.map((n) => (
          <li key={n.id} className="row-item">
            <Link to={`/notes/${n.id}`} className="row-link">
              <div className="row-title">{n.title}</div>
              <div className="row-comment">{n.purpose || n.result}</div>
              <TagList names={n.tags} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
