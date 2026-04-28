import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHANGELOG } from '../../lib/data/changelog.js';
import {
  filterChangelog,
  getUnreadRelease,
  hasFromFeedback,
  markAsRead,
  recordDismiss,
} from '../../lib/utils/changelog.js';
import {
  getDismissCount,
  getLastSeen,
  setDismissCount,
  setLastSeen,
} from '../../lib/utils/announcements-storage.js';
import { useAuth } from '../../lib/firebase/auth-context.js';

/**
 * Topbar 直下に置く未読リリース告知バナー。
 * - ×3 回 or 「詳しく見る」で完全既読化
 * - 「詳しく見る」で /announcements に遷移
 * - localStorage 不可環境でも例外を投げない（getter/setter で握り潰し）
 */
export function AnnouncementsBanner() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === '管理者';
  const nav = useNavigate();
  const [dismissedThisSession, setDismissedThisSession] = useState(false);
  // localStorage の値はバナー表示判定用に初期 mount 時のみ読み取る
  // （他タブ更新は無視。多端末同期は仕様外）
  const [lastSeen, setLastSeenState] = useState<string | null>(() => getLastSeen());
  const [dismissCount, setDismissCountState] = useState<number>(() => getDismissCount());

  if (!profile || dismissedThisSession) return null;
  if (dismissCount >= 3) return null;

  const visible = filterChangelog(CHANGELOG, isAdmin);
  const unread = getUnreadRelease(visible, lastSeen);
  if (!unread) return null;

  const fromFeedback = hasFromFeedback(unread);

  const onDismiss = () => {
    const { newDismissCount, newLastSeen } = recordDismiss(dismissCount, unread.version);
    setDismissCount(newDismissCount);
    setDismissCountState(newDismissCount);
    if (newLastSeen) {
      setLastSeen(newLastSeen);
      setLastSeenState(newLastSeen);
    }
    setDismissedThisSession(true);
  };

  const onSeeMore = () => {
    const { newLastSeen, newDismissCount } = markAsRead(unread.version);
    setLastSeen(newLastSeen);
    setLastSeenState(newLastSeen);
    setDismissCount(newDismissCount);
    setDismissCountState(newDismissCount);
    setDismissedThisSession(true);
    nav('/announcements');
  };

  return (
    <div
      className="announcements-banner"
      role="alert"
      data-from-feedback={fromFeedback ? 'true' : 'false'}
    >
      <span className="announcements-banner-icon" aria-hidden="true">
        {fromFeedback ? '💬' : '✨'}
      </span>
      <div className="announcements-banner-body">
        {fromFeedback && (
          <span className="announcements-banner-badge">ご要望にお応えしました</span>
        )}
        <strong className="announcements-banner-title">{unread.title}</strong>
        <span className="announcements-banner-version mono">v{unread.version}</span>
      </div>
      <button
        type="button"
        className="btn xs btn-primary"
        onClick={onSeeMore}
      >
        詳しく見る
      </button>
      <button
        type="button"
        className="announcements-banner-close"
        onClick={onDismiss}
        aria-label="閉じる"
      >
        ×
      </button>
    </div>
  );
}
