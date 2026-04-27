import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { linksDb } from '../../lib/db/index.js';
import { EmptyState } from '../shared/EmptyState.js';
import { Spinner } from '../shared/Spinner.js';
import { sourceShort } from '../../lib/utils/source.js';
import { timeAgo } from '../../lib/utils/time.js';
import type { Link as LinkDoc } from '../../types/link.js';

export function RecentLinks() {
  const q = useQuery({
    queryKey: ['home', 'recentLinks'],
    queryFn: () => linksDb.findShared({ count: 4 }),
  });
  const items = q.data ?? [];

  return (
    <>
      <div className="section-title">
        最近共有されたURL <span className="section-count">({items.length})</span>
        <RouterLink to="/links" className="section-more">すべて見る →</RouterLink>
      </div>
      {q.isPending && <Spinner />}
      {q.data && items.length === 0 && (
        <EmptyState
          title="まだ共有されたURLはありません"
          description="ホームの「URLを共有」から投稿できます"
        />
      )}
      {items.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {items.map((l) => (
            <LinkRow key={l.id} link={l} />
          ))}
        </div>
      )}
    </>
  );
}

function LinkRow({ link }: { link: LinkDoc }) {
  const nav = useNavigate();
  return (
    <div className="link-row" onClick={() => nav(`/links/${link.id}`)}>
      <div className="link-thumb">
        <span className="st-label">{sourceShort(link.sourceType)}</span>
      </div>
      <div className="link-body">
        <div className="link-title">{link.title}</div>
        <div className="link-domain">{link.domain} · {link.sourceType}</div>
        <div className="link-summary">{link.summary || link.userComment}</div>
        <div className="link-meta">
          {link.tags.slice(0, 4).map((t) => (
            <span key={t} className="tag"><span className="tag-dot" />{t}</span>
          ))}
        </div>
      </div>
      <div className="link-aside">
        <span className="badge" data-status={link.status}>
          <span className="badge-dot" />
          {link.status}
        </span>
        <span className="importance" data-level={link.importance}>
          <span className="importance-bars">
            <span className="importance-bar" />
            <span className="importance-bar" />
            <span className="importance-bar" />
          </span>
          {link.importance}
        </span>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
          {timeAgo(link.createdAt)}
        </div>
      </div>
    </div>
  );
}
