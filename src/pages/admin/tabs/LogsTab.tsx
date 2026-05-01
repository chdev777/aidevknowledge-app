import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminLogsDb } from '../../../lib/db/index.js';
import { FilterBar } from '../../../components/shared/FilterBar.js';
import { Spinner } from '../../../components/shared/Spinner.js';
import { EmptyState } from '../../../components/shared/EmptyState.js';
import { timeAgo } from '../../../lib/utils/time.js';
import {
  ADMIN_LOG_ACTIONS,
  type AdminLogAction,
} from '../../../lib/schemas/admin-log.js';

type ActionFilter = 'all' | AdminLogAction;

const ACTION_LABEL: Record<AdminLogAction, string> = {
  set_role: 'ロール変更',
  delete_link: 'URL削除',
  delete_qa: 'Q&A削除',
  delete_note: '検証メモ削除',
  delete_app: 'アプリ削除',
  create_tag: 'タグ作成',
  update_tag: 'タグ更新',
  delete_tag: 'タグ削除',
  set_feedback_status: 'フィードバック状態変更',
  delete_user: 'ユーザー削除',
};

const FILTERS: { key: ActionFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  ...ADMIN_LOG_ACTIONS.map((a) => ({ key: a as ActionFilter, label: ACTION_LABEL[a] })),
];

export function LogsTab() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');

  const logsQ = useQuery({
    queryKey: ['admin', 'logs', 'all'],
    queryFn: () => adminLogsDb.findRecent(200),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const all = logsQ.data ?? [];
    const s = search.trim().toLowerCase();
    return all.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (!s) return true;
      return (
        log.actorHandle.toLowerCase().includes(s) ||
        log.targetId.toLowerCase().includes(s) ||
        (log.reason ?? '').toLowerCase().includes(s)
      );
    });
  }, [logsQ.data, search, actionFilter]);

  if (logsQ.isPending) return <Spinner />;

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <input
          type="text"
          className="admin-search"
          placeholder="@ハンドル / targetId / 理由 で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FilterBar
          filters={FILTERS}
          value={actionFilter}
          onChange={setActionFilter}
          groupLabel="操作"
        />
        <div className="admin-toolbar-note">
          ※ admin_logs は不変ログです。Rules で update / delete を禁止しています。最大 200 件まで表示。
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="該当するログはありません" />
      ) : (
        <div className="admin-rows">
          {filtered.map((log) => (
            <div key={log.id} className="admin-row">
              <span className="badge" data-status="ログ" style={{ flexShrink: 0 }}>
                {ACTION_LABEL[log.action]}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="admin-row-meta">
                  <span>@{log.actorHandle}</span>
                  <span className="dot-sep">·</span>
                  <span className="mono">{log.targetType}/{log.targetId}</span>
                  {log.reason && (
                    <>
                      <span className="dot-sep">·</span>
                      <span>理由: {log.reason}</span>
                    </>
                  )}
                </div>
                {log.targetSnapshot && (
                  <details style={{ marginTop: 4 }}>
                    <summary
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      snapshot を表示
                    </summary>
                    <pre
                      style={{
                        fontSize: 11,
                        background: 'var(--bg-2)',
                        padding: 8,
                        borderRadius: 4,
                        overflow: 'auto',
                        marginTop: 4,
                      }}
                    >
                      {JSON.stringify(log.targetSnapshot, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>
                {timeAgo(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
