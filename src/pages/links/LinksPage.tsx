import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { linksDb } from '../../lib/db/index.js';
import { searchByFields } from '../../lib/utils/search.js';
import { LINK_STATUS_VALUES, SOURCE_TYPES, type LinkStatus, type SourceType } from '../../types/link.js';
import { ImportanceBadge, SourceTypeBadge, StatusBadge } from '../../components/shared/StatusBadge.js';
import { TagList } from '../../components/shared/Tag.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { Spinner } from '../../components/shared/Spinner.js';

type StatusFilter = 'all' | LinkStatus;
type SourceFilter = 'all' | SourceType;

export function LinksPage() {
  const [, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const q = useQuery({
    queryKey: ['links', 'shared'],
    queryFn: () => linksDb.findShared({ count: 200 }),
  });

  const filtered = useMemo(() => {
    if (!q.data) return [];
    return searchByFields(
      q.data.filter((l) => {
        if (statusFilter !== 'all' && l.status !== statusFilter) return false;
        if (sourceFilter !== 'all' && l.sourceType !== sourceFilter) return false;
        return true;
      }),
      search,
      ['title', 'summary', 'userComment'],
    );
  }, [q.data, search, statusFilter, sourceFilter]);

  const compose = () => setParams({ compose: 'link' });

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">URL共有</h1>
            <p className="page-subtitle">
              共有された外部URLの一覧。なぜ参考になるかが残されています。
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={compose}>
            ＋ URLを共有
          </button>
        </div>
      </header>

      <div className="list-toolbar">
        <input
          type="search"
          placeholder="タイトル・概要・コメントで検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="list-search"
        />
        <select
          className="list-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">すべてのステータス</option>
          {LINK_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="list-filter"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
        >
          <option value="all">すべての種別</option>
          {SOURCE_TYPES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {q.isPending && <div className="section-loading"><Spinner /></div>}
      {q.data && filtered.length === 0 && (
        <EmptyState
          title="該当するURLはありません"
          description="検索条件を変えるか、新規登録してください。"
        />
      )}
      <ul className="row-list">
        {filtered.map((l) => (
          <li key={l.id} className="row-item">
            <Link to={`/links/${l.id}`} className="row-link">
              <div className="row-meta">
                <SourceTypeBadge value={l.sourceType} />
                <span className="mono row-domain">{l.domain}</span>
                <ImportanceBadge value={l.importance} />
                <StatusBadge value={l.status} />
              </div>
              <div className="row-title">{l.title}</div>
              <div className="row-comment">{l.userComment || l.summary}</div>
              <TagList names={l.tags} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
