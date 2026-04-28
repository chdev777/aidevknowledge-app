import { Link as RouterLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { linksDb } from '../../lib/db/index.js';
import { useUser } from '../../lib/firebase/use-user.js';
import { Avatar } from '../../components/shell/Avatar.js';
import { CommentList } from '../../components/comments/CommentList.js';
import { CommentComposer } from '../../components/comments/CommentComposer.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { Icon } from '../../components/shared/Icon.js';
import { FavoriteButton } from '../../components/shared/FavoriteButton.js';
import { ForbiddenPage } from '../ForbiddenPage.js';
import { extractYoutubeVideoId, isSafeHref } from '../../lib/utils/url.js';
import { timeAgo } from '../../lib/utils/time.js';
import { YouTubeEmbed } from '../../components/shared/YouTubeEmbed.js';

export function LinkDetailPage() {
  const { id = '' } = useParams();
  const q = useQuery({
    queryKey: ['link', id],
    queryFn: () => linksDb.findById(id),
    enabled: !!id,
  });

  if (q.isPending) {
    return (
      <div className="page">
        <Spinner />
      </div>
    );
  }
  if (q.error || !q.data) return <ForbiddenPage />;

  const l = q.data;

  return (
    <div className="page">
      <RouterLink to="/links" className="btn ghost sm" style={{ marginBottom: 16 }}>
        ← URL共有に戻る
      </RouterLink>

      <div className="detail-layout">
        <div>
          <div className="detail-eyebrow">{l.sourceType} · {l.domain}</div>
          <h1 className="detail-title">{l.title}</h1>
          <DetailMeta uid={l.createdBy} createdAt={l.createdAt}>
            <span className="badge" data-status={l.status}>
              <span className="badge-dot" />
              {l.status}
            </span>
            <span className="importance" data-level={l.importance}>
              <span className="importance-bars">
                <span className="importance-bar" />
                <span className="importance-bar" />
                <span className="importance-bar" />
              </span>
              {l.importance}
            </span>
          </DetailMeta>

          {isSafeHref(l.url) && (
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ marginBottom: 22 }}
            >
              <Icon name="link" size={13} />
              {l.url}
            </a>
          )}

          {(() => {
            const videoId = extractYoutubeVideoId(l.url);
            if (videoId) {
              return <YouTubeEmbed videoId={videoId} thumbnailUrl={l.thumbnailUrl} />;
            }
            if (l.thumbnailUrl) {
              return (
                <div style={{ marginBottom: 26 }}>
                  <img
                    src={l.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    style={{
                      width: '100%',
                      maxHeight: 360,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid var(--line)',
                      background: 'var(--bg-2)',
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              );
            }
            return null;
          })()}

          {l.summary && (
            <div style={{ marginBottom: 26 }}>
              <div className="section-title">概要</div>
              <div className="prose">{l.summary}</div>
            </div>
          )}

          {l.userComment && (
            <div style={{ marginBottom: 26 }}>
              <div className="section-title">共有コメント</div>
              <div className="card" style={{ padding: 18 }}>
                <div className="prose" style={{ margin: 0 }}>{l.userComment}</div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 26 }}>
            <div className="section-title">タグ</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {l.tags.map((t) => (
                <span key={t} className="tag"><span className="tag-dot" />{t}</span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 26 }}>
            <div className="section-title">コメント</div>
            <CommentComposer
              targetType="link"
              targetId={l.id}
              targetVisibility={l.visibility}
            />
            <CommentList targetType="link" targetId={l.id} parentVisibility={l.visibility} />
          </div>
        </div>

        <aside className="detail-aside">
          <DetailAsideAuthor uid={l.createdBy} />
          <AsideRow label="ステータス">
            <span className="badge" data-status={l.status}>
              <span className="badge-dot" />
              {l.status}
            </span>
          </AsideRow>
          <AsideRow label="重要度">
            <span className="importance" data-level={l.importance}>
              <span className="importance-bars">
                <span className="importance-bar" />
                <span className="importance-bar" />
                <span className="importance-bar" />
              </span>
              {l.importance}
            </span>
          </AsideRow>
          <AsideRow label="作成日時">
            <span className="mono" style={{ fontSize: 12 }}>
              {l.createdAt.toLocaleString('ja-JP')}
            </span>
          </AsideRow>
          <div className="aside-section">
            <FavoriteButton targetType="link" targetId={l.id} fullWidth />
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailMeta({
  uid,
  createdAt,
  children,
}: {
  uid: string;
  createdAt: Date;
  children?: React.ReactNode;
}) {
  const author = useUser(uid);
  return (
    <div className="detail-meta">
      {author.data && <Avatar user={author.data} size="sm" />}
      {author.data && <span>{author.data.name}</span>}
      <span className="dot-sep">·</span>
      <span>{timeAgo(createdAt)}</span>
      {children && <span className="dot-sep">·</span>}
      {children}
    </div>
  );
}

function DetailAsideAuthor({ uid }: { uid: string }) {
  const author = useUser(uid);
  return (
    <AsideRow label="共有者">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {author.data && <Avatar user={author.data} size="sm" />}
        {author.data?.name ?? '—'}
      </span>
    </AsideRow>
  );
}

function AsideRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="aside-section">
      <div className="aside-label">{label}</div>
      <div className="aside-value">{children}</div>
    </div>
  );
}
