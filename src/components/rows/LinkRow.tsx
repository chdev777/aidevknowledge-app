import { useNavigate } from 'react-router-dom';
import { Avatar } from '../shell/Avatar.js';
import { useUser } from '../../lib/firebase/use-user.js';
import { SourceIcon, sourceKey } from '../shared/SourceIcon.js';
import { timeAgo } from '../../lib/utils/time.js';
import type { Link as LinkDoc } from '../../types/link.js';

export function LinkRow({ link }: { link: LinkDoc }) {
  const nav = useNavigate();
  const author = useUser(link.createdBy);

  return (
    <div className="link-row" onClick={() => nav(`/links/${link.id}`)}>
      <div className="link-thumb" data-source={sourceKey(link.sourceType, link.domain)}>
        <SourceIcon sourceType={link.sourceType} domain={link.domain} />
      </div>
      <div className="link-body">
        <div className="link-title">{link.title}</div>
        <div className="link-domain">{link.domain} · {link.sourceType}</div>
        <div className="link-summary">{link.summary || link.userComment}</div>
        <div className="link-meta">
          {link.tags.slice(0, 4).map((t) => (
            <span key={t} className="tag">
              <span className="tag-dot" />
              {t}
            </span>
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--ink-3)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {author.data && <Avatar user={author.data} size="sm" />}
          {timeAgo(link.createdAt)}
        </div>
      </div>
    </div>
  );
}
