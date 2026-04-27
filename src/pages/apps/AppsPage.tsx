import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appsDb } from '../../lib/db/index.js';
import { searchByFields } from '../../lib/utils/search.js';
import { APP_STATUS_VALUES, type AppStatus } from '../../types/app.js';
import { StatusBadge } from '../../components/shared/StatusBadge.js';
import { TagList } from '../../components/shared/Tag.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { Spinner } from '../../components/shared/Spinner.js';

export function AppsPage() {
  const [, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | AppStatus>('all');

  const q = useQuery({
    queryKey: ['apps', 'shared'],
    queryFn: () => appsDb.findShared({ count: 200 }),
  });

  const filtered = useMemo(() => {
    if (!q.data) return [];
    return searchByFields(
      q.data.filter((a) => (status === 'all' ? true : a.status === status)),
      search,
      ['name', 'summary', 'purpose'],
    );
  }, [q.data, search, status]);

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">作成アプリ</h1>
            <p className="page-subtitle">担当者が作成したAIアプリの共有とレビュー</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setParams({ compose: 'app' })}
          >
            ＋ アプリを登録
          </button>
        </div>
      </header>

      <div className="list-toolbar">
        <input
          type="search"
          placeholder="アプリ名・概要・目的で検索"
          className="list-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="list-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'all' | AppStatus)}
        >
          <option value="all">すべてのステータス</option>
          {APP_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {q.isPending && <div className="section-loading"><Spinner /></div>}
      {q.data && filtered.length === 0 && <EmptyState title="該当するアプリはありません" />}

      <ul className="row-list">
        {filtered.map((a) => (
          <li key={a.id} className="row-item">
            <Link to={`/apps/${a.id}`} className="row-link">
              <div className="row-meta">
                <StatusBadge value={a.status} />
                <span className="mono row-domain">{a.usageScope}</span>
              </div>
              <div className="row-title">{a.name}</div>
              <div className="row-comment">{a.summary}</div>
              <TagList names={a.tags} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
