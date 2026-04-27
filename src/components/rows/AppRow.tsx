import { useNavigate } from 'react-router-dom';
import { Icon } from '../shared/Icon.js';
import type { AiApp } from '../../types/app.js';

export function AppRow({ app }: { app: AiApp }) {
  const nav = useNavigate();
  const stats = app.stats ?? { views: 0, comments: 0, likes: 0 };

  return (
    <div
      className="row"
      style={{ gridTemplateColumns: 'auto 1fr auto', gap: 18 }}
      onClick={() => nav(`/apps/${app.id}`)}
    >
      <div className="app-icon" style={{ width: 42, height: 42, fontSize: 16 }}>
        {app.name.slice(0, 1)}
      </div>
      <div>
        <div className="row-title">{app.name}</div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--ink-3)',
            margin: '2px 0 8px',
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {app.summary}
        </div>
        <div className="row-meta">
          <span className="mono">{app.aiModel}</span>
          <span className="dot-sep">·</span>
          <span className="mono">{app.usageScope}</span>
          <span className="dot-sep">·</span>
          <span>
            <Icon name="message" size={10} style={{ verticalAlign: 'middle' }} /> {stats.comments}
          </span>
          <span>
            <Icon name="eye" size={10} style={{ verticalAlign: 'middle' }} /> {stats.views}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span className="badge" data-status={app.status}>
          <span className="badge-dot" />
          {app.status}
        </span>
      </div>
    </div>
  );
}
