import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { linksDb } from '../../lib/db/index.js';
import { searchByFields } from '../../lib/utils/search.js';
import { LINK_STATUS_VALUES, SOURCE_TYPES, type LinkStatus, type SourceType } from '../../types/link.js';
import { PageHeader } from '../../components/shared/PageHeader.js';
import { FilterBar } from '../../components/shared/FilterBar.js';
import { LinkRow } from '../../components/rows/LinkRow.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { Icon } from '../../components/shared/Icon.js';

type SourceFilter = 'all' | SourceType;
type StatusFilter = 'all' | LinkStatus;

export function LinksPage() {
  const [, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const q = useQuery({
    queryKey: ['links', 'shared'],
    queryFn: () => linksDb.findShared({ count: 200 }),
  });

  const all = q.data ?? [];

  const sources = useMemo(
    () => [
      { key: 'all' as const, label: 'すべて', count: all.length },
      ...SOURCE_TYPES.map((s) => ({
        key: s,
        label: s,
        count: all.filter((l) => l.sourceType === s).length,
      })),
    ],
    [all],
  );

  const statuses = useMemo(
    () => [
      { key: 'all' as const, label: 'すべて' },
      ...LINK_STATUS_VALUES.map((s) => ({ key: s, label: s })),
    ],
    [],
  );

  const filtered = useMemo(() => {
    return searchByFields(
      all.filter((l) => {
        if (source !== 'all' && l.sourceType !== source) return false;
        if (status !== 'all' && l.status !== status) return false;
        return true;
      }),
      search,
      ['title', 'summary', 'userComment'],
    );
  }, [all, search, source, status]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="01 · LINKS"
        title="URL共有"
        subtitle="外部の参考情報を、なぜ共有したのか・何に使えそうかと共に蓄積する。"
        actions={
          <button
            type="button"
            className="btn primary sm"
            onClick={() => setParams({ compose: 'link' })}
          >
            <Icon name="plus" size={13} />
            URLを共有
          </button>
        }
      />

      <FilterBar filters={sources} value={source} onChange={setSource} groupLabel="種別" />
      <FilterBar filters={statuses} value={status} onChange={setStatus} groupLabel="ステータス" />

      <div style={{ padding: '14px 0 0' }}>
        <input
          type="search"
          placeholder="タイトル・概要・コメントで検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="list-search"
        />
      </div>

      {q.isPending && <Spinner />}
      {q.data && filtered.length === 0 && (
        <EmptyState
          title="該当するURLはありません"
          description="検索条件を変えるか、新規登録してください。"
        />
      )}
      {filtered.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 14 }}>
          {filtered.map((l) => (
            <LinkRow key={l.id} link={l} />
          ))}
        </div>
      )}
    </div>
  );
}
