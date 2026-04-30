export const FEEDBACK_CATEGORIES = ['bug', 'feature', 'other'] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  bug: 'バグ報告',
  feature: '機能要望',
  other: 'その他',
};

export const FEEDBACK_STATUSES = ['new', 'acknowledged', 'resolved'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  new: '新規',
  acknowledged: '確認済み',
  resolved: '対応済み',
};

/**
 * ある status から到達可能な次の status の集合（自分以外の全 status）。
 *
 * MVP 当初は new → acknowledged → resolved の一方向のみだったが、
 * 「確認済み・対応済みからでも新規に戻したい」という運用要望で双方向に変更。
 * 状態変更はすべて admin_logs に記録されるので逆遷移も監査可能。
 */
export function reachableStatuses(current: FeedbackStatus): FeedbackStatus[] {
  return FEEDBACK_STATUSES.filter((s) => s !== current);
}

export interface Feedback {
  id: string;
  createdBy: string;
  /** 投稿時のハンドル名スナップショット（後で改名されても表示用に固定） */
  userHandleSnap: string;
  /** 投稿時の表示名スナップショット */
  userNameSnap: string;
  category: FeedbackCategory;
  message: string;
  /** 送信元画面のパス（例: '/links'） */
  currentView: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
}
