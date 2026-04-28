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

/** 一方向遷移：ある status から到達可能な次の status の集合 */
export function reachableStatuses(current: FeedbackStatus): FeedbackStatus[] {
  switch (current) {
    case 'new':
      return ['acknowledged', 'resolved'];
    case 'acknowledged':
      return ['resolved'];
    case 'resolved':
      return [];
  }
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
