import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminLogsDb, feedbacksDb } from '../../../lib/db/index.js';
import { useAuth } from '../../../lib/firebase/auth-context.js';
import { FilterBar } from '../../../components/shared/FilterBar.js';
import { Spinner } from '../../../components/shared/Spinner.js';
import { EmptyState } from '../../../components/shared/EmptyState.js';
import { timeAgo } from '../../../lib/utils/time.js';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABEL,
  FEEDBACK_STATUSES,
  FEEDBACK_STATUS_LABEL,
  reachableStatuses,
  type Feedback,
  type FeedbackCategory,
  type FeedbackStatus,
} from '../../../types/feedback.js';
import { logger } from '../../../lib/utils/log.js';

type CategoryFilter = 'all' | FeedbackCategory;
type StatusFilter = 'all' | FeedbackStatus;

const CATEGORY_FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  ...FEEDBACK_CATEGORIES.map((c) => ({
    key: c as CategoryFilter,
    label: FEEDBACK_CATEGORY_LABEL[c],
  })),
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  ...FEEDBACK_STATUSES.map((s) => ({
    key: s as StatusFilter,
    label: FEEDBACK_STATUS_LABEL[s],
  })),
];

export function FeedbackTab() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fbQ = useQuery({
    queryKey: ['admin', 'feedbacks'],
    queryFn: () => feedbacksDb.findRecent(200),
    staleTime: 30_000,
  });

  const setStatus = useMutation({
    mutationFn: async (args: { fb: Feedback; next: FeedbackStatus }) => {
      const { fb, next } = args;
      await feedbacksDb.setStatus(fb.id, fb.status, next);
      if (profile) {
        await adminLogsDb.record(
          { uid: profile.id, handle: profile.handle },
          {
            action: 'set_feedback_status',
            targetType: 'feedback',
            targetId: fb.id,
            targetSnapshot: {
              previousStatus: fb.status,
              nextStatus: next,
              category: fb.category,
              userHandleSnap: fb.userHandleSnap,
            },
          },
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'feedbacks'] });
      qc.invalidateQueries({ queryKey: ['admin', 'logs'] });
    },
    onError: (err) => {
      const code = (err as Error).message;
      if (code === 'INVALID_TRANSITION') {
        // 通常 UI からは到達しない（FEEDBACK_STATUSES 以外の文字列が混入した時のみ）
        alert('無効な状態が指定されました。');
      } else {
        logger.error('feedback setStatus failed', { err: String(err) });
        alert('ステータス更新に失敗しました。');
      }
    },
  });

  const all = fbQ.data ?? [];
  const filtered = useMemo(() => {
    return all.filter((fb) => {
      if (categoryFilter !== 'all' && fb.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && fb.status !== statusFilter) return false;
      return true;
    });
  }, [all, categoryFilter, statusFilter]);

  const totalCount = all.length;
  const newCount = all.filter((fb) => fb.status === 'new').length;

  if (fbQ.isPending) return <Spinner />;

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <FilterBar
          filters={CATEGORY_FILTERS}
          value={categoryFilter}
          onChange={setCategoryFilter}
          groupLabel="種別"
        />
        <FilterBar
          filters={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
          groupLabel="状態"
        />
        <div className="admin-toolbar-note">
          合計 {totalCount} 件 / 未対応 {newCount} 件 ・ 状態は自由に変更可能（変更履歴は監査ログに記録）
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={
            totalCount === 0
              ? 'フィードバックはまだありません'
              : 'フィルタ条件に一致するフィードバックがありません'
          }
        />
      ) : (
        <div className="admin-rows">
          {filtered.map((fb) => (
            <FeedbackRow
              key={fb.id}
              fb={fb}
              onChangeStatus={(next) => setStatus.mutate({ fb, next })}
              pending={setStatus.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackRow({
  fb,
  onChangeStatus,
  pending,
}: {
  fb: Feedback;
  onChangeStatus: (next: FeedbackStatus) => void;
  pending: boolean;
}) {
  const reachable = reachableStatuses(fb.status);
  // 3 状態（新規 / 確認済み / 対応済み）すべて表示。現在の状態 + 遷移可能な状態
  // （現状は自分以外すべて）を選択可能とする。逆遷移も含めて運用上自由に変更可能。
  const canPick = (s: FeedbackStatus) => s === fb.status || reachable.includes(s);
  const handleChange = (next: FeedbackStatus) => {
    if (next === fb.status) return; // 同じ状態は no-op
    onChangeStatus(next);
  };
  return (
    <div className="admin-row admin-row-feedback">
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="admin-row-meta" style={{ marginBottom: 4 }}>
          <span className="badge" data-status={fb.category}>
            {FEEDBACK_CATEGORY_LABEL[fb.category]}
          </span>
          <span>{timeAgo(fb.createdAt)}</span>
          <span className="dot-sep">·</span>
          <span>@{fb.userHandleSnap || fb.createdBy.slice(0, 6)}</span>
          {fb.currentView && (
            <>
              <span className="dot-sep">·</span>
              <span className="mono">送信元: {fb.currentView}</span>
            </>
          )}
        </div>
        <div className="feedback-row-message">{fb.message}</div>
      </div>
      <select
        className="admin-role-select"
        value={fb.status}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as FeedbackStatus)}
      >
        {FEEDBACK_STATUSES.map((s) => (
          <option key={s} value={s} disabled={!canPick(s)}>
            {FEEDBACK_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
