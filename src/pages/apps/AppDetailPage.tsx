import { Link as RouterLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appsDb } from '../../lib/db/index.js';
import { useUser } from '../../lib/firebase/use-user.js';
import { Avatar } from '../../components/shell/Avatar.js';
import { Markdown } from '../../components/shared/Markdown.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { Icon } from '../../components/shared/Icon.js';
import { CommentList } from '../../components/comments/CommentList.js';
import { CommentComposer } from '../../components/comments/CommentComposer.js';
import { FavoriteButton } from '../../components/shared/FavoriteButton.js';
import { ForbiddenPage } from '../ForbiddenPage.js';
import { isSafeHref } from '../../lib/utils/url.js';

export function AppDetailPage() {
  const { id = '' } = useParams();
  const q = useQuery({
    queryKey: ['app', id],
    queryFn: () => appsDb.findById(id),
    enabled: !!id,
  });
  const author = useUser(q.data?.createdBy);

  if (q.isPending) {
    return (
      <div className="page">
        <Spinner />
      </div>
    );
  }
  if (q.error || !q.data) return <ForbiddenPage />;
  const a = q.data;
  const stats = a.stats ?? { views: 0, comments: 0, likes: 0 };

  return (
    <div className="page">
      <RouterLink to="/apps" className="btn ghost sm" style={{ marginBottom: 16 }}>
        ← 作成アプリ一覧に戻る
      </RouterLink>

      <div className="app-hero">
        <div className="app-icon">{a.name.slice(0, 1)}</div>
        <div>
          <div className="detail-eyebrow">APPLICATION</div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.015em',
              marginTop: 2,
            }}
          >
            {a.name}
          </div>
          {isSafeHref(a.url) && (
            <a className="app-url" href={a.url} target="_blank" rel="noopener noreferrer">
              <Icon name="link" size={12} /> {a.url}
            </a>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <span className="badge" data-status={a.status}>
            <span className="badge-dot" />
            {a.status}
          </span>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-3)',
              display: 'flex',
              gap: 10,
            }}
          >
            <span>
              <Icon name="eye" size={11} style={{ verticalAlign: '-2px' }} /> {stats.views}
            </span>
            <span>
              <Icon name="message" size={11} style={{ verticalAlign: '-2px' }} /> {stats.comments}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        <div>
          <div style={{ marginBottom: 24 }}>
            <div className="section-title">概要</div>
            <div className="prose"><Markdown>{a.summary}</Markdown></div>
          </div>

          {a.purpose && (
            <div style={{ marginBottom: 24 }}>
              <div className="section-title">開発目的</div>
              <div className="prose"><Markdown>{a.purpose}</Markdown></div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div className="section-title">仕様</div>
            <div className="app-specs">
              <div className="app-spec">
                <div className="spec-label">利用AI</div>
                <div className="spec-value mono">{a.aiModel || '—'}</div>
              </div>
              <div className="app-spec">
                <div className="spec-label">ステータス</div>
                <div className="spec-value">
                  <span className="badge" data-status={a.status}>
                    <span className="badge-dot" />
                    {a.status}
                  </span>
                </div>
              </div>
              <div className="app-spec">
                <div className="spec-label">使用技術</div>
                <div className="spec-value">
                  {a.technologies.length > 0 ? a.technologies.join(' · ') : '—'}
                </div>
              </div>
              <div className="app-spec">
                <div className="spec-label">利用範囲</div>
                <div className="spec-value">{a.usageScope}</div>
              </div>
            </div>
            {a.caution && (
              <div className="caution">
                <div className="caution-label">⚠ 注意事項</div>
                {a.caution}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <div className="section-title">タグ</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {a.tags.map((t) => (
                <span key={t} className="tag"><span className="tag-dot" />{t}</span>
              ))}
            </div>
          </div>

          <div className="section-title">コメント・レビュー</div>
          <CommentComposer
            targetType="app"
            targetId={a.id}
            targetVisibility={a.visibility}
          />
          <CommentList targetType="app" targetId={a.id} />
        </div>

        <aside className="detail-aside">
          <div className="aside-section">
            <div className="aside-label">作成者</div>
            <div className="aside-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {author.data && <Avatar user={author.data} size="sm" />}
              {author.data?.name ?? '—'}
            </div>
          </div>
          <div className="aside-section">
            <div className="aside-label">タグ</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {a.tags.map((t) => (
                <span key={t} className="tag"><span className="tag-dot" />{t}</span>
              ))}
            </div>
          </div>
          <div className="aside-section">
            <div className="aside-label">作成日時</div>
            <div className="aside-value mono" style={{ fontSize: 12 }}>
              {a.createdAt.toLocaleString('ja-JP')}
            </div>
          </div>
          {isSafeHref(a.url) && (
            <div className="aside-section">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn primary sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Icon name="link" size={12} />
                アプリを開く
              </a>
            </div>
          )}
          <div className="aside-section">
            <FavoriteButton targetType="app" targetId={a.id} fullWidth />
          </div>
        </aside>
      </div>
    </div>
  );
}
