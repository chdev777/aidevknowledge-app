import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appsDb } from '../../lib/db/index.js';
import { searchByFields } from '../../lib/utils/search.js';
import { APP_STATUS_VALUES, type AppStatus } from '../../types/app.js';
import { PageHeader } from '../../components/shared/PageHeader.js';
import { FilterBar } from '../../components/shared/FilterBar.js';
import { AppRow } from '../../components/rows/AppRow.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { Icon } from '../../components/shared/Icon.js';

type Filter = 'all' | AppStatus;

export function AppsPage() {
  const [, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Filter>('all');

  const q = useQuery({
    queryKey: ['apps', 'shared'],
    queryFn: () => appsDb.findShared({ count: 200 }),
  });
  const all = q.data ?? [];

  const filters = useMemo(
    () => [
      { key: 'all' as const, label: 'すべて', count: all.length },
      ...APP_STATUS_VALUES.map((s) => ({
        key: s,
        label: s,
        count: all.filter((x) => x.status === s).length,
      })),
    ],
    [all],
  );

  const filtered = useMemo(() => {
    return searchByFields(
      all.filter((a) => (status === 'all' ? true : a.status === status)),
      search,
      ['name', 'summary', 'purpose'],
    );
  }, [all, search, status]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="04 · APPS"
        title="作成アプリ"
        subtitle="担当者が作成したAIアプリと、関係者からのコメント・レビューを集約する。"
        actions={
          <button
            type="button"
            className="btn primary sm"
            onClick={() => setParams({ compose: 'app' })}
          >
            <Icon name="plus" size={13} />
            アプリを登録
          </button>
        }
      />

      <FilterBar filters={filters} value={status} onChange={setStatus} groupLabel="ステータス" />

      <div style={{ padding: '14px 0 0' }}>
        <input
          type="search"
          placeholder="アプリ名・概要・目的で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="list-search"
        />
      </div>

      {q.isPending && <Spinner />}
      {q.data && filtered.length === 0 && <EmptyState title="該当するアプリはありません" />}

      {filtered.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 14 }}>
          {filtered.map((a) => (
            <AppRow key={a.id} app={a} />
          ))}
        </div>
      )}
    </div>
  );
}
