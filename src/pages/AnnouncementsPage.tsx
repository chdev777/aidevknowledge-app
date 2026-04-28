import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CHANGELOG } from '../lib/data/changelog.js';
import {
  entryIcon,
  filterChangelog,
  formatReleaseDate,
} from '../lib/utils/changelog.js';
import { setDismissCount, setLastSeen } from '../lib/utils/announcements-storage.js';
import { useAuth } from '../lib/firebase/auth-context.js';
import { PageHeader } from '../components/shared/PageHeader.js';
import { EmptyState } from '../components/shared/EmptyState.js';

export function AnnouncementsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === '管理者';
  const visible = filterChangelog(CHANGELOG, isAdmin);

  // ページに到達したら最新を既読化（バナーが「詳しく見る」を押す前提だが、
  // Sidebar 直リンク経由でも到達できるためここでも保険的に既読化）
  useEffect(() => {
    if (visible.length === 0) return;
    setLastSeen(visible[0]!.version);
    setDismissCount(0);
  }, [visible]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="ANNOUNCEMENTS"
        title="お知らせ・改善履歴"
        subtitle="アプリの新機能・修正・セキュリティ更新の履歴。"
      />

      <div style={{ marginBottom: 16 }}>
        <Link to="/" className="btn ghost xs">← ホームに戻る</Link>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="お知らせはまだありません" />
      ) : (
        <div className="announcements-list">
          {visible.map((release) => (
            <article key={release.version} className="announcements-release">
              <header className="announcements-release-head">
                <time
                  className="mono announcements-release-date"
                  dateTime={release.date}
                >
                  {formatReleaseDate(release.date)}
                </time>
                <span className="announcements-version-badge mono">
                  v{release.version}
                </span>
              </header>
              <h2 className="announcements-release-title">{release.title}</h2>
              <ul className="announcements-entries">
                {release.entries.map((entry, i) => (
                  <li key={i} className="announcements-entry">
                    <span className="announcements-entry-icon" aria-hidden="true">
                      {entryIcon(entry.type)}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="announcements-entry-head">
                        <span className="announcements-entry-title">
                          {entry.title}
                        </span>
                        {entry.fromFeedback && (
                          <span className="announcements-entry-badge feedback">
                            ご要望対応
                          </span>
                        )}
                        {entry.audience === 'admin' && (
                          <span className="announcements-entry-badge admin">
                            管理者向け
                          </span>
                        )}
                      </div>
                      {entry.description && (
                        <p className="announcements-entry-desc">{entry.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
