import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { questionsDb } from '../../lib/db/index.js';
import { searchByFields } from '../../lib/utils/search.js';
import { PageHeader } from '../../components/shared/PageHeader.js';
import { FilterBar } from '../../components/shared/FilterBar.js';
import { QARow } from '../../components/rows/QARow.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { Icon } from '../../components/shared/Icon.js';

type Filter = 'all' | 'unanswered' | 'answered';

export function QAPage() {
  const [, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const q = useQuery({
    queryKey: ['questions', 'shared'],
    queryFn: () => questionsDb.findShared({ count: 200 }),
  });
  const all = q.data ?? [];

  const filters = useMemo(
    () => [
      { key: 'all' as const, label: 'すべて', count: all.length },
      {
        key: 'unanswered' as const,
        label: '未回答',
        count: all.filter((x) => x.answerCount === 0).length,
      },
      {
        key: 'answered' as const,
        label: '回答あり',
        count: all.filter((x) => x.answerCount > 0).length,
      },
    ],
    [all],
  );

  const filtered = useMemo(() => {
    return searchByFields(
      all.filter((qq) => {
        if (filter === 'unanswered') return qq.answerCount === 0;
        if (filter === 'answered') return qq.answerCount > 0;
        return true;
      }),
      search,
      ['title', 'body'],
    );
  }, [all, search, filter]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="02 · QUESTIONS"
        title="Q&A"
        subtitle="AIアプリ開発に関する疑問を投稿し、回答を蓄積する。"
        actions={
          <button
            type="button"
            className="btn primary sm"
            onClick={() => setParams({ compose: 'question' })}
          >
            <Icon name="plus" size={13} />
            質問する
          </button>
        }
      />

      <FilterBar filters={filters} value={filter} onChange={setFilter} />

      <div style={{ padding: '14px 0 0' }}>
        <input
          type="search"
          placeholder="タイトル・本文で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="list-search"
        />
      </div>

      {q.isPending && <Spinner />}
      {q.data && filtered.length === 0 && (
        <EmptyState title="該当する質問はありません" />
      )}
      {filtered.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 14 }}>
          {filtered.map((qq) => (
            <QARow key={qq.id} q={qq} />
          ))}
        </div>
      )}
    </div>
  );
}
